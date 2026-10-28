'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { C, F, btnBase } from '@/components/plansparency/theme';
import { AdvisorShell, BackLink, fmtDate } from '@/components/plansparency/advisor/AdvisorShell';
import { Pill } from '@/components/plansparency/Pill';
import { ReviewField, UnsureNote, unsureBox } from '@/components/plansparency/advisor/ReviewField';
import { unsureKeys, UNSURE_KEYS, type UnsureKey } from '@/lib/plan/unsure';
import { REVIEW_ROWS, rowValueText, diffRows, setAt } from '@/lib/plan/reviewRows';

type HistoryEntry = { at: string; by: string; source?: string; fileName?: string; note?: string; fields?: string[] };

const smallInput = { minHeight: 44, boxSizing: 'border-box', width: '100%', padding: '0 12px', border: `1px solid ${C.inputBorder}`, borderRadius: 10, fontSize: 16, fontFamily: F.body, background: C.field, color: C.text } as const;
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, color: C.text } as const;

export default function EditDetailsPage() {
  const params = useParams<{ plan_id: string }>();
  const planId = params?.plan_id;

  const [state, setState] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');
  const [saved, setSaved] = useState<any>(null);       // plan details as stored
  const [draft, setDraft] = useState<any>(null);       // plan details being edited
  const [employerSaved, setEmployerSaved] = useState('');
  const [employer, setEmployer] = useState('');
  const [open, setOpen] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [by, setBy] = useState('');
  const [ack, setAck] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(false);
  const [confirmedNow, setConfirmedNow] = useState<string[]>([]); // rows the advisor marked "This is right" in this edit

  const load = () => {
    fetch(`/api/plan-details/${planId}`)
      .then(async (r) => {
        if (r.status === 404 || r.status === 400) { setState('notfound'); return; }
        if (!r.ok) { setState('error'); return; }
        const d = await r.json();
        setSaved(d.planData); setDraft(JSON.parse(JSON.stringify(d.planData ?? {})));
        setEmployerSaved(d.employerName || ''); setEmployer(d.employerName || '');
        setState('ready');
      })
      .catch(() => setState('error'));
  };
  useEffect(() => { if (planId) load(); }, [planId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === 'loading') return <AdvisorShell><BackLink /><p role="status" style={{ color: C.textMuted, fontSize: 16 }}>Loading the plan…</p></AdvisorShell>;
  if (state === 'notfound') return <AdvisorShell><BackLink /><h1 style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, margin: '8px 0 0' }}>We couldn’t find that plan.</h1></AdvisorShell>;
  if (state === 'error') return <AdvisorShell><BackLink /><p role="alert" style={{ color: C.danger, fontSize: 16 }}>We couldn’t load the plan. Refresh to try again.</p></AdvisorShell>;

  const changedKeys = diffRows(saved, draft);
  const employerChanged = employer.trim() !== employerSaved.trim();
  const review = saved?.review || {};
  const storedConfirmed: string[] = Array.isArray(review.confirmed) ? review.confirmed : [];
  // A row you changed counts as checked. Rows still in doubt stand out first.
  const confirmedAll = [...storedConfirmed.filter((k) => !changedKeys.includes(k)), ...confirmedNow, ...changedKeys.filter((k) => (UNSURE_KEYS as string[]).includes(k))];
  const unsure = unsureKeys({ ...draft, review: { confirmed: confirmedAll } });
  const newlyConfirmed = confirmedNow.filter((k) => !storedConfirmed.includes(k) && !changedKeys.includes(k));
  const changeCount = changedKeys.length + newlyConfirmed.length + (employerChanged ? 1 : 0);
  const rows = [...REVIEW_ROWS].sort((a, b) => Number(unsure.has(b.key as UnsureKey)) - Number(unsure.has(a.key as UnsureKey)));
  const history: HistoryEntry[] = Array.isArray(review.history) ? review.history.slice().reverse() : [];
  const original = review.original || (!Array.isArray(review.history) || review.history.length === 0 ? (review.reviewedAt ? { at: review.reviewedAt, by: review.reviewerName || '' } : null) : null);
  const planName = (saved?.planName as string) || employerSaved || 'this plan';

  const onField = (path: string[], value: any, mirror?: string[]) => {
    setDone(false);
    setDraft((d: any) => {
      let next = setAt(d, path, value);
      if (mirror) for (const m of mirror) next = setAt(next, [m], value);
      return next;
    });
  };
  const toggleOpen = (key: string) => setOpen((o) => (o.includes(key) ? o.filter((k) => k !== key) : [...o, key]));

  const save = async () => {
    setDone(false);
    if (changeCount === 0 || !by.trim() || !ack) { setFormError('Change at least one detail, add your name and check the box.'); return; }
    setFormError(''); setSaving(true);
    try {
      const r = await fetch(`/api/plan-details/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planData: draft, employerName: employer.trim(), by: by.trim(), note: note.trim(), source: 'edit', confirmed: confirmedAll.filter((k) => (UNSURE_KEYS as string[]).includes(k)) }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setFormError(d?.error || 'We couldn’t save. Try again.'); return; }
      setSaved(d.planData); setDraft(JSON.parse(JSON.stringify(d.planData)));
      setEmployerSaved(employer.trim()); setOpen([]); setNote(''); setAck(false); setDone(true); setConfirmedNow([]);
    } catch {
      setFormError('We couldn’t save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const historyText = (h: HistoryEntry) => {
    const what = (h.fields || []).join(', ');
    const head = h.source === 'document'
      ? `${h.by} added ${h.fileName || 'a document'}${what ? ` and updated ${what}` : ''}.`
      : `${h.by} changed ${what || 'details'}.`;
    return `${fmtDate(h.at)} · ${head}${h.note ? ` Note: ${h.note}` : ''}`;
  };

  const rowBox = (changed: boolean) => ({ padding: '14px 16px', borderRadius: 16, background: C.surface, border: changed ? `2px solid ${C.accent}` : 'none', boxShadow: `0 1px 3px ${C.cardShadow}` }) as const;
  const editBtn = { minHeight: 40, padding: '0 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontWeight: 700, color: C.accentText, cursor: 'pointer', fontFamily: F.body, flexShrink: 0 } as const;
  const changedChip = <Pill kind="ask" size="sm">Changed</Pill>;

  return (
    <AdvisorShell>
      <BackLink />
      <h1 style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, margin: '4px 0 6px' }}>Edit plan details</h1>
      <p style={{ fontSize: 16, color: C.textMuted, margin: '0 0 20px' }}>{planName}</p>

      <div role="note" style={{ maxWidth: 860, padding: '14px 16px', borderRadius: 12, background: C.warningDim, color: C.warning, fontSize: 15, lineHeight: 1.55, margin: '0 0 28px' }}>
        <strong>Employees see changes right away.</strong> Written answers update. AI answers still read the original plan document, so if the change comes from an amendment, also use “Upload additional plan doc”.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>
        <ul style={{ flex: '999 1 560px', minWidth: 0, listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((row) => {
            const isUnsure = unsure.has(row.key as UnsureKey);
            const changed = changedKeys.includes(row.key);
            const isOpen = open.includes(row.key);
            return (
              <li key={row.key} style={{ ...rowBox(changed), ...(isUnsure ? unsureBox : {}) }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: C.textMuted, marginBottom: 6 }}>
                      {row.label}{changed && changedChip}
                    </div>
                    {isUnsure && <UnsureNote rowKey={row.key as UnsureKey} onConfirm={() => { setDone(false); setConfirmedNow((c) => (c.includes(row.key) ? c : [...c, row.key])); }} />}
                    {isOpen ? (
                      row.fields.map((f) => <ReviewField key={f.path.join('.')} field={f} draft={draft} editing onChange={onField} />)
                    ) : (
                      <div style={{ fontSize: 16, lineHeight: 1.5, color: C.text, overflowWrap: 'anywhere' }}>{rowValueText(row, draft)}</div>
                    )}
                  </div>
                  <button type="button" aria-expanded={isOpen} aria-label={`${isOpen ? 'Done editing' : 'Edit'} ${row.label}`} onClick={() => toggleOpen(row.key)} style={editBtn}>{isOpen ? 'Done' : 'Edit'}</button>
                </div>
              </li>
            );
          })}
          <li style={rowBox(employerChanged)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: C.textMuted, marginBottom: 6 }}>
                  Employer name{employerChanged && changedChip}
                </div>
                {open.includes('employer') ? (
                  <input type="text" aria-label="Employer name" value={employer} maxLength={120} onChange={(e) => { setDone(false); setEmployer(e.target.value); }} style={smallInput} />
                ) : (
                  <div style={{ fontSize: 16, lineHeight: 1.5, color: C.text, overflowWrap: 'anywhere' }}>{employer || 'Not stated'}</div>
                )}
              </div>
              <button type="button" aria-expanded={open.includes('employer')} aria-label={`${open.includes('employer') ? 'Done editing' : 'Edit'} Employer name`} onClick={() => toggleOpen('employer')} style={editBtn}>{open.includes('employer') ? 'Done' : 'Edit'}</button>
            </div>
          </li>
        </ul>

        <section aria-labelledby="save-title" style={{ flex: '1 1 320px', maxWidth: 420, boxSizing: 'border-box', padding: 22, borderRadius: 16, border: `2px solid ${C.bar}`, boxShadow: `0 4px 14px ${C.cardShadow}`, background: C.surface, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 id="save-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Save {changeCount} change{changeCount === 1 ? '' : 's'}</h2>
          <label style={labelStyle}>
            What changed and why (optional)
            <input type="text" value={note} maxLength={200} placeholder="e.g. Amendment effective Jan 1, 2027" onChange={(e) => setNote(e.target.value)} style={smallInput} />
          </label>
          <label style={labelStyle}>
            Your name (required)
            <input type="text" value={by} maxLength={80} onChange={(e) => setBy(e.target.value)} style={smallInput} />
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minHeight: 36, fontSize: 15, lineHeight: 1.4 }}>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0, accentColor: C.accent }} />
            I checked these changes against the current plan document.
          </label>
          {formError && <p role="alert" style={{ margin: 0, fontSize: 13, color: C.danger }}>{formError}</p>}
          <div role="status" style={{ fontSize: 14, fontWeight: 600, color: C.green }}>{done ? 'Saved. Employees see the new details now.' : ''}</div>
          <button type="button" onClick={save} disabled={saving} style={{ ...btnBase, minHeight: 48, padding: '0 22px', fontSize: 15, fontWeight: 700, background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary, opacity: saving ? 0.6 : 1 }}>Save changes</button>
        </section>
      </div>

      <section aria-labelledby="history-title" style={{ marginTop: 36, paddingTop: 20, borderTop: `1px solid ${C.border}`, maxWidth: 860 }}>
        <h3 id="history-title" style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px' }}>Change history</h3>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, lineHeight: 1.5, color: C.textMuted }}>
          {history.map((h, i) => <li key={i}>{historyText(h)}</li>)}
          {original && <li>{fmtDate(original.at)} · {original.by || 'The advisor'} reviewed all details (original document).</li>}
          {history.length === 0 && !original && <li>No changes recorded yet.</li>}
        </ul>
      </section>
    </AdvisorShell>
  );
}
