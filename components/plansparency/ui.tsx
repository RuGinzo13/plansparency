// @ts-nocheck
'use client';

import React from 'react';
import { C, F } from './theme';

// ── Markdown ──
export function Md({ text }) {
  const lines = text.split("\n"), els = []; let li = [];
  const flush = () => { if (li.length) { els.push(<ul key={`u${els.length}`} style={{ margin: "8px 0", paddingLeft: 20 }}>{li.map((x, i) => <li key={i} style={{ marginBottom: 4, color: C.text }}><Fm t={x} /></li>)}</ul>); li = []; } };
  lines.forEach((l, i) => { const b = l.match(/^[\-\*•]\s+(.*)/), n = l.match(/^\d+[\.\)]\s+(.*)/); if (b) { li.push(b[1]); return; } if (n) { li.push(n[1]); return; } flush(); if (!l.trim()) els.push(<div key={i} style={{ height: 8 }} />); else els.push(<p key={i} style={{ margin: "4px 0", lineHeight: 1.6, color: C.text }}><Fm t={l} /></p>); }); flush(); return <>{els}</>;
}
export function Fm({ t }) { const p = t.split(/(\*\*.*?\*\*)/g); return <>{p.map((s, i) => s.startsWith("**") && s.endsWith("**") ? <strong key={i} style={{ color: C.accent }}>{s.slice(2, -2)}</strong> : <span key={i}>{s}</span>)}</>; }

// ── Shared UI ──
export function LangToggle({ lang, setLang, disabled }) {
  const labels = { en: "EN", es: "ES" };
  return (
    <div style={{ display: "inline-flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, background: C.surface, opacity: disabled ? .5 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      {["en", "es"].map(l => (
        <button key={l} onClick={() => setLang(l)} style={{ padding: "7px 11px", border: "none", cursor: "pointer", fontFamily: F.body, fontSize: 11, fontWeight: 600, background: lang === l ? C.accentDim : "transparent", color: lang === l ? C.accent : C.textMuted, transition: "all .15s" }}>{labels[l]}</button>
      ))}
    </div>
  );
}
export function Logo({ small }) {
  return <div style={{ display: "inline-flex", alignItems: "center", gap: small ? 8 : 10, padding: small ? 0 : "8px 16px", borderRadius: small ? 0 : 100, border: small ? "none" : `1px solid ${C.border}`, background: small ? "transparent" : C.surface }}>
    <div style={{ width: small ? 28 : 30, height: small ? 28 : 30, borderRadius: 8, background: `linear-gradient(135deg,${C.accent},#B8863A)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: small ? 13 : 14, fontWeight: 700, color: "#0F1621" }}>P</div>
    <span style={{ fontFamily: F.display, fontSize: small ? 17 : 22, fontWeight: 600, letterSpacing: "-.01em", color: C.text }}>Plan<span style={{ color: C.accent }}>sparency</span></span>
  </div>;
}
export function Shield({ color, sz = 18 }) { return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>; }
export function Modal({ children }) { return <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)" }}><div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, maxWidth: 520, width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "32px 28px", boxShadow: "0 24px 80px rgba(0,0,0,.6)" }}>{children}</div></div>; }

// ── Summary stat chip (Investments) ──
export function StatChip({ value, label }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, padding: "8px 10px",
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      display: "flex", flexDirection: "column", gap: 1,
    }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: F.display, lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: 9, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
    </div>
  );
}

// ── Donut Chart ──
export function DonutChart({ segments, size = 140 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  const r = size / 2 - 12, cx = size / 2, cy = size / 2;
  let cumAngle = -90;
  const paths = segments.filter(s => s.value > 0).map((seg, i) => {
    const angle = (seg.value / total) * 360;
    const startAngle = cumAngle * Math.PI / 180;
    const endAngle = (cumAngle + angle) * Math.PI / 180;
    cumAngle += angle;
    const largeArc = angle > 180 ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const ir = r * 0.55;
    const x3 = cx + ir * Math.cos(endAngle), y3 = cy + ir * Math.sin(endAngle);
    const x4 = cx + ir * Math.cos(startAngle), y4 = cy + ir * Math.sin(startAngle);
    return <path key={i} d={`M${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} L${x3},${y3} A${ir},${ir} 0 ${largeArc},0 ${x4},${y4} Z`} fill={seg.color} />;
  });
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{paths}</svg>;
}
