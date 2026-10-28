'use client';

import React from 'react';
import { C, F } from './theme';
import { Md } from './ui';
import { AnswerBand } from './AnswerBand';
import type { PillKind } from './Pill';

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
  // The pill kind of this card; colors the answer band.
  kind?: PillKind;
  // The link to the card where the money does come from (a No card has this instead of a picture).
  link?: { text: string; onClick: () => void } | null;
  children?: React.ReactNode; // extra block after the answer (the picture for that card)
}

// The band is the first sentence; the rest follows. A bold lead that ends with ":" is a label, so the band takes its paragraph too.
function splitAnswer(text: string): { band: string; rest: string[] } {
  const paras = text.split('\n\n');
  const m = paras[0].match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
  if (m) {
    const lead = m[1].trim();
    if (lead.endsWith(':') && m[2].trim()) return { band: `${lead} ${m[2].trim()}`, rest: paras.slice(1) };
    return { band: lead, rest: [m[2].trim(), ...paras.slice(1)].filter(Boolean) };
  }
  const first = paras[0].match(/^([\s\S]+?[.!?])(?:\s+([\s\S]*))?$/);
  return first ? { band: first[1], rest: [first[2] ?? '', ...paras.slice(1)].filter(Boolean) } : { band: paras[0], rest: paras.slice(1) };
}

// What opens inside a card: the written answer built from the plan's details, or an AI answer.
export function AnswerBody({ written, ai, lang, stockId, review, recordkeeper, advisorEmail, errorText, onOpenCalculator, onRetry, kind = 'info', link, children }: AnswerBodyProps) {
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const reviewer = review?.reviewerName && review.reviewerName.trim() ? review.reviewerName.trim() : '';
  const when = review?.reviewedAt
    ? new Date(review.reviewedAt).toLocaleDateString(es ? 'es-US' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';
  const textLink = { background: 'none', border: 'none', padding: 0, minHeight: 44, fontSize: 15, fontWeight: 700, color: C.accentText, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' } as const;

  // ONE source line closes every answer.
  const source = (text: string) => (
    <div style={{ fontSize: 12, lineHeight: 1.5, color: C.textDim, paddingTop: 10, borderTop: `1px solid ${C.borderLight}` }}>{text}</div>
  );
  const sourceText = reviewer
    ? L("From your plan's reviewed details · Education only, not advice.", 'De los datos revisados de tu plan · Solo educación, no es asesoría.')
    : L('From your plan document · Education only, not advice.', 'Del documento de tu plan · Solo educación, no es asesoría.');
  const linkButton = link && <button type="button" onClick={link.onClick} style={{ ...textLink, fontSize: 16 }}>{link.text}</button>;

  if (written) {
    const { band, rest } = splitAnswer(written.text);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnswerBand kind={kind}>{band}</AnswerBand>
        {rest.map((p, i) => {
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
        {linkButton}
        {children}
        {source(sourceText)}
      </div>
    );
  }

  const status = ai?.status ?? 'waiting';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
        (() => {
          // An AI answer that opens with a bold lead gets the same band as a written one.
          const sp = /^\*\*[^*]+\*\*/.test(ai.text.trim()) ? splitAnswer(ai.text.trim()) : null;
          return (
            <>
              {sp && <AnswerBand kind={kind}>{sp.band}</AnswerBand>}
              <div style={{ fontSize: 16, lineHeight: 1.6, color: C.text }}><Md text={sp ? sp.rest.join('\n\n') : ai.text} /></div>
            </>
          );
        })()
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
      {linkButton}
      {children}
      {source(L('Written by AI from your plan document · Education only, not advice.', 'Escrito por IA a partir del documento de tu plan · Solo educación, no es asesoría.'))}
    </div>
  );
}
