// ── Guided start: the six things a person can pick to focus on ───────────────
// Picks only decide where the person starts, what opens first and what the side panel shows first.
// They live in React state only (never saved on the device or on a server).

import type { PlanData } from './plandata';
import { facts } from './planFacts';
import type { StockId } from '../answers/stockAnswers';

export type FocusId = 'start' | 'employer' | 'access' | 'leave' | 'invest' | 'calc';
export type FocusIcon = 'flag' | 'building' | 'unlock' | 'door' | 'pie' | 'calculator';
export const MAX_FOCUS = 3;

export interface FocusChoice {
  id: FocusId;
  icon: FocusIcon;
  title: { en: string; es: string };
  example: { en: string; es: string };
}

export const FOCUS_CHOICES: FocusChoice[] = [
  { id: 'start', icon: 'flag', title: { en: 'Get started saving', es: 'Empezar a ahorrar' }, example: { en: 'When can I join? How much can I put in? Roth or pre-tax?', es: '¿Cuándo puedo unirme? ¿Cuánto puedo aportar? ¿Roth o antes de impuestos?' } },
  { id: 'employer', icon: 'building', title: { en: 'Get my employer’s money', es: 'Recibir el dinero de mi empleador' }, example: { en: 'Am I getting the full match? When is it mine to keep?', es: '¿Recibo el match completo? ¿Cuándo es mío?' } },
  { id: 'access', icon: 'unlock', title: { en: 'Use my money while I work', es: 'Usar mi dinero mientras trabajo' }, example: { en: 'Can I borrow from it? What if I have an emergency?', es: '¿Puedo pedir un préstamo? ¿Y si tengo una emergencia?' } },
  { id: 'leave', icon: 'door', title: { en: 'Leaving or changed jobs', es: 'Me voy o cambié de trabajo' }, example: { en: 'What happens to my money? What are my choices?', es: '¿Qué pasa con mi dinero? ¿Cuáles son mis opciones?' } },
  { id: 'invest', icon: 'pie', title: { en: 'Pick my investments', es: 'Elegir mis inversiones' }, example: { en: 'What are my options? What does a target date fund do?', es: '¿Cuáles son mis opciones? ¿Qué hace un fondo de fecha objetivo?' } },
  { id: 'calc', icon: 'calculator', title: { en: 'See what I could save', es: 'Ver cuánto podría ahorrar' }, example: { en: 'How much will I have? What if I save 1% more?', es: '¿Cuánto tendré? ¿Y si ahorro 1% más?' } },
];

export const focusChoice = (id: FocusId): FocusChoice => FOCUS_CHOICES.find((c) => c.id === id) as FocusChoice;
export const focusTitle = (id: FocusId, lang: 'en' | 'es'): string => focusChoice(id).title[lang];

// Where a pick takes the person.
export type FocusPlace =
  | { kind: 'card'; card: StockId }
  | { kind: 'investments' }
  | { kind: 'calculator' };

export function focusPlace(id: FocusId, pd: PlanData | null): FocusPlace {
  switch (id) {
    case 'start': return { kind: 'card', card: 'elig' };
    case 'employer': return { kind: 'card', card: pd && facts(pd).safeHarbor ? 'safeHarbor' : 'match' };
    case 'access': return { kind: 'card', card: 'loans' };
    case 'leave': return { kind: 'card', card: 'leave' };
    case 'invest': return { kind: 'investments' };
    case 'calc': return { kind: 'calculator' };
  }
}

// The side panel groups a pick makes first. Picks with no group (leave, invest, calc) add none.
export function focusTopics(picks: FocusId[]): ('you' | 'employer' | 'access')[] {
  const out: ('you' | 'employer' | 'access')[] = [];
  for (const p of picks) {
    const t = p === 'start' ? 'you' : p === 'employer' ? 'employer' : p === 'access' ? 'access' : null;
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}
