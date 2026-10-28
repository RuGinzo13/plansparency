'use client';

import React, { useState } from 'react';
import { C, F } from './theme';
import { Panel } from './Panel';
import { Pill } from './Pill';
import type { PanelGroup, TopicKey } from '@/lib/plan/overview';

interface PlanGlanceProps {
  groups: PanelGroup[];
  activeTopic: TopicKey;
  onPick: (topic: PanelGroup['topic'], cardId: string) => void;
  lang: 'en' | 'es';
  // Groups the person's focus picks start with. Empty: show every group.
  focusTopics?: PanelGroup['topic'][];
}

// "Adds up to 4% of pay" is too long for a small pill: it reads "Up to 4%" here (the card keeps the full words).
function shortValue(v: string): string {
  const m = v.match(/^(?:Adds up to|Agrega hasta) (\d+(?:\.\d+)?)% (?:of pay|del salario)$/);
  if (m) return `${v.startsWith('Adds') ? 'Up to' : 'Hasta'} ${m[1]}%`;
  const f = v.match(/^(?:Adds|Agrega) (\d+(?:\.\d+)?)% (?:of pay|del salario)$/);
  return f ? `${f[1]}%` : v;
}

// "Your plan at a glance": a short list that follows the topic tabs. The group for the open tab has a dark outline
// and says "showing". Every row opens its card.
export function PlanGlance({ groups, activeTopic, onPick, lang, focusTopics = [] }: PlanGlanceProps) {
  const es = lang === 'es';
  const [showAll, setShowAll] = useState(false);
  const narrowed = focusTopics.length > 0 && !showAll;
  const shown = narrowed ? groups.filter((g) => focusTopics.includes(g.topic)) : groups;
  const title = es ? 'Tu plan de un vistazo' : 'Your plan at a glance';
  const legend: { kind: 'yes' | 'no' | 'info' | 'ask'; text: string }[] = [
    { kind: 'yes', text: es ? 'Sí' : 'Yes' },
    { kind: 'no', text: 'No' },
    { kind: 'info', text: es ? 'Dato' : 'Fact' },
    { kind: 'ask', text: es ? 'Pregunta a RR. HH.' : 'Ask HR' },
  ];

  return (
    <Panel aria-label={title} style={{ width: '100%', maxHeight: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ margin: 0, fontFamily: F.display, fontSize: 24, fontWeight: 700, lineHeight: 1.1, color: C.text }}>{title}</h2>

      {shown.map((g) => {
        const active = g.topic === activeTopic;
        return (
          <div key={g.topic} style={{ padding: 10, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 6, border: active ? `2px solid ${C.bar}` : '2px solid transparent' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.textMuted }}>{g.label}{active ? (es ? ' · viendo' : ' · showing') : ''}</div>
            {g.rows.map((row) => (
              <button
                key={row.label}
                type="button"
                onClick={() => onPick(g.topic, row.card)}
                style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '4px 10px', minHeight: 48, padding: '6px 10px', borderRadius: 10, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', background: C.surface, border: `1px solid ${C.borderLight}` }}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{row.label}</span>
                <Pill kind={row.kind} size="sm">{shortValue(row.value)}</Pill>
              </button>
            ))}
          </div>
        );
      })}
      {narrowed && shown.length < groups.length && (
        <button type="button" onClick={() => setShowAll(true)} style={{ alignSelf: 'flex-start', minHeight: 44, padding: 0, background: 'none', border: 'none', fontSize: 15, fontWeight: 700, color: C.accentText, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>
          {es ? 'Ver todos los detalles del plan' : 'Show all plan details'}
        </button>
      )}
      <div role="group" aria-label={es ? 'Qué significa cada etiqueta' : 'What each label means'} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 10, borderTop: `1px solid ${C.borderLight}` }}>
        {legend.map((l) => <Pill key={l.kind} kind={l.kind} size="sm">{l.text}</Pill>)}
      </div>
    </Panel>
  );
}
