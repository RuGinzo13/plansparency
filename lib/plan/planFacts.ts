// ── Shared plan facts ────────────────────────────────────────────────────────
// What kinds of employer money a plan has, how the match reads in plain words,
// and how vesting applies. Used by the stock answers and by the plan screens, so
// the two never disagree.

import type { PlanData } from './plandata';

export const has = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;

// Percent of pay where each safe harbor match stops growing (same numbers the calculator screen uses).
export const FULL_MATCH_PCT: Record<string, number> = { basic_match: 5, enhanced_match: 4 };
export const STANDARD_FORMULA: Record<string, string> = {
  basic_match: '100% of the first 3% of your pay you save, plus 50% of the next 2%',
  nonelective: '3% of your pay',
};

export function tierText(planData: PlanData): string {
  return planData.matchTiers
    .map((t) => `${t.pct}% of what you save, up to ${t.upTo}% of your pay`)
    .join(', then ');
}

// What each kind of employer money looks like for this plan.
export function facts(pd: PlanData) {
  const type = pd.safeHarbor?.type ?? 'none';
  const tiers = Array.isArray(pd.matchTiers) ? pd.matchTiers : [];
  const shMatch = type === 'basic_match' || type === 'enhanced_match' || type === 'qaca';
  const nonelective = type === 'nonelective';
  const safeHarbor = shMatch || nonelective;
  const disc = tiers.length > 0 && pd.noMatch !== true;
  const profit = pd.profitSharing?.available === true;
  return { type, tiers, shMatch, nonelective, safeHarbor, disc, profit };
}


// Shared by answers 2 and 7: needs the vesting schedule when vesting applies.
export function vestingParts(pd: PlanData): { f: ReturnType<typeof facts>; schedule: string | null; label: string } | null {
  const f = facts(pd);
  if (f.type === 'qaca') return null;
  if (typeof pd.safeHarbor?.type !== 'string') return null;
  const needsSchedule = f.disc || f.profit;
  if (needsSchedule && !has(pd.vestingSchedule)) return null;
  const label = f.disc && f.profit ? 'Your match and profit sharing' : f.profit ? 'Your profit sharing money' : 'Your match';
  return { f, schedule: needsSchedule ? (pd.vestingSchedule as string).trim() : null, label };
}

// Reads a vesting schedule ONLY when the text spells it out. byYear[n] is the
// percent yours after n full years of service, from year 0 up to the first 100.
// Anything unclear returns null: a schedule is never guessed.
export type ParsedVesting = { kind: 'immediate' } | { kind: 'schedule'; byYear: number[] };

export function parseVesting(text: string | null | undefined): ParsedVesting | null {
  if (!has(text)) return null;
  const t = text.trim();

  // Immediate: says 100% and "immediate(ly)" / "right away", and names no years.
  if (/100\s*%/.test(t) && /(immediate|right away)/i.test(t) && !/\d+[- ]?years?/i.test(t)) return { kind: 'immediate' };

  const cliffFrom = (years: number): ParsedVesting | null => {
    if (!Number.isInteger(years) || years < 1 || years > 10) return null;
    const byYear = Array.from({ length: years + 1 }, (_, i) => (i === years ? 100 : 0));
    return { kind: 'schedule', byYear };
  };

  // Cliff: "3-year cliff" or "100% after 3 years" with no other percentages.
  const percents = t.match(/\d+\s*%/g) ?? [];
  const cliff = t.match(/(\d+)[- ]year cliff/i);
  if (cliff && percents.length === 0) return cliffFrom(Number(cliff[1]));
  const cliff100 = t.match(/100%\s*(?:after|at)\s*(\d+)\s*years?/i);
  if (cliff100 && percents.length === 1) return cliffFrom(Number(cliff100[1]));

  // Graded: only explicit pairs, "20% after 2 years" or "2 years: 20%".
  const pairs: [number, number][] = [];
  const re1 = /(\d+)\s*%\s*(?:after|at)?\s*(\d+)\s*(?:years?)?/gi;
  const re2 = /(\d+)\s*years?\s*[:=-]?\s*(\d+)\s*%/gi;
  const useRe2 = re2.test(t);
  re2.lastIndex = 0;
  const re = useRe2 ? re2 : re1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    pairs.push(useRe2 ? [Number(m[1]), Number(m[2])] : [Number(m[2]), Number(m[1])]); // [year, percent]
  }
  if (pairs.length < 2) return null;
  const maxYear = Math.max(...pairs.map((p) => p[0]));
  if (maxYear > 10 || pairs.some((p) => p[0] < 1 || p[1] < 0 || p[1] > 100)) return null;
  const byYear: number[] = Array(maxYear + 1).fill(0);
  const seen = new Set<number>();
  for (const [y, pct] of pairs) {
    if (seen.has(y)) return null;
    seen.add(y);
    byYear[y] = pct;
  }
  // Fill years the text skipped (between listed ones) with the previous value, but only
  // when the listed values are in order and finish at 100.
  const listed = [...pairs].sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < listed.length; i++) if (listed[i][1] < listed[i - 1][1]) return null;
  if (listed[listed.length - 1][1] !== 100) return null;
  let prev = 0;
  for (let y = 0; y <= maxYear; y++) {
    if (seen.has(y)) prev = byYear[y]; else byYear[y] = prev;
  }
  return { kind: 'schedule', byYear };
}
