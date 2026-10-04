// @ts-nocheck
'use client';

import { useState } from 'react';
import { fmtDollars, fmtShortAmt, fmtPctVal } from '@/lib/format';
import { C, F } from './theme';
import { Shield, DonutChart } from './ui';

function SuggestionBox({ t }) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!topic.trim() || !details.trim()) return;
    setSuggestions(prev => [...prev, { topic: topic.trim(), details: details.trim(), ts: Date.now() }]);
    setTopic(""); setDetails(""); setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 2500);
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box", background: C.surfaceAlt, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "10px 14px", color: C.text, fontFamily: F.body, fontSize: 13,
    outline: "none", resize: "vertical", transition: "border-color .15s",
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "14px 18px", background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 14, cursor: "pointer", fontFamily: F.body, display: "flex", alignItems: "center",
        justifyContent: "space-between", transition: "all .15s",
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(212,168,83,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t.suggestionTitle}</span>
          {suggestions.length > 0 && <span style={{ fontSize: 11, background: C.accentDim, color: C.accent, padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>{suggestions.length}</span>}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {open && (
        <div style={{ marginTop: 8, padding: "18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, animation: "fadeIn .25s" }}>
          {suggestions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{ padding: "10px 14px", background: C.surfaceAlt, borderRadius: 10, marginBottom: 8, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 3 }}>{s.topic}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{s.details}</div>
                </div>
              ))}
            </div>
          )}

          {justSubmitted && (
            <div style={{ padding: "10px 14px", background: C.greenDim, borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", gap: 8, border: `1px solid rgba(92,184,138,.2)` }}>
              <Shield color={C.green} sz={14} />
              <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>{t.suggestionThanks}</span>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 5 }}>{t.suggestionTopic}</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder={t.suggestionTopicPlaceholder} style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 5 }}>{t.suggestionDetails}</label>
            <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder={t.suggestionDetailsPlaceholder} rows={3} style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
          </div>
          <button onClick={handleSubmit} disabled={!topic.trim() || !details.trim()} style={{
            width: "100%", padding: "11px", border: "none", borderRadius: 10, fontFamily: F.body, fontWeight: 600,
            fontSize: 13, cursor: topic.trim() && details.trim() ? "pointer" : "default",
            background: topic.trim() && details.trim() ? `linear-gradient(135deg,${C.accent},#B8863A)` : C.border,
            color: topic.trim() && details.trim() ? "#0F1621" : C.textDim, transition: "all .15s",
          }}>{suggestions.length > 0 ? t.suggestionAdd : t.suggestionSubmit}</button>
        </div>
      )}
    </div>
  );
}

export function StatementDashboard({ t, stmtData, onChat, onUploadAnother, lang }) {
  const [viewMode, setViewMode] = useState("period");
  const [expandedCards, setExpandedCards] = useState({});
  const sd = stmtData || {};
  const toggle = id => setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  const num = v => { if (v === null || v === undefined) return 0; if (typeof v === "number") return isNaN(v) ? 0 : v; const s = String(v).replace(/[$,\s]/g, "").replace(/[()]/g, m => m === "(" ? "-" : ""); const n = Number(s); return isNaN(n) ? 0 : n; };

  // Robust data access: try nested period/ytd, fallback to top-level
  const periodData = sd.period || {};
  const ytdData = sd.ytd || sd.period || {};
  const data = viewMode === "ytd" ? ytdData : periodData;
  const mi = (data.moneyIn && typeof data.moneyIn === "object") ? data.moneyIn : (sd.moneyIn && typeof sd.moneyIn === "object") ? sd.moneyIn : {};
  const mo = (data.moneyOut && typeof data.moneyOut === "object") ? data.moneyOut : (sd.moneyOut && typeof sd.moneyOut === "object") ? sd.moneyOut : {};
  const rawFees = (data.fees && typeof data.fees === "object") ? data.fees : (sd.fees && typeof sd.fees === "object") ? sd.fees : (typeof data.fees === "number" || typeof sd.fees === "number") ? { total: num(data.fees || sd.fees), items: [] } : {};
  const gainLoss = num(data.gainLoss ?? sd.gainLoss);
  const divInt = num(data.dividendsInterest ?? sd.dividendsInterest);

  // Fees: handle items/details array, fallback to category totals
  const rawItems = Array.isArray(rawFees.items) ? rawFees.items : Array.isArray(rawFees.details) ? rawFees.details : [];
  const feeItems = rawItems.filter(f => f && num(f.amount) !== 0).map(f => ({ name: f.name || f.label || "Fee", amount: Math.abs(num(f.amount)) }));
  const categoryItems = [
    rawFees.administrative ? { name: lang === "es" ? "Administrativos" : "Administrative", amount: Math.abs(num(rawFees.administrative)) } : null,
    rawFees.investment ? { name: lang === "es" ? "Inversión" : "Investment", amount: Math.abs(num(rawFees.investment)) } : null,
    rawFees.advisor ? { name: lang === "es" ? "Asesor" : "Advisor", amount: Math.abs(num(rawFees.advisor)) } : null,
    rawFees.other ? { name: lang === "es" ? "Otro" : "Other", amount: Math.abs(num(rawFees.other)) } : null,
  ].filter(Boolean);
  const effectiveFeeItems = feeItems.length > 0 ? feeItems : categoryItems;
  const feeTotal = Math.abs(num(rawFees.total)) || effectiveFeeItems.reduce((s, f) => s + f.amount, 0);
  const feePctOfAssets = num(sd.endBalance) > 0 && feeTotal > 0 ? (feeTotal / num(sd.endBalance) * 100) : 0;
  const annualizedFeePct = viewMode === "ytd" ? feePctOfAssets : feePctOfAssets * 4;

  const ror = sd.personalROR || {};
  const investments = sd.investments || [];
  const sources = sd.sources || [];
  const alloc = sd.assetAllocation || {};
  const startBal = viewMode === "ytd" ? num(sd.ytdBeginBalance || sd.beginBalance) : num(sd.beginBalance);
  const balanceChange = num(sd.endBalance) - startBal;
  const allocSegments = [
    { label: lang === "es" ? "Acciones" : "Stocks", value: num(alloc.stocks), color: "#5CB88A" },
    { label: lang === "es" ? "Bonos" : "Bonds", value: num(alloc.bonds), color: "#D4A853" },
    { label: "Multi-Asset", value: num(alloc.multiAsset), color: "#94A0B2" },
    { label: lang === "es" ? "Otro" : "Other", value: num(alloc.other), color: "#536178" },
  ];
  const periodLabel = sd.statementPeriod ? `${sd.statementPeriod.start} to ${sd.statementPeriod.end}` : "";
  const ytdLabel = sd.calendarYTD ? `${sd.calendarYTD.start} to ${sd.calendarYTD.end}` : (lang === "es" ? "Año Calendario" : "Calendar Year-to-Date");

  const card = (id, children) => (<div style={{ background: C.surface, border: `1px solid ${expandedCards[id] ? C.accent : C.border}`, borderRadius: 14, overflow: "hidden", transition: "border-color .2s" }}>{children}</div>);
  const cardHeader = (id, icon, title, right) => (<button onClick={() => toggle(id)} style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: F.body, display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 18 }}>{icon}</span><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</span></div><div style={{ display: "flex", alignItems: "center", gap: 10 }}>{right}<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" style={{ transform: expandedCards[id] ? "rotate(180deg)" : "none", transition: "transform .2s" }}><polyline points="6 9 12 15 18 9"/></svg></div></button>);
  const dateLabel = () => (<div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10, padding: "6px 10px", background: C.surfaceAlt, borderRadius: 6, textAlign: "center" }}>{viewMode === "ytd" ? ytdLabel : periodLabel}</div>);
  const dataRow = (label, value, color, definition) => { const v = num(value); if (v === 0) return null; const mx = Math.max(num(mi.total), 1); return (<div style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}><span style={{ fontSize: 12, color: C.text }}>{label}</span><span style={{ fontSize: 13, fontWeight: 700, color }}>{fmtDollars(v)}</span></div><div style={{ height: 10, background: C.surfaceAlt, borderRadius: 5, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(Math.abs(v) / mx * 100, 100)}%`, background: color, borderRadius: 5, transition: "width .4s ease" }} /></div>{definition && <div style={{ fontSize: 10, color: C.textDim, marginTop: 3, lineHeight: 1.4, paddingLeft: 2 }}>{definition}</div>}</div>); };

  return (
    <div style={{ padding: "0 16px 16px", overflowY: "auto", flex: 1 }}>
      <div style={{ textAlign: "center", padding: "14px 0 12px" }}>
        <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 600, color: C.text, margin: "0 0 10px" }}>{t.stmtDashTitle}</h2>
        <div style={{ display: "inline-flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, background: C.bg }}>
          <button onClick={() => setViewMode("period")} style={{ padding: "9px 20px", border: "none", cursor: "pointer", fontFamily: F.body, fontSize: 12, fontWeight: 600, background: viewMode === "period" ? C.accentDim : "transparent", color: viewMode === "period" ? C.accent : C.textMuted, transition: "all .15s" }}>{lang === "es" ? "Este Período" : "This Period"}</button>
          <button onClick={() => setViewMode("ytd")} style={{ padding: "9px 20px", border: "none", cursor: "pointer", fontFamily: F.body, fontSize: 12, fontWeight: 600, background: viewMode === "ytd" ? C.greenDim : "transparent", color: viewMode === "ytd" ? C.green : C.textMuted, transition: "all .15s" }}>YTD</button>
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>{viewMode === "ytd" ? ytdLabel : periodLabel}</div>
      </div>

      {/* Balance */}
      <div style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceAlt})`, border: `2px solid ${C.accent}`, borderRadius: 16, padding: "20px", marginBottom: 12, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{lang === "es" ? "Saldo Final" : "Ending Balance"}</div>
        <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: C.accent }}>{fmtDollars(sd.endBalance)}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10, fontSize: 12, flexWrap: "wrap" }}>
          <span style={{ color: C.textMuted }}>{lang === "es" ? "Inicio" : "Start"}: <strong style={{ color: C.text }}>{fmtDollars(startBal)}</strong></span>
          <span style={{ color: balanceChange >= 0 ? C.green : C.danger, fontWeight: 700 }}>{balanceChange >= 0 ? "+" : "-"}{fmtDollars(balanceChange)}</span>
          {num(sd.vestedBalance) > 0 && num(sd.vestedBalance) !== num(sd.endBalance) && <span style={{ color: C.textMuted }}>{lang === "es" ? "Investido" : "Vested"}: <strong style={{ color: C.text }}>{fmtDollars(sd.vestedBalance)}</strong></span>}
        </div>
      </div>

      {/* Performance */}
      {(ror.period || ror.ytd || ror.oneYear) && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
        {[[lang === "es" ? "Período" : "Period", ror.period], ["YTD", ror.ytd], [lang === "es" ? "1 Año" : "1 Year", ror.oneYear], [lang === "es" ? "3 Años" : "3 Years", ror.threeYear]].map(([label, val], i) => (
          <div key={i} style={{ padding: "10px 6px", borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: num(val) > 0 ? C.green : num(val) < 0 ? C.danger : C.textMuted }}>{val ? fmtPctVal(val) : "-"}</div>
          </div>))}
      </div>}

      {/* Quick stats, tappable */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
        {[[lang === "es" ? "Entró" : "In", num(mi.total), C.green, C.greenDim, "rgba(92,184,138,.15)", "moneyIn"],
          [lang === "es" ? "Salió" : "Out", num(mo.total), num(mo.total) ? C.danger : C.green, num(mo.total) ? C.dangerDim : C.greenDim, num(mo.total) ? "rgba(212,106,90,.15)" : "rgba(92,184,138,.15)", "moneyOut"],
          [lang === "es" ? "Crecimiento" : "Growth", gainLoss, gainLoss >= 0 ? C.green : C.danger, gainLoss >= 0 ? C.greenDim : C.dangerDim, gainLoss >= 0 ? "rgba(92,184,138,.15)" : "rgba(212,106,90,.15)", "growth"],
          [lang === "es" ? "Costos" : "Fees", feeTotal, C.accent, "rgba(212,168,83,.08)", "rgba(212,168,83,.15)", "fees"],
        ].map(([label, val, color, bg, bdr, cardId], i) => (
          <div key={i} onClick={() => toggle(cardId)} style={{ padding: "10px 8px", borderRadius: 10, background: bg, border: `1px solid ${bdr}`, textAlign: "center", cursor: "pointer", transition: "transform .15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <div style={{ fontSize: 9, color, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color }}>{i === 2 ? ((val >= 0 ? "+" : "") + fmtShortAmt(val)) : fmtShortAmt(val)}</div>
          </div>))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {/* Money In */}
        {card("moneyIn", <>{cardHeader("moneyIn", "💰", t.stmtMoneyIn, <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{fmtDollars(mi.total)}</span>)}
          {expandedCards.moneyIn && <div style={{ padding: "0 16px 16px" }}>{dateLabel()}
            {dataRow(lang === "es" ? "Diferimiento Salarial (Pre-Tax)" : "Salary Deferral (Pre-Tax)", mi.employeeSalaryDeferral, C.green, lang === "es" ? "Tu dinero, antes de impuestos." : "Your money, before taxes. You pay taxes when you withdraw.")}
            {dataRow("Roth", mi.employeeRoth, "#6BB8D4", lang === "es" ? "Tu dinero, después de impuestos. Sale libre de impuestos." : "Your money, after taxes. Grows and comes out tax-free.")}
            {dataRow(lang === "es" ? "Match del Empleador" : "Employer Match", mi.employerMatch, "#7A9EC9", lang === "es" ? "Discrecional, sujeto a vesting." : "Discretionary, subject to vesting.")}
            {dataRow("Safe Harbor", mi.employerSafeHarbor, "#5CB88A", lang === "es" ? "Garantizado. 100% tuyo inmediatamente." : "Guaranteed. 100% yours immediately.")}
            {dataRow("Profit Sharing", mi.employerProfitSharing, "#D4A853", lang === "es" ? "Discrecional, el empleador decide anualmente." : "Discretionary, employer decides annually.")}
            {dataRow(lang === "es" ? "Otro del Empleador" : "Other Employer", mi.employerOther, "#94A0B2", null)}
            {dataRow("Rollover", mi.rolloverIn, "#8B7EC9", lang === "es" ? "De otro plan o IRA." : "From another plan or IRA.")}
            {dataRow(lang === "es" ? "Pago de Préstamo" : "Loan Repayment", mi.loanRepayment, "#94A0B2", null)}
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 10, display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Total</span><span style={{ fontSize: 15, fontWeight: 700, color: C.green }}>{fmtDollars(mi.total)}</span></div>
          </div>}</>)}

        {/* Money Out */}
        {card("moneyOut", <>{cardHeader("moneyOut", "📤", t.stmtMoneyOut, <span style={{ fontSize: 14, fontWeight: 700, color: num(mo.total) ? C.danger : C.green }}>{num(mo.total) ? fmtDollars(mo.total) : "$0.00"}</span>)}
          {expandedCards.moneyOut && <div style={{ padding: "0 16px 16px" }}>{dateLabel()}
            {num(mo.total) > 0 ? <>{dataRow(lang === "es" ? "Retiros" : "Withdrawals", mo.withdrawals, C.danger, lang === "es" ? "Dinero sacado de tu cuenta." : "Money taken out of your account.")}
              {dataRow(lang === "es" ? "Distribuciones" : "Distributions", mo.distributions, C.danger, lang === "es" ? "Pagos formales del plan." : "Formal plan payouts.")}
              {dataRow(lang === "es" ? "Rollovers (salidas)" : "Rollovers Out", mo.rollovers, "#D4A853", lang === "es" ? "Transferido a otro plan o IRA." : "Transferred to another plan or IRA.")}
              {dataRow(lang === "es" ? "Préstamos Tomados" : "Loans Taken", mo.loans, "#94A0B2", lang === "es" ? "Préstamo de tu saldo." : "Loan from your balance. Must be repaid.")}
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 10, display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Total</span><span style={{ fontSize: 15, fontWeight: 700, color: C.danger }}>{fmtDollars(mo.total)}</span></div>
            </> : <div style={{ padding: "8px 0", fontSize: 13, color: C.green, fontWeight: 600 }}>✓ {lang === "es" ? "No salió dinero de tu cuenta" : "No money left your account"}</div>}
          </div>}</>)}

        {/* Fees */}
        {card("fees", <>{cardHeader("fees", "📋", t.stmtFees, <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{fmtDollars(feeTotal)}</span>{feePctOfAssets > 0 && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(212,168,83,.1)", color: C.accent, fontWeight: 600 }}>{feePctOfAssets.toFixed(3)}%</span>}</div>)}
          {expandedCards.fees && <div style={{ padding: "0 16px 16px" }}>{dateLabel()}
            {effectiveFeeItems.length > 0 ? effectiveFeeItems.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < effectiveFeeItems.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 12, color: C.text }}>{item.name}</span><span style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>{fmtDollars(item.amount)}</span></div>
            )) : <div style={{ fontSize: 12, color: C.textMuted, padding: "8px 0" }}>{feeTotal > 0 ? `Total: ${fmtDollars(feeTotal)}` : (lang === "es" ? "Sin costos reportados" : "No fees reported")}</div>}
            {feeTotal > 0 && <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Total</span><span style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>{fmtDollars(feeTotal)}</span></div>
              <div style={{ padding: "12px", borderRadius: 10, background: "rgba(212,168,83,.06)", border: "1px solid rgba(212,168,83,.12)", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{viewMode === "ytd" ? (lang === "es" ? "% anual de tu saldo" : "Annual % of balance") : (lang === "es" ? "% de tu saldo (período)" : "% of balance (period)")}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.accent }}>{feePctOfAssets.toFixed(3)}%</span></div>
                {viewMode !== "ytd" && annualizedFeePct > 0 && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{lang === "es" ? "Estimado anualizado" : "Annualized estimate"}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>~{annualizedFeePct.toFixed(3)}%</span></div>}
                <div style={{ height: 8, background: C.surfaceAlt, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ height: "100%", width: `${Math.min((viewMode === "ytd" ? feePctOfAssets : annualizedFeePct) * 20, 100)}%`, background: `linear-gradient(90deg, ${C.accent}, #B8863A)`, borderRadius: 4 }} /></div>
                <div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.5 }}>{lang === "es" ? `Por cada $10,000, ~$${((viewMode === "ytd" ? feePctOfAssets : annualizedFeePct) * 100).toFixed(2)}/año va a costos.` : `For every $10,000, ~$${((viewMode === "ytd" ? feePctOfAssets : annualizedFeePct) * 100).toFixed(2)}/year goes to fees.`}</div>
              </div></div>}
            <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5, padding: "8px 10px", background: C.surfaceAlt, borderRadius: 8 }}>{lang === "es" ? "Una diferencia de 0.5% anual puede significar decenas de miles menos al jubilarte." : "A 0.5% annual fee difference can mean tens of thousands less by retirement."}</div>
          </div>}</>)}

        {/* Growth */}
        {card("growth", <>{cardHeader("growth", "📈", t.stmtGainLoss, <span style={{ fontSize: 14, fontWeight: 700, color: gainLoss >= 0 ? C.green : C.danger }}>{gainLoss >= 0 ? "+" : ""}{fmtDollars(gainLoss)}</span>)}
          {expandedCards.growth && <div style={{ padding: "0 16px 16px" }}>{dateLabel()}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ padding: "14px", borderRadius: 10, background: gainLoss >= 0 ? C.greenDim : C.dangerDim, border: `1px solid ${gainLoss >= 0 ? "rgba(92,184,138,.2)" : "rgba(212,106,90,.2)"}`, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", marginBottom: 4 }}>{lang === "es" ? "Ganancia/Pérdida" : "Gain/Loss"}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: gainLoss >= 0 ? C.green : C.danger }}>{gainLoss >= 0 ? "+" : ""}{fmtDollars(gainLoss)}</div></div>
              <div style={{ padding: "14px", borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", marginBottom: 4 }}>{lang === "es" ? "Dividendos e Intereses" : "Dividends & Interest"}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{fmtDollars(divInt)}</div></div></div>
            <div style={{ marginTop: 10, fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>{lang === "es" ? "Rendimiento pasado no garantiza resultados futuros." : "Past performance does not guarantee future results."}</div>
          </div>}</>)}

        {/* Allocation */}
        {allocSegments.some(s => s.value > 0) && card("allocation", <>{cardHeader("allocation", "🎯", t.stmtAllocation, <span style={{ fontSize: 12, color: C.textMuted }}>{allocSegments.filter(s => s.value > 0).map(s => `${s.value}% ${s.label}`).join(" · ")}</span>)}
          {expandedCards.allocation && <div style={{ padding: "0 16px 16px" }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
              <DonutChart segments={allocSegments} />
              <div style={{ flex: 1, minWidth: 140 }}>{allocSegments.filter(s => s.value > 0).map((seg, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><div style={{ width: 14, height: 14, borderRadius: 4, background: seg.color, flexShrink: 0 }} /><span style={{ fontSize: 12, color: C.text, flex: 1 }}>{seg.label}</span><span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{seg.value}%</span></div>))}</div></div>
            <div style={{ marginTop: 10, fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>{lang === "es" ? "Más acciones = más potencial pero más riesgo. Más bonos = más estabilidad." : "More stocks = higher growth potential but more risk. More bonds = more stability."}</div>
          </div>}</>)}

        {/* Investments */}
        {investments.length > 0 && card("investments", <>{cardHeader("investments", "📊", t.stmtInvestments, <span style={{ fontSize: 12, color: C.textMuted }}>{investments.length} {lang === "es" ? "fondos" : "funds"}</span>)}
          {expandedCards.investments && <div style={{ padding: "0 16px 16px" }}>{investments.map((inv, i) => { const ch = num(inv.endValue) - num(inv.beginValue); return (<div key={i} style={{ padding: "10px 12px", background: C.surfaceAlt, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 6 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: C.text, flex: 1, marginRight: 8 }}>{inv.name}</span><span style={{ fontSize: 13, fontWeight: 700, color: C.accent, flexShrink: 0 }}>{fmtDollars(inv.endValue)}</span></div><div style={{ display: "flex", gap: 10, fontSize: 10, color: C.textMuted, flexWrap: "wrap" }}>{inv.category && <span style={{ padding: "1px 5px", background: C.bg, borderRadius: 3 }}>{inv.category}</span>}{num(inv.pctOfAccount) > 0 && <span>{inv.pctOfAccount}%</span>}{num(inv.shares) > 0 && <span>{num(inv.shares).toLocaleString()} {lang === "es" ? "unid." : "shares"}</span>}{num(inv.beginValue) > 0 && <span style={{ color: ch >= 0 ? C.green : C.danger, fontWeight: 600 }}>{ch >= 0 ? "↑" : "↓"} {fmtDollars(Math.abs(ch))}</span>}</div></div>); })}</div>}</>)}

        {/* Sources */}
        {sources.length > 0 && card("sources", <>{cardHeader("sources", "🏦", t.stmtSources, <span style={{ fontSize: 12, color: C.textMuted }}>{sources.length} {lang === "es" ? "fuentes" : "sources"}</span>)}
          {expandedCards.sources && <div style={{ padding: "0 16px 16px" }}>{sources.map((src, i) => (<div key={i} style={{ padding: "10px 12px", background: C.surfaceAlt, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 6 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{src.name}</span><span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{fmtDollars(src.endValue)}</span></div><div style={{ display: "flex", gap: 12, fontSize: 10, color: C.textMuted }}><span>{lang === "es" ? "Investido" : "Vested"}: <strong style={{ color: num(src.vestedPct) === 100 ? C.green : C.accent }}>{src.vestedPct || 100}%</strong></span>{num(src.contributions) > 0 && <span style={{ color: C.green }}>+{fmtDollars(src.contributions)} {viewMode === "ytd" ? "YTD" : (lang === "es" ? "período" : "period")}</span>}</div>{num(src.vestedPct) < 100 && num(src.vestedPct) > 0 && <div style={{ marginTop: 6, height: 6, background: C.bg, borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${src.vestedPct}%`, background: C.accent, borderRadius: 3 }} /></div>}</div>))}
            <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.5, marginTop: 6, padding: "8px 10px", background: C.surfaceAlt, borderRadius: 8 }}>{lang === "es" ? "Tus contribuciones y Safe Harbor = siempre 100% tuyas. Match y Profit Sharing pueden seguir vesting." : "Your contributions and Safe Harbor = always 100% yours. Match and Profit Sharing may follow a vesting schedule."}</div>
          </div>}</>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
        <button onClick={onUploadAnother} style={{ padding: "14px 18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, cursor: "pointer", fontFamily: F.body, display: "flex", alignItems: "center", gap: 10, transition: "all .15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}><span style={{ fontSize: 18 }}>📄</span><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.stmtUploadAnother}</span></button>
        <button onClick={onChat} style={{ padding: "14px 18px", background: `linear-gradient(135deg,${C.accent},#B8863A)`, border: "none", borderRadius: 14, cursor: "pointer", fontFamily: F.body, display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 18 }}>💬</span><span style={{ fontSize: 13, fontWeight: 700, color: "#0F1621" }}>{t.stmtAskQuestion}</span></button>
      </div>
      <SuggestionBox t={t} />
      <div style={{ textAlign: "center", marginTop: 16, padding: "10px", fontSize: 10, color: C.textDim, lineHeight: 1.5 }}>{t.stmtDisclaimer}</div>
    </div>
  );
}
