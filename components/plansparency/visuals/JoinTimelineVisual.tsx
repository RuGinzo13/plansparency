'use client';

import React from 'react';
import { C } from '../theme';
import { VisualFrame } from './VisualFrame';
import { joinSteps } from '@/lib/plan/visuals';

interface Props { planData: any; lang: 'en' | 'es' }

// Visual 3: your first steps, on a timeline (shown in the "When can I start saving?" answer).
export function JoinTimelineVisual({ planData, lang }: Props) {
  const es = lang === 'es';
  const steps = joinSteps(planData, lang);
  if (!steps) return null;
  const fill = { start: C.bar, join: C.bar, entry: C.accent, employer: C.green } as const;
  const words = steps.map((s) => `${s.title}: ${s.detail.replace(/[.\s]+$/, '')}.`).join(' ');
  return (
    <VisualFrame lang={lang} label={es ? 'tus primeros pasos' : 'your first steps'} words={words}>
      <div className="vz-steps" style={{ ['--n' as string]: steps.length }}>
        <div className="vz-line" style={{ position: 'absolute', left: '6%', right: '6%', top: 20, height: 3, background: C.border }} />
        {steps.map((s, i) => (
          <div key={s.kind} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <span style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: fill[s.kind], color: C.onPrimary, fontSize: 18, fontWeight: 700, border: `3px solid ${C.surface}`, boxSizing: 'border-box' }}>{i + 1}</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{s.title}</div>
            <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.4 }}>{s.detail}</div>
          </div>
        ))}
      </div>
    </VisualFrame>
  );
}
