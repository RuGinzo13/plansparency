'use client';
import React from 'react';
import { C, F, btnBase } from '../theme';
import { getAt, triLabel, type FieldSpec } from '@/lib/plan/reviewRows';
import { ageText, parseServiceAge } from '@/lib/plan/plandata';
import { UNSURE_REASONS, type UnsureKey } from '@/lib/plan/unsure';

export const controlStyle = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.aiBubble, color: C.text, fontFamily: F.body, fontSize: 16, boxSizing: 'border-box' } as const;

// The age box: shows what is typed, stores a number (or null when it is empty or not an age).
function AgeInput({ value, label, onChange }: { value: unknown; label: string; onChange: (v: number | null) => void }) {
  const [text, setText] = React.useState(typeof value === 'number' ? ageText(value) : '');
  return <input value={text} inputMode="decimal" placeholder="59½" onChange={e => { setText(e.target.value); onChange(parseServiceAge(e.target.value)); }} aria-label={label} style={controlStyle} />;
}

export function ReviewField({ field, draft, editing, onChange }: { field: FieldSpec; draft: any; editing: boolean; onChange: (path: string[], value: any, mirror?: string[]) => void }) {
  const value = getAt(draft, field.path);
  const caption = <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{field.label}</div>;
  const wrap = (children: React.ReactNode) => <div style={{ marginBottom: 10 }}>{caption}{children}</div>;
  const readStyle = { fontSize: 15, lineHeight: 1.5, color: C.text } as const;

  if (field.kind === 'text' && field.numeric === 'age') {
    return wrap(editing
      ? <AgeInput value={value} label={field.label} onChange={v => onChange(field.path, v)} />
      : <div style={readStyle}>{typeof value === 'number' ? ageText(value) : 'Not stated'}</div>);
  }
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


// Shown on a row the plan reader wasn't sure of. Stands out first: coral outline, label and the reason.
export const unsureBox = { border: `2px solid ${C.accent}`, background: C.highlight } as const;

export function UnsureNote({ rowKey, onConfirm }: { rowKey: UnsureKey; onConfirm?: () => void }) {
  return (
    <div style={{ margin: '0 0 12px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.accentText, marginBottom: 4 }}>Please check: we weren't sure</div>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: C.text }}>{UNSURE_REASONS[rowKey]}</div>
      {onConfirm && <button type="button" onClick={onConfirm} style={{ ...btnBase, minHeight: 44, padding: '0 18px', fontSize: 14, marginTop: 8, background: C.surface, color: C.accentText, border: `2px solid ${C.accent}` }}>This is right</button>}
    </div>
  );
}
