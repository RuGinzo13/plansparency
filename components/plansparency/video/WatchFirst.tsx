'use client';

import React from 'react';
import { C, F } from '../theme';
import type { VideoId } from '@/lib/videos/types';
import { videoSeconds } from '@/lib/videos/build';
import { type FocusId } from '@/lib/plan/focus';
import { useVideo, useVideoCtx } from './VideoContext';

// Which video each focus pick starts with.
export function focusVideo(pick: FocusId): { id: VideoId } {
  switch (pick) {
    case 'start': case 'calc': return { id: 'limits' };
    case 'employer': return { id: 'match' };
    case 'access': return { id: 'access' };
    case 'leave': return { id: 'leave' };
    case 'invest': return { id: 'tdf' };
  }
}

// "Watch first" on the focus strip: goes to the place the current pick points at and opens its video there.
export function WatchFirst({ pick, lang, onGo }: { pick: FocusId; lang: 'en' | 'es'; onGo: (pick: FocusId) => void }) {
  const c = useVideoCtx();
  const target = focusVideo(pick);
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
