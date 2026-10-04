// ── Stock answers for the 8 common questions (DRAFT wording) ─────────────────
// Built exactly as written in PHASE PROMPTS/PHASE-10-stock-answers-wording.md.
// An answer is built from the plan's reviewed details only. If anything the
// answer REQUIRES is missing, it returns null and the tap goes to the AI.
// Definitions come from lib/glossary.ts and IRS numbers from lib/plan/irs-limits.ts,
// so nothing here is typed in by hand twice.

import type { PlanData } from '../plan/plandata';
import { has, FULL_MATCH_PCT, STANDARD_FORMULA, tierText, facts, vestingParts, parseVesting } from '../plan/planFacts';
import { getTerm } from '../glossary';
import { IRS_LIMITS } from '../plan/irs-limits';
import { getLimitYear } from '../plan/irs';
import { safeHarborAmount } from '../plan/calc';
import { fmtRounded } from '../format';

export type StockId = 'elig' | 'limit' | 'roth' | 'safeHarbor' | 'match' | 'profit' | 'vesting' | 'loans' | 'hardship' | 'inService' | 'leave';

export interface StockAnswer {
  text: string;
  link?: 'calculator';
}

// Question labels shown on the cards and sent to the AI when there is no written answer.
// "{year}" is filled by questionLabel().
export const QUESTION_LABELS: Record<StockId, { en: string; es: string }> = {
  elig: { en: 'When can I start saving?', es: '¿Cuándo puedo empezar a ahorrar?' },
  limit: { en: 'How much can I save in {year}?', es: '¿Cuánto puedo ahorrar en {year}?' },
  roth: { en: "Roth or Traditional: what's the difference?", es: 'Roth o Tradicional: ¿cuál es la diferencia?' },
  safeHarbor: { en: 'What is my safe harbor contribution?', es: '¿Cuál es mi contribución safe harbor?' },
  match: { en: 'Does my employer add a match?', es: '¿Mi empleador agrega un match?' },
  profit: { en: 'Does my employer share profits?', es: '¿Mi empleador comparte ganancias?' },
  vesting: { en: 'When is the match mine to keep?', es: '¿Cuándo es mío el match?' },
  loans: { en: 'Can I borrow from my 401(k)?', es: '¿Puedo pedir un préstamo de mi 401(k)?' },
  hardship: { en: 'Can I take money out for a hardship?', es: '¿Puedo sacar dinero por una dificultad económica?' },
  inService: { en: 'Can I take money out while I still work here?', es: '¿Puedo sacar dinero mientras sigo trabajando aquí?' },
  leave: { en: 'What happens to my 401(k) if I leave my job?', es: '¿Qué pasa con mi 401(k) si dejo mi trabajo?' },
};

export function questionLabel(id: StockId, lang: 'en' | 'es'): string {
  return QUESTION_LABELS[id][lang].split('{year}').join(String(getLimitYear().year));
}

const para = (lead: string, rest: string) => `**${lead}** ${rest}`.trim();
const join = (paras: string[]) => paras.join('\n\n');

const EXAMPLE_SALARY = 50000;

// ── Safe harbor ──
function safeHarborAnswer(pd: PlanData): StockAnswer | null {
  const f = facts(pd);
  if (f.type === 'qaca') return null;
  if (typeof pd.safeHarbor?.type !== 'string') return null;
  const out: string[] = [];
  const formula = has(pd.safeHarbor.formula) ? pd.safeHarbor.formula.trim() : STANDARD_FORMULA[f.type];
  const rightAway = pd.safeHarbor.vestingImmediate !== false;

  if (f.shMatch) {
    if (!has(formula)) return null; // enhanced match needs its formula
    out.push(para('Your employer must add this every year, as long as you\'re eligible.', `It's a safe harbor match: ${formula}.`));
    const pct = FULL_MATCH_PCT[f.type];
    out.push(para('Example:', `on a ${fmtRounded(EXAMPLE_SALARY)} salary, saving ${pct}% (${fmtRounded(EXAMPLE_SALARY * pct / 100)} a year) adds ${fmtRounded(safeHarborAmount(f.type, EXAMPLE_SALARY, pct))} a year from your employer.`));
  } else if (f.nonelective) {
    out.push(para(`Your employer adds ${formula} for you every year, even if you don't save anything.`, ''));
    out.push(para('Example:', `on a ${fmtRounded(EXAMPLE_SALARY)} salary, your employer adds ${fmtRounded(safeHarborAmount('nonelective', EXAMPLE_SALARY, 0))} a year, whether or not you save.`));
  } else {
    return { text: join([para('No, your plan doesn\'t use a safe harbor contribution.', 'Your employer may still add a match or profit sharing. See those cards.')]) };
  }
  if (rightAway) out.push(para('It\'s yours right away.', 'Safe harbor money is 100% yours from day one.'));
  return { text: join(out), link: 'calculator' };
}

// ── Employer match (the non-safe-harbor tiers) ──
function matchAnswer(pd: PlanData): StockAnswer | null {
  const f = facts(pd);
  if (f.type === 'qaca') return null;
  if (typeof pd.safeHarbor?.type !== 'string') return null;

  if (f.disc) {
    const out: string[] = [
      para('Yes, your employer adds a match:', `${tierText(pd)}.`),
      para('The law doesn\'t require it.', 'Your employer chooses whether to offer it, how much, and can change or stop it.'),
    ];
    if (f.tiers.length === 1) {
      const { pct, upTo } = f.tiers[0];
      out.push(para('Example:', `on a ${fmtRounded(EXAMPLE_SALARY)} salary, saving ${upTo}% (${fmtRounded(EXAMPLE_SALARY * upTo / 100)} a year) could add ${fmtRounded(EXAMPLE_SALARY * upTo / 100 * pct / 100)} a year from your employer.`));
    }
    if (parseVesting(pd.vestingSchedule)?.kind === 'immediate') {
      out.push(para('It\'s yours right away.', 'Your plan says this match is 100% yours as soon as it\'s paid in.'));
    } else {
      out.push(para('It follows a vesting schedule.', 'Open "When is the match mine to keep?" to see when it\'s fully yours.'));
    }
    if (pd.lastDayProvision === true) {
      out.push(para('Be here at year end.', 'You may need to be working here on the last day of the plan year to get the match for that year.'));
    }
    const me = pd.matchEligibility;
    if (me?.immediateMatch === false && has(me.requirement) && me.requirement.trim() !== (pd.contribEligibility?.requirement ?? '').trim()) {
      out.push(para('The match starts later:', `"${me.requirement.trim()}". You can save before then. It just isn't matched yet.`));
    }
    return { text: join(out), link: 'calculator' };
  }
  if (f.safeHarbor) {
    return { text: join([para('No extra match beyond your safe harbor contribution.', 'Your employer\'s money comes from the safe harbor card above.')]) };
  }
  if (pd.noMatch === true) {
    return { text: join([para('No, this plan doesn\'t have an employer match right now.', 'What you save is still yours, and it still gets tax benefits.')]) };
  }
  return null;
}

// ── Profit sharing ──
function profitAnswer(pd: PlanData): StockAnswer | null {
  const available = pd.profitSharing?.available;
  if (typeof available !== 'boolean') return null;
  if (!available) return { text: join([para('No, your plan doesn\'t have profit sharing right now.', '')]) };
  const out: string[] = [para('Yes, your plan has profit sharing.', 'Your employer decides each year whether to add it and how much. You don\'t have to save anything yourself to get it.')];
  if (pd.profitSharing.lastDayApplies === true) {
    out.push(para('Be here at year end.', 'You may need to be working here on the last day of the plan year to get it.'));
  }
  if (has(pd.vestingSchedule)) {
    out.push(parseVesting(pd.vestingSchedule)?.kind === 'immediate'
      ? para('It\'s yours right away.', 'Your plan says this money is 100% yours as soon as it\'s paid in.')
      : para('It follows a vesting schedule.', 'Open "When is the match mine to keep?" to see when it\'s fully yours.'));
  }
  return { text: join(out) };
}

// ── 2. Vesting ──
function vestingAnswer(pd: PlanData): StockAnswer | null {
  const v = vestingParts(pd);
  if (!v) return null;
  const out: string[] = [para('Your own savings are always 100% yours.', '')];
  if (v.f.safeHarbor) out.push(para('Your safe harbor money is 100% yours right away.', ''));
  if (v.schedule && parseVesting(v.schedule)?.kind === 'immediate') {
    out.push(para(`${v.label} is 100% yours right away.`, `Your plan says: "${v.schedule}".`));
  } else if (v.schedule) {
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
      para('Taxes:', 'it counts as income. If you\'re under 59½, there\'s usually an extra 10% early withdrawal tax too.'),
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
  out.push(para('Moving it directly', '(a "direct rollover") keeps it tax-free.'));
  out.push(para('Cashing out:', 'pre-tax (Traditional) money and what it earned are taxed as income. Roth money comes out tax-free if you\'re 59½ or older and your first Roth deposit was at least 5 years ago. Under 59½, there\'s usually an extra 10% early withdrawal tax.'));
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
  elig: eligAnswer,
  limit: limitAnswer,
  roth: rothAnswer,
  safeHarbor: safeHarborAnswer,
  match: matchAnswer,
  profit: profitAnswer,
  vesting: vestingAnswer,
  loans: loansAnswer,
  hardship: hardshipAnswer,
  // The plan reader doesn't collect in-service withdrawals, so this always goes to the AI.
  inService: () => null,
  leave: leaveAnswer,
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
