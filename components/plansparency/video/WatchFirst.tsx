'use client';

import React from 'react';
import { C, F } from '../theme';
import type { VideoId } from '@/lib/videos/types';
import { videoSeconds } from '@/lib/videos/build';
import { focusPlace, type FocusId } from '@/lib/plan/focus';
import { useVideo, useVideoCtx } from './VideoContext';

// Which video each focus pick starts with, and which Watch button (placeKey) it opens at the place the pick goes to.
export function focusVideo(pick: FocusId, planData: any): { id: VideoId; key: string } {
  switch (pick) {
    case 'start': return { id: 'limits', key: 'card:elig' };
    case 'employer': { const place = focusPlace('employer', planData); return { id: 'match', key: `card:${place.kind === 'card' ? place.card : 'match'}` }; }
    case 'access': return { id: 'access', key: 'topic:access' };
    case 'leave': return { id: 'leave', key: 'topic:leave' };
    case 'invest': return { id: 'tdf', key: 'invest' };
    case 'calc': return { id: 'limits', key: 'calc' };
  }
}

// "Watch first" on the focus strip: goes to the place the current pick points at and opens its video there.
export function WatchFirst({ pick, lang, onGo }: { pick: FocusId; lang: 'en' | 'es'; onGo: (pick: FocusId) => void }) {
  const c = useVideoCtx();
  const target = focusVideo(pick, c?.planData ?? null);
  const video = useVideo(target.id);
  if (!video) return null;
  const es = lang === 'es';
  return (
    <button type="button" onClick={(e) => { onGo(pick); c?.openVideo(target.id, { from: e.currentTarget }); }}
      style={{ minHeight: 40, borderRadius: 100, padding: '0 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F.body, background: C.surface, color: C.accentText, border: `1px solid ${C.accentBorder}` }}>
      {es ? `▶ Ver primero · ${videoSeconds(video)} s` : `▶ Watch first · ${videoSeconds(video)} s`}
    </button>
  );
}
