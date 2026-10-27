'use client';

import React from 'react';
import { C, ROLE } from '../theme';
import { VisualFrame } from './VisualFrame';
import { limitBars } from '@/lib/plan/visuals';
import { fmtRounded } from '@/lib/format';

interface Props { planData: any; lang: 'en' | 'es' }

// Visual 5: how much you can put in, by age (shown in the savings limit answer).
export function LimitsVisual({ planData, lang }: Props) {
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const lb = limitBars(planData, undefined, lang);
  if (!lb) return null;
  const biggest = Math.max(...lb.rows.map((r) => r.total));
  const base = fmtRounded(lb.rows[0].base);
  const words = lb.catchUpNotOffered
    ? L(`In ${lb.year} you can save up to ${base}. Your plan doesn’t offer catch-up contributions.`, `En ${lb.year} puedes ahorrar hasta ${base}. Tu plan no ofrece contribuciones catch-up.`)
    : L(
        `In ${lb.year} you can save up to ${base}. At 50 or older you can add ${fmtRounded(lb.catchUp50)} more. At ages 60 to 63 the extra is ${fmtRounded(lb.catchUp6063)} instead.`,
        `En ${lb.year} puedes ahorrar hasta ${base}. A los 50 o más puedes agregar ${fmtRounded(lb.catchUp50)} más. Entre los 60 y 63 años el extra es ${fmtRounded(lb.catchUp6063)} en su lugar.`
      );
  const extraColor = (k: 'catchUp50' | 'catchUp6063' | null) => (k === 'catchUp6063' ? ROLE.consultant.base : C.accentBorder);
  const sq = (bg: string, border?: string) => <span style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: border ? `1px solid ${border}` : 'none', flexShrink: 0, boxSizing: 'border-box' }} />;

  return (
    <VisualFrame lang={lang} label={L(`${lb.year} savings limits`, `límites de ahorro de ${lb.year}`)} words={words}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lb.rows.map((r) => (
          <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 76px', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{r.label}</span>
            <div style={{ height: 30, display: 'flex' }}>
              <div style={{ width: `${(r.base / biggest) * 100}%`, background: C.accent, borderRadius: r.extra ? '8px 0 0 8px' : 8 }} />
              {r.extra > 0 && <div style={{ width: `${(r.extra / biggest) * 100}%`, background: extraColor(r.extraKind), borderRadius: '0 8px 8px 0', boxSizing: 'border-box', border: r.extraKind === 'catchUp50' ? `1px solid ${C.accent}` : 'none' }} />}
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text, textAlign: 'right' }}>{fmtRounded(r.total)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 12, color: C.textMuted }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{sq(C.accent)}{L('Regular limit', 'Límite regular')}</span>
          {!lb.catchUpNotOffered && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{sq(C.accentBorder, C.accent)}{L('Catch-up, 50+', 'Catch-up, 50+')}</span>}
          {!lb.catchUpNotOffered && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{sq(ROLE.consultant.base)}{L('Catch-up, ages 60 to 63', 'Catch-up, de 60 a 63 años')}</span>}
        </div>
        {lb.catchUpNotOffered && <div style={{ fontSize: 14, color: C.textMuted }}>{L('Your plan doesn’t offer catch-up contributions.', 'Tu plan no ofrece contribuciones catch-up.')}</div>}
      </div>
    </VisualFrame>
  );
}
