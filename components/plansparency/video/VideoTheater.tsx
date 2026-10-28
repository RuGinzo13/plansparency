'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { C, F } from '../theme';
import { Modal } from '../ui';
import { sceneSeconds } from '@/lib/videos/build';
import { getNarration, type Narration } from '@/lib/videos/narration';
import { SCENES } from './scenes';
import { H, W } from './scenes/kit';
import { fmtTime } from './VideoThumb';
import { planLabel, useVideo, useVideoCtx, useVideos, type TheaterState } from './VideoContext';

const TICK = 100;
const UP_NEXT_SECONDS = 5;
const label12 = { fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.textMuted } as const;

// One theater for the whole app: a dialog with the stage, the controls, the chapters and what to watch next.
export function VideoTheater() {
  const c = useVideoCtx();
  if (!c || !c.theater) return null;
  const es = c.lang === 'es';
  return (
    <Modal titleId="vt-title" onClose={c.closeVideo} closeOnBackdrop closeLabel={es ? 'Cerrar video' : 'Close video'} maxWidth={1180} flush>
      <Player key={c.theater.id} theater={c.theater} />
    </Modal>
  );
}

function Player({ theater }: { theater: TheaterState }) {
  const c = useVideoCtx()!;
  const { lang } = c;
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const video = useVideo(theater.id);
  const videos = useVideos();
  const planName = planLabel(c);

  const [narr, setNarr] = useState<Narration | null>(null);
  useEffect(() => { if (!video) return; let live = true; getNarration(video, lang).then((n) => { if (live) setNarr(n); }); return () => { live = false; }; }, [video, lang]);

  const durations = useMemo(() => {
    if (!video) return [5];
    const base = video.scenes.map((s) => sceneSeconds(s.caption));
    if (narr?.timings && narr.timings.length === video.scenes.length) {
      return narr.timings.map((t, i) => (i < narr.timings!.length - 1 ? narr.timings![i + 1] - t : base[i]));
    }
    return base;
  }, [video, narr]);
  const starts = useMemo(() => durations.map((_, i) => durations.slice(0, i).reduce((a, b) => a + b, 0)), [durations]);
  const total = durations.reduce((a, b) => a + b, 0);
  const lastIdx = durations.length - 1;

  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true); // the person just clicked Play
  const [ended, setEnded] = useState(false);
  const [seekN, setSeekN] = useState(0);
  const [captions, setCaptions] = useState(true);
  const [transcript, setTranscript] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  let idx = 0;
  for (let i = 0; i < starts.length; i++) if (starts[i] <= time + 1e-6) idx = i;
  if (time >= total) idx = lastIdx;

  // The clock.
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setTime((t) => Math.min(total, t + TICK / 1000)), TICK);
    return () => clearInterval(timer);
  }, [playing, total]);
  useEffect(() => { if (playing && time >= total) { setPlaying(false); setEnded(true); audioRef.current?.pause(); } }, [time, total, playing]);
  // Watched: the last scene was reached.
  useEffect(() => { if (video && idx === lastIdx) c.markWatched(video.id); }, [idx, lastIdx, video?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { audioRef.current?.pause(); }, []);
  // A video that is hidden for this plan cannot be open.
  useEffect(() => { if (!video) c.closeVideo(); }, [video]); // eslint-disable-line react-hooks/exhaustive-deps

  const at = videos.findIndex((v) => v.id === theater.id);
  const nextVideo = at >= 0 ? videos[at + 1] : undefined;
  const chain = theater.playAll && !!nextVideo && ended && !cancelled;

  // Play all in order: a 5-second bar, then the next video.
  useEffect(() => {
    if (!chain) { setCountdown(null); return; }
    setCountdown(UP_NEXT_SECONDS);
    const timer = setInterval(() => setCountdown((n) => (n === null ? null : n - 1)), 1000);
    return () => clearInterval(timer);
  }, [chain]);
  useEffect(() => {
    if (chain && countdown !== null && countdown <= 0 && nextVideo) c.openVideo(nextVideo.id, { from: theater.from, playAll: true });
  }, [chain, countdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncAudio = (t: number, play: boolean) => {
    if (!narr?.url) return;
    if (!audioRef.current) audioRef.current = new Audio(narr.url);
    audioRef.current.currentTime = t;
    if (play) audioRef.current.play().catch(() => {}); else audioRef.current.pause();
  };
  const seek = (sec: number, discrete = true) => {
    const t = Math.max(0, Math.min(total, sec));
    setTime(t);
    if (discrete) setSeekN((n) => n + 1);
    if (t < total) { setEnded(false); setCancelled(false); }
    if (audioRef.current) audioRef.current.currentTime = t;
  };
  const play = () => {
    if (ended || time >= total) { seek(0); }
    setPlaying(true);
    syncAudio(ended || time >= total ? 0 : time, true);
  };
  const pause = () => { setPlaying(false); audioRef.current?.pause(); };
  const toggle = () => (playing ? pause() : play());

  if (!video) return null;
  const scene = video.scenes[idx];
  const Scene = SCENES[scene.kind];
  const nextStep = () => { c.closeVideo(); c.onAction(video.next.action, video.id); };

  const onBarKey = (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 5 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -5 : 0;
    if (step) { e.preventDefault(); seek(time + step); }
    else if (e.key === 'Home') { e.preventDefault(); seek(0); }
    else if (e.key === 'End') { e.preventDefault(); seek(total); }
  };
  const seekFromPointer = (e: React.PointerEvent, discrete: boolean) => {
    const r = barRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    seek(((e.clientX - r.left) / r.width) * total, discrete);
  };
  const onStageKey = (e: React.KeyboardEvent) => {
    if (e.key === ' ' && e.target === e.currentTarget) { e.preventDefault(); toggle(); }
  };

  const btn = { minHeight: 44, borderRadius: 12, padding: '0 16px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: F.body, background: C.surface, color: C.accentText, border: `1px solid ${C.border}` } as const;
  const primary = { ...btn, border: 'none', background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary } as const;
  const pct = total > 0 ? (time / total) * 100 : 0;

  return (
    <div className="vt-grid">
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div role="region" aria-label={L(`Video: ${video.title}`, `Video: ${video.title}`)} tabIndex={0} onKeyDown={onStageKey}
          style={{ position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden', background: C.highlight }}>
          <svg key={`${idx}-${seekN}`} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <Scene p={scene.props} planName={planName} lang={lang} />
          </svg>
          {scene.kind === 'end' && (
            <button type="button" onClick={nextStep} style={{ position: 'absolute', left: '50%', top: '66%', transform: 'translateX(-50%)', minHeight: 52, padding: '0 28px', border: 'none', borderRadius: 14, background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary, fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: F.body, maxWidth: '90%' }}>
              {video.next.label} →
            </button>
          )}
          {captions && scene.kind !== 'end' && (
            <div aria-hidden="true" style={{ position: 'absolute', left: '50%', bottom: '4%', transform: 'translateX(-50%)', maxWidth: '86%', padding: '8px 14px', borderRadius: 8, background: C.captionBg, color: C.onPrimary, fontSize: 18, lineHeight: 1.4, textAlign: 'center' }}>
              {scene.caption}
            </div>
          )}
          <div role="status" className="sr-only">{scene.caption}</div>
          {chain && nextVideo && (
            <div role="status" style={{ position: 'absolute', left: 12, right: 12, bottom: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: C.captionBg, color: C.onPrimary }}>
              <span style={{ flex: '1 1 200px', fontSize: 16, fontWeight: 700 }}>{L(`Up next: ${nextVideo.title}`, `Sigue: ${nextVideo.title}`)}{countdown !== null && countdown > 0 ? ` (${countdown})` : ''}</span>
              <button type="button" onClick={() => c.openVideo(nextVideo.id, { from: theater.from, playAll: true })} style={primary}>{L('Play now', 'Reproducir ya')}</button>
              <button type="button" onClick={() => setCancelled(true)} style={btn}>{L('Cancel', 'Cancelar')}</button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px', padding: '12px 16px', borderTop: `1px solid ${C.borderLight}` }}>
          <button type="button" onClick={toggle} style={primary}>
            {playing ? L('Pause', 'Pausa') : ended ? L('↻ Replay', '↻ Repetir') : time === 0 ? L('▶ Play', '▶ Reproducir') : L('▶ Resume', '▶ Seguir')}
          </button>
          <div ref={barRef} role="slider" tabIndex={0} aria-label={L('Video position', 'Posición del video')} aria-valuemin={0} aria-valuemax={Math.round(total)} aria-valuenow={Math.round(time)}
            aria-valuetext={L(`${fmtTime(time)} of ${fmtTime(total)}`, `${fmtTime(time)} de ${fmtTime(total)}`)}
            onKeyDown={onBarKey}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dragging.current = true; seekFromPointer(e, true); }}
            onPointerMove={(e) => { if (dragging.current) seekFromPointer(e, false); }}
            onPointerUp={() => { dragging.current = false; }}
            onPointerCancel={() => { dragging.current = false; }}
            style={{ flex: '1 1 160px', minWidth: 120, minHeight: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', touchAction: 'none' }}>
            <div style={{ position: 'relative', width: '100%', height: 6, borderRadius: 6, background: C.accentSoft }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 6, background: C.accent }} />
              <div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: `${pct}%`, width: 16, height: 16, marginLeft: -8, marginTop: -8, borderRadius: '50%', background: C.accent, border: `2px solid ${C.surface}` }} />
            </div>
          </div>
          <span aria-hidden="true" style={{ fontSize: 13, fontWeight: 700, color: C.textMuted, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(time)} / {fmtTime(total)}</span>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, fontSize: 14, fontWeight: 700, color: C.text, cursor: 'pointer' }}>
            <input type="checkbox" checked={captions} onChange={(e) => setCaptions(e.target.checked)} aria-label={L('Captions', 'Subtítulos')} style={{ width: 20, height: 20, accentColor: C.accent }} />
            CC
          </label>
        </div>
      </div>

      <aside className="vt-side" aria-label={L('Chapters and next steps', 'Capítulos y siguientes pasos')} style={{ minWidth: 0, padding: 20, background: C.panelSoft, borderStyle: 'solid', borderColor: C.borderLight, borderWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <h2 id="vt-title" style={{ flex: 1, margin: 0, fontFamily: F.display, fontSize: 26, fontWeight: 700, lineHeight: 1.15, color: C.text }}>{video.title}</h2>
          <button type="button" onClick={c.closeVideo} aria-label={L('Close video', 'Cerrar video')} style={{ width: 44, height: 44, flexShrink: 0, marginTop: -6, marginRight: -8, borderRadius: 10, border: 'none', background: 'transparent', color: C.textMuted, fontSize: 28, lineHeight: 1, cursor: 'pointer', fontFamily: F.body }}>
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div>
          <div style={{ ...label12, marginBottom: 6 }}>{L('Chapters', 'Capítulos')}</div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {video.scenes.map((s, i) => {
              const on = i === idx;
              return (
                <li key={i}>
                  <button type="button" aria-current={on ? 'true' : undefined} onClick={() => { seek(starts[i]); if (!playing) play(); }}
                    style={{ width: '100%', minHeight: 36, padding: '6px 10px', borderRadius: 8, border: 'none', textAlign: 'left', fontFamily: F.body, fontSize: 14, cursor: 'pointer', fontWeight: on ? 700 : 500, background: on ? C.accentSoft : 'transparent', color: on ? C.accentText : C.text }}>
                    {i + 1}. {s.chapter}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {transcript && (
          <ol id="vt-transcript" style={{ margin: 0, padding: '12px 12px 12px 30px', maxHeight: 200, overflowY: 'auto', borderRadius: 10, background: C.surface, border: `1px solid ${C.borderLight}`, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, lineHeight: 1.45, color: C.text }}>
            {video.scenes.map((s, i) => <li key={i}>{s.caption}</li>)}
          </ol>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${C.borderLight}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={label12}>{L('After this video', 'Después de este video')}</div>
          <button type="button" onClick={nextStep} style={{ ...primary, textAlign: 'left', padding: '8px 16px' }}>{video.next.label} →</button>
          {nextVideo && (
            <button type="button" onClick={() => c.openVideo(nextVideo.id, { from: theater.from })} style={{ ...btn, textAlign: 'left', padding: '8px 16px' }}>
              {L(`Up next: ${nextVideo.title} →`, `Sigue: ${nextVideo.title} →`)}
            </button>
          )}
          <button type="button" aria-expanded={transcript} aria-controls="vt-transcript" onClick={() => setTranscript((v) => !v)} style={{ minHeight: 44, padding: 0, background: 'none', border: 'none', textAlign: 'left', fontSize: 15, fontWeight: 600, color: C.accentText, textDecoration: 'underline', cursor: 'pointer', fontFamily: F.body }}>
            {transcript ? L('Hide transcript', 'Ocultar transcripción') : L('Show transcript', 'Mostrar transcripción')}
          </button>
          <div style={{ fontSize: 12, color: C.textDim }}>{L('Silent with captions for now. Education only, not advice.', 'Sin sonido y con subtítulos por ahora. Solo educación, no consejos.')}</div>
        </div>
      </aside>
    </div>
  );
}
