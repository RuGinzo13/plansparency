// ── Calculator math (pure, typed, no React/DOM) ──────────────────────────────
// Extracted verbatim from CalcPanel in components/PlansparencyApp.tsx so the
// contribution/safe-harbor math is type-checked (the UI file keeps @ts-nocheck).

export type SafeHarborType =
  | 'none'
  | 'nonelective'
  | 'basic_match'
  | 'enhanced_match'
  | 'qaca'
  | string
  | null
  | undefined;

// Formulas moved out of CalcPanel exactly as they were.
export function safeHarborAmount(
  type: SafeHarborType,
  payForEmployer: number,
  pct: number
): number {
  if (type === 'nonelective') {
    return payForEmployer * 0.03;
  }
  if (type === 'basic_match') {
    const t1 = Math.min(pct, 3);
    const t2 = Math.max(0, Math.min(pct, 5) - 3);
    return (payForEmployer * t1) / 100 * 1.0 + (payForEmployer * t2) / 100 * 0.5;
  }
  if (type === 'enhanced_match') {
    const t1 = Math.min(pct, 4);
    return (payForEmployer * t1) / 100;
  }
  if (type === 'qaca') {
    const t1 = Math.min(pct, 1);
    const t2 = Math.max(0, Math.min(pct, 6) - 1);
    return (payForEmployer * t1) / 100 * 1.0 + (payForEmployer * t2) / 100 * 0.5;
  }
  return 0;
}

export type RothCatchUpStatusValue =
  | 'not_eligible'
  | 'rule_not_in_effect'
  | 'unknown'
  | 'not_affected'
  | 'roth_required'
  | 'blocked_no_roth';

export interface RothCatchUpStatusInput {
  catchUpEligible: boolean;
  planAllowsCatchUp: boolean;
  planHasRoth: boolean;
  // null = the participant hasn't answered (or answered "not sure")
  earnedOverThreshold: boolean | null;
  // false when the plan year has no Roth catch-up wage threshold at all
  thresholdApplies: boolean;
}

export function rothCatchUpStatus({
  catchUpEligible,
  planAllowsCatchUp,
  planHasRoth,
  earnedOverThreshold,
  thresholdApplies,
}: RothCatchUpStatusInput): RothCatchUpStatusValue {
  if (!catchUpEligible || !planAllowsCatchUp) return 'not_eligible';
  if (!thresholdApplies) return 'rule_not_in_effect';
  if (earnedOverThreshold === null) return 'unknown';
  if (!earnedOverThreshold) return 'not_affected';
  return planHasRoth ? 'roth_required' : 'blocked_no_roth';
}

export interface ContributionLimits {
  base: number;
  catchUp: number;
  compLimit: number;
}

export interface ContributionSummaryInput {
  salary: number;
  pct: number;
  payPeriods: number;
  limits: ContributionLimits;
  catchUpAllowed: boolean;
}

export interface ContributionSummary {
  annualLimit: number;
  electedAnnual: number;
  // what comes out of each check while contributing
  perPaycheck: number;
  annualContribution: number;
  hitsLimit: boolean;
  limitReachedAtPaycheck: number | null;
  pctToReachLimit: number | null;
  payForEmployer: number;
  payCapped: boolean;
}

export function contributionSummary({
  salary,
  pct,
  payPeriods,
  limits,
  catchUpAllowed,
}: ContributionSummaryInput): ContributionSummary {
  const annualLimit = limits.base + (catchUpAllowed ? limits.catchUp : 0);
  const electedAnnual = (salary * pct) / 100;
  const perPaycheck = payPeriods > 0 ? electedAnnual / payPeriods : 0;
  const annualContribution = Math.min(electedAnnual, annualLimit);
  const hitsLimit = electedAnnual > annualLimit;
  const limitReachedAtPaycheck =
    hitsLimit && perPaycheck > 0 ? Math.ceil(annualLimit / perPaycheck) : null;
  const pctToReachLimit =
    salary > 0 ? Math.min(Math.round((annualLimit / salary) * 100 * 10) / 10, 100) : null;
  const payForEmployer = Math.min(salary, limits.compLimit);
  const payCapped = salary > limits.compLimit;

  return {
    annualLimit,
    electedAnnual,
    perPaycheck,
    annualContribution,
    hitsLimit,
    limitReachedAtPaycheck,
    pctToReachLimit,
    payForEmployer,
    payCapped,
  };
}
