'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { C, F } from './theme';
import { getKeyTerms, KEY_TERM_SECTION_NAMES, KEY_TERM_SUB_NAMES, type KeyTermSection, type KeyTerm } from '@/lib/glossary';

const SECTIONS: KeyTermSection[] = ['start', 'employer', 'access', 'invest'];
const label12 = { fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' } as const;
const textLink = { background: 'none', border: 'none', padding: 0, minHeight: 44, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' } as const;
const VESTING_EXAMPLE = [0, 0, 20, 40, 60, 80, 100];

interface Props {
  t: any;
  lang: 'en' | 'es';
  openStock: (id: any) => void;
  onOpenCalculator: () => void;
}

// General 401(k) key terms: what the words mean for any plan, dictionary style.
export function KeyTermsPanel({ t, lang, openStock, onOpenCalculator }: Props) {
  const es = lang === 'es';
  const L = (en: string, esText: string) => (es ? esText : en);
  const all = useMemo(() => getKeyTerms(lang), [lang]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);
  const [selId, setSelId] = useState<string>(all[0].id);
  const [query, setQuery] = useState('');
  const [showEntry, setShowEntry] = useState(false); // phone only: list or entry

  useEffect(() => {
    const el = layoutRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => { for (const e of entries) setWide(e.contentRect.width >= 900); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [selId]);

  const sel: KeyTerm = all.find((x) => x.id === selId) || all[0];
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const matches = searching ? all.filter((x) => `${x.term} ${x.short} ${x.def}`.toLowerCase().includes(q)) : [];
  const listTerms = searching ? matches : all.filter((x) => x.section === sel.section);
  const idx = all.findIndex((x) => x.id === sel.id);
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];
  const sectionName = (s: KeyTermSection) => KEY_TERM_SECTION_NAMES[s][lang];

  const select = (id: string) => { setSelId(id); setShowEntry(true); };
  const pickTab = (s: KeyTermSection) => {
    setQuery('');
    setSelId(all.find((x) => x.section === s)!.id);
    setShowEntry(false);
  };
  const go = (id: string) => { setQuery(''); select(id); };

  const showList = wide || !showEntry;
  const showArticle = wide || showEntry;

  const List = (
    <nav aria-label={t.keyTermsTitle} style={{ flex: '1 1 260px', maxWidth: wide ? 300 : undefined, minWidth: 0 }}>
      {searching && (
        <div style={{ fontSize: 13, color: C.textMuted, padding: '0 10px 8px' }}>
          {matches.length > 0 ? L(`${matches.length} terms match`, `${matches.length} términos coinciden`) : L('No terms match. Try a shorter word.', 'Ningún término coincide. Prueba con una palabra más corta.')}
        </div>
      )}
      {listTerms.map((x, i) => {
        const on = x.id === sel.id;
        const showSub = !searching && x.sub && (i === 0 || listTerms[i - 1].sub !== x.sub);
        const child = !searching && x.child;
        return (
          <React.Fragment key={x.id}>
            {showSub && <div style={{ ...label12, fontWeight: 700, color: C.accentText, padding: '16px 10px 6px' }}>{KEY_TERM_SUB_NAMES[x.sub!][lang]}</div>}
            <button
              type="button" aria-current={on ? 'true' : undefined} onClick={() => select(x.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: child ? '6px 10px 6px 30px' : '6px 10px', border: 'none', borderBottom: `1px solid ${C.borderLight}`, borderRadius: 0,
                fontFamily: F.display, fontSize: child ? 19 : 21, textAlign: 'left', cursor: 'pointer',
                background: on ? C.highlight : 'transparent', fontWeight: on ? 700 : 600, color: on ? C.text : C.textMuted,
              }}
            >
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: on ? C.accent : 'transparent' }} />
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span>{x.term}</span>
                {searching && <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.textMuted }}>{sectionName(x.section)}</span>}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );

  const Entry = (
    <article aria-live="polite" style={{ flex: '999 1 520px', minWidth: 0, borderTop: `3px double ${C.text}`, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {!wide && (
        <button type="button" onClick={() => setShowEntry(false)} style={{ ...textLink, fontSize: 15, fontWeight: 700, color: C.accentText }}>{L('← All terms', '← Todos los términos')}</button>
      )}
      <div style={{ paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h2 style={{ margin: 0, fontFamily: F.display, fontSize: 'clamp(40px, 6vw, 56px)', fontWeight: 700, lineHeight: 1, color: C.text }}>{sel.term}</h2>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: C.accentText }}>{sectionName(sel.section)}</div>
      </div>

      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {[
          { n: 1, label: L('In a few words', 'En pocas palabras'), body: <div style={{ fontFamily: F.display, fontSize: 26, fontStyle: 'italic', fontWeight: 600, lineHeight: 1.25, color: C.text }}>{sel.short}</div> },
          { n: 2, label: L('What it means', 'Qué significa'), body: <div style={{ fontSize: 17, lineHeight: 1.65, color: C.text }}>{sel.def}</div> },
          ...(sel.example ? [{ n: 3, label: L('For example', 'Por ejemplo'), body: <div style={{ fontSize: 17, lineHeight: 1.6, color: C.text }}>{sel.example}</div> }] : []),
        ].map((item) => (
          <li key={item.n} style={{ display: 'grid', gridTemplateColumns: '32px minmax(0,1fr)', gap: '4px 12px' }}>
            <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: C.accentText, gridRow: '1 / span 2' }}>{item.n}</span>
            <span style={{ ...label12, color: C.textMuted }}>{item.label}</span>
            {item.body}
          </li>
        ))}
      </ol>

      {sel.rows && sel.rows.length > 0 && (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', background: C.surface }}>
          {sel.rows.map((r, i) => (
            <div key={r.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '4px 16px', padding: '14px 18px', borderBottom: i < sel.rows!.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{r.label}</div>
              <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, textAlign: 'right', color: C.text }}>{es ? r.value.replace(/^Over /, 'Más de ') : r.value}</div>
              {r.note && <div style={{ gridColumn: '1 / span 2', fontSize: 14, color: C.textMuted }}>{r.note}</div>}
            </div>
          ))}
        </div>
      )}

      {sel.visual === 'vestingChart' && (
        <div style={{ padding: '16px 18px', borderRadius: 12, background: C.surfaceAlt }}>
          <div style={{ ...label12, color: C.textMuted, marginBottom: 10 }}>{L('Example: a 6-year graded schedule', 'Ejemplo: un calendario gradual de 6 años')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, alignItems: 'end' }}>
            {VESTING_EXAMPLE.map((pct, yr) => (
              <div key={yr} style={{ height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{pct}%</span>
                <div style={{ width: '100%', maxWidth: 36, height: Math.max(3, pct * 0.8), borderRadius: '6px 6px 0 0', background: pct === 100 ? C.green : C.accent }} />
                <span style={{ fontSize: 12, color: C.textMuted }}>{L('Yr', 'Año')} {yr}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sel.rel.length > 0 && (
        <div>
          <div style={{ ...label12, color: C.textMuted }}>{L('See also', 'Ver también')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 20px' }}>
            {sel.rel.map((id) => {
              const r = all.find((x) => x.id === id);
              return r ? <button key={id} type="button" onClick={() => go(id)} style={{ ...textLink, fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.accentText }}>→ {r.term}</button> : null;
            })}
          </div>
        </div>
      )}

      {sel.ask && (
        <button type="button" onClick={() => (sel.ask === 'calculator' ? onOpenCalculator() : openStock(sel.ask))} style={{ ...textLink, alignSelf: 'flex-start', fontSize: 15, fontWeight: 700, color: C.accentText }}>
          {sel.ask === 'calculator' ? L('Try it in the calculator →', 'Pruébalo en la calculadora →') : L('How does my plan handle this? →', '¿Cómo lo maneja mi plan? →')}
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        <button type="button" onClick={() => go(prev.id)} style={{ ...textLink, fontSize: 15, fontWeight: 600, color: C.textMuted }}>← {prev.term}</button>
        <button type="button" onClick={() => go(next.id)} style={{ ...textLink, fontSize: 15, fontWeight: 600, color: C.textMuted, textAlign: 'right' }}>{next.term} →</button>
      </div>
    </article>
  );

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: C.accentSoft, borderBottom: `2px solid ${C.accentBorder}`, boxShadow: '0 8px 20px rgba(30,20,8,.07)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 20px 12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ margin: 0, fontFamily: F.display, fontSize: 'clamp(20px, 3vw, 26px)', lineHeight: 1.1, fontWeight: 700, color: C.text }}>{t.keyTermsTitle}</h1>
          <div style={{ fontSize: 14, color: C.textMuted }}>{t.keyTermsSubtitle}</div>
        </div>
      </div>

      <div ref={layoutRef} style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 20px 48px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ maxWidth: 420, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', border: `1px solid ${C.inputBorder}`, borderRadius: 14, background: C.aiBubble }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
          <input
            type="search" value={query} onChange={(e) => { setQuery(e.target.value); setShowEntry(false); }}
            placeholder={L('Search all terms', 'Buscar en todos los términos')} aria-label={L('Search all terms', 'Buscar en todos los términos')}
            style={{ flex: 1, minWidth: 0, height: 44, fontSize: 15, border: 'none', outline: 'none', background: 'none', color: C.text, fontFamily: F.body }}
          />
        </div>

        <div role="tablist" aria-label={t.keyTermsTitle} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, borderBottom: `1px solid ${C.borderLight}` }}>
          {SECTIONS.map((s) => {
            const on = !searching && sel.section === s;
            return (
              <button
                key={s} role="tab" aria-selected={on} onClick={() => pickTab(s)}
                style={{ minHeight: 44, padding: '0 4px', marginRight: 14, background: 'none', border: 'none', borderBottom: `3px solid ${on ? C.accent : 'transparent'}`, fontSize: 15, fontFamily: F.body, cursor: 'pointer', fontWeight: on ? 700 : 600, color: on ? C.text : C.textMuted }}
              >{sectionName(s)}</button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start' }}>
          {showList && List}
          {showArticle && Entry}
        </div>

        <div style={{ fontSize: 12, color: C.textDim, paddingTop: 16, borderTop: `1px solid ${C.borderLight}` }}>
          {L("General education about 401(k) plans, not personalized financial advice. Your plan's own rules can differ, and the Your plan and Ask tabs show them.", 'Educación general sobre los planes 401(k), no asesoría financiera personalizada. Las reglas de tu plan pueden ser distintas, y las pestañas Tu plan y Preguntar las muestran.')}
        </div>
      </div>
    </div>
  );
}
