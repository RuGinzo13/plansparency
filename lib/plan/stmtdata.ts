// ── Statement data: parse / strip ────────────────────────────────────────────
// Extracted verbatim from components/PlansparencyApp.tsx (Phase 5). Extracts the
// hidden <!--STMTDATA:{…}--> block Claude emits when analyzing an account
// statement. Logic unchanged; types added.

export function parseStmtData(text: string): any | null {
  const m = text.match(/<!--STMTDATA:(.*?)-->/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

export function stripStmtData(text: string): string {
  return text.replace(/<!--STMTDATA:.*?-->/g, '').trim();
}
