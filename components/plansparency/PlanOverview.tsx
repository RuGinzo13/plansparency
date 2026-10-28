'use client';

import React from 'react';
import type { RefObject } from 'react';
import { C, F, LAYOUT } from './theme';
import { getOverview, type TopicKey } from '@/lib/plan/overview';
import { AnswerBody, type CardAI } from './AnswerBody';
import { PlanGlance } from './PlanGlance';
import { CardVisual } from './visuals/CardVisual';
import { LeaveChoicesVisual } from './visuals/LeaveChoicesVisual';
import { VideoChip, WatchFirstRow } from './video/WatchFirstRow';
import { Panel } from './Panel';
import { Pill } from './Pill';
import { cardExtras, topicVideos } from '@/lib/plan/relevance';
import type { StockId } from '@/lib/answers/stockAnswers';

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
  focusTopics?: TopicKey[];
}

// What "Watch first" calls each topic.
const TOPIC_WORDS: Record<TopicKey, { en: string; es: string }> = {
  you: { en: 'your money', es: 'tu dinero' },
  employer: { en: 'employer money', es: 'el dinero del empleador' },
  access: { en: 'getting to your money', es: 'cómo acceder a tu dinero' },
  leave: { en: 'leaving a job', es: 'cuando te vas de un trabajo' },
};

// "Your plan": topic tabs, question cards that open in place, and the grouped panel.
export function PlanOverview(p: PlanOverviewProps) {
  const { planData, lang, review, topic, openCardId, sticky } = p;
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const o = getOverview(planData, lang);

  const advisor: AdvisorInfo | null = p.advisor ?? (planData?.advisorName ? { name: planData.advisorName, firm: planData.advisorFirm, email: planData.advisorEmail } : null);
  const rkName: string | undefined = planData?.recordkeeperName;
  const rkUrl: string | undefined = typeof planData?.recordkeeperUrl === 'string' && planData.recordkeeperUrl.startsWith('https://') ? planData.recordkeeperUrl : undefined;

  const topics: { key: TopicKey; title: string }[] = [
    { key: 'you', title: L('Your money', 'Tu dinero') },
    { key: 'employer', title: L('Employer money', 'Dinero del empleador') },
    { key: 'access', title: L('Access my money', 'Acceso a tu dinero') },
    { key: 'leave', title: L('When you leave', 'Cuando te vas') },
  ];
  const cards = o.topics[topic];
  return (
    <div ref={p.scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
      <div ref={p.layoutRef} style={{ maxWidth: LAYOUT.page, margin: '0 auto', padding: '40px 20px 48px', boxSizing: 'border-box', display: 'flex', flexWrap: 'wrap', flexDirection: 'row-reverse', gap: 28, alignItems: 'flex-start' }}>
        <main style={{ flex: '999 1 540px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {p.focusSlot}

          {/* Topic tabs: one white bar */}
          <Panel role="tablist" aria-label={L('Plan topics', 'Temas del plan')} style={{ padding: 6, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 6 }}>
            {topics.map((tp, i) => {
              const sel = topic === tp.key;
              return (
                <button key={tp.key} type="button" role="tab" aria-selected={sel} onClick={() => p.onSelectTopic(tp.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '8px 14px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, border: 'none', background: sel ? C.bar : 'transparent', color: sel ? C.barText : C.text }}>
                  <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: sel ? C.surface : C.borderLight, color: sel ? C.bar : C.text }}>{i + 1}</span>
                  {tp.title}
                </button>
              );
            })}
          </Panel>

          <WatchFirstRow ids={topicVideos(topic, planData)} topic={TOPIC_WORDS[topic]} />

          {/* Cards */}
          {cards.map((c) => {
            const open = openCardId === c.id;
            const written = p.getWritten(c.id);
            const extras = cardExtras(c.id as StockId, planData);
            return (
              <Panel key={c.id} id={`card-${c.id}`} strong={open} style={{ padding: 0, overflow: 'hidden', scrollMarginTop: sticky.headerH + 12 }}>
                {/* The toggle and the video chip are two buttons side by side, never one inside the other. */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 12px', padding: '4px 20px 4px 0' }}>
                  <button type="button" aria-expanded={open} aria-controls={`card-body-${c.id}`} onClick={() => p.onToggleCard(c.id)}
                    style={{ flex: '1 1 340px', minWidth: 0, minHeight: 64, padding: '14px 8px 14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <span style={{ flex: '1 1 240px', fontFamily: F.display, fontSize: 24, fontWeight: 700, lineHeight: 1.15, color: C.text }}>{c.question}</span>
                    <Pill kind={c.kind}>{c.fact}</Pill>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accentText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                  {extras.video && <div style={{ paddingLeft: 20 }}><VideoChip id={extras.video} /></div>}
                </div>
                {open && (
                  <div id={`card-body-${c.id}`} style={{ padding: '0 20px 20px' }}>
                    <AnswerBody
                      written={written} ai={p.getAI(c.id)} lang={lang} stockId={c.id} review={review} kind={c.kind}
                      link={extras.link ? { text: extras.link.text[lang], onClick: () => p.onPickRow(topic, extras.link!.to) } : null}
                      recordkeeper={{ name: rkName, url: rkUrl }} advisorEmail={advisor?.email}
                      errorText={p.errorText} onOpenCalculator={p.onOpenCalculator} onRetry={() => p.onRetry(c.id)}
                    >
                      <CardVisual id={c.id} planData={planData} lang={lang} />
                    </AnswerBody>
                  </div>
                )}
              </Panel>
            );
          })}

          {/* Leave choices */}
          {topic === 'leave' && <LeaveChoicesVisual options={o.leaveOptions} lang={lang} />}

          <div style={{ fontSize: 12, color: C.textDim, paddingTop: 16 }}>{p.footer}</div>
        </main>

        <div style={{ flex: '1 1 300px', maxWidth: 400, minWidth: 0, ...(sticky.twoCol ? { position: 'sticky', top: sticky.top, height: sticky.height, display: 'flex', alignItems: 'center' } : {}) }}>
          <PlanGlance groups={o.groups} activeTopic={topic} onPick={(tp, id) => p.onPickRow(tp, id)} lang={lang} focusTopics={p.focusTopics} key={(p.focusTopics ?? []).join()} />
        </div>
      </div>
    </div>
  );
}
