// ── Builds a video (scenes + captions) from the plan's data ──────────────────
// Returns null when the storyboard says the video is hidden for this plan, or when a caption would
// have a blank in it. Numbers come from lib/plan/visuals.ts (the same builders as the pictures).

import type { PlanData } from '../plan/plandata';
import { fmtRounded } from '../format';
import { getLimitYear } from '../plan/irs';
import {
  employerMoneyAt, employerTiers, matchPhrases, rateMoney, vestingSteps, vestingWords, limitBars, rothRows, EXAMPLE_PAY,
} from '../plan/visuals';
import type { Scene, SceneKind, Video, VideoContextInfo, VideoId } from './types';
import { ART, CAPTIONS, CHAPTERS, LEARN, NEXT, NEXT_HARDSHIP, TITLES, VIDEO_ORDER } from './scripts';

type Lang = 'en' | 'es';
export const VIDEO_IDS: VideoId[] = ['welcome', 'match', 'vesting', 'taxes', 'limits', 'access', 'leave', 'tdf'];

// The videos that exist for this plan, in the order they are listed and played.
export function availableVideos(planData: PlanData | null, ctx: VideoContextInfo, lang: Lang): Video[] {
  return VIDEO_ORDER.map((id) => buildVideo(id, planData, ctx, lang)).filter((v): v is Video => v !== null);
}

// Reading speed: about 2.6 words a second plus a beat, never under 5 seconds.
export function sceneSeconds(caption: string): number {
  const words = caption.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(5, Math.ceil(words / 2.6 + 1.5));
}
export function videoSeconds(v: Video): number {
  return v.scenes.reduce((sum, s) => sum + sceneSeconds(s.caption), 0);
}

class Blank extends Error {}

export function buildVideo(id: VideoId, planData: PlanData | null, ctx: VideoContextInfo, lang: Lang): Video | null {
  try {
    return make(id, planData && typeof planData === 'object' ? planData : null, ctx || {}, lang);
  } catch (e) {
    if (e instanceof Blank) return null;
    throw e;
  }
}

function make(id: VideoId, pd: PlanData | null, ctx: VideoContextInfo, lang: Lang): Video | null {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const scenes: Scene[] = [];
  const cap = (key: string, vars: Record<string, string | number | undefined> = {}): string => {
    const tpl = CAPTIONS[key]?.[lang];
    if (!tpl) throw new Blank(key);
    return tpl.replace(/\{(\w+)\}/g, (_, name) => {
      const v = vars[name];
      if (v === undefined || v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) throw new Blank(`${key}.${name}`);
      return String(v);
    });
  };
  const add = (kind: SceneKind, props: Record<string, unknown>, key: string, vars?: Record<string, string | number | undefined>) => {
    scenes.push({ kind, props, caption: cap(key, vars), chapter: CHAPTERS[key]?.[lang] ?? '' });
  };
  const end = (nextLabel: string, action: Video['next']['action']): Video => {
    const endCap = cap(`${id}.end`);
    scenes.push({ kind: 'end', props: { line: endCap, button: nextLabel }, caption: endCap, chapter: CHAPTERS[`${id}.end`]?.[lang] ?? '' });
    return { id, title: TITLES[id][lang], learn: LEARN[id][lang], scenes, next: { label: nextLabel, action } };
  };
  const planLabel = (ctx.planName || pd?.planName || '').trim() || L('401(k) plan', 'plan 401(k)');
  const employer = (ctx.employerName || '').trim();
  const employerCap = employer || L('Your employer', 'Tu empleador');
  const employerLc = employer || L('your employer', 'tu empleador');
  const next = NEXT[id][lang];

  switch (id) {
    case 'welcome': {
      add('title', { title: planLabel, art: 'none' }, 'welcome.1', { planName: planLabel });
      if (employer) add('employer', { variant: 'building', name: employer, jar: ART.jarYour401k[lang] }, 'welcome.2', { employerName: employer });
      const rk = (ctx.recordkeeperName || pd?.recordkeeperName || '').trim();
      if (rk) add('employer', { variant: 'account', name: rk, button: ART.logIn[lang] }, 'welcome.3', { recordkeeperName: rk });
      add('steps', { variant: 'icons', items: [ART.pickTopic[lang], ART.watchRead[lang], ART.tryCalc[lang]] }, 'welcome.4');
      return end(next, 'welcomeStep2');
    }

    case 'match': {
      if (!pd) return null;
      const em = employerMoneyAt(pd, 0);
      const t = employerTiers(pd);
      const phrases = matchPhrases(pd, lang);
      if (!em || !t || !phrases) return null;
      const full = fmtRounded(em.fullEmployer);
      const youAtFull = fmtRounded((EXAMPLE_PAY * em.pctForFull) / 100);
      add('title', { title: TITLES.match[lang], art: 'jar' }, 'match.1');
      if (t.tiers.length === 0) {
        // Employer pays whatever you save (nonelective): no paycheck or tier scenes.
        add('employer', { variant: 'building', name: employerCap, big: full, bigSub: ART.yearlyCounter[lang], flat: true, jar: ART.jarYour401k[lang] }, 'match.3flat', { employerName: employerCap, fullEmployer: full });
        add('bars', { a: { label: ART.youSave[lang], value: fmtRounded(0), frac: 0 }, b: { label: ART.employerAdds[lang], value: full, frac: 1 }, note: ART.everyYear[lang] }, 'match.5flat', { fullEmployer: full });
        add('jar', { layers: ['you', 'you', 'employer'], box: { tone: 'green', text: L('You can add more on top. Your own savings are always yours.', 'Puedes agregar más por tu cuenta. Tus propios ahorros siempre son tuyos.') } }, 'match.6flat');
        return end(next, 'calculator');
      }
      const t1 = t.tiers[0];
      const tier1Pct = Math.round((t1.to - t1.from) * 100) / 100;
      const youAtTier1 = fmtRounded((EXAMPLE_PAY * tier1Pct) / 100);
      const atTier1 = employerMoneyAt(pd, t1.to)!.employer - employerMoneyAt(pd, 0)!.employer;
      add('paycheck', { pct: tier1Pct, counter: { label: ART.you[lang], value: youAtTier1, suffix: ART.yearlyCounter[lang] } }, 'match.2', { tier1Pct, youAtTier1 });
      const tier1Vars = { employerName: employerCap, tier1Words: phrases.phrases[0], flatWords: phrases.flat ?? undefined };
      add('employer', { variant: 'building', name: employerCap, big: `${rateMoney(t1.rate)} ${L('for', 'por')} $1`, counter: { label: L('Employer adds', 'El empleador agrega'), value: fmtRounded(atTier1), suffix: ART.yearlyCounter[lang] }, jar: ART.jarYour401k[lang] },
        phrases.flat ? 'match.3plus' : 'match.3', tier1Vars);
      if (t.tiers.length >= 2) {
        const t2 = t.tiers[1];
        const tier2Pct = Math.round((t2.to - t2.from) * 100) / 100;
        add('coins', { from: '$1', to: rateMoney(t2.rate) }, 'match.4', { tier2Pct, employerLc, tier2Words: `${rateMoney(t2.rate)} ${L('for every $1 you save', 'por cada $1 que ahorras')}` });
      }
      add('bars', { a: { label: ART.youSave[lang], value: youAtFull, frac: Math.min(1, (em.pctForFull * EXAMPLE_PAY) / 100 / Math.max(em.fullEmployer, (em.pctForFull * EXAMPLE_PAY) / 100)) }, b: { label: ART.employerAdds[lang], value: full, frac: Math.min(1, em.fullEmployer / Math.max(em.fullEmployer, (em.pctForFull * EXAMPLE_PAY) / 100)) }, note: ART.everyYear[lang] }, 'match.5', { pctForFull: em.pctForFull, employerLc, fullEmployer: full });
      const lowPct = Math.max(0, em.pctForFull - 2);
      const missed = Math.max(0, em.fullEmployer - employerMoneyAt(pd, lowPct)!.employer);
      if (missed >= 1) {
        add('jar', { layers: ['you', 'you', 'employer'], fall: true, box: { tone: 'yellow', text: L(`Saving ${lowPct}%? You miss ${fmtRounded(missed)} a year.`, `¿Ahorras ${lowPct}%? Pierdes ${fmtRounded(missed)} al año.`) } }, 'match.6');
      }
      return end(next, 'calculator');
    }

    case 'vesting': {
      const v = vestingSteps(pd, lang);
      if (!v) return null;
      add('title', { title: TITLES.vesting[lang], art: 'jar' }, 'vesting.1');
      add('jar', { layers: ['you', 'you', 'you', 'employer', 'employer', 'employer'], locked: true, label: ART.yoursAlways[lang] }, 'vesting.2');
      if (v.immediate) {
        add('callout', { tone: 'green', text: ART.yoursRightAway[lang] }, 'vesting.imm');
        return end(next, 'scrollVesting');
      }
      add('jar', { layers: ['you', 'you', 'you', 'pale', 'pale', 'pale'], clock: true }, 'vesting.3');
      const sched = v.sources.find((s) => s.byYear[0] < 100) ?? v.sources[0];
      add('steps', { variant: 'years', values: sched.byYear, top: v.maxYears }, 'vesting.4', { scheduleWords: vestingWords(v, lang) });
      // Example: a year where some, but not all, of the employer money is yours (a cliff plan shows 0%).
      const by = sched.byYear;
      const part = by.map((x, i) => (x > 0 && x < 100 ? i : -1)).filter((i) => i >= 0);
      const exampleYear = part.length ? part[Math.floor((part.length - 1) / 2)] : by.findIndex((x) => x === 100) - 1;
      if (exampleYear >= 1) {
        const examplePct = by[exampleYear];
        add('jar', { layers: ['you', 'you', ...Array.from({ length: 4 }, (_, i) => (i < Math.round((examplePct / 100) * 4) ? 'employer' : 'fade'))], label: `${examplePct}%` }, 'vesting.5', {
          exampleYearWords: exampleYear === 1 ? L('1 year', '1 año') : L(`${exampleYear} years`, `${exampleYear} años`), examplePct,
        });
      }
      return end(next, 'scrollVesting');
    }

    case 'taxes': {
      const r = rothRows(pd);
      if (!r || !r.roth) return null;
      add('title', { title: TITLES.taxes[lang], art: 'doors', doors: r.preTax ? [ART.doorPreTax[lang], ART.doorRoth[lang]] : [ART.doorRoth[lang]] }, 'taxes.1');
      if (r.preTax) {
        add('paycheck', { taxSlice: false, jarLabel: ART.preTax[lang], badge: { tone: 'green', text: ART.noTaxNow[lang] } }, 'taxes.2');
        add('tax', { mode: 'out-pre', jarLabel: ART.preTax[lang], badge: { tone: 'red', text: ART.taxedThen[lang] } }, 'taxes.3');
      }
      add('paycheck', { taxSlice: true, jarLabel: ART.doorRoth[lang], badge: { tone: 'red', text: ART.taxedNow[lang] } }, 'taxes.4');
      add('tax', { mode: 'out-roth', jarLabel: ART.doorRoth[lang], badge: { tone: 'green', text: ART.taxFree[lang] }, footnote: ART.rothFootnote[lang] }, 'taxes.5');
      if (r.preTax) add('tax', { mode: 'both', labels: [ART.preTax[lang], ART.doorRoth[lang]] }, 'taxes.6');
      return end(next, 'calculator');
    }

    case 'limits': {
      const year = getLimitYear().year;
      const lb = limitBars(pd, year, lang);
      if (!lb) return null;
      const L50 = fmtRounded(lb.catchUp50);
      const L6063 = fmtRounded(lb.catchUp6063);
      const base = fmtRounded(lb.rows[0].base);
      const max = lb.rows[lb.rows.length - 1].total;
      const frac = (n: number) => n / max;
      add('title', { title: TITLES.limits[lang], art: 'bar' }, 'limits.1');
      add('bars', { limit: { baseFrac: frac(lb.rows[0].base), extraFrac: 0, extraKind: null, label: `${lb.year}: ${base}`, line: ART.limitLine[lang] } }, 'limits.2', { year: lb.year, base });
      if (!lb.catchUpNotOffered) {
        add('bars', { limit: { baseFrac: frac(lb.rows[0].base), extraFrac: frac(lb.catchUp50), extraKind: '50', label: `${ART.age50[lang]}: +${L50}`, line: ART.limitLine[lang] } }, 'limits.3', { catchUp50: L50 });
        add('bars', { limit: { baseFrac: frac(lb.rows[0].base), extraFrac: frac(lb.catchUp6063), extraKind: '6063', label: `${ART.age6063[lang]}: +${L6063}`, line: ART.limitLine[lang] } }, 'limits.4', { catchUp6063: L6063 });
      }
      add('bars', { limit: { baseFrac: frac(lb.rows[0].base), extraFrac: 0, extraKind: null, label: base, line: ART.limitLine[lang], jarBeside: true, jarLabel: ART.employerNoCount[lang] } }, 'limits.5');
      return end(next, 'calculator');
    }

    case 'access': {
      const loan = pd?.loanAvailable === true;
      const hardship = pd?.hardshipAvailable === true;
      if (!loan && !hardship) return null;
      add('title', { title: TITLES.access[lang], art: 'jarDoor' }, loan && hardship ? 'access.1' : 'access.1one');
      if (loan) {
        add('jar', { layers: ['you', 'employer', 'dashed'], loan: true, label: ART.interestBack[lang] }, 'access.2');
        add('jar', { layers: ['you', 'employer', 'dashed'], briefcase: true, clock: true }, 'access.3');
      }
      if (hardship) add('jar', { layers: ['you', 'employer', 'fade'], icons: true, badge: { tone: 'red', text: ART.taxed[lang] } }, 'access.4');
      add('jar', { layers: ['you', 'employer'], compare: true, label: ART.lessNow[lang] }, 'access.5');
      return end(loan ? NEXT.access[lang] : NEXT_HARDSHIP[lang], loan ? 'openLoans' : 'openHardship');
    }

    case 'leave': {
      add('title', { title: TITLES.leave[lang], art: 'person' }, 'leave.1');
      const v = vestingSteps(pd, lang);
      if (v && !v.immediate) add('jar', { layers: ['you', 'you', 'you', 'employer', 'pale'], locked: true, label: ART.yoursAlways[lang] }, 'leave.2');
      else add('jar', { layers: ['you', 'you', 'you', 'employer'], locked: true, label: ART.yoursAlways[lang] }, 'leave.2general');
      const ok = { tone: 'green', text: ART.noTaxNow[lang] };
      add('choices', { cards: [{ title: ART.leaveIt[lang], badge: ok }, { title: ART.newPlan[lang], badge: ok }, { title: ART.ira[lang], badge: ok }] }, 'leave.3');
      add('choices', { cards: [{ title: ART.leaveIt[lang], badge: ok }, { title: ART.newPlan[lang], badge: ok }, { title: ART.ira[lang], badge: ok }, { title: ART.cashOut[lang], danger: true, badge: { tone: 'red', text: ART.penalty[lang] } }], tip: true }, 'leave.4');
      add('choices', { cards: [{ title: ART.leaveIt[lang], badge: ok }, { title: ART.newPlan[lang], badge: ok }, { title: ART.ira[lang], badge: ok }, { title: ART.cashOut[lang], danger: true }], glow: 3 }, 'leave.5');
      return end(next, 'scrollLeave');
    }

    case 'tdf': {
      add('title', { title: TITLES.tdf[lang], art: 'calendar' }, 'tdf.1');
      add('calendar', { year: '2060', pin: true }, 'tdf.2');
      add('mix', { stocks: 85, stocksLabel: ART.stocks[lang], bondsLabel: ART.bonds[lang], note: ART.earlyMore[lang] }, 'tdf.3');
      add('mix', { stocks: 85, to: 25, stocksLabel: ART.stocks[lang], bondsLabel: ART.bonds[lang], note: ART.laterMore[lang] }, 'tdf.4');
      add('mix', { variant: 'card', stocks: 55, note: ART.checkFees[lang] }, 'tdf.5');
      return end(next, 'investments');
    }
  }
  return null;
}
