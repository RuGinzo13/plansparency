// ── Stock answers for the 8 common questions (DRAFT wording) ─────────────────
// Built exactly as written in PHASE PROMPTS/PHASE-10-stock-answers-wording.md.
// An answer is built from the plan's reviewed details only. If anything the
// answer REQUIRES is missing, it returns null and the tap goes to the AI.
// Definitions come from lib/glossary.ts and IRS numbers from lib/plan/irs-limits.ts,
// so nothing here is typed in by hand twice.

import type { PlanData } from '../plan/plandata';
import { getTerm } from '../glossary';
import { IRS_LIMITS } from '../plan/irs-limits';
import { getLimitYear } from '../plan/irs';
import { safeHarborAmount } from '../plan/calc';
import { fmtRounded } from '../format';

export type StockId = 'match' | 'vesting' | 'elig' | 'roth' | 'loans' | 'hardship' | 'leave' | 'limit';

export interface StockAnswer {
  text: string;
  link?: 'calculator';
}

export const STOCK_QUESTIONS: { id: StockId; label: string }[] = [
  { id: 'match', label: 'How does my employer match work?' },
  { id: 'vesting', label: 'When is the match mine to keep?' },
  { id: 'elig', label: 'When can I start saving?' },
  { id: 'roth', label: 'Roth or Traditional: what\'s the difference?' },
  { id: 'loans', label: 'Can I borrow from my 401(k)?' },
  { id: 'hardship', label: 'Can I take money out for a hardship?' },
  { id: 'leave', label: 'What happens to my 401(k) if I leave my job?' },
  { id: 'limit', label: `How much can I save in ${getLimitYear().year}?` },
];

const has = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;
const para = (lead: string, rest: string) => `**${lead}** ${rest}`.trim();
const join = (paras: string[]) => paras.join('\n\n');

// Percent of pay where each safe harbor match stops growing (same numbers the calculator screen uses).
const FULL_MATCH_PCT: Record<string, number> = { basic_match: 5, enhanced_match: 4 };
const STANDARD_FORMULA: Record<string, string> = {
  basic_match: '100% of the first 3% of your pay you save, plus 50% of the next 2%',
  nonelective: '3% of your pay',
};
const EXAMPLE_SALARY = 50000;

function tierText(planData: PlanData): string {
  return planData.matchTiers
    .map((t) => `${t.pct}% of what you save, up to ${t.upTo}% of your pay`)
    .join(', then ');
}

// What each kind of employer money looks like for this plan.
function facts(pd: PlanData) {
  const type = pd.safeHarbor?.type ?? 'none';
  const tiers = Array.isArray(pd.matchTiers) ? pd.matchTiers : [];
  const shMatch = type === 'basic_match' || type === 'enhanced_match' || type === 'qaca';
  const nonelective = type === 'nonelective';
  const safeHarbor = shMatch || nonelective;
  const disc = tiers.length > 0 && pd.noMatch !== true;
  const profit = pd.profitSharing?.available === true;
  return { type, tiers, shMatch, nonelective, safeHarbor, disc, profit };
}

// ── 1. Match ──
function matchAnswer(pd: PlanData): StockAnswer | null {
  const f = facts(pd);
  if (f.type === 'qaca') return null;
  if (typeof pd.safeHarbor?.type !== 'string') return null;
  if (!(typeof pd.noMatch === 'boolean' || f.tiers.length > 0)) return null;
  // "No match" says nothing useful if the data contradicts itself.
  if (!f.safeHarbor && !f.disc && pd.noMatch !== true) return null;

  const out: string[] = [];
  const formula = has(pd.safeHarbor.formula) ? pd.safeHarbor.formula.trim() : STANDARD_FORMULA[f.type];

  if (f.shMatch) {
    if (!has(formula)) return null; // enhanced match needs its formula
    out.push(para('Your employer matches what you save, and it\'s guaranteed.', `This is a safe harbor match: ${formula}.`));
  } else if (f.nonelective) {
    out.push(para('Your employer adds money for you even if you don\'t save anything.', `It's guaranteed (safe harbor): ${formula}.`));
  }
  if (f.disc) {
    if (f.safeHarbor) {
      out.push(para('There is also an extra match.', `${tierText(pd)}. It isn't guaranteed: your employer decides each year and can change it.`));
    } else {
      out.push(para('Your employer may match what you save.', `This plan's match is ${tierText(pd)}. It isn't guaranteed: your employer decides each year and can change it.`));
    }
  }
  if (!f.safeHarbor && !f.disc) {
    out.push(para('This plan doesn\'t have an employer match right now.', 'What you save is still yours, and it still gets tax benefits.'));
  }

  // Example, using the calculator's own function for safe harbor money.
  if (f.nonelective) {
    out.push(para('Example:', `on a ${fmtRounded(EXAMPLE_SALARY)} salary, your employer adds ${fmtRounded(safeHarborAmount('nonelective', EXAMPLE_SALARY, 0))} a year, whether or not you save.`));
  } else if (f.shMatch) {
    const pct = FULL_MATCH_PCT[f.type];
    const employer = safeHarborAmount(f.type, EXAMPLE_SALARY, pct);
    out.push(para('Example:', `on a ${fmtRounded(EXAMPLE_SALARY)} salary, saving ${pct}% (${fmtRounded(EXAMPLE_SALARY * pct / 100)} a year) adds ${fmtRounded(employer)} a year from your employer.`));
  } else if (f.disc && f.tiers.length === 1) {
    const { pct, upTo } = f.tiers[0];
    out.push(para('Example:', `on a ${fmtRounded(EXAMPLE_SALARY)} salary, saving ${upTo}% (${fmtRounded(EXAMPLE_SALARY * upTo / 100)} a year) could add ${fmtRounded(EXAMPLE_SALARY * upTo / 100 * pct / 100)} a year from your employer.`));
  }

  if (f.safeHarbor && pd.safeHarbor.vestingImmediate !== false) {
    out.push(para('It\'s yours right away.', 'Safe harbor money is 100% yours from day one.'));
  }
  if (f.disc) {
    out.push(para('The extra match follows a vesting schedule.', 'Tap "When is the match mine to keep?" to see when it\'s fully yours.'));
    if (pd.lastDayProvision === true) {
      out.push(para('Be here at year end.', 'You may need to be working here on the last day of the plan year to get the match for that year.'));
    }
  }
  const me = pd.matchEligibility;
  if (me?.immediateMatch === false && has(me.requirement) && me.requirement.trim() !== (pd.contribEligibility?.requirement ?? '').trim()) {
    out.push(para('The match starts later:', `"${me.requirement.trim()}". You can save before then. It just isn't matched yet.`));
  }
  if (f.profit) {
    const lastDay = pd.profitSharing.lastDayApplies === true ? ' You may need to be working here on the last day of the plan year to get it.' : '';
    out.push(para('There\'s also profit sharing.', `It's a separate amount your employer may add each year, whether or not you save.${lastDay}`));
  }
  return { text: join(out), link: 'calculator' };
}

// Shared by answers 2 and 7: needs the vesting schedule when vesting applies.
function vestingParts(pd: PlanData): { f: ReturnType<typeof facts>; schedule: string | null; label: string } | null {
  const f = facts(pd);
  if (f.type === 'qaca') return null;
  if (typeof pd.safeHarbor?.type !== 'string') return null;
  const needsSchedule = f.disc || f.profit;
  if (needsSchedule && !has(pd.vestingSchedule)) return null;
  const label = f.disc && f.profit ? 'Your match and profit sharing' : f.profit ? 'Your profit sharing money' : 'Your match';
  return { f, schedule: needsSchedule ? (pd.vestingSchedule as string).trim() : null, label };
}

// ── 2. Vesting ──
function vestingAnswer(pd: PlanData): StockAnswer | null {
  const v = vestingParts(pd);
  if (!v) return null;
  const out: string[] = [para('Your own savings are always 100% yours.', '')];
  if (v.f.safeHarbor) out.push(para('Your safe harbor money is 100% yours right away.', ''));
  if (v.schedule) {
    out.push(para(`${v.label} vesting schedule:`, `"${v.schedule}".`));
    out.push(para('What that means:', getTerm('vestingSchedule', 'en').def));
    out.push(para('If you leave early,', 'you keep your own savings plus whatever part is already yours. The rest goes back to the plan.'));
  } else if (!v.f.safeHarbor) {
    out.push(para('There\'s no employer money in this plan right now,', 'so there\'s nothing to wait for.'));
  }
  return { text: join(out) };
}

// ── 3. When can I start saving ──
function eligAnswer(pd: PlanData): StockAnswer | null {
  const ce = pd.contribEligibility;
  if (!ce || !has(ce.requirement)) return null;
  const f = facts(pd);
  const out: string[] = [para('When you can start saving:', `"${ce.requirement.trim()}".`)];
  if (ce.autoEnroll === true) {
    out.push(para('You may be signed up automatically', `${ce.autoEnrollPct > 0 ? `at ${ce.autoEnrollPct}% of your pay` : 'when you become eligible'}. You can change that amount or stop it.`));
  }
  const hasMatch = f.shMatch || f.disc;
  const me = pd.matchEligibility;
  if (!hasMatch && !f.nonelective) {
    out.push(para('There\'s no match to wait for.', ''));
  } else if (hasMatch) {
    const sameTiming = me?.immediateMatch === true || !has(me?.requirement) || me!.requirement!.trim() === ce.requirement.trim();
    if (sameTiming) out.push(para('The match starts at the same time.', ''));
    else out.push(para('The match starts later:', `"${me!.requirement!.trim()}". Saving before then still counts for you. It just isn't matched yet.`));
  }
  if (has(ce.entryDates)) out.push(para('Entry dates:', `"${ce.entryDates.trim()}".`));
  else out.push(para('Your exact start date', 'can depend on set entry dates, like the first of the next month. HR or your plan\'s website can confirm it.'));
  return { text: join(out) };
}

// ── 4. Roth or Traditional ──
function rothAnswer(pd: PlanData): StockAnswer | null {
  const roth = pd.hasRoth ?? pd.rothAvailable;
  if (typeof pd.hasPreTax !== 'boolean' || typeof roth !== 'boolean') return null;
  if (!pd.hasPreTax && !roth) return null;
  const out = [
    para('Traditional (before-tax):', getTerm('traditional', 'en').def),
    para('Roth (after-tax):', getTerm('roth', 'en').def),
    pd.hasPreTax && roth
      ? para('Your plan offers both.', 'You can pick one or split your savings between them.')
      : pd.hasPreTax
        ? para('Your plan offers Traditional only right now.', '')
        : para('Your plan offers Roth only right now.', ''),
    para('Which one fits depends on your taxes now and later.', 'A tax professional can help you think it through.'),
  ];
  return { text: join(out) };
}

// ── 5. Loans ──
function loansAnswer(pd: PlanData): StockAnswer | null {
  if (typeof pd.loanAvailable !== 'boolean') return null;
  if (!pd.loanAvailable) {
    const out = [para('Your plan doesn\'t offer loans right now.', pd.hardshipAvailable === true ? 'It does allow hardship withdrawals, which have different rules. Tap "Can I take money out for a hardship?" to learn more.' : '')];
    return { text: join(out) };
  }
  const site = has(pd.recordkeeperName) ? ` (${pd.recordkeeperName.trim()})` : '';
  return {
    text: join([
      para('Yes, your plan allows loans.', ''),
      para('How much:', 'generally up to half of what\'s yours in the account, with a $50,000 maximum.'),
      para('Paying it back:', 'you repay yourself, with interest, through your paycheck. Usually within 5 years, or longer if the loan is for buying your main home.'),
      para('If you leave your job,', 'any unpaid amount may need to be repaid soon. If it isn\'t, it\'s taxed like a withdrawal.'),
      para('Fees and the exact terms', `are on your plan's website${site}.`),
    ]),
  };
}

// ── 6. Hardship ──
function hardshipAnswer(pd: PlanData): StockAnswer | null {
  if (typeof pd.hardshipAvailable !== 'boolean') return null;
  if (!pd.hardshipAvailable) {
    return { text: join([para('Your plan doesn\'t offer hardship withdrawals right now.', pd.loanAvailable === true ? 'It does allow loans. Tap "Can I borrow from my 401(k)?" to learn more.' : '')]) };
  }
  return {
    text: join([
      para('Yes, your plan allows hardship withdrawals.', ''),
      para('They\'re for serious, urgent money needs.', 'IRS examples include medical bills, stopping an eviction or foreclosure, buying your main home, college costs, funeral costs, and some home repairs.'),
      para('You don\'t pay it back.', 'That also means the money leaves your retirement savings for good.'),
      para('Taxes:', 'it counts as income. If you\'re under 59½, there\'s usually an extra 10% tax too.'),
      para('To request one,', 'go to your plan\'s website. They\'ll tell you what proof they need.'),
    ]),
  };
}

// ── 7. Leaving your job ──
function leaveAnswer(pd: PlanData): StockAnswer | null {
  const v = vestingParts(pd);
  if (!v) return null;
  const out: string[] = [para('Your own savings go with you, always.', '')];
  if (v.f.safeHarbor) out.push(para('So does your safe harbor money.', 'It\'s 100% yours.'));
  if (v.schedule) {
    const what = v.f.disc && v.f.profit ? 'Your match and profit sharing' : v.f.profit ? 'Your profit sharing money' : 'Your match';
    out.push(para(`${what}:`, 'you keep the part that\'s already yours. Tap "When is the match mine to keep?" for the schedule.'));
  }
  out.push(para('Your main options:', 'leave it in this plan, move it to your new job\'s plan, move it to an IRA, or cash it out.'));
  out.push(para('Moving it directly', '(a "direct rollover") keeps it tax-free. Cashing out is taxed as income, and if you\'re under 59½ there\'s usually an extra 10% tax.'));
  out.push(para('Small balances', '(under $7,000) may be moved out of the plan for you if you don\'t choose.'));
  if (pd.loanAvailable === true) out.push(para('Have a loan?', 'Any unpaid amount may need to be repaid soon after you leave.'));
  out.push(para('Each option has trade-offs.', 'Your plan\'s website can walk you through the steps.'));
  return { text: join(out) };
}

// ── 8. Limit ──
function limitAnswer(pd: PlanData): StockAnswer | null {
  if (typeof pd.planAllowsCatchUp !== 'boolean') return null;
  const { year } = getLimitYear();
  const limits = IRS_LIMITS[year];
  const deferral = fmtRounded(limits.deferral);
  const out: string[] = [
    para(`In ${year} you can save up to ${deferral}`, 'of your own pay.'),
    para('Employer money doesn\'t count', `toward your ${deferral}.`),
  ];
  if (pd.planAllowsCatchUp) {
    out.push(para('Age 50 or older?', getTerm('catchUp', 'en').def));
    const roth = pd.hasRoth ?? pd.rothAvailable;
    if (limits.rothCatchUpWageThreshold !== null) {
      if (roth === false) {
        out.push(para('Roth catch-up rule:', `if you earned more than ${fmtRounded(limits.rothCatchUpWageThreshold)} here last year, catch-up money for you must go in as Roth, and this plan doesn't offer Roth, so you can't make catch-up contributions here right now.`));
      } else {
        out.push(para('Roth catch-up rule:', getTerm('rothCatchUpRule', 'en').def));
      }
    }
  } else {
    out.push(para('Your plan doesn\'t offer catch-up contributions,', `so ${deferral} is the limit at every age.`));
  }
  return { text: join(out), link: 'calculator' };
}

const BUILDERS: Record<StockId, (pd: PlanData) => StockAnswer | null> = {
  match: matchAnswer,
  vesting: vestingAnswer,
  elig: eligAnswer,
  roth: rothAnswer,
  loans: loansAnswer,
  hardship: hardshipAnswer,
  leave: leaveAnswer,
  limit: limitAnswer,
};

// null means "send this question to the AI instead".
export function getStockAnswer(id: StockId, planData: PlanData | null, lang: 'en' | 'es'): StockAnswer | null {
  if (lang !== 'en' || !planData || typeof planData !== 'object') return null;
  try {
    return BUILDERS[id](planData);
  } catch {
    return null;
  }
}
