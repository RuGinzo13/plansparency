'use client';

import React, { useState } from 'react';
import { C, F } from './theme';
import { Modal } from './ui';
import { TeamAvatar } from './TeamAvatar';
import type { TeamMember } from '@/lib/team';

interface Props {
  employerName: string;
  planName: string;
  recordkeeperName: string;
  recordkeeperUrl: string;
  team: TeamMember[];
  lang: 'en' | 'es';
  t: any;
  // dontShowAgain is the state of the checkbox at the moment of closing.
  onClose: (dontShowAgain: boolean) => void;
  onOpenTeam: () => void;
}

const dt = { margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.textMuted } as const;
const ddName = { margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: C.text } as const;
const ddSub = { margin: '4px 0 0', fontSize: 14, lineHeight: 1.5, color: C.textMuted } as const;

// Shown over the plan when an employee first opens it: who the employer is and where the account lives.
export function WelcomeDialog({ employerName, planName, recordkeeperName, recordkeeperUrl, team, lang, t, onClose, onOpenTeam }: Props) {
  const [hide, setHide] = useState(false);
  const url = recordkeeperUrl.startsWith('https://') ? recordkeeperUrl : '';
  const first = team[0];
  const close = () => onClose(hide);

  return (
    <Modal titleId="welcome-title" onClose={close} closeOnBackdrop closeLabel={t.welcomeClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <button type="button" onClick={close} aria-label={t.welcomeClose} style={{ position: 'absolute', top: 12, right: 12, width: 44, height: 44, borderRadius: 10, border: 'none', background: 'transparent', color: C.textMuted, fontSize: 26, lineHeight: 1, cursor: 'pointer', fontFamily: F.body }}>
          <span aria-hidden="true">×</span>
        </button>

        <div style={{ paddingRight: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.accentText, marginBottom: 8 }}>{t.welcomeLabel}</div>
          <h2 id="welcome-title" style={{ margin: 0, fontFamily: F.display, fontSize: 32, fontWeight: 700, lineHeight: 1.1, color: C.text }}>{t.welcomeTitle}</h2>
        </div>

        {(employerName || recordkeeperName) && (
          <dl style={{ margin: 0, border: `1px solid ${C.borderLight}`, borderRadius: 14 }}>
            {employerName && (
              <div style={{ padding: '14px 16px' }}>
                <dt style={dt}>{t.welcomeEmployer}</dt>
                <dd style={ddName}>{employerName}</dd>
                {planName && <dd style={ddSub}>{planName}</dd>}
              </div>
            )}
            {employerName && recordkeeperName && <div style={{ height: 1, background: C.borderLight }} />}
            {recordkeeperName && (
              <div style={{ padding: '14px 16px' }}>
                <dt style={dt}>{t.welcomeRk}</dt>
                <dd style={ddName}>{recordkeeperName}</dd>
                <dd style={ddSub}>{t.welcomeRkBody}</dd>
                {url && (
                  <dd style={{ margin: '8px 0 0' }}>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 32, fontSize: 15, fontWeight: 700, color: C.accentText }}>
                      <span>{t.welcomeVisit} <span aria-hidden="true">↗</span><span className="sr-only">{t.welcomeNewTab}</span></span>
                    </a>
                  </dd>
                )}
              </div>
            )}
          </dl>
        )}

        {first && (
          <button type="button" onClick={() => { onClose(hide); onOpenTeam(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: 0, background: 'none', border: 'none', textAlign: 'left', fontSize: 15, fontWeight: 600, color: C.accentText, cursor: 'pointer', fontFamily: F.body }}>
            <TeamAvatar name={first.name} role={first.role} photo={first.photo} size={32} />
            <span>{t.welcomeMeet.replace('{name}', first.name.split(',')[0].trim().split(/\s+/)[0])}</span>
          </button>
        )}

        <button type="button" onClick={close} style={{ minHeight: 52, width: '100%', border: 'none', borderRadius: 12, background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: F.body }}>{t.welcomeExplore}</button>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 36, fontSize: 14, color: C.text, cursor: 'pointer' }}>
          <input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} style={{ width: 20, height: 20, accentColor: C.accent, flexShrink: 0 }} />
          {t.welcomeHide}
        </label>

        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: C.textDim }}>{t.welcomeNote}</p>
      </div>
    </Modal>
  );
}
