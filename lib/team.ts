// Advisor team on a plan: types, validation and small helpers.
// Shared by the server (app/api/plan-team) and the browser. No React in here.

export const TEAM_ROLES = ['advisor', 'consultant', 'education', 'service', 'support'] as const;
export type TeamRole = typeof TEAM_ROLES[number];

export type TeamMember = {
  id: string;
  name: string;
  role: TeamRole;
  also: TeamRole[];
  title: string;
  // One optional line: what this person helps with (the advisor's own words, not translated).
  helps: string;
  phone: string;
  email: string;
  langs: { en: boolean; es: boolean; other: string };
  booking: string;
  photo: string;
  lead: boolean;
};

export const MAX_HELPS = 120;
export const MAX_TEAM = 12;
export const MAX_ALSO = 4;
export const MAX_PHOTO_CHARS = 80000;

// DRAFT wording, Ross approves with #39.
export const ROLE_TEXT: Record<TeamRole, { en: { label: string; what: string }; es: { label: string; what: string } }> = {
  advisor: {
    en: { label: 'Advisor', what: 'Works with your employer to run the plan and pick its investment choices.' },
    es: { label: 'Asesor', what: 'Trabaja con tu empleador para administrar el plan y elegir sus opciones de inversión.' },
  },
  consultant: {
    en: { label: 'Plan consultant', what: 'Handles plan setup, rules and paperwork with your employer.' },
    es: { label: 'Consultor del plan', what: 'Se encarga de la configuración, las reglas y el papeleo del plan con tu empleador.' },
  },
  education: {
    en: { label: 'Education', what: 'Runs meetings and one-on-ones to help you understand your plan.' },
    es: { label: 'Educación', what: 'Da reuniones y citas individuales para ayudarte a entender tu plan.' },
  },
  service: {
    en: { label: 'Client service', what: 'Helps with account questions, forms and getting you to the right person.' },
    es: { label: 'Servicio al cliente', what: 'Ayuda con preguntas de tu cuenta, formularios y te conecta con la persona indicada.' },
  },
  support: {
    en: { label: 'Support', what: 'Other team members who help behind the scenes.' },
    es: { label: 'Apoyo', what: 'Otros miembros del equipo que ayudan detrás de escena.' },
  },
};

// Shared field rules, also used by the editor so the messages match the server.
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const PHONE_RE = /^[0-9\s+()\-.]*$/;
export const JPEG_PREFIX = 'data:image/jpeg;base64,';

export function isValidEmail(v: string): boolean { return v === '' || (v.length <= 120 && EMAIL_RE.test(v)); }
export function isValidPhone(v: string): boolean { return v.length <= 30 && PHONE_RE.test(v); }
export function isValidBooking(v: string): boolean { return v === '' || (v.length <= 300 && v.startsWith('https://')); }

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function newId(): string {
  return globalThis.crypto.randomUUID();
}

export function normalizeTeam(raw: unknown): { team: TeamMember[]; errors: string[] } {
  const errors: string[] = [];
  if (!Array.isArray(raw)) return { team: [], errors };
  const team: TeamMember[] = [];
  let sawLead = false;

  raw.slice(0, MAX_TEAM).forEach((item, i) => {
    const m = (item && typeof item === 'object' ? item : {}) as Record<string, any>;
    const label = `Person ${i + 1}`;
    const name = str(m.name).slice(0, 80);
    if (!name) { errors.push(`${label}: add a name.`); return; }

    const role: TeamRole = (TEAM_ROLES as readonly string[]).includes(m.role) ? m.role : 'support';

    // Other roles: valid, no duplicates, never the main role, in TEAM_ROLES order, at most 4.
    const alsoRaw: unknown[] = Array.isArray(m.also) ? m.also : [];
    const also = TEAM_ROLES.filter((r) => r !== role && alsoRaw.includes(r)).slice(0, MAX_ALSO);

    let phone = str(m.phone);
    if (!isValidPhone(phone)) { errors.push(`${name}: the phone number has characters that aren't allowed.`); phone = ''; }

    let email = str(m.email);
    if (!isValidEmail(email)) { errors.push(`${name}: that email doesn't look right.`); email = ''; }

    let booking = str(m.booking);
    if (!isValidBooking(booking)) { errors.push(`${name}: the booking link must start with https://`); booking = ''; }

    let photo = typeof m.photo === 'string' ? m.photo : '';
    if (!photo.startsWith(JPEG_PREFIX) || photo.length > MAX_PHOTO_CHARS) photo = '';

    const langs = (m.langs && typeof m.langs === 'object' ? m.langs : {}) as Record<string, any>;
    const lead = m.lead === true && !sawLead;
    if (lead) sawLead = true;

    team.push({
      id: typeof m.id === 'string' && m.id.length > 0 && m.id.length <= 40 ? m.id : newId(),
      name,
      role,
      also,
      title: str(m.title).slice(0, 80),
      helps: str(m.helps).slice(0, MAX_HELPS),
      phone,
      email,
      langs: { en: langs.en === true, es: langs.es === true, other: str(langs.other).slice(0, 60) },
      booking,
      photo,
      lead,
    });
  });

  return { team, errors };
}

export function telHref(phone: string): string {
  return 'tel:' + phone.replace(/[^0-9+]/g, '');
}

export function initials(name: string): string {
  const words = name.split(',')[0].trim().split(/\s+/).filter(Boolean);
  const out = words.slice(0, 2).map((w) => Array.from(w)[0] ?? '').join('').toUpperCase();
  return out || '?';
}

// Main role first, then the other roles.
export function rolesOf(m: Pick<TeamMember, 'role' | 'also'>): TeamRole[] {
  return [m.role, ...m.also];
}
