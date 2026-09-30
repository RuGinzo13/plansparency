// Throwaway-in-spirit but committed sanity script for calculatorResult().
// Run with: npx --yes tsx scripts/check-calc.ts
import assert from 'node:assert';
import { calculatorResult, type CalculatorPlanInput } from '../lib/plan/calc';

const basePlan: CalculatorPlanInput = {
  safeHarborType: 'basic_match',
  hasDiscretionaryMatch: false,
  hasRoth: true,
  hasPreTax: true,
  planAllowsCatchUp: true,
};

function run(
  label: string,
  input: {
    salary: number;
    pct: number;
    payPeriods?: number;
    ageAtYearEnd: number | null;
    priorPlanAmount?: number;
    plan?: Partial<CalculatorPlanInput>;
    year?: number;
  },
  checks: (r: ReturnType<typeof calculatorResult>) => void
) {
  const r = calculatorResult({
    salary: input.salary,
    pct: input.pct,
    payPeriods: input.payPeriods ?? 26,
    ageAtYearEnd: input.ageAtYearEnd,
    priorPlanAmount: input.priorPlanAmount ?? 0,
    plan: { ...basePlan, ...input.plan },
    year: input.year ?? 2026,
  });
  try {
    checks(r);
    console.log(`PASS  ${label}`);
  } catch (e) {
    console.error(`FAIL  ${label}`);
    throw e;
  }
}

// age 34, $62,000, 6% → limit 24500, you 3720, employer 2480, total 6200, perPaycheck ≈ 143.08, hitsLimit false
run('age 34, $62,000, 6%', { salary: 62000, pct: 6, ageAtYearEnd: 34 }, (r) => {
  assert.strictEqual(r.limit, 24500);
  assert.strictEqual(r.you, 3720);
  assert.strictEqual(r.employer, 2480);
  assert.strictEqual(r.total, 6200);
  assert.ok(Math.abs(r.perPaycheck - 143.08) < 0.01, `perPaycheck ${r.perPaycheck}`);
  assert.strictEqual(r.hitsLimit, false);
});

// age 65, $110,000, 6% → limit 32500 (band "50+"), you 6600
run('age 65, $110,000, 6%', { salary: 110000, pct: 6, ageAtYearEnd: 65 }, (r) => {
  assert.strictEqual(r.limit, 32500);
  assert.strictEqual(r.band, '50+');
  assert.strictEqual(r.you, 6600);
});

// age 61, $110,000 → limit 35750 (band "60-63", catch-up 11250 not 8000+11250)
run('age 61, $110,000', { salary: 110000, pct: 6, ageAtYearEnd: 61 }, (r) => {
  assert.strictEqual(r.limit, 35750);
  assert.strictEqual(r.band, '60-63');
  assert.strictEqual(r.catchUp, 11250);
});

// age 52, $180,000, hasRoth false → rothBlocked true, limit 24500, catchUp row not available
run(
  'age 52, $180,000, hasRoth false',
  { salary: 180000, pct: 6, ageAtYearEnd: 52, plan: { hasRoth: false } },
  (r) => {
    assert.strictEqual(r.rothBlocked, true);
    assert.strictEqual(r.limit, 24500);
    assert.ok(r.taxType.catchUp !== null, 'catchUp row should exist (catchUpRaw > 0)');
    assert.strictEqual(r.taxType.catchUp!.available, false);
  }
);

// age 65, $110,000, 6%, prior 10000 → room 22500
run('age 65, $110,000, 6%, prior 10000', { salary: 110000, pct: 6, ageAtYearEnd: 65, priorPlanAmount: 10000 }, (r) => {
  assert.strictEqual(r.room, 22500);
});

// age 65, $110,000, 20%, prior 30000 → room 2500, hitsLimit true, hitAtPaycheck 3
run(
  'age 65, $110,000, 20%, prior 30000',
  { salary: 110000, pct: 20, ageAtYearEnd: 65, priorPlanAmount: 30000 },
  (r) => {
    assert.strictEqual(r.room, 2500);
    assert.strictEqual(r.hitsLimit, true);
    assert.strictEqual(r.hitAtPaycheck, 3);
  }
);

// age 65, $110,000, prior 40000 → room 0, priorOver true, you 0, employer 0 for basic_match
run('age 65, $110,000, prior 40000', { salary: 110000, pct: 6, ageAtYearEnd: 65, priorPlanAmount: 40000 }, (r) => {
  assert.strictEqual(r.room, 0);
  assert.strictEqual(r.priorOver, true);
  assert.strictEqual(r.you, 0);
  assert.strictEqual(r.employer, 0);
});

// nonelective plan, room 0 → employer still 3% of pay
run(
  'nonelective plan, room 0',
  { salary: 110000, pct: 6, ageAtYearEnd: 65, priorPlanAmount: 40000, plan: { safeHarborType: 'nonelective' } },
  (r) => {
    assert.strictEqual(r.room, 0);
    const expected = Math.min(110000, 360000) * 0.03;
    assert.ok(Math.abs(r.employer - expected) < 0.001, `employer ${r.employer} expected ${expected}`);
  }
);

// age 55, hasPreTax false, hasRoth true → regular.traditional false, catchUp.traditional false
run(
  'age 55, hasPreTax false, hasRoth true',
  { salary: 90000, pct: 6, ageAtYearEnd: 55, plan: { hasPreTax: false, hasRoth: true } },
  (r) => {
    assert.strictEqual(r.taxType.regular.traditional, false);
    assert.ok(r.taxType.catchUp !== null);
    assert.strictEqual(r.taxType.catchUp!.traditional, false);
  }
);

console.log('all calculator checks passed');
