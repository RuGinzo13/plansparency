// Sanity script for lib/videos (the data behind the 8 explainer videos).
// Run with: npx --yes tsx scripts/check-videos.ts
import { buildVideo, sceneSeconds, videoSeconds, VIDEO_IDS } from '../lib/videos/build';
import { CAPTIONS, CHAPTERS, LEARN, TITLES, VIDEO_ORDER, VIDEO_SECTIONS } from '../lib/videos/scripts';
import { employerMoneyAt, employerTiers, limitBars, rothRows, vestingSteps } from '../lib/plan/visuals';
import { IRS_LIMITS } from '../lib/plan/irs-limits';
import { getLimitYear } from '../lib/plan/irs';
import { fmtRounded } from '../lib/format';
import { getNarration } from '../lib/videos/narration';
import { samples, mk } from './samples';

let pass = 0;
let fail = 0;
const check = (ok: boolean, msg: string) => { if (ok) pass++; else { fail++; console.error('FAIL ' + msg); } };

const BAD = ['{', '}', 'undefined', 'NaN', 'null', '[object', '—', '–'];
const ctxFull = { employerName: 'Acme Co', planName: 'Acme 401(k) Plan', recordkeeperName: 'Sample Recordkeeper', hasTeam: true };
const ctxNone = {};
const year = getLimitYear().year;

const seconds: Record<string, Record<string, number>> = {};
const hiddenBy: Record<string, string[]> = {};

for (const [name, pd] of Object.entries(samples)) {
  for (const lang of ['en', 'es'] as const) {
    for (const id of VIDEO_IDS) {
      let v;
      try { v = buildVideo(id, pd, ctxFull, lang); } catch (e) { check(false, `${name}/${lang}/${id}: threw ${e}`); continue; }
      try { buildVideo(id, pd, ctxNone, lang); } catch (e) { check(false, `${name}/${lang}/${id}: threw without context ${e}`); }
      if (lang === 'en') { (hiddenBy[id] ??= []); if (!v) hiddenBy[id].push(name); else (seconds[id] ??= {})[name] = videoSeconds(v); }

      // Storyboard "Plan data" rules.
      const em = employerMoneyAt(pd, 0);
      const expectHidden: Record<string, boolean> = {
        welcome: false,
        match: !em || !employerTiers(pd),
        vesting: vestingSteps(pd) === null,
        taxes: !(rothRows(pd)?.roth === true),
        limits: limitBars(pd) === null,
        access: !(pd.loanAvailable === true || pd.hardshipAvailable === true),
        leave: false,
        tdf: !(pd.fundsData ?? []).some((f: any) => f?.category === 'Target Date'),
      };
      check((v === null) === expectHidden[id], `${name}/${lang}/${id}: hidden=${v === null}, storyboard says hidden=${expectHidden[id]}`);
      if (!v) continue;

      check(v.title === TITLES[id][lang], `${name}/${lang}/${id}: title`);
      check(v.scenes.length >= 3 && v.scenes[v.scenes.length - 1].kind === 'end', `${name}/${lang}/${id}: ends with an end card`);
      check(v.scenes[0].kind === 'title', `${name}/${lang}/${id}: starts with a title`);
      check(videoSeconds(v) < 60, `${name}/${lang}/${id}: ${videoSeconds(v)} s is not under 60`);
      check(v.next.label.length > 0, `${name}/${lang}/${id}: end button label`);
      for (const s of v.scenes) {
        check(s.caption.trim().length > 0, `${name}/${lang}/${id}: empty caption`);
        const bad = BAD.find((b) => s.caption.includes(b) || v!.title.includes(b) || v!.next.label.includes(b));
        check(!bad, `${name}/${lang}/${id}: "${s.caption}" has ${bad}`);
        check(!JSON.stringify(s.props).match(/undefined|NaN|\{\}/), `${name}/${lang}/${id}: props ${JSON.stringify(s.props).slice(0, 80)}`);
        check(sceneSeconds(s.caption) >= 5, `${name}/${lang}/${id}: scene shorter than 5 s`);
      }

      // Numbers must match the pictures and the IRS table.
      const text = v.scenes.map((s) => s.caption).join(' ');
      if (id === 'match' && em) {
        check(text.includes(fmtRounded(em.fullEmployer)), `${name}/${lang}/match: caption has the full employer amount ${fmtRounded(em.fullEmployer)}`);
        if (em.pctForFull > 0) check(text.includes(`${em.pctForFull}%`), `${name}/${lang}/match: caption has ${em.pctForFull}%`);
      }
      if (id === 'limits') {
        const L = IRS_LIMITS[year];
        check(text.includes(fmtRounded(L.deferral)), `${name}/${lang}/limits: base ${fmtRounded(L.deferral)}`);
        if (pd.planAllowsCatchUp) check(text.includes(fmtRounded(L.catchUp50)) && text.includes(fmtRounded(L.catchUp6063)), `${name}/${lang}/limits: catch-up amounts`);
        else check(!text.includes(fmtRounded(L.catchUp50)), `${name}/${lang}/limits: no catch-up scenes when not offered`);
      }
    }
  }
}

// Spot checks.
const basic = buildVideo('match', samples.basicSafeHarbor, ctxFull, 'en')!;
check(basic.scenes.length === 7, `basic safe harbor match video has 7 scenes (6 + end), got ${basic.scenes.length}`);
check(basic.scenes[1].caption === 'Every paycheck, a small part of your pay goes into your 401(k). Save 3%, and that’s $1,500 a year.', `scene 2: ${basic.scenes[1].caption}`);
check(basic.scenes[2].caption === 'Acme Co matches it: $1 for every $1 you save, up to 3% of your pay.', `scene 3: ${basic.scenes[2].caption}`);
check(basic.scenes[3].caption === 'Save 2% more, and Acme Co adds 50¢ for every $1 you save.', `scene 4: ${basic.scenes[3].caption}`);
check(basic.scenes[4].caption === 'Save 5% in total, and Acme Co adds $2,000 a year. That’s all of it.', `scene 5: ${basic.scenes[4].caption}`);
const nonel = buildVideo('match', samples.nonelective, ctxFull, 'en')!;
check(nonel.scenes.some((s) => s.caption === 'Acme Co adds $1,500 a year, even if you save nothing.') && !nonel.scenes.some((s) => s.kind === 'coins' || s.kind === 'paycheck'), 'nonelective uses the alternate scenes');
const w0 = buildVideo('welcome', { ...samples.basicSafeHarbor, recordkeeperName: undefined }, ctxNone, 'en')!;
check(w0.scenes.length === 3, `welcome without employer or recordkeeper skips scenes 2 and 3 (title, steps, end): ${w0.scenes.length}`);
check(buildVideo('welcome', samples.basicSafeHarbor, ctxFull, 'en')!.scenes.length === 5, 'welcome with both has 5 scenes');
check(buildVideo('access', samples.loansHardshipOff, ctxFull, 'en') === null, 'access hidden when neither is offered');
check(buildVideo('access', { ...samples.basicSafeHarbor, loanAvailable: false }, ctxFull, 'en')!.next.action === 'openHardship', 'access without loans points at hardship');
check(buildVideo('taxes', samples.rothOff, ctxFull, 'en') === null, 'taxes hidden without Roth');
check(buildVideo('limits', samples.catchUpOff, ctxFull, 'en')!.scenes.length === 4, 'limits without catch-up skips scenes 3 and 4 (title, 2, 5, end)');
check(buildVideo('limits', samples.basicSafeHarbor, ctxFull, 'en')!.scenes.length === 6, 'limits with catch-up has 6 scenes');
const graded = mk({ vestingSchedule: '0% at 0-1 year, 20% after 2 years, 40% after 3 years, 60% after 4 years, 80% after 5 years, 100% after 6 years', noMatch: false, matchTiers: [{ pct: 50, upTo: 6 }] });
const gv = buildVideo('vesting', graded, ctxFull, 'en');
check(!!gv && gv.scenes.length === 6 && gv.scenes[3].kind === 'steps' && /^You own 20% more each year from year 2/.test(gv.scenes[3].caption) && /^Leave after 3 years, and you keep 40% /.test(gv.scenes[4].caption), `graded vesting video: ${gv?.scenes.map((x) => x.caption).join(' | ')}`);
check(buildVideo('vesting', samples.immediateMatch, ctxFull, 'en')!.scenes.some((s) => s.caption.includes('100% yours right away')), 'immediate vesting video');
check(buildVideo('welcome', null, ctxNone, 'en') !== null && buildVideo('leave', null, ctxNone, 'es') !== null, 'general videos need no plan data');
check(buildVideo('tdf', null, ctxNone, 'en') === null && buildVideo('tdf', samples.noMatch, ctxFull, 'en') === null, 'tdf is hidden without a Target Date fund');
check(buildVideo('tdf', { ...samples.noMatch, fundsData: [{ name: 'Target 2060', category: 'Target Date' }] as any }, ctxFull, 'en') !== null, 'tdf shows with a Target Date fund');
check(buildVideo('match', null, ctxFull, 'en') === null, 'no plan: match hidden');
check(Object.keys(CAPTIONS).every((k) => CAPTIONS[k].en && CAPTIONS[k].es && !BAD.some((b) => k !== 'x' && b !== '{' && b !== '}' && (CAPTIONS[k].en + CAPTIONS[k].es).includes(b))), 'every caption has EN and ES, no dashes');
check(sceneSeconds('one two three') === 5 && sceneSeconds(Array(26).fill('w').join(' ')) === 12, 'scene duration rule');

// Chapters, learn lines, order and sections.
for (const k of Object.keys(CAPTIONS)) check(!!CHAPTERS[k], `chapter for ${k}`);
for (const [k, c] of Object.entries(CHAPTERS)) {
  for (const lang of ['en', 'es'] as const) {
    const n = c[lang].trim().split(/\s+/).length;
    check(n >= 2 && n <= 5, `chapter ${k}/${lang} "${c[lang]}" has ${n} words`);
    check(!BAD.some((b) => c[lang].includes(b)), `chapter ${k}/${lang} has a bad character`);
  }
}
for (const id of VIDEO_IDS) {
  check(!!LEARN[id].en && !!LEARN[id].es && !/[—–]/.test(LEARN[id].en + LEARN[id].es), `learn line ${id}`);
  check(VIDEO_ORDER.filter((x) => x === id).length === 1, `${id} once in VIDEO_ORDER`);
  check(VIDEO_SECTIONS.flatMap((s) => s.videos).filter((x) => x === id).length === 1, `${id} in exactly one section`);
}
check(VIDEO_ORDER.join() === 'welcome,limits,taxes,match,vesting,access,leave,tdf', 'VIDEO_ORDER');
check(VIDEO_SECTIONS.map((s) => s.videos.join('+')).join('|') === 'welcome|limits+taxes|match+vesting|access|leave|tdf', 'VIDEO_SECTIONS');
for (const lang of ['en', 'es'] as const) {
  const v = buildVideo('limits', samples.basicSafeHarbor, ctxFull, lang)!;
  check(v.learn === LEARN.limits[lang] && v.scenes.every((x) => x.chapter.length > 0), `${lang} video has learn line and a chapter on every scene`);
}

getNarration(basic, 'en').then((n) => {
  check(n === null, 'narration returns null until ElevenLabs is plugged in');
  console.log('\nTotal seconds by video and sample (EN):');
  for (const id of VIDEO_IDS) {
    const s = Object.values(seconds[id] ?? {});
    console.log(`  ${id}: ${s.length ? `${Math.min(...s)} to ${Math.max(...s)} s` : 'never shown'}; hidden on ${hiddenBy[id].join(', ') || 'none'}`);
  }
  console.log(`${pass} checks passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
});
