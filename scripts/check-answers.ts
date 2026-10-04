// Sanity script for lib/answers/stockAnswers.ts.
// Run with: npx --yes tsx scripts/check-answers.ts
import { STOCK_QUESTIONS, getStockAnswer, type StockId } from '../lib/answers/stockAnswers';
import { samples } from './samples';
import { parseVesting } from '../lib/plan/planFacts';

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
check(!!getStockAnswer('safeHarbor', samples.basicSafeHarbor, 'en')?.text.includes('$2,500'), 'basic match example should show $2,500');
check(!!getStockAnswer('safeHarbor', samples.nonelective, 'en')?.text.includes('$1,500'), 'nonelective example should show $1,500');
check(getStockAnswer('safeHarbor', samples.basicSafeHarbor, 'en')?.link === 'calculator', 'match answer links to the calculator');
check(!!getStockAnswer('limit', samples.catchUpOff, 'en')?.text.includes('at every age'), 'no catch-up wording');
check(!!getStockAnswer('limit', samples.rothOff, 'en')?.text.includes("doesn't offer Roth"), 'no-Roth catch-up wording');
check(getStockAnswer('loans', samples.loansHardshipOff, 'en')?.text.includes("doesn't offer loans") === true, 'loans off wording');

// A plan that says "immediately vested" must never be told it follows a schedule.
{
  const imm = samples.immediateMatch;
  const m = getStockAnswer('match', imm, 'en')?.text ?? '';
  const v = getStockAnswer('vesting', imm, 'en')?.text ?? '';
  check(m.length > 0 && !m.includes('follows a vesting schedule'), 'immediate plan: match answer must not say it follows a schedule');
  check(v.includes('100% yours right away') && !v.includes('What that means'), 'immediate plan: vesting answer says right away, no generic paragraph');
}

// Separate safe harbor / match / profit answers, in-service, and the tax wording.
{
  const A = (id: any, k: string) => getStockAnswer(id, (samples as any)[k], 'en');
  check(!!A('match', 'basicSafeHarbor')?.text.includes('No extra match'), 'safe harbor only: match says No extra match');
  check(!!A('safeHarbor', 'nonelective')?.text.includes("even if you don't save"), 'nonelective safeHarbor text');
  check(!!A('safeHarbor', 'basicSafeHarbor')?.text.includes('must add this every year'), 'safe harbor match text');
  check(!!A('safeHarbor', 'noMatch')?.text.includes("doesn't use a safe harbor"), 'no safe harbor text');
  check(A('safeHarbor', 'qaca') === null && A('match', 'qaca') === null, 'qaca: safeHarbor and match return null');
  check(!!A('match', 'discretionaryLastDay')?.text.includes("The law doesn't require it."), 'match: law does not require it');
  check(!A('match', 'discretionaryLastDay')?.text.includes('isn\'t guaranteed'), 'match: old #44 wording gone');
  check(!!A('profit', 'profitSharingOn')?.text.includes('Yes, your plan has profit sharing'), 'profit yes');
  check(!!A('profit', 'noMatch')?.text.includes("doesn't have profit sharing"), 'profit no');
  check(A('profit', 'allNull') === null, 'profit unknown is null');
  for (const k of Object.keys(samples)) check(A('inService', k) === null, `${k}: inService is always null`);
  check(!!A('leave', 'basicSafeHarbor')?.text.includes('Roth money comes out tax-free if you\'re 59½ or older'), 'leave: new cash-out sentence');
  check(!!A('hardship', 'basicSafeHarbor')?.text.includes('extra 10% early withdrawal tax'), 'hardship: early withdrawal tax wording');
}

// parseVesting: must read these exactly, and refuse to guess the rest.
const vestCases: [string, any][] = [
  ['100% immediately vested', { kind: 'immediate' }],
  ['Immediate 100% vesting', { kind: 'immediate' }],
  ['3-year cliff', [0, 0, 0, 100]],
  ['100% after 3 years of service', [0, 0, 0, 100]],
  ['20% after 2 years, 40% after 3 years, 60% after 4, 80% after 5, 100% after 6', [0, 0, 20, 40, 60, 80, 100]],
  ['2 years: 20%; 3 years: 40%; 4 years: 60%; 5 years: 80%; 6 years: 100%', [0, 0, 20, 40, 60, 80, 100]],
  ['6-year graded', null],
  ['Vesting per the plan document', null],
  ['', null],
  ['40% after 2 years, 20% after 3', null],
  ['Safe harbor contributions: 100% immediately vested. Discretionary match and employer/profit sharing contributions: 6-year graded — 0% at 0-1 year, 20% at 2, 40% at 3, 60% at 4, 80% at 5, 100% at 6+ years.', [0, 0, 20, 40, 60, 80, 100]],
  ['6-year graded — 0% at 0-1 year, 20% at 2, 40% at 3, 60% at 4, 80% at 5, 100% at 6+ years.', [0, 0, 20, 40, 60, 80, 100]],
];
for (const [text, want] of vestCases) {
  const got = parseVesting(text);
  const ok = want === null ? got === null : Array.isArray(want) ? got?.kind === 'schedule' && JSON.stringify(got.byYear) === JSON.stringify(want) : got?.kind === 'immediate';
  check(ok, `parseVesting(${JSON.stringify(text)}) gave ${JSON.stringify(got)}`);
}

console.log(`${pass} checks passed, ${fail} failed`);
if (fail > 0) process.exit(1);
