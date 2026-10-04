'use client';

import React, { useState } from 'react';
import { C, F } from './theme';
import { getOverview, type TopicCard } from '@/lib/plan/overview';

export type TopicKey = 'you' | 'company' | 'while' | 'leave';

interface PlanOverviewProps {
  planData: any;
  lang: 'en' | 'es';
  review?: { reviewerName?: string; reviewedAt?: string } | null;
  topic: TopicKey;
  setTopic: (t: TopicKey) => void;
  onOpenStock: (id: any) => void;
  onOpenCalculator: () => void;
  onOpenInvestments: () => void;
  hasFunds: boolean;
  fundsCount?: number;
  footer: string;
}

const label12 = { fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' } as const;
const textLink = { background: 'none', border: 'none', padding: 0, minHeight: 44, fontSize: 15, fontWeight: 700, color: C.accentText, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' } as const;

// "Your plan" tab: headline numbers, four topics, and a vesting slider when the schedule is readable.
export function PlanOverview({ planData, lang, review, topic, setTopic, onOpenStock, onOpenCalculator, onOpenInvestments, hasFunds, fundsCount, footer }: PlanOverviewProps) {
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const [years, setYears] = useState(3);
  const o = getOverview(planData, lang, { hasFunds, fundsCount });

  const reviewer = review?.reviewerName && review.reviewerName.trim() ? review.reviewerName.trim() : '';
  const when = review?.reviewedAt ? new Date(review.reviewedAt).toLocaleDateString(es ? 'es-US' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

  const topics: { key: TopicKey; title: string; sub: string }[] = [
    { key: 'you', title: L('Your money', 'Tu dinero'), sub: L('Saving from your paycheck', 'Lo que ahorras de tu cheque') },
    { key: 'company', title: L("Your employer's money", 'El dinero de tu empleador'), sub: L('Match and profit sharing', 'Match y profit sharing') },
    { key: 'while', title: L('While you work', 'Mientras trabajas'), sub: L('Loans and hardship', 'Préstamos y dificultades') },
    { key: 'leave', title: L('When you leave', 'Cuando te vas'), sub: L('What goes with you', 'Lo que se va contigo') },
  ];

  const cards: TopicCard[] = o.topics[topic];
  const v = o.vesting;
  const anyParsed = !!v && v.bars.some((b) => b.parsed && b.byYear.length > 0);
  const atMax = v ? years >= v.maxYears : false;

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <style>{`@media (max-width: 700px) { .plan-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } }`}</style>
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: C.bg, borderBottom: `1px solid ${C.borderLight}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '16px 20px 12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ ...label12, color: C.textMuted }}>{L('Your plan', 'Tu plan')}</div>
          <h1 className="plan-name" style={{ margin: 0, fontFamily: F.display, fontSize: 'clamp(24px, 4.5vw, 36px)', fontWeight: 700, lineHeight: 1.05, color: C.text }}>
            {planData?.planName || L('Your 401(k) Plan', 'Tu Plan 401(k)')}
          </h1>
          <span style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 600, padding: '5px 12px', borderRadius: 100, background: reviewer ? C.greenSoft : C.accentSoft, color: reviewer ? C.green : C.accentText }}>
            {reviewer
              ? L(`Details reviewed by ${reviewer}${when ? ` on ${when}` : ''}`, `Detalles revisados por ${reviewer}${when ? ` el ${when}` : ''}`)
              : L('Read from the document you uploaded', 'Leído del documento que subiste')}
          </span>
        </div>
      </div>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '20px 20px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Headline cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
          {o.headlines.map((h) => {
            const dark = h.key === 'employer';
            const long = h.value.length > 18;
            return (
              <div key={h.key} style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 6, background: dark ? C.text : C.surface, color: dark ? C.surface : C.text, border: dark ? 'none' : `1px solid ${C.border}` }}>
                <div style={{ ...label12, color: dark ? C.accentBorder : C.textMuted }}>{h.label}</div>
                <div style={{ fontFamily: F.display, fontSize: long ? 22 : 34, fontWeight: 700, lineHeight: long ? 1.2 : 1.05 }}>{h.value}</div>
                {h.sub && <div style={{ fontSize: 14, lineHeight: 1.5, color: dark ? C.userBubble : C.textMuted }}>{h.sub}</div>}
              </div>
            );
          })}
        </div>

        {/* Topic tabs */}
        <div role="tablist" aria-label={L('Plan topics', 'Temas del plan')} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
          {topics.map((tp, i) => {
            const sel = topic === tp.key;
            return (
              <button
                key={tp.key} role="tab" aria-selected={sel} onClick={() => setTopic(tp.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, minHeight: 64, padding: '10px 14px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  background: sel ? C.surface : C.surfaceAlt, border: sel ? `2px solid ${C.accent}` : '2px solid transparent', boxShadow: sel ? '0 6px 18px rgba(30,20,8,.06)' : 'none',
                }}
              >
                <span style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, background: sel ? C.text : C.surface, color: sel ? C.surface : C.accentText, border: sel ? 'none' : `1px solid ${C.accent}` }}>{i + 1}</span>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{tp.title}</span>
                  <span style={{ fontSize: 13, color: C.textMuted }}>{tp.sub}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Vesting slider (employer's money topic) */}
        {topic === 'company' && v && (
          <section style={{ padding: 22, borderRadius: 16, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: F.display, fontSize: 26, fontWeight: 700, color: C.text }}>{L('When is it mine to keep?', '¿Cuándo es mío?')}</h2>
              <div style={{ fontSize: 15, color: C.textMuted, marginTop: 4 }}>{L("Slide to see what's yours if you left after that many years.", 'Desliza para ver qué es tuyo si te fueras después de esa cantidad de años.')}</div>
            </div>
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
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                      {pct === null ? L('See the schedule below', 'Ve el calendario abajo') : L(`${pct}% yours`, `${pct}% tuyo`)}
                    </span>
                  </div>
                  <div style={{ height: 12, borderRadius: 100, background: C.borderLight, overflow: 'hidden' }}>
                    {pct !== null && <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? C.green : C.accent, transition: 'width .2s' }} />}
                  </div>
                </div>
              );
            })}
            {v.scheduleText && (
              <div style={{ fontSize: 13, color: C.textMuted }}>{L(`Your plan's schedule: "${v.scheduleText}"`, `El calendario de tu plan: "${v.scheduleText}"`)}</div>
            )}
          </section>
        )}

        {/* Cards */}
        {cards.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {cards.map((c) => (
              <article key={c.id} id={c.anchor} style={{ scrollMarginTop: c.anchor ? 120 : undefined, padding: 20, borderRadius: 16, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ margin: 0, fontFamily: F.display, fontSize: 24, fontWeight: 700, lineHeight: 1.1, color: C.text }}>{c.title}</h3>
                {c.fact && (
                  <span style={{ alignSelf: 'flex-start', fontSize: 14, fontWeight: 700, padding: '6px 12px', borderRadius: 100, background: c.tone === 'good' ? C.greenSoft : C.accentSoft, color: c.tone === 'good' ? C.green : C.accentText }}>{c.fact}</span>
                )}
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: C.text }}>{c.body}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 'auto' }}>
                  {c.stockId && <button type="button" style={textLink} onClick={() => onOpenStock(c.stockId)}>{L('Read the full answer →', 'Lee la respuesta completa →')}</button>}
                  {c.calc && <button type="button" style={textLink} onClick={onOpenCalculator}>{L('Try it in the calculator →', 'Pruébalo en la calculadora →')}</button>}
                  {c.investments && <button type="button" style={textLink} onClick={onOpenInvestments}>{L('See your investment options →', 'Ve tus opciones de inversión →')}</button>}
                </div>
              </article>
            ))}
          </div>
        )}

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

        <div style={{ fontSize: 12, color: C.textDim, paddingTop: 16, borderTop: `1px solid ${C.borderLight}` }}>{footer}</div>
      </div>
    </div>
  );
}
