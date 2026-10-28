'use client';

import React from 'react';
import { C } from '../theme';
import { Pill } from '../Pill';
import { VisualFrame } from './VisualFrame';
import { rothRows } from '@/lib/plan/visuals';

interface Props { planData: any; lang: 'en' | 'es' }

// Visual 4: when you pay the taxes (shown in the Roth answer).
export function TaxTimingVisual({ planData, lang }: Props) {
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const r = rothRows(planData);
  if (!r) return null;

  const rows: { label: string; pre: [string, boolean]; roth: [string, boolean] }[] = [
    { label: L('Going in', 'Al entrar'), pre: [L('No tax now', 'Sin impuesto ahora'), false], roth: [L('Taxed now', 'Con impuesto ahora'), true] },
    { label: L('While it grows', 'Mientras crece'), pre: [L('No tax', 'Sin impuesto'), false], roth: [L('No tax', 'Sin impuesto'), false] },
    { label: L('Taking it out', 'Al sacarlo'), pre: [L('Taxed then', 'Con impuesto entonces'), true], roth: [L('Tax-free*', 'Libre de impuestos*'), false] },
  ];
  const cols = [r.preTax, r.roth].filter(Boolean).length;
  const badge = ([text, taxed]: [string, boolean]) => (
    <Pill kind={taxed ? 'ask' : 'yes'} size="sm">{text}</Pill>
  );
  const head = (text: string, bg: string, fg: string) => (
    <div style={{ padding: '8px 10px', borderRadius: 10, background: bg, color: fg, fontSize: 14, fontWeight: 700 }}>{text}</div>
  );

  const parts: string[] = [];
  if (r.preTax) parts.push(L('With pre-tax (Traditional), no tax comes out going in, and you pay tax on what you take out.', 'Con antes de impuestos (Tradicional), no se paga impuesto al entrar, y pagas impuesto sobre lo que sacas.'));
  if (r.roth) parts.push(L('With Roth, you pay tax going in, and it can come out tax-free if you’re 59½ or older and your first Roth deposit was at least 5 years ago.', 'Con Roth, pagas impuesto al entrar, y puede salir libre de impuestos si tienes 59½ o más y tu primer depósito Roth fue hace al menos 5 años.'));
  if (!r.roth) parts.push(L('Your plan doesn’t offer Roth.', 'Tu plan no ofrece Roth.'));

  return (
    <VisualFrame lang={lang} label={L('when you pay the taxes', 'cuándo pagas los impuestos')} words={parts.join(' ')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `110px repeat(${cols}, minmax(0, 1fr))`, gap: 8, alignItems: 'center' }}>
          <div />
          {r.preTax && head(L('Pre-tax (Traditional)', 'Antes de impuestos (Tradicional)'), C.surfaceAlt, C.text)}
          {r.roth && head('Roth', C.accentSoft, C.accentText)}
          {rows.map((row) => (
            <React.Fragment key={row.label}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{row.label}</div>
              {r.preTax && <div>{badge(row.pre)}</div>}
              {r.roth && <div>{badge(row.roth)}</div>}
            </React.Fragment>
          ))}
        </div>
        {r.roth && <div style={{ fontSize: 12, color: C.textDim }}>{L('* If you’re 59½ or older and your first Roth deposit was at least 5 years ago.', '* Si tienes 59½ o más y tu primer depósito Roth fue hace al menos 5 años.')}</div>}
        {!r.roth && <div style={{ fontSize: 14, color: C.textMuted }}>{L('Your plan doesn’t offer Roth.', 'Tu plan no ofrece Roth.')}</div>}
      </div>
    </VisualFrame>
  );
}
