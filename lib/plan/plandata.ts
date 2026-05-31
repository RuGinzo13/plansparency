// ── Plan data: parse / strip / normalize ─────────────────────────────────────
// Extracted verbatim from components/PlansparencyApp.tsx (Phase 5). Logic is
// unchanged; only types were added. This is the single validation + coercion
// layer between raw Claude PLANDATA output and the dashboard UI.

export interface MatchTier {
  pct: number;
  upTo: number;
}

export interface SafeHarbor {
  type: 'nonelective' | 'basic_match' | 'enhanced_match' | 'qaca' | 'none';
  formula: string;
  vestingImmediate: boolean | null;
}

export interface ProfitSharing {
  available: boolean | null;
  type: string;
  formula: string;
  lastDayApplies: boolean | null;
}

export interface ContribEligibility {
  requirement?: string;
  entryDates?: string;
  autoEnroll: boolean | null;
  autoEnrollPct: number;
}

export interface PlanData {
  planName?: string;
  ein?: string;
  planNumber?: string;
  recordkeeperName?: string;
  recordkeeperUrl?: string;
  matchTiers: MatchTier[];
  noMatch: boolean | null;
  lastDayProvision: boolean | null;
  safeHarbor: SafeHarbor;
  profitSharing: ProfitSharing;
  contribEligibility: ContribEligibility;
  matchEligibility?: any;
  loanAvailable: boolean | null;
  hardshipAvailable: boolean | null;
  hasRoth: boolean | null;
  rothAvailable: boolean | null;
  planAllowsCatchUp: boolean | null;
  vestingSchedule?: string;
  investmentOptions?: string;
  distributionInfo?: any;
  fundsData: any[];
}

// Extract the hidden <!--PLANDATA:{…}--> block from a Claude reply.
export function parsePlanData(text: string): any | null {
  const m = text.match(/<!--PLANDATA:(.*?)-->/s);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

// Remove the hidden PLANDATA block so it never renders to the user.
export function stripPlanData(text: string): string {
  return text.replace(/<!--PLANDATA:.*?-->/gs, '').trim();
}

// ── normalizePlanData ──────────────────────────────────────────────────────
// Accepts the parsed object (or null) and returns a clean, type-safe object or
// null. Prevents: boolean strings, wrong safeHarbor enum values, object
// vestingSchedule, missing safeHarbor.type, and wrong matchTier field names
// from breaking the UI.
export function normalizePlanData(raw: any): PlanData | null {
  if (!raw || typeof raw !== 'object') return null;

  // ── booleans: coerce "true"/"false"/1/0 strings to real booleans ──────────
  const toBool = (v: any, fallback: boolean | null = null): boolean | null => {
    if (typeof v === 'boolean') return v;
    if (v === 'true' || v === 1 || v === 'yes') return true;
    if (v === 'false' || v === 0 || v === 'no') return false;
    return fallback;
  };

  // ── safeHarbor.type: normalize to exact enum the calculator expects ────────
  const SAFE_HARBOR_ENUM = ['nonelective', 'basic_match', 'enhanced_match', 'qaca', 'none'];
  const normalizeSHType = (t: any): string => {
    if (!t || typeof t !== 'string') return 'none';
    const lower = t.toLowerCase().replace(/[^a-z_]/g, '');
    if (SAFE_HARBOR_ENUM.includes(lower)) return lower;
    // Common Claude variations → canonical enum
    if (lower.includes('nonelective') || lower.includes('non_elective') || lower === '3') return 'nonelective';
    if (lower.includes('basic')) return 'basic_match';
    if (lower.includes('enhanced')) return 'enhanced_match';
    if (lower.includes('qaca')) return 'qaca';
    return 'none';
  };

  // ── vestingSchedule: must be a string ────────────────────────────────────
  const normalizeVesting = (v: any): string | undefined => {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (v && typeof v === 'object') {
      // Claude sometimes outputs {type:"graded", years:6} — flatten to readable string
      const parts: string[] = [];
      if (v.type) parts.push(String(v.type));
      if (v.years) parts.push(`${v.years}-year`);
      if (v.schedule) parts.push(String(v.schedule));
      if (v.description) parts.push(String(v.description));
      const joined = parts.join(' ').trim();
      return joined || undefined;
    }
    return undefined;
  };

  // ── matchTiers: normalize pct/upTo field names ────────────────────────────
  // Claude may use: percentage/pct/matchPct/rate AND upToPercent/upTo/cap/maxPct
  const normalizeTiers = (tiers: any): MatchTier[] => {
    if (!Array.isArray(tiers)) return [];
    return tiers
      .map((t) => {
        if (typeof t !== 'object' || !t) return null;
        const pct = t.pct ?? t.percentage ?? t.matchPct ?? t.rate ?? t.matchPercentage;
        const upTo = t.upTo ?? t.upToPercent ?? t.cap ?? t.maxPct ?? t.upToPercentage ?? t.limit;
        if (pct == null || upTo == null) return null;
        return { pct: Number(pct), upTo: Number(upTo) };
      })
      .filter(Boolean) as MatchTier[];
  };

  const sh = raw.safeHarbor && typeof raw.safeHarbor === 'object' ? raw.safeHarbor : {};
  const ps = raw.profitSharing && typeof raw.profitSharing === 'object' ? raw.profitSharing : {};
  const ce = raw.contribEligibility && typeof raw.contribEligibility === 'object' ? raw.contribEligibility : {};

  return {
    // identity
    planName: typeof raw.planName === 'string' ? raw.planName.trim() : undefined,
    ein: raw.ein ?? undefined,
    planNumber: raw.planNumber ?? undefined,
    recordkeeperName: typeof raw.recordkeeperName === 'string' ? raw.recordkeeperName.trim() : undefined,
    recordkeeperUrl: typeof raw.recordkeeperUrl === 'string' ? raw.recordkeeperUrl.trim() : undefined,
    // match
    matchTiers: normalizeTiers(raw.matchTiers),
    noMatch: toBool(raw.noMatch, false),
    lastDayProvision: toBool(raw.lastDayProvision, null),
    // safe harbor — type MUST be a valid enum string
    safeHarbor: {
      type: normalizeSHType(sh.type) as SafeHarbor['type'],
      formula: typeof sh.formula === 'string' ? sh.formula.trim() : '',
      vestingImmediate: toBool(sh.vestingImmediate, true),
    },
    // profit sharing
    profitSharing: {
      available: toBool(ps.available, false),
      type: typeof ps.type === 'string' ? ps.type : 'discretionary',
      formula: typeof ps.formula === 'string' ? ps.formula.trim() : '',
      lastDayApplies: toBool(ps.lastDayApplies, null),
    },
    // eligibility
    contribEligibility: {
      requirement: typeof ce.requirement === 'string' ? ce.requirement.trim() : undefined,
      entryDates: typeof ce.entryDates === 'string' ? ce.entryDates.trim() : undefined,
      autoEnroll: toBool(ce.autoEnroll, false),
      autoEnrollPct: typeof ce.autoEnrollPct === 'number' ? ce.autoEnrollPct : 0,
    },
    matchEligibility: raw.matchEligibility ?? undefined,
    // features — booleans coerced
    loanAvailable: toBool(raw.loanAvailable, null),
    hardshipAvailable: toBool(raw.hardshipAvailable, null),
    // rothAvailable / hasRoth — accept either field name
    hasRoth: toBool(raw.hasRoth ?? raw.rothAvailable, false),
    rothAvailable: toBool(raw.rothAvailable ?? raw.hasRoth, false),
    planAllowsCatchUp: toBool(raw.planAllowsCatchUp, true),
    // vesting — must be a string
    vestingSchedule: normalizeVesting(raw.vestingSchedule),
    // text fields
    investmentOptions: typeof raw.investmentOptions === 'string' ? raw.investmentOptions.trim() : undefined,
    distributionInfo: raw.distributionInfo ?? undefined,
    // funds — must be an array
    fundsData: Array.isArray(raw.fundsData) ? raw.fundsData : [],
  };
}
