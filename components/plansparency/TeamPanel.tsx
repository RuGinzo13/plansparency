'use client';

import React from 'react';
import { C, F, ROLE, LAYOUT } from './theme';
import { RoleChip } from './RoleChip';
import { TeamAvatar } from './TeamAvatar';
import { TEAM_ROLES, ROLE_TEXT, telHref, rolesOf, type TeamMember } from '@/lib/team';

interface Props {
  team: TeamMember[];
  planName: string;
  lang: 'en' | 'es';
  t: any;
}

const linkStyle = { display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 32, fontSize: 15, fontWeight: 600, color: C.accentText, overflowWrap: 'anywhere' } as const;

const PhoneIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accentText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
  </svg>
);
const MailIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accentText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" />
  </svg>
);

// Tab 4: the advisor's team for this plan, color-coded by role.
export function TeamPanel({ team, planName, lang, t }: Props) {
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const plan = planName ? L(`the ${planName}`, `el ${planName}`) : L('your 401(k)', 'tu 401(k)');
  const rolesInUse = TEAM_ROLES.filter((r) => team.some((m) => rolesOf(m).includes(r)));

  const speaks = (m: TeamMember) => [m.langs.en ? 'English' : '', m.langs.es ? 'Español' : '', m.langs.other].filter(Boolean).join(', ');

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div className="on-dark" style={{ position: 'sticky', top: 0, zIndex: 5, background: C.bar, borderBottom: `2px solid ${C.barLine}`, boxShadow: `0 8px 20px ${C.shadow}` }}>
        <div style={{ maxWidth: LAYOUT.page, margin: '0 auto', padding: '16px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ margin: 0, fontFamily: F.display, fontSize: 'clamp(20px, 3vw, 26px)', lineHeight: 1.1, fontWeight: 700, color: C.barText }}>{t.teamTitle}</h1>
          <div style={{ fontSize: 14, color: C.barMuted }}>
            {L(`The people who help with ${plan}. Reach out with questions about your plan.`, `Las personas que ayudan con ${plan}. Escríbeles si tienes preguntas sobre tu plan.`)}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: LAYOUT.page, margin: '0 auto', padding: '28px 20px 48px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {team.length === 0 ? (
          <section aria-labelledby="team-empty-title" style={{ maxWidth: 640, padding: 24, border: `1px dashed ${C.inputBorder}`, borderRadius: 16, boxSizing: 'border-box' }}>
            <h2 id="team-empty-title" style={{ margin: '0 0 10px', fontFamily: F.display, fontSize: 26, fontWeight: 700, color: C.text }}>{t.teamEmptyTitle}</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: C.textMuted }}>{t.teamEmptyBody}</p>
          </section>
        ) : (
          <>
            <section aria-labelledby="team-who-title" style={{ padding: '16px 18px', borderRadius: 14, background: C.surfaceAlt }}>
              <h2 id="team-who-title" style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: C.text }}>{t.teamWho}</h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px 20px' }}>
                {rolesInUse.map((r) => (
                  <li key={r} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                    <RoleChip role={r} lang={lang} />
                    <span style={{ fontSize: 14, lineHeight: 1.45, color: C.textMuted }}>{ROLE_TEXT[r][lang].what}</span>
                  </li>
                ))}
              </ul>
            </section>

            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {team.map((m) => (
                <li key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 20, border: `1px solid ${C.border}`, borderTop: `6px solid ${ROLE[m.role].base}`, borderRadius: 16, background: C.surface, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <TeamAvatar name={m.name} role={m.role} photo={m.photo} size={64} />
                    <div style={{ minWidth: 0 }}>
                      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, lineHeight: 1.25, color: C.text, overflowWrap: 'anywhere' }}>{m.name}</h2>
                      {m.title && <div style={{ fontSize: 14, color: C.textMuted, overflowWrap: 'anywhere' }}>{m.title}</div>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {rolesOf(m).map((r) => <RoleChip key={r} role={r} lang={lang} />)}
                    {m.lead && <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 100, border: `1px solid ${C.border}`, color: C.text }}>{t.teamSetup}</span>}
                  </div>

                  {speaks(m) && <div style={{ fontSize: 13, color: C.textMuted }}><strong style={{ color: C.text }}>{t.teamSpeaks}</strong> {speaks(m)}</div>}

                  <div style={{ flexGrow: 1, paddingTop: 12, borderTop: `1px solid ${C.borderLight}`, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                    {m.phone && (
                      <a href={telHref(m.phone)} style={linkStyle}>
                        <PhoneIcon />
                        <span><span className="sr-only">{L(`Call ${m.name}: `, `Llamar a ${m.name}: `)}</span>{m.phone}</span>
                      </a>
                    )}
                    {m.email && (
                      <a href={`mailto:${m.email}`} style={linkStyle}>
                        <MailIcon />
                        <span><span className="sr-only">{L(`Email ${m.name}: `, `Escribir a ${m.name}: `)}</span>{m.email}</span>
                      </a>
                    )}
                  </div>

                  {m.booking && (
                    <a href={m.booking} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: 12, background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary, fontSize: 15, fontWeight: 700, textDecoration: 'none', textAlign: 'center', padding: '0 14px' }}>
                      <span>{t.teamBook} <span aria-hidden="true">↗</span><span className="sr-only">{L(` with ${m.name} (opens in a new tab)`, ` con ${m.name} (se abre en una pestaña nueva)`)}</span></span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        <p style={{ margin: 0, maxWidth: LAYOUT.reading, fontSize: 13, lineHeight: 1.5, color: C.textDim }}>{t.teamFootnote}</p>
      </div>
    </div>
  );
}
