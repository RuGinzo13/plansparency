'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { C, F, LAYOUT, btnBase } from "@/components/plansparency/theme";
import { AdvisorShell, BackLink } from '@/components/plansparency/advisor/AdvisorShell';
import { REVIEW_ROWS, rowValueText, getAt, setAt, type ReviewRow, type FieldSpec } from '@/lib/plan/reviewRows';
import { readPlanDocument } from '@/lib/plan/readPlanDocument';
import { normalizePlanData } from '@/lib/plan/plandata';
import { endSessionFiles } from '@/lib/client/session';

type Candidate = {
  key: string;
  label: string;
  tag: 'New' | 'Different';
  now: string;
  next: string;
  apply: (data: any) => any;
};
type Found = { fileName: string; fileId: string; candidates: Candidate[]; matches: number };

const present = (v: unknown) => v !== null && v !== undefined && (typeof v !== 'string' || v.trim() !== '') && (!Array.isArray(v) || v.length > 0);
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// Fields the new document actually states, that differ from what is saved. Fields it doesn't mention are never touched.
function compare(saved: any, raw: any, norm: any): { candidates: Candidate[]; matches: number } {
  const candidates: Candidate[] = [];
  let matches = 0;
  for (const row of REVIEW_ROWS) {
    const stated: FieldSpec[] = row.fields.filter((f) => present(getAt(raw, f.path)));
    if (stated.length === 0) continue;
    const differing = stated.filter((f) => !same(getAt(saved, f.path), getAt(norm, f.path)));
    if (differing.length === 0) { matches++; continue; }
    const apply = (data: any) => {
      let out = data;
      for (const f of differing) {
        out = setAt(out, f.path, getAt(norm, f.path));
        for (const m of f.mirror || []) out = setAt(out, [m], getAt(norm, f.path));
      }
      return out;
    };
    const wasEmpty = differing.every((f) => !present(getAt(saved, f.path)));
    candidates.push({ key: row.key, label: row.label, tag: wasEmpty ? 'New' : 'Different', now: rowValueText(row as ReviewRow, saved), next: rowValueText(row as ReviewRow, apply(saved)), apply });
  }
  const newFunds = Array.isArray(norm?.fundsData) ? norm.fundsData : [];
  const oldFunds = Array.isArray(saved?.fundsData) ? saved.fundsData : [];
  if (newFunds.length > 0 && !same(newFunds, oldFunds)) {
    candidates.push({
      key: 'funds',
      label: 'Investment options',
      tag: oldFunds.length === 0 ? 'New' : 'Different',
      now: oldFunds.length === 0 ? 'None listed' : `${oldFunds.length} fund${oldFunds.length === 1 ? '' : 's'}`,
      next: `${newFunds.length} fund${newFunds.length === 1 ? '' : 's'} found. Add them to the Investments tab.`,
      apply: (data: any) => ({ ...data, fundsData: newFunds }),
    });
  }
  return { candidates, matches };
}

const smallInput = { minHeight: 44, boxSizing: 'border-box', width: '100%', padding: '0 12px', border: `1px solid ${C.inputBorder}`, borderRadius: 10, fontSize: 16, fontFamily: F.body, background: C.field, color: C.text } as const;

export default function AddDocumentPage() {
  const params = useParams<{ plan_id: string }>();
  const planId = params?.plan_id;

  const [state, setState] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');
  const [saved, setSaved] = useState<any>(null);
  const [planName, setPlanName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [found, setFound] = useState<Found | null>(null);
  const [use, setUse] = useState<string[]>([]);
  const [by, setBy] = useState('');
  const [ack, setAck] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileIdRef = useRef<string | null>(null);
  fileIdRef.current = found?.fileId ?? null;

  useEffect(() => {
    if (!planId) return;
    fetch(`/api/plan-details/${planId}`)
      .then(async (r) => {
        if (r.status === 404 || r.status === 400) { setState('notfound'); return; }
        if (!r.ok) { setState('error'); return; }
        const d = await r.json();
        setSaved(d.planData ?? {});
        setPlanName(d.planData?.planName || d.employerName || '');
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [planId]);

  // If the tab closes while the uploaded file still exists, delete it.
  useEffect(() => {
    const onHide = () => { if (fileIdRef.current) endSessionFiles([fileIdRef.current], { beacon: true }); };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, []);

  const handleFile = async (file: File) => {
    setError(''); setDone(false); setFormError('');
    try {
      const { planData: raw, fileId } = await readPlanDocument(file, setStatus);
      setStatus('');
      const norm = normalizePlanData(raw) ?? {};
      const { candidates, matches } = compare(saved, raw, norm);
      setFound({ fileName: file.name, fileId, candidates, matches });
      setUse(candidates.map((c) => c.key));
      // Nothing to approve: the file is not needed any more.
      if (candidates.length === 0) { endSessionFiles([fileId]); setFound({ fileName: file.name, fileId: '', candidates, matches }); }
    } catch (e: any) {
      setStatus('');
      setError(e.message || 'Something went wrong. Please try again.');
    }
  };

  const deleteFile = () => { if (found?.fileId) endSessionFiles([found.fileId]); };

  const cancel = () => { deleteFile(); window.location.href = '/advisor'; };

  const save = async () => {
    if (!found) return;
    if (use.length === 0 || !by.trim() || !ack) { setFormError('Pick at least one detail, add your name and check the box.'); return; }
    setFormError(''); setSaving(true);
    let next = JSON.parse(JSON.stringify(saved ?? {}));
    for (const c of found.candidates) if (use.includes(c.key)) next = c.apply(next);
    try {
      const r = await fetch(`/api/plan-details/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planData: next, by: by.trim(), source: 'document', fileName: found.fileName }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setFormError(d?.error || 'We couldn’t save. Upload the document again to retry.'); }
      else { setSaved(d.planData); setDone(true); }
    } catch {
      setFormError('We couldn’t save. Check your connection and upload the document again.');
    } finally {
      // The file was only needed to read it: delete it whether the save worked or not.
      deleteFile();
      setFound(null); setUse([]); setAck(false); setSaving(false);
    }
  };

  if (state === 'loading') return <AdvisorShell><BackLink /><p role="status" style={{ color: C.textMuted, fontSize: 16 }}>Loading the plan…</p></AdvisorShell>;
  if (state === 'notfound') return <AdvisorShell><BackLink /><h1 style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, margin: '8px 0 0' }}>We couldn’t find that plan.</h1></AdvisorShell>;
  if (state === 'error') return <AdvisorShell><BackLink /><p role="alert" style={{ color: C.danger, fontSize: 16 }}>We couldn’t load the plan. Refresh to try again.</p></AdvisorShell>;

  const tagStyle = (tag: 'New' | 'Different') => ({
    display: 'inline-flex', alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
    background: tag === 'New' ? C.greenSoft : C.warningDim, color: tag === 'New' ? C.green : C.warning,
  }) as const;

  return (
    <AdvisorShell>
      <BackLink />
      <h1 style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, margin: '4px 0 6px' }}>Upload additional plan doc</h1>
      <p style={{ fontSize: 16, color: C.textMuted, margin: '0 0 24px' }}>{planName || 'This plan'}</p>

      {done && (
        <div role="status" style={{ maxWidth: 860, marginBottom: 20, fontSize: 15, fontWeight: 600, color: C.green }}>
          Plan updated. The document was deleted. <a href="/advisor" style={{ color: C.accentText }}>Back to your plans</a>
        </div>
      )}

      {!found && (
        <>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            disabled={!!status}
            style={{ display: 'block', width: '100%', maxWidth: 860, font: 'inherit', color: 'inherit', textAlign: 'center', padding: '40px 24px', border: `2px dashed ${dragOver ? C.accent : C.inputBorder}`, borderRadius: 16, background: dragOver ? C.accentSoft : C.surfaceAlt, cursor: status ? 'default' : 'pointer' }}
          >
            <span style={{ display: 'block', fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 6 }}>Drop a PDF here or click to upload</span>
            <span style={{ display: 'block', fontSize: 14, color: C.textMuted, marginBottom: 6 }}>An amendment, a newer SPD, an enrollment booklet or a fee disclosure. PDF, 25 MB max.</span>
            <span style={{ display: 'block', fontSize: 13, color: C.textDim }}>We read it once to find new or different details, then delete it. Nothing changes until you approve.</span>
          </button>
          <div role="status" style={{ minHeight: 24, marginTop: 12, fontSize: 15, color: C.textMuted }}>{status}</div>
          {error && <p role="alert" style={{ margin: '8px 0 0', fontSize: 14, color: C.danger }}>{error}</p>}
        </>
      )}

      {found && found.candidates.length === 0 && (
        <div style={{ maxWidth: 860 }}>
          <p style={{ fontSize: 16, color: C.textMuted, lineHeight: 1.6, margin: '0 0 12px' }}>
            Nothing new or different in <strong style={{ color: C.text }}>{found.fileName}</strong>. Your plan stays as it is.
          </p>
          <a href="/advisor" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, fontSize: 15, fontWeight: 700, color: C.accentText }}>Back to your plans</a>
        </div>
      )}

      {found && found.candidates.length > 0 && (
        <>
          <p style={{ fontSize: 16, color: C.textMuted, lineHeight: 1.6, maxWidth: 860, margin: '0 0 20px' }}>
            From <strong style={{ color: C.text }}>{found.fileName}</strong>. We found <strong style={{ color: C.text }}>{found.candidates.length} detail{found.candidates.length === 1 ? '' : 's'}</strong> that {found.candidates.length === 1 ? 'is' : 'are'} new or different. {found.matches} detail{found.matches === 1 ? '' : 's'} match{found.matches === 1 ? 'es' : ''} what you have and aren’t shown.
          </p>

          <div role="table" aria-label="New and different details" style={{ maxWidth: LAYOUT.table, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', background: C.surface }}>
            <div role="rowgroup" className="cmp-head">
              <div role="row" className="cmp-grid" style={{ padding: '12px 16px', background: C.surfaceAlt, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: C.textMuted }}>
                <div role="columnheader">Detail</div>
                <div role="columnheader">Now</div>
                <div role="columnheader">In the new document</div>
                <div role="columnheader">Use new</div>
              </div>
            </div>
            <div role="rowgroup">
              {found.candidates.map((c) => (
                <div role="row" key={c.key} className="cmp-grid" style={{ padding: '14px 16px', borderTop: `1px solid ${C.borderLight}`, fontSize: 15, lineHeight: 1.5 }}>
                  <div role="cell" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600 }}>
                    {c.label}
                    <span style={tagStyle(c.tag)}>{c.tag}</span>
                  </div>
                  <div role="cell" style={{ color: C.textMuted, overflowWrap: 'anywhere' }}><span className="cmp-lbl">Now: </span>{c.now}</div>
                  <div role="cell" style={{ color: C.text, overflowWrap: 'anywhere' }}><span className="cmp-lbl">New: </span>{c.next}</div>
                  <div role="cell">
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 36, fontSize: 14 }}>
                      <input type="checkbox" checked={use.includes(c.key)} onChange={(e) => setUse((u) => (e.target.checked ? [...u, c.key] : u.filter((k) => k !== c.key)))} style={{ width: 20, height: 20, accentColor: C.accent }} />
                      <span className="cmp-lbl">Use new</span>
                      <span className="sr-only">Use new value for {c.label}</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ maxWidth: LAYOUT.table, marginTop: 20, padding: 20, borderRadius: 16, background: C.surfaceAlt, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, flex: '1 1 220px' }}>
              Your name (required)
              <input type="text" value={by} maxLength={80} onChange={(e) => setBy(e.target.value)} style={smallInput} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, fontSize: 15, flex: '2 1 300px' }}>
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ width: 20, height: 20, flexShrink: 0, accentColor: C.accent }} />
              I checked the details I’m using against the new document.
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={save} disabled={saving} style={{ ...btnBase, minHeight: 48, padding: '0 22px', fontSize: 15, fontWeight: 700, background: `linear-gradient(135deg,${C.accent},${C.primaryEnd})`, color: C.onPrimary, opacity: saving ? 0.6 : 1 }}>Update plan ({use.length})</button>
              <button type="button" onClick={cancel} disabled={saving} style={{ ...btnBase, minHeight: 48, padding: '0 22px', fontSize: 15, fontWeight: 600, background: C.surface, color: C.text, border: `1px solid ${C.border}` }}>Cancel</button>
            </div>
            {formError && <p role="alert" style={{ flexBasis: '100%', margin: 0, fontSize: 13, color: C.danger }}>{formError}</p>}
          </div>
        </>
      )}

      {!found && formError && <p role="alert" style={{ margin: '12px 0 0', fontSize: 14, color: C.danger }}>{formError}</p>}
    </AdvisorShell>
  );
}
