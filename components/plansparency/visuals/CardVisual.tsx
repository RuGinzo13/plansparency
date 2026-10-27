'use client';

import React from 'react';
import { EmployerMoneyVisual } from './EmployerMoneyVisual';
import { VestingVisual } from './VestingVisual';
import { JoinTimelineVisual } from './JoinTimelineVisual';
import { TaxTimingVisual } from './TaxTimingVisual';
import { LimitsVisual } from './LimitsVisual';

// The picture that belongs inside each answer card (null when the card has none).
export function CardVisual({ id, planData, lang }: { id: string; planData: any; lang: 'en' | 'es' }) {
  if (id === 'safeHarbor' || id === 'match') return <EmployerMoneyVisual key={id} planData={planData} lang={lang} />;
  if (id === 'vesting') return <VestingVisual planData={planData} lang={lang} />;
  if (id === 'elig') return <JoinTimelineVisual planData={planData} lang={lang} />;
  if (id === 'roth') return <TaxTimingVisual planData={planData} lang={lang} />;
  if (id === 'limit') return <LimitsVisual planData={planData} lang={lang} />;
  return null;
}
