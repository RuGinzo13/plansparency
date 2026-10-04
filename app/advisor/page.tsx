'use client';
import React, { useState, useRef, useEffect } from 'react';
import { parsePlanData, stripPlanData } from '@/lib/plan/plandata';
import { endSessionFiles } from '@/lib/client/session';
import { i18n } from '@/lib/i18n';
import { C, F, btnBase } from '@/components/plansparency/theme';
import { Logo } from '@/components/plansparency/ui';

const fileToBase64 = (f: File): Promise<string> => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res((r.result as string).split(',')[1]); r.onerror = rej; r.readAsDataURL(f); });

type StoredPlan = { plan_id: string; share_url: string; employer_name: string; uploaded_at: string };

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

      // Step 3 — convert to base64 for Supabase storage, then save plan
      setStatus('Saving plan…');
      const pdfBase64 = await fileToBase64(file);
      try {
        const saveRes = await fetch('/api/save-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfBase64, planData, initialSummary, employerName: employerName.trim() }),
        });
        if (!saveRes.ok) { const d = await saveRes.json().catch(() => ({})); throw new Error(d.detail || d.error || `Save error ${saveRes.status}`); }
        const { plan_id, advisor_token, share_url } = await saveRes.json();

        // Step 3 — persist locally
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
    }
  };

  const copy = (url: string, id: string) => { navigator.clipboard.writeText(url); setCopiedId(id); setTimeout(() => setCopiedId(''), 2000); };

  const Header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: wide ? 48 : 28, flexWrap: 'wrap' }}>
      <Logo small={false} />
      <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 100, background: C.accentSoft, color: C.accentText }}>For advisors</span>
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
