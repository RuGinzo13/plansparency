// Sanity script for lib/plan/reviewRows.ts (the plan details advisors check and edit).
// Run with: npx --yes tsx scripts/check-review.ts
import { REVIEW_ROWS, diffRows, rowValueText, fieldText, getAt, setAt } from '../lib/plan/reviewRows';
import { samples, base, mk } from './samples';
import { normalizePlanData, parseServiceAge } from '../lib/plan/plandata';

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

// In-service withdrawals row.
{
  const row = REVIEW_ROWS.find((r) => r.key === 'inService')!;
  check(!!row && row.fields.length === 2 && row.fields[0].kind === 'tri' && row.fields[1].kind === 'text', 'in-service row exists with Offered and age');
  check(rowValueText(row, base) === 'Offered: Not stated · Starting at age: Not stated', `in-service unknown: ${rowValueText(row, base)}`);
  check(rowValueText(row, mk({ distributionInfo: { inServiceAvailable: true, inServiceAge: 59.5 } })) === 'Offered: Yes · Starting at age: 59½', 'in-service 59.5 shows 59½');
  check(diffRows(base, mk({ distributionInfo: { inServiceAvailable: true, inServiceAge: 55 } })).join(',') === 'inService', 'an in-service change is found');
  for (const [v, want] of [['59½', 59.5], ['59.5', 59.5], ['59 1/2', 59.5], [55, 55], ['55', 55], [49, null], [80, null], ['abc', null], ['', null], [59.3, null]] as [unknown, number | null][]) {
    check(parseServiceAge(v) === want, `parseServiceAge(${JSON.stringify(v)}) is ${parseServiceAge(v)}, wanted ${want}`);
  }
  const n = (di: any) => normalizePlanData({ ...base, distributionInfo: di })!.distributionInfo;
  check(n({ inServiceAge: '59½' })?.inServiceAge === 59.5 && n({ inServiceAge: '59½' })?.inServiceAvailable === true, 'an age found means offered');
  check(n({ inServiceAvailable: false, inServiceAge: 59.5 })?.inServiceAge === null && n({ inServiceAvailable: false })?.inServiceAvailable === false, 'explicit no wins, no age');
  check(n({ inServiceAge: 12 })?.inServiceAvailable === null && n({})?.inServiceAvailable === null, 'no age and no statement is unknown');
  check(normalizePlanData({ ...base, distributionInfo: undefined })!.distributionInfo === undefined, 'no distributionInfo stays missing');
}

console.log(`${pass} checks passed, ${fail} failed`);
if (fail > 0) process.exit(1);
