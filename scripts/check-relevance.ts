// PHASE-23: one relevance rule for every card, picture, video, link and pill.
// Runs every sample plan and the 4 real test plans (as saved) through the same rules.
// Run with: npx --yes tsx scripts/check-relevance.ts
import { readFileSync } from 'node:fs';
import { samples } from './samples';
import { normalizePlanData, type PlanData } from '../lib/plan/plandata';
import { cardKind, cardExtras, topicVideos, pillKindFor, matchVideoOwner, TOPIC_CARDS, type TopicId } from '../lib/plan/relevance';
import { employerMoneyAt, EXAMPLE_PAY } from '../lib/plan/visuals';
import { matchAmount, facts, matchCounts } from '../lib/plan/planFacts';
import { safeHarborAmount, calculatorResult } from '../lib/plan/calc';
import { getOverview } from '../lib/plan/overview';
import { focusChoicesFor, focusPlace } from '../lib/plan/focus';
import { buildVideo, availableVideos } from '../lib/videos/build';
import { getLimitYear } from '../lib/plan/irs';
import type { StockId } from '../lib/answers/stockAnswers';

let pass = 0;
let fail = 0;
const check = (ok: boolean, msg: string) => { if (ok) pass++; else { fail++; console.error('FAIL ' + msg); } };

const real = JSON.parse(readFileSync('scripts/fixtures/real-plans.json', 'utf8')).plans as Record<string, any>;
const plans: Record<string, PlanData> = { ...samples };
for (const [k, v] of Object.entries(real)) plans[`real:${k}`] = normalizePlanData(v)!;
const withFunds = { ...samples.noMatch, fundsData: [{ name: 'Target 2060', category: 'Target Date' }] } as PlanData;
plans['withTargetDateFund'] = withFunds;

const ALL: StockId[] = Object.values(TOPIC_CARDS).flat();
const ctx = { planName: 'Sample', employerName: 'Acme', recordkeeperName: 'RK' };
const dollars = (t: string) => [...t.matchAll(/\$([\d,]+(?:\.\d+)?)/g)].map((m) => Number(m[1].replace(/,/g, '')));

for (const [name, pd] of Object.entries(plans)) {
  const f = facts(pd);
  for (const id of ALL) {
    const kind = cardKind(id, pd);
    const x = cardExtras(id, pd);
    // 1. A "No" or unknown card never shows a picture, slider or video.
    if (kind === 'no' || kind === 'ask') check(x.picture === null && x.video === null, `${name} / ${id}: kind ${kind} must have no picture or video (got ${x.picture}, ${x.video})`);
    if (id === 'profit' || id === 'inService') check(x.picture === null && x.video === null && x.link === null, `${name} / ${id}: never a picture, video or link`);
    // 2. A link only on a "No" card, and it points at a card that says yes.
    if (x.link) check(kind === 'no' && cardKind(x.link.to, pd) === 'yes' && !!x.link.text.en && !!x.link.text.es, `${name} / ${id}: link must go from a No card to a Yes card, EN + ES`);
    // 3. The side panel pill kind equals the card pill kind.
    check(pillKindFor(id, pd) === kind, `${name} / ${id}: pillKindFor differs from cardKind`);
  }
  const o = getOverview(pd, 'en');
  for (const g of o.groups) for (const r of g.rows) check(r.kind === cardKind(r.card, pd), `${name}: panel row "${r.label}" kind ${r.kind} differs from its card (${cardKind(r.card, pd)})`);
  for (const cards of Object.values(o.topics)) for (const c of cards) check(c.kind === cardKind(c.id, pd), `${name}: card ${c.id} kind differs`);
  // Safe harbor / match pictures use their own money only.
  const shX = cardExtras('safeHarbor', pd);
  const mX = cardExtras('match', pd);
  if (shX.picture) {
    check(shX.picture === 'employerSafeHarbor', `${name}: safe harbor card picture is employerSafeHarbor`);
    const m = employerMoneyAt(pd, 0, EXAMPLE_PAY, 'safeHarbor');
    if (m) check(Math.abs(m.fullEmployer - safeHarborAmount(f.type, EXAMPLE_PAY, 100)) < 1e-6, `${name}: safe harbor card money is safe harbor money only`);
  }
  if (mX.picture) {
    check(mX.picture === 'employerMatch' && matchCounts(pd), `${name}: match card picture only for a sure extra match`);
    const m = employerMoneyAt(pd, 0, EXAMPLE_PAY, 'match');
    if (m) check(Math.abs(m.fullEmployer - matchAmount(f.tiers, EXAMPLE_PAY, 100)) < 1e-6, `${name}: match card money is match money only`);
  }
  // 4. At 6% on $50,000 the calculator's employer total equals safe harbor card money + match card money.
  const at6 = (src: 'safeHarbor' | 'match') => employerMoneyAt(pd, 6, EXAMPLE_PAY, src)?.employer ?? 0;
  const counted = matchCounts(pd);
  const r = calculatorResult({
    salary: EXAMPLE_PAY, pct: 6, payPeriods: 26, ageAtYearEnd: null, priorPlanAmount: 0, year: getLimitYear().year,
    plan: { safeHarborType: pd.safeHarbor?.type ?? 'none', hasDiscretionaryMatch: counted, matchTiers: counted ? pd.matchTiers : [], hasRoth: pd.hasRoth ?? null, hasPreTax: pd.hasPreTax ?? null, planAllowsCatchUp: pd.planAllowsCatchUp ?? null },
  });
  check(Math.abs(r.employer - (at6('safeHarbor') + at6('match'))) < 0.01, `${name}: calculator employer ${r.employer} differs from cards ${at6('safeHarbor')} + ${at6('match')}`);
  check(Math.abs(r.employer - (employerMoneyAt(pd, 6, EXAMPLE_PAY, 'all')?.employer ?? 0)) < 0.01, `${name}: calculator employer differs from the "all" total`);
  // 5. topicVideos lists only videos of yes/info cards, in card order, without repeats.
  for (const topic of Object.keys(TOPIC_CARDS) as TopicId[]) {
    const list = topicVideos(topic, pd);
    check(new Set(list).size === list.length, `${name} / ${topic}: topicVideos has repeats`);
    for (const v of list) check(TOPIC_CARDS[topic].some((id) => cardExtras(id, pd).video === v && ['yes', 'info'].includes(cardKind(id, pd))), `${name} / ${topic}: video ${v} is not from a yes or info card`);
  }
  // 6. The target date video only with a Target Date fund.
  const hasTdf = (pd.fundsData ?? []).some((fd: any) => fd?.category === 'Target Date');
  check((buildVideo('tdf', pd, ctx, 'en') !== null) === hasTdf, `${name}: tdf video must exist only with a Target Date fund`);
  check(availableVideos(pd, ctx, 'en').some((v) => v.id === 'tdf') === hasTdf, `${name}: tdf in the video list only with a Target Date fund`);
  // 7. Focus choices never offer a topic whose cards are all No.
  const offered = focusChoicesFor(pd).map((c) => c.id);
  const allNo = (ids: StockId[]) => ids.every((id) => cardKind(id, pd) === 'no');
  check(!(offered.includes('employer') && allNo(['safeHarbor', 'match', 'profit'])), `${name}: employer focus offered with all No cards`);
  check(!(offered.includes('access') && allNo(['loans', 'hardship', 'inService'])), `${name}: access focus offered with all No cards`);
  check(offered.includes('invest') === ((pd.fundsData ?? []).length > 0), `${name}: invest focus only with funds`);
  const place = focusPlace('access', pd);
  if (place.kind === 'card' && ['loans', 'hardship', 'inService'].some((id) => cardKind(id as StockId, pd) === 'yes')) check(cardKind(place.card, pd) === 'yes', `${name}: access focus opens a yes card`);
  // 8. The match video: one money source, and its numbers never exceed that card's total.
  for (const lang of ['en', 'es'] as const) {
    const v = buildVideo('match', pd, ctx, lang);
    const owner = matchVideoOwner(pd);
    check((v !== null) === (owner !== null && !!employerMoneyAt(pd, 0, EXAMPLE_PAY, owner)), `${name} (${lang}): match video exists only when its source has money`);
    if (v && owner) {
      const total = employerMoneyAt(pd, 0, EXAMPLE_PAY, owner)!.fullEmployer;
      const shown: number[] = [];
      for (const s of v.scenes) {
        const p: any = s.props;
        // Only what the employer adds: the right-hand bar, and the employer scene's counter and big number.
        const vals = s.kind === 'bars' ? [p?.b?.value] : s.kind === 'employer' ? [p?.counter?.value, p?.big] : [];
        for (const t of vals) if (typeof t === 'string') shown.push(...dollars(t));
      }
      check(shown.every((n) => n <= total + 0.5), `${name} (${lang}): match video shows ${shown.join(',')} but the ${owner} card total is ${total}`);
      const cardOwnerExtras = cardExtras(owner, pd);
      check(cardOwnerExtras.video === 'match', `${name}: the ${owner} card owns the match video`);
      const other = owner === 'safeHarbor' ? 'match' : 'safeHarbor';
      check(cardExtras(other, pd).video === null, `${name}: the ${other} card must not repeat the match video`);
      // No caption in the video says "all of it" over a mixed total: with an unsure or extra match the extra-match scene is present.
      if (owner === 'safeHarbor' && f.disc) check(v.scenes.some((s) => s.caption.includes(lang === 'en' ? 'extra match' : 'match adicional')), `${name} (${lang}): extra-match scene is present`);
    }
  }
}

// ── The four real plans, as Ross described them ──
const R = (k: string) => plans[`real:${k}`];
const kinds = (pd: PlanData, ids: StockId[]) => ids.map((id) => cardKind(id, pd)).join(',');
{
  const baers = R('baers');
  check(cardKind('safeHarbor', baers) === 'no' && cardExtras('safeHarbor', baers).link?.to === 'match' && cardExtras('safeHarbor', baers).picture === null && cardExtras('safeHarbor', baers).video === null, "Baer's: safe harbor No, link to the match, no slider, no video");
  check(cardExtras('match', baers).picture === 'employerMatch' && cardExtras('match', baers).video === 'match', "Baer's: match card has the match slider and video");
  check(employerMoneyAt(baers, 6, EXAMPLE_PAY, 'match')?.employer === 2000, "Baer's: match money is $2,000");
  check(employerMoneyAt(baers, 6, EXAMPLE_PAY, 'safeHarbor') === null, "Baer's: no safe harbor money");
  const conf = R('conflictInternational');
  check(cardKind('match', conf) === 'no' && cardExtras('match', conf).link?.to === 'safeHarbor' && cardExtras('match', conf).picture === null && cardExtras('match', conf).video === null, 'Conflict: match No, link to safe harbor, no slider or video');
  check(cardKind('profit', conf) === 'ask', 'Conflict: profit sharing is Ask HR');
  check(!matchCounts(conf), 'Conflict: the calculator has no extra match row');
  const tierra = R('tierraSur');
  check(employerMoneyAt(tierra, 6, EXAMPLE_PAY, 'safeHarbor')?.employer === 2000, 'Tierra Sur: safe harbor card shows $2,000');
  check(cardKind('match', tierra) === 'ask' && cardExtras('match', tierra).picture === null, 'Tierra Sur: match card is Ask HR with no picture');
  check(cardKind('inService', tierra) === 'ask', 'Tierra Sur: in-service is Ask HR');
  const tv = buildVideo('match', tierra, ctx, 'en')!;
  check(!!tv && !tv.scenes.some((s) => s.caption.includes('5,000') || JSON.stringify(s.props).includes('5,000')), 'Tierra Sur: the match video never says $5,000');
  check(!!tv && tv.scenes.some((s) => s.caption.includes('Ask HR about an extra match')), 'Tierra Sur: the video says to ask HR about an extra match');
  check(kinds(baers, ['loans', 'hardship']) === 'no,yes' && cardExtras('hardship', baers).video === 'access' && cardExtras('loans', baers).link?.to === 'hardship', "Baer's: no loans, hardship has the access video and loans links to it");
  for (const k of ['baers', 'conflictInternational', 'conflictInternationalNoMatch', 'tierraSur']) check(!availableVideos(R(k), ctx, 'en').some((v) => v.id === 'tdf'), `${k}: no target date video without funds`);
  const wel = buildVideo('welcome', baers, ctx, 'en')!;
  check(wel.scenes.some((s) => s.caption.includes('with pictures and short videos where they help')), 'welcome.4 wording');
}

console.log(`PASS ${pass} / FAIL ${fail}`);
if (fail > 0) process.exit(1);
