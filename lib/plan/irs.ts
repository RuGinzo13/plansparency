// ── IRS contribution limits (SECURE 2.0) ─────────────────────────────────────
// Add next year's row here each November when the IRS announces limits.
// Source: IRS newsroom / Notice 2025-67 for 2026.

export interface IRSLimitYear {
  deferral: number;
  catchUp50: number;
  catchUp6063: number;
  compLimit: number;
  rothCatchUpWageThreshold: number | null;
}

export const IRS_LIMITS: Record<number, IRSLimitYear> = {
  2025: {
    deferral: 23500,
    catchUp50: 7500,
    catchUp6063: 11250,
    compLimit: 350000,
    rothCatchUpWageThreshold: null,
  },
  2026: {
    deferral: 24500,
    catchUp50: 8000,
    catchUp6063: 11250,
    compLimit: 360000,
    rothCatchUpWageThreshold: 150000,
  },
};

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
  ageAtYearEnd: number | null;
}

// `year` defaults to 2025 so the one existing caller (CalcPanel, which does
// not yet pass a year — that wiring is Phase 02 Step 2) keeps getting the
// same numbers it always has. New callers should pass an explicit year,
// normally `getLimitYear().year`.
const DEFAULT_YEAR = 2025;

export function getIRSLimits(
  dob: string | null | undefined,
  year: number = DEFAULT_YEAR
): IRSLimits {
  const resolvedYear = IRS_LIMITS[year] ? year : latestTableYear();
  const isFallback = resolvedYear !== year;
  const limitsForYear = IRS_LIMITS[resolvedYear];
  const base = limitsForYear.deferral;

  const empty: IRSLimits = {
    base,
    catchUp: 0,
    total: base,
    catchUpEligible: false,
    enhanced: false,
    age: null,
    year: resolvedYear,
    isFallback,
    compLimit: limitsForYear.compLimit,
    rothCatchUpWageThreshold: limitsForYear.rothCatchUpWageThreshold,
    ageAtYearEnd: null,
  };

  if (!dob) return empty;

  // Read the birth year straight from the string — do not use `new Date(dob)`,
  // it shifts dates by timezone.
  const match = /^(\d{4})-\d{2}-\d{2}$/.exec(dob);
  if (!match) return empty;

  const birthYear = Number(match[1]);
  const ageAtYearEnd = resolvedYear - birthYear;

  let catchUp = 0;
  let enhanced = false;
  if (ageAtYearEnd >= 60 && ageAtYearEnd <= 63) {
    catchUp = limitsForYear.catchUp6063;
    enhanced = true;
  } else if (ageAtYearEnd >= 50) {
    catchUp = limitsForYear.catchUp50;
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
    ageAtYearEnd,
  };
}
