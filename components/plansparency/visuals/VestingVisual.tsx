'use client';

import React, { useState } from 'react';
import { C } from '../theme';
import { VisualFrame } from './VisualFrame';
import { vestingSteps, vestingWords } from '@/lib/plan/visuals';

interface Props { planData: any; lang: 'en' | 'es' }

// Visual 2: when employer money is yours to keep. Replaces the old vesting slider block.
export function VestingVisual({ planData, lang }: Props) {
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const v = vestingSteps(planData, lang);
  const [years, setYears] = useState(3);
  if (!v) return null;

  const label = L('when employer money is yours to keep', 'cuándo es tuyo el dinero del empleador');
  const words = vestingWords(v, lang);

  if (v.immediate) {
    return (
      <VisualFrame lang={lang} label={label} words={L('All of the money your employer adds is 100% yours right away. Your own savings are always 100% yours.', 'Todo el dinero que agrega tu empleador es 100% tuyo de inmediato. Tus propios ahorros siempre son 100% tuyos.')}>
        <div style={{ height: 44, borderRadius: 12, background: C.green, color: C.onPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
          {L('100% yours right away', '100% tuyo de inmediato')}
        </div>
      </VisualFrame>
    );
  }

  const top = v.maxYears + 1;
  const n = Math.min(years, top);
  const at = (byYear: number[], year: number) => byYear[Math.min(year, v.maxYears)];
  const label1 = (i: number) => (i === 0 ? L('Start', 'Inicio') : i === top ? `${top}+ ${L('yrs', 'años')}` : L(`Yr ${i}`, `Año ${i}`));
  const pcts = v.sources.map((s) => ({ label: s.label, pct: at(s.byYear, n) }));
  const same = pcts.every((p) => p.pct === pcts[0].pct);
  const keep = same
    ? L(`You keep ${pcts[0].pct}% of the money your employer added.`, `Te quedas con ${pcts[0].pct}% del dinero que agregó tu empleador.`)
    : L('You keep: ', 'Te quedas con: ') + pcts.map((p) => `${p.label} ${p.pct}%`).join(', ') + '.';

  const controls = (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: C.text }}>
        <label htmlFor="vest-years">{L('If you work here', 'Si trabajas aquí')} {n === top ? `${top}+` : n} {L('years', 'años')}</label>
      </div>
      <input id="vest-years" type="range" min={0} max={top} step={1} value={n} onChange={(e) => setYears(Number(e.target.value))}
        aria-valuetext={n === top ? L(`${top} or more years`, `${top} años o más`) : L(`${n} years`, `${n} años`)} style={{ width: '100%', height: 44, accentColor: C.accent }} />
    </div>
  );

  const summary = (
    <div style={{ padding: '12px 14px', borderRadius: 12, background: C.greenSoft, color: C.green, fontSize: 15, fontWeight: 600 }}>
      {keep} {L('Your own savings are always 100% yours.', 'Tus propios ahorros siempre son 100% tuyos.')}
    </div>
  );

  return (
    <VisualFrame lang={lang} label={label} words={words} controls={controls} summary={summary}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {v.sources.map((s) => (
          <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {v.sources.length > 1 && <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.label}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${top + 1}, minmax(0, 1fr))`, gap: 6, alignItems: 'end' }}>
              {Array.from({ length: top + 1 }, (_, i) => {
                const pct = at(s.byYear, i);
                const bg = i === n ? C.accent : i < n ? C.accentBorder : C.borderLight;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{pct}%</span>
                    <div style={{ width: '100%', height: 90, display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ width: '100%', height: `${Math.max(3, pct)}%`, borderRadius: '6px 6px 0 0', background: bg, transition: 'height .2s' }} />
                    </div>
                    <span style={{ fontSize: 12, color: C.textMuted, whiteSpace: 'nowrap' }}>{label1(i)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </VisualFrame>
  );
}
