'use client';

import React from 'react';
import { C, F } from '../theme';
import type { VideoId } from '@/lib/videos/types';
import { videoSeconds } from '@/lib/videos/build';
import { focusPlace, type FocusId } from '@/lib/plan/focus';
import { cardExtras } from '@/lib/plan/relevance';
import type { StockId } from '@/lib/answers/stockAnswers';
import type { PlanData } from '@/lib/plan/plandata';
import { useVideo, useVideoCtx } from './VideoContext';

// Which video each focus pick starts with: the video of the card the pick points at (lib/plan/relevance.ts).
export function focusVideo(pick: FocusId, pd: PlanData | null): { id: VideoId } | null {
  if (pick === 'invest') return { id: 'tdf' };
  const place = focusPlace(pick, pd);
  const card: StockId = place.kind === 'card' ? place.card : 'limit';
  const id = cardExtras(card === 'elig' ? 'limit' : card, pd).video;
  return id ? { id } : null;
}

// "Watch first" on the focus strip: goes to the place the current pick points at and opens its video there.
export function WatchFirst({ pick, lang, onGo }: { pick: FocusId; lang: 'en' | 'es'; onGo: (pick: FocusId) => void }) {
  const c = useVideoCtx();
  const target = focusVideo(pick, c?.planData ?? null);
  const video = useVideo(target?.id ?? 'welcome');
  if (!target || !video || !c) return null;
  const es = lang === 'es';
  return (
    <button type="button" onClick={(e) => { onGo(pick); c.openVideo(target.id, { from: e.currentTarget }); }}
      style={{ minHeight: 40, borderRadius: 100, padding: '0 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F.body, background: C.surface, color: C.accentText, border: `1px solid ${C.accentBorder}` }}>
      {es ? `▶ Ver primero · ${videoSeconds(video)} s` : `▶ Watch first · ${videoSeconds(video)} s`}
    </button>
  );
}
