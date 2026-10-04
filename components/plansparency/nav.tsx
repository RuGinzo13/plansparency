// @ts-nocheck
'use client';

import React from 'react';
import { C, F } from './theme';
import { Logo, Shield, LangToggle } from './ui';

export function TabBar({ activeTab, setActiveTab, t }) {
  const tabs = [
    {
      id: "dashboard",
      label: t.navYourPlan,
      icon: (active) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? C.accent : C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      id: "calculator",
      label: t.navCalculator,
      icon: (active) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? C.accent : C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2"/>
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="10" x2="16" y2="10"/>
          <line x1="8" y1="14" x2="11" y2="14"/>
          <line x1="13" y1="14" x2="16" y2="14"/>
          <line x1="8" y1="18" x2="11" y2="18"/>
          <line x1="13" y1="18" x2="16" y2="18"/>
        </svg>
      ),
    },
    {
      id: "keyterms",
      label: t.navKeyTerms,
      icon: (active) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? C.accent : C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          <line x1="9" y1="7" x2="15" y2="7"/>
          <line x1="9" y1="11" x2="15" y2="11"/>
          <line x1="9" y1="15" x2="12" y2="15"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      display: "flex",
      borderBottom: `1px solid ${C.border}`,
      background: C.surface,
      flexShrink: 0,
    }}>
      {tabs.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "10px 4px 8px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${active ? C.accent : "transparent"}`,
              cursor: "pointer",
              fontFamily: F.body,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              transition: "all .15s",
              color: active ? C.accent : C.textMuted,
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textMuted; }}
          >
            {tab.icon(active)}
            <span style={{
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              letterSpacing: ".03em",
              textTransform: "uppercase",
            }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Plan Guide / Investments 2-Tab Bar ──
export function PlanGuideTabBar({ activeTab, setActiveTab, hasFunds }) {
  const tabs = [
    { id: "guide", label: "Plan Guide" },
    { id: "investments", label: "Investments" },
  ];
  return (
    <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      {tabs.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: "11px 8px 9px",
              background: active ? C.accentDim : "transparent",
              border: "none",
              borderBottom: `2px solid ${active ? C.accent : "transparent"}`,
              cursor: "pointer", fontFamily: F.body,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all .15s",
              color: active ? C.accent : C.textMuted,
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textMuted; }}
          >
            <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, letterSpacing: ".03em", textTransform: "uppercase" }}>
              {tab.label}
            </span>
            {tab.id === "investments" && !hasFunds && (
              <span style={{
                fontSize: 9, fontWeight: 700, background: C.accentDim, color: C.accent,
                border: `1px solid ${C.accent}44`, borderRadius: 100, padding: "1px 6px",
                textTransform: "uppercase", letterSpacing: ".04em",
              }}>
                UPLOAD DOC
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── App Header (shared across dashboard / statement / chat stages) ──
export function AppHeader({ accentColor, title, onBack, backLabel, lang, setLang, loading, t, advisorLogo, advisorFirmName }) {
  return (
    <div style={{ padding: "10px 16px", borderBottom: `2px solid ${accentColor}`, background: C.surface, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {onBack && (
          <button onClick={onBack} style={{
            padding: "7px 14px", borderRadius: 10, border: `1px solid ${accentColor}`,
            background: `${accentColor}22`, color: accentColor, fontSize: 12, fontFamily: F.body,
            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            transition: "all .15s", flexShrink: 0,
          }}
            onMouseEnter={e => e.currentTarget.style.background = `${accentColor}44`}
            onMouseLeave={e => e.currentTarget.style.background = `${accentColor}22`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            {backLabel}
          </button>
        )}
        {advisorLogo || advisorFirmName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {advisorLogo && <img src={advisorLogo} alt={advisorFirmName || 'Advisor'} style={{ height: 28, borderRadius: 6, objectFit: 'contain' }} />}
            {advisorFirmName && <span style={{ fontFamily: F.display, fontSize: 17, fontWeight: 600, color: C.text }}>{advisorFirmName}</span>}
          </div>
        ) : (
          <Logo small />
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.green, background: C.greenDim, padding: "3px 8px", borderRadius: 100, border: "1px solid rgba(92,184,138,.15)" }}>
            <Shield color={C.green} sz={10} />{t.securityBadge}
          </div>
          <LangToggle lang={lang} setLang={setLang} disabled={loading} />
          <div style={{ fontSize: 10, color: C.warning, background: "rgba(212,168,67,.08)", padding: "3px 8px", borderRadius: 100, border: "1px solid rgba(212,168,67,.18)", whiteSpace: "nowrap" }}>
            {t.disclaimer}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: accentColor, flexShrink: 0 }} />
        <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: ".01em" }}>{title}</div>
      </div>
    </div>
  );
}
