// ── Every word the videos say or show, in one place (DRAFT, Ross approves with #39) ──
// Captions are templates: {name} is filled from plan data by lib/videos/build.ts.
// ElevenLabs (#68) will read these same captions later (see lib/videos/narration.ts).

import type { VideoId } from './types';

type Pair = { en: string; es: string };

export const TITLES: Record<VideoId, Pair> = {
  welcome: { en: 'Welcome to your plan', es: 'Bienvenido a tu plan' },
  match: { en: 'Free money from your employer', es: 'Dinero gratis de tu empleador' },
  vesting: { en: 'Is your employer’s money yours to keep?', es: '¿Es tuyo el dinero de tu empleador?' },
  taxes: { en: 'Pre-tax or Roth: when do you pay taxes?', es: 'Antes de impuestos o Roth: ¿cuándo pagas impuestos?' },
  limits: { en: 'How much can you save?', es: '¿Cuánto puedes ahorrar?' },
  access: { en: 'Need money before you retire?', es: '¿Necesitas dinero antes de jubilarte?' },
  leave: { en: 'Leaving your job?', es: '¿Te vas de tu trabajo?' },
  tdf: { en: 'What is a target date fund?', es: '¿Qué es un fondo de fecha objetivo?' },
};

export const NEXT: Record<VideoId, Pair> = {
  welcome: { en: 'Next: pick what to learn first', es: 'Siguiente: elige qué aprender primero' },
  match: { en: 'See it with your pay', es: 'Velo con tu salario' },
  vesting: { en: 'See your vesting picture', es: 'Ver tu imagen de vesting' },
  taxes: { en: 'Open the calculator', es: 'Abrir la calculadora' },
  limits: { en: 'Open the calculator', es: 'Abrir la calculadora' },
  access: { en: 'Read the loan answer', es: 'Leer la respuesta sobre préstamos' },
  leave: { en: 'See your 4 choices', es: 'Ver tus 4 opciones' },
  tdf: { en: 'See your investment options', es: 'Ver tus opciones de inversión' },
};
// When loans aren't offered, the access video points at the hardship answer instead.
export const NEXT_HARDSHIP: Pair = { en: 'Read the hardship answer', es: 'Leer la respuesta sobre dificultades' };

export const CAPTIONS: Record<string, Pair> = {
  // 1. Welcome
  'welcome.1': { en: 'Welcome! This is your {planName}, explained in plain words.', es: '¡Bienvenido! Este es tu {planName}, explicado en palabras simples.' },
  'welcome.2': { en: 'Your employer, {employerName}, offers this plan to help you save for later in life.', es: 'Tu empleador, {employerName}, ofrece este plan para ayudarte a ahorrar para el futuro.' },
  'welcome.3': { en: '{recordkeeperName} holds your account. That’s where you log in to see your balance or change how much you save.', es: '{recordkeeperName} guarda tu cuenta. Ahí entras para ver tu saldo o cambiar cuánto ahorras.' },
  'welcome.4': { en: 'Pick what you want to learn first. Each topic has a short video, a picture and plain answers.', es: 'Elige qué quieres aprender primero. Cada tema tiene un video corto, una imagen y respuestas simples.' },
  'welcome.end': { en: 'Ready? Pick what to learn first.', es: '¿Listo? Elige qué aprender primero.' },
  // 2. Free money from your employer
  'match.1': { en: 'Your employer can add free money to your 401(k). Here’s how.', es: 'Tu empleador puede agregar dinero gratis a tu 401(k). Así funciona.' },
  'match.2': { en: 'Every paycheck, a small part of your pay goes into your 401(k). Save {tier1Pct}%, and that’s {youAtTier1} a year.', es: 'En cada pago, una pequeña parte de tu salario va a tu 401(k). Si ahorras {tier1Pct}%, son {youAtTier1} al año.' },
  'match.3': { en: '{employerName} matches it: {tier1Words}.', es: '{employerName} lo iguala: {tier1Words}.' },
  'match.3plus': { en: '{employerName} matches it: {tier1Words}. It also adds {flatWords}.', es: '{employerName} lo iguala: {tier1Words}. También agrega {flatWords}.' },
  'match.3flat': { en: '{employerName} adds {fullEmployer} a year, even if you save nothing.', es: '{employerName} agrega {fullEmployer} al año, aunque no ahorres nada.' },
  'match.4': { en: 'Save {tier2Pct}% more, and {employerLc} adds {tier2Words}.', es: 'Si ahorras {tier2Pct}% más, {employerLc} agrega {tier2Words}.' },
  'match.5': { en: 'Save {pctForFull}% in total, and {employerLc} adds {fullEmployer} a year. That’s all of it.', es: 'Si ahorras {pctForFull}% en total, {employerLc} agrega {fullEmployer} al año. Eso es todo.' },
  'match.5flat': { en: 'That’s {fullEmployer} a year on $50,000 pay. You can still save more on top.', es: 'Son {fullEmployer} al año con un salario de $50,000. Aún puedes ahorrar más por tu cuenta.' },
  'match.6': { en: 'Save less, and some of that money stays on the table. You can change how much you save anytime.', es: 'Si ahorras menos, parte de ese dinero se queda sin tomar. Puedes cambiar cuánto ahorras en cualquier momento.' },
  'match.6flat': { en: 'You can add more on top. Your own savings are always yours. You can change how much you save anytime.', es: 'Puedes agregar más por tu cuenta. Tus propios ahorros siempre son tuyos. Puedes cambiar cuánto ahorras en cualquier momento.' },
  'match.end': { en: 'Ready to try it with your pay?', es: '¿Listo para probarlo con tu salario?' },
  // 3. Vesting
  'vesting.1': { en: 'Is the money your employer adds yours to keep? It depends on how long you work there.', es: '¿Es tuyo el dinero que agrega tu empleador? Depende de cuánto tiempo trabajes ahí.' },
  'vesting.2': { en: 'First, the money you save is always 100% yours. No matter what.', es: 'Primero, el dinero que ahorras siempre es 100% tuyo. Pase lo que pase.' },
  'vesting.3': { en: 'The money your employer adds becomes yours over time. That’s called vesting.', es: 'El dinero que agrega tu empleador pasa a ser tuyo con el tiempo. Eso se llama vesting.' },
  'vesting.4': { en: '{scheduleWords}', es: '{scheduleWords}' },
  'vesting.5': { en: 'Leave after {exampleYearWords}, and you keep {examplePct}% of your employer’s money. Stay longer, and you keep more.', es: 'Si te vas después de {exampleYearWords}, te quedas con {examplePct}% del dinero de tu empleador. Si te quedas más tiempo, te quedas con más.' },
  'vesting.imm': { en: 'The money your employer adds is 100% yours right away. No waiting.', es: 'El dinero que agrega tu empleador es 100% tuyo de inmediato. Sin esperar.' },
  'vesting.end': { en: 'Ready to see your vesting picture?', es: '¿Listo para ver tu imagen de vesting?' },
  // 4. Pre-tax or Roth
  'taxes.1': { en: 'Pre-tax or Roth? The only difference is when you pay taxes.', es: '¿Antes de impuestos o Roth? La única diferencia es cuándo pagas impuestos.' },
  'taxes.2': { en: 'With pre-tax, your money goes in before taxes. Your paycheck’s taxes go down today.', es: 'Con antes de impuestos, tu dinero entra antes de pagar impuestos. Los impuestos de tu pago bajan hoy.' },
  'taxes.3': { en: 'You pay the taxes later, when you take the money out.', es: 'Pagas los impuestos después, cuando sacas el dinero.' },
  'taxes.4': { en: 'With Roth, you pay the taxes now, on the money you put in.', es: 'Con Roth, pagas los impuestos ahora, sobre el dinero que pones.' },
  'taxes.5': { en: 'Later, it can all come out tax-free, if you’re 59 and a half or older and your first Roth deposit was at least 5 years ago.', es: 'Después, todo puede salir libre de impuestos, si tienes 59 años y medio o más y tu primer depósito Roth fue hace al menos 5 años.' },
  'taxes.6': { en: 'Your plan lets you pick one or use both.', es: 'Tu plan te deja elegir una o usar las dos.' },
  'taxes.end': { en: 'Ready to try the calculator?', es: '¿Listo para probar la calculadora?' },
  // 5. Limits
  'limits.1': { en: 'There’s a yearly limit on how much you can save from your paychecks.', es: 'Hay un límite anual de cuánto puedes ahorrar de tus pagos.' },
  'limits.2': { en: 'In {year}, you can save up to {base}.', es: 'En {year}, puedes ahorrar hasta {base}.' },
  'limits.3': { en: 'At 50 or older, you can add up to {catchUp50} more. That’s called catch-up.', es: 'A los 50 años o más, puedes agregar hasta {catchUp50} más. Eso se llama catch-up.' },
  'limits.4': { en: 'At ages 60 to 63, the extra is {catchUp6063} instead.', es: 'Entre los 60 y 63 años, el extra es de {catchUp6063} en su lugar.' },
  'limits.5': { en: 'Money your employer adds doesn’t count toward your limit.', es: 'El dinero que agrega tu empleador no cuenta para tu límite.' },
  'limits.end': { en: 'Ready to try it with your pay?', es: '¿Listo para probarlo con tu salario?' },
  // 6. Access
  'access.1': { en: 'Need money before you retire? Your plan may have two ways.', es: '¿Necesitas dinero antes de jubilarte? Tu plan puede tener dos maneras.' },
  'access.1one': { en: 'Need money before you retire? Your plan may have a way.', es: '¿Necesitas dinero antes de jubilarte? Tu plan puede tener una manera.' },
  'access.2': { en: 'A loan lets you borrow from yourself. You pay it back from your paychecks, and the interest goes back into your account.', es: 'Un préstamo te deja pedir prestado de ti mismo. Lo pagas con tus pagos, y los intereses vuelven a tu cuenta.' },
  'access.3': { en: 'If you leave your job, what you still owe may be due soon.', es: 'Si dejas tu trabajo, lo que aún debes puede vencer pronto.' },
  'access.4': { en: 'A hardship withdrawal is for serious needs, like big medical bills or avoiding eviction. It’s taxed, often with a 10% extra tax if you’re under 59 and a half, and you can’t put it back.', es: 'Un retiro por dificultad es para necesidades graves, como cuentas médicas grandes o evitar un desalojo. Se grava, a menudo con un 10% extra si tienes menos de 59 años y medio, y no se puede devolver.' },
  'access.5': { en: 'Either way, money taken out now has less time to grow.', es: 'De cualquier forma, el dinero que sacas ahora tiene menos tiempo para crecer.' },
  'access.end': { en: 'Want the details?', es: '¿Quieres los detalles?' },
  // 7. Leave
  'leave.1': { en: 'Leaving your job? Your 401(k) money comes with you.', es: '¿Te vas de tu trabajo? Tu dinero del 401(k) se va contigo.' },
  'leave.2': { en: 'Your own savings are always yours. Of your employer’s money, you keep the part you own.', es: 'Tus propios ahorros siempre son tuyos. Del dinero de tu empleador, te quedas con la parte que ya es tuya.' },
  'leave.2general': { en: 'Your own savings are always yours to take with you.', es: 'Tus propios ahorros siempre son tuyos para llevártelos.' },
  'leave.3': { en: 'You can leave it in the plan, move it to your new job’s plan, or move it to an IRA. Moved directly, none of these is taxed now.', es: 'Puedes dejarlo en el plan, moverlo al plan de tu nuevo trabajo, o moverlo a una IRA. Si se mueve directo, ninguna de estas opciones paga impuestos ahora.' },
  'leave.4': { en: 'Or you can cash it out. That’s taxed, and usually there’s a 10% extra tax if you’re under 59 and a half.', es: 'O puedes retirarlo en efectivo. Eso se grava, y normalmente hay un 10% extra si tienes menos de 59 años y medio.' },
  'leave.5': { en: 'Take your time choosing. Your plan’s website walks you through the steps.', es: 'Tómate tu tiempo para elegir. El sitio web de tu plan te guía en los pasos.' },
  'leave.end': { en: 'Ready to see your choices?', es: '¿Listo para ver tus opciones?' },
  // 8. Target date fund
  'tdf.1': { en: 'What’s a target date fund? It’s one fund built around the year you plan to retire.', es: '¿Qué es un fondo de fecha objetivo? Es un fondo construido alrededor del año en que planeas jubilarte.' },
  'tdf.2': { en: 'You pick the fund with the year closest to when you plan to stop working, like 2060.', es: 'Eliges el fondo con el año más cercano a cuando planeas dejar de trabajar, como 2060.' },
  'tdf.3': { en: 'Early on, it holds more stocks, which can grow more but go up and down more.', es: 'Al principio tiene más acciones, que pueden crecer más pero suben y bajan más.' },
  'tdf.4': { en: 'As the year gets closer, it shifts to more bonds, which usually move less.', es: 'Cuando el año se acerca, cambia a más bonos, que normalmente se mueven menos.' },
  'tdf.5': { en: 'One fund that adjusts over time. Check its fees and what’s inside before you choose. Education only, not advice.', es: 'Un fondo que se ajusta con el tiempo. Revisa sus comisiones y lo que contiene antes de elegir. Solo educación, no consejos.' },
  'tdf.end': { en: 'Ready to look at your options?', es: '¿Listo para ver tus opciones?' },
};

// Words shown inside the pictures (not read as captions).
export const ART = {
  you: { en: 'You', es: 'Tú' },
  yearlyCounter: { en: 'a year', es: 'al año' },
  jarYour401k: { en: 'Your 401(k)', es: 'Tu 401(k)' },
  everyYear: { en: 'Every year, on $50,000 pay', es: 'Cada año, con un salario de $50,000' },
  youSave: { en: 'You save', es: 'Tú ahorras' },
  employerAdds: { en: 'Employer adds', es: 'El empleador agrega' },
  yoursAlways: { en: '100% yours, always', es: '100% tuyo, siempre' },
  yoursRightAway: { en: '100% yours right away', es: '100% tuyo de inmediato' },
  preTax: { en: 'Pre-tax', es: 'Antes de impuestos' },
  noTaxNow: { en: 'No tax now', es: 'Sin impuesto ahora' },
  taxedThen: { en: 'Taxed then', es: 'Con impuesto entonces' },
  taxedNow: { en: 'Taxed now', es: 'Con impuesto ahora' },
  taxFree: { en: 'Tax-free*', es: 'Libre de impuestos*' },
  rothFootnote: { en: '* 59½ or older, first Roth deposit at least 5 years ago', es: '* 59½ o más, primer depósito Roth hace al menos 5 años' },
  age50: { en: 'Age 50+', es: '50 años o más' },
  age6063: { en: 'Ages 60 to 63', es: '60 a 63 años' },
  limitLine: { en: 'Your limit', es: 'Tu límite' },
  employerNoCount: { en: 'Employer money', es: 'Dinero del empleador' },
  leaveIt: { en: 'Leave it', es: 'Déjalo' },
  newPlan: { en: 'New job’s plan', es: 'Plan nuevo' },
  ira: { en: 'IRA', es: 'IRA' },
  cashOut: { en: 'Cash it out', es: 'Retíralo' },
  penalty: { en: '10% if under 59½', es: '10% si tienes menos de 59½' },
  stocks: { en: 'Stocks', es: 'Acciones' },
  bonds: { en: 'Bonds', es: 'Bonos' },
  earlyMore: { en: 'Early on: more stocks, to grow', es: 'Al principio: más acciones, para crecer' },
  laterMore: { en: 'Closer to retirement: more bonds, to steady it', es: 'Más cerca de la jubilación: más bonos, para dar estabilidad' },
  checkFees: { en: 'Check the fees and what’s inside', es: 'Revisa las comisiones y lo que contiene' },
  lessNow: { en: 'Less now means less later', es: 'Menos ahora significa menos después' },
  interestBack: { en: '+ interest goes back to you', es: '+ el interés vuelve a ti' },
  taxed: { en: 'Taxed', es: 'Con impuesto' },
  pickTopic: { en: 'Pick a topic', es: 'Elige un tema' },
  watchRead: { en: 'Watch or read', es: 'Mira o lee' },
  tryCalc: { en: 'Try the calculator', es: 'Prueba la calculadora' },
  logIn: { en: 'Log in', es: 'Entrar' },
  doorPreTax: { en: 'Pre-tax', es: 'Antes de impuestos' },
  doorRoth: { en: 'Roth', es: 'Roth' },
  noTax: { en: 'No tax', es: 'Sin impuesto' },
} satisfies Record<string, Pair>;
