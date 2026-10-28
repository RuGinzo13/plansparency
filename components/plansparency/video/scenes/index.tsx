'use client';

import React, { useEffect, useState } from 'react';
import { C, ROLE } from '../../theme';
import { useStill, Badge, Building, Clock, Coin, Count, d, Frame, H, Jar, Lock, prefersReducedMotion, T, TONE, W, wrap, type LayerKind, type Tone } from './kit';
import type { SceneKind } from '@/lib/videos/types';

export interface SceneProps { p: Record<string, any>; planName: string; lang: 'en' | 'es' }

// ── Title ──
export function TitleScene({ p, planName }: SceneProps) {
  const lines = wrap(String(p.title ?? ''), 24);
  const y0 = p.art === 'none' ? 230 : 150;
  const art = p.art as string;
  return (
    <Frame planName={planName}>
      {lines.map((l, i) => <g key={i} className="vid-a vid-pop" style={d(0.1 + i * 0.15)}><T x={W / 2} y={y0 + i * 66} size={56} anchor="middle" display>{l}</T></g>)}
      {art === 'none' && <g className="vid-a vid-pop" style={d(0.8)}><rect x={W / 2 - 40} y={y0 + lines.length * 66 + 10} width={80} height={80} rx={20} fill={C.accent} /><T x={W / 2} y={y0 + lines.length * 66 + 66} size={52} fill={C.onPrimary} anchor="middle">P</T></g>}
      {art === 'jar' && <Jar cx={W / 2} top={y0 + lines.length * 66 - 40} w={150} h={130} layers={['you', 'employer', 'employer'] as LayerKind[]} scale={0.8} />}
      {art === 'jarDoor' && <g><Jar cx={W / 2 - 40} top={y0 + lines.length * 66 - 40} w={150} h={130} layers={['you', 'employer']} scale={0.8} /><g className="vid-a vid-pop" style={d(1)}><rect x={W / 2 + 40} y={y0 + lines.length * 66 - 20} width={70} height={110} rx={10} fill={C.accentBorder} stroke={C.accent} strokeWidth={4} /><circle cx={W / 2 + 96} cy={y0 + lines.length * 66 + 38} r={6} fill={C.accent} /></g></g>}
      {art === 'doors' && (
        <g>
          {(p.doors as string[]).map((label, i, all) => {
            const x = W / 2 + (i - (all.length - 1) / 2) * 230 - 80;
            return (
              <g key={label} className="vid-a vid-pop" style={d(0.8 + i * 0.3)}>
                <rect x={x} y={y0 + lines.length * 66 - 30} width={160} height={150} rx={16} fill={i === 0 && all.length > 1 ? C.surfaceAlt : C.accentSoft} stroke={i === 0 && all.length > 1 ? C.text : C.accent} strokeWidth={5} />
                <T x={x + 80} y={y0 + lines.length * 66 + 55} size={30} anchor="middle" fill={i === 0 && all.length > 1 ? C.text : C.accentText}>{label}</T>
              </g>
            );
          })}
        </g>
      )}
      {art === 'bar' && (
        <g>
          <rect x={160} y={y0 + lines.length * 66 + 10} width={640} height={50} rx={14} fill={C.surface} stroke={C.text} strokeWidth={4} />
          <line x1={760} y1={y0 + lines.length * 66 - 10} x2={760} y2={y0 + lines.length * 66 + 80} stroke={C.danger} strokeWidth={5} strokeDasharray="10 6" />
        </g>
      )}
      {art === 'person' && (
        <g className="vid-a vid-slide" style={d(0.8)}>
          <circle cx={W / 2 - 110} cy={y0 + lines.length * 66 + 10} r={26} fill={C.bar} />
          <rect x={W / 2 - 140} y={y0 + lines.length * 66 + 42} width={60} height={90} rx={16} fill={C.bar} />
          <rect x={W / 2 - 70} y={y0 + lines.length * 66 + 85} width={70} height={46} rx={8} fill={C.accent} />
          <Jar cx={W / 2 + 90} top={y0 + lines.length * 66 - 20} w={110} h={120} layers={['you', 'employer']} scale={0.8} />
        </g>
      )}
      {art === 'calendar' && (
        <g className="vid-a vid-pop" style={d(0.9)}>
          <rect x={W / 2 - 90} y={y0 + lines.length * 66 - 20} width={180} height={140} rx={14} fill={C.surface} stroke={C.text} strokeWidth={5} />
          <rect x={W / 2 - 90} y={y0 + lines.length * 66 - 20} width={180} height={40} rx={14} fill={C.accent} />
          <T x={W / 2} y={y0 + lines.length * 66 + 90} size={48} anchor="middle" display>20XX</T>
        </g>
      )}
    </Frame>
  );
}

// ── Jar: layers, lock, clock, falling layer, loan, hardship icons, compare ──
export function JarScene({ p, planName }: SceneProps) {
  const layers = (p.layers ?? []) as LayerKind[];
  const box = p.box as { tone: Tone; text: string } | undefined;
  const cx = p.compare ? 330 : box ? 330 : 480;
  return (
    <Frame planName={planName}>
      <Jar cx={cx} layers={layers} label={p.label} fall={!!p.fall} top={110} />
      {p.compare && <Jar cx={680} layers={['you', 'employer', 'employer', 'employer', 'you']} top={110} scale={1} delay={1.4} />}
      {p.locked && <g><Lock x={cx + 150} y={300} /></g>}
      {p.clock && <Clock x={cx + 190} y={170} />}
      {p.briefcase && (
        <g className="vid-a vid-slide" style={d(0.4)}><rect x={cx - 360} y={260} width={110} height={78} rx={10} fill={C.accent} /><rect x={cx - 332} y={240} width={54} height={24} rx={8} fill="none" stroke={C.accent} strokeWidth={6} /></g>
      )}
      {p.icons && (
        <g className="vid-a vid-pop" style={d(0.5)}>
          {['+', '⌂', '▲'].map((g, i) => <g key={i}><circle cx={cx + 230 + i * 0} cy={150 + i * 90} r={32} fill={C.surface} stroke={C.text} strokeWidth={4} /><T x={cx + 230} y={162 + i * 90} size={38} anchor="middle">{g}</T></g>)}
        </g>
      )}
      {p.badge && <Badge x={cx} y={420} text={p.badge.text} tone={p.badge.tone} />}
      {box && (
        <g className="vid-a vid-pop" style={d(2.4)}>
          <rect x={560} y={190} width={340} height={150} rx={16} fill={TONE[box.tone].bg} stroke={TONE[box.tone].fg} strokeWidth={3} />
          {wrap(box.text, 20).map((l, i) => <T key={i} x={730} y={245 + i * 38} size={30} fill={TONE[box.tone].fg} anchor="middle">{l}</T>)}
        </g>
      )}
    </Frame>
  );
}

// ── Paycheck: a slice of pay goes into the jar ──
export function PaycheckScene({ p, planName, lang }: SceneProps) {
  const counter = p.counter as { label: string; value: string; suffix: string } | undefined;
  const taxed = p.taxSlice === true;
  const sliceW = counter ? Math.min(300, 40 + Number(p.pct) * 36) : 0;
  return (
    <Frame planName={planName}>
      <g className="vid-a vid-slide" style={d(0.1)}>
        <rect x={90} y={130} width={400} height={190} rx={18} fill={C.surface} stroke={C.text} strokeWidth={4} />
        <T x={120} y={178} size={28}>{lang === 'es' ? 'Pago' : 'Paycheck'}</T>
        <rect x={120} y={205} width={340} height={46} rx={10} fill={C.surfaceAlt} />
        {counter ? (
          <g className="vid-g" style={d(0.8)}><rect x={120} y={205} width={sliceW} height={46} rx={10} fill={C.accent} /></g>
        ) : (
          <rect x={120} y={205} width={340} height={46} rx={10} fill={C.accentBorder} />
        )}
        {taxed && <g className="vid-a vid-fall" style={d(0.9)}><rect x={360} y={205} width={100} height={46} rx={10} fill={C.danger} /></g>}
        {!counter && !taxed && <T x={290} y={290} size={26} fill={C.green} anchor="middle">{'✓'}</T>}
      </g>
      {counter && <g><T x={120} y={380} size={30} fill={C.textMuted}>{counter.label}:</T><Count value={counter.value} x={225} y={382} size={46} suffix={counter.suffix} /></g>}
      <path d="M510 225 H590" stroke={C.text} strokeWidth={6} strokeLinecap="round" /><path d="M570 205 L592 225 L570 245" fill="none" stroke={C.text} strokeWidth={6} strokeLinecap="round" />
      <Jar cx={730} top={120} w={190} h={210} layers={['you', 'you', 'you']} label={p.jarLabel} delay={1} />
      {p.badge && <Badge x={730} y={440} text={p.badge.text} tone={p.badge.tone} />}
    </Frame>
  );
}

// ── Employer: building (money flows to the jar) or an account card ──
export function EmployerScene({ p, planName }: SceneProps) {
  const counter = p.counter as { label: string; value: string; suffix: string } | undefined;
  if (p.variant === 'account') {
    return (
      <Frame planName={planName}>
        <g className="vid-a vid-pop" style={d(0.2)}>
          <rect x={250} y={130} width={460} height={250} rx={22} fill={C.surface} stroke={C.text} strokeWidth={5} />
          <T x={W / 2} y={210} size={40} anchor="middle" display>{p.name}</T>
          <rect x={W / 2 - 100} y={260} width={200} height={70} rx={16} fill={C.accent} className="vid-a vid-pulse" style={d(1)} />
          <T x={W / 2} y={308} size={32} fill={C.onPrimary} anchor="middle">{p.button}</T>
        </g>
      </Frame>
    );
  }
  return (
    <Frame planName={planName}>
      <g className="vid-a vid-slide" style={d(0.1)}><Building x={90} y={140} /></g>
      <T x={165} y={380} size={26} anchor="middle" fill={C.textMuted}>{p.name}</T>
      <g className="vid-a vid-slide" style={d(0.9)}><Coin x={350} y={230} r={30} fill={C.green} text="$" /></g>
      <Jar cx={720} top={120} w={200} h={220} layers={['you', 'you', 'employer', 'employer']} label={p.jar} delay={1.2} />
      {p.big && (
        <g className="vid-a vid-pop" style={d(1.6)}>
          <T x={380} y={330} size={p.flat ? 58 : 48} fill={C.green} display>{p.big}</T>
          {p.bigSub && <T x={380} y={372} size={28} fill={C.green}>{p.bigSub}</T>}
        </g>
      )}
      {counter && <g><T x={380} y={420} size={28} fill={C.textMuted}>{counter.label}:</T><Count value={counter.value} x={640} y={422} size={42} fill={C.green} suffix={counter.suffix} /></g>}
    </Frame>
  );
}

// ── Coins: $1 in, a smaller coin out ──
export function CoinsScene({ p, planName }: SceneProps) {
  return (
    <Frame planName={planName}>
      <g className="vid-a vid-pop" style={d(0.2)}><Coin x={280} y={270} r={110} fill={C.bar} text={p.from} size={64} /></g>
      <g className="vid-a vid-pop" style={d(1)}><path d="M420 270 H540" stroke={C.text} strokeWidth={8} strokeLinecap="round" /><path d="M510 240 L545 270 L510 300" fill="none" stroke={C.text} strokeWidth={8} strokeLinecap="round" /></g>
      <g className="vid-a vid-pop" style={d(1.6)}><Coin x={700} y={270} r={72} fill={C.green} text={p.to} size={44} /></g>
    </Frame>
  );
}

// ── Bars: two bars growing side by side, or the yearly limit bar ──
export function BarsScene({ p, planName }: SceneProps) {
  const lim = p.limit as { baseFrac: number; extraFrac: number; extraKind: '50' | '6063' | null; label: string; line: string; jarBeside?: boolean; jarLabel?: string } | undefined;
  if (lim) {
    const x0 = 120;
    const full = 600;
    const bw = lim.baseFrac * full;
    const ew = lim.extraFrac * full;
    return (
      <Frame planName={planName}>
        <rect x={x0} y={200} width={full} height={64} rx={16} fill={C.surface} stroke={C.border} strokeWidth={3} />
        <g className="vid-g" style={d(0.3)}><rect x={x0} y={200} width={bw} height={64} rx={16} fill={C.accent} /></g>
        {ew > 0 && <g className="vid-g" style={{ ...d(0.6), transformOrigin: '0 50%' }}><rect x={x0 + bw - 12} y={200} width={ew + 12} height={64} rx={16} fill={lim.extraKind === '6063' ? ROLE.consultant.base : C.accentBorder} stroke={lim.extraKind === '6063' ? 'none' : C.accent} strokeWidth={3} /></g>}
        <line x1={x0 + bw} y1={170} x2={x0 + bw} y2={300} stroke={C.danger} strokeWidth={5} strokeDasharray="10 6" />
        <T x={x0 + bw} y={160} size={26} fill={C.danger} anchor="middle">{lim.line}</T>
        <g className="vid-a vid-pop" style={d(1.2)}><T x={x0} y={350} size={40} display>{lim.label}</T></g>
        {lim.jarBeside && <g><Jar cx={800} top={150} w={130} h={170} layers={['employer', 'employer', 'employer']} label={lim.jarLabel} scale={0.9} delay={0.6} /></g>}
      </Frame>
    );
  }
  const a = p.a as { label: string; value: string; frac: number };
  const b = p.b as { label: string; value: string; frac: number };
  return (
    <Frame planName={planName}>
      {[a, b].map((r, i) => (
        <g key={r.label}>
          <T x={120} y={190 + i * 110} size={30}>{r.label}</T>
          <rect x={120} y={205 + i * 110} width={560} height={52} rx={14} fill={C.surfaceAlt} />
          <g className="vid-g" style={d(0.4 + i * 0.5)}><rect x={120} y={205 + i * 110} width={Math.max(4, 560 * r.frac)} height={52} rx={14} fill={i === 0 ? C.bar : C.green} /></g>
          <Count value={r.value} x={710} y={245 + i * 110} size={40} />
        </g>
      ))}
      {p.note && <g className="vid-a vid-pop" style={d(1.6)}><rect x={190} y={420} width={580} height={56} rx={14} fill={C.greenSoft} stroke={C.green} strokeWidth={3} /><T x={480} y={458} size={28} fill={C.green} anchor="middle">{p.note}</T></g>}
    </Frame>
  );
}

// ── Steps: three icons with arrows, or year columns ──
export function StepsScene({ p, planName }: SceneProps) {
  if (p.variant === 'years') {
    const values = p.values as number[];
    const top = Number(p.top);
    const cols = Array.from({ length: top + 2 }, (_, i) => values[Math.min(i, values.length - 1)]);
    const cw = Math.min(90, 760 / cols.length);
    const x0 = (W - cw * cols.length) / 2;
    return (
      <Frame planName={planName}>
        {cols.map((v, i) => {
          const h = Math.max(10, (v / 100) * 230);
          return (
            <g key={i}>
              <g className="vid-gy" style={d(0.2 + i * 0.35)}><rect x={x0 + i * cw + 8} y={360 - h} width={cw - 16} height={h} rx={8} fill={v === 100 ? C.green : C.accent} /></g>
              <T x={x0 + i * cw + cw / 2} y={350 - h} size={22} anchor="middle">{v}%</T>
              <T x={x0 + i * cw + cw / 2} y={392} size={22} fill={C.textMuted} anchor="middle">{i === 0 ? '0' : i === cols.length - 1 ? `${i}+` : i}</T>
            </g>
          );
        })}
      </Frame>
    );
  }
  const items = p.items as string[];
  return (
    <Frame planName={planName}>
      {items.map((label, i) => {
        const cx = 190 + i * 290;
        return (
          <g key={label}>
            <g className="vid-a vid-pop" style={d(0.3 + i * 0.7)}>
              <circle cx={cx} cy={230} r={70} fill={C.surface} stroke={C.accent} strokeWidth={6} />
              <T x={cx} y={250} size={56} fill={C.accent} anchor="middle" display>{i + 1}</T>
              <T x={cx} y={348} size={30} anchor="middle">{label}</T>
            </g>
            {i < items.length - 1 && <g className="vid-a vid-pop" style={d(0.7 + i * 0.7)}><path d={`M${cx + 85} 230 H${cx + 205}`} stroke={C.text} strokeWidth={6} strokeLinecap="round" /><path d={`M${cx + 185} 212 L${cx + 207} 230 L${cx + 185} 248`} fill="none" stroke={C.text} strokeWidth={6} strokeLinecap="round" /></g>}
          </g>
        );
      })}
    </Frame>
  );
}

// ── Tax: money coming out of a jar with a tax slice cut, or both jars ──
export function TaxScene({ p, planName }: SceneProps) {
  if (p.mode === 'both') {
    const labels = p.labels as string[];
    return (
      <Frame planName={planName}>
        <Jar cx={290} top={120} w={190} h={210} layers={['you', 'you', 'you']} label={labels[0]} />
        <g className="vid-a vid-pop" style={d(1)}><T x={W / 2} y={250} size={80} anchor="middle" display>+</T></g>
        <Jar cx={670} top={120} w={190} h={210} layers={['you', 'you', 'you']} label={labels[1]} delay={0.6} />
      </Frame>
    );
  }
  const pre = p.mode === 'out-pre';
  return (
    <Frame planName={planName}>
      <Jar cx={330} top={120} w={190} h={210} layers={['you', 'you']} label={String(p.jarLabel)} />
      <g className="vid-a vid-slide" style={d(0.8)}><rect x={520} y={200} width={170} height={52} rx={12} fill={C.bar} /></g>
      {pre && <g className="vid-a vid-fall" style={d(1.5)}><rect x={650} y={200} width={90} height={52} rx={12} fill={C.danger} /></g>}
      <Badge x={W / 2 + 120} y={380} text={p.badge.text} tone={p.badge.tone} />
      {p.footnote && <T x={W / 2} y={440} size={24} fill={C.textMuted} anchor="middle">{p.footnote}</T>}
    </Frame>
  );
}

// ── Choices: cards with badges ──
export function ChoicesScene({ p, planName }: SceneProps) {
  const cards = p.cards as { title: string; badge?: { tone: Tone; text: string }; danger?: boolean }[];
  const cw = 200;
  const gap = 20;
  const x0 = (W - (cw * cards.length + gap * (cards.length - 1))) / 2;
  return (
    <Frame planName={planName}>
      {cards.map((c, i) => (
        <g key={c.title} className={`vid-a vid-pop ${p.glow && i < p.glow ? 'vid-pulse' : ''}`} style={d(0.3 + i * 0.6)}>
          <rect x={x0 + i * (cw + gap)} y={150} width={cw} height={200} rx={18} fill={c.danger ? C.dangerSoft : C.surface} stroke={c.danger ? C.danger : p.glow && i < p.glow ? C.green : C.border} strokeWidth={c.danger ? 5 : 4} />
          {wrap(c.title, 12).map((l, j) => <T key={j} x={x0 + i * (cw + gap) + cw / 2} y={212 + j * 36} size={28} anchor="middle">{l}</T>)}
          {c.badge && <g><rect x={x0 + i * (cw + gap) + 12} y={290} width={cw - 24} height={44} rx={22} fill={TONE[c.badge.tone].bg} /><T x={x0 + i * (cw + gap) + cw / 2} y={320} size={c.badge.text.length > 14 ? 18 : 22} fill={TONE[c.badge.tone].fg} anchor="middle">{c.badge.text}</T></g>}
        </g>
      ))}
      {p.tip && <g className="vid-a vid-fall" style={d(2)}><rect x={x0 + 3 * (cw + gap) + 30} y={360} width={140} height={34} rx={8} fill={C.danger} /></g>}
    </Frame>
  );
}

// ── Calendar: a year page with a pin ──
export function CalendarScene({ p, planName }: SceneProps) {
  return (
    <Frame planName={planName}>
      <g className="vid-a vid-pop" style={d(0.2)}>
        <rect x={W / 2 - 170} y={120} width={340} height={270} rx={22} fill={C.surface} stroke={C.text} strokeWidth={6} />
        <rect x={W / 2 - 170} y={120} width={340} height={70} rx={22} fill={C.accent} />
        <T x={W / 2} y={300} size={86} anchor="middle" display>{String(p.year)}</T>
      </g>
      {p.pin && <g className="vid-a vid-drop" style={d(1.2)}><circle cx={W / 2 + 120} cy={290} r={22} fill={C.danger} /><path d={`M${W / 2 + 120} 312 v36`} stroke={C.danger} strokeWidth={6} /></g>}
    </Frame>
  );
}

// ── Mix: stocks and bonds bar that slides, or one fund card ──
export function MixScene({ p, planName, lang }: SceneProps) {
  const from = Number(p.stocks);
  const to = p.to === undefined ? from : Number(p.to);
  const still = useStill();
  const [pct, setPct] = useState(prefersReducedMotion() || still ? to : from);
  useEffect(() => {
    if (prefersReducedMotion() || still || to === from) return;
    const t = setTimeout(() => setPct(to), 1200);
    return () => clearTimeout(t);
  }, [from, to]);
  if (p.variant === 'card') {
    return (
      <Frame planName={planName}>
        <g className="vid-a vid-pop" style={d(0.2)}>
          <rect x={300} y={130} width={360} height={220} rx={22} fill={C.surface} stroke={C.text} strokeWidth={5} />
          <T x={W / 2} y={215} size={34} anchor="middle" display>{lang === 'es' ? 'Fecha objetivo' : 'Target date'}</T>
          <rect x={340} y={245} width={280} height={30} rx={8} fill={C.accent} /><rect x={340 + 280 * 0.55} y={245} width={280 * 0.45} height={30} rx={8} fill={C.track} />
        </g>
        <g className="vid-a vid-pop" style={d(0.8)}><circle cx={640} cy={142} r={30} fill={C.surfaceAlt} stroke={C.text} strokeWidth={5} /><circle cx={640} cy={142} r={10} fill={C.text} /></g>
        <g className="vid-a vid-pop" style={d(1.2)}><T x={W / 2} y={420} size={30} anchor="middle">{p.note}</T></g>
      </Frame>
    );
  }
  const x0 = 130;
  const full = 700;
  return (
    <Frame planName={planName}>
      <rect x={x0} y={170} width={full} height={90} rx={18} fill={C.track} />
      <rect x={x0} y={170} width={(full * pct) / 100} height={90} rx={18} fill={C.accent} style={{ transition: 'width 1.6s ease-in-out' }} />
      <T x={x0 + 20} y={230} size={32} fill={C.onPrimary}>{p.stocksLabel}</T>
      <T x={x0 + full - 20} y={230} size={32} fill={C.text} anchor="end">{p.bondsLabel}</T>
      <g className="vid-a vid-pop" style={d(0.8)}><T x={W / 2} y={340} size={32} anchor="middle">{p.note}</T></g>
    </Frame>
  );
}

// ── Callout: a green or yellow box ──
export function CalloutScene({ p, planName }: SceneProps) {
  const t = TONE[p.tone as Tone];
  return (
    <Frame planName={planName}>
      <g className="vid-a vid-pop" style={d(0.2)}>
        <rect x={180} y={170} width={600} height={170} rx={24} fill={t.bg} stroke={t.fg} strokeWidth={4} />
        {wrap(String(p.text), 22).map((l, i) => <T key={i} x={W / 2} y={255 + i * 54} size={46} fill={t.fg} anchor="middle" display>{l}</T>)}
      </g>
    </Frame>
  );
}

// ── End card: the big line. The next-step button is a real HTML button the player puts over the stage. ──
export function EndScene({ p, planName }: SceneProps) {
  return (
    <Frame planName={planName}>
      {wrap(String(p.line), 26).map((l, i) => <g key={i} className="vid-a vid-pop" style={d(0.2 + i * 0.2)}><T x={W / 2} y={190 + i * 64} size={54} anchor="middle" display>{l}</T></g>)}
    </Frame>
  );
}

export const SCENES: Record<SceneKind, (props: SceneProps) => React.ReactElement> = {
  title: TitleScene, jar: JarScene, paycheck: PaycheckScene, employer: EmployerScene, coins: CoinsScene, bars: BarsScene, steps: StepsScene,
  tax: TaxScene, choices: ChoicesScene, calendar: CalendarScene, mix: MixScene, callout: CalloutScene, end: EndScene,
};
export { H };
