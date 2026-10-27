'use client';

import React, { useState } from 'react';
import { C, F } from '../theme';
import { VisualFrame } from './VisualFrame';
import { employerMoneyAt, matchPhrases, EXAMPLE_PAY } from '@/lib/plan/visuals';
import { fmtRounded } from '@/lib/format';

interface Props { planData: any; lang: 'en' | 'es' }

const rowLabel = { fontSize: 14, fontWeight: 600, color: C.text } as const;
const amountStyle = { fontSize: 14, fontWeight: 700, color: C.text, textAlign: 'right' } as const;

// Visual 1: how much your employer adds, at the % of pay the person picks (example pay $50,000).
export function EmployerMoneyVisual({ planData, lang }: Props) {
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const info = employerMoneyAt(planData, 0);
  const start = info ? Math.max(0, info.pctForFull - 2) : 0;
  const [pct, setPct] = useState(start);
  if (!info) return null;

  const max = Math.max(10, info.pctForFull);
  const now = employerMoneyAt(planData, pct)!;
  const scale = Math.max((EXAMPLE_PAY * max) / 100, info.fullEmployer);
  const w = (n: number) => `${Math.min(100, (n / scale) * 100)}%`;
  const missing = Math.max(0, info.fullEmployer - now.employer);
  const gettingAll = missing < 0.5;

  const mp = matchPhrases(planData, lang);
  const how = mp ? [...mp.phrases, ...(mp.flat ? [mp.flat] : [])].join(L(', then ', ', luego ')) : '';
  const full = fmtRounded(info.fullEmployer);
  const words = (how ? L(`Your employer adds ${how}. `, `Tu empleador agrega ${how}. `) : '')
    + (info.pctForFull === 0
      ? L(`You don’t have to save anything to get all of it: ${full} a year on $50,000 pay.`, `No tienes que ahorrar nada para recibir todo: ${full} al año con un salario de $50,000.`)
      : L(`Saving ${info.pctForFull}% gets all of it: ${full} a year on $50,000 pay.`, `Ahorrar ${info.pctForFull}% te da todo: ${full} al año con un salario de $50,000.`));

  const controls = (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <label htmlFor="em-pct" style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{L('If you save', 'Si ahorras')} {pct}% {L('of pay', 'del salario')}</label>
        <span aria-hidden="true" style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: C.accentText }}>{pct}%</span>
      </div>
      <input id="em-pct" type="range" min={0} max={max} step={1} value={pct} onChange={(e) => setPct(Number(e.target.value))}
        aria-valuetext={L(`${pct} percent`, `${pct} por ciento`)} style={{ width: '100%', height: 44, accentColor: C.accent }} />
    </div>
  );

  const summary = gettingAll ? (
    <div style={{ padding: '12px 14px', borderRadius: 12, background: C.greenSoft, color: C.green, fontSize: 15, fontWeight: 600 }}>
      {L(`You’re getting all ${full} your employer offers.`, `Estás recibiendo los ${full} que ofrece tu empleador.`)}
    </div>
  ) : (
    <div style={{ padding: '12px 14px', borderRadius: 12, background: C.warningDim, color: C.warning, fontSize: 15, fontWeight: 600 }}>
      {L(
        `You’re getting ${fmtRounded(now.employer)}. Saving ${info.pctForFull}% would add ${fmtRounded(missing)} more a year (the striped part).`,
        `Estás recibiendo ${fmtRounded(now.employer)}. Ahorrar ${info.pctForFull}% agregaría ${fmtRounded(missing)} más al año (la parte rayada).`
      )}
    </div>
  );

  return (
    <VisualFrame lang={lang} label={L('how much your employer adds', 'cuánto agrega tu empleador')} words={words} controls={controls} summary={summary} example>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 76px', alignItems: 'center', gap: 10 }}>
          <span style={rowLabel}>{L('You save', 'Tú ahorras')}</span>
          <div style={{ height: 28, borderRadius: 8, background: C.surfaceAlt, overflow: 'hidden' }}>
            <div style={{ width: w(now.you), height: '100%', background: C.bar, transition: 'width .2s' }} />
          </div>
          <span style={amountStyle}>{fmtRounded(now.you)}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 76px', alignItems: 'center', gap: 10 }}>
          <span style={rowLabel}>{L('Employer adds', 'Empleador agrega')}</span>
          <div style={{ height: 28, borderRadius: 8, background: C.surfaceAlt, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: w(now.employer), height: '100%', background: C.green, transition: 'width .2s' }} />
            {!gettingAll && (
              <div style={{ width: w(missing), height: '100%', border: `1px dashed ${C.warning}`, boxSizing: 'border-box', background: `repeating-linear-gradient(45deg, ${C.warningDim} 0 6px, ${C.stripe} 6px 12px)`, transition: 'width .2s' }} />
            )}
          </div>
          <span style={amountStyle}>{fmtRounded(now.employer)}</span>
        </div>
      </div>
    </VisualFrame>
  );
}
