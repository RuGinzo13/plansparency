// Accessibility guardrail (WCAG 2.2 AA, the parts code can catch). Parses every .tsx in app/ and components/.
// Run with: npx --yes tsx scripts/check-a11y.ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const ROOT = join(__dirname, '..');
let pass = 0;
let fail = 0;
const check = (ok: boolean, where: string, msg: string) => {
  if (ok) pass++;
  else { fail++; console.error(`FAIL ${where} ${msg}`); }
};

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|css)$/.test(name)) out.push(p);
  }
  return out;
}

const NON_INTERACTIVE = new Set(['div', 'span', 'li', 'p', 'img', 'svg']);
const FIELDS = new Set(['input', 'select', 'textarea']);

type Opening = ts.JsxOpeningElement | ts.JsxSelfClosingElement;
const tagOf = (n: Opening) => n.tagName.getText();
const attr = (n: Opening, name: string) =>
  n.attributes.properties.find((a): a is ts.JsxAttribute => ts.isJsxAttribute(a) && a.name.getText() === name);
const attrText = (a?: ts.JsxAttribute) => {
  if (!a || !a.initializer) return a ? 'true' : undefined;
  if (ts.isStringLiteral(a.initializer)) return a.initializer.text;
  if (ts.isJsxExpression(a.initializer) && a.initializer.expression) {
    const e = a.initializer.expression;
    return ts.isStringLiteralLike(e) ? e.text : e.getText();
  }
  return undefined;
};

function hasText(el: ts.JsxElement): boolean {
  let found = false;
  const visit = (n: ts.Node) => {
    if (found) return;
    if (ts.isJsxText(n) && n.text.trim()) { found = true; return; }
    if (ts.isJsxExpression(n) && n.expression) { found = true; return; }
    if (ts.isJsxAttribute(n)) return;
    ts.forEachChild(n, visit);
  };
  el.children.forEach(visit);
  return found;
}

for (const file of [...walk(join(ROOT, 'app')), ...walk(join(ROOT, 'components'))]) {
  const rel = relative(ROOT, file);
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');

  // Text rules (comments in the source are skipped by the marker only).
  lines.forEach((line, i) => {
    const where = `${rel}:${i + 1}`;
    if (/outline\s*:\s*['"]?none/.test(line)) {
      check(line.trimEnd().endsWith('// a11y-ok: wrapper shows focus'), where, 'outline: none without a visible focus replacement');
    }
    for (const m of line.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) {
      check(Number(m[1]) >= 12, where, `font-size ${m[1]}px is under 12px`);
    }
  });
  if (!file.endsWith('.tsx')) continue;

  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const at = (n: ts.Node) => `${rel}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;

  // First pass: label targets in this file.
  const labelFor = new Set<string>();
  const collect = (n: ts.Node) => {
    if (ts.isJsxOpeningElement(n) && tagOf(n) === 'label') {
      const f = attrText(attr(n, 'htmlFor'));
      if (f) labelFor.add(f);
    }
    ts.forEachChild(n, collect);
  };
  collect(sf);

  const visit = (n: ts.Node) => {
    // fontSize: <number under 12>
    if (ts.isPropertyAssignment(n) && n.name.getText() === 'fontSize' && ts.isNumericLiteral(n.initializer)) {
      check(Number(n.initializer.text) >= 12, at(n), `fontSize ${n.initializer.text} is under 12`);
    }
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = tagOf(n);
      const where = at(n);
      if (NON_INTERACTIVE.has(tag) && attr(n, 'onClick')) {
        check(false, where, `<${tag} onClick> is mouse-only; use a <button> or <a>`);
      }
      if (FIELDS.has(tag)) {
        const type = attrText(attr(n, 'type'));
        if (type !== 'file' && type !== 'hidden') {
          const id = attrText(attr(n, 'id'));
          let wrapped = false;
          for (let p: ts.Node | undefined = n.parent; p; p = p.parent) {
            if (ts.isJsxElement(p) && p.openingElement.tagName.getText() === 'label') { wrapped = true; break; }
          }
          const ok = !!attr(n, 'aria-label') || !!attr(n, 'aria-labelledby') || (!!id && labelFor.has(id)) || wrapped;
          check(ok, where, `<${tag}> has no aria-label, aria-labelledby or matching <label htmlFor>`);
        }
      }
      if (tag === 'img') check(!!attr(n, 'alt'), where, '<img> has no alt');
      if (tag === 'svg') {
        const ok = !!attr(n, 'aria-hidden') || (attrText(attr(n, 'role')) === 'img' && !!attr(n, 'aria-label'));
        check(ok, where, '<svg> needs aria-hidden="true" or role="img" with aria-label');
      }
      if (tag === 'button' && ts.isJsxOpeningElement(n)) {
        const ok = !!attr(n, 'aria-label') || !!attr(n, 'aria-labelledby') || hasText(n.parent as ts.JsxElement);
        check(ok, where, '<button> has no text and no aria-label');
      }
      if (attrText(attr(n, 'role')) === 'dialog') {
        check(!!attr(n, 'aria-modal') && !!attr(n, 'aria-labelledby'), where, 'role="dialog" needs aria-modal and aria-labelledby');
      }
      if (tag === 'html' && rel === 'app/layout.tsx') check(!!attr(n, 'lang'), where, '<html> has no lang');
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}

console.log(`PASS ${pass} / FAIL ${fail}`);
if (fail > 0) process.exit(1);
