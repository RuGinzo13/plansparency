// @ts-nocheck
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { C, F, btnBase } from './theme';
import { Logo, LangToggle, Shield } from './ui';
import { IRS_LIMITS, getLimitYear } from '@/lib/plan/irs';
import { fmtRounded } from '@/lib/format';

// Turns on when invite links are allowed (OPEN-ITEMS 🔴 security section, #31/#34). Until then the box is not shown.
const PLAN_CODES_ENABLED = false;

const tpl = (s, vars) => Object.keys(vars).reduce((acc, k) => acc.split(`{${k}}`).join(String(vars[k])), s);

// The legal quote stays in English in both languages.
const EXAMPLE_QUOTE = "Elective deferrals for any taxable year shall not exceed the limitation under Code Section 402(g), as adjusted for cost-of-living increases.";

const iconProps = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
const DocIcon = ({ color }) => (
  <svg {...iconProps} stroke={color} aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
);
const ChartIcon = ({ color }) => (
  <svg {...iconProps} stroke={color} aria-hidden="true"><line x1="4" y1="20" x2="20" y2="20" /><rect x="5" y="12" width="3" height="8" /><rect x="10.5" y="7" width="3" height="13" /><rect x="16" y="3" width="3" height="17" /></svg>
);
const BookIcon = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
);
const ChatIcon = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);

export function Landing({ t, lang, setLang, stage, setStage, docType, setDocType, stagedFiles, setStagedFiles, fileInputRef, stageFile, handleDrop, dragOver, setDragOver, uploadError, proceedToPrivacy }) {
  const rootRef = useRef(null);
  const [wide, setWide] = useState(false);
  const [dragCard, setDragCard] = useState(null); // 'spd' | 'statement' | null
  const [planCode, setPlanCode] = useState("");
  const [rememberPlan, setRememberPlan] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setWide(entry.contentRect.width >= 900);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const limitYear = getLimitYear();
  const deferral = IRS_LIMITS[limitYear.year].deferral;

  const chooseType = (type) => {
    if (docType && docType !== type && stagedFiles.length > 0) setStagedFiles([]);
    setDocType(type);
    fileInputRef.current?.click();
  };
  const dropOnCard = (e, type) => {
    e.preventDefault();
    setDragCard(null);
    if (docType && docType !== type && stagedFiles.length > 0) setStagedFiles([]);
    setDocType(type);
    const f = e.dataTransfer.files?.[0];
    if (f) stageFile(f);
  };

  const cards = [
    { type: "spd", title: t.landCardPlanTitle, sub: t.landCardPlanSub, line: t.landCardPlanLine, color: C.accentText, soft: C.accentSoft, Icon: DocIcon, iconColor: C.accentText },
    { type: "statement", title: t.landCardStmtTitle, sub: t.landCardStmtSub, line: t.landCardStmtLine, color: C.green, soft: C.greenSoft, Icon: ChartIcon, iconColor: C.green },
  ];

  const Header = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: wide ? 48 : 28 }}>
      <Logo />
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <a href="/advisor" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", fontSize: 14, fontWeight: 600, color: C.accentText, textDecoration: "none" }}>{t.landForAdvisors}</a>
        <LangToggle lang={lang} setLang={setLang} />
      </div>
    </div>
  );

  const Hero = (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontFamily: F.display, fontSize: wide ? 76 : 44, fontWeight: 600, lineHeight: 1.04, margin: "0 0 16px", letterSpacing: "-.02em", color: C.text }}>
        {t.landHero1}<br />
        <span style={{ fontStyle: "italic", color: C.accentText }}>{t.landHero2}</span>
      </h1>
      <p style={{ fontSize: wide ? 18 : 16, color: C.textMuted, lineHeight: 1.6, margin: 0, maxWidth: 520 }}>{t.landSubtitle}</p>
    </div>
  );

  const Cards = (
    <div style={{ display: "grid", gridTemplateColumns: wide ? "1fr 1fr" : "1fr", gap: 16 }}>
      {cards.map((c) => {
        const selected = docType === c.type;
        const dimmed = docType && !selected;
        return (
          <button
            key={c.type}
            type="button"
            aria-pressed={selected}
            onClick={() => chooseType(c.type)}
            onDragOver={(e) => { e.preventDefault(); setDragCard(c.type); }}
            onDragLeave={() => setDragCard(null)}
            onDrop={(e) => dropOnCard(e, c.type)}
            style={{
              background: dragCard === c.type ? c.soft : C.surface,
              border: `2px solid ${selected || dragCard === c.type ? C.accent : C.border}`,
              boxShadow: selected ? `0 6px 20px ${C.accentGlow}` : "none",
              opacity: dimmed ? 0.55 : 1,
              borderRadius: 16, padding: 22, cursor: "pointer", textAlign: "left",
              fontFamily: F.body, color: C.text, transition: "all .2s", minHeight: 44,
            }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 14, background: c.soft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <c.Icon color={c.iconColor} />
            </div>
            <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.45, marginBottom: 2 }}>{c.sub}</div>
            <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.45, marginBottom: 14 }}>{c.line}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.color }}>{t.landChoosePdf}{wide ? t.landOrDrop : ""}</div>
          </button>
        );
      })}
    </div>
  );

  const isStatement = docType === "statement";
  const Staged = stagedFiles.length > 0 && (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {stagedFiles.map((f, i) => (
          <div key={f.name + i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 4px 14px", minHeight: 48, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accentText} strokeWidth="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
            <span style={{ fontSize: 12, color: C.textMuted, flexShrink: 0 }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
            <button
              type="button"
              aria-label={`${t.landRemoveFile}: ${f.name}`}
              onClick={() => setStagedFiles((prev) => prev.filter((_, j) => j !== i))}
              style={{ width: 44, height: 44, background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 20, lineHeight: 1, flexShrink: 0 }}
            >×</button>
          </div>
        ))}
      </div>

      {!isStatement && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{ ...btnBase, width: "100%", minHeight: 56, marginBottom: 12, padding: "10px 14px", textAlign: "left", background: "transparent", border: `2px dashed ${C.inputBorder}`, color: C.text, borderRadius: 12 }}
        >
          <div style={{ fontSize: 14, fontWeight: 700 }}>{t.landAddAnother}</div>
          <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 400 }}>{t.landAddAnotherSub}</div>
        </button>
      )}

      <button
        type="button"
        onClick={proceedToPrivacy}
        style={{ ...btnBase, width: "100%", height: 52, fontSize: 16, background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary }}
      >
        {isStatement ? t.landExplainStmt : t.landExplainPlan}
      </button>
      <button
        type="button"
        onClick={() => { setStagedFiles([]); setDocType(null); }}
        style={{ ...btnBase, width: "100%", minHeight: 44, marginTop: 4, background: "transparent", color: C.textMuted, fontSize: 14 }}
      >
        {t.landStartOver}
      </button>
    </div>
  );

  const CodeBox = PLAN_CODES_ENABLED && (
    <div style={{ marginTop: 24, padding: 18, borderRadius: 14, background: C.surfaceAlt }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{t.landCodeLabel}</div>
      <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.45, marginBottom: 12 }}>{t.landCodeHelp}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={planCode} onChange={(e) => setPlanCode(e.target.value)} placeholder={t.landCodePlaceholder} aria-label={t.landCodeLabel}
          style={{ flex: 1, minWidth: 140, height: 48, background: C.aiBubble, border: `1px solid ${C.inputBorder}`, borderRadius: 8, padding: "0 12px", fontSize: 16, fontFamily: F.body, color: C.text, boxSizing: "border-box" }}
        />
        <button type="button" style={{ ...btnBase, height: 48, padding: "0 20px", fontSize: 14, background: C.text, color: C.surface }}>{t.landCodeButton}</button>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, minHeight: 44, fontSize: 13, color: C.textMuted, cursor: "pointer" }}>
        <input type="checkbox" checked={rememberPlan} onChange={(e) => setRememberPlan(e.target.checked)} style={{ width: 18, height: 18 }} />
        {t.landCodeRemember}
      </label>
    </div>
  );

  const Example = (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <div style={{ background: C.surfaceAlt, padding: "20px 22px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.textMuted, marginBottom: 10 }}>{t.landExampleLabel}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 14, lineHeight: 1.55, color: C.textMuted }}>“{EXAMPLE_QUOTE}”</div>
      </div>
      <div style={{ background: C.text, color: C.surface, padding: "20px 22px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.borderLight, marginBottom: 10 }}>{t.landExamplePlain}</div>
        <div style={{ fontFamily: F.display, fontSize: wide ? 30 : 24, lineHeight: 1.25, fontWeight: 600 }}>
          {tpl(t.landExampleAnswer, { deferral: fmtRounded(deferral), year: limitYear.year })}
        </div>
      </div>
    </div>
  );

  const Steps = (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 28 }}>
      {[t.landStep1, t.landStep2, t.landStep3].map((label, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${C.accent}`, color: C.accentText, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 16, fontWeight: 700 }}>{i + 1}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</div>
        </div>
      ))}
    </div>
  );

  const Footer = (
    <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.borderLight}` }}>
      <div style={{ display: "flex", gap: "10px 24px", flexWrap: "wrap", marginBottom: 12 }}>
        {[[<Shield key="s" color={C.accentText} sz={16} />, t.landTrustNoSave], [<BookIcon key="b" color={C.accentText} />, t.trustEducation], [<ChatIcon key="c" color={C.accentText} />, t.trustPlain]].map(([ic, lb], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textMuted }}>{ic}<span>{lb}</span></div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5, margin: 0 }}>{t.footerDisclaimer}</p>
    </div>
  );

  const Left = (
    <div>
      {Hero}
      {Cards}
      {uploadError && <p role="alert" style={{ fontSize: 14, color: C.danger, margin: "14px 0 0", fontWeight: 600 }}>{uploadError}</p>}
      {Staged}
      {CodeBox}
    </div>
  );
  const Right = (
    <div>
      {Example}
      {Steps}
    </div>
  );

  return (
    <div ref={rootRef} style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body }}>
      <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) stageFile(e.target.files[0]); e.target.value = ""; }} />
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: wide ? "28px 32px 40px" : "16px 16px 32px", boxSizing: "border-box" }}>
        {Header}
        {wide ? (
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 56, alignItems: "start" }}>
            {Left}
            <div style={{ paddingTop: 12 }}>{Right}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {Left}
            {Right}
          </div>
        )}
        {Footer}
      </div>
    </div>
  );
}
