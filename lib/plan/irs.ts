// ── IRS contribution limits (SECURE 2.0) ─────────────────────────────────────
// Extracted verbatim from components/PlansparencyApp.tsx (Phase 5). Logic
// unchanged; types added. 2025 base limit with age-based catch-up tiers.

export interface IRSLimits {
  base: number;
  catchUp: number;
  total: number;
  catchUpEligible: boolean;
  enhanced: boolean;
  age: number | null;
}

export function getIRSLimits(dob: string | null | undefined): IRSLimits {
  if (!dob) return { base: 23500, catchUp: 0, total: 23500, catchUpEligible: false, enhanced: false, age: null };
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  const base = 23500;
  if (age >= 60 && age <= 63) return { base, catchUp: 11250, total: base + 11250, catchUpEligible: true, enhanced: true, age };
  if (age >= 50) return { base, catchUp: 7500, total: base + 7500, catchUpEligible: true, enhanced: false, age };
  return { base, catchUp: 0, total: base, catchUpEligible: false, enhanced: false, age };
}
