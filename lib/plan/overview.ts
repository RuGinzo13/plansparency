// ── Everything the "Ask" glance panel and the "Your plan" screen show ────────
// One pure builder so both screens read the same facts. Takes the reviewed
// plan details and returns plain-words text in English or Spanish. Anything
// the plan details don't say is left out, never guessed.

import type { PlanData } from './plandata';
import type { StockId } from '../answers/stockAnswers';
import { has, facts, tierText, vestingParts, parseVesting, FULL_MATCH_PCT, STANDARD_FORMULA } from './planFacts';
import { safeHarborAmount } from './calc';
import { IRS_LIMITS } from './irs-limits';
import { getLimitYear } from './irs';
import { fmtRounded } from '../format';

type Lang = 'en' | 'es';

export interface Headline { key: 'employer' | 'limit' | 'start' | 'vesting'; label: string; value: string; sub?: string }
export interface GlanceRow { label: string; value: string; stockId: StockId }
export interface TopicCard {
  id: string;
  title: string;
  fact?: string;
  tone: 'good' | 'neutral';
  body: string;
  stockId?: StockId;
  calc?: boolean;
  investments?: boolean;
  anchor?: string;
}
export interface VestingBar { label: string; byYear: number[]; parsed: boolean }
export interface VestingInfo { bars: VestingBar[]; maxYears: number; scheduleText: string; parsed: boolean }
export interface LeaveOption { title: string; tag: string; body: string; warning?: boolean }
export interface Overview {
  headlines: Headline[];
  glance: GlanceRow[];
  topics: { you: TopicCard[]; company: TopicCard[]; while: TopicCard[]; leave: TopicCard[] };
  vesting: VestingInfo | null;
  leaveOptions: LeaveOption[];
}

const num = (n: number) => String(Math.round(n * 100) / 100);
const noDot = (s: string) => s.trim().replace(/\.$/, '');
const bool = (v: unknown): v is boolean => typeof v === 'boolean';

export function getOverview(
  pdIn: PlanData | null,
  lang: Lang,
  opts: { hasFunds: boolean; fundsCount?: number }
): Overview {
  const L = (en: string, es: string) => (lang === 'es' ? es : en);
  const pd = (pdIn && typeof pdIn === 'object' ? pdIn : null) as PlanData | null;
  const { year } = getLimitYear();
  const limits = IRS_LIMITS[year];
  const f = pd ? facts(pd) : null;

  const hasMatch = !!f && (f.shMatch || f.disc);
  const otherMoney = !!f && (f.disc || f.profit);
  const anyEmployerMoney = !!f && (f.safeHarbor || f.disc || f.profit);
  const sameTiming = (() => {
    if (!pd) return true;
    const me = pd.matchEligibility;
    const ce = pd.contribEligibility;
    return me?.immediateMatch === true || !has(me?.requirement) || me!.requirement!.trim() === (ce?.requirement ?? '').trim();
  })();

  // Short names for the employer money that follows a schedule.
  const otherName = !f ? '' : f.disc && f.profit ? L('Match and profit sharing', 'El match y profit sharing') : f.profit ? 'Profit sharing' : L('The extra match', 'El match adicional');
  const barLabel = !f ? '' : f.disc && f.profit ? L('Your match and profit sharing', 'Tu match y profit sharing') : f.profit ? L('Your profit sharing money', 'Tu dinero de profit sharing') : L('Your match', 'Tu match');

  // ── a) headlines ──
  let employer: Headline | null = null;
  if (pd && f) {
    const label = L('Your employer adds', 'Tu empleador agrega');
    if (f.type === 'basic_match' || f.type === 'enhanced_match') {
      const x = safeHarborAmount(f.type, 100, FULL_MATCH_PCT[f.type]);
      employer = { key: 'employer', label, value: L(`Up to ${num(x)}% of pay`, `Hasta ${num(x)}% del salario`), sub: L(`Guaranteed when you save ${FULL_MATCH_PCT[f.type]}%`, `Garantizado cuando ahorras ${FULL_MATCH_PCT[f.type]}%`) };
    } else if (f.type === 'nonelective') {
      employer = { key: 'employer', label, value: L('3% of pay', '3% del salario'), sub: L("Guaranteed, even if you don't save", 'Garantizado, aunque no ahorres') };
    } else if (f.type !== 'qaca' && f.type === 'none') {
      if (f.disc) {
        const x = f.tiers.reduce((sum, t) => sum + (t.pct * t.upTo) / 100, 0);
        employer = { key: 'employer', label, value: L(`Up to ${num(x)}% of pay`, `Hasta ${num(x)}% del salario`), sub: L('Not guaranteed. Your employer decides each year.', 'No está garantizado. Tu empleador decide cada año.') };
      } else if (pd.noMatch === true) {
        employer = { key: 'employer', label, value: L('No match', 'Sin match'), sub: L('Your savings still get tax benefits', 'Tus ahorros igual tienen beneficios fiscales') };
      }
    }
  }

  const limit: Headline = { key: 'limit', label: L('You can save', 'Puedes ahorrar'), value: fmtRounded(limits.deferral), sub: L(`In ${year}, from your own pay`, `En ${year}, de tu propio salario`) };

  let start: Headline | null = null;
  if (pd && has(pd.contribEligibility?.requirement)) {
    start = { key: 'start', label: L('You can start', 'Puedes empezar'), value: pd.contribEligibility.requirement!.trim() };
    if (hasMatch) start.sub = sameTiming ? L('The match starts at the same time.', 'El match empieza al mismo tiempo.') : L('The match starts later.', 'El match empieza después.');
  }

  // Vesting: how many years until all of the schedule's employer money is yours.
  const parsed = pd ? parseVesting(pd.vestingSchedule) : null;
  const yearsToFull = parsed && parsed.kind === 'schedule' ? parsed.byYear.length - 1 : null;
  const shImmediate = !!f && f.safeHarbor && pd!.safeHarbor.vestingImmediate !== false;
  let vestingHead: Headline | null = null;
  if (pd && f && anyEmployerMoney) {
    const label = hasMatch ? L('The match is yours', 'El match es tuyo') : L('Employer money is yours', 'El dinero del empleador es tuyo');
    const right = L('Right away', 'De inmediato');
    let value: string;
    if (shImmediate) value = right;
    else if (parsed?.kind === 'schedule') value = L(`After ${yearsToFull} years`, `Después de ${yearsToFull} años`);
    else if (parsed?.kind === 'immediate') value = right;
    else value = L('On a schedule', 'Con un calendario');
    vestingHead = { key: 'vesting', label, value };
    if (shImmediate && otherMoney) {
      const vp = vestingParts(pd);
      if (vp && vp.schedule) {
        vestingHead.sub = yearsToFull !== null
          ? L(`${otherName} takes ${yearsToFull} years`, `${otherName} tarda ${yearsToFull} años`)
          : L(`${otherName} follows a schedule`, `${otherName} sigue un calendario`);
      }
    }
  }

  const headlines: Headline[] = [];
  if (employer) headlines.push(employer);
  headlines.push(limit);
  if (start) headlines.push(start);
  if (vestingHead) headlines.push(vestingHead);

  // ── b) glance rows ──
  const glance: GlanceRow[] = [];
  const yes = L('Yes', 'Sí');
  const no = 'No';
  if (pd && f) {
    if (employer) glance.push({ label: L('Employer match', 'Match del empleador'), value: employer.value + (f.safeHarbor ? L(', guaranteed', ', garantizado') : ''), stockId: 'match' });
    if (vestingHead) {
      let v = vestingHead.value;
      if (shImmediate && otherMoney && vestingHead.sub) {
        const lead = f.nonelective ? L('Safe harbor now', 'Safe harbor ya') : L('Match now', 'Match ya');
        const short = f.disc && f.profit ? L('match and profit sharing', 'match y profit sharing') : f.profit ? 'profit sharing' : L('extra match', 'match adicional');
        v = yearsToFull !== null ? `${lead}, ${short} ${yearsToFull} ${L('yrs', 'años')}` : `${lead}, ${short} ${L('on a schedule', 'con calendario')}`;
      }
      glance.push({ label: L("When it's yours", 'Cuándo es tuyo'), value: v, stockId: 'vesting' });
    }
    if (bool(pd.profitSharing?.available)) {
      glance.push({ label: 'Profit sharing', value: pd.profitSharing.available ? L('May be added yearly', 'Puede agregarse cada año') : no, stockId: 'match' });
    }
    const ld = pd.lastDayProvision;
    const psLd = pd.profitSharing?.lastDayApplies;
    if (ld === true || psLd === true) {
      glance.push({ label: L('Last-day-of-year rule', 'Regla del último día'), value: yes, stockId: 'match' });
    } else if (ld === false && (psLd === false || (psLd == null && pd.profitSharing?.available !== true))) {
      glance.push({ label: L('Last-day-of-year rule', 'Regla del último día'), value: no, stockId: 'match' });
    }
    // Eligibility is always shown, even when the plan reader couldn't find it.
    glance.push({
      label: L('When you can save', 'Cuándo puedes ahorrar'),
      value: has(pd.contribEligibility?.requirement) ? pd.contribEligibility.requirement!.trim() : L('Ask HR', 'Pregunta a Recursos Humanos'),
      stockId: 'elig',
    });
    if (hasMatch) glance.push({ label: L('When the match starts', 'Cuándo empieza el match'), value: sameTiming ? L('Same time', 'Al mismo tiempo') : L('Later', 'Después'), stockId: 'elig' });
    const roth = pd.hasRoth ?? pd.rothAvailable;
    if (bool(roth)) glance.push({ label: L('Roth option', 'Opción Roth'), value: roth ? yes : no, stockId: 'roth' });
    if (bool(pd.planAllowsCatchUp)) glance.push({ label: L('Catch-up (age 50+)', 'Catch-up (50+ años)'), value: pd.planAllowsCatchUp ? yes : no, stockId: 'limit' });
    if (bool(pd.loanAvailable)) glance.push({ label: L('Loans', 'Préstamos'), value: pd.loanAvailable ? yes : no, stockId: 'loans' });
    if (bool(pd.hardshipAvailable)) glance.push({ label: L('Hardship withdrawals', 'Retiros por dificultad'), value: pd.hardshipAvailable ? yes : no, stockId: 'hardship' });
  }

  // ── c) topic cards ──
  const you: TopicCard[] = [];
  const company: TopicCard[] = [];
  const whileWorking: TopicCard[] = [];
  const leave: TopicCard[] = [];

  const catchUp = pd && bool(pd.planAllowsCatchUp) ? pd.planAllowsCatchUp : null;
  you.push({
    id: 'limit',
    title: L('How much can I save?', '¿Cuánto puedo ahorrar?'),
    fact: L(`${fmtRounded(limits.deferral)} in ${year}`, `${fmtRounded(limits.deferral)} en ${year}`),
    tone: 'neutral',
    body: catchUp === true
      ? L(`Age 50 or older? You can add ${fmtRounded(limits.catchUp50)} more. If you're 60 to 63, you can add ${fmtRounded(limits.catchUp6063)} instead.`, `¿Tienes 50 años o más? Puedes agregar ${fmtRounded(limits.catchUp50)} más. Si tienes de 60 a 63 años, puedes agregar ${fmtRounded(limits.catchUp6063)} en su lugar.`)
      : catchUp === false
        ? L("Your plan doesn't offer catch-up contributions.", 'Tu plan no ofrece contribuciones de catch-up.')
        : L("Money your employer adds doesn't count toward this limit.", 'El dinero que agrega tu empleador no cuenta para este límite.'),
    calc: true,
    stockId: 'limit',
  });

  if (pd) {
    const roth = pd.hasRoth ?? pd.rothAvailable;
    if (bool(pd.hasPreTax) && bool(roth) && (pd.hasPreTax || roth)) {
      const both = pd.hasPreTax && roth;
      you.push({
        id: 'roth',
        title: L('Roth or Traditional?', '¿Roth o Tradicional?'),
        fact: both ? L('Your plan offers both', 'Tu plan ofrece ambas') : pd.hasPreTax ? L('Traditional only', 'Solo Tradicional') : L('Roth only', 'Solo Roth'),
        tone: 'good',
        body: L('Traditional lowers your taxes now. Roth can be tax-free later.', 'Tradicional baja tus impuestos hoy. Roth puede ser libre de impuestos después.') + (both ? L(' You can pick one or split between them.', ' Puedes elegir una o dividir entre ambas.') : ''),
        stockId: 'roth',
      });
    }
    {
      const req = pd.contribEligibility?.requirement;
      you.push({
        id: 'elig',
        title: L('When can I start?', '¿Cuándo puedo empezar?'),
        fact: has(req) ? req.trim() : undefined,
        tone: 'neutral',
        body: has(pd.contribEligibility?.entryDates)
          ? L(`Entry dates: ${noDot(pd.contribEligibility.entryDates!)}.`, `Fechas de entrada: ${noDot(pd.contribEligibility.entryDates!)}.`)
          : !has(req)
            ? L("Your plan document didn't say. HR or your plan's website can tell you.", 'El documento de tu plan no lo dice. Recursos Humanos o el sitio web de tu plan te lo pueden decir.')
            : L("Your exact start date can depend on set entry dates. HR or your plan's website can confirm it.", 'Tu fecha exacta de inicio puede depender de fechas de entrada fijas. Recursos Humanos o el sitio web de tu plan lo pueden confirmar.'),
        stockId: 'elig',
        anchor: 'when-can-you-start',
      });
    }
  }
  if (opts.hasFunds) {
    you.push({
      id: 'investments',
      title: L('Where does my money go?', '¿A dónde va mi dinero?'),
      fact: opts.fundsCount ? L(`${opts.fundsCount} funds to pick from`, `${opts.fundsCount} fondos para elegir`) : undefined,
      tone: 'neutral',
      body: L('See the funds your plan offers and what each one is for.', 'Ve los fondos que ofrece tu plan y para qué sirve cada uno.'),
      investments: true,
    });
  }

  if (pd && f) {
    const formula = has(pd.safeHarbor?.formula) ? noDot(pd.safeHarbor.formula) : STANDARD_FORMULA[f.type];
    let matchBody: string | null = null;
    if (f.safeHarbor && has(formula)) {
      matchBody = L(`${formula}. It's guaranteed (safe harbor).`, `${formula}. Está garantizado (safe harbor).`);
    } else if (f.disc) {
      matchBody = L(`${tierText(pd)}. It isn't guaranteed: your employer decides each year.`, `${tierText(pd)}. No está garantizado: tu empleador decide cada año.`);
    } else if (!f.safeHarbor && pd.noMatch === true) {
      matchBody = L("What you save is still yours, and it still gets tax benefits.", 'Lo que ahorras sigue siendo tuyo y sigue teniendo beneficios fiscales.');
    }
    if (matchBody) {
      company.push({
        id: 'match',
        title: L('How does the match work?', '¿Cómo funciona el match?'),
        fact: employer?.value,
        tone: f.safeHarbor || f.disc ? 'good' : 'neutral',
        body: matchBody,
        calc: true,
        stockId: 'match',
      });
    }
    if (f.profit) {
      company.push({
        id: 'profit',
        title: 'Profit sharing',
        fact: L('May be added each year', 'Puede agregarse cada año'),
        tone: 'good',
        body: L('Your employer decides each year whether to add it and how much.', 'Tu empleador decide cada año si lo agrega y cuánto.') + (pd.profitSharing.lastDayApplies === true ? L(' You may need to work here on the last day of the plan year to get it.', ' Es posible que debas trabajar aquí el último día del año del plan para recibirlo.') : ''),
        stockId: 'match',
      });
    }

    if (bool(pd.loanAvailable)) {
      whileWorking.push({
        id: 'loans',
        title: L('Can I borrow from it?', '¿Puedo pedir un préstamo?'),
        fact: pd.loanAvailable ? L('Yes, loans are allowed', 'Sí, se permiten préstamos') : L('No loans right now', 'Sin préstamos por ahora'),
        tone: pd.loanAvailable ? 'good' : 'neutral',
        body: pd.loanAvailable
          ? L("Generally up to half of what's yours, $50,000 max. You pay yourself back with interest from your paycheck, usually within 5 years.", 'Generalmente hasta la mitad de lo que es tuyo, máximo $50,000. Te pagas a ti mismo con intereses desde tu cheque, normalmente en 5 años.')
          : L("Your plan doesn't offer loans right now.", 'Tu plan no ofrece préstamos por ahora.'),
        stockId: 'loans',
      });
    }
    if (bool(pd.hardshipAvailable)) {
      whileWorking.push({
        id: 'hardship',
        title: L('Money for a hardship?', '¿Dinero por una dificultad?'),
        fact: pd.hardshipAvailable ? L('Yes, for serious needs', 'Sí, para necesidades graves') : L('Not offered', 'No se ofrece'),
        tone: pd.hardshipAvailable ? 'good' : 'neutral',
        body: pd.hardshipAvailable
          ? L("Things like medical bills or stopping an eviction. You don't pay it back. It's taxed, and under 59½ there's usually an extra 10% tax.", 'Cosas como cuentas médicas o evitar un desalojo. No se devuelve. Se grava, y si tienes menos de 59½ normalmente hay un 10% extra de impuesto.')
          : L("Your plan doesn't offer hardship withdrawals right now.", 'Tu plan no ofrece retiros por dificultad por ahora.'),
        stockId: 'hardship',
      });
    }
  }

  {
    const vp = pd ? vestingParts(pd) : null;
    const parts: string[] = [];
    if (vp && vp.schedule) parts.push(L(`${vp.label}: the part that's already yours.`, `${vp.label}: la parte que ya es tuya.`));
    if (pd?.loanAvailable === true) parts.push(L('Have a loan? What you still owe may need to be repaid soon after you leave.', '¿Tienes un préstamo? Lo que aún debes puede tener que pagarse poco después de irte.'));
    leave.push({
      id: 'goes',
      title: L('What goes with me?', '¿Qué se va conmigo?'),
      fact: f && f.safeHarbor ? L('Your savings and safe harbor money: all of it', 'Tus ahorros y el dinero safe harbor: todo') : L('Your savings: all of it', 'Tus ahorros: todo'),
      tone: 'good',
      body: parts.length ? parts.join(' ') : L('Your own savings are always yours to take.', 'Tus propios ahorros siempre son tuyos.'),
      stockId: 'leave',
    });
  }

  // ── d) vesting ──
  let vesting: VestingInfo | null = null;
  if (pd && f && anyEmployerMoney) {
    const bars: VestingBar[] = [];
    const parsedSched = parsed;
    const schedYears = parsedSched && parsedSched.kind === 'schedule' ? parsedSched.byYear.length - 1 : 0;
    const maxYears = Math.max(6, schedYears);
    const fill = (byYear: number[]) => Array.from({ length: maxYears + 1 }, (_, i) => (i < byYear.length ? byYear[i] : 100));
    const all100 = Array(maxYears + 1).fill(100);
    bars.push({ label: L('Your own savings', 'Tus propios ahorros'), byYear: all100, parsed: true });
    if (f.safeHarbor && pd.safeHarbor.vestingImmediate !== false) bars.push({ label: L('Safe harbor money', 'Dinero safe harbor'), byYear: all100, parsed: true });
    let employerParsed = true;
    if (otherMoney) {
      const vp = vestingParts(pd);
      const label = vp ? vp.label : barLabel;
      if (parsedSched?.kind === 'schedule') bars.push({ label, byYear: fill(parsedSched.byYear), parsed: true });
      else if (parsedSched?.kind === 'immediate') bars.push({ label, byYear: all100, parsed: true });
      else { bars.push({ label, byYear: [], parsed: false }); employerParsed = false; }
    }
    vesting = { bars, maxYears, scheduleText: has(pd.vestingSchedule) ? pd.vestingSchedule.trim() : '', parsed: employerParsed };
  }

  // ── e) leave choices ──
  const leaveOptions: LeaveOption[] = [
    { title: L('Leave it here', 'Déjalo aquí'), tag: L('No tax now', 'Sin impuesto ahora'), body: L('It stays in this plan and keeps growing. Small balances (under $7,000) may be moved out for you.', 'Se queda en este plan y sigue creciendo. Los saldos pequeños (menos de $7,000) pueden sacarse del plan por ti.') },
    { title: L("Move it to your new job's plan", 'Muévelo al plan de tu nuevo trabajo'), tag: L('No tax if moved directly', 'Sin impuesto si se mueve directo'), body: L('A "direct rollover" keeps it tax-free. Your new plan has to accept it.', 'Un "rollover directo" lo mantiene libre de impuestos. Tu nuevo plan tiene que aceptarlo.') },
    { title: L('Move it to an IRA', 'Muévelo a una IRA'), tag: L('No tax if moved directly', 'Sin impuesto si se mueve directo'), body: L('An account you open yourself. Also done as a direct rollover.', 'Una cuenta que abres tú mismo. También se hace como rollover directo.') },
    { title: L('Cash it out', 'Retíralo en efectivo'), tag: L('Taxed', 'Con impuestos'), body: L("Counts as income. Under 59½ there's usually an extra 10% tax.", 'Cuenta como ingreso. Si tienes menos de 59½ normalmente hay un 10% extra de impuesto.'), warning: true },
  ];

  return { headlines, glance, topics: { you, company, while: whileWorking, leave }, vesting, leaveOptions };
}
