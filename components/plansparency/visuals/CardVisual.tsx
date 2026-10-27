'use client';

import React from 'react';
import { EmployerMoneyVisual } from './EmployerMoneyVisual';
import { VestingVisual } from './VestingVisual';

// The picture that belongs inside each answer card (null when the card has none).
export function CardVisual({ id, planData, lang }: { id: string; planData: any; lang: 'en' | 'es' }) {
  if (id === 'safeHarbor' || id === 'match') return <EmployerMoneyVisual key={id} planData={planData} lang={lang} />;
  if (id === 'vesting') return <VestingVisual planData={planData} lang={lang} />;
  return null;
}
