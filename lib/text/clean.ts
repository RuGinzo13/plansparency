// Cleans AI-written text before a participant sees it: no em or en dashes, no emojis, no stray
// horizontal rules. Done at display time on the joined text (a stream arrives in pieces).
// The hidden <!--PLANDATA ... --> block is never touched.

const MARK = '\u0001';

function cleanPiece(text: string): string {
  let t = text;
  // Emojis and their joiners / variation selectors.
  t = t.replace(/[\p{Extended_Pictographic}\uFE0E\uFE0F\u200D]/gu, '').replace(/[ \t]+([,.;:!?])/g, '$1');
  // A range: 3%–5% becomes "3% to 5%".
  t = t.replace(/(\d[%KkMmBb]?)[ \t]*[–—][ \t]*(?=[$€£]?\d)/g, '$1 to ');
  // Any other dash becomes a comma, without doubling up punctuation or leaving a stray comma.
  t = t.replace(/[ \t]*[–—][ \t]*/g, MARK);
  t = t.replace(new RegExp(`^${MARK}`, 'gm'), '');
  t = t.replace(new RegExp(`${MARK}$`, 'gm'), '');
  t = t.replace(new RegExp(`([,;:.!?])${MARK}`, 'g'), '$1 ');
  t = t.replace(new RegExp(`${MARK}([,;:.!?])`, 'g'), '$1');
  t = t.replace(new RegExp(MARK, 'g'), ', ');
  // Lines that are only --- *** or ___.
  t = t.replace(/^[ \t]*([-*_])\1{2,}[ \t]*$/gm, '');
  // Spaces: no doubles, none before a line break. Blank lines: at most one in a row.
  t = t.replace(/[ \t]+$/gm, '').replace(/(\S)[ \t]{2,}/g, '$1 ');
  t = t.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n');
  return t;
}

export function cleanAiText(text: string): string {
  if (typeof text !== 'string') return '';
  // Odd entries are PLANDATA blocks (or one that is still arriving): left exactly as they are.
  const parts = text.split(/(<!--PLANDATA[\s\S]*?(?:-->|$))/);
  return parts.map((p, i) => (i % 2 === 1 ? p : cleanPiece(p))).join('').replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n').trim();
}
