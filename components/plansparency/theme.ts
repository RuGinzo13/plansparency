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
  tabShade: "#E5E7EB", tabShadeText: "#374151",
  bar: "#1F2937", barLine: "#EA580C", barText: "#FFFFFF", barMuted: "#CBD2DC", barLink: "#FDBA74",
};
// Chart and legend colors (StatementDashboard)
export const CHART = {
  stocks: "#0F766E", bonds: "#C2410C", multiAsset: "#6B7280", other: "#1F2937",
  roth: "#2563EB", match: "#7C3AED", safeHarbor: "#166534", profit: "#A16207",
  rollover: "#BE185D", rolloverOut: "#BE185D", neutral: "#6B7280",
};
// Team roles: color shows each person's job function (the role name is always written too).
export const ROLE = {
  advisor:    { base: "#C2410C", text: "#A3360A", soft: "#FFEDE3" },
  consultant: { base: "#7C3AED", text: "#5B21B6", soft: "#F1EAFE" },
  education:  { base: "#0F766E", text: "#115E59", soft: "#E0F2EF" },
  service:    { base: "#2563EB", text: "#1D4ED8", soft: "#E6EEFE" },
  support:    { base: "#4B5563", text: "#374151", soft: "#EEF0F3" },
};
// Page widths live here only (check-theme fails on a maxWidth of 900+ anywhere else).
export const LAYOUT = { page: 1360, advisor: 1280, reading: 760, table: 1080 };
export const F = { display: "var(--font-display), Georgia, serif", body: "var(--font-body), 'Segoe UI', system-ui, sans-serif" };

// ── Stage constants ──
export const STAGE = Object.freeze({ CHOOSER:"chooser", LANDING:"landing", PRIVACY:"privacy", UPLOADING:"uploading", APP:"app", DASHBOARD:"dashboard", STMT_DASHBOARD:"stmtDashboard", CHAT:"chat", CLEARED:"cleared" });

// ── Module-level shared styles ──
export const btnBase = { border: "none", cursor: "pointer", fontFamily: F.body, fontWeight: 600, borderRadius: 12, transition: "all .15s" };
