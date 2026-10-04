'use client';
import React, { useState, useRef, useEffect } from 'react';
import { parsePlanData, stripPlanData } from '@/lib/plan/plandata';
import { endSessionFiles } from '@/lib/client/session';
import { i18n } from '@/lib/i18n';
import { C, F, btnBase } from '@/components/plansparency/theme';
import { Logo } from '@/components/plansparency/ui';

const fileToBase64 = (f: File): Promise<string> => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res((r.result as string).split(',')[1]); r.onerror = rej; r.readAsDataURL(f); });

type StoredPlan = { plan_id: string; share_url: string; employer_name: string; uploaded_at: string };

// ── Review step: the items an advisor must check before a plan is saved ──────
type FieldSpec = { path: string[]; kind: 'text' | 'select' | 'tri' | 'triInvert' | 'tiers'; label: string; options?: [string, string][]; mirror?: string[] };
type ReviewRow = { key: string; label: string; fields: FieldSpec[] };

const SAFE_HARBOR_OPTIONS: [string, string][] = [['none', 'None'], ['nonelective', 'Nonelective (3% of pay)'], ['basic_match', 'Basic match'], ['enhanced_match', 'Enhanced match'], ['qaca', 'QACA']];

const REVIEW_ROWS: ReviewRow[] = [
  { key: 'safeHarbor', label: 'Guaranteed employer money', fields: [
    { path: ['safeHarbor', 'type'], kind: 'select', label: 'Type', options: SAFE_HARBOR_OPTIONS },
    { path: ['safeHarbor', 'formula'], kind: 'text', label: 'How it works' },
  ] },
  { key: 'match', label: 'Extra (discretionary) match', fields: [
    { path: ['noMatch'], kind: 'triInvert', label: 'Does the plan have an extra employer match?' },
    { path: ['matchTiers'], kind: 'tiers', label: 'Match tiers' },
  ] },
  { key: 'lastDay', label: 'Must work on the last day of the year for extra employer money', fields: [
    { path: ['lastDayProvision'], kind: 'tri', label: 'Last-day rule' },
  ] },
  { key: 'profitSharing', label: 'Profit sharing', fields: [
    { path: ['profitSharing', 'available'], kind: 'tri', label: 'Offered' },
    { path: ['profitSharing', 'formula'], kind: 'text', label: 'How it works' },
  ] },
  { key: 'vesting', label: 'Vesting', fields: [
    { path: ['vestingSchedule'], kind: 'text', label: 'Vesting schedule' },
  ] },
  { key: 'join', label: 'Who can join', fields: [
    { path: ['contribEligibility', 'requirement'], kind: 'text', label: 'Requirement' },
    { path: ['contribEligibility', 'entryDates'], kind: 'text', label: 'Entry dates' },
  ] },
  { key: 'matchStarts', label: 'When employer money starts', fields: [
    { path: ['matchEligibility', 'requirement'], kind: 'text', label: 'Requirement' },
    { path: ['matchEligibility', 'entryDates'], kind: 'text', label: 'Entry dates' },
    { path: ['matchEligibility', 'immediateMatch'], kind: 'tri', label: 'Starts right away' },
  ] },
  { key: 'preTax', label: 'Before-tax (Traditional)', fields: [{ path: ['hasPreTax'], kind: 'tri', label: 'Offered' }] },
  { key: 'roth', label: 'Roth', fields: [{ path: ['hasRoth'], kind: 'tri', label: 'Offered', mirror: ['rothAvailable'] }] },
  { key: 'catchUp', label: 'Catch-up allowed', fields: [{ path: ['planAllowsCatchUp'], kind: 'tri', label: 'Allowed' }] },
  { key: 'loans', label: 'Loans', fields: [{ path: ['loanAvailable'], kind: 'tri', label: 'Offered' }] },
  { key: 'hardship', label: 'Hardship withdrawals', fields: [{ path: ['hardshipAvailable'], kind: 'tri', label: 'Offered' }] },
];

const getAt = (o: any, path: string[]) => path.reduce((a, k) => (a == null ? undefined : a[k]), o);
const setAt = (o: any, path: string[], value: any) => {
  const copy = JSON.parse(JSON.stringify(o));
  let cur = copy;
  for (let i = 0; i < path.length - 1; i++) { if (cur[path[i]] == null || typeof cur[path[i]] !== 'object') cur[path[i]] = {}; cur = cur[path[i]]; }
  cur[path[path.length - 1]] = value;
  return copy;
};

const triLabel = (v: any) => (v === true ? 'Yes' : v === false ? 'No' : 'Not stated');
const controlStyle = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.aiBubble, color: C.text, fontFamily: F.body, fontSize: 16, boxSizing: 'border-box' } as const;

function ReviewField({ field, draft, editing, onChange }: { field: FieldSpec; draft: any; editing: boolean; onChange: (path: string[], value: any, mirror?: string[]) => void }) {
  const value = getAt(draft, field.path);
  const caption = <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{field.label}</div>;
  const wrap = (children: React.ReactNode) => <div style={{ marginBottom: 10 }}>{caption}{children}</div>;
  const readStyle = { fontSize: 15, lineHeight: 1.5, color: C.text } as const;

  if (field.kind === 'text') {
    return wrap(editing
      ? <input value={typeof value === 'string' ? value : ''} onChange={e => onChange(field.path, e.target.value)} aria-label={field.label} style={controlStyle} />
      : <div style={readStyle}>{typeof value === 'string' && value ? value : 'Not stated'}</div>);
  }
  if (field.kind === 'select') {
    const opts = field.options || [];
    return wrap(editing
      ? <select value={typeof value === 'string' ? value : 'none'} onChange={e => onChange(field.path, e.target.value)} aria-label={field.label} style={controlStyle}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      : <div style={readStyle}>{opts.find(([v]) => v === value)?.[1] ?? 'Not stated'}</div>);
  }
  if (field.kind === 'tri' || field.kind === 'triInvert') {
    // triInvert: the data field says "no match" but the question is asked as "has a match".
    const invert = field.kind === 'triInvert';
    const shown = value === true || value === false ? (invert ? !value : value) : null;
    const set = (v: boolean | null) => onChange(field.path, v === null ? null : invert ? !v : v, field.mirror);
    return wrap(editing
      ? (
        <div role="group" aria-label={field.label} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {([[true, 'Yes'], [false, 'No'], [null, 'Not stated']] as [boolean | null, string][]).map(([v, l]) => (
            <button key={l} aria-pressed={shown === v} onClick={() => set(v)} style={{ ...btnBase, minHeight: 44, padding: '0 16px', fontSize: 14, borderRadius: 8, background: shown === v ? C.accentSoft : C.aiBubble, border: shown === v ? `2px solid ${C.accent}` : `1px solid ${C.inputBorder}`, color: shown === v ? C.accentText : C.text }}>{l}</button>
          ))}
        </div>
      )
      : <div style={readStyle}>{triLabel(shown)}</div>);
  }
  // tiers
  const tiers: { pct: number; upTo: number }[] = Array.isArray(value) ? value : [];
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v)) || 0);
  return wrap(editing
    ? (
      <div>
        {tiers.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <input type="number" min={0} value={t.pct} aria-label={`Tier ${i + 1} match percent`} onChange={e => onChange(field.path, tiers.map((x, j) => (j === i ? { ...x, pct: num(e.target.value) } : x)))} style={{ ...controlStyle, width: 90 }} />
            <span style={{ fontSize: 14 }}>% match on the first</span>
            <input type="number" min={0} value={t.upTo} aria-label={`Tier ${i + 1} percent of pay`} onChange={e => onChange(field.path, tiers.map((x, j) => (j === i ? { ...x, upTo: num(e.target.value) } : x)))} style={{ ...controlStyle, width: 90 }} />
            <span style={{ fontSize: 14 }}>% of pay</span>
            <button onClick={() => onChange(field.path, tiers.filter((_, j) => j !== i))} aria-label={`Remove tier ${i + 1}`} style={{ ...btnBase, minHeight: 44, minWidth: 44, background: 'transparent', color: C.danger, border: `1px solid ${C.border}`, borderRadius: 8 }}>×</button>
          </div>
        ))}
        <button onClick={() => onChange(field.path, [...tiers, { pct: 0, upTo: 0 }])} style={{ ...btnBase, minHeight: 44, padding: '0 16px', fontSize: 14, background: 'transparent', color: C.text, border: `1px dashed ${C.inputBorder}`, borderRadius: 8 }}>+ Add a tier</button>
      </div>
    )
    : <div style={readStyle}>{tiers.length ? tiers.map((t, i) => <div key={i}>{t.pct}% match on the first {t.upTo}% of pay</div>) : 'None listed'}</div>);
}

function AccuracyDialog({ onClose }: { onClose: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { btnRef.current?.focus(); }, []);
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: C.text, opacity: 0.6, zIndex: 999 }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div
          role="dialog" aria-modal="true" aria-labelledby="accuracy-title"
          onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); btnRef.current?.focus(); } }}
          style={{ background: C.surface, borderRadius: 20, maxWidth: 480, width: '100%', padding: '28px 24px', boxSizing: 'border-box' }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.warningDim, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </div>
          <h2 id="accuracy-title" style={{ fontFamily: F.display, fontSize: 26, fontWeight: 600, margin: '0 0 10px' }}>Check every detail before you share</h2>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: C.textMuted, margin: '0 0 12px' }}>We read plan documents with AI, and it can get things wrong. Employees will see exactly what you approve, under your name.</p>
          <ul style={{ fontSize: 15, lineHeight: 1.55, color: C.text, margin: '0 0 20px', paddingLeft: 20 }}>
            <li>Compare each item to the plan document.</li>
            <li>Fix anything that's wrong or missing.</li>
            <li>The plan can't be saved or shared until every item is checked.</li>
          </ul>
          <button ref={btnRef} onClick={onClose} style={{ ...btnBase, width: '100%', height: 52, fontSize: 16, background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary }}>I'll review every item</button>
        </div>
      </div>
    </>
  );
}

export default function AdvisorPage() {
  const [plans, setPlans] = useState<StoredPlan[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [review, setReview] = useState<{ file: File; fileId: string; initialSummary: string } | null>(null);
  const [draft, setDraft] = useState<any>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [edited, setEdited] = useState<string[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [reviewerName, setReviewerName] = useState('');
  const [attest, setAttest] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const reviewFileIdRef = useRef<string | null>(null);
  reviewFileIdRef.current = review ? review.fileId : null;

  // If the tab closes mid-review, still delete the uploaded file.
  useEffect(() => {
    const onHide = () => { if (reviewFileIdRef.current) endSessionFiles([reviewFileIdRef.current], { beacon: true }); };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, []);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(entries => { for (const entry of entries) setWide(entry.contentRect.width >= 900); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('plansparency_advisor_token');
    const stored = localStorage.getItem('plansparency_plans');
    if (token) { setHasToken(true); setPlans(stored ? JSON.parse(stored) : []); }
  }, []);

  const handleFile = async (file: File) => {
    setError('');
    if (!file.type.includes('pdf')) { setError('Please upload a PDF file.'); return; }
    if (file.size > 25 * 1024 * 1024) { setError('File must be under 25 MB.'); return; }
    try {
      // Step 1 — upload PDF to Anthropic Files API via Node.js /api/ingest
      // (avoids sending large base64 through the 4 MB edge function body limit)
      setStatus('Uploading plan document…');
      const fd = new FormData();
      fd.append('file', file);
      const ingestRes = await fetch('/api/ingest', { method: 'POST', body: fd });
      if (!ingestRes.ok) { const d = await ingestRes.json().catch(() => ({})); throw new Error(d.error || `Upload error ${ingestRes.status}`); }
      const { fileId } = await ingestRes.json();

      // Step 2 — call /api/chat with fileId only (no PDF bytes in body)
      setStatus('Reading plan document…');
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: i18n.en.firstMessage }], fileIds: [fileId], lang: 'en', planData: null }),
      });
      if (!chatRes.ok) { const d = await chatRes.json().catch(() => ({})); throw new Error(d.error || `Chat error ${chatRes.status}`); }
      const reader = chatRes.body?.getReader();
      if (!reader) throw new Error('No response stream from chat API');
      const decoder = new TextDecoder();
      let raw = '';
      while (true) { const { done, value } = await reader.read(); if (done) break; raw += decoder.decode(value, { stream: true }); }

      const planData = parsePlanData(raw);
      if (!planData) { setError('Could not extract plan data. Try a different copy of the document.'); setStatus(''); return; }
      const initialSummary = stripPlanData(raw);

      // Stop here: the advisor must review every item before anything is saved.
      setStatus('');
      setDraft(JSON.parse(JSON.stringify(planData)));
      setReview({ file, fileId, initialSummary });
      setChecked([]);
      setEdited([]);
      setEditingKey(null);
      setReviewerName('');
      setAttest(false);
      setShowWarning(true);
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
      setStatus('');
    }
  };

  // Approve: save the EDITED plan data exactly as before, plus who checked it and when.
  const approveAndSave = async () => {
    if (!review || !draft) return;
    const { file, fileId, initialSummary } = review;
    const planData = {
      ...draft,
      review: {
        reviewerName: reviewerName.trim(),
        reviewedAt: new Date().toISOString(),
        editedFields: REVIEW_ROWS.filter(r => edited.includes(r.key)).map(r => r.label),
      },
    };
    setError('');
    setStatus('Saving plan…');
    try {
      // Convert to base64 for Supabase storage, then save plan
      const pdfBase64 = await fileToBase64(file);
      try {
        const saveRes = await fetch('/api/save-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfBase64, planData, initialSummary, employerName: employerName.trim() }),
        });
        if (!saveRes.ok) { const d = await saveRes.json().catch(() => ({})); throw new Error(d.detail || d.error || `Save error ${saveRes.status}`); }
        const { plan_id, advisor_token, share_url } = await saveRes.json();

        // Persist locally
        localStorage.setItem('plansparency_advisor_token', advisor_token);
        const newPlan: StoredPlan = { plan_id, share_url, employer_name: employerName || planData.planName || planData.employerName || 'Unnamed Plan', uploaded_at: new Date().toISOString() };
        const updated = [...plans, newPlan];
        localStorage.setItem('plansparency_plans', JSON.stringify(updated));
        setPlans(updated);
        setHasToken(true);
        setStatus('');
        setEmployerName('');
      } finally {
        // The file is only needed to build the plan summary — delete it now
        // whether the save succeeded or failed.
        endSessionFiles([fileId]);
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
      setStatus('');
    } finally {
      setReview(null);
      setDraft(null);
    }
  };

  // Cancel: throw away the extraction and delete the uploaded file.
  const cancelReview = () => {
    if (review) endSessionFiles([review.fileId]);
    setReview(null);
    setDraft(null);
    setShowWarning(false);
  };

  const copy = (url: string, id: string) => { navigator.clipboard.writeText(url); setCopiedId(id); setTimeout(() => setCopiedId(''), 2000); };

  const Header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: wide ? 48 : 28, flexWrap: 'wrap' }}>
      <Logo small={false} />
      <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 100, background: C.accentSoft, color: C.accentText }}>For advisors</span>
      <a href="/advisor/preview" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', fontSize: 15, fontWeight: 700, color: C.accentText }}>Preview the participant screens with any document →</a>
    </div>
  );
  const shell = (children: React.ReactNode) => (
    <div ref={rootRef} style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.body }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: wide ? '28px 32px 48px' : '16px 16px 32px', boxSizing: 'border-box' }}>
        {Header}
        {children}
      </div>
    </div>
  );
  const display = F.display;

  // ── Review screen — nothing is saved until every item is checked ───────────
  if (review && draft && !status) {
    const allChecked = checked.length === REVIEW_ROWS.length;
    const canApprove = allChecked && reviewerName.trim().length > 0 && attest;
    const update = (path: string[], value: any, rowKey: string, mirror?: string[]) => {
      let next = setAt(draft, path, value);
      if (mirror) for (const m of mirror) next = setAt(next, [m], value);
      setDraft(next);
      setChecked(c => c.filter(k => k !== rowKey));
      setEdited(e => (e.includes(rowKey) ? e : [...e, rowKey]));
    };
    const beginEdit = (key: string) => { setEditingKey(key); setChecked(c => c.filter(k => k !== key)); };
    const markChecked = (key: string) => { setEditingKey(null); setChecked(c => (c.includes(key) ? c : [...c, key])); };
    return shell(
      <div style={{ maxWidth: 760 }}>
        {showWarning && <AccuracyDialog onClose={() => setShowWarning(false)} />}
        <h1 style={{ fontFamily: F.display, fontSize: wide ? 40 : 30, fontWeight: 600, margin: '0 0 12px' }}>{draft.planName || employerName || 'Plan review'}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, padding: '5px 12px', borderRadius: 100, background: allChecked ? C.greenSoft : C.accentSoft, color: allChecked ? C.green : C.accentText }}>{checked.length} of {REVIEW_ROWS.length} checked</span>
        </div>
        <div style={{ background: C.warningDim, color: C.text, borderRadius: 12, padding: '12px 16px', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
          We read plan documents with AI, and it can get things wrong. Employees will see exactly what you approve, under your name.
        </div>
        {REVIEW_ROWS.map(row => {
          const isChecked = checked.includes(row.key);
          const isEditing = editingKey === row.key;
          return (
            <div key={row.key} style={{ background: isChecked ? C.greenSoft : C.surface, border: `1px solid ${isChecked ? C.green : C.border}`, borderRadius: 14, padding: 18, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{row.label}</div>
              {row.fields.map(f => (
                <ReviewField key={f.path.join('.') + f.kind} field={f} draft={draft} editing={isEditing} onChange={(path, v, mirror) => update(path, v, row.key, mirror)} />
              ))}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {!isEditing && (
                  <button onClick={() => beginEdit(row.key)} style={{ ...btnBase, minHeight: 44, padding: '0 18px', fontSize: 14, background: 'transparent', color: C.text, border: `1px solid ${C.inputBorder}` }}>Edit</button>
                )}
                <button
                  onClick={() => markChecked(row.key)}
                  aria-pressed={isChecked}
                  style={{ ...btnBase, minHeight: 44, padding: '0 18px', fontSize: 14, background: isChecked ? C.green : C.accentSoft, color: isChecked ? C.surface : C.accentText, border: `1px solid ${isChecked ? C.green : C.accent}` }}
                >{isChecked ? '✓ Checked' : isEditing ? 'Done, mark checked' : 'Mark checked'}</button>
              </div>
            </div>
          );
        })}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginTop: 20 }}>
          <label htmlFor="reviewer-name" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Your name</label>
          <input id="reviewer-name" value={reviewerName} onChange={e => setReviewerName(e.target.value)} required style={{ width: '100%', height: 48, padding: '0 12px', borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.aiBubble, color: C.text, fontFamily: F.body, fontSize: 16, boxSizing: 'border-box', marginBottom: 12 }} />
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 44, fontSize: 14, lineHeight: 1.5, cursor: 'pointer' }}>
            <input type="checkbox" checked={attest} onChange={e => setAttest(e.target.checked)} style={{ width: 18, height: 18, marginTop: 3, flexShrink: 0 }} />
            I checked every item against the plan document and they're accurate. My name and today's date will be recorded.
          </label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
            <button onClick={cancelReview} style={{ ...btnBase, minHeight: 52, padding: '0 24px', fontSize: 15, background: 'transparent', color: C.textMuted, border: `1px solid ${C.border}` }}>Cancel</button>
            <button
              onClick={approveAndSave}
              disabled={!canApprove}
              style={{ ...btnBase, flex: 1, minWidth: 200, height: 52, fontSize: 16, cursor: canApprove ? 'pointer' : 'not-allowed', background: canApprove ? `linear-gradient(135deg,${C.accent},${C.primaryEnd})` : C.surfaceAlt, color: canApprove ? C.onPrimary : C.textDim }}
            >Approve and save</button>
          </div>
        </div>
      </div>
    );
  }

  // ── STATE B — plans exist ──────────────────────────────────────────────────
  if (hasToken) return shell(
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <h1 style={{ fontFamily: display, fontSize: 32, fontWeight: 700, margin: 0 }}>Your Plans</h1>
        <button onClick={() => setHasToken(false)} style={{ ...btnBase, minHeight: 44, padding: '0 18px', fontSize: 14, background: C.accentSoft, color: C.accentText, border: `1px solid ${C.accent}` }}>+ Upload Another Plan</button>
      </div>
      {plans.length === 0 && <p style={{ color: C.textMuted }}>No plans uploaded yet.</p>}
      {plans.map(p => {
        const url = (typeof window !== 'undefined' ? window.location.origin : '') + p.share_url;
        return (
          <div key={p.plan_id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, marginBottom: 16 }}>
            <div style={{ fontFamily: display, fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{p.employer_name}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>Uploaded {new Date(p.uploaded_at).toLocaleDateString()}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <code style={{ fontSize: 12, color: C.textMuted, background: C.surfaceAlt, padding: '8px 10px', borderRadius: 6, flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</code>
              <button onClick={() => copy(url, p.plan_id)} style={{ ...btnBase, minHeight: 44, padding: '0 16px', fontSize: 13, borderRadius: 10, background: copiedId === p.plan_id ? C.greenSoft : 'transparent', color: copiedId === p.plan_id ? C.green : C.textMuted, border: `1px solid ${C.border}` }}>{copiedId === p.plan_id ? 'Copied!' : 'Copy Link'}</button>
              <a href={p.share_url} target="_blank" rel="noreferrer" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', boxSizing: 'border-box', fontSize: 13, fontWeight: 600, color: C.accentText, textDecoration: 'none', padding: '0 16px', border: `1px solid ${C.accent}`, borderRadius: 10 }}>Preview →</a>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── STATE A — upload form ──────────────────────────────────────────────────
  const steps = ['Upload', 'You review every detail', 'Share one link'];
  const Intro = (
    <div>
      <h1 style={{ fontFamily: display, fontSize: wide ? 64 : 40, fontWeight: 600, lineHeight: 1.06, margin: '0 0 16px', letterSpacing: '-.02em' }}>
        Set up a plan once.<br />
        <span style={{ fontStyle: 'italic', color: C.accentText }}>Every employee gets it clear.</span>
      </h1>
      <p style={{ fontSize: wide ? 18 : 16, color: C.textMuted, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 520 }}>Upload the plan document. We pull out the match, vesting, eligibility and limits. You check every detail, then share one link with the employees.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${C.accent}`, color: C.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
  const Form = status ? (
    <div style={{ textAlign: 'center', padding: 40, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16 }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: C.textMuted, fontSize: 15, margin: 0 }}>{status}</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  ) : (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
      <label htmlFor="employer-name" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Plan / employer name (optional)</label>
      <input id="employer-name" value={employerName} onChange={e => setEmployerName(e.target.value)} style={{ width: '100%', height: 48, padding: '0 12px', borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.aiBubble, color: C.text, fontFamily: F.body, fontSize: 16, marginBottom: 16, boxSizing: 'border-box' }} />
      <div
        role="button" tabIndex={0}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        onClick={() => fileRef.current?.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
        style={{ border: `2px dashed ${dragOver ? C.accent : C.inputBorder}`, borderRadius: 14, padding: '36px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? C.accentSoft : C.surfaceAlt, transition: 'all .2s', marginBottom: 12 }}
      >
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.accentText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginBottom: 10 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
        <p style={{ color: C.text, fontWeight: 600, fontSize: 15, margin: '0 0 4px' }}>Drop PDF here or click to upload</p>
        <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>SPD or plan document, PDF · 25 MB max</p>
      </div>
      {error && <p role="alert" style={{ color: C.danger, fontSize: 14, margin: '0 0 12px' }}>{error}</p>}
      <button onClick={() => fileRef.current?.click()} style={{ ...btnBase, width: '100%', height: 52, fontSize: 16, background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary }}>Process Plan →</button>
    </div>
  );
  return shell(
    wide
      ? <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 56, alignItems: 'start' }}>{Intro}{Form}</div>
      : <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>{Intro}{Form}</div>
  );
}
