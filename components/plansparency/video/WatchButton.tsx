'use client';

import React, { useEffect } from 'react';
import { C, F } from '../theme';
import type { Video, VideoId } from '@/lib/videos/types';
import { videoSeconds } from '@/lib/videos/build';
import { VideoPlayer } from './VideoPlayer';
import { closeVideoIf, setOpenVideo, useOpenVideo, useVideo, useVideoCtx } from './VideoContext';

interface ButtonProps {
  video: Video;
  lang: 'en' | 'es';
  planName: string;
  // Each place a video can open has its own key, so only that one opens.
  placeKey: string;
  onNext: () => void;
  // Replaces "▶ Watch: {title} · {seconds} s".
  label?: (seconds: number, title: string) => string;
}

// The entry point everywhere: a pill button. The player opens inline right below it.
export function WatchButton({ video, lang, planName, placeKey, onNext, label }: ButtonProps) {
  const es = lang === 'es';
  const open = useOpenVideo() === placeKey;
  // The card closes or the screen changes: the player goes away and stays closed.
  useEffect(() => () => closeVideoIf(placeKey), [placeKey]);
  const seconds = videoSeconds(video);
  const text = open ? (es ? 'Ocultar video' : 'Hide video') : label ? label(seconds, video.title) : `▶ ${es ? 'Ver' : 'Watch'}: ${video.title} · ${seconds} s`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <button type="button" aria-expanded={open} onClick={() => setOpenVideo(open ? null : placeKey)}
        style={{ minHeight: 40, borderRadius: 100, padding: '0 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F.body, background: C.highlight, color: C.accentText, border: `1px solid ${C.accentBorder}`, textAlign: 'left' }}>
        {text}
      </button>
      {open && (
        <div style={{ width: '100%' }}>
          <VideoPlayer video={video} lang={lang} planName={planName} focusPlay onNext={onNext} />
        </div>
      )}
    </div>
  );
}

// Drop-in version: builds the video from the plan and renders nothing when the video is hidden for this plan.
export function WatchVideo({ id, placeKey, label }: { id: VideoId; placeKey: string; label?: (seconds: number, title: string) => string }) {
  const c = useVideoCtx();
  const video = useVideo(id);
  if (!c || !video) return null;
  const planName = (c.info.planName || c.planData?.planName || '').trim() || (c.lang === 'es' ? 'Tu plan 401(k)' : 'Your 401(k) plan');
  return <WatchButton video={video} lang={c.lang} planName={planName} placeKey={placeKey} label={label} onNext={() => { setOpenVideo(null); c.onAction(video.next.action, id); }} />;
}
