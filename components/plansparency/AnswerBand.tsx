'use client';

import React from 'react';
import { C } from './theme';
import type { PillKind } from './Pill';

// The answer line at the top of an open card. The color is a second cue; the words carry the answer.
const KIND: Record<PillKind, { background: string; color: string; bar: string }> = {
  yes: { background: C.greenSoft, color: C.green, bar: C.green },
  no: { background: C.surfaceAlt, color: C.text, bar: C.textMuted },
  ask: { background: C.highlight, color: C.accentText, bar: C.accent },
  info: { background: C.surfaceAlt, color: C.text, bar: C.bar },
};

export function AnswerBand({ kind, children }: { kind: PillKind; children: React.ReactNode }) {
  const k = KIND[kind];
  return (
    <div style={{ padding: '14px 16px', borderRadius: 10, fontSize: 18, fontWeight: 700, lineHeight: 1.4, background: k.background, color: k.color, borderLeft: `6px solid ${k.bar}` }}>{children}</div>
  );
}
