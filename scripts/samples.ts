// Sample plans shared by scripts/check-answers.ts and scripts/check-overview.ts.
import type { PlanData } from '../lib/plan/plandata';

export const base: PlanData = {
  planName: 'Sample 401(k) Plan',
  recordkeeperName: 'Sample Recordkeeper',
  recordkeeperUrl: 'https://www.example.com',
  matchTiers: [],
  noMatch: true,
  lastDayProvision: false,
  safeHarbor: { type: 'none', formula: '', vestingImmediate: true },
  profitSharing: { available: false, type: 'discretionary', formula: '', lastDayApplies: false },
  contribEligibility: { requirement: 'Age 21 and 1 year of service', entryDates: 'First of the month after you qualify', autoEnroll: false, autoEnrollPct: 0 },
  matchEligibility: { requirement: 'Age 21 and 1 year of service', entryDates: '', immediateMatch: true },
  loanAvailable: true,
  hardshipAvailable: true,
  hasRoth: true,
  hasPreTax: true,
  rothAvailable: true,
  planAllowsCatchUp: true,
  vestingSchedule: '6-year graded: 20% per year',
  fundsData: [],
};
export const mk = (over: Partial<PlanData>): PlanData => ({ ...base, ...over });

export const samples: Record<string, PlanData> = {
  basicSafeHarbor: mk({ safeHarbor: { type: 'basic_match', formula: '', vestingImmediate: true } }),
  enhancedSafeHarbor: mk({ safeHarbor: { type: 'enhanced_match', formula: '100% of the first 4% of your pay', vestingImmediate: true } }),
  nonelective: mk({ safeHarbor: { type: 'nonelective', formula: '3% of your pay', vestingImmediate: true } }),
  qaca: mk({ safeHarbor: { type: 'qaca', formula: '100% of the first 1% plus 50% of the next 5%', vestingImmediate: false } }),
  discretionaryLastDay: mk({ noMatch: false, matchTiers: [{ pct: 50, upTo: 6 }], lastDayProvision: true, matchEligibility: { requirement: '1 year of service', entryDates: '', immediateMatch: false } }),
  discretionaryTwoTiers: mk({ noMatch: false, matchTiers: [{ pct: 100, upTo: 3 }, { pct: 50, upTo: 2 }] }),
  noMatch: mk({}),
  immediateMatch: mk({ noMatch: false, matchTiers: [{ pct: 100, upTo: 4 }], vestingSchedule: '100% immediately vested for both employee deferrals and employer match' }),
  profitSharingOn: mk({ profitSharing: { available: true, type: 'discretionary', formula: '', lastDayApplies: true } }),
  safeHarborPlusMatchPlusPS: mk({ noMatch: false, matchTiers: [{ pct: 25, upTo: 4 }], safeHarbor: { type: 'nonelective', formula: '3% of your pay', vestingImmediate: true }, profitSharing: { available: true, type: 'discretionary', formula: '', lastDayApplies: false } }),
  rothOff: mk({ hasRoth: false, rothAvailable: false }),
  rothOnly: mk({ hasPreTax: false }),
  catchUpOff: mk({ planAllowsCatchUp: false }),
  loansHardshipOff: mk({ loanAvailable: false, hardshipAvailable: false }),
  autoEnroll: mk({ contribEligibility: { requirement: 'Immediately', entryDates: '', autoEnroll: true, autoEnrollPct: 3 } }),
  allNull: {
    matchTiers: [], noMatch: null, lastDayProvision: null,
    safeHarbor: { type: undefined as any, formula: '', vestingImmediate: null },
    profitSharing: { available: null, type: '', formula: '', lastDayApplies: null },
    contribEligibility: { autoEnroll: null, autoEnrollPct: 0 },
    matchEligibility: { immediateMatch: null },
    loanAvailable: null, hardshipAvailable: null, hasRoth: null, hasPreTax: null, rothAvailable: null, planAllowsCatchUp: null,
    fundsData: [],
  },
};
