import React from 'react';
import { C, F, ROLE } from './theme';
import { initials, type TeamRole } from '@/lib/team';

// Circle in the role color with initials; a photo replaces the initials.
export function TeamAvatar({ name, role, photo, size }: { name: string; role: TeamRole; photo?: string; size: number }) {
  const box = { width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: ROLE[role].base } as const;
  if (photo) {
    return <span style={{ ...box, display: 'inline-block' }}><img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></span>;
  }
  return (
    <span aria-hidden="true" style={{ ...box, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: C.onPrimary, fontFamily: F.body, fontSize: Math.round(size / 3), fontWeight: 700 }}>
      {initials(name)}
    </span>
  );
}
