// Fails if any color is hard-coded outside components/plansparency/theme.ts.
// Run with: npx --yes tsx scripts/check-theme.ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { C, CHART, ROLE } from '../components/plansparency/theme';

const ROOT = join(__dirname, '..');
const THEME = 'components/plansparency/theme.ts';
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/;
const FN = /rgba?\(/;

let pass = 0;
let fail = 0;
const check = (ok: boolean, msg: string) => { if (ok) pass++; else { fail++; console.error('FAIL ' + msg); } };

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|css)$/.test(name)) out.push(p);
  }
  return out;
}

// 1. No hard-coded colors outside theme.ts (globals.css is checked separately below).
for (const dir of ['app', 'components', 'lib']) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file);
    if (rel === THEME || rel === 'app/globals.css') continue;
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (line.trimEnd().endsWith('// theme-ok')) return;
      check(!HEX.test(line) && !FN.test(line), `${rel}:${i + 1} has a hard-coded color: ${line.trim().slice(0, 80)}`);
      for (const m of line.matchAll(/max-?[wW]idth:\s*['"]?(\d{3,5})(?!\d)/g)) {
        check(Number(m[1]) < 900, `${rel}:${i + 1} has a page-width maxWidth of ${m[1]}; use LAYOUT from theme.ts`);
      }
    });
  }
}

// 2. globals.css can't import theme.ts, so its two colors must match C.bg and C.text.
const css = readFileSync(join(ROOT, 'app/globals.css'), 'utf8');
const cssBg = /background:\s*(#[0-9a-fA-F]{3,8})\s*;/.exec(css)?.[1];
const cssText = /(?:^|[\s;{])color:\s*(#[0-9a-fA-F]{3,8})\s*;/.exec(css)?.[1];
check(cssBg?.toLowerCase() === C.bg.toLowerCase(), `globals.css background ${cssBg} should equal C.bg ${C.bg}`);
check(cssText?.toLowerCase() === C.text.toLowerCase(), `globals.css color ${cssText} should equal C.text ${C.text}`);

// Every other color in globals.css (focus ring, skip link) must also be a theme color.
const allowed = new Set([C.bg, C.text, C.focus, C.focusOnDark, C.surface].map((c) => c.toLowerCase()));
for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
  check(allowed.has(m[0].toLowerCase()), `globals.css uses ${m[0]}, which is not a theme color (bg, text, focus, focusOnDark, surface)`);
}

// 3. Contrast (WCAG): text pairs need 4.5, chart colors against the surface need 3.0 (shapes, not text).
function lum(hex: string): number {
  const h = hex.length === 4 ? '#' + [...hex.slice(1)].map((x) => x + x).join('') : hex;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const PAIRS: [keyof typeof C, keyof typeof C][] = [
  ['text', 'bg'], ['textMuted', 'surface'], ['textMuted', 'surfaceAlt'], ['textDim', 'surface'], ['textDim', 'surfaceAlt'],
  ['accent', 'surface'], ['accent', 'accentSoft'], ['accentText', 'surface'], ['accentText', 'accentSoft'], ['accentText', 'highlight'],
  ['onPrimary', 'accent'], ['onPrimary', 'primaryEnd'], ['onDanger', 'danger'], ['green', 'greenSoft'], ['green', 'surface'],
  ['warning', 'warningDim'], ['danger', 'dangerSoft'], ['danger', 'surface'], ['barText', 'bar'], ['barMuted', 'bar'], ['barLink', 'bar'],
];
let lowest = { name: '', value: Infinity };
const note = (name: string, v: number) => { if (v < lowest.value) lowest = { name, value: v }; };
for (const [fg, bg] of PAIRS) {
  if (C[fg].startsWith('rgba(') || C[bg].startsWith('rgba(')) continue;
  const r = ratio(C[fg], C[bg]);
  note(`${fg}/${bg}`, r);
  check(r >= 4.5, `contrast ${fg}/${bg} is ${r.toFixed(2)}, needs 4.5`);
}
for (const [name, color] of Object.entries(CHART)) {
  if (color.startsWith('rgba(')) continue;
  const r = ratio(color, C.surface);
  check(r >= 3.0, `CHART.${name} against surface is ${r.toFixed(2)}, needs 3.0`);
}
// Team role colors.
for (const [role, c] of Object.entries(ROLE)) {
  const a = ratio('#FFFFFF', c.base);
  note(`white/ROLE.${role}.base`, a);
  check(a >= 4.5, `contrast white on ROLE.${role}.base is ${a.toFixed(2)}, needs 4.5`);
  const b = ratio(c.text, c.soft);
  note(`ROLE.${role}.text/soft`, b);
  check(b >= 4.5, `contrast ROLE.${role}.text on soft is ${b.toFixed(2)}, needs 4.5`);
}
// Plan bar: the lock icon (barLink) sits on the tabShadeText box.
{
  const r = ratio(C.barLink, C.tabShadeText);
  note('barLink/tabShadeText', r);
  check(r >= 3.0, `non-text: barLink icon on tabShadeText is ${r.toFixed(2)}, needs 3.0`);
}
// Non-text colors: the striped "still left" part of the employer bar is drawn with warningDim and stripe,
// outlined in warning, so the outline must stand out from both (3.0).
for (const bg of ['warningDim', 'stripe'] as const) {
  const r = ratio(C.warning, C[bg]);
  check(r >= 3.0, `non-text: warning outline against ${bg} is ${r.toFixed(2)}, needs 3.0`);
}
// Video captions: white text on the caption box over the stage (the box is mostly opaque; checked on its solid color).
{
  const solid = '#111827';
  const r = ratio(C.onPrimary, solid);
  note('onPrimary/captionBg', r);
  check(r >= 4.5, `contrast onPrimary on captionBg is ${r.toFixed(2)}, needs 4.5`);
  check(C.captionBg.startsWith('rgba(17,24,39'), 'captionBg should be the C.text color at high opacity');
}
console.log(`Lowest text contrast: ${lowest.name} at ${lowest.value.toFixed(2)}`);

console.log(`PASS ${pass} / FAIL ${fail}`);
if (fail > 0) process.exit(1);
