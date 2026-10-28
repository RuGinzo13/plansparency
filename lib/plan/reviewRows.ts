import { ageText } from './plandata';

// The plan details an advisor checks before a plan is shared, and edits later.
// Shared by the new-plan review, Edit plan details, Upload additional plan doc, and the AI prompt.

export type FieldSpec = { path: string[]; kind: 'text' | 'select' | 'tri' | 'triInvert' | 'tiers'; label: string; options?: [string, string][]; mirror?: string[]; numeric?: 'age' };
export type ReviewRow = { key: string; label: string; fields: FieldSpec[] };

export const SAFE_HARBOR_OPTIONS: [string, string][] = [['none', 'None'], ['nonelective', 'Nonelective (3% of pay)'], ['basic_match', 'Basic match'], ['enhanced_match', 'Enhanced match'], ['qaca', 'QACA']];

export const REVIEW_ROWS: ReviewRow[] = [
  { key: 'basics', label: 'Plan basics', fields: [
    { path: ['planName'], kind: 'text', label: 'Plan name' },
    { path: ['recordkeeperName'], kind: 'text', label: 'Recordkeeper' },
    { path: ['recordkeeperUrl'], kind: 'text', label: 'Recordkeeper website (https only)' },
  ] },
  { key: 'safeHarbor', label: 'Guaranteed employer money', fields: [
    { path: ['safeHarbor', 'type'], kind: 'select', label: 'Type', options: SAFE_HARBOR_OPTIONS },
    { path: ['safeHarbor', 'formula'], kind: 'text', label: 'How it works' },
  ] },
  { key: 'match', label: 'Extra (discretionary) match', fields: [
    { path: ['noMatch'], kind: 'triInvert', label: 'Does the plan have an extra employer match?' },
    { path: ['matchTiers'], kind: 'tiers', label: 'Match tiers' },
  ] },
  { key: 'lastDay', label: 'Must work on the last day of the year for extra employer money', fields: [
    { path: ['lastDayProvision'], kind: 'tri', label: 'Last-day rule' },
  ] },
  { key: 'profitSharing', label: 'Profit sharing', fields: [
    { path: ['profitSharing', 'available'], kind: 'tri', label: 'Offered' },
    { path: ['profitSharing', 'formula'], kind: 'text', label: 'How it works' },
  ] },
  { key: 'vesting', label: 'Vesting', fields: [
    { path: ['vestingSchedule'], kind: 'text', label: 'Vesting schedule' },
  ] },
  { key: 'join', label: 'Who can join', fields: [
    { path: ['contribEligibility', 'requirement'], kind: 'text', label: 'Requirement' },
    { path: ['contribEligibility', 'entryDates'], kind: 'text', label: 'Entry dates' },
  ] },
  { key: 'matchStarts', label: 'When employer money starts', fields: [
    { path: ['matchEligibility', 'requirement'], kind: 'text', label: 'Requirement' },
    { path: ['matchEligibility', 'entryDates'], kind: 'text', label: 'Entry dates' },
    { path: ['matchEligibility', 'immediateMatch'], kind: 'tri', label: 'Starts right away' },
  ] },
  { key: 'preTax', label: 'Before-tax (Traditional)', fields: [{ path: ['hasPreTax'], kind: 'tri', label: 'Offered' }] },
  { key: 'roth', label: 'Roth', fields: [{ path: ['hasRoth'], kind: 'tri', label: 'Offered', mirror: ['rothAvailable'] }] },
  { key: 'catchUp', label: 'Catch-up allowed', fields: [{ path: ['planAllowsCatchUp'], kind: 'tri', label: 'Allowed' }] },
  { key: 'loans', label: 'Loans', fields: [{ path: ['loanAvailable'], kind: 'tri', label: 'Offered' }] },
  { key: 'hardship', label: 'Hardship withdrawals', fields: [{ path: ['hardshipAvailable'], kind: 'tri', label: 'Offered' }] },
  { key: 'inService', label: 'In-service withdrawals (taking money out while still working)', fields: [
    { path: ['distributionInfo', 'inServiceAvailable'], kind: 'tri', label: 'Offered' },
    { path: ['distributionInfo', 'inServiceAge'], kind: 'text', label: 'Starting at age', numeric: 'age' },
  ] },
];

export const getAt = (o: any, path: string[]) => path.reduce((a, k) => (a == null ? undefined : a[k]), o);
export const setAt = (o: any, path: string[], value: any) => {
  const copy = JSON.parse(JSON.stringify(o));
  let cur = copy;
  for (let i = 0; i < path.length - 1; i++) { if (cur[path[i]] == null || typeof cur[path[i]] !== 'object') cur[path[i]] = {}; cur = cur[path[i]]; }
  cur[path[path.length - 1]] = value;
  return copy;
};

export const triLabel = (v: any) => (v === true ? 'Yes' : v === false ? 'No' : 'Not stated');

// What one field says in plain English (the same wording the review screen shows).
export function fieldText(field: FieldSpec, data: any): string {
  const value = getAt(data, field.path);
  if (field.kind === 'text') return typeof value === 'number' ? ageText(value) : typeof value === 'string' && value ? value : 'Not stated';
  if (field.kind === 'select') return (field.options || []).find(([v]) => v === value)?.[1] ?? 'Not stated';
  if (field.kind === 'tri' || field.kind === 'triInvert') {
    const shown = value === true || value === false ? (field.kind === 'triInvert' ? !value : value) : null;
    return triLabel(shown);
  }
  const tiers: { pct: number; upTo: number }[] = Array.isArray(value) ? value : [];
  return tiers.length ? tiers.map((t) => `${t.pct}% match on the first ${t.upTo}% of pay`).join('; ') : 'None listed';
}

// The value shown in a row: just the value for one-field rows, "Label: value" pieces otherwise.
export function rowValueText(row: ReviewRow, data: any): string {
  if (row.fields.length === 1) return fieldText(row.fields[0], data);
  return row.fields.map((f) => `${f.label}: ${fieldText(f, data)}`).join(' · ');
}

// Keys of the rows whose field values differ between two plan data objects.
export function diffRows(a: any, b: any): string[] {
  return REVIEW_ROWS.filter((row) => row.fields.some((f) => JSON.stringify(getAt(a, f.path) ?? null) !== JSON.stringify(getAt(b, f.path) ?? null))).map((row) => row.key);
}
