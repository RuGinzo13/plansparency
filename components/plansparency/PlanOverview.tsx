'use client';

import React, { useState } from 'react';
import type { RefObject } from 'react';
import { C, F } from './theme';
import { getOverview, type TopicKey } from '@/lib/plan/overview';
import { AnswerBody, type CardAI } from './AnswerBody';
import { PlanGlance } from './PlanGlance';

export type { TopicKey };

export interface AdvisorInfo { name: string; firm?: string; email?: string }

interface PlanOverviewProps {
  planData: any;
  lang: 'en' | 'es';
  review?: { reviewerName?: string; reviewedAt?: string } | null;
  // TODO(#31/#34): the linked advisor account supplies this once advisor accounts exist.
  // Until then the advisor comes from the plan document (planData.advisorName / advisorFirm / advisorEmail).
  advisor?: AdvisorInfo | null;
  topic: TopicKey;
  onSelectTopic: (t: TopicKey) => void;
  openCardId: string | null;
  onToggleCard: (id: string) => void;
  onPickRow: (topic: TopicKey, cardId: string) => void;
  getWritten: (id: string) => { text: string; link?: 'calculator' } | null;
  getAI: (id: string) => CardAI | null;
  onRetry: (id: string) => void;
  onOpenCalculator: () => void;
  errorText: string;
  footer: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  headerRef: RefObject<HTMLDivElement | null>;
  layoutRef: RefObject<HTMLDivElement | null>;
  sticky: { twoCol: boolean; top: number; height: number; headerH: number };
}

const label12 = { fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' } as const;
const small11 = { fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.textMuted } as const;

// "Your plan": top bar, topic tabs, question cards that open in place, and the grouped panel.
export function PlanOverview(p: PlanOverviewProps) {
  const { planData, lang, review, topic, openCardId, sticky } = p;
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const [years, setYears] = useState(3);
  const o = getOverview(planData, lang);

  const reviewer = review?.reviewerName && review.reviewerName.trim() ? review.reviewerName.trim() : '';
  const when = review?.reviewedAt ? new Date(review.reviewedAt).toLocaleDateString(es ? 'es-US' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  const advisor: AdvisorInfo | null = p.advisor ?? (planData?.advisorName ? { name: planData.advisorName, firm: planData.advisorFirm, email: planData.advisorEmail } : null);
  const rkName: string | undefined = planData?.recordkeeperName;
  const rkUrl: string | undefined = typeof planData?.recordkeeperUrl === 'string' && planData.recordkeeperUrl.startsWith('https://') ? planData.recordkeeperUrl : undefined;

  const topics: { key: TopicKey; title: string; sub: string }[] = [
    { key: 'you', title: L('Your money', 'Tu dinero'), sub: L('Saving from your pay', 'Lo que ahorras de tu pago') },
    { key: 'employer', title: L('Employer money', 'Dinero del empleador'), sub: L('Match and profit sharing', 'Match y profit sharing') },
    { key: 'access', title: L('Access my money', 'Acceso a tu dinero'), sub: L('Loans and withdrawals', 'Préstamos y retiros') },
    { key: 'leave', title: L('When you leave', 'Cuando te vas'), sub: L('What goes with you', 'Lo que se va contigo') },
  ];
  const cards = o.topics[topic];
  const v = o.vesting;

  const vestingBlock = v ? (() => {
    const anyParsed = v.bars.some((b) => b.parsed && b.byYear.length > 0);
    const atMax = years >= v.maxYears;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, borderRadius: 12, background: C.surfaceAlt }}>
        <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.text }}>{L('When is it mine to keep?', '¿Cuándo es mío?')}</div>
        <div style={{ fontSize: 14, color: C.textMuted }}>{L("Slide to see what's yours if you left after that many years.", 'Desliza para ver qué es tuyo si te fueras después de esa cantidad de años.')}</div>
        {anyParsed && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: C.text }}>
              <label htmlFor="vest-years">{L('Years worked here', 'Años trabajados aquí')}</label>
              <span>{atMax ? `${v.maxYears}+ ${L('years', 'años')}` : `${years} ${L('years', 'años')}`}</span>
            </div>
            <input id="vest-years" type="range" min={0} max={v.maxYears} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} style={{ width: '100%', height: 44, accentColor: C.accent }} />
          </div>
        )}
        {v.bars.map((b) => {
          const pct = b.parsed && b.byYear.length > 0 ? b.byYear[Math.min(years, b.byYear.length - 1)] : null;
          return (
            <div key={b.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{b.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{pct === null ? L('See the schedule below', 'Ve el calendario abajo') : L(`${pct}% yours`, `${pct}% tuyo`)}</span>
              </div>
              <div style={{ height: 12, borderRadius: 100, background: C.borderLight, overflow: 'hidden' }}>
                {pct !== null && <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? C.green : C.accent, transition: 'width .2s' }} />}
              </div>
            </div>
          );
        })}
        {v.scheduleText && <div style={{ fontSize: 13, color: C.textMuted }}>{L(`Your plan's schedule: "${v.scheduleText}"`, `El calendario de tu plan: "${v.scheduleText}"`)}</div>}
      </div>
    );
  })() : null;

  return (
    <div ref={p.scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
      <style>{`@media (max-width: 700px) { .plan-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } }`}</style>

      {/* Top bar */}
      <div ref={p.headerRef} style={{ position: 'sticky', top: 0, zIndex: 5, background: C.accentSoft, borderBottom: `2px solid ${C.accentBorder}`, boxShadow: '0 8px 20px rgba(30,20,8,.07)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 20px', boxSizing: 'border-box', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px 32px' }}>
          <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ ...label12, color: C.textMuted }}>{L('Your plan', 'Tu plan')}</div>
            <h1 className="plan-name" style={{ margin: 0, fontFamily: F.display, fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 700, lineHeight: 1.1, color: C.text }}>{planData?.planName || L('Your 401(k) Plan', 'Tu Plan 401(k)')}</h1>
            <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 100, background: reviewer ? C.greenSoft : C.accentDim, color: reviewer ? C.green : C.accentText }}>
              {reviewer ? L(`Details reviewed by ${reviewer}${when ? ` on ${when}` : ''}`, `Detalles revisados por ${reviewer}${when ? ` el ${when}` : ''}`) : L('Read from the document you uploaded', 'Leído del documento que subiste')}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 28px' }}>
            {advisor && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={small11}>{L('Your advisor', 'Tu asesor')}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{advisor.firm ? `${advisor.name}, ${advisor.firm}` : advisor.name}</div>
                {advisor.email && <a href={`mailto:${advisor.email}`} style={{ fontSize: 14, fontWeight: 600, color: C.accentText }}>{advisor.email}</a>}
              </div>
            )}
            {rkName && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={small11}>{L('Recordkeeper', 'Administrador del plan')}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{rkName}</div>
                {rkUrl && <a href={rkUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: C.accentText }}>{L('Log in to your account ↗', 'Entra a tu cuenta ↗')}</a>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div ref={p.layoutRef} style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 20px 48px', boxSizing: 'border-box', display: 'flex', flexWrap: 'wrap', flexDirection: 'row-reverse', gap: 28, alignItems: 'flex-start' }}>
        <main style={{ flex: '999 1 540px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Topic tabs */}
          <div role="tablist" aria-label={L('Plan topics', 'Temas del plan')} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
            {topics.map((tp, i) => {
              const sel = topic === tp.key;
              return (
                <button key={tp.key} role="tab" aria-selected={sel} onClick={() => p.onSelectTopic(tp.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 60, padding: '8px 12px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', background: sel ? C.surface : C.surfaceAlt, border: sel ? `2px solid ${C.accent}` : '2px solid transparent', boxShadow: sel ? '0 6px 18px rgba(30,20,8,.06)' : 'none' }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: sel ? C.text : C.surface, color: sel ? C.surface : C.accentText, border: sel ? 'none' : `1px solid ${C.accent}` }}>{i + 1}</span>
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{tp.title}</span>
                    <span style={{ fontSize: 12, color: C.textMuted }}>{tp.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cards */}
          {cards.map((c) => {
            const open = openCardId === c.id;
            const written = p.getWritten(c.id);
            return (
              <article key={c.id} id={`card-${c.id}`} style={{ borderRadius: 16, background: C.surface, border: open ? `2px solid ${C.accent}` : `1px solid ${C.border}`, scrollMarginTop: sticky.headerH + 12 }}>
                <button type="button" aria-expanded={open} onClick={() => p.onToggleCard(c.id)}
                  style={{ width: '100%', minHeight: 64, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span style={{ flex: '1 1 240px', fontFamily: F.display, fontSize: 24, fontWeight: 700, lineHeight: 1.1, color: C.text }}>{c.question}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, padding: '5px 12px', borderRadius: 100, background: c.tone === 'good' ? C.greenSoft : C.accentSoft, color: c.tone === 'good' ? C.green : C.accentText }}>{c.fact}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accentText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {open && (
                  <div style={{ padding: '0 20px 20px' }}>
                    <AnswerBody
                      written={written} ai={p.getAI(c.id)} lang={lang} stockId={c.id} review={review}
                      recordkeeper={{ name: rkName, url: rkUrl }} advisorEmail={advisor?.email}
                      errorText={p.errorText} onOpenCalculator={p.onOpenCalculator} onRetry={() => p.onRetry(c.id)}
                    >
                      {c.id === 'vesting' ? vestingBlock : null}
                    </AnswerBody>
                  </div>
                )}
              </article>
            );
          })}

          {/* Leave choices */}
          {topic === 'leave' && (
            <section style={{ padding: 22, borderRadius: 16, background: C.surfaceAlt, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h2 style={{ margin: 0, fontFamily: F.display, fontSize: 26, fontWeight: 700, color: C.text }}>{L('Your 4 choices when you leave', 'Tus 4 opciones cuando te vas')}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                {o.leaveOptions.map((opt) => (
                  <div key={opt.title} style={{ padding: 16, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{opt.title}</div>
                    <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: opt.warning ? C.warningDim : C.greenSoft, color: opt.warning ? C.warning : C.green }}>{opt.tag}</span>
                    <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.5 }}>{opt.body}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: C.textMuted }}>{L("Each choice has trade-offs. Your plan's website walks you through the steps.", 'Cada opción tiene sus ventajas y desventajas. El sitio web de tu plan te guía en los pasos.')}</div>
            </section>
          )}

          <div style={{ fontSize: 12, color: C.textDim, paddingTop: 16, borderTop: `1px solid ${C.borderLight}` }}>{p.footer}</div>
        </main>

        <div style={{ flex: '1 1 300px', maxWidth: 360, minWidth: 0, ...(sticky.twoCol ? { position: 'sticky', top: sticky.top, height: sticky.height, display: 'flex', alignItems: 'center' } : {}) }}>
          <PlanGlance groups={o.groups} activeTopic={topic} onPick={(tp, id) => p.onPickRow(tp, id)} lang={lang} />
        </div>
      </div>
    </div>
  );
}
