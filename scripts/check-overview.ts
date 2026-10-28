// Sanity script for lib/plan/overview.ts (panel groups, cards, vesting, leave choices).
// Run with: npx --yes tsx scripts/check-overview.ts
import { getOverview } from '../lib/plan/overview';
import { getLimitYear } from '../lib/plan/irs';
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

const YES_NO_START = /^(Yes|No|Sí|Adds|Agrega|Ask HR|Pregunta a RR\. HH\.|Tap to see|Toca para ver)/;

for (const [name, pd] of Object.entries(samples)) {
  for (const lang of ['en', 'es'] as const) {
    const o = getOverview(pd, lang);
    for (const s of strings(o)) {
      const bad = BAD.find((b) => s.includes(b));
      check(!bad, `${name}/${lang}: "${s}" contains ${bad}`);
    }
    check(o.groups.length === 4 && o.groups.map((g) => g.rows.length).join() === '3,4,3,1', `${name}/${lang}: 4 groups, rows 3,4,3,1`);
    check(o.groups.map((g) => g.topic).join() === 'you,employer,access,leave', `${name}/${lang}: group order`);
    const inService = o.groups[2].rows[2];
    check(inService.card === 'inService' && /^(Tap to see|Toca para ver)$/.test(inService.value), `${name}/${lang}: in-service says Tap to see when the plan doesn't say`);
    // Yes/no rows never show a bare description.
    for (const row of [...o.groups[1].rows.filter((r) => r.card !== 'vesting'), o.groups[2].rows[0], o.groups[2].rows[1]]) {
      check(YES_NO_START.test(row.value), `${name}/${lang}: "${row.label}" value "${row.value}" must start with Yes/No/Tap`);
    }
    check(o.topics.you.map((c) => c.id).join() === 'elig,limit,roth', `${name}/${lang}: you cards`);
    check(o.topics.employer.map((c) => c.id).join() === 'safeHarbor,match,profit,vesting', `${name}/${lang}: employer cards`);
    check(o.topics.access.map((c) => c.id).join() === 'loans,hardship,inService', `${name}/${lang}: access cards`);
    check(o.topics.leave.map((c) => c.id).join() === 'leave', `${name}/${lang}: leave card`);
    check(o.leaveOptions.length === 4, `${name}/${lang}: four leave options`);
  }
}

const empty = getOverview(samples.allNull, 'en');
for (const g of empty.groups) {
  for (const r of g.rows) {
    const isLimit = r.card === 'limit';
    if (r.card === 'leave') { check(r.value.startsWith('Your savings go with you'), `allNull: leave row "${r.value}"`); continue; }
    check(isLimit ? r.value.startsWith('$') : r.value === 'Tap to see', `allNull: "${r.label}" = "${r.value}"`);
  }
}
check(empty.vesting === null, 'allNull: vesting null');
const nothing = getOverview(null, 'en');
check(nothing.groups.length === 4 && nothing.vesting === null, 'null plan: no crash');

const basic = getOverview(samples.basicSafeHarbor, 'en');
check(basic.groups[1].rows[0].value === 'Adds up to 4% of pay', `basic safe harbor row: ${basic.groups[1].rows[0].value}`);
check(basic.groups[1].rows[1].value === 'No, safe harbor only', 'safe harbor only: employer match row says so');
check(getOverview(samples.nonelective, 'en').groups[1].rows[0].value === 'Adds 3% of pay', 'nonelective row');
check(getOverview(samples.qaca, 'en').groups[1].rows[0].value === 'Yes', 'qaca safe harbor row');
check(getOverview(samples.noMatch, 'en').groups[1].rows[0].value === 'No', 'no safe harbor row');
check(getOverview(samples.discretionaryLastDay, 'en').groups[1].rows[1].value.startsWith('Adds up to'), 'discretionary match row');
check(basic.vesting !== null && basic.vesting.bars.length >= 2, 'basic safe harbor: vesting bars');
const cash = basic.leaveOptions[3];
check(cash.warning === true && cash.tag === 'Taxes may apply' && cash.body.includes('Roth money comes out tax-free'), 'cash it out wording');

check(basic.leaveOptions.slice(0, 3).every((x) => !x.taxNow.yes && !x.penalty.yes), 'first three leave choices: no tax now, no penalty');
check(cash.taxNow.yes && cash.taxNow.text === 'Yes, on pre-tax money' && cash.penalty.yes && cash.penalty.text === '10% if under 59½', 'cash it out: tax and penalty badges');

// Short labels on the side panel (EN and ES) and a Yours to keep row in Employer money.
{
  const labels = (lang: 'en' | 'es') => getOverview(samples.basicSafeHarbor, lang).groups.flatMap((g) => g.rows.map((r) => r.label)).join('|');
  check(labels('en') === `When you can join|${getLimitYear().year} limit|Pre-tax or Roth|Safe harbor|Employer match|Profit sharing|Yours to keep|Loans|Hardship|While you work|When you leave`, `EN panel labels: ${labels('en')}`);
  check(labels('es') === `Cuándo puedes unirte|Límite ${getLimitYear().year}|Antes de impuestos o Roth|Safe harbor|Match del empleador|Profit sharing|Tuyo para quedártelo|Préstamos|Dificultad|Mientras trabajas|Cuando te vas`, `ES panel labels: ${labels('es')}`);
  const es = getOverview(samples.basicSafeHarbor, 'es');
  check(es.groups[1].rows[0].value === 'Agrega hasta 4% del salario', `ES adds up to: ${es.groups[1].rows[0].value}`);
  check(getOverview(samples.basicSafeHarbor, 'en').groups[1].rows[3].value === 'Right away', 'vesting row value');
}

console.log(`${pass} checks passed, ${fail} failed`);
if (fail > 0) process.exit(1);
