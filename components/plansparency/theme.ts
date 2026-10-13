// ── Colors ──
export const C = {
  bg: "#F4EFE6", surface: "#FDFAF6", surfaceAlt: "#EDE8DE",
  border: "#D5C9B8", borderLight: "#E5DDD0",
  accent: "#B8860B", accentDim: "rgba(184,134,11,.13)", accentGlow: "rgba(184,134,11,.24)",
  green: "#287048", greenDim: "rgba(46,125,82,.11)", greenGlow: "rgba(46,125,82,.2)",
  text: "#1E1408", textMuted: "#5E4E3A", textDim: "#6F6254",
  userBubble: "#E6DCCC", aiBubble: "#FFFFFF",
  warning: "#A4470F", danger: "#B83232", dangerDim: "rgba(184,50,50,.1)",
  accentText: "#7F5F0F", accentSoft: "#F6ECD6",
  warningDim: "#FBE9D9", greenSoft: "#E8F1EA", dangerSoft: "#F6E0E0",
  inputBorder: "#9A8878", primaryEnd: "#B8863A", onPrimary: "#0F1621",
  accentBorder: "#E5C77A", highlight: "#F1EBE0",
  field: "#FFFFFF", onDanger: "#FFFFFF", track: "#C8BFAE", thumbRing: "#FBF7F0",
  accentTint: "rgba(212,168,83,.08)", accentLine: "rgba(212,168,83,.18)",
  greenLine: "rgba(92,184,138,.18)", dangerLine: "rgba(212,106,90,.18)",
  shadow: "rgba(30,20,8,.07)", shadowStrong: "rgba(0,0,0,.25)",
  overlay: "rgba(0,0,0,.6)", overlayStrong: "rgba(0,0,0,.75)",
  bar: "#F6ECD6", barLine: "#E5C77A", barText: "#1E1408", barMuted: "#5E4E3A", barLink: "#7F5F0F",
};
// Chart and legend colors (StatementDashboard)
export const CHART = {
  stocks: "#5CB88A", bonds: "#D4A853", multiAsset: "#94A0B2", other: "#536178",
  roth: "#6BB8D4", match: "#7A9EC9", safeHarbor: "#5CB88A", profit: "#D4A853",
  rollover: "#8B7EC9", rolloverOut: "#D4A853", neutral: "#94A0B2",
};
export const F = { display: "var(--font-display), Georgia, serif", body: "var(--font-body), 'Segoe UI', system-ui, sans-serif" };

// ── Stage constants ──
export const STAGE = Object.freeze({ CHOOSER:"chooser", LANDING:"landing", PRIVACY:"privacy", UPLOADING:"uploading", APP:"app", DASHBOARD:"dashboard", STMT_DASHBOARD:"stmtDashboard", CHAT:"chat", CLEARED:"cleared" });

// ── Module-level shared styles ──
export const btnBase = { border: "none", cursor: "pointer", fontFamily: F.body, fontWeight: 600, borderRadius: 12, transition: "all .15s" };
