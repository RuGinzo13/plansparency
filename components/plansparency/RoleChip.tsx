import React from 'react';
import { ROLE } from './theme';
import { ROLE_TEXT, type TeamRole } from '@/lib/team';

// Role name on a tinted chip. The name is always written, so color is never the only cue.
export function RoleChip({ role, lang = 'en' }: { role: TeamRole; lang?: 'en' | 'es' }) {
  const c = ROLE[role];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 100, background: c.soft, color: c.text, whiteSpace: 'nowrap' }}>
      {ROLE_TEXT[role][lang].label}
    </span>
  );
}
