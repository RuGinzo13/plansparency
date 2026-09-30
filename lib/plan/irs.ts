// ── IRS contribution limits (SECURE 2.0) ─────────────────────────────────────
// The yearly numbers live in lib/plan/irs-limits.ts. This file holds the logic
// that turns a year + age into the limits that apply to one person.

import { IRS_LIMITS, type IRSLimitYear } from './irs-limits';

export { IRS_LIMITS, type IRSLimitYear };

function latestTableYear(): number {
  return Math.max(...Object.keys(IRS_LIMITS).map(Number));
}

export interface LimitYear {
  year: number;
  isFallback: boolean;
}

export function getLimitYear(today: Date = new Date()): LimitYear {
  const year = today.getFullYear();
  if (IRS_LIMITS[year]) return { year, isFallback: false };
  return { year: latestTableYear(), isFallback: true };
}

export interface IRSLimits {
  base: number;
  catchUp: number;
  total: number;
  catchUpEligible: boolean;
  enhanced: boolean;
  age: number | null;
  year: number;
  isFallback: boolean;
  compLimit: number;
  rothCatchUpWageThreshold: number | null;
  totalAdditions: number;
  hceThreshold: number;
  ageAtYearEnd: number | null;
}

// Age you'll be on Dec 31 of the resolved year → base + catch-up limits.
// The super catch-up (60-63) REPLACES the regular catch-up, never both.
export function getIRSLimitsForAge(
  ageAtYearEnd: number | null,
  year: number = getLimitYear().year
): IRSLimits {
  const resolvedYear = IRS_LIMITS[year] ? year : latestTableYear();
  const isFallback = resolvedYear !== year;
  const limitsForYear = IRS_LIMITS[resolvedYear];
  const base = limitsForYear.deferral;

  let catchUp = 0;
  let enhanced = false;
  if (ageAtYearEnd !== null) {
    if (ageAtYearEnd >= 60 && ageAtYearEnd <= 63) {
      catchUp = limitsForYear.catchUp6063;
      enhanced = true;
    } else if (ageAtYearEnd >= 50) {
      catchUp = limitsForYear.catchUp50;
    }
  }

  return {
    base,
    catchUp,
    total: base + catchUp,
    catchUpEligible: catchUp > 0,
    enhanced,
    age: ageAtYearEnd,
    year: resolvedYear,
    isFallback,
    compLimit: limitsForYear.compLimit,
    rothCatchUpWageThreshold: limitsForYear.rothCatchUpWageThreshold,
    totalAdditions: limitsForYear.totalAdditions,
    hceThreshold: limitsForYear.hceThreshold,
    ageAtYearEnd,
  };
}
