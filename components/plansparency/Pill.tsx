'use client';

import React from 'react';
import { C } from './theme';

export type PillKind = 'yes' | 'no' | 'info' | 'ask';

// The one pill used everywhere (cards, side panel, calculator, advisor, plans table). It always carries words,
// never color alone. yes: solid green. no: solid gray. info: white with a dark border. ask: white with a coral border.
const KIND: Record<PillKind, { background: string; color: string; border: string }> = {
  yes: { background: C.green, color: C.onPrimary, border: `2px solid ${C.green}` },
  no: { background: C.textMuted, color: C.onPrimary, border: `2px solid ${C.textMuted}` },
  info: { background: C.surface, color: C.text, border: `2px solid ${C.bar}` },
  ask: { background: C.surface, color: C.accentText, border: `2px solid ${C.accent}` },
};
const SIZE = {
  md: { fontSize: 15, padding: '6px 14px' },
  sm: { fontSize: 13, padding: '3px 10px' },
};

export function Pill({ kind, size = 'md', children, style }: { kind: PillKind; size?: 'md' | 'sm'; children: React.ReactNode; style?: React.CSSProperties }) {
  const k = KIND[kind];
  const z = SIZE[size];
  return (
    <span style={{ display: 'inline-block', boxSizing: 'border-box', fontWeight: 700, lineHeight: 1.4, borderRadius: 100, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', ...z, ...k, ...style }}>{children}</span>
  );
}
