// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { C, F } from './theme';
import { StatChip } from './ui';

function FundRow({ fund, showCategory, riskMap, lang }) {
  const es = lang === "es";
  const risk = riskMap[fund.category] || { label: "N/A", color: C.textDim };
  const erPct = fund.expenseRatio !== null && fund.expenseRatio !== undefined
    ? (fund.expenseRatio * 100).toFixed(2) + "%"
    : null;
  return (
    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 150 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: showCategory && fund.category ? 2 : 0, lineHeight: 1.3 }}>{fund.name}</div>
        {showCategory && fund.category && (
          <div style={{ fontSize: 10, color: C.textDim }}>{fund.category}</div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: "auto" }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: risk.color,
          background: `${risk.color}18`, border: `1px solid ${risk.color}30`,
          borderRadius: 100, padding: "2px 8px", whiteSpace: "nowrap",
        }}>
          {risk.label}
        </span>
        {erPct && (
          <span style={{ display: "flex", alignItems: "baseline", gap: 3, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: ".04em" }}>{es ? "Costo" : "Exp"}</span>
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{erPct}</span>
          </span>
        )}
        {fund.factSheetUrl && (
          <a
            href={fund.factSheetUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: C.accent, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
          >
            {es ? "Ver resumen →" : "View Summary →"}
          </a>
        )}
      </div>
    </div>
  );
}

const CATEGORY_ORDER = [
  "Cash & Stable Value", "Bonds", "Large Cap", "Mid Cap", "Small Cap",
  "International", "Specialty", "Asset Allocation", "Target Date",
];
const RISK_MAP = {
  "Cash & Stable Value": { label: "Low Risk",  color: C.green },
  "Bonds":               { label: "Low to Med",   color: C.textMuted },
  "Target Date":         { label: "Varies",    color: C.accent },
  "Asset Allocation":    { label: "Varies",    color: C.accent },
  "Large Cap":           { label: "Medium",    color: C.accent },
  "Mid Cap":             { label: "Med to High",  color: C.accent },
  "Small Cap":           { label: "High Risk", color: C.danger },
  "International":       { label: "Med to High",  color: C.accent },
  "Specialty":           { label: "High Risk", color: C.danger },
};

const FUND_DISCLAIMER = "This fund list is for educational reference only. Not investment advice or a recommendation of any fund. Consult your plan advisor for investment guidance. Links open fund company materials, Plansparency is not affiliated with any fund listed.";

function DisclosureCallout({ lang = "en" }) {
  const [open, setOpen] = useState(false);
  const es = lang === "es";
  const title = es
    ? "Solo Uso Educativo: No Es Asesoría de Inversión"
    : "Educational Use Only: Not Investment Advice";
  return (
    <div style={{
      margin: "12px 16px 4px",
      borderLeft: `4px solid ${C.accent}`,
      background: "rgba(184,134,11,.06)",
      borderRadius: "0 10px 10px 0",
      flexShrink: 0,
      overflow: "hidden",
    }}>
      {/* Always-visible header, tap to expand/collapse */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", background: "none", border: "none", cursor: "pointer",
        fontFamily: F.body, gap: 8,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: ".05em", textAlign: "left" }}>
          {title}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {/* Expandable body */}
      {open && (
        <div style={{ padding: "0 16px 14px", fontSize: 12, color: C.textMuted, lineHeight: 1.65 }}>
          {es ? (<>
            <p style={{ margin: "0 0 8px" }}>Los fondos aquí listados provienen directamente de los documentos de tu plan, tal como fueron proporcionados por tu empleador y administrador. Nada en esta página es una recomendación, respaldo o sugerencia de invertir en ningún fondo específico.</p>
            <p style={{ margin: "0 0 8px" }}>Tú eres responsable de todas las decisiones de inversión en tu plan, incluyendo qué fondos eliges, cuánto asignas y cuándo realizas cambios. Los resultados de tus inversiones, incluyendo ganancias y pérdidas, son tu responsabilidad exclusiva.</p>
            <p style={{ margin: "0 0 8px" }}>Plansparency no evalúa, compara ni determina si algún fondo es adecuado para tu situación. Los enlaces llevan a materiales publicados por la gestora del fondo, Plansparency no tiene ninguna relación con los fondos listados.</p>
            <p style={{ margin: 0, fontWeight: 600, color: C.textMuted }}>Si necesitas orientación sobre cómo invertir tu 401(k), habla con el asesor de tu plan o un profesional financiero calificado.</p>
          </>) : (<>
            <p style={{ margin: "0 0 8px" }}>The funds listed here are taken directly from your plan documents exactly as provided by your employer and recordkeeper. Nothing on this page is a recommendation, endorsement, or suggestion to invest in any specific fund.</p>
            <p style={{ margin: "0 0 8px" }}>You are responsible for all investment decisions in your plan, including which funds you choose, how much you allocate, and when you make changes. Investment outcomes, including gains and losses, are your responsibility alone.</p>
            <p style={{ margin: "0 0 8px" }}>Plansparency does not evaluate, compare, or assess whether any fund is right for your situation. Any links go to fund company materials published by the fund manager, Plansparency has no relationship with any fund listed.</p>
            <p style={{ margin: 0, fontWeight: 600, color: C.textMuted }}>If you need guidance on how to invest your 401(k), please speak with your plan advisor or a qualified financial professional.</p>
          </>)}
        </div>
      )}
    </div>
  );
}

export function InvestmentsPanel({ fundsData, lang }) {
  const [sortBy, setSortBy] = useState("category");
  const es = lang === "es";
  const hasExpenseRatios = fundsData.some(f => f.expenseRatio !== null && f.expenseRatio !== undefined);
  const categoryCount = new Set(fundsData.map(f => f.category).filter(Boolean)).size;
  const erValues = fundsData
    .filter(f => f.expenseRatio !== null && f.expenseRatio !== undefined)
    .map(f => f.expenseRatio);
  const avgEr = erValues.length ? erValues.reduce((s, r) => s + r, 0) / erValues.length : null;

  if (fundsData.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <DisclosureCallout lang={lang} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: C.accentDim,
              border: `1px solid ${C.accent}22`, display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 16px",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 10px" }}>
              Fund lineup not found in this document
            </h3>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, margin: 0 }}>
              Upload your enrollment booklet, investment guide, or 404(a)(5) fee disclosure to load your fund lineup.
            </p>
          </div>
        </div>
        <div style={{ padding: "10px 16px", background: C.surfaceAlt, borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.textDim, lineHeight: 1.6, flexShrink: 0 }}>
          {FUND_DISCLAIMER}
        </div>
      </div>
    );
  }

  const sortedFunds = [...fundsData].sort((a, b) => {
    if (sortBy === "category") {
      const ai = CATEGORY_ORDER.indexOf(a.category);
      const bi = CATEGORY_ORDER.indexOf(b.category);
      if (ai !== bi) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "expense") {
      const av = a.expenseRatio ?? Infinity;
      const bv = b.expenseRatio ?? Infinity;
      return av - bv;
    }
    return 0;
  });

  const sortOpts = [
    { id: "category", label: es ? "Por categoría" : "By Category" },
    { id: "name", label: "A to Z" },
    ...(hasExpenseRatios ? [{ id: "expense", label: es ? "Costo" : "Expense Ratio" }] : []),
  ];

  let listContent;
  if (sortBy === "category") {
    const grouped: Record<string, typeof fundsData> = {};
    sortedFunds.forEach(f => {
      const cat = f.category || "Other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(f);
    });
    const cats = CATEGORY_ORDER.filter(c => grouped[c]);
    // Tack on any uncategorized
    Object.keys(grouped).filter(c => !CATEGORY_ORDER.includes(c)).forEach(c => cats.push(c));
    listContent = cats.map(cat => (
      <React.Fragment key={cat}>
        <div style={{
          padding: "7px 16px 5px", background: C.surfaceAlt,
          borderBottom: `1px solid ${C.borderLight}`,
          position: "sticky", top: 0, zIndex: 1,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em" }}>{cat}</span>
        </div>
        {grouped[cat].map((fund, i) => (
          <FundRow key={i} fund={fund} showCategory={false} riskMap={RISK_MAP} lang={lang} />
        ))}
      </React.Fragment>
    ));
  } else {
    listContent = sortedFunds.map((fund, i) => (
      <FundRow key={i} fund={fund} showCategory={true} riskMap={RISK_MAP} lang={lang} />
    ));
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <DisclosureCallout lang={lang} />

      {/* Summary stats */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px 4px", flexShrink: 0 }}>
        <StatChip
          value={String(fundsData.length)}
          label={es ? (fundsData.length === 1 ? "Fondo" : "Fondos") : (fundsData.length === 1 ? "Fund" : "Funds")}
        />
        {categoryCount > 0 && (
          <StatChip
            value={String(categoryCount)}
            label={es ? (categoryCount === 1 ? "Categoría" : "Categorías") : (categoryCount === 1 ? "Category" : "Categories")}
          />
        )}
        {avgEr !== null && (
          <StatChip
            value={(avgEr * 100).toFixed(2) + "%"}
            label={es ? "Costo prom." : "Avg expense"}
          />
        )}
      </div>

      {/* Sort controls */}
      <div style={{ padding: "10px 16px", display: "flex", gap: 6, alignItems: "center", borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.surface, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", marginRight: 4 }}>{es ? "Ordenar:" : "Sort:"}</span>
        {sortOpts.map(opt => (
          <button key={opt.id} onClick={() => setSortBy(opt.id)} style={{
            padding: "5px 12px", borderRadius: 100,
            border: `1px solid ${sortBy === opt.id ? C.accent : C.border}`,
            background: sortBy === opt.id ? C.accentDim : "transparent",
            color: sortBy === opt.id ? C.accent : C.textMuted,
            fontSize: 11, fontWeight: sortBy === opt.id ? 700 : 500, fontFamily: F.body,
            cursor: "pointer", transition: "all .15s",
          }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Fund list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {listContent}
      </div>

      {/* Pinned disclaimer */}
      <div style={{ padding: "10px 16px", background: C.surfaceAlt, borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.textDim, lineHeight: 1.6, flexShrink: 0 }}>
        {FUND_DISCLAIMER}
      </div>
    </div>
  );
}
