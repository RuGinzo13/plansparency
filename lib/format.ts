// ── Module-level formatters ──
export const fmtRounded = (n: number) => "$" + Math.round(n || 0).toLocaleString();
export const fmtDollars = (n: number) => "$" + Math.abs(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtShortAmt = (n: number) => { const a = Math.abs(n || 0); if (a >= 1000000) return "$" + (a/1000000).toFixed(1) + "M"; if (a >= 1000) return "$" + (a/1000).toFixed(1) + "K"; return "$" + a.toFixed(0); };
export const fmtPctVal = (n: number) => (n || 0).toFixed(2) + "%";
