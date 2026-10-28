'use client';

import React, { useId } from 'react';
import { C, F } from '../theme';
import type { VideoId } from '@/lib/videos/types';
import { videoSeconds } from '@/lib/videos/build';
import { planLabel, useVideoCtx, useVideos } from './VideoContext';
import { fmtTime, VideoThumb } from './VideoThumb';

// Videos at the top of a topic: "Watch first: 2 short videos on employer money", each a thumbnail card.
// Renders nothing when none of the videos exist for this plan.
export function WatchFirstRow({ ids, topic, onBeforeOpen }: { ids: VideoId[]; topic: { en: string; es: string }; onBeforeOpen?: () => void }) {
  const c = useVideoCtx();
  const all = useVideos();
  const headingId = useId();
  const list = ids.map((id) => all.find((v) => v.id === id)).filter((v): v is NonNullable<typeof v> => !!v);
  if (!c || list.length === 0) return null;
  const es = c.lang === 'es';
  const n = list.length;
  const open = (id: VideoId, from: HTMLElement) => { onBeforeOpen?.(); c.openVideo(id, { from }); };
  return (
    <section aria-labelledby={headingId} style={{ padding: 16, borderRadius: 16, background: C.bar, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 id={headingId} style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.barText }}>
        {es ? `Mira primero: ${n} ${n === 1 ? 'video corto' : 'videos cortos'} sobre ${topic.es}` : `Watch first: ${n} short ${n === 1 ? 'video' : 'videos'} on ${topic.en}`}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 12 }}>
        {list.map((v) => (
          <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14, border: `1px solid ${C.border}`, background: C.surface }}>
            <VideoThumb video={v} planName={planLabel(c)} lang={c.lang} size="sm" onOpen={(el) => open(v.id, el)} />
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.accentText }}>{es ? 'Video' : 'Video'} · {fmtTime(videoSeconds(v))}</span>
              <button type="button" onClick={(e) => open(v.id, e.currentTarget)} style={{ minHeight: 44, padding: 0, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: F.body, fontSize: 16, fontWeight: 700, color: C.text }}>{v.title}</button>
              <span style={{ fontSize: 13, color: C.textMuted }}>{v.learn}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// A small link at the top of an open answer: "▶ Prefer to watch? 40-second video".
export function PreferToWatch({ id }: { id: VideoId }) {
  const c = useVideoCtx();
  const all = useVideos();
  const v = all.find((x) => x.id === id);
  if (!c || !v) return null;
  const s = videoSeconds(v);
  return (
    <button type="button" onClick={(e) => c.openVideo(id, { from: e.currentTarget })}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 40, padding: 0, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.body, fontSize: 15, fontWeight: 700, color: C.accentText, textDecoration: 'underline' }}>
      <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: '50%', background: C.bar, color: C.onPrimary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, textDecoration: 'none' }}>▶</span>
      <span>{c.lang === 'es' ? `¿Prefieres verlo? Video de ${s} segundos` : `Prefer to watch? ${s}-second video`}</span>
    </button>
  );
}

// The small dark chip in a card's header: "▶ 0:45". A button of its own, next to the card's toggle (never inside it).
export function VideoChip({ id }: { id: VideoId }) {
  const c = useVideoCtx();
  const all = useVideos();
  const v = all.find((x) => x.id === id);
  if (!c || !v) return null;
  const s = videoSeconds(v);
  return (
    <button type="button" onClick={(e) => c.openVideo(id, { from: e.currentTarget })}
      aria-label={c.lang === 'es' ? `Ver: ${v.title}, ${s} segundos` : `Watch: ${v.title}, ${s} seconds`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 14px 0 7px', borderRadius: 100, border: 'none', background: C.bar, color: C.barText, cursor: 'pointer', fontFamily: F.body, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
      <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: '50%', background: C.surface, color: C.bar, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, paddingLeft: 2 }}>▶</span>
      <span aria-hidden="true">{fmtTime(s)}</span>
    </button>
  );
}
