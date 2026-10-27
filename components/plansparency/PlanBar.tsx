'use client';

import React from 'react';
import { C, F, LAYOUT } from './theme';
import { TeamAvatar } from './TeamAvatar';
import type { TeamMember } from '@/lib/team';

interface Props {
  planData: any;
  review?: { reviewerName?: string; reviewedAt?: string } | null;
  team: TeamMember[];
  lang: 'en' | 'es';
  onOpenTeam: () => void;
}

const label11 = { fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' } as const;
const sideCard = { width: '100%', maxWidth: 360, minHeight: 76, padding: '12px 16px', borderRadius: 14, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', fontFamily: 'inherit' } as const;

const LockIcon = ({ size = 20, stroke = C.barLink }: { size?: number; stroke?: string }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const PeopleIcon = () => (
  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><circle cx="17" cy="9" r="2.4" /><path d="M15.5 14.6c3 .2 5.5 2.1 5.5 5.4" />
  </svg>
);

// The plan bar: recordkeeper, plan name and the advisor's team card. It sits above the tabs on every
// tab and never scrolls. Under 700px it turns into one compact row (CSS classes in globals.css).
export function PlanBar({ planData, review, team, lang, onOpenTeam }: Props) {
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);

  const planName: string = planData?.planName || L('Your 401(k) Plan', 'Tu Plan 401(k)');
  const reviewer = review?.reviewerName && review.reviewerName.trim() ? review.reviewerName.trim() : '';
  const when = review?.reviewedAt ? new Date(review.reviewedAt).toLocaleDateString(es ? 'es-US' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  const rkName: string | undefined = planData?.recordkeeperName || undefined;
  const rkUrl: string | undefined = typeof planData?.recordkeeperUrl === 'string' && planData.recordkeeperUrl.startsWith('https://') ? planData.recordkeeperUrl : undefined;

  // Who the card names first: the person who set the plan up, else the advisor, else the first person listed.
  const lead = team.find((m) => m.lead) || team.find((m) => m.role === 'advisor') || team[0];
  const leadName = (lead?.name || planData?.advisorName || '').trim();
  const first = leadName.split(/\s+/)[0] || '';
  const others = Math.max(0, team.length - 1);
  const hasTeamCard = team.length > 0 || !!leadName;
  const sub = !first ? '' : others > 0 ? L(`${first} and ${others} ${others === 1 ? 'other' : 'others'}`, `${first} y ${others} más`) : first;
  const teamLabel = L('Meet your advisor’s team', 'Conoce al equipo de tu asesor');

  const rkInner = (
    <>
      <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: C.tabShadeText, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LockIcon /></span>
      <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ ...label11, color: C.barMuted }}>{L('Recordkeeper', 'Administrador del plan')}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.barText, overflowWrap: 'anywhere' }}>{rkName}</span>
        {rkUrl && <span style={{ fontSize: 13, fontWeight: 600, color: C.barLink }}>{L('Log in to your account ↗', 'Entra a tu cuenta ↗')}<span className="sr-only">{L(' (opens in a new tab)', ' (se abre en una pestaña nueva)')}</span></span>}
      </span>
    </>
  );
  const rkStyle = { ...sideCard, background: 'transparent', border: `1px solid ${C.textMuted}`, color: C.barText, textDecoration: 'none' } as const;

  return (
    <div className="on-dark pb-bar" style={{ flexShrink: 0, background: C.bar, borderBottom: `2px solid ${C.barLine}` }}>
      {/* Wide: three equal columns */}
      <div className="pb-wide" style={{ maxWidth: LAYOUT.page, margin: '0 auto', padding: '16px 20px', boxSizing: 'border-box', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', alignItems: 'center', justifyItems: 'center', gap: '16px 24px' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
          {rkName && (rkUrl
            ? <a href={rkUrl} target="_blank" rel="noopener noreferrer" style={rkStyle}>{rkInner}</a>
            : <div style={rkStyle}>{rkInner}</div>)}
        </div>

        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: C.barMuted }}>{L('Your plan', 'Tu plan')}</div>
          <h1 style={{ margin: 0, fontFamily: F.display, fontSize: 'clamp(22px, 2.6vw, 30px)', fontWeight: 700, lineHeight: 1.1, color: C.barText, textAlign: 'center' }}>{planName}</h1>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 100, background: reviewer ? C.greenSoft : C.accentSoft, color: reviewer ? C.green : C.accentText }}>
            {reviewer ? L(`Details reviewed by ${reviewer}${when ? ` on ${when}` : ''}`, `Detalles revisados por ${reviewer}${when ? ` el ${when}` : ''}`) : L('Read from the document you uploaded', 'Leído del documento que subiste')}
          </span>
        </div>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
          {hasTeamCard && (
            <button type="button" onClick={onOpenTeam} style={{ ...sideCard, cursor: 'pointer', border: 'none', background: C.surface, color: C.text, boxShadow: `0 6px 18px ${C.shadowStrong}` }}>
              {team.length > 0 && (
                <span aria-hidden="true" style={{ display: 'inline-flex', flexShrink: 0 }}>
                  {team.slice(0, 4).map((m, i) => (
                    <span key={m.id} style={{ display: 'inline-flex', marginLeft: i === 0 ? 0 : -10, borderRadius: '50%', border: `2px solid ${C.surface}` }}>
                      <TeamAvatar name={m.name} role={m.role} photo={m.photo} size={32} />
                    </span>
                  ))}
                </span>
              )}
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ ...label11, color: C.accentText }}>{L('Your advisor', 'Tu asesor')}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{teamLabel}</span>
                {sub && <span style={{ fontSize: 13, color: C.textMuted }}>{sub}</span>}
              </span>
              <span aria-hidden="true" style={{ fontSize: 20, fontWeight: 700, color: C.accentText }}>→</span>
            </button>
          )}
        </div>
      </div>

      {/* Phone: one compact row */}
      <div className="pb-compact" style={{ padding: '10px 16px', boxSizing: 'border-box', alignItems: 'center', gap: 8, minHeight: 64 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: F.display, fontSize: 20, fontWeight: 700, lineHeight: 1.2, color: C.barText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{planName}</h1>
        </div>
        {rkName && rkUrl && (
          <a href={rkUrl} target="_blank" rel="noopener noreferrer" aria-label={L(`Log in at ${rkName} (opens in a new tab)`, `Entra en ${rkName} (se abre en una pestaña nueva)`)}
            style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, border: `1px solid ${C.textMuted}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LockIcon size={22} />
          </a>
        )}
        {hasTeamCard && (
          <button type="button" onClick={onOpenTeam} aria-label={teamLabel}
            style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, border: 'none', background: C.surface, color: C.accentText, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PeopleIcon />
          </button>
        )}
      </div>
    </div>
  );
}
