// Sanity script for lib/plan/overview.ts.
// Run with: npx --yes tsx scripts/check-overview.ts
import { getOverview } from '../lib/plan/overview';
import { samples } from './samples';

const BAD = ['undefined', 'null', 'NaN', '[object', '{', '—', '–'];
let pass = 0;
let fail = 0;
const check = (ok: boolean, msg: string) => { if (ok) pass++; else { fail++; console.error('FAIL ' + msg); } };

function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v as object).forEach((x) => strings(x, out));
  return out;
}

for (const [name, pd] of Object.entries(samples)) {
  for (const lang of ['en', 'es'] as const) {
    for (const hasFunds of [false, true]) {
      const o = getOverview(pd, lang, { hasFunds, fundsCount: hasFunds ? 12 : undefined });
      for (const s of strings(o)) {
        const bad = BAD.find((b) => s.includes(b));
        check(!bad, `${name}/${lang}: "${s}" contains ${bad}`);
      }
      check(o.headlines.some((h) => h.key === 'limit'), `${name}/${lang}: limit headline missing`);
    }
  }
}

const empty = getOverview(samples.allNull, 'en', { hasFunds: false });
check(empty.headlines.length === 1 && empty.headlines[0].key === 'limit', 'allNull: only the limit headline');
check(empty.glance.length === 0, 'allNull: glance empty');
check(empty.vesting === null, 'allNull: vesting null');
const nothing = getOverview(null, 'en', { hasFunds: false });
check(nothing.headlines.length === 1 && nothing.glance.length === 0 && nothing.vesting === null, 'null plan: no crash, limit only');

check(!getOverview(samples.qaca, 'en', { hasFunds: false }).headlines.some((h) => h.key === 'employer'), 'qaca: no employer headline');
const basic = getOverview(samples.basicSafeHarbor, 'en', { hasFunds: false });
check(basic.headlines.find((h) => h.key === 'employer')?.value === 'Up to 4% of pay', 'basic safe harbor: "Up to 4% of pay"');
check(getOverview(samples.nonelective, 'en', { hasFunds: false }).headlines.find((h) => h.key === 'employer')?.value === '3% of pay', 'nonelective: "3% of pay"');
check(getOverview(samples.noMatch, 'en', { hasFunds: false }).headlines.find((h) => h.key === 'employer')?.value === 'No match', 'no match headline');
check(basic.vesting !== null && basic.vesting.bars.length >= 2, 'basic safe harbor: vesting bars');
check(basic.leaveOptions.length === 4, 'four leave options');

console.log(`${pass} checks passed, ${fail} failed`);
if (fail > 0) process.exit(1);
