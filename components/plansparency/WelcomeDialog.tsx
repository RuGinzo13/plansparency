'use client';

import React, { useEffect, useRef, useState } from 'react';
import { C, F } from './theme';
import { Modal } from './ui';
import { TeamAvatar } from './TeamAvatar';
import type { TeamMember } from '@/lib/team';
import { FOCUS_CHOICES, MAX_FOCUS, type FocusId } from '@/lib/plan/focus';
import { FocusIcon } from './FocusIcon';

interface Props {
  employerName: string;
  planName: string;
  recordkeeperName: string;
  recordkeeperUrl: string;
  team: TeamMember[];
  lang: 'en' | 'es';
  t: any;
  // dontShowAgain is the state of the checkbox at the moment of closing.
  // onClose is the ×, Esc and a click outside; on step 2 that is the same as skipping.
  onClose: (dontShowAgain: boolean) => void;
  onOpenTeam: () => void;
  // Step to open at: 1 (the info) or 2 (pick your focus). Step 2 only when step 1 has nothing to show.
  initialStep?: 1 | 2;
  // Picks already made (when the person taps "Change focus").
  initialPicks?: FocusId[];
  // "Show me my plan": the ordered picks.
  onFocus: (picks: FocusId[], dontShowAgain: boolean) => void;
  // "Skip, show me everything": clears any picks.
  onSkip: (dontShowAgain: boolean) => void;
}

const dt = { margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.textMuted } as const;
const ddName = { margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: C.text } as const;
const ddSub = { margin: '4px 0 0', fontSize: 14, lineHeight: 1.5, color: C.textMuted } as const;

// Shown over the plan when an employee first opens it: who the employer is and where the account lives.
export function WelcomeDialog({ employerName, planName, recordkeeperName, recordkeeperUrl, team, lang, t, onClose, onOpenTeam, initialStep = 1, initialPicks = [], onFocus, onSkip }: Props) {
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const [hide, setHide] = useState(false);
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [picks, setPicks] = useState<FocusId[]>(initialPicks);
  const step2Heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => { if (moved.current && step === 2) step2Heading.current?.focus(); }, [step]);
  const full = picks.length >= MAX_FOCUS;
  const toggle = (id: FocusId) => setPicks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_FOCUS ? prev : [...prev, id]));
  const url = recordkeeperUrl.startsWith('https://') ? recordkeeperUrl : '';
  const first = team[0];
  const close = () => onClose(hide);

  const progress = (n: 1 | 2) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span aria-hidden="true" style={{ display: 'flex', gap: 6 }}>
        <span style={{ width: 28, height: 6, borderRadius: 6, background: C.accent }} />
        <span style={{ width: 28, height: 6, borderRadius: 6, background: n === 2 ? C.accent : C.borderLight }} />
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.accentText }}>{L(`Step ${n} of 2`, `Paso ${n} de 2`)}</span>
    </div>
  );

  return (
    <Modal titleId="welcome-title" onClose={close} closeOnBackdrop closeLabel={t.welcomeClose} maxWidth={step === 2 ? 720 : 520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <button type="button" onClick={close} aria-label={t.welcomeClose} style={{ position: 'absolute', top: 12, right: 12, width: 44, height: 44, borderRadius: 10, border: 'none', background: 'transparent', color: C.textMuted, fontSize: 26, lineHeight: 1, cursor: 'pointer', fontFamily: F.body }}>
          <span aria-hidden="true">×</span>
        </button>
        {step === 1 && (
          <>
        <div style={{ paddingRight: 40 }}>
          {progress(1)}
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

        <button type="button" onClick={() => { moved.current = true; setStep(2); }} style={{ minHeight: 52, width: '100%', border: 'none', borderRadius: 12, background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: F.body }}>{t.welcomeExplore}</button>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 36, fontSize: 14, color: C.text, cursor: 'pointer' }}>
          <input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} style={{ width: 20, height: 20, accentColor: C.accent, flexShrink: 0 }} />
          {t.welcomeHide}
        </label>

        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: C.textDim }}>{t.welcomeNote}</p>

          </>
        )}
        {step === 2 && (
          <>
        <div style={{ paddingRight: 40 }}>
          {progress(2)}
          <h2 id="welcome-title" ref={step2Heading} tabIndex={-1} style={{ margin: 0, fontFamily: F.display, fontSize: 32, fontWeight: 700, lineHeight: 1.1, color: C.text }}>{L('What do you want to understand first?', '¿Qué quieres entender primero?')}</h2>
          <p style={{ margin: '10px 0 0', fontSize: 16, lineHeight: 1.5, color: C.textMuted }}>{L('Pick up to 3. We’ll start there. You can change this anytime.', 'Elige hasta 3. Empezaremos por ahí. Puedes cambiarlo en cualquier momento.')}</p>
        </div>

        <fieldset style={{ border: 'none', margin: 0, padding: 0, minWidth: 0 }}>
          <legend className="sr-only">{L('Pick up to 3 things to learn first', 'Elige hasta 3 cosas para aprender primero')}</legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 10 }}>
            {FOCUS_CHOICES.map((c) => {
              const on = picks.includes(c.id);
              const blocked = full && !on;
              return (
                <label key={c.id} className="focus-wrap" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 14, cursor: blocked ? 'default' : 'pointer', opacity: blocked ? 0.55 : 1, background: on ? C.highlight : C.surface, border: on ? `2px solid ${C.accent}` : `1px solid ${C.border}`, boxSizing: 'border-box' }}>
                  <input type="checkbox" checked={on} aria-disabled={blocked ? 'true' : undefined} onChange={() => { if (!blocked) toggle(c.id); }} style={{ width: 22, height: 22, accentColor: C.accent, flexShrink: 0, marginTop: 2 }} />
                  <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? C.accent : C.surfaceAlt, color: on ? C.onPrimary : C.tabShadeText }}><FocusIcon name={c.icon} /></span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{c.title[lang]}</span>
                    <span style={{ fontSize: 13, lineHeight: 1.4, color: C.textMuted }}>{c.example[lang]}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div role="status" style={{ minHeight: full ? undefined : 0, fontSize: 13, color: C.warning }}>{full ? L('That’s 3. Uncheck one to pick another.', 'Son 3. Desmarca una para elegir otra.') : ''}</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 20px' }}>
          <button type="button" disabled={picks.length === 0} onClick={() => onFocus(picks, hide)} style={{ minHeight: 52, padding: '0 24px', border: 'none', borderRadius: 12, background: picks.length === 0 ? C.track : `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: picks.length === 0 ? C.textMuted : C.onPrimary, fontSize: 16, fontWeight: 700, cursor: picks.length === 0 ? 'default' : 'pointer', fontFamily: F.body }}>
            {L(`Show me my plan (${picks.length})`, `Mostrar mi plan (${picks.length})`)}
          </button>
          <button type="button" onClick={() => onSkip(hide)} style={{ minHeight: 44, padding: 0, background: 'none', border: 'none', fontSize: 15, fontWeight: 600, color: C.textMuted, textDecoration: 'underline', cursor: 'pointer', fontFamily: F.body }}>
            {L('Skip, show me everything', 'Omitir, mostrarme todo')}
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: C.textDim }}>{t.welcomeNote}</p>
          </>
        )}
      </div>
    </Modal>
  );
}
