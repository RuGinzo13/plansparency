// HOW TO UPDATE EACH YEAR (every November, when the IRS announces next year's limits)
// 1. Copy the newest year's row, change the year, and type in the new numbers.
// 2. Leave older years in place. Nothing else needs to change.
// 3. On Jan 1 the calculator switches to the new year's row by itself.
//    If the row is missing, it keeps using the newest row and shows a notice.
// Source for each row: the IRS newsroom announcement / notice for that year.

export interface IRSLimitYear {
  deferral: number;
  catchUp50: number;
  catchUp6063: number;
  compLimit: number;
  rothCatchUpWageThreshold: number | null;
  totalAdditions: number;
  hceThreshold: number;
}

export const IRS_LIMITS: Record<number, IRSLimitYear> = {
  2025: {
    deferral: 23500,
    catchUp50: 7500,
    catchUp6063: 11250,
    compLimit: 350000,
    rothCatchUpWageThreshold: null,
    totalAdditions: 70000,
    hceThreshold: 160000,
  },
  2026: {
    deferral: 24500,
    catchUp50: 8000,
    catchUp6063: 11250,
    compLimit: 360000,
    rothCatchUpWageThreshold: 150000,
    totalAdditions: 72000,
    hceThreshold: 160000,
  },
};
