'use client';

import React from 'react';
import { C } from '../theme';

interface Props {
  lang: 'en' | 'es';
  // Short name of the picture, after "Picture:" / "Imagen:". Example: "how much your employer adds".
  label: string;
  // The same facts as the picture, in a sentence or two. This is what screen readers read.
  words: string;
  // Shows the "Example uses $50,000 pay" note.
  example?: boolean;
  children: React.ReactNode;
}

// Wraps a picture inside an answer card: label, the picture (hidden from screen readers), then the words.
export function VisualFrame({ lang, label, words, example, children }: Props) {
  const es = lang === 'es';
  return (
    <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.textMuted }}>
        {es ? 'Imagen' : 'Picture'}: {label}
      </div>
      <div aria-hidden="true">{children}</div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: C.textMuted }}>
        <strong style={{ color: C.text, fontWeight: 700 }}>{es ? 'En palabras:' : 'In words:'}</strong> {words}
      </p>
      {example && (
        <div style={{ fontSize: 12, color: C.textDim }}>
          {es ? 'El ejemplo usa un salario de $50,000. Solo educación, no consejos.' : 'Example uses $50,000 pay. Education only, not advice.'}
        </div>
      )}
    </div>
  );
}
