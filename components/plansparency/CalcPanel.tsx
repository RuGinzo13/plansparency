// @ts-nocheck
'use client';

import { useState } from 'react';
import { getIRSLimits, getLimitYear, IRS_LIMITS } from '@/lib/plan/irs';
import { safeHarborAmount, contributionSummary, rothCatchUpStatus } from '@/lib/plan/calc';
import { fmtRounded, fmtDollars } from '@/lib/format';
import { C, F } from './theme';

export function CalcPanel({ t, planData, expanded, setExpanded, lang, asTab = false }) {
  const [salary, setSalary] = useState(50000);
  const [pct, setPct] = useState(6);
  const [dob, setDob] = useState("");
  const [pp, setPp] = useState(26);
  const [rothAnswer, setRothAnswer] = useState(null); // 'yes' | 'no' | 'notsure' | null

  const tiers = planData?.matchTiers || [];
  const noMatch = planData?.noMatch || tiers.length === 0;
  const hasRoth = planData?.hasRoth ?? planData?.rothAvailable ?? false;
  const planAllowsCatchUp = planData?.planAllowsCatchUp ?? true;
  const lastDayProvision = planData?.lastDayProvision ?? null;
  const limitYear = getLimitYear();
  const limits = getIRSLimits(dob || null, limitYear.year);
  const yearLimits = IRS_LIMITS[limitYear.year];
  const currentYear = new Date().getFullYear();

  const tpl = (s, vars) => Object.keys(vars).reduce((acc, k) => acc.split(`{${k}}`).join(String(vars[k])), s);

  // Safe Harbor calculation
  const sh = planData?.safeHarbor;
  const hasSH = sh && sh.type !== "none";

  // Roth catch-up rule (2026+): high earners' catch-up money must go in as Roth
  const rothThresholdApplies = limits.rothCatchUpWageThreshold !== null;
  const showRothCard = limits.catchUpEligible && planAllowsCatchUp && rothThresholdApplies;
  const rothEarnedOverThreshold = rothAnswer === "yes" ? true : rothAnswer === "no" ? false : null;
  const rothStatus = rothCatchUpStatus({
    catchUpEligible: limits.catchUpEligible,
    planAllowsCatchUp,
    planHasRoth: hasRoth,
    earnedOverThreshold: rothEarnedOverThreshold,
    thresholdApplies: rothThresholdApplies,
  });
  const rothMessageTemplate = {
    unknown: t.calcRothUnknown,
    not_affected: t.calcRothNotAffected,
    roth_required: t.calcRothRequired,
    blocked_no_roth: t.calcRothBlocked,
  }[rothStatus] || "";
  const rothMessage = tpl(rothMessageTemplate, {
    threshold: fmtRounded(limits.rothCatchUpWageThreshold || 0),
    catchUp: fmtRounded(limits.catchUp),
    base: fmtRounded(limits.base),
    year: limitYear.year,
  });

  const catchUpActive = limits.catchUpEligible && planAllowsCatchUp && rothStatus !== "blocked_no_roth";
  const summary = contributionSummary({
    salary,
    pct,
    payPeriods: pp,
    limits,
    catchUpAllowed: catchUpActive,
  });
  const shAmt = hasSH ? safeHarborAmount(sh.type, summary.payForEmployer, pct) : 0;
  const empContrib = summary.annualContribution;
  const total = empContrib + shAmt;
  const perPaycheck = summary.perPaycheck;

  const secureNote = tpl(t.calcSecureNote, {
    year: limitYear.year,
    catchUp50: fmtRounded(yearLimits.catchUp50),
    catchUp6063: fmtRounded(yearLimits.catchUp6063),
  });

  const iS = {
    backgroundColor: C.calcInput, border: `1px solid ${C.calcInputBorder}`, borderRadius: 8,
    color: C.calcText, fontFamily: F.body, fontSize: 13, padding: "8px 11px", width: "100%",
    outline: "none", boxSizing: "border-box",
  };
  const lS = { fontSize: 11, color: C.calcMuted, fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" };

  const shLabels = {
    nonelective: {
      en: "3% of pay — regardless of your contributions",
      es: "3% del salario — sin importar tus contribuciones",
    },
    basic_match: {
      en: "100% of first 3% + 50% of next 2%",
      es: "100% del primer 3% + 50% del siguiente 2%",
    },
    enhanced_match: {
      en: sh?.formula || "Enhanced safe harbor match",
      es: sh?.formula || "Match safe harbor mejorado",
    },
    qaca: {
      en: "QACA: 100% of first 1% + 50% of next 5%",
      es: "QACA: 100% del primer 1% + 50% del siguiente 5%",
    },
  };

  let catchUpDisplay, catchUpColor;
  if (!dob) { catchUpDisplay = t.calcEnterDob; catchUpColor = C.calcMuted; }
  else if (!planAllowsCatchUp) { catchUpDisplay = t.calcCatchUpNotAllowed; catchUpColor = "#B84A3A"; }
  else if (catchUpActive) { catchUpDisplay = t.calcYes + (limits.enhanced ? " (60-63)" : " (50+)"); catchUpColor = "#2E7D52"; }
  else { catchUpDisplay = t.calcNo; catchUpColor = "#B84A3A"; }

  const showExpanded = asTab ? true : expanded;

  return (
    <div style={asTab
      ? { flex: 1, overflowY: "auto", background: C.calcBg }
      : { flexShrink: 0, borderBottom: `2px solid ${C.calcBorder}`, background: C.calcBg, boxShadow: "0 4px 20px rgba(0,0,0,.15)" }
    }>
      {!asTab && (
        <button onClick={() => setExpanded(!expanded)} style={{
          width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: F.body,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${C.accent},#B8863A)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F1621" strokeWidth="2.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.calcText, fontFamily: F.display, letterSpacing: ".01em" }}>{t.calcTitle}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {!expanded && planData && <div style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
              <span style={{ color: C.calcMuted }}>{t.calcYourContrib}: <strong style={{ color: C.calcText }}>{fmtRounded(empContrib)}</strong></span>
              {hasSH && <span style={{ color: C.calcMuted }}>Safe Harbor: <strong style={{ color: "#2E7D52" }}>{fmtRounded(shAmt)}</strong></span>}
              <span style={{ color: "#8B6914", fontWeight: 700 }}>{fmtRounded(total)}/yr</span>
            </div>}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.calcMuted} strokeWidth="2" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </button>
      )}

      {showExpanded && (
        <div style={{ padding: asTab ? "16px 16px 32px" : "0 16px 18px" }}>
          {!planData && <div style={{ padding: "16px", textAlign: "center", color: C.calcMuted, fontSize: 13, background: "#F3EDE3", borderRadius: 10, border: `1px dashed ${C.calcBorder}` }}>{t.calcWaiting}</div>}

          {planData && <>
            <div style={{ fontSize: 11, color: C.calcMuted, marginBottom: 10 }}>
              <div>{tpl(t.calcLimitsYear, { year: limitYear.year })}</div>
              {limitYear.isFallback && <div style={{ color: "#B84A3A", marginTop: 2 }}>{tpl(t.calcLimitsFallback, { currentYear })}</div>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div><label style={lS}>{t.calcSalary}</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.calcMuted, fontSize: 13 }}>$</span>
                  <input type="number" value={salary} onChange={e => setSalary(Math.max(0, +e.target.value))} style={{ ...iS, paddingLeft: 22 }} />
                </div>
              </div>
              <div><label style={lS}>{t.calcDob}</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={iS} />
              </div>
              <div><label style={lS}>{t.calcPayPeriod}</label>
                <select value={pp} onChange={e => setPp(+e.target.value)} style={{ ...iS, cursor: "pointer" }}>
                  <option value={26}>{t.calcBiweekly}</option><option value={24}>{t.calcSemimonthly}</option><option value={12}>{t.calcMonthly}</option><option value={52}>{t.calcWeekly}</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ ...lS, marginBottom: 0 }}>{t.calcContribution}</label>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#8B6914" }}>{pct}%</span>
              </div>
              <input type="range" min={0} max={30} step={1} value={pct} onChange={e => setPct(+e.target.value)} style={{ width: "100%", height: 10, cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.calcMuted, marginTop: 3 }}><span>0%</span><span>30%</span></div>
            </div>

            {/* === LIMIT TRACKER === */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.calcMuted, marginBottom: 4, flexWrap: "wrap" }}>
                {tpl(t.calcTrackerLabel, { annualContribution: fmtRounded(summary.annualContribution), annualLimit: fmtRounded(summary.annualLimit) })}
              </div>
              <div style={{ height: 10, background: C.surfaceAlt, borderRadius: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${summary.annualLimit > 0 ? Math.min((summary.annualContribution / summary.annualLimit) * 100, 100) : 0}%`, background: C.accent, borderRadius: 6, transition: "width .3s ease" }} />
              </div>
              <div style={{ fontSize: 11, color: C.calcMuted, marginTop: 6, lineHeight: 1.5 }}>
                <p style={{ margin: "0 0 2px" }}>
                  {summary.hitsLimit
                    ? tpl(t.calcTrackerHitting, { pct, year: limitYear.year, n: summary.limitReachedAtPaycheck, payPeriods: pp })
                    : tpl(t.calcTrackerNotHitting, { pct, annualContribution: fmtRounded(summary.annualContribution), year: limitYear.year, annualLimit: fmtRounded(summary.annualLimit) })}
                </p>
                {salary > 0 && summary.pctToReachLimit !== null && (
                  <p style={{ margin: "0 0 2px" }}>{tpl(t.calcTrackerPctOfPay, { pctToReachLimit: summary.pctToReachLimit })}</p>
                )}
                {summary.hitsLimit && hasSH && ["basic_match", "enhanced_match", "qaca"].includes(sh?.type) && (
                  <p style={{ margin: 0 }}>{t.calcTrackerTrueUp}</p>
                )}
              </div>
            </div>

            {/* === SAFE HARBOR — calculated, always first === */}
            {hasSH && (
              <div style={{ marginBottom: 12, padding: "14px 16px", borderRadius: 12, background: "#E8F8EF", border: `2px solid #5CB88A`, position: "relative" }}>
                <div style={{ position: "absolute", top: -9, left: 14, background: "#5CB88A", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  {lang === "es" ? "Garantizado" : "Guaranteed"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 4 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1A5C37", marginBottom: 4 }}>
                      {lang === "es" ? "Contribución Safe Harbor" : "Safe Harbor Contribution"}
                    </div>
                    <div style={{ fontSize: 12, color: "#3D7A55", lineHeight: 1.4 }}>
                      {shLabels[sh.type]?.[lang] || sh.formula}
                    </div>
                    <div style={{ fontSize: 10, color: "#5D9A73", marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>✓ {lang === "es" ? "100% investido inmediatamente" : "100% vested immediately"}</span>
                      <span>✓ {lang === "es" ? "No aplica provisión de último día" : "Last-day provision does NOT apply"}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#1A5C37" }}>{fmtRounded(shAmt)}</div>
                    <div style={{ fontSize: 10, color: "#5D9A73" }}>/yr</div>
                  </div>
                </div>
              </div>
            )}

            {/* === PAY LIMIT NOTE === */}
            {summary.payCapped && (
              <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 10, background: "#FFFBF2", border: `1px dashed ${C.calcBorder}`, fontSize: 11, color: C.calcMuted, lineHeight: 1.5 }}>
                {tpl(t.calcPayLimitNote, { compLimit: fmtRounded(limits.compLimit), year: limitYear.year })}
              </div>
            )}

            {/* === DISCRETIONARY MATCH — informational only, no formula, no calculation === */}
            {!noMatch && (
              <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 10, background: "#FFFBF2", border: `1px dashed ${C.calcBorder}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#8B6914", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>
                  {lang === "es" ? "Match Discrecional" : "Discretionary Match"}
                </div>
                <div style={{ fontSize: 13, color: C.calcText, lineHeight: 1.5 }}>
                  {lang === "es"
                    ? "Este plan también ofrece un match discrecional del empleador. Esta contribución es discrecional y no está garantizada — el empleador puede cambiarla o eliminarla en cualquier momento."
                    : "This plan also offers a discretionary employer match. This contribution is discretionary and not guaranteed — the employer can change or eliminate it at any time."}
                </div>
                {lastDayProvision && <div style={{ fontSize: 10, color: "#B84A3A", marginTop: 6 }}>
                  ⚠ {lang === "es" ? "Sujeto a provisión de último día del año y calendario de vesting" : "Subject to last-day-of-year provision and vesting schedule"}
                </div>}
                {!lastDayProvision && <div style={{ fontSize: 10, color: C.calcMuted, marginTop: 6 }}>
                  {lang === "es" ? "Sujeto a calendario de vesting" : "Subject to vesting schedule"}
                </div>}
              </div>
            )}

            {/* === NO EMPLOYER CONTRIBUTIONS AT ALL === */}
            {!hasSH && noMatch && (
              <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 10, background: "#FDF2F0", border: `1px solid #E8C4BE` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#B84A3A", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>
                  {lang === "es" ? "Contribuciones del Empleador" : "Employer Contributions"}
                </div>
                <div style={{ fontSize: 13, color: "#B84A3A" }}>
                  {lang === "es"
                    ? "Este plan no incluye contribución safe harbor ni match discrecional del empleador."
                    : "This plan does not include a safe harbor contribution or discretionary employer match."}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={{ padding: "8px 10px", borderRadius: 8, background: "#FFF8EB", border: `1px solid #EBD9A8` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, textTransform: "uppercase", marginBottom: 3 }}>{t.calcIrsLimit}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#8B6914" }}>{fmtRounded(catchUpActive ? limits.total : limits.base)}</div>
                {catchUpActive && <div style={{ fontSize: 10, color: "#2E7D52", marginTop: 2 }}>+{fmtRounded(limits.catchUp)} catch-up</div>}
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 8, background: C.calcCard, border: `1px solid ${C.calcCardBorder}` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, textTransform: "uppercase", marginBottom: 3 }}>{t.calcCatchUp}</div>
                <div style={{ fontSize: catchUpDisplay.length > 10 ? 11 : 14, fontWeight: 700, color: catchUpColor }}>{catchUpDisplay}</div>
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 8, background: C.calcCard, border: `1px solid ${C.calcCardBorder}` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, textTransform: "uppercase", marginBottom: 3 }}>{t.calcRothAvail}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: hasRoth ? "#2E7D52" : "#B84A3A" }}>{hasRoth ? t.calcYes : t.calcNo}</div>
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 8, background: C.calcCard, border: `1px solid ${C.calcCardBorder}` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, textTransform: "uppercase", marginBottom: 3 }}>{t.calcPreTax}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#2E7D52" }}>{t.calcYes}</div>
              </div>
            </div>

            {/* === ROTH CATCH-UP RULE (2026+) === */}
            {showRothCard && (
              <div style={{ marginBottom: 12, padding: "14px 16px", borderRadius: 12, background: "#FFF4E0", border: `2px solid ${C.accent}`, flexWrap: "wrap" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#8B6914", marginBottom: 6 }}>
                  {tpl(t.calcRothCardTitle, { year: limitYear.year })}
                </div>
                <div style={{ fontSize: 12, color: C.calcText, marginBottom: 10, lineHeight: 1.4 }}>
                  {tpl(t.calcRothCardQuestion, { threshold: fmtRounded(limits.rothCatchUpWageThreshold || 0) })}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <button onClick={() => setRothAnswer("yes")} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.accent}`, background: rothAnswer === "yes" ? C.accent : "transparent", color: rothAnswer === "yes" ? "#fff" : C.calcText, fontFamily: F.body, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t.calcRothBtnYes}</button>
                  <button onClick={() => setRothAnswer("no")} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.accent}`, background: rothAnswer === "no" ? C.accent : "transparent", color: rothAnswer === "no" ? "#fff" : C.calcText, fontFamily: F.body, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t.calcRothBtnNo}</button>
                  <button onClick={() => setRothAnswer("notsure")} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.accent}`, background: rothAnswer === "notsure" ? C.accent : "transparent", color: rothAnswer === "notsure" ? "#fff" : C.calcText, fontFamily: F.body, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t.calcRothBtnNotSure}</button>
                </div>
                <div style={{ fontSize: 12, color: C.calcText, lineHeight: 1.5, marginBottom: 8 }}>
                  {rothMessage}
                </div>
                <div style={{ fontSize: 10, color: C.calcMuted }}>{t.calcRothFooter}</div>
              </div>
            )}

            {/* Summary totals — only your contribution + safe harbor */}
            <div style={{ display: "grid", gridTemplateColumns: hasSH ? "1fr 1fr 1.3fr 1fr" : "1fr 1.3fr 1fr", gap: 8, marginBottom: 10 }}>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "#FFFFFF", border: `1px solid ${C.calcCardBorder}` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".04em" }}>{t.calcYourContrib}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.calcText }}>{fmtRounded(empContrib)}</div>
              </div>
              {hasSH && <div style={{ padding: "10px 12px", borderRadius: 10, background: "#E8F8EF", border: `1px solid #B8DFC9` }}>
                <div style={{ fontSize: 9, color: "#3D7A55", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".04em" }}>Safe Harbor</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#1A5C37" }}>{fmtRounded(shAmt)}</div>
              </div>}
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "#FFF8EB", border: `1px solid #EBD9A8` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".04em" }}>{hasSH ? (lang === "es" ? "Total Garantizado / Año" : "Guaranteed Total / Year") : t.calcTotal}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#8B6914" }}>{fmtRounded(total)}</div>
                {!noMatch && <div style={{ fontSize: 9, color: C.calcMuted, marginTop: 2 }}>{lang === "es" ? "+ match discrecional (no calculado)" : "+ discretionary match (not calculated)"}</div>}
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "#FFFFFF", border: `1px solid ${C.calcCardBorder}` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".04em" }}>{t.calcPerPaycheck}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.calcText }}>{fmtDollars(perPaycheck)}</div>
              </div>
            </div>

            <div style={{ fontSize: 10, color: C.calcMuted, lineHeight: 1.6, marginTop: 6 }}>
              <p style={{ margin: "0 0 4px" }}>{secureNote}</p>
              {lastDayProvision !== null && <p style={{ margin: "0 0 4px", color: lastDayProvision ? "#B84A3A" : C.calcMuted }}>
                {lastDayProvision ? t.calcLastDayYes : t.calcLastDayNo}
              </p>}
              <p style={{ margin: 0, color: "#9A8E7F" }}>{t.calcNote}</p>
            </div>
          </>}
        </div>
      )}
    </div>
  );
}
