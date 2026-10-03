// ── Calculator math (pure, typed, no React/DOM) ──────────────────────────────
// Extracted verbatim from CalcPanel in components/PlansparencyApp.tsx so the
// contribution/safe-harbor math is type-checked (the UI file keeps @ts-nocheck).

import { getIRSLimitsForAge, type IRSLimits } from './irs';

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

// ── Redesigned calculator (one pure function, STEP 5) ────────────────────────

export interface CalculatorPlanInput {
  safeHarborType: SafeHarborType;
  hasDiscretionaryMatch: boolean;
  hasRoth: boolean | null;
  hasPreTax: boolean | null;
  planAllowsCatchUp: boolean | null;
}

export interface CalculatorInput {
  salary: number;
  pct: number;
  payPeriods: number;
  ageAtYearEnd: number | null;
  // 0 if the "already saved elsewhere this year" box is unchecked
  // Only used when startedThisYear (the screen sends 0 otherwise)
  priorPlanAmount: number;
  plan: CalculatorPlanInput;
  year?: number;
  // Started this job during the year: only the paychecks left count (default false)
  startedThisYear?: boolean;
  // Paychecks left at this job this year; clamped to 1..payPeriods, ignored unless startedThisYear
  paychecksLeft?: number;
  // W-2 Box 3 wages from THIS employer last year; null = not known
  lastYearBox3?: number | null;
}

export type RothBasis = 'box3' | 'newHire' | 'estimate';

export interface TaxTypeAvailability {
  traditional: boolean;
  roth: boolean;
}

export interface CatchUpTaxTypeAvailability extends TaxTypeAvailability {
  available: boolean;
}

export interface CalculatorResult {
  limits: IRSLimits;
  band: '60-63' | '50+' | null;
  // The band's catch-up amount before the Roth catch-up rule can zero it out.
  catchUpRaw: number;
  // Exact when rothBasis is "box3", false when "newHire", otherwise an estimate
  // from this year's pay (the real test is last year's W-2 Box 3).
  overRothLine: boolean;
  rothBasis: RothBasis;
  rothBlocked: boolean;
  // The catch-up amount actually usable toward `limit` (0 when rothBlocked).
  catchUp: number;
  limit: number;
  priorUsed: number;
  priorOver: boolean;
  room: number;
  wanted: number;
  you: number;
  perPaycheck: number;
  hitsLimit: boolean;
  hitAtPaycheck: number | null;
  // How many paychecks hitAtPaycheck is counted within ("paycheck 3 of 13")
  paychecksCounted: number;
  pctToMax: number | null;
  payForEmployer: number;
  effectivePct: number;
  employer: number;
  total: number;
  catchUpUsed: number;
  overTotalLimit: boolean;
  hasPreTaxUnknown: boolean;
  // Reaching the limit early can stop a per-paycheck match; plan may or may not true-up
  trueUpRelevant: boolean;
  taxType: {
    regular: TaxTypeAvailability;
    // Present only when catchUpRaw > 0 — there's no catch-up row otherwise.
    catchUp: CatchUpTaxTypeAvailability | null;
  };
}

export function calculatorResult({
  salary,
  pct,
  payPeriods,
  ageAtYearEnd,
  priorPlanAmount,
  plan,
  year,
  startedThisYear = false,
  paychecksLeft,
  lastYearBox3 = null,
}: CalculatorInput): CalculatorResult {
  const limits = getIRSLimitsForAge(ageAtYearEnd, year);
  const band: CalculatorResult['band'] = limits.enhanced ? '60-63' : limits.catchUpEligible ? '50+' : null;

  const catchUpRaw = plan.planAllowsCatchUp !== false ? limits.catchUp : 0;

  const threshold = limits.rothCatchUpWageThreshold;
  let rothBasis: RothBasis;
  let overRothLine: boolean;
  if (lastYearBox3 !== null) {
    rothBasis = 'box3';
    overRothLine = threshold !== null && lastYearBox3 > threshold;
  } else if (startedThisYear) {
    // No wages from this employer last year, so the rule can't apply
    rothBasis = 'newHire';
    overRothLine = false;
  } else {
    rothBasis = 'estimate';
    overRothLine = threshold !== null && salary > threshold;
  }

  const rothBlocked = catchUpRaw > 0 && overRothLine && plan.hasRoth === false;

  const catchUp = rothBlocked ? 0 : catchUpRaw;

  const deferral = limits.base;
  const limit = deferral + catchUp;
  const priorUsed = Math.min(priorPlanAmount, limit);
  const priorOver = priorPlanAmount > limit;
  const room = limit - priorUsed;

  const left = Number.isFinite(paychecksLeft) ? Math.round(paychecksLeft as number) : payPeriods;
  const paychecksCounted = startedThisYear ? Math.max(1, Math.min(payPeriods, left)) : payPeriods;
  const share = startedThisYear && payPeriods > 0 ? paychecksCounted / payPeriods : 1;
  const payThisYear = salary * share;

  const yearly = (salary * pct) / 100;
  const eachCheck = payPeriods > 0 ? yearly / payPeriods : 0;
  // Full year stays exactly salary * pct (no divide-then-multiply rounding drift)
  const wanted = startedThisYear && payPeriods > 0 ? (yearly * paychecksCounted) / payPeriods : yearly;
  const you = Math.min(wanted, room);
  const perPaycheck = room > 0 ? eachCheck : 0;
  const hitsLimit = wanted > room && room > 0;
  const hitAtPaycheck =
    hitsLimit && perPaycheck > 0 ? Math.max(1, Math.ceil(room / perPaycheck)) : null;
  const pctToMax = payThisYear > 0 ? Math.ceil((room / payThisYear) * 100) : null;

  const payForEmployer = Math.min(payThisYear, limits.compLimit);
  const effectivePct = wanted > 0 ? pct * (you / wanted) : 0;
  const employer = safeHarborAmount(plan.safeHarborType, payForEmployer, effectivePct);

  const total = you + employer;
  const catchUpUsed = Math.max(0, you - deferral);
  const overTotalLimit = you - catchUpUsed + employer > limits.totalAdditions;

  const hasPreTaxUnknown = plan.hasPreTax === null;

  const trueUpRelevant =
    hitsLimit &&
    (plan.safeHarborType === 'basic_match' ||
      plan.safeHarborType === 'enhanced_match' ||
      plan.safeHarborType === 'qaca' ||
      plan.hasDiscretionaryMatch);

  const regular: TaxTypeAvailability = {
    traditional: plan.hasPreTax !== false,
    roth: plan.hasRoth === true,
  };

  const catchUpTax: CatchUpTaxTypeAvailability | null =
    catchUpRaw > 0
      ? {
          available: !rothBlocked,
          traditional: !rothBlocked && plan.hasPreTax !== false && !overRothLine,
          roth: !rothBlocked && plan.hasRoth === true,
        }
      : null;

  return {
    limits,
    band,
    catchUpRaw,
    overRothLine,
    rothBasis,
    rothBlocked,
    catchUp,
    limit,
    priorUsed,
    priorOver,
    room,
    wanted,
    you,
    perPaycheck,
    hitsLimit,
    hitAtPaycheck,
    paychecksCounted,
    pctToMax,
    payForEmployer,
    effectivePct,
    employer,
    total,
    catchUpUsed,
    overTotalLimit,
    hasPreTaxUnknown,
    trueUpRelevant,
    taxType: { regular, catchUp: catchUpTax },
  };
}
