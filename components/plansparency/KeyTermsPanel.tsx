// @ts-nocheck
'use client';

import React from 'react';
import { C, F } from './theme';
import { getGlossary } from '@/lib/glossary';

export function KeyTermsPanel({ t, lang }) {
  const [openIndex, setOpenIndex] = React.useState(null);
  const terms = getGlossary(lang);
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: F.display }}>{t.keyTermsTitle}</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{t.keyTermsSubtitle}</div>
      </div>
      {terms.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={i} style={{
            borderRadius: 10,
            border: `1px solid ${open ? C.accent : C.border}`,
            marginBottom: 8,
            overflow: "hidden",
            background: open ? `${C.accent}08` : C.surface,
            transition: "border-color .15s, background .15s",
          }}>
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", background: "none", border: "none", cursor: "pointer",
                fontFamily: F.body, textAlign: "left",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: open ? C.accent : C.text }}>{item.term}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={open ? C.accent : C.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {open && (
              <div style={{ padding: "0 14px 14px", fontSize: 13, color: C.textMuted, lineHeight: 1.6, animation: "fadeIn .2s" }}>
                {item.def}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
