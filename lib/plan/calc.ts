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
  priorPlanAmount: number;
  plan: CalculatorPlanInput;
  year?: number;
}

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
  // Estimate from this year's pay — the real test is last year's W-2 Box 3.
  overRothLine: boolean;
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
  pctToMax: number | null;
  payForEmployer: number;
  effectivePct: number;
  employer: number;
  total: number;
  catchUpUsed: number;
  overTotalLimit: boolean;
  hasPreTaxUnknown: boolean;
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
}: CalculatorInput): CalculatorResult {
  const limits = getIRSLimitsForAge(ageAtYearEnd, year);
  const band: CalculatorResult['band'] = limits.enhanced ? '60-63' : limits.catchUpEligible ? '50+' : null;

  const catchUpRaw = plan.planAllowsCatchUp !== false ? limits.catchUp : 0;

  const overRothLine =
    limits.rothCatchUpWageThreshold !== null && salary > limits.rothCatchUpWageThreshold;

  const rothBlocked = catchUpRaw > 0 && overRothLine && plan.hasRoth === false;

  const catchUp = rothBlocked ? 0 : catchUpRaw;

  const deferral = limits.base;
  const limit = deferral + catchUp;
  const priorUsed = Math.min(priorPlanAmount, limit);
  const priorOver = priorPlanAmount > limit;
  const room = limit - priorUsed;

  const wanted = (salary * pct) / 100;
  const you = Math.min(wanted, room);
  const perPaycheck = room > 0 && payPeriods > 0 ? wanted / payPeriods : 0;
  const hitsLimit = wanted > room && room > 0;
  const hitAtPaycheck =
    hitsLimit && perPaycheck > 0 ? Math.max(1, Math.ceil(room / perPaycheck)) : null;
  const pctToMax = salary > 0 ? Math.ceil((room / salary) * 100) : null;

  const payForEmployer = Math.min(salary, limits.compLimit);
  const effectivePct = wanted > 0 ? pct * (you / wanted) : 0;
  const employer = safeHarborAmount(plan.safeHarborType, payForEmployer, effectivePct);

  const total = you + employer;
  const catchUpUsed = Math.max(0, you - deferral);
  const overTotalLimit = you - catchUpUsed + employer > limits.totalAdditions;

  const hasPreTaxUnknown = plan.hasPreTax === null;

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
    pctToMax,
    payForEmployer,
    effectivePct,
    employer,
    total,
    catchUpUsed,
    overTotalLimit,
    hasPreTaxUnknown,
    taxType: { regular, catchUp: catchUpTax },
  };
}
