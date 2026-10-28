'use client';

import React from 'react';
import { C } from './theme';

// A white card on the gray page. `strong` is the open or primary one: a dark 2px border and a deeper shadow.
export function Panel({ strong = false, children, style, ...rest }: { strong?: boolean; children: React.ReactNode; style?: React.CSSProperties } & Omit<React.HTMLAttributes<HTMLElement>, 'style'>) {
  return (
    <section {...rest} style={{ background: C.surface, borderRadius: 16, padding: 20, boxSizing: 'border-box', border: strong ? `2px solid ${C.bar}` : 'none', boxShadow: strong ? `0 4px 14px ${C.cardShadow}` : `0 1px 3px ${C.cardShadow}`, ...style }}>{children}</section>
  );
}
