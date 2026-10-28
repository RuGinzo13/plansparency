'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { C, F, btnBase } from '../theme';
import { Panel } from '../Panel';
import { Pill } from '../Pill';

type PlanRow = {
  planId: string;
  name: string;
  uploadedAt: string;
  lastUpdated: { at: string; by: string } | null;
  teamCount: number;
};
type SortKey = 'name' | 'uploaded' | 'updated' | 'team';
type Sort = { key: SortKey; dir: 'asc' | 'desc' };

const SORT_STORAGE = 'plansparency_plans_sort';
const DEFAULT_SORT: Sort = { key: 'updated', dir: 'desc' };

const mdy = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};
const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`;

function readSort(): Sort {
  try {
    const raw = localStorage.getItem(SORT_STORAGE);
    if (raw) {
      const s = JSON.parse(raw);
      if (['name', 'uploaded', 'updated', 'team'].includes(s?.key) && (s?.dir === 'asc' || s?.dir === 'desc')) return s;
    }
  } catch { /* storage blocked: use the default */ }
  return DEFAULT_SORT;
}

const actionLink = { minHeight: 44, display: 'inline-flex', alignItems: 'center', boxSizing: 'border-box', padding: '0 16px', background: C.surface, border: `1px solid ${C.accent}`, borderRadius: 10, fontSize: 14, fontWeight: 700, color: C.accentText, textDecoration: 'none' } as const;

export function PlansTable({ onUpload }: { onUpload: () => void }) {
  const [plans, setPlans] = useState<PlanRow[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState('');

  const load = () => {
    setError(false); setPlans(null);
    fetch('/api/plans-list')
      .then(async (r) => { if (!r.ok) throw new Error(); const d = await r.json(); setPlans(d.plans || []); })
      .catch(() => setError(true));
  };
  useEffect(() => { setSort(readSort()); load(); }, []);

  const chooseSort = (key: SortKey) => {
    const next: Sort = sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' };
    setSort(next);
    try { localStorage.setItem(SORT_STORAGE, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (plans || []).filter((p) => !q || p.name.toLowerCase().includes(q));
    const val = (p: PlanRow): string | number => {
      if (sort.key === 'name') return p.name.toLowerCase();
      if (sort.key === 'uploaded') return new Date(p.uploadedAt).getTime();
      if (sort.key === 'updated') return p.lastUpdated ? new Date(p.lastUpdated.at).getTime() : 0;
      return p.teamCount;
    };
    return list.slice().sort((a, b) => {
      const x = val(a), y = val(b);
      const c = typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number);
      return sort.dir === 'asc' ? c : -c;
    });
  }, [plans, query, sort]);

  const copy = (id: string) => {
    const url = window.location.origin + '/p/' + id;
    try { navigator.clipboard.writeText(url); } catch { /* ignore */ }
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? '' : cur)), 2000);
  };

  const th = (key: SortKey, label: string, className?: string, width?: string) => {
    const on = sort.key === key;
    return (
      <th scope="col" aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={className} style={{ textAlign: 'left', padding: '0 8px', width, background: C.surfaceAlt }}>
        <button type="button" onClick={() => chooseSort(key)} style={{ minHeight: 40, display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.body, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: on ? C.text : C.textMuted }}>
          {label}
          <span aria-hidden="true">{on ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
        </button>
      </th>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <h1 style={{ fontFamily: F.display, fontSize: 40, fontWeight: 700, margin: 0 }}>
          Your plans {plans && <span style={{ fontFamily: F.body, fontSize: 16, fontWeight: 600, color: C.textMuted }}>({plans.length})</span>}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label className="focus-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 12px', border: `1px solid ${C.inputBorder}`, borderRadius: 10, background: C.field }}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
            <span className="sr-only">Find a plan</span>
            <input
              type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a plan"
              style={{ border: 'none', outline: 'none', background: 'none', fontSize: 15, fontFamily: F.body, color: C.text, width: 180, minHeight: 40 }} // a11y-ok: wrapper shows focus
            />
          </label>
          <button type="button" onClick={onUpload} style={{ ...btnBase, minHeight: 44, padding: '0 18px', fontSize: 15, fontWeight: 700, background: C.accent, color: C.onPrimary, border: 'none', borderRadius: 12 }}>+ Upload another plan</button>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 15, color: C.danger }}>
          We couldn’t load your plans.
          <button type="button" onClick={load} style={{ ...btnBase, minHeight: 44, padding: '0 16px', fontSize: 14, background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10 }}>Try again</button>
        </div>
      )}
      {!error && plans === null && <p role="status" style={{ fontSize: 15, color: C.textMuted }}>Loading your plans…</p>}

      {plans && plans.length === 0 && <p style={{ fontSize: 15, color: C.textMuted }}>No plans uploaded yet.</p>}
      {plans && plans.length > 0 && rows.length === 0 && <p style={{ fontSize: 15, color: C.textMuted }}>No plans match “{query}”.</p>}

      {plans && rows.length > 0 && (
        <Panel strong style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <caption className="sr-only">Your plans. Use the column buttons to sort.</caption>
            <thead>
              <tr>
                {th('name', 'Plan', undefined, '44%')}
                {th('uploaded', 'Uploaded', 'pt-hide-sm')}
                {th('updated', 'Last updated')}
                {th('team', 'Team', 'pt-hide-sm')}
                <th scope="col" style={{ width: 56, background: C.surfaceAlt }}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            {rows.map((p) => {
              const isOpen = openId === p.planId;
              const toggle = () => setOpenId(isOpen ? null : p.planId);
              return (
                <tbody key={p.planId}>
                  <tr style={{ borderTop: `1px solid ${C.borderLight}`, background: isOpen ? C.highlight : C.surface }}>
                    <th scope="row" style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 700 }}>
                      <button type="button" aria-expanded={isOpen} onClick={toggle} style={{ width: '100%', minHeight: 44, textAlign: 'left', padding: 0, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.body, fontSize: 15, fontWeight: 700, color: C.text, overflowWrap: 'anywhere' }}>{p.name}</button>
                    </th>
                    <td className="pt-hide-sm" style={{ padding: '4px 8px', color: C.textMuted, whiteSpace: 'nowrap' }}>{mdy(p.uploadedAt)}</td>
                    <td style={{ padding: '4px 8px', color: C.textMuted }}>{p.lastUpdated ? `${mdy(p.lastUpdated.at)}${p.lastUpdated.by ? ` · ${p.lastUpdated.by}` : ''}` : 'Not changed'}</td>
                    <td className="pt-hide-sm" style={{ padding: '4px 8px' }}>
                      {p.teamCount > 0
                        ? <Pill kind="info" size="sm">{people(p.teamCount)}</Pill>
                        : <Pill kind="ask" size="sm">Not added</Pill>}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                      <button type="button" aria-expanded={isOpen} aria-label={`${isOpen ? 'Hide' : 'Show'} actions for ${p.name}`} onClick={toggle} style={{ width: 40, height: 40, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 20, lineHeight: 1, color: C.text, cursor: 'pointer', fontFamily: F.body }}><span aria-hidden="true">{isOpen ? '−' : '+'}</span></button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr style={{ background: C.highlight }}>
                      <td colSpan={5} style={{ padding: '4px 16px 18px' }}>
                        <div className="pt-show-sm" style={{ fontSize: 14, color: C.textMuted, marginBottom: 10 }}>
                          Uploaded {mdy(p.uploadedAt)} · Team: {p.teamCount > 0 ? people(p.teamCount) : 'Not added'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                          <code style={{ flex: '1 1 260px', minWidth: 0, padding: '10px 12px', background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 8, fontSize: 13, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{typeof window !== 'undefined' ? window.location.origin : ''}/p/{p.planId}</code>
                          <button type="button" onClick={() => copy(p.planId)} style={{ ...actionLink, cursor: 'pointer', fontFamily: F.body }}>Copy link</button>
                          <span role="status" style={{ fontSize: 14, fontWeight: 600, color: C.green, minWidth: 56 }}>{copiedId === p.planId ? 'Copied' : ''}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <a href={`/p/${p.planId}`} target="_blank" rel="noopener noreferrer" style={actionLink}>Preview →<span className="sr-only"> (opens in a new tab)</span></a>
                          <a href={`/advisor/plans/${p.planId}/team`} style={actionLink}>Edit team</a>
                          <a href={`/advisor/plans/${p.planId}/details`} style={actionLink}>Edit plan details</a>
                          <a href={`/advisor/plans/${p.planId}/add-document`} style={actionLink}>Upload additional plan doc</a>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>
        </Panel>
      )}
    </div>
  );
}
