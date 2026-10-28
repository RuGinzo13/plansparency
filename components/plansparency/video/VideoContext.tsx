'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { NextAction, Video, VideoContextInfo, VideoId } from '@/lib/videos/types';
import { availableVideos, buildVideo } from '@/lib/videos/build';

// The video that is open in the theater, if any. `from` is the thumbnail or link that opened it (focus goes back there).
export interface TheaterState { id: VideoId; playAll: boolean; from: HTMLElement | null }

// One place that knows the plan, the language, what the end card buttons do and which video is open,
// so a thumbnail or link can be dropped in anywhere with just a video id.
interface VideoCtx {
  planData: any;
  lang: 'en' | 'es';
  info: VideoContextInfo;
  onAction: (action: NextAction, id: VideoId) => void;
  theater: TheaterState | null;
  openVideo: (id: VideoId, opts?: { from?: HTMLElement | null; playAll?: boolean }) => void;
  closeVideo: () => void;
  // Videos watched to the last scene during this visit (React state only, never stored).
  watched: ReadonlySet<VideoId>;
  markWatched: (id: VideoId) => void;
}
const Ctx = createContext<VideoCtx | null>(null);
export const VideoProvider = Ctx.Provider;
export const useVideoCtx = () => useContext(Ctx);

const infoKey = (c: VideoCtx | null) => [c?.info.employerName, c?.info.planName, c?.info.recordkeeperName, c?.info.hasTeam].join('|');

export function useVideo(id: VideoId): Video | null {
  const c = useVideoCtx();
  return useMemo(() => (c ? buildVideo(id, c.planData, c.info, c.lang) : null), [c?.planData, c?.lang, infoKey(c), id]); // eslint-disable-line react-hooks/exhaustive-deps
}

// Every video that exists for this plan, in listing order.
export function useVideos(): Video[] {
  const c = useVideoCtx();
  return useMemo(() => (c ? availableVideos(c.planData, c.info, c.lang) : []), [c?.planData, c?.lang, infoKey(c)]); // eslint-disable-line react-hooks/exhaustive-deps
}

// The plan name the scenes show in the corner.
export function planLabel(c: VideoCtx): string {
  return (c.info.planName || c.planData?.planName || '').trim() || (c.lang === 'es' ? 'Tu plan 401(k)' : 'Your 401(k) plan');
}
