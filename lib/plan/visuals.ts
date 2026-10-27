// ── Plan-data builders for the pictures (pure, no React) ─────────────────────
// Every function returns null when the plan data it needs isn't there, so a
// picture is never drawn with made-up numbers. The words that go with each
// picture ("In words") are built here too, from the same numbers.

import type { PlanData } from './plandata';
import { has, facts, vestingParts, parseVesting } from './planFacts';
import { safeHarborAmount } from './calc';
import { IRS_LIMITS } from './irs-limits';
import { getLimitYear } from './irs';

type Lang = 'en' | 'es';
const pick = (lang: Lang) => (en: string, es: string) => (lang === 'es' ? es : en);

export const EXAMPLE_PAY = 50000;

// ── Employer money ──────────────────────────────────────────────────────────

export interface EmployerTier {
  rate: number; // percent of what you save that the employer matches
  from: number; // percent of pay where this tier starts
  to: number; // percent of pay where this tier stops
}

// The match steps of the plan's main match (safe harbor match first, else the discretionary tiers).
// A nonelective safe harbor has no steps: flatPct is the percent of pay added whatever you save.
export function employerTiers(pd: PlanData): { tiers: EmployerTier[]; flatPct: number } | null {
  if (!pd || typeof pd !== 'object') return null;
  const f = facts(pd);
  const fixed: Record<string, EmployerTier[]> = {
    basic_match: [{ rate: 100, from: 0, to: 3 }, { rate: 50, from: 3, to: 5 }],
    enhanced_match: [{ rate: 100, from: 0, to: 4 }],
    qaca: [{ rate: 100, from: 0, to: 1 }, { rate: 50, from: 1, to: 6 }],
  };
  if (f.shMatch && fixed[f.type]) return { tiers: fixed[f.type], flatPct: f.nonelective ? 3 : 0 };
  const tiers: EmployerTier[] = [];
  if (f.disc) {
    let at = 0;
    for (const t of f.tiers) {
      if (!Number.isFinite(t.pct) || !Number.isFinite(t.upTo) || t.upTo <= 0 || t.pct < 0) continue;
      tiers.push({ rate: t.pct, from: at, to: at + t.upTo });
      at += t.upTo;
    }
  }
  if (f.nonelective) return { tiers, flatPct: 3 };
  return tiers.length > 0 ? { tiers, flatPct: 0 } : null;
}

function discretionaryAt(pd: PlanData, pay: number, pct: number): number {
  const f = facts(pd);
  if (!f.disc) return 0;
  let at = 0;
  let sum = 0;
  for (const t of f.tiers) {
    if (!Number.isFinite(t.pct) || !Number.isFinite(t.upTo) || t.upTo <= 0 || t.pct < 0) continue;
    const inTier = Math.max(0, Math.min(pct - at, t.upTo));
    sum += (pay * inTier / 100) * (t.pct / 100);
    at += t.upTo;
  }
  return sum;
}

function employerOnly(pd: PlanData, pay: number, pct: number): number {
  const f = facts(pd);
  const sh = f.safeHarbor ? safeHarborAmount(f.type, pay, pct) : 0;
  return sh + discretionaryAt(pd, pay, pct);
}

export interface EmployerMoney {
  you: number;
  employer: number;
  fullEmployer: number;
  pctForFull: number;
}

// Yearly employer money at `pct`% of pay. Safe harbor uses the calculator's own safeHarborAmount;
// the extra match adds up the plan's tiers. Profit sharing is left out (it isn't tied to what you save).
export function employerMoneyAt(pd: PlanData | null, pct: number, pay: number = EXAMPLE_PAY): EmployerMoney | null {
  if (!pd || typeof pd !== 'object' || !Number.isFinite(pct) || !Number.isFinite(pay) || pay <= 0) return null;
  const f = facts(pd);
  if (!f.safeHarbor && !f.disc) return null;
  const fullEmployer = employerOnly(pd, pay, 100);
  if (!(fullEmployer > 0)) return null;
  let pctForFull = 100;
  for (let p = 0; p <= 100; p++) {
    if (employerOnly(pd, pay, p) >= fullEmployer - 1e-6) { pctForFull = p; break; }
  }
  const p = Math.max(0, pct);
  const employer = Math.min(employerOnly(pd, pay, p), fullEmployer);
  return { you: (pay * p) / 100, employer, fullEmployer, pctForFull };
}

// The match in plain words, one phrase per step ("$1 for every $1 you save, up to 3% of your pay").
export function matchPhrases(pd: PlanData | null, lang: Lang = 'en'): { phrases: string[]; flat: string | null } | null {
  const t = pd ? employerTiers(pd) : null;
  if (!t) return null;
  const L = pick(lang);
  const money = (rate: number) => (rate % 100 === 0 ? `$${rate / 100}` : rate < 100 ? `${Math.round(rate)}¢` : `$${(rate / 100).toFixed(2)}`);
  const phrases = t.tiers.map((x, i) => {
    const w = Math.round((x.to - x.from) * 100) / 100;
    return i === 0
      ? L(`${money(x.rate)} for every $1 you save, up to ${w}% of your pay`, `${money(x.rate)} por cada $1 que ahorras, hasta ${w}% de tu salario`)
      : L(`${money(x.rate)} for every $1 you save, on the next ${w}%`, `${money(x.rate)} por cada $1 que ahorras, en el siguiente ${w}%`);
  });
  const flat = t.flatPct > 0
    ? L(`${t.flatPct}% of your pay, even if you save nothing`, `${t.flatPct}% de tu salario, aunque no ahorres nada`)
    : null;
  return { phrases, flat };
}

// ── Vesting ─────────────────────────────────────────────────────────────────

export interface VestingSource { label: string; byYear: number[] }
export interface VestingSteps {
  immediate: boolean;
  maxYears: number;
  sources: VestingSource[];
}

// byYear[n] = percent yours after n full years, for every year 0..maxYears (never goes down).
export function vestingSteps(pd: PlanData | null, lang: Lang = 'en'): VestingSteps | null {
  if (!pd || typeof pd !== 'object') return null;
  const L = pick(lang);
  const f = facts(pd);
  if (!f.safeHarbor && !f.disc && !f.profit) return null;
  const raw: { label: string; byYear: number[] }[] = [];
  if (f.safeHarbor && pd.safeHarbor.vestingImmediate !== false) {
    raw.push({ label: L('Safe harbor money', 'Dinero safe harbor'), byYear: [100] });
  }
  const other = f.disc || f.profit;
  if (other) {
    const vp = vestingParts(pd);
    if (!vp) return null;
    const parsed = parseVesting(pd.vestingSchedule);
    if (!parsed) return null;
    const label = f.disc && f.profit ? L('Your match and profit sharing', 'Tu match y profit sharing') : f.profit ? L('Your profit sharing money', 'Tu dinero de profit sharing') : L('Your match', 'Tu match');
    raw.push({ label, byYear: parsed.kind === 'immediate' ? [100] : parsed.byYear });
  }
  if (raw.length === 0) return null;
  const maxYears = Math.max(1, ...raw.map((s) => s.byYear.length - 1));
  const sources = raw.map((s) => {
    const byYear: number[] = [];
    let prev = 0;
    for (let i = 0; i <= maxYears; i++) {
      const v = i < s.byYear.length ? s.byYear[i] : 100;
      prev = Math.max(prev, Math.min(100, Math.max(0, v)));
      byYear.push(prev);
    }
    return { label: s.label, byYear };
  });
  const immediate = sources.every((s) => s.byYear[0] === 100);
  return { immediate, maxYears, sources };
}

// The plan's own schedule in one plain sentence (the source with a real schedule).
export function vestingWords(v: VestingSteps, lang: Lang = 'en'): string {
  const L = pick(lang);
  const src = v.sources.find((s) => s.byYear[0] < 100);
  if (!src) return L('All of it is yours right away.', 'Todo es tuyo de inmediato.');
  const by = src.byYear;
  const full = by.findIndex((x) => x === 100);
  const first = by.findIndex((x) => x > 0);
  if (first === full) {
    return L(
      `You own none of it until year ${full}, then all of it. If you leave earlier, you keep none of it.`,
      `No eres dueño de nada hasta el año ${full}, y entonces de todo. Si te vas antes, no te quedas con nada.`
    );
  }
  const steps: number[] = [];
  for (let i = first; i <= full; i++) steps.push(by[i] - (i > 0 ? by[i - 1] : 0));
  const even = steps.every((s) => s === steps[0]);
  const tail = L(
    `After ${full} years you own all of it. If you leave earlier, you keep only the part you own.`,
    `Después de ${full} años eres dueño de todo. Si te vas antes, te quedas solo con la parte que ya es tuya.`
  );
  if (even) {
    return L(`You own ${steps[0]}% more each year from year ${first}. `, `Cada año eres dueño de ${steps[0]}% más desde el año ${first}. `) + tail;
  }
  const parts = by.slice(0, full + 1).map((x, i) => L(`${x}% after ${i} ${i === 1 ? 'year' : 'years'}`, `${x}% después de ${i} ${i === 1 ? 'año' : 'años'}`));
  return L('Your plan: ', 'Tu plan: ') + parts.join(', ') + '. ' + tail;
}

// ── Joining ─────────────────────────────────────────────────────────────────

export interface JoinStep { title: string; detail: string; kind: 'start' | 'join' | 'entry' | 'employer' }

export function joinSteps(pd: PlanData | null, lang: Lang = 'en'): JoinStep[] | null {
  if (!pd || typeof pd !== 'object') return null;
  const L = pick(lang);
  const ce = pd.contribEligibility;
  if (!ce || !has(ce.requirement)) return null;
  const f = facts(pd);
  const steps: JoinStep[] = [
    { title: L('You’re hired', 'Te contratan'), detail: L('Day 1', 'Día 1'), kind: 'start' },
    { title: L('You can join', 'Puedes unirte'), detail: ce.requirement.trim(), kind: 'join' },
  ];
  if (has(ce.entryDates)) steps.push({ title: L('Your entry date', 'Tu fecha de entrada'), detail: ce.entryDates.trim(), kind: 'entry' });
  const me = pd.matchEligibility;
  if (f.safeHarbor || f.disc) {
    if (me?.immediateMatch === true) steps.push({ title: L('Employer money starts', 'Empieza el dinero del empleador'), detail: L('Same time as you join', 'Al mismo tiempo que te unes'), kind: 'employer' });
    else if (has(me?.requirement)) steps.push({ title: L('Employer money starts', 'Empieza el dinero del empleador'), detail: me!.requirement!.trim(), kind: 'employer' });
  }
  return steps.slice(0, 4);
}

// ── Limits ──────────────────────────────────────────────────────────────────

export interface LimitRow {
  label: string;
  base: number;
  extra: number;
  extraKind: 'catchUp50' | 'catchUp6063' | null;
  total: number;
}
export interface LimitBars { year: number; rows: LimitRow[]; catchUpNotOffered: boolean; catchUp50: number; catchUp6063: number }

export function limitBars(pd: PlanData | null, year: number = getLimitYear().year, lang: Lang = 'en'): LimitBars | null {
  if (!pd || typeof pd !== 'object' || typeof pd.planAllowsCatchUp !== 'boolean') return null;
  const L = pick(lang);
  const y = IRS_LIMITS[year] ? year : Math.max(...Object.keys(IRS_LIMITS).map(Number));
  const lim = IRS_LIMITS[y];
  const rows: LimitRow[] = [{ label: L('Under 50', 'Menos de 50'), base: lim.deferral, extra: 0, extraKind: null, total: lim.deferral }];
  if (pd.planAllowsCatchUp) {
    rows.push({ label: L('50 to 59 and 64+', '50 a 59 y 64+'), base: lim.deferral, extra: lim.catchUp50, extraKind: 'catchUp50', total: lim.deferral + lim.catchUp50 });
    rows.push({ label: L('60 to 63', '60 a 63'), base: lim.deferral, extra: lim.catchUp6063, extraKind: 'catchUp6063', total: lim.deferral + lim.catchUp6063 });
  }
  return { year: y, rows, catchUpNotOffered: !pd.planAllowsCatchUp, catchUp50: lim.catchUp50, catchUp6063: lim.catchUp6063 };
}

// ── Roth ────────────────────────────────────────────────────────────────────

export function rothRows(pd: PlanData | null): { preTax: boolean; roth: boolean } | null {
  if (!pd || typeof pd !== 'object') return null;
  // Same rule as the Roth answer: both facts must be known before anything is drawn.
  const rothRaw = pd.hasRoth ?? pd.rothAvailable;
  if (typeof pd.hasPreTax !== 'boolean' || typeof rothRaw !== 'boolean') return null;
  const preTax = pd.hasPreTax !== false;
  const roth = rothRaw === true;
  if (!preTax && !roth) return null;
  return { preTax, roth };
}
