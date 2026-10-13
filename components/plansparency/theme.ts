// ── Colors ──
export const C = {
  bg: "#FFFFFF", surface: "#FFFFFF", surfaceAlt: "#F3F4F6",
  border: "#D1D5DB", borderLight: "#E5E7EB",
  accent: "#C2410C", accentDim: "rgba(194,65,12,.10)", accentGlow: "rgba(194,65,12,.22)",
  green: "#166534", greenDim: "rgba(22,101,52,.10)", greenGlow: "rgba(22,101,52,.20)",
  text: "#111827", textMuted: "#4B5563", textDim: "#646B78",
  userBubble: "#F3F4F6", aiBubble: "#FFFFFF",
  warning: "#854D0E", danger: "#B91C1C", dangerDim: "rgba(185,28,28,.08)",
  accentText: "#A3360A", accentSoft: "#FFEDE3",
  warningDim: "#FEF3C7", greenSoft: "#E6F4EA", dangerSoft: "#FEE2E2",
  inputBorder: "#9CA3AF", primaryEnd: "#CC440C", onPrimary: "#FFFFFF",
  accentBorder: "#FDBA94", highlight: "#FFF3EC",
  field: "#FFFFFF", onDanger: "#FFFFFF", track: "#D1D5DB", thumbRing: "#FFFFFF",
  accentTint: "rgba(194,65,12,.08)", accentLine: "rgba(194,65,12,.20)",
  greenLine: "rgba(22,101,52,.20)", dangerLine: "rgba(185,28,28,.20)",
  shadow: "rgba(17,24,39,.08)", shadowStrong: "rgba(17,24,39,.25)",
  overlay: "rgba(17,24,39,.60)", overlayStrong: "rgba(17,24,39,.75)",
  focus: "#111827", focusOnDark: "#FFFFFF",
  bar: "#1F2937", barLine: "#EA580C", barText: "#FFFFFF", barMuted: "#CBD2DC", barLink: "#FDBA74",
};
// Chart and legend colors (StatementDashboard)
export const CHART = {
  stocks: "#0F766E", bonds: "#C2410C", multiAsset: "#6B7280", other: "#1F2937",
  roth: "#2563EB", match: "#7C3AED", safeHarbor: "#166534", profit: "#A16207",
  rollover: "#BE185D", rolloverOut: "#BE185D", neutral: "#6B7280",
};
export const F = { display: "var(--font-display), Georgia, serif", body: "var(--font-body), 'Segoe UI', system-ui, sans-serif" };

// ── Stage constants ──
export const STAGE = Object.freeze({ CHOOSER:"chooser", LANDING:"landing", PRIVACY:"privacy", UPLOADING:"uploading", APP:"app", DASHBOARD:"dashboard", STMT_DASHBOARD:"stmtDashboard", CHAT:"chat", CLEARED:"cleared" });

// ── Module-level shared styles ──
export const btnBase = { border: "none", cursor: "pointer", fontFamily: F.body, fontWeight: 600, borderRadius: 12, transition: "all .15s" };
