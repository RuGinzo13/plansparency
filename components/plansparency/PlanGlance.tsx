'use client';

import React from 'react';
import { C, F } from './theme';
import type { GlanceRow } from '@/lib/plan/overview';

interface PlanGlanceProps {
  rows: GlanceRow[];
  review?: { reviewerName?: string; reviewedAt?: string } | null;
  recordkeeperName?: string;
  recordkeeperUrl?: string;
  pickedId: string | null;
  onPick: (id: GlanceRow['stockId']) => void;
  lang: 'en' | 'es';
}

// "Your plan at a glance": the plan's key details, each one opens its written answer.
export function PlanGlance({ rows, review, recordkeeperName, recordkeeperUrl, pickedId, onPick, lang }: PlanGlanceProps) {
  const es = lang === 'es';
  const reviewer = review?.reviewerName && review.reviewerName.trim() ? review.reviewerName.trim() : '';
  const when = review?.reviewedAt
    ? new Date(review.reviewedAt).toLocaleDateString(es ? 'es-US' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';
  const title = es ? 'Tu plan de un vistazo' : 'Your plan at a glance';

  return (
    <aside aria-label={title} style={{ width: '100%', boxSizing: 'border-box', maxHeight: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 20, border: `1px solid ${C.border}`, borderRadius: 16, background: C.surfaceAlt }}>
      <h2 style={{ margin: 0, fontFamily: F.display, fontSize: 24, fontWeight: 700, lineHeight: 1.1, color: C.text }}>{title}</h2>
      <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 100, background: reviewer ? C.greenSoft : C.accentSoft, color: reviewer ? C.green : C.accentText }}>
        {reviewer
          ? (es ? `Revisado por ${reviewer}${when ? ` el ${when}` : ''}` : `Reviewed by ${reviewer}${when ? ` on ${when}` : ''}`)
          : (es ? 'Leído del documento que subiste' : 'Read from the document you uploaded')}
      </span>
      <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
        {es ? 'Toca cualquier dato para ver qué significa para ti.' : 'Tap any detail to see what it means for you.'}
      </div>

      {rows.map((row) => {
        const on = row.stockId === pickedId;
        return (
          <button
            key={row.label}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(row.stockId)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 48, padding: '8px 12px', borderRadius: 10,
              textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
              background: on ? C.surface : C.aiBubble, border: on ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
            }}
          >
            <span style={{ fontSize: 13, color: C.textMuted }}>{row.label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text, textAlign: 'right' }}>{row.value}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accentText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </button>
        );
      })}

      <div style={{ fontSize: 12, color: C.textDim, paddingTop: 8, borderTop: `1px solid ${C.border}`, lineHeight: 1.5 }}>
        {es ? 'Los detalles oficiales y tu saldo están en el sitio web de tu plan.' : "Official details and your balance are on your plan's website."}
        {recordkeeperUrl && (
          <div>
            <a href={recordkeeperUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, fontSize: 14, fontWeight: 700, color: C.accentText }}>
              {es ? 'Abrir ' : 'Open '}{recordkeeperName || (es ? 'el sitio web de tu plan' : "your plan's website")} →
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
