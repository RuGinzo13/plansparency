// ── One glossary for every definition in the app ─────────────────────────────
// Key Terms, the calculator's definition bubbles, and anywhere else that
// explains a plan concept all read from here, so the wording and the dollar
// numbers never drift apart. Dollar placeholders are filled from
// lib/plan/irs-limits.ts for the current limit year, never type a limit by
// hand into a definition.

import { IRS_LIMITS, getLimitYear } from './plan/irs';
import { fmtRounded } from './format';
import type { StockId } from './answers/stockAnswers';

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
  | 'loan'
  | 'annualLimits'
  | 'autoEnroll'
  | 'beneficiary'
  | 'inService'
  | 'standardWithdrawal'
  | 'targetDate'
  | 'fees';

interface Localized {
  en: string;
  es: string;
}

interface GlossaryRow {
  label: Localized;
  value: string; // may hold {placeholders}
  note?: Localized;
}

interface GlossaryEntry {
  id: TermId;
  term: Localized;
  def: Localized;
  // Extra fields for the General 401(k) key terms page
  short?: Localized;
  example?: Localized;
  rows?: GlossaryRow[];
  visual?: 'vestingChart';
  rel?: TermId[];
  ask?: StockId | 'calculator';
}

const BASE_ENTRIES: GlossaryEntry[] = [
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
      en: "A guaranteed employer contribution required by law. It's immediately 100% yours, no vesting wait. Unlike a regular match, a nonelective safe harbor doesn't require you to contribute to receive it.",
      es: "Una contribución garantizada del empleador requerida por ley. Es 100% tuya inmediatamente, sin período de espera de vesting. El safe harbor no electivo no requiere que contribuyas para recibirlo.",
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
      en: "An extra employer contribution based on company performance. It's discretionary, the employer decides each year whether to give it and how much. Not guaranteed like a safe harbor.",
      es: "Una contribución adicional del empleador basada en el desempeño de la empresa. Es discrecional, el empleador decide cada año si la da y cuánto. No está garantizada como el safe harbor.",
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
      en: "Moving money from one retirement account to another, like from an old job's 401(k) to an IRA or new employer's plan, without paying taxes. Must be done correctly (direct rollover) to avoid a tax hit.",
      es: "Mover dinero de una cuenta de retiro a otra, como de un 401(k) anterior a una IRA o plan de nuevo empleador, sin pagar impuestos. Debe hacerse correctamente (rollover directo).",
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
      en: "Borrowing from your own 401(k) balance. You repay yourself with interest. There are limits (usually up to 50% of your vested balance, max $50,000) and risks, if you leave your job, the loan may become due immediately.",
      es: "Pedir prestado de tu propio saldo del 401(k). Te reembolsas a ti mismo con intereses. Hay límites (normalmente hasta el 50% de tu saldo investido, máx $50,000) y riesgos.",
    },
  },
];

// ── General 401(k) key terms (DRAFT wording, Ross reviewing, open item #48) ───
// Layered on top of the entries above. Definitions the calculator or the written
// answers also use (traditional, roth, catchUp, vestingSchedule, trueUp, ...) keep
// their wording; only their names, one-liners, examples and links are added.
type Extra = Partial<Omit<GlossaryEntry, 'id'>>;

const EXTRAS: Partial<Record<TermId, Extra>> = {
  '401k': {
    short: { en: 'A retirement account you save into from your paycheck.', es: 'Una cuenta de retiro a la que ahorras desde tu cheque de pago.' },
    def: {
      en: "A retirement savings account offered through your job. Money comes out of your paycheck automatically, before you ever see it. Depending on the plan, it can go in before-tax (Traditional), after-tax (Roth), or both.",
      es: "Una cuenta de ahorro para el retiro que te ofrece tu trabajo. El dinero sale de tu cheque de pago automáticamente, antes de que lo veas. Según el plan, puede entrar antes de impuestos (Tradicional), después de impuestos (Roth), o ambos.",
    },
    rel: ['contribution', 'eligibility', 'employerMatch'],
  },
  eligibility: {
    term: { en: 'Eligibility', es: 'Elegibilidad' },
    short: { en: 'When you can start saving, and when employer money starts.', es: 'Cuándo puedes empezar a ahorrar y cuándo empieza el dinero del empleador.' },
    def: {
      en: "The rules for when you can join the plan and when employer money starts. Some plans let you start on day one. Others make new employees wait, for example until they have worked there a few months or a year, or until they turn 21.",
      es: "Las reglas de cuándo puedes unirte al plan y cuándo empieza el dinero del empleador. Algunos planes te dejan empezar el primer día. Otros hacen esperar a los empleados nuevos, por ejemplo hasta que lleven unos meses o un año trabajando, o hasta que cumplan 21 años.",
    },
    rel: ['autoEnroll', 'employerMatch'],
    ask: 'elig',
  },
  contribution: {
    short: { en: 'The money you put in from each paycheck.', es: 'El dinero que aportas de cada cheque de pago.' },
    def: {
      en: "The money you put in from your paycheck. You pick a percent or a dollar amount, and most plans let you change it any time. It can go in as Traditional, Roth, or both, up to the yearly limits.",
      es: "El dinero que aportas de tu cheque de pago. Eliges un porcentaje o una cantidad en dólares, y la mayoría de los planes te dejan cambiarlo cuando quieras. Puede entrar como Tradicional, Roth, o ambos, hasta los límites anuales.",
    },
    example: { en: 'Save 6% of a $2,000 paycheck and $120 goes into your account.', es: 'Si ahorras el 6% de un cheque de $2,000, $120 entran a tu cuenta.' },
    rel: ['annualLimits', 'traditional', 'roth'],
    ask: 'calculator',
  },
  traditional: {
    term: { en: 'Traditional (pre-tax)', es: 'Tradicional (antes de impuestos)' },
    short: { en: 'Save before taxes. Pay taxes later.', es: 'Ahorra antes de impuestos. Paga impuestos después.' },
    example: { en: 'Save $100 before tax and your take-home pay drops by less than $100, because you pay less tax today.', es: 'Si ahorras $100 antes de impuestos, tu pago neto baja en menos de $100, porque hoy pagas menos impuestos.' },
    rel: ['roth'],
    ask: 'roth',
  },
  roth: {
    short: { en: 'Pay taxes now. Take it out tax-free later.', es: 'Paga impuestos ahora. Retíralo libre de impuestos después.' },
    example: { en: 'Save $100 after tax. Years later, that money and what it earned can come out tax-free if you follow the rules.', es: 'Ahorras $100 después de impuestos. Años después, ese dinero y lo que ganó pueden salir libres de impuestos si sigues las reglas.' },
    rel: ['traditional', 'catchUp'],
    ask: 'roth',
  },
  catchUp: {
    term: { en: 'Catch-up', es: 'Catch-up' },
    short: { en: "Extra savings once you're 50 or older.", es: 'Ahorro extra cuando tienes 50 años o más.' },
    rows: [
      { label: { en: 'Age 50+ catch-up', es: 'Catch-up de 50+' }, value: '+{catchUp50}', note: { en: 'For anyone 50 or older.', es: 'Para cualquier persona de 50 años o más.' } },
      { label: { en: 'Super catch-up, ages 60 to 63', es: 'Super catch-up, de 60 a 63 años' }, value: '+{catchUp6063}', note: { en: 'Replaces the {catchUp50} for those four years.', es: 'Reemplaza los {catchUp50} durante esos cuatro años.' } },
      { label: { en: 'Roth catch-up rule', es: 'Regla de catch-up Roth' }, value: 'Over {rothThreshold}', note: { en: 'Earned more than this from your employer last year (W-2 Box 3)? Your catch-up money must go in as Roth.', es: '¿Ganaste más de esto con tu empleador el año pasado (casilla 3 del W-2)? Tu dinero de catch-up debe entrar como Roth.' } },
    ],
    rel: ['annualLimits', 'roth'],
  },
  employerMatch: {
    term: { en: 'Employer match', es: 'Match del empleador' },
    short: { en: 'Money your employer adds when you save. Not required by law.', es: 'Dinero que tu empleador agrega cuando ahorras. La ley no lo exige.' },
    def: {
      en: "Money your employer adds based on what you save. The law doesn't require it: your employer chooses whether to offer it, how much, and can change or stop it. Some plans also ask you to work a full year, or be employed on the last day of the year, to get it.",
      es: "Dinero que tu empleador agrega según lo que ahorras. La ley no lo exige: tu empleador decide si lo ofrece, cuánto, y puede cambiarlo o suspenderlo. Algunos planes también piden que trabajes un año completo, o que estés empleado el último día del año, para recibirlo.",
    },
    example: { en: 'Earn $50,000 with a 50% match on the first 6%. Save 6% ($3,000) and your employer adds $1,500.', es: 'Ganas $50,000 con un match del 50% sobre el primer 6%. Si ahorras el 6% ($3,000), tu empleador agrega $1,500.' },
    rel: ['safeHarbor', 'vesting', 'trueUp'],
    ask: 'match',
  },
  safeHarbor: {
    term: { en: 'Safe harbor', es: 'Safe harbor' },
    short: { en: "Required employer money that's usually yours right away.", es: 'Dinero requerido del empleador que normalmente es tuyo de inmediato.' },
    def: {
      en: "Money your employer must put in every year when the plan follows safe harbor rules, as long as you're eligible. It's usually 100% yours right away. It comes either as a match on what you save, or as a set percent of your pay (usually 3%) that goes in even if you don't save.",
      es: "Dinero que tu empleador debe aportar cada año cuando el plan sigue las reglas de safe harbor, siempre que seas elegible. Normalmente es 100% tuyo de inmediato. Llega como un match de lo que ahorras, o como un porcentaje fijo de tu salario (normalmente 3%) que entra aunque no ahorres.",
    },
    rel: ['employerMatch', 'vesting'],
  },
  profitSharing: {
    short: { en: 'A yearly amount your employer may add, if it chooses.', es: 'Una cantidad anual que tu empleador puede agregar, si lo decide.' },
    def: {
      en: "An extra amount your employer may add, often based on how the company did. The employer decides each year whether to give it and how much, so it isn't guaranteed. You don't have to save anything yourself to get it.",
      es: "Una cantidad extra que tu empleador puede agregar, a menudo según cómo le fue a la empresa. El empleador decide cada año si la da y cuánto, así que no está garantizada. No tienes que ahorrar nada para recibirla.",
    },
    rel: ['vestingSchedule', 'employerMatch'],
  },
  vesting: {
    short: { en: 'How long until employer money is fully yours.', es: 'Cuánto falta para que el dinero del empleador sea totalmente tuyo.' },
    def: {
      en: "Earning full ownership of your employer's money over time. Your own savings are always 100% yours. Employer money may have a waiting period, and if you leave before it's over, you can lose part of it.",
      es: "Ganar la propiedad total del dinero de tu empleador con el tiempo. Tus propios ahorros siempre son 100% tuyos. El dinero del empleador puede tener un período de espera, y si te vas antes de que termine, puedes perder una parte.",
    },
    rel: ['vestingSchedule', 'safeHarbor'],
    ask: 'vesting',
  },
  vestingSchedule: {
    short: { en: 'The timeline for owning employer money.', es: 'El calendario para ser dueño del dinero del empleador.' },
    visual: 'vestingChart',
    rel: ['vesting', 'profitSharing'],
    ask: 'vesting',
  },
  trueUp: {
    short: { en: 'A year-end top-up of match you missed.', es: 'Un ajuste de fin de año del match que no recibiste.' },
    rel: ['employerMatch', 'annualLimits'],
  },
  loan: {
    term: { en: 'Plan loan', es: 'Préstamo del plan' },
    short: { en: 'Borrow from your 401(k) and pay yourself back.', es: 'Pide prestado de tu 401(k) y págate a ti mismo.' },
    def: {
      en: "Borrowing from your own 401(k). You pay yourself back with interest, usually from your paycheck. Most plans let you borrow up to half of what's yours, up to $50,000. If you leave your job, what you still owe may come due soon.",
      es: "Pedir prestado de tu propio 401(k). Te pagas a ti mismo con intereses, normalmente desde tu cheque de pago. La mayoría de los planes te dejan pedir hasta la mitad de lo que es tuyo, hasta $50,000. Si dejas tu trabajo, lo que aún debas puede vencer pronto.",
    },
    example: { en: '$20,000 is yours in the account. You could borrow up to $10,000.', es: '$20,000 son tuyos en la cuenta. Podrías pedir prestado hasta $10,000.' },
    rel: ['hardship', 'inService'],
    ask: 'loans',
  },
  hardship: {
    term: { en: 'Hardship withdrawal', es: 'Retiro por dificultad' },
    short: { en: 'Take money out early for a serious emergency.', es: 'Saca dinero antes de tiempo por una emergencia grave.' },
    def: {
      en: "Taking money out while you still work there, for a serious money emergency like medical bills or stopping an eviction. It's taxed as income, and if you're under 59½ there's usually an extra 10% early withdrawal tax. You don't pay it back.",
      es: "Sacar dinero mientras sigues trabajando ahí, por una emergencia de dinero grave como cuentas médicas o evitar un desalojo. Se grava como ingreso, y si tienes menos de 59½ normalmente hay un 10% extra de impuesto por retiro anticipado. No se devuelve.",
    },
    rel: ['loan', 'inService'],
    ask: 'hardship',
  },
  rollover: {
    short: { en: 'Move your 401(k) to another account without tax.', es: 'Mueve tu 401(k) a otra cuenta sin impuestos.' },
    def: {
      en: "Moving money from one retirement account to another, like from an old job's 401(k) to an IRA or your new job's plan, without paying taxes. Done directly (a \"direct rollover\"), it avoids a tax hit.",
      es: "Mover dinero de una cuenta de retiro a otra, como del 401(k) de un trabajo anterior a una IRA o al plan de tu nuevo trabajo, sin pagar impuestos. Hecho directamente (un \"rollover directo\"), evita un golpe de impuestos.",
    },
    rel: ['standardWithdrawal'],
    ask: 'leave',
  },
};

const NEW_ENTRIES: GlossaryEntry[] = [
  {
    id: 'annualLimits',
    term: { en: 'Annual limits ({year})', es: 'Límites anuales ({year})' },
    short: { en: 'The most you can save from your pay in {year}.', es: 'Lo máximo que puedes ahorrar de tu salario en {year}.' },
    def: {
      en: "The IRS caps how much you can put in from your paychecks each year, across every job you have that year. Money your employer adds doesn't count toward it. The limits usually go up each year. These are for {year}, based on your age on December 31.",
      es: "El IRS limita cuánto puedes aportar de tus cheques cada año, sumando todos los trabajos que tengas ese año. El dinero que agrega tu empleador no cuenta para este límite. Los límites suelen subir cada año. Estos son para {year}, según tu edad al 31 de diciembre.",
    },
    rows: [
      { label: { en: 'Under 50', es: 'Menos de 50' }, value: '{deferral}' },
      { label: { en: '50 to 59, or 64 and older', es: '50 a 59, o 64 en adelante' }, value: '{limit50}', note: { en: '{deferral} + {catchUp50} catch-up', es: '{deferral} + {catchUp50} de catch-up' } },
      { label: { en: '60 to 63', es: '60 a 63' }, value: '{limit6063}', note: { en: '{deferral} + {catchUp6063} super catch-up', es: '{deferral} + {catchUp6063} de super catch-up' } },
    ],
    rel: ['catchUp', 'contribution'],
    ask: 'limit',
  },
  {
    id: 'autoEnroll',
    term: { en: 'Auto-enrollment', es: 'Inscripción automática' },
    short: { en: 'Your job signs you up automatically. You can change or stop it.', es: 'Tu trabajo te inscribe automáticamente. Puedes cambiarlo o detenerlo.' },
    def: {
      en: "Some plans sign new employees up automatically, saving a set percent of each paycheck. You can pick a different amount or opt out. Many plans also raise the amount a little each year unless you say no.",
      es: "Algunos planes inscriben automáticamente a los empleados nuevos, ahorrando un porcentaje fijo de cada cheque de pago. Puedes elegir otra cantidad o salirte. Muchos planes también suben la cantidad un poco cada año, a menos que digas que no.",
    },
    example: { en: "Signed up at 3%? You can change it to 6%, or stop saving, on the plan's website.", es: '¿Te inscribieron con 3%? Puedes cambiarlo a 6%, o dejar de ahorrar, en el sitio web del plan.' },
    rel: ['contribution', 'eligibility'],
  },
  {
    id: 'beneficiary',
    term: { en: 'Beneficiary', es: 'Beneficiario' },
    short: { en: 'Who gets your account if you die.', es: 'Quién recibe tu cuenta si mueres.' },
    def: {
      en: "The person or people you name to receive your 401(k) if you die. You choose them on your plan's website and can change them any time. If you're married, your spouse is usually the beneficiary unless they sign a form agreeing to someone else.",
      es: "La persona o personas que nombras para recibir tu 401(k) si mueres. Las eliges en el sitio web de tu plan y puedes cambiarlas cuando quieras. Si estás casado, tu cónyuge normalmente es el beneficiario, a menos que firme un formulario aceptando a otra persona.",
    },
    rel: ['401k'],
  },
  {
    id: 'inService',
    term: { en: 'In-service withdrawal', es: 'Retiro en servicio' },
    short: { en: 'Taking money out while you still work there, no hardship needed.', es: 'Sacar dinero mientras sigues trabajando ahí, sin necesitar una dificultad.' },
    def: {
      en: "Some plans let you take money out while you're still working, once you reach a certain age (often 59½) or from certain money, like money you rolled in from an old plan. It's taxed as income, and under 59½ there's usually an extra 10% early withdrawal tax. Not every plan allows it.",
      es: "Algunos planes te dejan sacar dinero mientras sigues trabajando, cuando llegas a cierta edad (a menudo 59½) o de cierto dinero, como el que transferiste de un plan anterior. Se grava como ingreso, y si tienes menos de 59½ normalmente hay un 10% extra de impuesto por retiro anticipado. No todos los planes lo permiten.",
    },
    rel: ['hardship', 'standardWithdrawal'],
  },
  {
    id: 'standardWithdrawal',
    term: { en: 'Standard withdrawal', es: 'Retiro estándar' },
    short: { en: 'Taking money out after you leave your job or retire.', es: 'Sacar dinero después de dejar tu trabajo o jubilarte.' },
    def: {
      en: "Once you leave your job or retire, you can take money out of your 401(k). Traditional money is taxed as income when it comes out. Under 59½ there's usually an extra 10% early withdrawal tax, unless you left your job in or after the year you turned 55. In your 70s, the IRS requires you to start taking out a minimum amount each year.",
      es: "Cuando dejas tu trabajo o te jubilas, puedes sacar dinero de tu 401(k). El dinero Tradicional se grava como ingreso cuando sale. Si tienes menos de 59½ normalmente hay un 10% extra de impuesto por retiro anticipado, a menos que hayas dejado tu trabajo en el año en que cumpliste 55 o después. En tus 70, el IRS exige que empieces a sacar una cantidad mínima cada año.",
    },
    rel: ['rollover', 'inService'],
    ask: 'leave',
  },
  {
    id: 'targetDate',
    term: { en: 'Target-date fund', es: 'Fondo de fecha objetivo' },
    short: { en: 'One fund that adjusts itself as you near retirement.', es: 'Un fondo que se ajusta solo a medida que te acercas a la jubilación.' },
    def: {
      en: "A single fund built around the year you plan to retire, like a 2060 fund. It holds a mix of stocks and bonds and slowly shifts to less risky investments as that year gets closer.",
      es: "Un solo fondo construido alrededor del año en que planeas jubilarte, como un fondo 2060. Tiene una mezcla de acciones y bonos y poco a poco pasa a inversiones menos riesgosas a medida que se acerca ese año.",
    },
    example: { en: 'Planning to retire around 2060? A 2060 fund is built for that timeline.', es: '¿Piensas jubilarte alrededor de 2060? Un fondo 2060 está hecho para ese plazo.' },
    rel: ['fees'],
  },
  {
    id: 'fees',
    term: { en: 'Fees (expense ratio)', es: 'Comisiones (razón de gastos)' },
    short: { en: 'What a fund charges each year, as a percent of your money.', es: 'Lo que cobra un fondo cada año, como porcentaje de tu dinero.' },
    def: {
      en: "Every fund charges a yearly fee, called the expense ratio. It comes out of the fund's returns, so you never see a bill. Plans can also charge account or service fees. Lower fees leave more of your money growing.",
      es: "Cada fondo cobra una comisión anual, llamada razón de gastos. Sale de los rendimientos del fondo, así que nunca ves una factura. Los planes también pueden cobrar comisiones de cuenta o de servicio. Las comisiones más bajas dejan más de tu dinero creciendo.",
    },
    example: { en: 'A 0.50% expense ratio costs $50 a year on $10,000.', es: 'Una razón de gastos de 0.50% cuesta $50 al año sobre $10,000.' },
    rel: ['targetDate'],
  },
];

const ENTRIES: GlossaryEntry[] = [
  ...BASE_ENTRIES.map((e) => ({ ...e, ...(EXTRAS[e.id] || {}) }) as GlossaryEntry),
  ...NEW_ENTRIES,
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
    limit50: fmtRounded(limits.deferral + limits.catchUp50),
    limit6063: fmtRounded(limits.deferral + limits.catchUp6063),
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

// ── General 401(k) key terms page: order, sections and resolved entries ──────
export type KeyTermSection = 'start' | 'employer' | 'access' | 'invest';
export type KeyTermSub = 'work' | 'leave';

export const KEY_TERMS_LAYOUT: { section: KeyTermSection; sub?: KeyTermSub; child?: boolean; id: TermId }[] = [
  { section: 'start', id: '401k' },
  { section: 'start', id: 'eligibility' },
  { section: 'start', id: 'contribution' },
  { section: 'start', child: true, id: 'annualLimits' },
  { section: 'start', child: true, id: 'traditional' },
  { section: 'start', child: true, id: 'roth' },
  { section: 'start', child: true, id: 'catchUp' },
  { section: 'start', child: true, id: 'autoEnroll' },
  { section: 'start', id: 'beneficiary' },
  { section: 'employer', id: 'employerMatch' },
  { section: 'employer', id: 'safeHarbor' },
  { section: 'employer', id: 'profitSharing' },
  { section: 'employer', id: 'vesting' },
  { section: 'employer', id: 'vestingSchedule' },
  { section: 'employer', id: 'trueUp' },
  { section: 'access', sub: 'work', id: 'loan' },
  { section: 'access', sub: 'work', id: 'hardship' },
  { section: 'access', sub: 'work', id: 'inService' },
  { section: 'access', sub: 'leave', id: 'rollover' },
  { section: 'access', sub: 'leave', id: 'standardWithdrawal' },
  { section: 'invest', id: 'targetDate' },
  { section: 'invest', id: 'fees' },
];

export const KEY_TERM_SECTION_NAMES: Record<KeyTermSection, Localized> = {
  start: { en: 'Get started', es: 'Para empezar' },
  employer: { en: 'Employer money', es: 'Dinero del empleador' },
  access: { en: 'Access your money', es: 'Acceso a tu dinero' },
  invest: { en: 'Investments', es: 'Inversiones' },
};
export const KEY_TERM_SUB_NAMES: Record<KeyTermSub, Localized> = {
  work: { en: 'While you work', es: 'Mientras trabajas' },
  leave: { en: 'When you leave', es: 'Cuando te vas' },
};

export interface KeyTerm {
  id: TermId;
  section: KeyTermSection;
  sub?: KeyTermSub;
  child: boolean;
  term: string;
  short: string;
  def: string;
  example?: string;
  rows?: { label: string; value: string; note?: string }[];
  visual?: 'vestingChart';
  rel: TermId[];
  ask?: StockId | 'calculator';
}

export function getKeyTerms(lang: 'en' | 'es'): KeyTerm[] {
  const { year } = getLimitYear();
  const noThreshold = IRS_LIMITS[year].rothCatchUpWageThreshold === null;
  return KEY_TERMS_LAYOUT.map((slot) => {
    const e = ENTRIES.find((x) => x.id === slot.id);
    if (!e) throw new Error(`Unknown glossary term: ${slot.id}`);
    const rows = e.rows
      ?.filter((r) => !(noThreshold && r.value.includes('{rothThreshold}')))
      .map((r) => ({ label: fillPlaceholders(r.label[lang]), value: fillPlaceholders(r.value), note: r.note ? fillPlaceholders(r.note[lang]) : undefined }));
    return {
      id: e.id,
      section: slot.section,
      sub: slot.sub,
      child: !!slot.child,
      term: fillPlaceholders(e.term[lang]),
      short: fillPlaceholders((e.short ?? e.def)[lang]),
      def: fillPlaceholders(e.def[lang]),
      example: e.example ? fillPlaceholders(e.example[lang]) : undefined,
      rows,
      visual: e.visual,
      rel: e.rel ?? [],
      ask: e.ask,
    };
  });
}
