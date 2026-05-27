'use client';
import { useState, useRef, useEffect } from 'react';

const C = { bg: '#0F1621', surface: '#1A2333', border: '#2A3A50', accent: '#B8860B', accentDim: 'rgba(184,134,11,.15)', text: '#F4EFE6', muted: '#8A9BB0', danger: '#B83232' };
const F = "'DM Sans','Segoe UI',sans-serif";
const btn = { border: 'none', cursor: 'pointer', fontFamily: F, fontWeight: 600, borderRadius: 10, transition: 'all .15s' } as const;

const FIRST_MSG = `I just uploaded my 401(k) plan document. Please read through it and give me a brief welcome summary — plan name, employer contribution types (distinguish safe harbor from discretionary match and profit sharing), vesting schedule, and one standout feature. Mention Roth and catch-up availability.

IMPORTANT — include at the very end of your response a hidden data block on its own line in this EXACT format:
<!--PLANDATA:{"matchTiers":[{"pct":100,"upTo":4}],"hasRoth":true,"planAllowsCatchUp":true,"noMatch":false,"recordkeeperUrl":"https://www.example.com","recordkeeperName":"Example","lastDayProvision":false,"planName":"Example 401(k) Plan","ein":"","planNumber":"","contribEligibility":{"requirement":"Age 21 and 1 year of service","entryDates":"First of month after eligibility","autoEnroll":false,"autoEnrollPct":0},"matchEligibility":{"requirement":"1 year of service","entryDates":"Same as contribution eligibility","immediateMatch":false},"vestingSchedule":"6-year graded: 20% per year","loanAvailable":true,"rothAvailable":true,"hardshipAvailable":true,"investmentOptions":"Self-directed with target-date funds","distributionInfo":{"inServiceAge":59.5,"rmdAge":73,"rolloversIn":true,"separationOptions":"Lump sum, installments, or rollover"},"safeHarbor":{"type":"none","formula":"","vestingImmediate":true},"profitSharing":{"available":false,"type":"discretionary","formula":"","lastDayApplies":false},"fundsData":[]}-->

Fill every field from the actual document. matchTiers: DISCRETIONARY match tiers only (pct, upTo). noMatch: true only if NO discretionary match exists. safeHarbor.type: none|nonelective|basic_match|enhanced_match|qaca. fundsData: fund objects with name/category/expenseRatio/factSheetUrl if a fund lineup is present, else [].`;

const parsePlanData = (t: string) => { const m = t.match(/<!--PLANDATA:(.*?)-->/s); if (!m) return null; try { return JSON.parse(m[1]); } catch { return null; } };
const stripPlanData = (t: string) => t.replace(/<!--PLANDATA:.*?-->/gs, '').trim();
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
      const pdfBase64 = await fileToBase64(file);

      // Step 1 — call /api/chat, consume full stream
      setStatus('Reading plan document…');
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: FIRST_MSG }], pdf: pdfBase64, lang: 'en', planData: null }),
      });
      if (!chatRes.ok) { const d = await chatRes.json().catch(() => ({})); throw new Error(d.error || `Chat error ${chatRes.status}`); }
      const reader = chatRes.body!.getReader();
      const decoder = new TextDecoder();
      let raw = '';
      while (true) { const { done, value } = await reader.read(); if (done) break; raw += decoder.decode(value, { stream: true }); }

      const planData = parsePlanData(raw);
      if (!planData) { setError('Could not extract plan data. Try a different copy of the document.'); setStatus(''); return; }
      const initialSummary = stripPlanData(raw);

      // Step 2 — save plan
      setStatus('Saving plan…');
      const saveRes = await fetch('/api/save-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64, planData, initialSummary }),
      });
      if (!saveRes.ok) { const d = await saveRes.json().catch(() => ({})); throw new Error(d.error || `Save error ${saveRes.status}`); }
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
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
      setStatus('');
    }
  };

  const copy = (url: string, id: string) => { navigator.clipboard.writeText(url); setCopiedId(id); setTimeout(() => setCopiedId(''), 2000); };

  // ── STATE B — plans exist ──────────────────────────────────────────────────
  if (hasToken) return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F, padding: '40px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, fontWeight: 700, margin: 0 }}>Your Plans</h1>
          <button onClick={() => setHasToken(false)} style={{ ...btn, padding: '9px 18px', fontSize: 13, background: C.accentDim, color: C.accent, border: `1px solid ${C.accent}40` }}>+ Upload Another Plan</button>
        </div>
        {plans.length === 0 && <p style={{ color: C.muted }}>No plans uploaded yet.</p>}
        {plans.map(p => {
          const url = (typeof window !== 'undefined' ? window.location.origin : '') + p.share_url;
          return (
            <div key={p.plan_id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.employer_name}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>Uploaded {new Date(p.uploaded_at).toLocaleDateString()}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <code style={{ fontSize: 12, color: C.muted, background: 'rgba(255,255,255,.05)', padding: '5px 10px', borderRadius: 6, flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</code>
                <button onClick={() => copy(url, p.plan_id)} style={{ ...btn, padding: '6px 14px', fontSize: 12, background: copiedId === p.plan_id ? C.accentDim : 'transparent', color: copiedId === p.plan_id ? C.accent : C.muted, border: `1px solid ${C.border}` }}>{copiedId === p.plan_id ? 'Copied!' : 'Copy Link'}</button>
                <a href={p.share_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.accent, textDecoration: 'none', padding: '6px 14px', border: `1px solid ${C.accent}40`, borderRadius: 10 }}>Preview →</a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── STATE A — upload form ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 32, fontWeight: 700, textAlign: 'center', margin: '0 0 10px' }}>Upload a Plan</h1>
        <p style={{ color: C.muted, textAlign: 'center', fontSize: 14, lineHeight: 1.6, margin: '0 0 32px' }}>Upload your client's plan document. We'll read it and generate a shareable link for their participants.</p>

        {status ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: 40, height: 40, border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: C.muted, fontSize: 14 }}>{status}</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? C.accent : C.border}`, borderRadius: 14, padding: '48px 32px', textAlign: 'center', cursor: 'pointer', background: dragOver ? C.accentDim : 'transparent', transition: 'all .2s', marginBottom: 16 }}
            >
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
              <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
              <p style={{ color: C.text, fontWeight: 600, margin: '0 0 4px' }}>Drop PDF here or click to upload</p>
              <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>SPD, Enrollment Booklet, or Fee Disclosure · 25 MB max</p>
            </div>
            <input value={employerName} onChange={e => setEmployerName(e.target.value)} placeholder="Plan / Employer Name (optional)" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontFamily: F, fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }} />
            {error && <p style={{ color: C.danger, fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button onClick={() => fileRef.current?.click()} style={{ ...btn, width: '100%', padding: 14, fontSize: 15, background: C.accent, color: '#0F1621' }}>Process Plan →</button>
          </>
        )}
      </div>
    </div>
  );
}
