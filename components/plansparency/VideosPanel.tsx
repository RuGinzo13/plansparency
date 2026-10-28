'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { C, F, LAYOUT } from './theme';
import { VIDEO_SECTIONS } from '@/lib/videos/scripts';
import { videoSeconds } from '@/lib/videos/build';
import { fmtTime, VideoThumb } from './video/VideoThumb';
import { planLabel, useVideoCtx, useVideos } from './video/VideoContext';

// The Videos tab: a table of contents. Contents list on the left, numbered sections of videos on the right.
export function VideosPanel() {
  const c = useVideoCtx();
  const videos = useVideos();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const es = c?.lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);

  const sections = useMemo(() => {
    const byId = new Map(videos.map((v) => [v.id, v]));
    return VIDEO_SECTIONS.map((s) => ({ title: s.title, list: s.videos.map((id) => byId.get(id)).filter((v): v is NonNullable<typeof v> => !!v) })).filter((s) => s.list.length > 0);
  }, [videos]);

  // The section in view gets the highlight in the contents list.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setCurrent(Number((hit.target as HTMLElement).dataset.k));
    }, { root, rootMargin: '0px 0px -65% 0px', threshold: 0 });
    root.querySelectorAll('[data-k]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  if (!c) return null;
  const planName = planLabel(c);
  const n = videos.length;
  const minutes = Math.max(1, Math.round(videos.reduce((a, v) => a + videoSeconds(v), 0) / 60));
  const w = videos.filter((v) => c.watched.has(v.id)).length;
  const goTo = (k: number) => document.getElementById(`vsec-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const mmss = (s: number) => fmtTime(s);

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ maxWidth: LAYOUT.page, margin: '0 auto', padding: '28px 20px 48px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 style={{ margin: 0, fontFamily: F.display, fontSize: 36, fontWeight: 700, lineHeight: 1.1, color: C.text }}>{L('Videos', 'Videos')}</h1>
          <p style={{ margin: 0, fontSize: 15, color: C.textMuted }}>{L('Short, under a minute each. Tap one to watch. Captions are always on.', 'Cortos, de menos de un minuto cada uno. Toca uno para verlo. Los subtítulos siempre están activos.')}</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px 24px', padding: '18px 20px', borderRadius: 16, background: C.highlight, border: `1px solid ${C.accentBorder}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
              {es ? `${n} ${n === 1 ? 'video corto' : 'videos cortos'} · unos ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} en total` : `${n} short ${n === 1 ? 'video' : 'videos'} · about ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} in all`}
            </div>
            <div style={{ fontSize: 14, color: C.textMuted }}>
              {L('Watch in order, or jump to what you need. ', 'Míralos en orden, o salta a lo que necesitas. ')}
              <strong style={{ color: C.text }}>{es ? `${w} de ${n} vistos` : `${w} of ${n} watched`}</strong>
              {L(' this visit.', ' en esta visita.')}
            </div>
          </div>
          <button type="button" onClick={(e) => c.openVideo(videos[0].id, { from: e.currentTarget, playAll: true })} disabled={n === 0}
            style={{ minHeight: 52, padding: '0 24px', border: 'none', borderRadius: 12, background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: F.body }}>
            {L('▶ Play all in order', '▶ Ver todos en orden')}
          </button>
        </div>

        <div className="vp-cols" style={{ gap: 36, alignItems: 'start' }}>
          <nav aria-label={L('Video contents', 'Contenido de los videos')} className="vp-nav" style={{ padding: 16, border: `1px solid ${C.border}`, borderRadius: 16, boxSizing: 'border-box', background: C.surface }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.textMuted, marginBottom: 8 }}>{L('Contents', 'Contenido')}</div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sections.map((s, i) => {
                const k = i + 1;
                const on = current === k || (current === 0 && k === 1);
                const secs = s.list.reduce((a, v) => a + videoSeconds(v), 0);
                return (
                  <li key={k}>
                    <button type="button" aria-current={on ? 'true' : undefined} onClick={() => goTo(k)}
                      style={{ width: '100%', minHeight: 52, padding: '6px 10px', borderRadius: 8, border: 'none', borderLeft: `4px solid ${on ? C.accent : 'transparent'}`, background: on ? C.highlight : 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: F.body, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{k}. {s.title[c.lang]}</span>
                      <span style={{ fontSize: 13, color: C.textMuted }}>{es ? `${s.list.length} ${s.list.length === 1 ? 'video' : 'videos'}` : `${s.list.length} ${s.list.length === 1 ? 'video' : 'videos'}`} · {mmss(secs)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 32 }}>
            {sections.map((s, i) => {
              const k = i + 1;
              const secs = s.list.reduce((a, v) => a + videoSeconds(v), 0);
              return (
                <section key={k} id={`vsec-${k}`} data-k={k} aria-labelledby={`vsec-h-${k}`} style={{ scrollMarginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                    <h2 id={`vsec-h-${k}`} style={{ margin: 0, fontFamily: F.display, fontSize: 30, fontWeight: 700, color: C.text }}><span style={{ color: C.accentText }}>{k}.</span> {s.title[c.lang]}</h2>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.textMuted }}>{mmss(secs)}</span>
                  </div>
                  <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {s.list.map((v, j) => {
                      const seen = c.watched.has(v.id);
                      return (
                        <li key={v.id} className="vp-row" style={{ gap: 18, padding: '14px 0', borderTop: `1px solid ${C.borderLight}`, alignItems: 'center' }}>
                          <span aria-hidden="true" style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: C.accentText }}>{k}.{j + 1}</span>
                          <VideoThumb video={v} planName={planName} lang={c.lang} size="lg" onOpen={(el) => c.openVideo(v.id, { from: el })} />
                          <div className="vp-text" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>{v.title}</h3>
                            <p style={{ margin: 0, fontSize: 14, color: C.textMuted }}>{v.learn}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{mmss(videoSeconds(v))}</span>
                              {seen && <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: C.greenSoft, color: C.green }}>{L('Watched', 'Visto')}</span>}
                            </div>
                          </div>
                          <button type="button" className="vp-btn" onClick={(e) => c.openVideo(v.id, { from: e.currentTarget })}
                            style={{ minHeight: 44, padding: '0 18px', borderRadius: 12, border: `1px solid ${C.accent}`, background: C.surface, color: C.accentText, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F.body }}>
                            {L('▶ Watch', '▶ Ver')}<span className="sr-only">: {v.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })}
          </div>
        </div>

        <p style={{ margin: 0, fontSize: 13, color: C.textDim }}>{L('The same videos also show up on Your plan, right where each topic is. Education only, not advice.', 'Los mismos videos también aparecen en Tu plan, justo donde está cada tema. Solo educación, no consejos.')}</p>
      </div>
    </div>
  );
}
