// Sanity script for lib/team.ts (team validation on each plan).
// Run with: npx --yes tsx scripts/check-team.ts
import { normalizeTeam, telHref, initials, rolesOf, MAX_TEAM, MAX_PHOTO_CHARS } from '../lib/team';

let pass = 0;
let fail = 0;
const check = (ok: boolean, msg: string) => { if (ok) pass++; else { fail++; console.error('FAIL ' + msg); } };

const base = { name: 'Jordan Lee', role: 'advisor', title: 'Advisor', phone: '(555) 010-2001', email: 'jordan@example.com', langs: { en: true, es: false, other: '' }, booking: 'https://calendly.com/jordan', photo: '', lead: false };

// valid member kept as is
{
  const r = normalizeTeam([base]);
  check(r.errors.length === 0, 'valid member: no errors');
  check(r.team.length === 1 && r.team[0].name === 'Jordan Lee' && r.team[0].email === 'jordan@example.com', 'valid member kept');
  check(typeof r.team[0].id === 'string' && r.team[0].id.length > 0, 'valid member gets an id');
}
// not an array
check(normalizeTeam('nope').team.length === 0 && normalizeTeam(null).team.length === 0, 'non-array gives an empty team');
// empty name dropped
{
  const r = normalizeTeam([{ ...base, name: '   ' }]);
  check(r.team.length === 0 && r.errors.length === 1, 'empty name dropped with an error');
}
// bad email cleared
{
  const r = normalizeTeam([{ ...base, email: 'jordan@' }]);
  check(r.team[0].email === '' && r.errors.length === 1, 'bad email cleared with an error');
}
// http booking cleared
{
  const r = normalizeTeam([{ ...base, booking: 'http://calendly.com/jordan' }]);
  check(r.team[0].booking === '' && r.errors.length === 1, 'http booking cleared with an error');
}
// bad phone cleared
{
  const r = normalizeTeam([{ ...base, phone: '555-CALL-NOW' }]);
  check(r.team[0].phone === '' && r.errors.length === 1, 'bad phone cleared with an error');
}
// unknown role becomes support
check(normalizeTeam([{ ...base, role: 'wizard' }]).team[0].role === 'support', 'unknown role becomes support');
// two leads -> one
{
  const r = normalizeTeam([{ ...base, lead: true }, { ...base, name: 'Sam Park', lead: true }]);
  check(r.team.filter((m) => m.lead).length === 1 && r.team[0].lead && !r.team[1].lead, 'two leads keep only the first');
}
// 13 members -> 12
check(normalizeTeam(Array.from({ length: 13 }, (_, i) => ({ ...base, name: `P${i}` }))).team.length === MAX_TEAM, '13 members cut to 12');
// photos
{
  const jpeg = 'data:image/jpeg;base64,' + 'A'.repeat(100);
  check(normalizeTeam([{ ...base, photo: jpeg }]).team[0].photo === jpeg, 'small jpeg photo kept');
  check(normalizeTeam([{ ...base, photo: 'data:image/png;base64,AAAA' }]).team[0].photo === '', 'png photo cleared');
  const big = 'data:image/jpeg;base64,' + 'A'.repeat(MAX_PHOTO_CHARS);
  check(normalizeTeam([{ ...base, photo: big }]).team[0].photo === '', 'over-size photo cleared');
}
// id kept when valid, long id replaced
check(normalizeTeam([{ ...base, id: 'abc' }]).team[0].id === 'abc', 'valid id kept');
check(normalizeTeam([{ ...base, id: 'x'.repeat(41) }]).team[0].id.length > 0 && normalizeTeam([{ ...base, id: 'x'.repeat(41) }]).team[0].id !== 'x'.repeat(41), 'too-long id replaced');
// other roles (also)
{
  const a = normalizeTeam([{ ...base, role: 'advisor', also: ['support', 'wizard', 'service', 'service', 'advisor', 7] }]).team[0];
  check(a.also.join(',') === 'service,support', 'also: invalid, duplicate and main role dropped, order fixed');
  check(rolesOf(a).join(',') === 'advisor,service,support', 'rolesOf puts the main role first');
  check(normalizeTeam([base]).team[0].also.length === 0, 'old record without also loads with an empty list');
  check(normalizeTeam([{ ...base, also: 'service' }]).team[0].also.length === 0, 'also that is not a list becomes empty');
  const many = normalizeTeam([{ ...base, role: 'advisor', also: ['consultant', 'education', 'service', 'support'] }]).team[0];
  check(many.also.length === 4, 'also allows all four other roles');
}
// helpers
check(telHref('(555) 010-2001') === 'tel:5550102001', 'telHref keeps digits only');
check(telHref('+1 (555) 010-2001') === 'tel:+15550102001', 'telHref keeps a leading +');
check(initials('Jordan Lee, CFP®') === 'JL', 'initials ignore text after a comma');
check(initials('') === '?', 'initials of empty name is ?');
check(initials('Madonna') === 'M', 'initials of one word');

console.log(`${pass} checks passed, ${fail} failed`);
if (fail > 0) process.exit(1);
