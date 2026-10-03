// @ts-nocheck
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { C, F } from './theme';
import { calculatorResult } from '@/lib/plan/calc';
import { getLimitYear, IRS_LIMITS } from '@/lib/plan/irs';
import { fmtRounded, fmtDollars } from '@/lib/format';
import { getTerm } from '@/lib/glossary';

const tpl = (s, vars) => Object.keys(vars).reduce((acc, k) => acc.split(`{${k}}`).join(String(vars[k])), s);

// Where each safe harbor MATCH type's guaranteed money stops growing.
// Nonelective doesn't depend on your rate, so it has no "tops out" point.
const TOP_OUT_PCT = { basic_match: 5, qaca: 6, enhanced_match: 4 };

function shLabel(sh, lang) {
  const labels = {
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
  return labels[sh?.type]?.[lang] || sh?.formula || "";
}

const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 };
const heading = { fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 16px" };
const inputBase = {
  background: "#FFFFFF", border: `1px solid ${C.inputBorder}`, borderRadius: 8,
  height: 48, fontSize: 16, padding: "0 12px", width: "100%", boxSizing: "border-box",
  color: C.text, fontFamily: F.body, outline: "none", fontVariantNumeric: "tabular-nums",
};
const label11 = { fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 6 };

export function CalcPanel({ t, planData, lang, onOpenEligibility }) {
  const rootRef = useRef(null);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setWide(entry.contentRect.width >= 880);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [age, setAge] = useState("");
  const [salary, setSalary] = useState(50000);
  const [pp, setPp] = useState(26);
  const [pct, setPct] = useState(6);
  const [priorChecked, setPriorChecked] = useState(false);
  const [priorAmount, setPriorAmount] = useState(0);
  const [openBubble, setOpenBubble] = useState(null); // 'traditional' | 'roth' | null
  const [openInfoRow, setOpenInfoRow] = useState(null);

  if (!planData) {
    return (
      <div style={{ flex: 1, overflowY: "auto", background: C.bg, padding: "20px 16px 40px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: 24, textAlign: "center", color: C.textMuted, fontSize: 13, background: C.surface, borderRadius: 14, border: `1px dashed ${C.border}` }}>
          {t.calcWaiting}
        </div>
      </div>
    );
  }

  const es = lang === "es";
  const limitYear = getLimitYear();
  const currentYear = new Date().getFullYear();

  const sh = planData?.safeHarbor;
  const hasSH = sh && sh.type !== "none";
  const hasDiscretionaryMatch = !(planData?.noMatch ?? true);
  const hasRoth = planData?.hasRoth ?? planData?.rothAvailable ?? false;
  const hasPreTax = planData?.hasPreTax ?? null;
  const planAllowsCatchUp = planData?.planAllowsCatchUp ?? true;
  const lastDayProvision = planData?.lastDayProvision ?? null;
  const me = planData?.matchEligibility || {};

  const ageAtYearEnd = age === "" ? null : Number(age);

  const r = calculatorResult({
    salary,
    pct,
    payPeriods: pp,
    ageAtYearEnd,
    priorPlanAmount: priorChecked ? priorAmount : 0,
    plan: {
      safeHarborType: sh?.type || "none",
      hasDiscretionaryMatch,
      hasRoth,
      hasPreTax,
      planAllowsCatchUp,
    },
    year: limitYear.year,
  });

  const limits = r.limits;
  const yearLimits = IRS_LIMITS[limits.year];

  // ── Card 2 chips ──
  const catchUpChip = r.band === "50+"
    ? (r.rothBlocked ? "blocked" : "applies")
    : r.band === "60-63"
      ? "replaced"
      : "notyet";
  const superChip = r.band === "60-63"
    ? (r.rothBlocked ? "blocked" : "applies")
    : "notyourage";

  const chipLabel = {
    applies: t.calc2ChipApplies,
    replaced: t.calc2ChipReplaced,
    notyet: t.calc2ChipNotYet,
    blocked: t.calc2ChipBlocked,
    notyourage: t.calc2ChipNotYourAge,
  };
  const chipColor = {
    applies: { bg: C.greenSoft, fg: C.green },
    replaced: { bg: C.surfaceAlt, fg: C.textMuted },
    notyet: { bg: C.surfaceAlt, fg: C.textMuted },
    blocked: { bg: C.dangerSoft, fg: C.danger },
    notyourage: { bg: C.surfaceAlt, fg: C.textMuted },
  };

  // ── Match "tops out" hint (card 3) ──
  const topOutPct = sh?.type ? TOP_OUT_PCT[sh.type] : undefined;
  let matchHint = null;
  if (topOutPct) {
    matchHint = pct < topOutPct
      ? tpl(t.calc2MatchStopsHint, { x: topOutPct, pct })
      : tpl(t.calc2MatchFullHint, { x: topOutPct });
  } else if (hasDiscretionaryMatch) {
    matchHint = t.calc2MatchDiscretionaryHint;
  } else {
    matchHint = t.calc2MatchNoneHint;
  }

  const pctOfLimitUsed = r.room > 0 ? Math.round((r.you / r.room) * 100) : 0;

  // ── Roth catch-up rule box tone ──
  const rothBoxTone = r.rothBlocked ? "red" : r.overRothLine ? "orange" : "green";

  const traditionalTerm = getTerm("traditional", lang);
  const rothTerm = getTerm("roth", lang);

  const toggleBubble = (which) => setOpenBubble((prev) => (prev === which ? null : which));
  const toggleInfoRow = (key) => setOpenInfoRow((prev) => (prev === key ? null : key));

  const payFreqs = [
    { value: 52, label: t.calc2PayWeekly },
    { value: 26, label: t.calc2PayBiweekly },
    { value: 24, label: t.calc2PaySemimonthly },
    { value: 12, label: t.calc2PayMonthly },
  ];

  // ── Card 1 — Start with you ──
  const StartWithYou = (
    <div style={card}>
      <div style={heading}>{t.calc2StartTitle}</div>
      <div style={{ marginBottom: 16 }}>
        <label style={label11}>{tpl(t.calc2AgeLabel, { year: limitYear.year })}</label>
        <input
          type="number" min={18} max={100} value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="—"
          style={inputBase}
        />
        <div style={{ fontSize: 12, color: C.textDim, marginTop: 6, lineHeight: 1.4 }}>{t.calc2AgeHelper}</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={label11}>{t.calc2SalaryLabel}</label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, fontSize: 16 }}>$</span>
          <input
            type="number" min={0} value={salary}
            onChange={(e) => setSalary(Math.max(0, +e.target.value))}
            style={{ ...inputBase, paddingLeft: 24 }}
          />
        </div>
      </div>
      <div>
        <label style={label11}>{t.calc2PayFreqLabel}</label>
        <div style={{ display: "grid", gridTemplateColumns: wide ? "repeat(4, 1fr)" : "1fr 1fr", gap: 8 }}>
          {payFreqs.map((f) => {
            const active = pp === f.value;
            return (
              <button
                key={f.value}
                aria-pressed={active}
                onClick={() => setPp(f.value)}
                style={{
                  minHeight: 44, borderRadius: 8, cursor: "pointer", fontFamily: F.body, fontSize: 13, fontWeight: 600,
                  background: active ? C.accentSoft : "#FFFFFF",
                  border: active ? `2px solid ${C.accent}` : `1px solid ${C.inputBorder}`,
                  color: active ? C.accentText : C.text,
                  padding: "8px 6px",
                }}
              >
                {f.label} ({f.value})
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Card 2 — Your {year} limit ──
  const LimitCard = (
    <div style={{ ...card, position: "relative" }}>
      <div style={heading}>{tpl(t.calc2LimitTitle, { year: limitYear.year })}</div>
      <div style={{ fontFamily: F.display, fontSize: 40, fontWeight: 700, color: C.accentText, marginBottom: 16, fontVariantNumeric: "tabular-nums" }}>
        {fmtRounded(r.limit)}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t.calc2RegularLabel}</div>
          <div style={{ fontSize: 12, color: C.textDim }}>{t.calc2RegularSub}</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{fmtRounded(limits.base)}</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${C.border}`, gap: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t.calc2CatchUpLabel}</div>
          <div style={{ fontSize: 12, color: C.textDim }}>{t.calc2CatchUpSub}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 100, background: chipColor[catchUpChip].bg, color: chipColor[catchUpChip].fg }}>
            {chipLabel[catchUpChip]}
          </span>
          <span style={{
            fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums",
            color: catchUpChip === "applies" ? C.green : C.textDim,
            textDecoration: catchUpChip === "applies" ? "none" : "line-through",
          }}>
            +{fmtRounded(yearLimits.catchUp50)}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${C.border}`, gap: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t.calc2SuperCatchUpLabel}</div>
          <div style={{ fontSize: 12, color: C.textDim }}>{t.calc2SuperCatchUpSub}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 100, background: chipColor[superChip].bg, color: chipColor[superChip].fg }}>
            {chipLabel[superChip]}
          </span>
          <span style={{
            fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums",
            color: superChip === "applies" ? C.green : C.textDim,
            textDecoration: superChip === "applies" ? "none" : "line-through",
          }}>
            +{fmtRounded(yearLimits.catchUp6063)}
          </span>
        </div>
      </div>

      {ageAtYearEnd === null && (
        <div style={{ fontSize: 12, color: C.textDim, marginTop: 10, lineHeight: 1.4 }}>{t.calc2NoAgeEntered}</div>
      )}
      {ageAtYearEnd !== null && ageAtYearEnd < 50 && (
        <div style={{ fontSize: 12, color: C.textDim, marginTop: 10, lineHeight: 1.4 }}>{t.calc2UnderFifty}</div>
      )}

      {/* ── How your money can go in ── */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>{t.calc2TableTitle}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 8, alignItems: "center", marginBottom: 6, position: "relative" }}>
          <div />
          <div style={{ position: "relative" }}>
            <button
              onClick={() => toggleBubble("traditional")}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.accentText, textDecoration: "underline dotted", padding: 0 }}
            >
              {t.calc2WordTraditional}
            </button>
            <span style={{ fontSize: 11, color: C.textDim }}> {t.calc2SuffixBeforeTax}</span>
            {openBubble === "traditional" && (
              <Bubble text={traditionalTerm.def} onClose={() => setOpenBubble(null)} closeLabel={t.calc2CloseBubble} />
            )}
          </div>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => toggleBubble("roth")}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.accentText, textDecoration: "underline dotted", padding: 0 }}
            >
              {t.calc2WordRoth}
            </button>
            <span style={{ fontSize: 11, color: C.textDim }}> {t.calc2SuffixAfterTax}</span>
            {openBubble === "roth" && (
              <Bubble text={rothTerm.def} onClose={() => setOpenBubble(null)} closeLabel={t.calc2CloseBubble} />
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 8, alignItems: "center", padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, color: C.text }}>{tpl(t.calc2RowRegular, { deferral: fmtRounded(limits.base) })}</div>
          <TaxCell ok={r.taxType.regular.traditional} column="traditional" hasPreTaxUnknown={r.hasPreTaxUnknown} t={t} />
          <TaxCell ok={r.taxType.regular.roth} column="roth" t={t} />
        </div>

        {r.catchUpRaw > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 8, alignItems: "center", padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, color: C.text }}>{tpl(t.calc2RowCatchUp, { catchUpRaw: fmtRounded(r.catchUpRaw) })}</div>
            <TaxCell ok={r.taxType.catchUp?.traditional} column="traditional" t={t} unavailable={!r.taxType.catchUp?.available} />
            <TaxCell ok={r.taxType.catchUp?.roth} column="roth" t={t} unavailable={!r.taxType.catchUp?.available} />
          </div>
        )}

        {r.hasPreTaxUnknown && (
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 8, lineHeight: 1.4 }}>{t.calc2PreTaxUnknownNote}</div>
        )}

        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 10, lineHeight: 1.5 }}>
          {r.taxType.regular.traditional && r.taxType.regular.roth
            ? t.calc2BothOffered
            : r.taxType.regular.roth
              ? t.calc2RothOnlyNote
              : t.calc2TraditionalOnlyNote}
          {r.catchUpRaw > 0 && (
            <>
              {" "}
              {r.rothBlocked
                ? t.calc2CatchUpBlockedNote
                : r.overRothLine
                  ? t.calc2CatchUpOverLineNote
                  : t.calc2CatchUpEitherNote}
            </>
          )}
        </div>
      </div>

      {/* ── Roth catch-up rule box ── */}
      {r.band !== null && limits.rothCatchUpWageThreshold !== null && (
        <div style={{
          marginTop: 16, padding: 16, borderRadius: 12,
          background: rothBoxTone === "green" ? C.greenSoft : rothBoxTone === "orange" ? C.warningDim : C.dangerSoft,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>
            {tpl(t.calc2RothBoxTitle, { year: limitYear.year })}
          </div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
            {rothBoxTone === "green" && tpl(t.calc2RothBoxGreen, { salary: fmtRounded(salary), threshold: fmtRounded(limits.rothCatchUpWageThreshold) })}
            {rothBoxTone === "orange" && tpl(t.calc2RothBoxOrange, { salary: fmtRounded(salary), threshold: fmtRounded(limits.rothCatchUpWageThreshold), catchUp: fmtRounded(r.catchUpRaw), deferral: fmtRounded(limits.base) })}
            {rothBoxTone === "red" && tpl(t.calc2RothBoxRed, { salary: fmtRounded(salary), threshold: fmtRounded(limits.rothCatchUpWageThreshold), year: limitYear.year, deferral: fmtRounded(limits.base) })}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 8, lineHeight: 1.4 }}>{t.calc2RothBoxFooter}</div>
        </div>
      )}

      {/* ── Prior-plan checkbox ── */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", minHeight: 44 }}>
          <input type="checkbox" checked={priorChecked} onChange={(e) => setPriorChecked(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>{tpl(t.calc2PriorCheckbox, { year: limitYear.year })}</span>
        </label>
        {priorChecked && (
          <div style={{ marginTop: 12 }}>
            <label style={label11}>{tpl(t.calc2PriorAmountLabel, { year: limitYear.year })}</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, fontSize: 16 }}>$</span>
              <input
                type="number" min={0} value={priorAmount}
                onChange={(e) => setPriorAmount(Math.max(0, +e.target.value))}
                style={{ ...inputBase, paddingLeft: 24 }}
              />
            </div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 6, lineHeight: 1.4 }}>{t.calc2PriorHelper}</div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.text, marginTop: 12 }}>
              <span>{t.calc2PriorUsedRow}</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>−{fmtRounded(r.priorUsed)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.text, marginTop: 6 }}>
              <span>{tpl(t.calc2PriorRoomRow, { year: limitYear.year })}</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmtRounded(r.room)}</span>
            </div>
            {r.priorOver && (
              <div style={{ fontSize: 12, color: C.danger, marginTop: 10, lineHeight: 1.4 }}>
                {tpl(t.calc2PriorOverNote, { year: limitYear.year, year1: limitYear.year + 1 })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── Card 3 — How much of your pay you save ──
  const SaveCard = (
    <div style={card}>
      <div style={heading}>{t.calc2SaveTitle}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 8 }}>
        <button
          aria-label={t.calc2MinusAria}
          onClick={() => setPct((p) => Math.max(0, p - 1))}
          style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${C.inputBorder}`, background: "#FFFFFF", cursor: "pointer", fontSize: 20, color: C.text }}
        >−</button>
        <div style={{ fontFamily: F.display, fontSize: 40, fontWeight: 700, color: C.accentText, minWidth: 90, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{pct}%</div>
        <button
          aria-label={t.calc2PlusAria}
          onClick={() => setPct((p) => Math.min(30, p + 1))}
          style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${C.inputBorder}`, background: "#FFFFFF", cursor: "pointer", fontSize: 20, color: C.text }}
        >+</button>
      </div>
      <input
        type="range" min={0} max={30} step={1} value={pct}
        onChange={(e) => setPct(+e.target.value)}
        style={{ width: "100%", height: 10, cursor: "pointer", accentColor: C.accent }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textDim, marginTop: 4 }}><span>0%</span><span>30%</span></div>

      {matchHint && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 12, lineHeight: 1.4 }}>{matchHint}</div>}

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
          <span>{t.calc2LimitUsedLabel}</span>
          <span style={{ fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{tpl(t.calc2LimitUsedValue, { you: fmtRounded(r.you), room: fmtRounded(r.room) })}</span>
        </div>
        <div style={{ height: 10, background: C.surfaceAlt, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${r.room > 0 ? Math.min((r.you / r.room) * 100, 100) : 0}%`, background: r.hitsLimit ? C.warning : C.accent, borderRadius: 6, transition: "width .3s ease" }} />
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8, lineHeight: 1.4 }}>
          {r.room === 0
            ? tpl(t.calc2LimitUsedNoRoom, { year: limitYear.year })
            : r.hitsLimit
              ? tpl(t.calc2LimitUsedHits, { pct, year: limitYear.year, n: r.hitAtPaycheck, payPeriods: pp })
              : tpl(t.calc2LimitUsedElse, { n: pctOfLimitUsed, pctToMax: r.pctToMax ?? 0 })}
        </div>
      </div>
    </div>
  );

  // ── Card 4 — Result ──
  const ResultCard = (
    <div style={card}>
      <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 4 }}>{hasSH ? t.calc2ResultLabelBoth : t.calc2ResultLabelYouOnly}</div>
      <div style={{ fontFamily: F.display, fontSize: wide ? 64 : 48, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>
        {fmtRounded(r.total)} <span style={{ fontSize: 16, fontWeight: 500, color: C.textMuted }}>{t.calc2PerYear}</span>
      </div>

      <div style={{ height: 10, borderRadius: 6, overflow: "hidden", display: "flex", marginTop: 12, marginBottom: 10 }}>
        <div style={{ width: `${r.total > 0 ? (r.you / r.total) * 100 : 0}%`, background: C.accent }} />
        <div style={{ width: `${r.total > 0 ? (r.employer / r.total) * 100 : 0}%`, background: C.green }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.text, marginBottom: 4 }}>
        <span>{t.calc2FromYou}</span>
        <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmtRounded(r.you)}</span>
      </div>
      {hasSH && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.text, marginBottom: 4 }}>
          <span>{t.calc2FromEmployer}</span>
          <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmtRounded(r.employer)}</span>
        </div>
      )}
      {hasDiscretionaryMatch && (
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6, lineHeight: 1.4 }}>{t.calc2DiscretionaryExtra}</div>
      )}
      {!hasSH && !hasDiscretionaryMatch && (
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6, lineHeight: 1.4 }}>{t.calc2NoEmployerMoney}</div>
      )}
      {r.overTotalLimit && (
        <div style={{ fontSize: 12, color: C.danger, marginTop: 8, lineHeight: 1.4 }}>{getTerm("totalLimit", lang).def}</div>
      )}

      <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: C.accentSoft, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{t.calc2PerPaycheckLabel}</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.accentText, fontVariantNumeric: "tabular-nums" }}>{fmtDollars(r.perPaycheck)}</span>
      </div>
      {r.hitsLimit && (
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8, lineHeight: 1.4 }}>
          {tpl(t.calc2PerPaycheckHits, { n: r.hitAtPaycheck, payPeriods: pp, year: limitYear.year })}
        </div>
      )}

      <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.5, marginTop: 16 }}>
        <p style={{ margin: "0 0 6px" }}>{tpl(t.calc2NoteAssumesFullYear, { year: limitYear.year })}</p>
        {hasSH && <p style={{ margin: "0 0 6px" }}>{t.calc2NoteSafeHarborTiming}</p>}
        {(hasSH || hasDiscretionaryMatch) && (
          <p style={{ margin: 0 }}>
            {t.calc2NoteWaitPeriod}{" "}
            <button onClick={onOpenEligibility} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.accentText, textDecoration: "underline dotted", fontFamily: F.body, fontSize: 11 }}>
              {t.calc2CheckEligibilityLink}
            </button>
          </p>
        )}
      </div>
    </div>
  );

  // ── Card 5 — Good to know about your plan ──
  const infoRows = [];
  if (hasSH) {
    infoRows.push({
      key: "safeHarbor",
      title: t.calc2RowGuaranteedTitle,
      chip: { label: t.calc2ChipGuaranteed, bg: C.greenSoft, fg: C.green },
      body: `${shLabel(sh, lang)} ${t.calc2VestedNote}`,
    });
  }
  if (hasDiscretionaryMatch) {
    infoRows.push({
      key: "discretionary",
      title: t.calc2RowDiscretionaryTitle,
      chip: { label: t.calc2ChipNotGuaranteed, bg: C.warningDim, fg: C.warning },
      body: getTerm("discretionaryMatch", lang).def + (lastDayProvision ? " " + t.calc2LastDayNote : ""),
    });
  }
  if (!hasSH && !hasDiscretionaryMatch) {
    infoRows.push({
      key: "none",
      title: t.calc2RowNoneTitle,
      chip: { label: t.calc2ChipNone, bg: C.surfaceAlt, fg: C.textMuted },
      body: "",
    });
  }
  if (salary > limits.compLimit) {
    infoRows.push({
      key: "payLimit",
      title: t.calc2RowPayLimitTitle,
      chip: { label: fmtRounded(limits.compLimit), bg: C.accentSoft, fg: C.accentText },
      body: getTerm("payLimit", lang).def,
    });
  }
  if (!hasSH && salary > limits.hceThreshold) {
    infoRows.push({
      key: "hce",
      title: t.calc2RowHceTitle,
      chip: { label: t.calc2ChipMayApply, bg: C.warningDim, fg: C.warning },
      body: getTerm("hce", lang).def,
    });
  }

  const GoodToKnowCard = (
    <div style={card}>
      <div style={heading}>{t.calc2GoodToKnowTitle}</div>
      {infoRows.map((row) => {
        const open = openInfoRow === row.key;
        return (
          <div key={row.key} style={{ borderTop: `1px solid ${C.border}` }}>
            <button
              onClick={() => toggleInfoRow(row.key)}
              aria-expanded={open}
              style={{
                width: "100%", minHeight: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "none", border: "none", cursor: "pointer", fontFamily: F.body, textAlign: "left", padding: "10px 0", gap: 10,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{row.title}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 100, background: row.chip.bg, color: row.chip.fg }}>{row.chip.label}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>
            {open && row.body && (
              <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5, paddingBottom: 14 }}>{row.body}</div>
            )}
          </div>
        );
      })}
    </div>
  );

  const Footer = (
    <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5, padding: "0 4px" }}>{t.calc2Footer}</div>
  );

  return (
    <div ref={rootRef} style={{ flex: 1, overflowY: "auto", background: C.bg, padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>{t.calc2Title}</h2>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: C.textDim }}>{tpl(t.calc2LimitsYear, { year: limitYear.year })}</div>
            {limitYear.isFallback && <div style={{ fontSize: 11, color: C.warning, marginTop: 2 }}>{tpl(t.calc2LimitsFallback, { currentYear })}</div>}
          </div>
        </div>

        <div style={wide
          ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }
          : { display: "flex", flexDirection: "column", gap: 16 }
        }>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {StartWithYou}
            {LimitCard}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {SaveCard}
            {ResultCard}
            {GoodToKnowCard}
            {Footer}
          </div>
        </div>
      </div>
    </div>
  );
}

// column: 'traditional' | 'roth' — determines the wording when the option isn't available.
function TaxCell({ ok, unavailable, column, hasPreTaxUnknown, t }) {
  if (unavailable) {
    return <div style={{ fontSize: 12, fontWeight: 600, color: C.danger, textAlign: "center" }}>{t.calc2NotAvailable}</div>;
  }
  if (column === "traditional" && hasPreTaxUnknown) {
    return <div style={{ fontSize: 12, fontWeight: 600, color: C.green, textAlign: "center" }}>{t.calc2Likely}</div>;
  }
  if (ok) {
    return <div style={{ fontSize: 12, fontWeight: 600, color: C.green, textAlign: "center" }}>{t.calc2Yes}</div>;
  }
  return <div style={{ fontSize: 12, fontWeight: 600, color: C.danger, textAlign: "center" }}>{column === "traditional" ? t.calc2RothOnly : t.calc2NotOffered}</div>;
}

function Bubble({ text, onClose, closeLabel }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)",
      width: 240, maxWidth: "80vw", background: C.text, color: C.surface, borderRadius: 12,
      padding: "12px 14px", fontSize: 12, lineHeight: 1.5, zIndex: 30, boxShadow: "0 8px 24px rgba(0,0,0,.25)",
    }}>
      <div style={{
        position: "absolute", top: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)",
        width: 12, height: 12, background: C.text,
      }} />
      <button
        onClick={onClose}
        aria-label={closeLabel}
        style={{ position: "absolute", top: 6, right: 8, background: "none", border: "none", color: C.surface, cursor: "pointer", fontSize: 14, padding: 4, lineHeight: 1 }}
      >
        ✕
      </button>
      <div style={{ paddingRight: 16 }}>{text}</div>
    </div>
  );
}
