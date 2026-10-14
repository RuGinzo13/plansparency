'use client';
import React, { useState, useRef, useEffect } from 'react';
import { endSessionFiles } from '@/lib/client/session';
import { C, F, btnBase, LAYOUT } from '@/components/plansparency/theme';
import { Logo, SkipLink } from '@/components/plansparency/ui';
import { REVIEW_ROWS, setAt } from '@/lib/plan/reviewRows';
import { ReviewField } from '@/components/plansparency/advisor/ReviewField';
import { readPlanDocument } from '@/lib/plan/readPlanDocument';
import { PlansTable } from '@/components/plansparency/advisor/PlansTable';

const fileToBase64 = (f: File): Promise<string> => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res((r.result as string).split(',')[1]); r.onerror = rej; r.readAsDataURL(f); });

type StoredPlan = { plan_id: string; share_url: string; employer_name: string; uploaded_at: string };

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
    try {
      const { planData, initialSummary, fileId } = await readPlanDocument(file, setStatus);

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
      <SkipLink lang="en" />
      <div style={{ maxWidth: LAYOUT.advisor, margin: '0 auto', padding: wide ? '28px 32px 48px' : '16px 16px 32px', boxSizing: 'border-box' }}>
        {Header}
        <main id="main" tabIndex={-1}>{children}</main>
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
          <label htmlFor="reviewer-name" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Your name</label>
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
  if (hasToken) return shell(<PlansTable onUpload={() => setHasToken(false)} />);

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
      <label htmlFor="employer-name" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Plan / employer name (optional)</label>
      <input id="employer-name" value={employerName} onChange={e => setEmployerName(e.target.value)} style={{ width: '100%', height: 48, padding: '0 12px', borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.aiBubble, color: C.text, fontFamily: F.body, fontSize: 16, marginBottom: 16, boxSizing: 'border-box' }} />
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      <button
        type="button"
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        onClick={() => fileRef.current?.click()}
        style={{ display: 'block', width: '100%', font: 'inherit', color: 'inherit', border: `2px dashed ${dragOver ? C.accent : C.inputBorder}`, borderRadius: 14, padding: '36px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? C.accentSoft : C.surfaceAlt, transition: 'all .2s', marginBottom: 12 }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.accentText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginBottom: 10 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
        <span style={{ display: 'block', color: C.text, fontWeight: 600, fontSize: 15, margin: '0 0 4px' }}>Drop PDF here or click to upload</span>
        <span style={{ display: 'block', color: C.textMuted, fontSize: 13, margin: 0 }}>SPD or plan document, PDF · 25 MB max</span>
      </button>
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
