// Sanity script for lib/plan/reviewRows.ts (the plan details advisors check and edit).
// Run with: npx --yes tsx scripts/check-review.ts
import { REVIEW_ROWS, diffRows, rowValueText, fieldText, getAt, setAt } from '../lib/plan/reviewRows';
import { samples, base, mk } from './samples';

let pass = 0;
let fail = 0;
const check = (ok: boolean, msg: string) => { if (ok) pass++; else { fail++; console.error('FAIL ' + msg); } };

// diffRows
check(diffRows(base, JSON.parse(JSON.stringify(base))).length === 0, 'identical data has no differences');
check(diffRows(base, mk({ vestingSchedule: '3-year cliff' })).join(',') === 'vesting', 'a vesting change is found');
check(diffRows(base, mk({ recordkeeperUrl: 'https://www.other.com' })).join(',') === 'basics', 'a recordkeeper URL change is found');
check(diffRows(base, mk({ loanAvailable: false, hardshipAvailable: false })).join(',') === 'loans,hardship', 'two changes are found in row order');
check(diffRows(base, mk({ fundsData: [{ name: 'X' } as any] })).length === 0, 'investment options are not a review row');
check(diffRows({}, {}).length === 0, 'two empty objects match');
check(diffRows({ vestingSchedule: undefined }, { vestingSchedule: null }).length === 0, 'undefined and null count as the same');

// rowValueText: readable for every row on every sample
const BAD = ['undefined', 'NaN', '[object', 'null', '{'];
for (const [name, data] of Object.entries(samples)) {
  for (const row of REVIEW_ROWS) {
    const t = rowValueText(row, data);
    check(t.length > 0, `${name}/${row.key}: has text`);
    check(!BAD.some((b) => t.includes(b)), `${name}/${row.key}: no raw values in "${t.slice(0, 60)}"`);
    check(!/[—–]/.test(t), `${name}/${row.key}: no dashes`);
  }
}
const vestRow = REVIEW_ROWS.find((r) => r.key === 'vesting')!;
check(rowValueText(vestRow, base) === base.vestingSchedule, 'single-field row shows just the value');
check(rowValueText(REVIEW_ROWS.find((r) => r.key === 'loans')!, base) === 'Yes', 'a yes/no row says Yes');
check(rowValueText(REVIEW_ROWS.find((r) => r.key === 'loans')!, {}) === 'Not stated', 'a missing yes/no says Not stated');
check(rowValueText(REVIEW_ROWS.find((r) => r.key === 'match')!, samples.discretionaryTwoTiers).includes('100% match on the first 3% of pay'), 'match tiers are spelled out');
check(rowValueText(REVIEW_ROWS.find((r) => r.key === 'basics')!, base).includes('Sample Recordkeeper'), 'basics row shows the recordkeeper');
check(fieldText({ path: ['x'], kind: 'text', label: 'X' }, {}) === 'Not stated', 'empty text says Not stated');

// getAt / setAt
const changed = setAt(base, ['safeHarbor', 'type'], 'qaca');
check(getAt(changed, ['safeHarbor', 'type']) === 'qaca' && getAt(base, ['safeHarbor', 'type']) === 'none', 'setAt copies and does not touch the original');

console.log(`${pass} checks passed, ${fail} failed`);
if (fail > 0) process.exit(1);
