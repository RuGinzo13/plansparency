// Sanity script for the General 401(k) key terms in lib/glossary.ts.
// Run with: npx --yes tsx scripts/check-terms.ts
import { getKeyTerms, getTerm, KEY_TERMS_LAYOUT } from '../lib/glossary';
import { IRS_LIMITS } from '../lib/plan/irs-limits';
import { getLimitYear } from '../lib/plan/irs';
import { fmtRounded } from '../lib/format';

const BAD = ['{', 'undefined', 'NaN', '—', '–'];
let pass = 0;
let fail = 0;
const check = (ok: boolean, msg: string) => { if (ok) pass++; else { fail++; console.error('FAIL ' + msg); } };

function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v as object).forEach((x) => strings(x, out));
  return out;
}

const ids = new Set(KEY_TERMS_LAYOUT.map((l) => l.id));
check(KEY_TERMS_LAYOUT.length === 22, `layout has ${KEY_TERMS_LAYOUT.length} terms, expected 22`);

for (const lang of ['en', 'es'] as const) {
  const terms = getKeyTerms(lang);
  for (const t of terms) {
    for (const s of strings(t)) {
      const bad = BAD.find((b) => s.includes(b));
      check(!bad, `${lang}/${t.id}: "${s.slice(0, 60)}" contains ${bad}`);
    }
    check(t.short.trim().length > 0, `${lang}/${t.id}: missing short`);
    for (const r of t.rel) check(ids.has(r), `${lang}/${t.id}: rel ${r} not in layout`);
  }
}

const { year } = getLimitYear();
const L = IRS_LIMITS[year];
const limits = getKeyTerms('en').find((t) => t.id === 'annualLimits');
const vals = limits?.rows?.map((r) => r.value).join('|');
check(vals === [fmtRounded(L.deferral), fmtRounded(L.deferral + L.catchUp50), fmtRounded(L.deferral + L.catchUp6063)].join('|'), `annualLimits rows: ${vals}`);
if (year === 2026) check(vals === '$24,500|$32,500|$35,750', `2026 limits: ${vals}`);

const expectedCatchUp = `Extra savings allowed the year you turn 50 or older. In ${year} that's ${fmtRounded(L.catchUp50)} more. If you're 60 to 63 by Dec 31, the extra is ${fmtRounded(L.catchUp6063)} instead (the 'super catch-up'). Your plan has to allow catch-ups.`;
check(getTerm('catchUp', 'en').def === expectedCatchUp, 'catchUp definition changed');

console.log(`${pass} checks passed, ${fail} failed`);
if (fail > 0) process.exit(1);
