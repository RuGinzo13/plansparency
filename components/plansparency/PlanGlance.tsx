'use client';

import React from 'react';
import { C, F } from './theme';
import type { PanelGroup, TopicKey } from '@/lib/plan/overview';

interface PlanGlanceProps {
  groups: PanelGroup[];
  activeTopic: TopicKey;
  onPick: (topic: PanelGroup['topic'], cardId: string) => void;
  lang: 'en' | 'es';
}

// "Your plan at a glance": three groups that follow the topic tabs. The group for the open tab is
// highlighted as a whole; every row looks the same and opens its card.
export function PlanGlance({ groups, activeTopic, onPick, lang }: PlanGlanceProps) {
  const es = lang === 'es';
  const title = es ? 'Tu plan de un vistazo' : 'Your plan at a glance';

  return (
    <aside aria-label={title} style={{ width: '100%', boxSizing: 'border-box', maxHeight: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 20, border: `1px solid ${C.border}`, borderRadius: 16, background: C.surfaceAlt }}>
      <h2 style={{ margin: 0, fontFamily: F.display, fontSize: 24, fontWeight: 700, lineHeight: 1.1, color: C.text }}>{title}</h2>
      <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{es ? 'Toca cualquier dato para abrir su respuesta.' : 'Tap any detail to open its answer.'}</div>

      {groups.map((g) => {
        const active = g.topic === activeTopic;
        return (
          <div key={g.topic} style={{ padding: 12, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 8, background: active ? C.surface : 'transparent', border: active ? `2px solid ${C.text}` : '2px solid transparent', boxShadow: active ? '0 6px 18px rgba(30,20,8,.10)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: active ? C.text : C.accentText }}>{g.label}</span>
              {active && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 100, background: C.text, color: C.surface }}>{es ? 'Viendo' : 'Showing'}</span>}
            </div>
            {g.rows.map((row) => (
              <button
                key={row.label}
                type="button"
                onClick={() => onPick(g.topic, row.card)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 48, padding: '8px 12px', borderRadius: 10, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', background: C.aiBubble, border: `1px solid ${C.border}` }}
              >
                <span style={{ fontSize: 13, color: C.textMuted }}>{row.label}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text, textAlign: 'right' }}>{row.value}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accentText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
                </span>
              </button>
            ))}
          </div>
        );
      })}
    </aside>
  );
}
