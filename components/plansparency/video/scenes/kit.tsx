'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { C, F } from '../../theme';

// Drawing pieces shared by the scenes. Everything is drawn on a 960 x 540 stage.
export const W = 960;
export const H = 540;

export type Tone = 'green' | 'red' | 'yellow';
export const TONE: Record<Tone, { bg: string; fg: string }> = {
  green: { bg: C.greenSoft, fg: C.green },
  red: { bg: C.dangerSoft, fg: C.danger },
  yellow: { bg: C.warningDim, fg: C.warning },
};

// Thumbnails draw a scene in its finished state: no animation, numbers already counted.
export const StillCtx = createContext(false);
export const useStill = () => useContext(StillCtx);

export const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Delay in seconds for the CSS animations (--d).
export const d = (s: number): React.CSSProperties => ({ ['--d' as string]: `${s}s` });

export function T({ x, y, size = 30, weight = 700, fill = C.text, anchor = 'start', display, children }: { x: number; y: number; size?: number; weight?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; display?: boolean; children: React.ReactNode }) {
  return <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} fontFamily={display ? F.display : F.body}>{children}</text>;
}

// Breaks a title into lines of about `max` characters.
export function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const word of text.split(' ')) {
    if ((cur + ' ' + word).trim().length > max && cur) { lines.push(cur); cur = word; } else cur = (cur + ' ' + word).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

// Every scene starts with the stage color, the small P logo and the plan name, top left.
export function Frame({ planName, children }: { planName: string; children?: React.ReactNode }) {
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={C.highlight} />
      <rect x={28} y={24} width={44} height={44} rx={11} fill={C.accent} />
      <T x={50} y={56} size={28} fill={C.onPrimary} anchor="middle">P</T>
      <T x={84} y={55} size={26} display>{planName}</T>
      {children}
    </g>
  );
}

export function Badge({ x, y, text, tone, size = 26 }: { x: number; y: number; text: string; tone: Tone; size?: number }) {
  const w = Math.round(text.length * size * 0.56 + 36);
  const t = TONE[tone];
  return (
    <g className="vid-a vid-pop" style={d(1.4)}>
      <rect x={x - w / 2} y={y - size - 4} width={w} height={size + 16} rx={(size + 16) / 2} fill={t.bg} stroke={t.fg} strokeWidth={2} />
      <T x={x} y={y + 2} size={size} fill={t.fg} anchor="middle">{text}</T>
    </g>
  );
}

export type LayerKind = 'you' | 'employer' | 'pale' | 'dashed' | 'fade';
const LAYER_H = 34;

export function Layer({ x, y, w, kind, delay }: { x: number; y: number; w: number; kind: LayerKind; delay: number }) {
  const cls = kind === 'fade' ? 'vid-a vid-fall' : 'vid-a vid-drop';
  const fade = kind === 'fade';
  const fill = kind === 'you' ? C.bar : kind === 'employer' || fade ? C.green : kind === 'pale' ? C.greenSoft : 'none';
  const stroke = kind === 'pale' || kind === 'dashed' ? C.green : 'none';
  return (
    <g className={cls} style={d(fade ? delay + 1.2 : delay)}>
      <rect x={x} y={y} width={w} height={LAYER_H} rx={7} fill={fill} stroke={stroke} strokeWidth={3} strokeDasharray={kind === 'dashed' ? '10 7' : undefined} />
    </g>
  );
}

// A glass jar with layers stacked from the bottom. `fall` slides a dashed layer off a table edge.
export function Jar({ cx, top = 120, w = 230, h = 260, layers = [], label, scale = 1, delay = 0.2, fall = false }: { cx: number; top?: number; w?: number; h?: number; layers?: LayerKind[]; label?: string; scale?: number; delay?: number; fall?: boolean }) {
  const x = cx - w / 2;
  const bottom = top + h;
  return (
    <g transform={`translate(${cx} ${bottom}) scale(${scale}) translate(${-cx} ${-bottom})`}>
      <rect x={x} y={top} width={w} height={h} rx={26} fill={C.surface} stroke={C.text} strokeWidth={5} />
      <rect x={x + 30} y={top - 14} width={w - 60} height={16} rx={8} fill={C.text} />
      {layers.map((k, i) => <Layer key={i} x={x + 14} y={bottom - 14 - (i + 1) * (LAYER_H + 4) + 4} w={w - 28} kind={k} delay={delay + i * 0.35} />)}
      {fall && (
        <g className="vid-a vid-fall" style={d(delay + layers.length * 0.35 + 0.6)}>
          <rect x={x + w + 20} y={bottom - 50} width={w - 30} height={LAYER_H} rx={7} fill="none" stroke={C.green} strokeWidth={3} strokeDasharray="10 7" />
        </g>
      )}
      {fall && <rect x={x + w + 10} y={bottom - 12} width={w} height={12} rx={4} fill={C.border} />}
      {label && <T x={cx} y={bottom + 44} size={28} anchor="middle">{label}</T>}
    </g>
  );
}

export function Lock({ x, y }: { x: number; y: number }) {
  return (
    <g className="vid-a vid-pop" style={d(1.3)}>
      <path d={`M${x + 6} ${y} v-14 a14 14 0 0 1 28 0 v14`} fill="none" stroke={C.text} strokeWidth={5} />
      <rect x={x} y={y} width={40} height={32} rx={7} fill={C.text} />
    </g>
  );
}

export function Clock({ x, y }: { x: number; y: number }) {
  return (
    <g className="vid-a vid-pop" style={d(1.3)}>
      <circle cx={x} cy={y} r={26} fill={C.surface} stroke={C.text} strokeWidth={5} />
      <path d={`M${x} ${y - 14} V${y} l12 8`} fill="none" stroke={C.text} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

export function Coin({ x, y, r, fill, text, textFill = C.onPrimary, size = 30 }: { x: number; y: number; r: number; fill: string; text: string; textFill?: string; size?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={fill} />
      <T x={x} y={y + size / 3} size={size} fill={textFill} anchor="middle">{text}</T>
    </g>
  );
}

export function Building({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={150} height={200} rx={10} fill={C.bar} />
      {[0, 1, 2].flatMap((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={x + 26 + c * 66} y={y + 24 + r * 46} width={34} height={28} rx={4} fill={C.barLine} />))}
      <rect x={x + 54} y={y + 150} width={42} height={50} rx={5} fill={C.surface} />
    </g>
  );
}

// A number that counts up from 0 over two seconds (shows the final value when motion is reduced).
export function Count({ value, x, y, size = 44, fill = C.text, anchor = 'start', suffix }: { value: string; x: number; y: number; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; suffix?: string }) {
  const m = value.match(/^(\$?)([\d,]+)(.*)$/);
  const target = m ? Number(m[2].replace(/,/g, '')) : NaN;
  const still = useStill();
  const [now, setNow] = useState(prefersReducedMotion() || still || !m ? target : 0);
  useEffect(() => {
    if (!m || still || prefersReducedMotion()) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 2000);
      setNow(Math.round(target * k));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = m ? `${m[1]}${now.toLocaleString()}${m[3]}` : value;
  return <T x={x} y={y} size={size} fill={fill} anchor={anchor} display>{suffix ? `${shown} ${suffix}` : shown}</T>;
}
