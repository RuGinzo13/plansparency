'use client';

import React from 'react';
import { C, F } from './theme';
import { Md } from './ui';

export interface CardAI { status: 'waiting' | 'loading' | 'done' | 'error'; text: string }

interface AnswerBodyProps {
  written: { text: string; link?: 'calculator' } | null;
  ai?: CardAI | null;
  lang: 'en' | 'es';
  stockId: string;
  review?: { reviewerName?: string; reviewedAt?: string } | null;
  recordkeeper?: { name?: string; url?: string };
  advisorEmail?: string;
  errorText: string;
  onOpenCalculator: () => void;
  onRetry: () => void;
  children?: React.ReactNode; // extra block after the answer (the vesting slider)
}

// What opens inside a card: the written answer built from the plan's details, or an AI answer.
export function AnswerBody({ written, ai, lang, stockId, review, recordkeeper, advisorEmail, errorText, onOpenCalculator, onRetry, children }: AnswerBodyProps) {
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const reviewer = review?.reviewerName && review.reviewerName.trim() ? review.reviewerName.trim() : '';
  const when = review?.reviewedAt
    ? new Date(review.reviewedAt).toLocaleDateString(es ? 'es-US' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';
  const badge = (text: string, bg: string, fg: string) => (
    <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 100, background: bg, color: fg }}>{text}</span>
  );
  const textLink = { background: 'none', border: 'none', padding: 0, minHeight: 44, fontSize: 15, fontWeight: 700, color: C.accentText, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' } as const;

  if (written) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reviewer ? badge("From your plan's reviewed details", C.greenSoft, C.green) : badge('From your plan document', C.accentSoft, C.accentText)}
        {written.text.split('\n\n').map((p, i) => {
          const m = p.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
          return (
            <p key={i} style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: C.text }}>
              {m ? <><strong>{m[1]}</strong> {m[2]}</> : p}
            </p>
          );
        })}
        {written.link === 'calculator' && (
          <button type="button" onClick={onOpenCalculator} style={textLink}>
            {stockId === 'safeHarbor' || stockId === 'match' ? 'See it with your pay in the calculator →' : 'Open the calculator →'}
          </button>
        )}
        {children}
        <div style={{ fontSize: 12, lineHeight: 1.5, color: C.textDim, paddingTop: 8, borderTop: `1px solid ${C.borderLight}` }}>
          {reviewer
            ? `Plan details reviewed by ${reviewer}${when ? ` on ${when}` : ''}. Education only, not advice.`
            : 'Based on the plan document you uploaded. Education only, not advice.'}
        </div>
      </div>
    );
  }

  const status = ai?.status ?? 'waiting';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {badge(L('Written by AI from your plan document', 'Escrito por IA a partir del documento de tu plan'), C.warningDim, C.warning)}
      {status === 'waiting' && <div style={{ fontSize: 15, color: C.textMuted }}>{L('One moment…', 'Un momento…')}</div>}
      {(status === 'loading' && !ai?.text) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: C.textMuted }}>
          <span style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, opacity: 0.5, animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}
          </span>
          {L('Reading your plan document…', 'Leyendo el documento de tu plan…')}
        </div>
      )}
      {(status === 'loading' || status === 'done') && ai?.text ? (
        <div style={{ fontSize: 16, lineHeight: 1.6, color: C.text }}><Md text={ai.text} /></div>
      ) : null}
      {status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 15, color: C.danger }}>{errorText}</div>
          <button type="button" onClick={onRetry} style={textLink}>{L('Try again', 'Intentar de nuevo')}</button>
        </div>
      )}
      {status === 'done' && (
        <div style={{ paddingTop: 8, borderTop: `1px solid ${C.borderLight}`, fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          <strong style={{ color: C.text }}>{L('Want to double-check?', '¿Quieres verificarlo?')}</strong>{' '}
          {recordkeeper?.url && recordkeeper.url.startsWith('https://') && (
            <a href={recordkeeper.url} target="_blank" rel="noopener noreferrer" style={{ color: C.accentText, fontWeight: 600 }}>
              {L(`Log in to ${recordkeeper.name || 'your plan'}`, `Entra a ${recordkeeper.name || 'tu plan'}`)} ↗
            </a>
          )}
          {advisorEmail && (
            <>{' '}<a href={`mailto:${advisorEmail}`} style={{ color: C.accentText, fontWeight: 600 }}>{L('Email your advisor', 'Escribe a tu asesor')}</a></>
          )}
          {!recordkeeper?.url && !advisorEmail && L("Your plan's website or HR can confirm it.", 'El sitio web de tu plan o Recursos Humanos lo pueden confirmar.')}
        </div>
      )}
      {children}
    </div>
  );
}
