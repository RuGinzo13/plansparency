'use client';

import React from 'react';
import { EmployerMoneyVisual } from './EmployerMoneyVisual';
import { VestingVisual } from './VestingVisual';
import { JoinTimelineVisual } from './JoinTimelineVisual';
import { TaxTimingVisual } from './TaxTimingVisual';
import { LimitsVisual } from './LimitsVisual';
import { cardExtras } from '@/lib/plan/relevance';
import type { StockId } from '@/lib/answers/stockAnswers';

// The picture that belongs inside each answer card. Which one (or none) comes from lib/plan/relevance.ts.
// The leave choices picture is placed by the Your plan screen itself.
export function CardVisual({ id, planData, lang }: { id: string; planData: any; lang: 'en' | 'es' }) {
  const picture = cardExtras(id as StockId, planData).picture;
  if (picture === 'employerSafeHarbor') return <EmployerMoneyVisual key={id} planData={planData} lang={lang} source="safeHarbor" />;
  if (picture === 'employerMatch') return <EmployerMoneyVisual key={id} planData={planData} lang={lang} source="match" />;
  if (picture === 'vesting') return <VestingVisual planData={planData} lang={lang} />;
  if (picture === 'join') return <JoinTimelineVisual planData={planData} lang={lang} />;
  if (picture === 'tax') return <TaxTimingVisual planData={planData} lang={lang} />;
  if (picture === 'limits') return <LimitsVisual planData={planData} lang={lang} />;
  return null;
}
