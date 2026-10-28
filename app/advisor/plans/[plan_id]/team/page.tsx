'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { C, F, ROLE, btnBase, LAYOUT } from '@/components/plansparency/theme';
import { Logo, SkipLink } from '@/components/plansparency/ui';
import { RoleChip } from '@/components/plansparency/RoleChip';
import { TeamAvatar } from '@/components/plansparency/TeamAvatar';
import {
  TEAM_ROLES, ROLE_TEXT, MAX_TEAM, MAX_PHOTO_CHARS, rolesOf,
  isValidEmail, isValidPhone, isValidBooking,
  type TeamMember, type TeamRole,
  MAX_HELPS,
} from '@/lib/team';

const MAX_PHOTO_FILE = 5 * 1024 * 1024;

type Draft = Omit<TeamMember, 'id'> & { id: string };
const blank = (): Draft => ({
  id: '', name: '', role: 'service', also: [], title: '', helps: '', phone: '', email: '',
  langs: { en: false, es: false, other: '' }, booking: '', photo: '', lead: false,
});

type FormErrors = { name?: string; email?: string; phone?: string; booking?: string };

// Center-crop to a square, shrink to 256 x 256 and re-encode as JPEG.
async function resizePhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('That image could not be read.'));
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser could not shrink the photo.');
    ctx.fillStyle = C.field;
    ctx.fillRect(0, 0, 256, 256);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
    for (const q of [0.85, 0.7, 0.55]) {
      const out = canvas.toDataURL('image/jpeg', q);
      if (out.length <= MAX_PHOTO_CHARS) return out;
    }
    throw new Error('That photo is too detailed. Try a simpler one.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function TeamEditorPage() {
  const params = useParams<{ plan_id: string }>();
  const planId = params?.plan_id;

  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [planLabel, setPlanLabel] = useState('');
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null); // 'new' or a member id
  const [draft, setDraft] = useState<Draft>(blank());
  const [errors, setErrors] = useState<FormErrors>({});
  const [photoError, setPhotoError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!planId) return;
    let alive = true;
    fetch(`/api/plan-team/${planId}`)
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 404 || r.status === 400) { setNotFound(true); return; }
        if (!r.ok) { setLoadError('We couldn’t load your team. Refresh to try again.'); return; }
        const d = await r.json();
        setPlanLabel(d.planName || d.employerName || '');
        setTeam(d.team || []);
        setLoaded(true);
      })
      .catch(() => { if (alive) setLoadError('We couldn’t load your team. Refresh to try again.'); });
    return () => { alive = false; };
  }, [planId]);

  // Saves the whole list. Returns true on success.
  const persist = async (next: TeamMember[]): Promise<boolean> => {
    setSaving(true); setSaved(false); setSaveError('');
    try {
      const r = await fetch(`/api/plan-team/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: next }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setSaveError(d?.errors?.[0] || d?.error || 'We couldn’t save. Try again.');
        return false;
      }
      setTeam(d.team);
      setSaved(true);
      return true;
    } catch {
      setSaveError('We couldn’t save. Check your connection and try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const startAdd = () => {
    setEditingId('new'); setDraft(blank()); setErrors({}); setPhotoError(''); setSaved(false); setSaveError('');
    setTimeout(() => nameRef.current?.focus(), 0);
  };
  const startEdit = (m: TeamMember) => {
    setEditingId(m.id); setDraft({ ...m, langs: { ...m.langs } }); setErrors({}); setPhotoError(''); setSaved(false); setSaveError('');
    setTimeout(() => nameRef.current?.focus(), 0);
  };
  const cancel = () => { setEditingId(null); setDraft(blank()); setErrors({}); setPhotoError(''); };

  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (saving || j < 0 || j >= team.length) return;
    const next = team.slice();
    [next[index], next[j]] = [next[j], next[index]];
    await persist(next);
  };

  const validate = (d: Draft): FormErrors => {
    const e: FormErrors = {};
    if (!d.name.trim()) e.name = 'Add a name.';
    if (!isValidEmail(d.email.trim())) e.email = 'That email doesn’t look right. Check for a typo.';
    if (!isValidPhone(d.phone.trim())) e.phone = 'Use only digits, spaces and + ( ) - .';
    if (!isValidBooking(d.booking.trim())) e.booking = 'The link must start with https://';
    return e;
  };

  const submit = async () => {
    const e = validate(draft);
    setErrors(e);
    if (Object.keys(e).length) return;
    const member: TeamMember = {
      ...draft,
      id: editingId === 'new' || !draft.id ? crypto.randomUUID() : draft.id,
      name: draft.name.trim(), title: draft.title.trim(), helps: draft.helps.trim(), phone: draft.phone.trim(),
      email: draft.email.trim(), booking: draft.booking.trim(),
      langs: { ...draft.langs, other: draft.langs.other.trim() },
    };
    let next: TeamMember[];
    if (editingId === 'new') next = [...team, member];
    else next = team.map((m) => (m.id === member.id ? member : m));
    if (member.lead) next = next.map((m) => (m.id === member.id ? m : { ...m, lead: false }));
    if (await persist(next)) cancel();
  };

  const remove = async () => {
    if (!editingId || editingId === 'new') return;
    if (await persist(team.filter((m) => m.id !== editingId))) cancel();
  };

  const onPhoto = async (file: File | undefined) => {
    setPhotoError('');
    if (!file) return;
    if (!/^image\/(jpeg|png)$/.test(file.type)) { setPhotoError('Use a JPG or PNG photo.'); return; }
    if (file.size > MAX_PHOTO_FILE) { setPhotoError('That photo is over 5 MB. Choose a smaller one.'); return; }
    try {
      const photo = await resizePhoto(file);
      setDraft((d) => ({ ...d, photo }));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'That photo could not be used.');
    }
  };

  // ── Shared page frame (same look as /advisor) ──
  const frame = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: C.page, color: C.text, fontFamily: F.body }}>
      <SkipLink lang="en" />
      <div style={{ maxWidth: LAYOUT.advisor, margin: '0 auto', padding: '20px 16px 48px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <Logo small={false} />
          <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 100, background: C.accentSoft, color: C.accentText }}>For advisors</span>
        </div>
        <main id="main" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );

  const backLink = (
    <a href="/advisor" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, fontSize: 14, fontWeight: 600, color: C.accentText }}>← Your plans</a>
  );

  if (notFound) return frame(<>{backLink}<h1 style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, margin: '8px 0 0' }}>We couldn’t find that plan.</h1></>);
  if (loadError) return frame(<>{backLink}<p role="alert" style={{ color: C.danger, fontSize: 16 }}>{loadError}</p></>);
  if (!loaded) return frame(<>{backLink}<p role="status" style={{ color: C.textMuted, fontSize: 16 }}>Loading your team…</p></>);

  // ── Styles ──
  const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, color: C.text } as const;
  const inputStyle = { minHeight: 44, boxSizing: 'border-box', width: '100%', padding: '0 12px', border: `1px solid ${C.inputBorder}`, borderRadius: 10, fontSize: 16, fontFamily: F.body, background: C.field, color: C.text } as const;
  const errStyle = { fontSize: 13, color: C.danger, fontWeight: 400 } as const;
  const editing = editingId !== null;
  const formTitle = editingId === 'new' ? 'Add a team member' : `Edit ${draft.name || 'team member'}`;
  const planText = planLabel || 'this plan';
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const iconBtn = (disabled: boolean) => ({
    width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text,
    fontSize: 18, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1, fontFamily: F.body, padding: 0,
  }) as const;

  return frame(
    <>
      {backLink}
      <h1 style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, margin: '4px 0 12px' }}>Your team on this plan</h1>
      <p style={{ fontSize: 16, color: C.textMuted, lineHeight: 1.6, maxWidth: 720, margin: '0 0 28px' }}>
        Employees of <strong style={{ color: C.text }}>{planText}</strong> see these people on the “Meet your advisor’s team” tab. Only add people who work with this plan.
      </p>

      <div role="status" style={{ minHeight: 24, marginBottom: 12, fontSize: 14, fontWeight: 600, color: C.green }}>
        {saved ? 'Saved. Employees see the change right away.' : ''}
      </div>
      {saveError && <p role="alert" style={{ fontSize: 14, fontWeight: 600, color: C.danger, margin: '0 0 12px' }}>{saveError}</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>
        {/* ── Left: the list ── */}
        <section aria-labelledby="team-list-title" style={{ flex: '1 1 420px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <h2 id="team-list-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Team ({team.length})</h2>
            <span style={{ fontSize: 13, color: C.textDim }}>First person shows first</span>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {team.map((m, i) => {
              const isEditing = editingId === m.id;
              return (
                <li key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: C.surface, boxShadow: `0 1px 3px ${C.cardShadow}`,
                  border: isEditing ? `2px solid ${C.text}` : 'none', borderLeft: `6px solid ${ROLE[m.role].base}`,
                }}>
                  <TeamAvatar name={m.name} role={m.role} photo={m.photo} size={48} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, overflowWrap: 'anywhere' }}>{m.name}</div>
                    {m.title && <div style={{ fontSize: 14, color: C.textMuted, overflowWrap: 'anywhere' }}>{m.title}</div>}
                    {m.helps && <div style={{ maxWidth: '100%', fontSize: 13, color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.helps}</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{rolesOf(m).map((r) => <RoleChip key={r} role={r} />)}</div>
                    {(m.phone || m.email) && <div style={{ fontSize: 13, color: C.textDim, overflowWrap: 'anywhere' }}>{[m.phone, m.email].filter(Boolean).join(' · ')}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" aria-label={`Move ${m.name} up`} aria-disabled={i === 0 || saving} onClick={() => move(i, -1)} style={iconBtn(i === 0 || saving)}><span aria-hidden="true">↑</span></button>
                      <button type="button" aria-label={`Move ${m.name} down`} aria-disabled={i === team.length - 1 || saving} onClick={() => move(i, 1)} style={iconBtn(i === team.length - 1 || saving)}><span aria-hidden="true">↓</span></button>
                    </div>
                    <button type="button" onClick={() => startEdit(m)} aria-label={`Edit ${m.name}`} style={{ minHeight: 40, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: C.accentText, fontFamily: F.body }}>Edit</button>
                  </div>
                </li>
              );
            })}
          </ul>
          {team.length < MAX_TEAM ? (
            <button type="button" onClick={startAdd} style={{ marginTop: 12, width: '100%', minHeight: 52, background: 'transparent', border: `1px dashed ${C.inputBorder}`, borderRadius: 14, fontSize: 15, fontWeight: 700, color: C.accentText, cursor: 'pointer', fontFamily: F.body }}>+ Add a team member</button>
          ) : (
            <p style={{ fontSize: 13, color: C.textDim, marginTop: 12 }}>You’ve reached the limit of {MAX_TEAM} people.</p>
          )}
          <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.5, margin: '16px 0 0' }}>
            For now the team is saved on each plan. When advisor accounts arrive, your team moves to your account and shows on every plan you set up.
          </p>
        </section>

        {/* ── Right: the form ── */}
        <section aria-labelledby="team-form-title" style={{ flex: '1 1 420px', minWidth: 0, boxSizing: 'border-box', padding: 22, borderRadius: 16, border: `2px solid ${C.bar}`, boxShadow: `0 4px 14px ${C.cardShadow}`, background: C.surface, display: editing ? 'flex' : 'none', flexDirection: 'column', gap: 16 }}>
          <h2 id="team-form-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{formTitle}</h2>
          <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <TeamAvatar name={draft.name || '?'} role={draft.role} photo={draft.photo} size={72} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" onClick={() => fileRef.current?.click()} style={{ minHeight: 40, padding: '0 14px', background: C.surface, border: `1px solid ${C.inputBorder}`, borderRadius: 10, fontSize: 14, fontWeight: 600, color: C.text, cursor: 'pointer', fontFamily: F.body }}>{draft.photo ? 'Replace photo' : 'Add photo'}</button>
                  {draft.photo && <button type="button" onClick={() => set('photo', '')} style={{ minHeight: 40, background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: C.accentText, textDecoration: 'underline', cursor: 'pointer', fontFamily: F.body }}>Remove photo</button>}
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={(e) => { onPhoto(e.target.files?.[0]); e.target.value = ''; }} />
                <span style={{ fontSize: 12, color: C.textDim }}>Square headshot, JPG or PNG. We shrink it to 256 x 256.</span>
                {photoError && <span role="alert" style={errStyle}>{photoError}</span>}
              </div>
            </div>

            <label style={labelStyle}>
              Full name (required)
              <input ref={nameRef} type="text" value={draft.name} maxLength={80} onChange={(e) => set('name', e.target.value)} style={inputStyle} aria-invalid={!!errors.name} />
              {errors.name && <span role="alert" style={errStyle}>{errors.name}</span>}
            </label>

            <div style={labelStyle}>
              <label style={labelStyle}>
                Main role (sets the color employees see)
                <select value={draft.role} onChange={(e) => { const r = e.target.value as TeamRole; setDraft((d) => ({ ...d, role: r, also: d.also.filter((x) => x !== r) })); }} style={inputStyle}>
                  {TEAM_ROLES.map((r) => <option key={r} value={r}>{ROLE_TEXT[r].en.label}</option>)}
                </select>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <RoleChip role={draft.role} />
                <span style={{ fontSize: 13, fontWeight: 400, color: C.textMuted, lineHeight: 1.4, flex: '1 1 200px' }}>{ROLE_TEXT[draft.role].en.what}</span>
              </div>
            </div>

            <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <legend style={{ fontSize: 14, fontWeight: 600, padding: 0, marginBottom: 6 }}>Also helps with (optional)</legend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px' }}>
                {TEAM_ROLES.filter((r) => r !== draft.role).map((r) => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36, fontSize: 15 }}>
                    <input type="checkbox" checked={draft.also.includes(r)} onChange={(e) => setDraft((d) => ({ ...d, also: TEAM_ROLES.filter((x) => x !== d.role && (x === r ? e.target.checked : d.also.includes(x))) }))} style={{ width: 20, height: 20, accentColor: C.accent }} />
                    {ROLE_TEXT[r].en.label}
                  </label>
                ))}
              </div>
              <span style={{ fontSize: 12, color: C.textDim }}>Each role shows as its own tag on the card. The card color follows the main role.</span>
            </fieldset>

            <label style={labelStyle}>
              Title (exactly as you want it shown)
              <input type="text" value={draft.title} maxLength={80} placeholder="e.g. Client Service Associate" onChange={(e) => set('title', e.target.value)} style={inputStyle} />
            </label>

            <label style={labelStyle}>
              {draft.name.trim() ? `What ${draft.name.trim().split(',')[0].trim().split(/\s+/)[0]} helps with (optional)` : 'What this person helps with (optional)'}
              <textarea rows={2} value={draft.helps} maxLength={MAX_HELPS} placeholder="e.g. Questions about loans, enrollment meetings in Spanish" onChange={(e) => set('helps', e.target.value)} style={{ ...inputStyle, minHeight: 64, padding: '10px 12px', resize: 'vertical', lineHeight: 1.4 }} />
              <span style={{ alignSelf: 'flex-end', fontSize: 12, fontWeight: 400, color: C.textDim }}>{draft.helps.length}/{MAX_HELPS}</span>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <label style={labelStyle}>
                Phone
                <input type="tel" value={draft.phone} maxLength={30} onChange={(e) => set('phone', e.target.value)} style={inputStyle} aria-invalid={!!errors.phone} />
                {errors.phone && <span role="alert" style={errStyle}>{errors.phone}</span>}
              </label>
              <label style={labelStyle}>
                Email
                <input type="email" value={draft.email} maxLength={120} onChange={(e) => set('email', e.target.value)} style={inputStyle} aria-invalid={!!errors.email} />
                {errors.email && <span role="alert" style={errStyle}>{errors.email}</span>}
              </label>
            </div>

            <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <legend style={{ fontSize: 14, fontWeight: 600, padding: 0, marginBottom: 6 }}>Languages spoken</legend>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36, fontSize: 15 }}>
                  <input type="checkbox" checked={draft.langs.en} onChange={(e) => set('langs', { ...draft.langs, en: e.target.checked })} style={{ width: 20, height: 20, accentColor: C.accent }} />
                  English
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36, fontSize: 15 }}>
                  <input type="checkbox" checked={draft.langs.es} onChange={(e) => set('langs', { ...draft.langs, es: e.target.checked })} style={{ width: 20, height: 20, accentColor: C.accent }} />
                  Español
                </label>
              </div>
              <label style={labelStyle}>
                Other languages
                <input type="text" value={draft.langs.other} maxLength={60} placeholder="e.g. Vietnamese, Tagalog" onChange={(e) => set('langs', { ...draft.langs, other: e.target.value })} style={inputStyle} />
              </label>
            </fieldset>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minHeight: 36, fontSize: 15, lineHeight: 1.4 }}>
              <input type="checkbox" checked={draft.lead} onChange={(e) => set('lead', e.target.checked)} style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0, accentColor: C.accent }} />
              Set up this plan on Plansparency (shows a tag, one person only)
            </label>

            <label style={labelStyle}>
              Book a meeting link
              <input type="url" value={draft.booking} maxLength={300} placeholder="https://calendly.com/…" onChange={(e) => set('booking', e.target.value)} style={inputStyle} aria-invalid={!!errors.booking} />
              {errors.booking && <span role="alert" style={errStyle}>{errors.booking}</span>}
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button type="submit" disabled={saving} style={{ ...btnBase, minHeight: 48, padding: '0 22px', fontSize: 15, fontWeight: 700, background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary, opacity: saving ? 0.6 : 1 }}>{editingId === 'new' ? 'Add to team' : 'Save changes'}</button>
              <button type="button" onClick={cancel} disabled={saving} style={{ ...btnBase, minHeight: 48, padding: '0 22px', fontSize: 15, fontWeight: 600, background: C.surface, color: C.text, border: `1px solid ${C.border}`, opacity: saving ? 0.6 : 1 }}>Cancel</button>
              {editingId !== 'new' && (
                <button type="button" onClick={remove} disabled={saving} style={{ marginLeft: 'auto', minHeight: 44, background: 'none', border: 'none', fontSize: 15, fontWeight: 600, color: C.danger, textDecoration: 'underline', cursor: 'pointer', fontFamily: F.body }}>Remove from team</button>
              )}
            </div>
          </form>
        </section>
      </div>
    </>,
  );
}
