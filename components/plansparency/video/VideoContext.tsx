'use client';

import React, { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import type { NextAction, Video, VideoContextInfo, VideoId } from '@/lib/videos/types';
import { buildVideo } from '@/lib/videos/build';

// One place that knows the plan, the language and what the end card buttons do, so a Watch button
// can be dropped in anywhere with just a video id.
interface VideoCtx {
  planData: any;
  lang: 'en' | 'es';
  info: VideoContextInfo;
  onAction: (action: NextAction, id: VideoId) => void;
}
const Ctx = createContext<VideoCtx | null>(null);
export const VideoProvider = Ctx.Provider;
export const useVideoCtx = () => useContext(Ctx);

// Which player is open. Only one at a time on the page.
let openKey: string | null = null;
const listeners = new Set<() => void>();
export const setOpenVideo = (key: string | null) => { openKey = key; listeners.forEach((l) => l()); };
export const closeVideoIf = (key: string) => { if (openKey === key) setOpenVideo(null); };
export function useOpenVideo(): string | null {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => openKey, () => null);
}

export function useVideo(id: VideoId): Video | null {
  const c = useVideoCtx();
  return useMemo(() => (c ? buildVideo(id, c.planData, c.info, c.lang) : null), [c?.planData, c?.lang, c?.info.employerName, c?.info.planName, c?.info.recordkeeperName, c?.info.hasTeam, id]); // eslint-disable-line react-hooks/exhaustive-deps
}
