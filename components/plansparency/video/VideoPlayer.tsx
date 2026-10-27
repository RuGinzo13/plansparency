'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { C, F } from '../theme';
import type { Video } from '@/lib/videos/types';
import { sceneSeconds } from '@/lib/videos/build';
import { getNarration, type Narration } from '@/lib/videos/narration';
import { SCENES } from './scenes';
import { H, W } from './scenes/kit';

interface Props {
  video: Video;
  lang: 'en' | 'es';
  planName: string;
  onNext: () => void;
  // Focus the Play button when the player appears.
  focusPlay?: boolean;
  // Called when playback starts, so the page can stop other things if needed.
  onPlay?: () => void;
}

const TICK = 100;

// The animated explainer player: silent with captions for now. Never autoplays.
export function VideoPlayer({ video, lang, planName, onNext, focusPlay, onPlay }: Props) {
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const [narr, setNarr] = useState<Narration | null>(null);
  const durations = useMemo(() => {
    const base = video.scenes.map((s) => sceneSeconds(s.caption));
    if (narr?.timings && narr.timings.length === video.scenes.length) {
      return narr.timings.map((t, i) => (i < narr.timings!.length - 1 ? narr.timings![i + 1] - t : base[i]));
    }
    return base;
  }, [video, narr]);
  const total = durations.reduce((a, b) => a + b, 0);
  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0); // seconds within the current scene
  const [playing, setPlaying] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [transcript, setTranscript] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const endIdx = video.scenes.length - 1;
  const atEnd = idx === endIdx && elapsed >= durations[endIdx];

  useEffect(() => { if (focusPlay) playRef.current?.focus(); }, [focusPlay]);
  useEffect(() => { let live = true; getNarration(video, lang).then((n) => { if (live) setNarr(n); }); return () => { live = false; }; }, [video, lang]);

  const pause = useCallback(() => { setPlaying(false); audioRef.current?.pause(); }, []);

  // The clock: advances the scene, then the next scene, then stops on the end card.
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setElapsed((e) => {
        const next = e + TICK / 1000;
        if (next < durations[idx]) return next;
        if (idx < endIdx) { setIdx(idx + 1); return 0; }
        setPlaying(false);
        return durations[idx];
      });
    }, TICK);
    return () => clearInterval(timer);
  }, [playing, idx, durations, endIdx]);

  // Stops when it scrolls out of view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) pause(); }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [pause]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const play = () => {
    if (atEnd) { setIdx(0); setElapsed(0); }
    setPlaying(true);
    onPlay?.();
    if (narr?.url) {
      if (!audioRef.current) audioRef.current = new Audio(narr.url);
      audioRef.current.play().catch(() => {});
    }
  };
  const goTo = (i: number) => {
    setIdx(i); setElapsed(0);
    if (narr?.timings && audioRef.current) audioRef.current.currentTime = narr.timings[i] ?? 0;
  };
  const restart = () => { goTo(0); setPlaying(true); onPlay?.(); audioRef.current?.play().catch(() => {}); };

  const done = durations.slice(0, idx).reduce((a, b) => a + b, 0) + Math.min(elapsed, durations[idx]);
  const scene = video.scenes[idx];
  const Scene = SCENES[scene.kind];
  const btn = { minHeight: 44, borderRadius: 12, padding: '0 16px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: F.body, background: C.surface, color: C.accentText, border: `1px solid ${C.border}` } as const;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { pause(); return; }
    const tag = (e.target as HTMLElement).tagName;
    if (e.key === ' ' && tag !== 'BUTTON' && tag !== 'INPUT' && tag !== 'A') { e.preventDefault(); if (playing) pause(); else play(); }
  };

  return (
    <div ref={rootRef} onKeyDown={onKeyDown} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div role="region" aria-label={L(`Video: ${video.title}`, `Video: ${video.title}`)} tabIndex={0}
        style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 18, overflow: 'hidden', background: C.highlight, border: `1px solid ${C.accentBorder}` }}>
        <svg key={idx} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <Scene p={scene.props} planName={planName} lang={lang} />
        </svg>
        {scene.kind === 'end' && (
          <button type="button" onClick={onNext} style={{ position: 'absolute', left: '50%', top: '66%', transform: 'translateX(-50%)', minHeight: 52, padding: '0 28px', border: 'none', borderRadius: 14, background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary, fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: F.body, maxWidth: '90%' }}>
            {video.next.label} →
          </button>
        )}
        {captions && scene.kind !== 'end' && (
          <div aria-hidden="true" style={{ position: 'absolute', left: '50%', bottom: '4%', transform: 'translateX(-50%)', maxWidth: '86%', padding: '8px 14px', borderRadius: 8, background: C.captionBg, color: C.onPrimary, fontSize: 18, lineHeight: 1.4, textAlign: 'center' }}>
            {scene.caption}
          </div>
        )}
        <div role="status" className="sr-only">{scene.caption}</div>
        <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, background: C.accentSoft }}>
          <div style={{ width: `${Math.min(100, (done / total) * 100)}%`, height: '100%', background: C.accent, transition: 'width .1s linear' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <button ref={playRef} type="button" onClick={() => (playing ? pause() : play())}
          style={{ ...btn, border: 'none', background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary }}>
          {playing ? L('Pause', 'Pausa') : done === 0 ? L('▶ Play video', '▶ Reproducir video') : L('Play', 'Reproducir')}
        </button>
        <button type="button" onClick={restart} style={btn}>{L('Restart', 'Reiniciar')}</button>
        <span style={{ display: 'flex', gap: 6 }}>
          {video.scenes.map((_, i) => (
            <button key={i} type="button" onClick={() => goTo(i)} aria-label={L(`Go to scene ${i + 1}`, `Ir a la escena ${i + 1}`)} aria-current={i === idx ? 'true' : undefined}
              style={{ width: 40, height: 40, borderRadius: '50%', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F.body, background: i === idx ? C.accent : C.surface, color: i === idx ? C.onPrimary : C.accentText, border: `1px solid ${i === idx ? C.accent : C.border}` }}>{i + 1}</button>
          ))}
        </span>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, fontSize: 15, fontWeight: 600, color: C.text, cursor: 'pointer' }}>
          <input type="checkbox" checked={captions} onChange={(e) => setCaptions(e.target.checked)} style={{ width: 20, height: 20, accentColor: C.accent }} />
          {L('Captions', 'Subtítulos')}
        </label>
        <button type="button" aria-expanded={transcript} onClick={() => setTranscript((v) => !v)} style={{ ...btn, border: 'none', background: 'none', textDecoration: 'underline', padding: 0 }}>
          {transcript ? L('Hide transcript', 'Ocultar transcripción') : L('Show transcript', 'Mostrar transcripción')}
        </button>
      </div>

      {transcript && (
        <ol style={{ margin: 0, padding: '14px 14px 14px 36px', borderRadius: 12, background: C.surfaceAlt, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15, lineHeight: 1.5, color: C.text }}>
          {video.scenes.map((s, i) => <li key={i}>{s.caption}</li>)}
        </ol>
      )}

      <div style={{ fontSize: 12, color: C.textDim }}>{L('Silent with captions for now. Education only, not advice.', 'Sin sonido y con subtítulos por ahora. Solo educación, no consejos.')}</div>
    </div>
  );
}
