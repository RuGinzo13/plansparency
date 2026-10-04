// Sanity script for lib/answers/stockAnswers.ts.
// Run with: npx --yes tsx scripts/check-answers.ts
import { STOCK_QUESTIONS, getStockAnswer, type StockId } from '../lib/answers/stockAnswers';
import type { PlanData } from '../lib/plan/plandata';

const base: PlanData = {
  planName: 'Sample 401(k) Plan',
  recordkeeperName: 'Sample Recordkeeper',
  recordkeeperUrl: 'https://www.example.com',
  matchTiers: [],
  noMatch: true,
  lastDayProvision: false,
  safeHarbor: { type: 'none', formula: '', vestingImmediate: true },
  profitSharing: { available: false, type: 'discretionary', formula: '', lastDayApplies: false },
  contribEligibility: { requirement: 'Age 21 and 1 year of service', entryDates: 'First of the month after you qualify', autoEnroll: false, autoEnrollPct: 0 },
  matchEligibility: { requirement: 'Age 21 and 1 year of service', entryDates: '', immediateMatch: true },
  loanAvailable: true,
  hardshipAvailable: true,
  hasRoth: true,
  hasPreTax: true,
  rothAvailable: true,
  planAllowsCatchUp: true,
  vestingSchedule: '6-year graded: 20% per year',
  fundsData: [],
};
const mk = (over: Partial<PlanData>): PlanData => ({ ...base, ...over });

const samples: Record<string, PlanData> = {
  basicSafeHarbor: mk({ safeHarbor: { type: 'basic_match', formula: '', vestingImmediate: true } }),
  enhancedSafeHarbor: mk({ safeHarbor: { type: 'enhanced_match', formula: '100% of the first 4% of your pay', vestingImmediate: true } }),
  nonelective: mk({ safeHarbor: { type: 'nonelective', formula: '3% of your pay', vestingImmediate: true } }),
  qaca: mk({ safeHarbor: { type: 'qaca', formula: '100% of the first 1% plus 50% of the next 5%', vestingImmediate: false } }),
  discretionaryLastDay: mk({ noMatch: false, matchTiers: [{ pct: 50, upTo: 6 }], lastDayProvision: true, matchEligibility: { requirement: '1 year of service', entryDates: '', immediateMatch: false } }),
  discretionaryTwoTiers: mk({ noMatch: false, matchTiers: [{ pct: 100, upTo: 3 }, { pct: 50, upTo: 2 }] }),
  noMatch: mk({}),
  profitSharingOn: mk({ profitSharing: { available: true, type: 'discretionary', formula: '', lastDayApplies: true } }),
  safeHarborPlusMatchPlusPS: mk({ noMatch: false, matchTiers: [{ pct: 25, upTo: 4 }], safeHarbor: { type: 'nonelective', formula: '3% of your pay', vestingImmediate: true }, profitSharing: { available: true, type: 'discretionary', formula: '', lastDayApplies: false } }),
  rothOff: mk({ hasRoth: false, rothAvailable: false }),
  rothOnly: mk({ hasPreTax: false }),
  catchUpOff: mk({ planAllowsCatchUp: false }),
  loansHardshipOff: mk({ loanAvailable: false, hardshipAvailable: false }),
  autoEnroll: mk({ contribEligibility: { requirement: 'Immediately', entryDates: '', autoEnroll: true, autoEnrollPct: 3 } }),
  allNull: {
    matchTiers: [], noMatch: null, lastDayProvision: null,
    safeHarbor: { type: undefined as any, formula: '', vestingImmediate: null },
    profitSharing: { available: null, type: '', formula: '', lastDayApplies: null },
    contribEligibility: { autoEnroll: null, autoEnrollPct: 0 },
    matchEligibility: { immediateMatch: null },
    loanAvailable: null, hardshipAvailable: null, hasRoth: null, hasPreTax: null, rothAvailable: null, planAllowsCatchUp: null,
    fundsData: [],
  },
};

const BAD = ['undefined', 'null', 'NaN', '[object', '{', '—', '–'];
let pass = 0;
let fail = 0;
const check = (ok: boolean, msg: string) => { if (ok) pass++; else { fail++; console.error('FAIL ' + msg); } };

for (const [name, pd] of Object.entries(samples)) {
  for (const { id } of STOCK_QUESTIONS) {
    const r = getStockAnswer(id, pd, 'en');
    if (r !== null) {
      const bad = BAD.find((b) => r.text.includes(b));
      check(!bad && r.text.trim().length > 0 && r.text.startsWith('**'), `${name} / ${id}: bad text (${bad ?? 'empty or no bold lead'})`);
    } else {
      check(true, '');
    }
    check(getStockAnswer(id, pd, 'es') === null, `${name} / ${id}: Spanish should be null`);
  }
}

for (const id of ['match', 'vesting', 'leave'] as StockId[]) {
  check(getStockAnswer(id, samples.qaca, 'en') === null, `qaca / ${id} should be null`);
}
for (const { id } of STOCK_QUESTIONS) {
  check(getStockAnswer(id, samples.allNull, 'en') === null, `allNull / ${id} should be null`);
  check(getStockAnswer(id, null, 'en') === null, `null planData / ${id} should be null`);
}
// Spot checks that the answers say what the plan says.
check(!!getStockAnswer('match', samples.basicSafeHarbor, 'en')?.text.includes('$2,500'), 'basic match example should show $2,500');
check(!!getStockAnswer('match', samples.nonelective, 'en')?.text.includes('$1,500'), 'nonelective example should show $1,500');
check(getStockAnswer('match', samples.basicSafeHarbor, 'en')?.link === 'calculator', 'match answer links to the calculator');
check(!!getStockAnswer('limit', samples.catchUpOff, 'en')?.text.includes('at every age'), 'no catch-up wording');
check(!!getStockAnswer('limit', samples.rothOff, 'en')?.text.includes("doesn't offer Roth"), 'no-Roth catch-up wording');
check(getStockAnswer('loans', samples.loansHardshipOff, 'en')?.text.includes("doesn't offer loans") === true, 'loans off wording');

console.log(`${pass} checks passed, ${fail} failed`);
if (fail > 0) process.exit(1);
