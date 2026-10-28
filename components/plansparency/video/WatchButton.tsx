'use client';

import React from 'react';
import { C, F } from '../theme';
import type { VideoId } from '@/lib/videos/types';
import { videoSeconds } from '@/lib/videos/build';
import { planLabel, useVideo, useVideoCtx } from './VideoContext';
import { VideoThumb } from './VideoThumb';

// Temporary: one thumbnail that opens the theater. STEP 4 replaces every use with the watch-first rows and links.
export function WatchVideo({ id }: { id: VideoId; placeKey?: string; label?: unknown }) {
  const c = useVideoCtx();
  const video = useVideo(id);
  if (!c || !video) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <VideoThumb video={video} planName={planLabel(c)} lang={c.lang} size="sm" onOpen={(el) => c.openVideo(id, { from: el })} />
      <span style={{ fontSize: 15, fontWeight: 700, color: C.accentText, fontFamily: F.body }}>{video.title} · {videoSeconds(video)} s</span>
    </div>
  );
}
