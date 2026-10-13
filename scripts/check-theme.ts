// Fails if any color is hard-coded outside components/plansparency/theme.ts.
// Run with: npx --yes tsx scripts/check-theme.ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { C } from '../components/plansparency/theme';

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
    });
  }
}

// 2. globals.css can't import theme.ts, so its two colors must match C.bg and C.text.
const css = readFileSync(join(ROOT, 'app/globals.css'), 'utf8');
const cssBg = /background:\s*(#[0-9a-fA-F]{3,8})\s*;/.exec(css)?.[1];
const cssText = /(?:^|[\s;{])color:\s*(#[0-9a-fA-F]{3,8})\s*;/.exec(css)?.[1];
check(cssBg?.toLowerCase() === C.bg.toLowerCase(), `globals.css background ${cssBg} should equal C.bg ${C.bg}`);
check(cssText?.toLowerCase() === C.text.toLowerCase(), `globals.css color ${cssText} should equal C.text ${C.text}`);

console.log(`PASS ${pass} / FAIL ${fail}`);
if (fail > 0) process.exit(1);
