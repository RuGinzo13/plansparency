'use client';

import React from 'react';
import type { RefObject } from 'react';
import { C, F, LAYOUT } from './theme';
import { getOverview, type TopicKey } from '@/lib/plan/overview';
import { AnswerBody, type CardAI } from './AnswerBody';
import { PlanGlance } from './PlanGlance';
import { CardVisual } from './visuals/CardVisual';
import { LeaveChoicesVisual } from './visuals/LeaveChoicesVisual';
import { WatchVideo } from './video/WatchButton';
import type { VideoId } from '@/lib/videos/types';

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
  layoutRef: RefObject<HTMLDivElement | null>;
  sticky: { twoCol: boolean; top: number; height: number; headerH: number };
  // The focus strip, shown above the topic tabs when the person picked a focus.
  focusSlot?: React.ReactNode;
  // Side panel groups to show first (empty: all).
  focusTopics?: ('you' | 'employer' | 'access')[];
}

// The video that belongs at the top of each answer card.
const CARD_VIDEO: Record<string, VideoId> = { safeHarbor: 'match', match: 'match', vesting: 'vesting', roth: 'taxes', limit: 'limits', elig: 'limits' };


// "Your plan": topic tabs, question cards that open in place, and the grouped panel.
export function PlanOverview(p: PlanOverviewProps) {
  const { planData, lang, review, topic, openCardId, sticky } = p;
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const o = getOverview(planData, lang);

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
  return (
    <div ref={p.scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
      <div ref={p.layoutRef} style={{ maxWidth: LAYOUT.page, margin: '0 auto', padding: '40px 20px 48px', boxSizing: 'border-box', display: 'flex', flexWrap: 'wrap', flexDirection: 'row-reverse', gap: 28, alignItems: 'flex-start' }}>
        <main style={{ flex: '999 1 540px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {p.focusSlot}

          {/* Topic tabs */}
          <div role="tablist" aria-label={L('Plan topics', 'Temas del plan')} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
            {topics.map((tp, i) => {
              const sel = topic === tp.key;
              return (
                <button key={tp.key} role="tab" aria-selected={sel} onClick={() => p.onSelectTopic(tp.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 60, padding: '8px 12px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', background: sel ? C.surface : C.surfaceAlt, border: sel ? `2px solid ${C.accent}` : '2px solid transparent', boxShadow: sel ? `0 6px 18px ${C.shadow}` : 'none' }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: sel ? C.text : C.surface, color: sel ? C.surface : C.accentText, border: sel ? 'none' : `1px solid ${C.accent}` }}>{i + 1}</span>
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{tp.title}</span>
                    <span style={{ fontSize: 12, color: C.textMuted }}>{tp.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {topic === 'access' && <WatchVideo id="access" placeKey="topic:access" />}
          {topic === 'leave' && <WatchVideo id="leave" placeKey="topic:leave" />}

          {/* Cards */}
          {cards.map((c) => {
            const open = openCardId === c.id;
            const written = p.getWritten(c.id);
            return (
              <article key={c.id} id={`card-${c.id}`} style={{ borderRadius: 16, background: C.surface, border: open ? `2px solid ${C.accent}` : `1px solid ${C.border}`, scrollMarginTop: sticky.headerH + 12 }}>
                <button type="button" aria-expanded={open} aria-controls={`card-body-${c.id}`} onClick={() => p.onToggleCard(c.id)}
                  style={{ width: '100%', minHeight: 64, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span style={{ flex: '1 1 240px', fontFamily: F.display, fontSize: 24, fontWeight: 700, lineHeight: 1.1, color: C.text }}>{c.question}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, padding: '5px 12px', borderRadius: 100, background: c.tone === 'good' ? C.greenSoft : C.accentSoft, color: c.tone === 'good' ? C.green : C.accentText }}>{c.fact}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accentText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {open && (
                  <div id={`card-body-${c.id}`} style={{ padding: '0 20px 20px' }}>
                    {CARD_VIDEO[c.id] && <div style={{ marginBottom: 14 }}><WatchVideo id={CARD_VIDEO[c.id]} placeKey={`card:${c.id}`} /></div>}
                    <AnswerBody
                      written={written} ai={p.getAI(c.id)} lang={lang} stockId={c.id} review={review}
                      recordkeeper={{ name: rkName, url: rkUrl }} advisorEmail={advisor?.email}
                      errorText={p.errorText} onOpenCalculator={p.onOpenCalculator} onRetry={() => p.onRetry(c.id)}
                    >
                      <CardVisual id={c.id} planData={planData} lang={lang} />
                    </AnswerBody>
                  </div>
                )}
              </article>
            );
          })}

          {/* Leave choices */}
          {topic === 'leave' && <LeaveChoicesVisual options={o.leaveOptions} lang={lang} />}

          <div style={{ fontSize: 12, color: C.textDim, paddingTop: 16, borderTop: `1px solid ${C.borderLight}` }}>{p.footer}</div>
        </main>

        <div style={{ flex: '1 1 300px', maxWidth: 400, minWidth: 0, ...(sticky.twoCol ? { position: 'sticky', top: sticky.top, height: sticky.height, display: 'flex', alignItems: 'center' } : {}) }}>
          <PlanGlance groups={o.groups} activeTopic={topic} onPick={(tp, id) => p.onPickRow(tp, id)} lang={lang} focusTopics={p.focusTopics} key={(p.focusTopics ?? []).join()} />
        </div>
      </div>
    </div>
  );
}
