'use client';

import React from 'react';
import { C } from './theme';

interface StockAnswerCardProps {
  text: string;
  link?: 'calculator';
  stockId?: string;
  review?: { reviewerName?: string; reviewedAt?: string } | null;
  onOpenCalculator: () => void;
}

// One stock answer, laid out as in the approved "Stock answers, button taps" canvas.
export function StockAnswerCard({ text, link, stockId, review, onOpenCalculator }: StockAnswerCardProps) {
  const reviewer = review?.reviewerName && review.reviewerName.trim() ? review.reviewerName.trim() : '';
  const when = review?.reviewedAt
    ? new Date(review.reviewedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';
  const paragraphs = text.split('\n\n');

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20, border: `1px solid ${C.border}`, borderRadius: '4px 16px 16px 16px', background: C.surface, maxWidth: '100%' }}>
      <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 100, background: reviewer ? C.greenSoft : C.accentSoft, color: reviewer ? C.green : C.accentText }}>
        {reviewer ? "From your plan's reviewed details" : 'From your plan document'}
      </span>

      {paragraphs.map((p, i) => {
        const m = p.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
        return (
          <p key={i} style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: C.text }}>
            {m ? <><strong>{m[1]}</strong> {m[2]}</> : p}
          </p>
        );
      })}

      {link === 'calculator' && (
        <button
          type="button"
          onClick={onOpenCalculator}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, minHeight: 44, fontSize: 15, fontWeight: 700, color: C.accentText, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {stockId === 'match' ? 'See it with your pay in the calculator →' : 'Open the calculator →'}
        </button>
      )}

      <div style={{ fontSize: 12, lineHeight: 1.5, color: C.textDim, paddingTop: 8, borderTop: `1px solid ${C.borderLight}` }}>
        {reviewer
          ? `Plan details reviewed by ${reviewer}${when ? ` on ${when}` : ''}. Education only, not advice.`
          : 'Based on the plan document you uploaded. Education only, not advice.'}
      </div>
    </article>
  );
}
