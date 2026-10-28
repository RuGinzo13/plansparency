// Sanity script for lib/plan/visuals.ts (the plan-data builders behind the pictures).
// Run with: npx --yes tsx scripts/check-visuals.ts
import { employerMoneyAt, employerTiers, vestingSteps, vestingWords, joinSteps, limitBars, rothRows } from '../lib/plan/visuals';
import { IRS_LIMITS } from '../lib/plan/irs-limits';
import { samples } from './samples';
import { FOCUS_CHOICES, focusPlace, focusTopics, focusTitle } from '../lib/plan/focus';

let pass = 0;
let fail = 0;
const check = (ok: boolean, msg: string) => { if (ok) pass++; else { fail++; console.error('FAIL ' + msg); } };

function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v as object).forEach((x) => strings(x, out));
  return out;
}
const BAD = ['undefined', 'null', 'NaN', '[object', '{', '—', '–'];
const noBad = (v: unknown, where: string) => { for (const s of strings(v)) check(!BAD.some((b) => s.includes(b)), `${where}: "${s}" has bad text`); };
const numbersOk = (v: unknown, where: string) => {
  const walk = (x: unknown): void => {
    if (typeof x === 'number') check(Number.isFinite(x), `${where}: non-finite number`);
    else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === 'object') Object.values(x as object).forEach(walk);
  };
  walk(v);
};

const shown: Record<string, string[]> = {};
const hidden: Record<string, string[]> = {};
const note = (name: string, pic: string, ok: boolean) => { ((ok ? shown : hidden)[pic] ??= []).push(name); };

for (const [name, pd] of Object.entries(samples)) {
  for (const lang of ['en', 'es'] as const) {
    let em, vs, js, lb, rr;
    try {
      em = employerMoneyAt(pd, 3);
      vs = vestingSteps(pd, lang);
      js = joinSteps(pd, lang);
      lb = limitBars(pd, 2026, lang);
      rr = rothRows(pd);
      employerTiers(pd);
      if (vs) vestingWords(vs, lang);
    } catch (e) {
      check(false, `${name}/${lang}: threw ${e}`);
      continue;
    }
    noBad([em, vs, js, lb, rr, vs ? vestingWords(vs, lang) : null], `${name}/${lang}`);
    numbersOk([em, vs, lb], `${name}/${lang}`);
    if (lang === 'en') {
      note(name, 'employerMoney', !!em); note(name, 'vesting', !!vs); note(name, 'join', !!js); note(name, 'limits', !!lb); note(name, 'roth', !!rr);
    }
  }

  const em0 = employerMoneyAt(pd, 0);
  if (em0) {
    const { fullEmployer, pctForFull } = em0;
    const at = employerMoneyAt(pd, pctForFull)!;
    check(Math.abs(at.employer - fullEmployer) < 0.01, `${name}: employer at pctForFull ${at.employer} != fullEmployer ${fullEmployer}`);
    let prev = -1;
    for (let p = 0; p <= 12; p++) {
      const e = employerMoneyAt(pd, p)!;
      check(e.employer <= fullEmployer + 0.01, `${name}: employer above full at ${p}%`);
      check(e.employer >= prev - 0.001, `${name}: employer money went down at ${p}%`);
      check(Math.abs(e.you - 500 * p) < 0.01, `${name}: you at ${p}% is ${e.you}`);
      prev = e.employer;
    }
    if (pctForFull > 0) check(employerMoneyAt(pd, pctForFull - 1)!.employer < fullEmployer - 0.001, `${name}: pctForFull is not the lowest`);
    check(employerTiers(pd) !== null, `${name}: has employer money but no tiers`);
  }

  const vs = vestingSteps(pd);
  if (vs) {
    for (const s of vs.sources) {
      check(s.byYear.length === vs.maxYears + 1, `${name}: ${s.label} length`);
      s.byYear.forEach((v, i) => {
        check(v >= 0 && v <= 100, `${name}: vesting ${v} out of range`);
        if (i > 0) check(v >= s.byYear[i - 1], `${name}: vesting goes down at year ${i}`);
      });
      check(s.byYear[vs.maxYears] === 100, `${name}: ${s.label} does not end at 100`);
    }
  }

  const lb = limitBars(pd, 2026);
  if (lb) {
    const L = IRS_LIMITS[2026];
    for (const r of lb.rows) {
      check(r.total === r.base + r.extra, `${name}: total ${r.total} != base + extra`);
      check(r.base === L.deferral, `${name}: base`);
      if (r.extraKind === 'catchUp50') check(r.extra === L.catchUp50 && r.total === L.deferral + L.catchUp50, `${name}: 50+ row`);
      if (r.extraKind === 'catchUp6063') check(r.extra === L.catchUp6063 && r.total === L.deferral + L.catchUp6063, `${name}: 60-63 row`);
    }
    check(lb.catchUpNotOffered ? lb.rows.length === 1 : lb.rows.length === 3, `${name}: row count`);
  }
}

// Spot checks on the sample plans.
const basic = employerMoneyAt(samples.basicSafeHarbor, 3)!;
check(basic.employer === 1500 && basic.fullEmployer === 2000 && basic.pctForFull === 5, `basic safe harbor: ${JSON.stringify(basic)}`);
check(employerMoneyAt(samples.nonelective, 0)!.employer === 1500 && employerMoneyAt(samples.nonelective, 0)!.pctForFull === 0, 'nonelective pays at 0%');
check(employerMoneyAt(samples.noMatch, 3) === null, 'no employer money: no picture');
check(employerMoneyAt(samples.allNull, 3) === null && vestingSteps(samples.allNull) === null && joinSteps(samples.allNull) === null && limitBars(samples.allNull) === null && rothRows(samples.allNull) === null, 'allNull: nothing is drawn');
check(employerMoneyAt(null, 3) === null && vestingSteps(null) === null && joinSteps(null) === null && limitBars(null) === null && rothRows(null) === null, 'null plan: nothing is drawn');
check(limitBars(samples.catchUpOff, 2026)!.catchUpNotOffered === true, 'catch-up off flag');
check(rothRows(samples.rothOff)!.roth === false && rothRows(samples.rothOnly)!.preTax === false, 'roth rows');
check(vestingSteps(samples.immediateMatch)!.immediate === true, 'immediate vesting');
check(vestingSteps(samples.discretionaryTwoTiers) === null, 'unparseable vesting text: no picture');
check(vestingSteps(samples.safeHarborPlusMatchPlusPS) === null || vestingSteps(samples.safeHarborPlusMatchPlusPS)!.sources.length === 2, 'safe harbor plus other money: two rows');

// Guided start: six choices, each with EN + ES words, and a place to go.
check(FOCUS_CHOICES.length === 6, 'six focus choices');
for (const c of FOCUS_CHOICES) {
  check(c.title.en.length > 0 && c.title.es.length > 0 && c.example.en.length > 0 && c.example.es.length > 0, `${c.id}: EN and ES words`);
  check(!BAD.some((b) => (c.title.en + c.title.es + c.example.en + c.example.es).includes(b)), `${c.id}: bad text`);
  for (const [name, pd] of Object.entries(samples)) check(focusPlace(c.id, pd).kind.length > 0, `${name}/${c.id}: place`);
}
check(focusPlace('employer', samples.basicSafeHarbor).kind === 'card' && (focusPlace('employer', samples.basicSafeHarbor) as any).card === 'safeHarbor', 'employer pick opens safe harbor first');
check((focusPlace('employer', samples.discretionaryTwoTiers) as any).card === 'match', 'employer pick opens match when no safe harbor');
check(focusTopics(['start', 'calc', 'leave', 'employer', 'start']).join() === 'you,leave,employer', 'focus topics');
check(focusTopics(['invest', 'calc']).length === 0, 'no topic picks: show everything');
check(focusTitle('calc', 'es') === 'Ver cuánto podría ahorrar', 'ES title');

console.log('\nShown / hidden by picture (EN):');
for (const pic of Object.keys({ ...shown, ...hidden })) {
  console.log(`  ${pic}: shown on ${(shown[pic] ?? []).length} samples; hidden on ${(hidden[pic] ?? []).join(', ') || 'none'}`);
}
console.log(`${pass} checks passed, ${fail} failed`);
if (fail > 0) process.exit(1);
