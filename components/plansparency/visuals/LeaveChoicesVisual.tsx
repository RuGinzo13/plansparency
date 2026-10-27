'use client';

import React from 'react';
import { C, F } from '../theme';
import { VisualFrame } from './VisualFrame';
import type { LeaveOption } from '@/lib/plan/overview';

interface Props { options: LeaveOption[]; lang: 'en' | 'es' }

// Visual 6: your 4 choices when you leave, side by side with tax and penalty badges.
// The cards hold real text, so they stay readable by screen readers; "In words" sums them up.
export function LeaveChoicesVisual({ options, lang }: Props) {
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const badge = (f: { yes: boolean; text: string }) => (
    <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: f.yes ? C.dangerSoft : C.greenSoft, color: f.yes ? C.danger : C.green }}>{f.text}</span>
  );
  const words = L(
    'Leaving it, or moving it to a new plan or an IRA, keeps taxes off for now. Cashing out means taxes on pre-tax money, plus a 10% extra tax if you’re under 59½. Roth money can come out tax-free if you meet the Roth rules.',
    'Dejarlo, o moverlo a un plan nuevo o a una IRA, evita los impuestos por ahora. Retirarlo en efectivo significa impuestos sobre el dinero antes de impuestos, más un 10% extra si tienes menos de 59½. El dinero Roth puede salir libre de impuestos si cumples las reglas de Roth.'
  );
  const cards = (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="vz-two">
      {options.map((opt) => (
        <li key={opt.title} style={{ padding: 14, borderRadius: 14, background: opt.warning ? C.dangerSoft : C.surface, border: opt.warning ? `2px solid ${C.danger}` : `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{opt.title}</div>
          <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{opt.body}</div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 13, fontWeight: 600, color: C.text }}>{L('Taxes now:', 'Impuestos ahora:')} {badge(opt.taxNow)}</div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 13, fontWeight: 600, color: C.text }}>{L('Extra penalty:', 'Penalización extra:')} {badge(opt.penalty)}</div>
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-labelledby="leave-choices-h" style={{ padding: 22, borderRadius: 16, background: C.surfaceAlt, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 id="leave-choices-h" style={{ margin: 0, fontFamily: F.display, fontSize: 26, fontWeight: 700, color: C.text }}>{L('Your 4 choices when you leave', 'Tus 4 opciones cuando te vas')}</h2>
      <VisualFrame lang={lang} label={L('your 4 choices when you leave', 'tus 4 opciones cuando te vas')} words={words} controls={cards} />
      <div style={{ fontSize: 13, color: C.textMuted }}>{L("Each choice has trade-offs. Your plan's website walks you through the steps.", 'Cada opción tiene sus ventajas y desventajas. El sitio web de tu plan te guía en los pasos.')}</div>
    </section>
  );
}
