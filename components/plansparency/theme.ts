// ── Colors ──
export const C = {
  bg: "#F4EFE6", surface: "#FDFAF6", surfaceAlt: "#EDE8DE",
  border: "#D5C9B8", borderLight: "#E5DDD0",
  accent: "#B8860B", accentDim: "rgba(184,134,11,.13)", accentGlow: "rgba(184,134,11,.24)",
  green: "#2E7D52", greenDim: "rgba(46,125,82,.11)", greenGlow: "rgba(46,125,82,.2)",
  text: "#1E1408", textMuted: "#5E4E3A", textDim: "#9A8878",
  userBubble: "#E6DCCC", aiBubble: "#FFFFFF",
  warning: "#B8860B", danger: "#B83232", dangerDim: "rgba(184,50,50,.1)",
  calcBg: "#FDFAF6", calcBorder: "#B8860B", calcText: "#1E1408",
  calcMuted: "#7A6B5D", calcCard: "#EDE8DE", calcCardBorder: "#D5C9B8",
  calcInput: "#FFFFFF", calcInputBorder: "#C8BFAE",
};
export const F = { display: "'Cormorant Garamond','Georgia',serif", body: "'DM Sans','Segoe UI',sans-serif" };

// ── Stage constants ──
export const STAGE = Object.freeze({ CHOOSER:"chooser", LANDING:"landing", PRIVACY:"privacy", UPLOADING:"uploading", APP:"app", DASHBOARD:"dashboard", STMT_DASHBOARD:"stmtDashboard", CHAT:"chat", CLEARED:"cleared" });

// ── Module-level shared styles ──
export const btnBase = { border: "none", cursor: "pointer", fontFamily: F.body, fontWeight: 600, borderRadius: 12, transition: "all .15s" };
