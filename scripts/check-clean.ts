// Sanity script for lib/text/clean.ts (cleaning AI-written text).
// Run with: npx --yes tsx scripts/check-clean.ts
import { cleanAiText } from '../lib/text/clean';

let pass = 0;
let fail = 0;
const eq = (got: string, want: string, msg: string) => { if (got === want) pass++; else { fail++; console.error(`FAIL ${msg}\n  got:  ${JSON.stringify(got)}\n  want: ${JSON.stringify(want)}`); } };

// Ranges
eq(cleanAiText('The match is 3%–5% of pay.'), 'The match is 3% to 5% of pay.', 'percent range en dash');
eq(cleanAiText('Between 2020—2024.'), 'Between 2020 to 2024.', 'year range em dash');
eq(cleanAiText('About $50K – $60K a year.'), 'About $50K to $60K a year.', 'dollar range with spaces');
eq(cleanAiText('Ages 59–60'), 'Ages 59 to 60', 'age range');
// Other dashes
eq(cleanAiText('Your plan allows loans — up to half your balance.'), 'Your plan allows loans, up to half your balance.', 'spaced em dash');
eq(cleanAiText('Loans—and hardships—cost you later.'), 'Loans, and hardships, cost you later.', 'tight em dashes');
eq(cleanAiText('Yes, — that works.'), 'Yes, that works.', 'no double comma');
eq(cleanAiText('Okay. — Next step.'), 'Okay. Next step.', 'no comma after a period');
eq(cleanAiText('— Starts a line'), 'Starts a line', 'dash at line start');
eq(cleanAiText('Ends a line —\nNext line'), 'Ends a line\nNext line', 'dash at line end');
eq(cleanAiText('no  double   spaces — here'), 'no double spaces, here', 'no double spaces');
// Emojis
eq(cleanAiText('Great news 🎉 your match is free 💰!'), 'Great news your match is free!', 'emoji');
eq(cleanAiText('Check ✅ done ⚠️ careful'), 'Check done careful', 'dingbats and variation selectors');
eq(cleanAiText('Pay: $5,000 (2024) 100%'), 'Pay: $5,000 (2024) 100%', 'digits and symbols stay');
// Rules and blank lines
eq(cleanAiText('First\n---\nSecond'), 'First\n\nSecond', 'dash rule line');
eq(cleanAiText('First\n***\n\nSecond\n___\nThird'), 'First\n\nSecond\n\nThird', 'star and underscore rules');
eq(cleanAiText('A\n\n\n\n\nB'), 'A\n\nB', 'many blank lines');
eq(cleanAiText('  \n\nHello\n\n  '), 'Hello', 'trim');
eq(cleanAiText('- one\n- two'), '- one\n- two', 'list bullets stay');
eq(cleanAiText('A well-known fund'), 'A well-known fund', 'hyphens stay');
// PLANDATA is never touched
const block = '<!--PLANDATA:{"vestingSchedule":"0%–20% — graded","note":"🎉"}-->';
eq(cleanAiText(`Summary — here 🎉\n\n${block}`), `Summary, here\n\n${block}`, 'PLANDATA untouched');
const partial = '<!--PLANDATA:{"a":"1–2 —';
eq(cleanAiText(`Hi — there\n${partial}`), `Hi, there\n${partial}`, 'unfinished PLANDATA untouched');
// A real-looking answer with all four problems
const real = `Great question! 🎉 Your plan offers a match — and it's generous.\n\n---\n\nHere's how it works:\n\n- Save 3%–6% of pay 💰\n- Your employer adds up to 4% — free money\n\n\n\n\n***\n\nTalk to HR ✅ for details.`;
const want = `Great question! Your plan offers a match, and it's generous.\n\nHere's how it works:\n\n- Save 3% to 6% of pay\n- Your employer adds up to 4%, free money\n\nTalk to HR for details.`;
eq(cleanAiText(real), want, 'real-looking answer');
eq(cleanAiText(want), want, 'already clean text is unchanged');
eq(cleanAiText(undefined as any), '', 'not a string');
for (const s of [real, want, 'a — b', '1–2']) { const o = cleanAiText(s); if (/[—–]/.test(o) || /\p{Extended_Pictographic}/u.test(o)) { fail++; console.error('FAIL left a dash or emoji in', o); } else pass++; }

console.log(`${pass} checks passed, ${fail} failed`);
if (fail > 0) process.exit(1);
