// ── One glossary for every definition in the app ─────────────────────────────
// Key Terms, the calculator's definition bubbles, and anywhere else that
// explains a plan concept all read from here, so the wording and the dollar
// numbers never drift apart. Dollar placeholders are filled from
// lib/plan/irs-limits.ts for the current limit year — never type a limit by
// hand into a definition.

import { IRS_LIMITS, getLimitYear } from './plan/irs';
import { fmtRounded } from './format';

export type TermId =
  | '401k'
  | 'contribution'
  | 'employerMatch'
  | 'safeHarbor'
  | 'discretionaryMatch'
  | 'profitSharing'
  | 'eligibility'
  | 'vesting'
  | 'vestingSchedule'
  | 'traditional'
  | 'roth'
  | 'irsLimit'
  | 'catchUp'
  | 'rothCatchUpRule'
  | 'payLimit'
  | 'totalLimit'
  | 'trueUp'
  | 'hce'
  | 'rollover'
  | 'rmd'
  | 'hardship'
  | 'loan';

interface Localized {
  en: string;
  es: string;
}

interface GlossaryEntry {
  id: TermId;
  term: Localized;
  def: Localized;
}

const ENTRIES: GlossaryEntry[] = [
  {
    id: '401k',
    term: { en: '401(k)', es: '401(k)' },
    def: {
      en: "A retirement savings account offered through your job. Money comes out of your paycheck automatically. Depending on your plan, it can go in before-tax (Traditional), after-tax (Roth), or both.",
      es: "Una cuenta de ahorro para el retiro que te ofrece tu trabajo. El dinero sale de tu cheque de pago automáticamente. Según tu plan, puede ir antes de impuestos (Tradicional), después de impuestos (Roth), o ambos.",
    },
  },
  {
    id: 'contribution',
    term: { en: 'Contribution', es: 'Contribución' },
    def: {
      en: "The money you put in from your paycheck. You choose a percentage or dollar amount. The more you put in, the more your money can grow over time.",
      es: "El dinero que aportas de tu cheque de pago. Tú eliges el porcentaje o la cantidad en dólares. Cuanto más aportes, más puede crecer tu dinero con el tiempo.",
    },
  },
  {
    id: 'employerMatch',
    term: { en: 'Employer match', es: 'Match del empleador' },
    def: {
      en: "Money your employer adds when you save. Example: a '50% match on the first 6%' means for every $1 you put in, up to 6% of your pay, your employer adds 50 cents.",
      es: "Dinero que tu empleador agrega cuando ahorras. Ejemplo: un 'match del 50% en el primer 6%' significa que por cada $1 que aportas, hasta el 6% de tu salario, tu empleador agrega 50 centavos.",
    },
  },
  {
    id: 'safeHarbor',
    term: { en: 'Safe harbor contribution', es: 'Contribución safe harbor' },
    def: {
      en: "A guaranteed employer contribution required by law. It's immediately 100% yours — no vesting wait. Unlike a regular match, a nonelective safe harbor doesn't require you to contribute to receive it.",
      es: "Una contribución garantizada del empleador requerida por ley. Es 100% tuya inmediatamente — sin período de espera de vesting. El safe harbor no electivo no requiere que contribuyas para recibirlo.",
    },
  },
  {
    id: 'discretionaryMatch',
    term: { en: 'Extra (discretionary) match', es: 'Match adicional (discrecional)' },
    def: {
      en: "Money your employer may add on top, if it decides to. It can change or skip it any year, so it is not guaranteed.",
      es: "Dinero que tu empleador puede agregar además, si decide hacerlo. Puede cambiarlo o no darlo en cualquier año, así que no está garantizado.",
    },
  },
  {
    id: 'profitSharing',
    term: { en: 'Profit sharing', es: 'Profit sharing' },
    def: {
      en: "An extra employer contribution based on company performance. It's discretionary — the employer decides each year whether to give it and how much. Not guaranteed like a safe harbor.",
      es: "Una contribución adicional del empleador basada en el desempeño de la empresa. Es discrecional — el empleador decide cada año si la da y cuánto. No está garantizada como el safe harbor.",
    },
  },
  {
    id: 'eligibility',
    term: { en: 'Eligibility and waiting period', es: 'Elegibilidad y período de espera' },
    def: {
      en: "The rules for when you can start saving in the plan and when employer money starts. Some plans make new employees wait, for example until they have worked there a year.",
      es: "Las reglas de cuándo puedes empezar a ahorrar en el plan y cuándo empieza el dinero del empleador. Algunos planes hacen esperar a los empleados nuevos, por ejemplo hasta que hayan trabajado ahí un año.",
    },
  },
  {
    id: 'vesting',
    term: { en: 'Vesting', es: 'Vesting' },
    def: {
      en: "The process of earning full ownership of your employer's contributions over time. Your own contributions are always 100% yours immediately. Employer contributions may have a waiting period.",
      es: "El proceso de ganar la propiedad total de las contribuciones de tu empleador con el tiempo. Tus propias contribuciones siempre son 100% tuyas de inmediato.",
    },
  },
  {
    id: 'vestingSchedule',
    term: { en: 'Vesting schedule', es: 'Calendario de vesting' },
    def: {
      en: "The timeline that determines what percentage of employer contributions you keep if you leave. Example: '3-year cliff' = you get 0% if you leave before year 3, then 100% at year 3. 'Graded' means you earn it gradually year by year.",
      es: "El cronograma que determina qué porcentaje de las contribuciones del empleador conservas si te vas. Ejemplo: '3 años cliff' = obtienes 0% si te vas antes del año 3, luego 100% al año 3.",
    },
  },
  {
    id: 'traditional',
    term: { en: 'Traditional (before-tax)', es: 'Tradicional (antes de impuestos)' },
    def: {
      en: "Money goes in before income tax, so less of your paycheck is taxed today. You pay income tax later, when you take the money out in retirement.",
      es: "El dinero entra antes del impuesto sobre la renta, así que hoy se grava menos de tu cheque de pago. Pagas el impuesto sobre la renta después, cuando retiras el dinero en la jubilación.",
    },
  },
  {
    id: 'roth',
    term: { en: 'Roth (after-tax)', es: 'Roth (después de impuestos)' },
    def: {
      en: "Money goes in after you pay income tax on it, so there's no tax break today. Later, you can take it out tax-free, including what it earned, generally once you're 59½ or older and your Roth account has been open at least 5 years.",
      es: "El dinero entra después de que pagas el impuesto sobre la renta sobre él, así que no hay beneficio fiscal hoy. Después, puedes retirarlo libre de impuestos, incluyendo lo que ganó, generalmente una vez que tienes 59½ años o más y tu cuenta Roth ha estado abierta al menos 5 años.",
    },
  },
  {
    id: 'irsLimit',
    term: { en: 'IRS contribution limit', es: 'Límite de contribución del IRS' },
    def: {
      en: "The most you can put in from your paychecks in a year, across every job you have that year. For {year} it's {deferral}. Money your employer adds does not count toward it.",
      es: "Lo máximo que puedes aportar de tus cheques de pago en un año, sumando todos los trabajos que tengas ese año. Para {year} es {deferral}. El dinero que agrega tu empleador no cuenta para este límite.",
    },
  },
  {
    id: 'catchUp',
    term: { en: 'Catch-up contribution', es: 'Contribución de catch-up' },
    def: {
      en: "Extra savings allowed the year you turn 50 or older. In {year} that's {catchUp50} more. If you're 60 to 63 by Dec 31, the extra is {catchUp6063} instead (the 'super catch-up'). Your plan has to allow catch-ups.",
      es: "Ahorro adicional permitido el año que cumples 50 años o más. En {year} son {catchUp50} más. Si tienes entre 60 y 63 años antes del 31 de diciembre, el extra es {catchUp6063} en su lugar (el 'super catch-up'). Tu plan tiene que permitir los catch-ups.",
    },
  },
  {
    id: 'rothCatchUpRule',
    term: { en: 'Roth catch-up rule', es: 'Regla de catch-up Roth' },
    def: {
      en: "Starting in 2026, if you earned more than {rothThreshold} from your employer last year (Box 3 of your W-2), your catch-up money has to go in as Roth. Your regular savings aren't affected.",
      es: "A partir de 2026, si ganaste más de {rothThreshold} con tu empleador el año pasado (casilla 3 de tu W-2), tu dinero de catch-up debe ir como Roth. Tu ahorro regular no se ve afectado.",
    },
  },
  {
    id: 'payLimit',
    term: { en: 'Pay limit for employer money', es: 'Límite de salario para el dinero del empleador' },
    def: {
      en: "Employer contributions are figured on pay up to {compLimit} in {year}. Pay above that doesn't earn more employer money.",
      es: "Las contribuciones del empleador se calculan sobre un salario de hasta {compLimit} en {year}. El salario por encima de eso no genera más dinero del empleador.",
    },
  },
  {
    id: 'totalLimit',
    term: { en: 'Total yearly limit', es: 'Límite total anual' },
    def: {
      en: "Everything going into your account in one year, from you and your employer together, can't be more than {totalAdditions} in {year}. Catch-up savings don't count toward it.",
      es: "Todo lo que entra en tu cuenta en un año, entre tú y tu empleador juntos, no puede ser más de {totalAdditions} en {year}. El ahorro de catch-up no cuenta para este límite.",
    },
  },
  {
    id: 'trueUp',
    term: { en: 'True-up', es: 'True-up (ajuste de fin de año)' },
    def: {
      en: "If you reach the yearly limit before December, money stops coming out of your paychecks, and a match paid per paycheck can stop too. Some plans make up the missing match at year-end (a 'true-up'). Others don't. This calculator assumes no true-up.",
      es: "Si llegas al límite anual antes de diciembre, deja de salir dinero de tus cheques de pago, y un match que se paga por cheque también puede detenerse. Algunos planes completan el match que falta al final del año (un 'true-up'). Otros no. Esta calculadora supone que no hay true-up.",
    },
  },
  {
    id: 'hce',
    term: { en: 'Highly compensated employee', es: 'Empleado altamente compensado' },
    def: {
      en: "Someone who earned more than {hceThreshold} last year. In some plans, their savings can be limited or partly refunded after the plan's yearly fairness test.",
      es: "Alguien que ganó más de {hceThreshold} el año pasado. En algunos planes, su ahorro puede limitarse o devolverse parcialmente después de la prueba de equidad anual del plan.",
    },
  },
  {
    id: 'rollover',
    term: { en: 'Rollover', es: 'Rollover (transferencia)' },
    def: {
      en: "Moving money from one retirement account to another — like from an old job's 401(k) to an IRA or new employer's plan — without paying taxes. Must be done correctly (direct rollover) to avoid a tax hit.",
      es: "Mover dinero de una cuenta de retiro a otra — como de un 401(k) anterior a una IRA o plan de nuevo empleador — sin pagar impuestos. Debe hacerse correctamente (rollover directo).",
    },
  },
  {
    id: 'rmd',
    term: { en: 'Required Minimum Distribution (RMD)', es: 'Distribución Mínima Requerida (RMD)' },
    def: {
      en: "Starting at age 73, the IRS requires you to withdraw a minimum amount from your 401(k) each year, whether you need the money or not. Skipping it triggers a steep penalty.",
      es: "A partir de los 73 años, el IRS requiere que retires una cantidad mínima de tu 401(k) cada año. Saltarte el retiro activa una multa importante.",
    },
  },
  {
    id: 'hardship',
    term: { en: 'Hardship Withdrawal', es: 'Retiro por Dificultad' },
    def: {
      en: "Taking money out while still employed due to a serious financial emergency. Usually subject to income tax plus a 10% early withdrawal penalty if you're under age 59½. This is generally a last resort.",
      es: "Retirar dinero mientras sigues empleado debido a una emergencia financiera grave. Generalmente sujeto al impuesto sobre la renta más una penalidad del 10% si tienes menos de 59½ años.",
    },
  },
  {
    id: 'loan',
    term: { en: 'Plan Loan', es: 'Préstamo del Plan' },
    def: {
      en: "Borrowing from your own 401(k) balance. You repay yourself with interest. There are limits (usually up to 50% of your vested balance, max $50,000) and risks — if you leave your job, the loan may become due immediately.",
      es: "Pedir prestado de tu propio saldo del 401(k). Te reembolsas a ti mismo con intereses. Hay límites (normalmente hasta el 50% de tu saldo investido, máx $50,000) y riesgos.",
    },
  },
];

function fillPlaceholders(text: string): string {
  const { year } = getLimitYear();
  const limits = IRS_LIMITS[year];
  const vars: Record<string, string> = {
    year: String(year),
    deferral: fmtRounded(limits.deferral),
    catchUp50: fmtRounded(limits.catchUp50),
    catchUp6063: fmtRounded(limits.catchUp6063),
    compLimit: fmtRounded(limits.compLimit),
    rothThreshold: limits.rothCatchUpWageThreshold !== null ? fmtRounded(limits.rothCatchUpWageThreshold) : '',
    totalAdditions: fmtRounded(limits.totalAdditions),
    hceThreshold: fmtRounded(limits.hceThreshold),
  };
  return Object.keys(vars).reduce((acc, key) => acc.split(`{${key}}`).join(vars[key]), text);
}

export function getGlossary(lang: 'en' | 'es'): { id: TermId; term: string; def: string }[] {
  return ENTRIES.map((entry) => ({
    id: entry.id,
    term: entry.term[lang],
    def: fillPlaceholders(entry.def[lang]),
  }));
}

export function getTerm(id: TermId, lang: 'en' | 'es'): { term: string; def: string } {
  const entry = ENTRIES.find((e) => e.id === id);
  if (!entry) throw new Error(`Unknown glossary term: ${id}`);
  return { term: entry.term[lang], def: fillPlaceholders(entry.def[lang]) };
}
