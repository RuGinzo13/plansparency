'use client';
import React from 'react';
import { C, F, LAYOUT } from '../theme';
import { Logo, SkipLink } from '../ui';

// Page frame for the advisor screens: logo, "For advisors" chip, skip link, one <main>.
export function AdvisorShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: C.page, color: C.text, fontFamily: F.body }}>
      <SkipLink lang="en" />
      <div style={{ maxWidth: LAYOUT.advisor, margin: '0 auto', padding: '20px 16px 48px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <Logo small={false} />
          <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 100, background: C.accentSoft, color: C.accentText }}>For advisors</span>
        </div>
        <main id="main" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}

export function BackLink() {
  return <a href="/advisor" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, fontSize: 14, fontWeight: 600, color: C.accentText }}>← Your plans</a>;
}

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
