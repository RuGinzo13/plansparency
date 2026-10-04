// @ts-nocheck
'use client';

import React from 'react';
import { C, F, btnBase } from './theme';
import { Logo, LangToggle, Shield } from './ui';

// The two start screens (document chooser and file drop), moved out of
// PlansparencyApp.tsx unchanged. Phase 9 replaces them with one new screen.
export function Landing({ t, lang, setLang, stage, setStage, docType, setDocType, stagedFiles, setStagedFiles, fileInputRef, stageFile, handleDrop, dragOver, setDragOver, uploadError, proceedToPrivacy }) {
  if (stage === "chooser") return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .02, backgroundImage: `linear-gradient(${C.accent} 1px,transparent 1px),linear-gradient(90deg,${C.accent} 1px,transparent 1px)`, backgroundSize: "80px 80px" }} />
    <div style={{ position: "absolute", top: -200, left: "25%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,168,83,.12) 0%,transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />
    <div style={{ position: "relative", zIndex: 1, maxWidth: 600, textAlign: "center" }}>
      <div style={{ marginBottom: 24 }}><LangToggle lang={lang} setLang={setLang} /></div>
      <div style={{ marginBottom: 28 }}><Logo /></div>
      <h1 style={{ fontFamily: F.display, fontSize: "clamp(38px,7vw,62px)", fontWeight: 600, lineHeight: 1.08, margin: "0 0 6px", letterSpacing: "-.02em" }}>
        {t.heroLine1}{" "}<span style={{ fontStyle: "italic", background: `linear-gradient(135deg,${C.accent},${C.green})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t.tagline}</span>
      </h1>
      <p style={{ fontSize: 16, color: C.textMuted, lineHeight: 1.6, margin: "0 0 10px", maxWidth: 460, marginInline: "auto" }}>{t.subtitle}</p>
      <p style={{ fontSize: 13, color: C.textDim, margin: "0 0 32px" }}>{t.chooserSub}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* SPD option */}
        <button onClick={() => { setDocType("spd"); setStage("landing"); }} style={{
          background: C.surface, border: `2px solid ${C.border}`, borderRadius: 20, padding: "32px 24px",
          cursor: "pointer", fontFamily: F.body, textAlign: "center", transition: "all .2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: `1px solid rgba(212,168,83,.2)` }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: F.display, marginBottom: 8 }}>{t.chooserSpd}</div>
          <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{t.chooserSpdSub}</div>
        </button>

        {/* Statement option */}
        <button onClick={() => { setDocType("statement"); setStage("landing"); }} style={{
          background: C.surface, border: `2px solid ${C.border}`, borderRadius: 20, padding: "32px 24px",
          cursor: "pointer", fontFamily: F.body, textAlign: "center", transition: "all .2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.greenDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: `1px solid rgba(92,184,138,.2)` }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="1.5"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="12" y2="15"/><path d="M17 15l2 2-2 2"/></svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: F.display, marginBottom: 8 }}>{t.chooserStmt}</div>
          <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{t.chooserStmtSub}</div>
        </button>
      </div>

      {/* Trust & Security */}
      <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginTop: 36 }}>
        {[[<Shield key="s" color={C.accent} sz={14} />, t.trustPrivate], ["🔒", t.trustEncrypted], ["📚", t.trustEducation], ["💬", t.trustPlain]].map(([ic, lb], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.textMuted }}>{ic}<span>{lb}</span></div>)}
      </div>
      <div style={{ marginTop: 16, padding: "10px 18px", borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.border}`, maxWidth: 480 }}>
        <p style={{ fontSize: 11, color: C.textMuted, textAlign: "center", margin: 0, lineHeight: 1.5 }}>
          {t.footerDisclaimer}
        </p>
      </div>
    </div>
  </div>;

  if (stage === "landing") return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .02, backgroundImage: `linear-gradient(${C.accent} 1px,transparent 1px),linear-gradient(90deg,${C.accent} 1px,transparent 1px)`, backgroundSize: "80px 80px" }} />
    <div style={{ position: "absolute", top: -200, left: "25%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,168,83,.12) 0%,transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />
    <div style={{ position: "relative", zIndex: 1, maxWidth: 600, textAlign: "center" }}>
      <div style={{ marginBottom: 24 }}><LangToggle lang={lang} setLang={setLang} /></div>
      <div style={{ marginBottom: 36 }}><Logo /></div>
      <h1 style={{ fontFamily: F.display, fontSize: "clamp(38px,7vw,64px)", fontWeight: 600, lineHeight: 1.08, margin: "0 0 20px", letterSpacing: "-.02em" }}>
        {t.heroLine1}{" "}<span style={{ fontStyle: "italic", background: `linear-gradient(135deg,${C.accent},${C.green})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t.tagline}</span>
      </h1>
      <p style={{ fontSize: 17, color: C.textMuted, lineHeight: 1.65, margin: "0 0 42px", maxWidth: 480, marginInline: "auto" }}>
        {docType === "statement"
          ? (lang === "es" ? "Sube tu estado de cuenta trimestral o anual para ver un resumen interactivo." : "Upload your quarterly or annual statement to see an interactive breakdown.")
          : t.subtitle}
      </p>
      {/* Drop zone — smaller when files are staged */}
      <div onClick={() => fileInputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        style={{ border: `2px dashed ${dragOver ? C.accent : (stagedFiles.length > 0 ? C.border : C.border)}`, borderRadius: 16, padding: stagedFiles.length > 0 ? "24px 32px" : "42px 32px", cursor: "pointer", background: dragOver ? C.accentDim : (stagedFiles.length > 0 ? C.surfaceAlt : "rgba(23,31,45,.6)"), transition: "all .25s", marginBottom: stagedFiles.length > 0 ? 12 : 36 }}>
        <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) stageFile(e.target.files[0]); e.target.value = ""; }} />
        <div style={{ width: 50, height: 50, borderRadius: 14, margin: "0 auto 14px", background: docType === "statement" ? C.greenDim : C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${docType === "statement" ? "rgba(92,184,138,.2)" : "rgba(212,168,83,.2)"}` }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={docType === "statement" ? C.green : C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 5px" }}>
          {stagedFiles.length > 0
            ? (lang === "es" ? "+ Agregar otro documento" : "+ Add another document")
            : docType === "statement"
              ? (lang === "es" ? "Arrastra tu estado de cuenta aquí" : "Drop your account statement here")
              : t.dropTitle}
        </p>
        <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>
          {stagedFiles.length > 0
            ? (lang === "es" ? "p.ej. 408(b)(2), folleto de inversiones" : "e.g. 408(b)(2) fee disclosure, investment guide")
            : docType === "statement"
              ? (lang === "es" ? "PDF — Estado de cuenta trimestral o anual" : "PDF — Quarterly or annual account statement")
              : t.dropSub}
        </p>
      </div>

      {/* Staged file chips */}
      {stagedFiles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {stagedFiles.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.surface, border: `1px solid ${C.accent}33`, borderRadius: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
              <span style={{ fontSize: 11, color: C.textMuted, flexShrink: 0 }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              <button onClick={e => { e.stopPropagation(); setStagedFiles(prev => prev.filter((_, j) => j !== i)); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, padding: "2px 4px", borderRadius: 4, fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {uploadError && <p style={{ fontSize: 13, color: C.danger, textAlign: "center", margin: "0 0 16px", fontWeight: 600 }}>{uploadError}</p>}

      {/* Continue button — only shown once at least one file is staged */}
      {stagedFiles.length > 0 && (
        <button onClick={proceedToPrivacy} style={{ ...btnBase, width: "100%", padding: "14px", fontSize: 15, background: `linear-gradient(135deg,${C.accent},#B8863A)`, color: "#0F1621", marginBottom: 20 }}>
          {lang === "es" ? `Analizar ${stagedFiles.length > 1 ? stagedFiles.length + " documentos" : "mi plan"} →` : `Analyze ${stagedFiles.length > 1 ? stagedFiles.length + " documents" : "my plan"} →`}
        </button>
      )}

      <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
        {[[<Shield key="s" color={C.accent} sz={14} />, t.trustPrivate], ["🔒", t.trustEncrypted], ["📚", t.trustEducation], ["💬", t.trustPlain]].map(([ic, lb], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.textMuted }}>{ic}<span>{lb}</span></div>)}
      </div>
      <button onClick={() => { setStagedFiles([]); setStage("chooser"); }} style={{ ...btnBase, padding: "8px 20px", fontSize: 12, background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` }}>
        ← {lang === "es" ? "Cambiar tipo de documento" : "Change document type"}
      </button>
    </div></div>;
  return null;
}
