'use client';

import React from 'react';
import { C } from './theme';
import { focusTitle, type FocusId } from '@/lib/plan/focus';

interface Props {
  picks: FocusId[];
  current: number;
  lang: 'en' | 'es';
  onChip: (index: number) => void;
  onNext: () => void;
  onChange: () => void;
  // The × button: hide the strip for this visit.
  onHide: () => void;
  // Extra content next to the chips (the "Watch first" button).
  extra?: React.ReactNode;
}

// Shows what the person picked to focus on, with a chip for each, the next pick and a way to change them.
export function FocusStrip({ picks, current, lang, onChip, onNext, onChange, onHide, extra }: Props) {
  const es = lang === 'es';
  if (picks.length === 0) return null;
  const next = picks[current + 1];
  const btn = { minHeight: 40, borderRadius: 100, padding: '0 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' } as const;
  return (
    <section aria-label={es ? 'Tu enfoque' : 'Your focus'} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '12px 56px 12px 16px', position: 'relative', borderRadius: 14, background: C.highlight, border: `1px solid ${C.accentBorder}` }}>
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.accentText }}>{es ? 'Tu enfoque' : 'Your focus'}</span>
      {picks.map((id, i) => {
        const on = i === current;
        return (
          <button key={id} type="button" aria-pressed={on} onClick={() => onChip(i)}
            style={{ ...btn, background: on ? C.accent : C.surface, color: on ? C.onPrimary : C.accentText, border: `1px solid ${on ? C.accent : C.accentBorder}` }}>
            {focusTitle(id, lang)}
          </button>
        );
      })}
      {extra}
      {next && (
        <button type="button" onClick={onNext} style={{ ...btn, border: 'none', background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary }}>
          {es ? `Siguiente: ${focusTitle(next, lang)} →` : `Next: ${focusTitle(next, lang)} →`}
        </button>
      )}
      <button type="button" onClick={onChange} style={{ ...btn, borderRadius: 12, marginLeft: 'auto', background: C.surface, color: C.accentText, border: `1px solid ${C.border}` }}>
        {es ? 'Cambiar enfoque' : 'Change focus'}
      </button>
      <button type="button" onClick={onHide} aria-label={es ? 'Ocultar tu enfoque' : 'Hide your focus'}
        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: 10, border: 'none', background: 'transparent', color: C.textMuted, fontSize: 24, lineHeight: 1, cursor: 'pointer', fontFamily: 'inherit' }}>
        <span aria-hidden="true">×</span>
      </button>
    </section>
  );
}
