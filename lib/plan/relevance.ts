// ── One rule for every card: what it says, and which picture, video and link belong to it ──
// Pure, no React. After this file, nothing else decides whether a card shows a picture, a slider,
// a video or a link, or which pill kind it gets. Gate 2: a "No" or unknown card never shows a tool.

import type { PlanData } from './plandata';
import type { StockId } from '../answers/stockAnswers';
import type { VideoId } from '../videos/types';
import { facts, matchCounts } from './planFacts';
import { unsureKeys } from './unsure';
import { joinSteps, rothRows } from './visuals';

export type CardKind = 'yes' | 'no' | 'info' | 'ask';
export type PictureId = 'employerSafeHarbor' | 'employerMatch' | 'vesting' | 'join' | 'tax' | 'limits' | 'leave';
export type TopicId = 'you' | 'employer' | 'access' | 'leave';
export interface CardLink { to: StockId; text: { en: string; es: string } }
export interface CardExtras { picture: PictureId | null; video: VideoId | null; link: CardLink | null }

// The cards of each topic, in the order they are shown.
export const TOPIC_CARDS: Record<TopicId, StockId[]> = {
  you: ['elig', 'limit', 'roth'],
  employer: ['safeHarbor', 'match', 'profit', 'vesting'],
  access: ['loans', 'hardship', 'inService'],
  leave: ['leave'],
};

const tri = (v: unknown): 'yes' | 'no' | 'ask' => (v === true ? 'yes' : v === false ? 'no' : 'ask');

// Does the plan have employer money we are sure about?
function hasEmployerMoney(pd: PlanData): boolean {
  return facts(pd).safeHarbor || matchCounts(pd) || (pd.profitSharing?.available === true && !unsureKeys(pd).has('profitSharing'));
}

export function cardKind(id: StockId, pdIn: PlanData | null | undefined): CardKind {
  const pd = pdIn && typeof pdIn === 'object' ? pdIn : null;
  if (!pd) return 'ask';
  const f = facts(pd);
  const unsure = unsureKeys(pd);
  switch (id) {
    case 'elig': return typeof pd.contribEligibility?.requirement === 'string' && pd.contribEligibility.requirement.trim() ? 'info' : 'ask';
    case 'limit': return 'info';
    case 'leave': return 'info';
    case 'roth': return rothRows(pd) ? 'info' : 'ask';
    case 'safeHarbor': return typeof pd.safeHarbor?.type !== 'string' ? 'ask' : f.type === 'none' ? 'no' : 'yes';
    case 'match':
      if (unsure.has('match')) return 'ask';
      if (f.disc) return 'yes';
      if (f.safeHarbor || pd.noMatch === true) return 'no';
      return 'ask';
    case 'profit':
      if (unsure.has('profitSharing')) return 'ask';
      return tri(pd.profitSharing?.available);
    case 'vesting':
      if (hasEmployerMoney(pd)) return 'yes';
      return cardKind('safeHarbor', pd) === 'no' && cardKind('match', pd) === 'no' && cardKind('profit', pd) === 'no' ? 'no' : 'ask';
    case 'loans': return tri(pd.loanAvailable);
    case 'hardship': return tri(pd.hardshipAvailable);
    case 'inService':
      if (unsure.has('inService')) return 'ask';
      return tri(pd.distributionInfo?.inServiceAvailable);
  }
}

// Every pill on the site (cards, side panel, calculator, advisor) takes its kind from here.
export const pillKindFor = cardKind;

// Which card owns the match video: the safe harbor card when the safe harbor is a match (guaranteed money),
// else the match card when there is an extra match, else the safe harbor card for a nonelective contribution.
export function matchVideoOwner(pd: PlanData | null | undefined): 'safeHarbor' | 'match' | null {
  if (!pd || typeof pd !== 'object') return null;
  const f = facts(pd);
  if (f.shMatch) return 'safeHarbor';
  if (matchCounts(pd)) return 'match';
  if (f.nonelective) return 'safeHarbor';
  return null;
}

const NONE: CardExtras = { picture: null, video: null, link: null };

export function cardExtras(id: StockId, pdIn: PlanData | null | undefined): CardExtras {
  const pd = pdIn && typeof pdIn === 'object' ? pdIn : null;
  if (!pd) return NONE;
  const kind = cardKind(id, pd);
  const show = kind === 'yes' || kind === 'info';
  const f = facts(pd);
  switch (id) {
    case 'safeHarbor':
      if (show) return { picture: 'employerSafeHarbor', video: matchVideoOwner(pd) === 'safeHarbor' ? 'match' : null, link: null };
      if (kind === 'no' && cardKind('match', pd) === 'yes') return { ...NONE, link: { to: 'match', text: { en: 'See the match answer ↓', es: 'Ver la respuesta del match ↓' } } };
      return NONE;
    case 'match':
      if (show) return { picture: 'employerMatch', video: matchVideoOwner(pd) === 'match' ? 'match' : null, link: null };
      if (kind === 'no' && f.safeHarbor) return { ...NONE, link: { to: 'safeHarbor', text: { en: 'See the safe harbor answer ↑', es: 'Ver la respuesta de safe harbor ↑' } } };
      return NONE;
    case 'vesting': return show ? { picture: 'vesting', video: 'vesting', link: null } : NONE;
    case 'roth': {
      if (!show) return NONE;
      const r = rothRows(pd);
      return { picture: 'tax', video: r && r.roth ? 'taxes' : null, link: null };
    }
    case 'limit': return show ? { picture: 'limits', video: 'limits', link: null } : NONE;
    case 'elig': return show && joinSteps(pd) ? { picture: 'join', video: null, link: null } : NONE;
    case 'leave': return show ? { picture: 'leave', video: 'leave', link: null } : NONE;
    case 'loans': {
      if (kind === 'yes') return { picture: null, video: 'access', link: null };
      if (kind === 'no' && cardKind('hardship', pd) === 'yes') return { ...NONE, link: { to: 'hardship', text: { en: 'See the hardship answer ↓', es: 'Ver la respuesta de dificultad ↓' } } };
      return NONE;
    }
    case 'hardship': return kind === 'yes' && cardKind('loans', pd) !== 'yes' ? { picture: null, video: 'access', link: null } : NONE;
    case 'profit':
    case 'inService':
      return NONE;
  }
}

// The videos of a topic's cards, in card order, no duplicates.
export function topicVideos(topic: TopicId, pd: PlanData | null | undefined): VideoId[] {
  const out: VideoId[] = [];
  for (const id of TOPIC_CARDS[topic]) {
    const v = cardExtras(id, pd).video;
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}
