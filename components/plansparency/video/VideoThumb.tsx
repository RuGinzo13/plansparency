'use client';

import React from 'react';
import { C, F } from '../theme';
import type { Video } from '@/lib/videos/types';
import { videoSeconds } from '@/lib/videos/build';
import { SCENES } from './scenes';
import { H, StillCtx, W } from './scenes/kit';

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// The poster picture: the video's first content scene, drawn finished (no motion).
export function Poster({ video, planName, lang }: { video: Video; planName: string; lang: 'en' | 'es' }) {
  const scene = video.scenes[video.scenes.length > 1 ? 1 : 0];
  const Scene = SCENES[scene.kind];
  return (
    <StillCtx.Provider value>
      <svg className="vid-still" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" style={{ display: 'block', width: '100%', height: '100%' }}>
        <Scene p={scene.props} planName={planName} lang={lang} />
      </svg>
    </StillCtx.Provider>
  );
}

const WIDTH = { lg: 176, sm: 168 } as const;

// A real thumbnail with a play button and the length. Always a button that opens the theater.
export function VideoThumb({ video, planName, lang, size, onOpen }: { video: Video; planName: string; lang: 'en' | 'es'; size: 'lg' | 'sm'; onOpen: (from: HTMLElement) => void }) {
  const es = lang === 'es';
  const secs = videoSeconds(video);
  return (
    <button type="button" onClick={(e) => onOpen(e.currentTarget)}
      aria-label={es ? `Reproducir video: ${video.title}, ${secs} segundos` : `Play video: ${video.title}, ${secs} seconds`}
      style={{ position: 'relative', width: WIDTH[size], maxWidth: '100%', flexShrink: 0, aspectRatio: '16 / 9', padding: 0, border: `1px solid ${C.accentBorder}`, borderRadius: 12, overflow: 'hidden', background: C.highlight, cursor: 'pointer', display: 'block' }}>
      <Poster video={video} planName={planName} lang={lang} />
      <span aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', width: 60, height: 60, transform: 'translate(-50%, -50%)', borderRadius: '50%', background: C.captionBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24"><path d="M8 5l12 7-12 7z" fill={C.onPrimary} /></svg>
      </span>
      <span aria-hidden="true" style={{ position: 'absolute', right: 6, bottom: 6, padding: '1px 7px', borderRadius: 6, background: C.captionBg, color: C.onPrimary, fontFamily: F.body, fontSize: 13, fontWeight: 700 }}>{fmtTime(secs)}</span>
    </button>
  );
}
