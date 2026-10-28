// ── Facts the plan reader wasn't sure of ─────────────────────────────────────
// These show "Ask HR" on the participant side until the advisor confirms them on
// the review screen. Keys are review row keys from reviewRows.ts.

import type { PlanData } from './plandata';

export type UnsureKey = 'match' | 'profitSharing' | 'inService';
export const UNSURE_KEYS: UnsureKey[] = ['match', 'profitSharing', 'inService'];

export function unsureKeys(pd: PlanData | null | undefined): Set<UnsureKey> {
  const out = new Set<UnsureKey>();
  if (!pd || typeof pd !== 'object') return out;
  const confirmed = Array.isArray(pd.review?.confirmed) ? pd.review!.confirmed! : [];
  const type = pd.safeHarbor?.type;
  const tiers = Array.isArray(pd.matchTiers) ? pd.matchTiers : [];

  // A second match next to a safe harbor match is usually the safe harbor read twice. A capped tier can't be shown correctly yet.
  const shMatch = type === 'basic_match' || type === 'enhanced_match' || type === 'qaca';
  if ((shMatch && tiers.length > 0) || tiers.some((t) => typeof t.cap === 'number')) out.add('match');
  if (pd.profitSharing?.type === 'qnec') out.add('profitSharing');
  const di = pd.distributionInfo;
  if (di && di.inServiceAvailable !== true && typeof di.inServiceAge === 'number') out.add('inService');

  for (const k of confirmed) out.delete(k as UnsureKey);
  return out;
}

// Why a row is unsure (shown to the advisor).
export const UNSURE_REASONS: Record<UnsureKey, string> = {
  match: 'A second match was found next to the safe harbor match. Is there really an extra match?',
  profitSharing: 'We found a QNEC, which is not profit sharing.',
  inService: "An age appears, but the document doesn't clearly say this is allowed.",
};
