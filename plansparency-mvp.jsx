import { useState, useRef, useEffect } from "react";

// ── Colors ──
const C = {
  bg: "#0F1621", surface: "#171F2D", surfaceAlt: "#1C2536",
  border: "#283042", borderLight: "#344058",
  accent: "#D4A853", accentDim: "rgba(212,168,83,.12)", accentGlow: "rgba(212,168,83,.25)",
  green: "#5CB88A", greenDim: "rgba(92,184,138,.12)", greenGlow: "rgba(92,184,138,.22)",
  text: "#F0ECE3", textMuted: "#94A0B2", textDim: "#536178",
  userBubble: "#1E2B3D", aiBubble: "#171F2D",
  warning: "#D4A843", danger: "#D46A5A", dangerDim: "rgba(212,106,90,.12)",
  // High-contrast calculator
  calcBg: "#FBF7F0", calcBorder: "#D4A853", calcText: "#2C1810",
  calcMuted: "#7A6B5D", calcCard: "#F3EDE3", calcCardBorder: "#E0D5C5",
  calcInput: "#FFFFFF", calcInputBorder: "#C8BFAE",
};
const F = { display: "'Cormorant Garamond','Georgia',serif", body: "'DM Sans','Segoe UI',sans-serif" };

// ── i18n ──
const i18n = {
  en: {
    heroLine1: "Your 401(k),", tagline: "crystal clear",
    subtitle: "Upload your plan document or enrollment booklet. Ask anything. Finally understand your retirement plan.",
    dropTitle: "Drop your plan document here",
    dropSub: "PDF — Summary Plan Description (SPD) or Enrollment Booklet",
    trustPrivate: "Document never stored", trustEducation: "Education only, never advice",
    trustPlain: "Plain English answers", trustEncrypted: "Encrypted in transit",
    readingTitle: "Making your plan transparent...",
    readingSubPrefix: "Reading through", readingSubSuffix: "so you don't have to",
    disclaimer: "Education only — not financial advice",
    inputPlaceholder: "Ask about your plan...",
    footerDisclaimer: "Plansparency provides education about your plan, not personalized financial advice.",
    firstMessage: `I just uploaded my 401(k) plan document. Please read through it and give me a brief welcome summary of my plan — plan name, employer contribution types (distinguish safe harbor from discretionary match and profit sharing), vesting schedule, and one standout feature. Mention Roth and catch-up availability.

IMPORTANT — include at the very end of your response a hidden data block on its own line in this EXACT format:
<!--PLANDATA:{"matchTiers":[{"pct":100,"upTo":4}],"hasRoth":true,"planAllowsCatchUp":true,"noMatch":false,"recordkeeperUrl":"https://www.example.com","recordkeeperName":"Example","lastDayProvision":false,"planName":"Example 401(k) Plan","contribEligibility":{"requirement":"Age 21 and 1 year of service","entryDates":"First day of the month following eligibility","autoEnroll":false,"autoEnrollPct":0},"matchEligibility":{"requirement":"1 year of service","entryDates":"Same as contribution eligibility","immediateMatch":false},"vestingSchedule":"6-year graded: 20% per year","loanAvailable":true,"rothAvailable":true,"hardshipAvailable":true,"investmentOptions":"Self-directed with target-date funds available","distributionInfo":{"inServiceAge":59.5,"rmdAge":73,"rolloversIn":true,"separationOptions":"Lump sum, installments, or rollover to IRA/other plan"},"safeHarbor":{"type":"none","formula":"","vestingImmediate":true},"profitSharing":{"available":false,"type":"discretionary","formula":"","lastDayApplies":false},"fundsData":[]}-->

Fill in based on the actual plan document:
- matchTiers: array of DISCRETIONARY match tiers ONLY with "pct" (match %) and "upTo" (% of pay). Do NOT include safe harbor match here.
- hasRoth: does the plan allow Roth elective deferrals?
- planAllowsCatchUp: does the plan document allow catch-up contributions for eligible participants?
- noMatch: true ONLY if there is NO discretionary employer match (safe harbor match does NOT go here)
- recordkeeperUrl: the URL where participants log in to manage their account
- recordkeeperName: the name of the recordkeeper/plan provider
- lastDayProvision: does the plan require employment on the last day of the plan year for DISCRETIONARY contributions (match and/or profit sharing)? This NEVER applies to safe harbor contributions.
- planName: the official name of the plan
- contribEligibility: object with requirement (age/service needed to START contributing your own money), entryDates (when you can actually enter the plan), autoEnroll (does the plan auto-enroll?), autoEnrollPct (default auto-enroll percentage, 0 if none)
- matchEligibility: object with requirement (what you need to qualify for the DISCRETIONARY employer match — may differ from contribution eligibility), entryDates (when match begins), immediateMatch (does match start immediately or require separate eligibility?)
- vestingSchedule: describe the vesting schedule in plain language — note that safe harbor contributions are ALWAYS 100% immediately vested
- loanAvailable: can participants take a plan loan?
- rothAvailable: are Roth contributions available?
- hardshipAvailable: are hardship withdrawals available?
- investmentOptions: brief description of investment options available
- distributionInfo: object with inServiceAge, rmdAge, rolloversIn, separationOptions
- safeHarbor: object describing safe harbor contributions — CRITICAL to identify correctly:
  * type: "none" if no safe harbor, "nonelective" if employer contributes 3% of pay regardless of employee contributions, "basic_match" if 100% of first 3% + 50% of next 2%, "enhanced_match" if enhanced safe harbor match (e.g. 100% of first 4% or higher), "qaca" if Qualified Automatic Contribution Arrangement
  * formula: plain-language description of the safe harbor formula (e.g. "3% of compensation regardless of whether you contribute" or "100% match on first 3%, 50% on next 2%")
  * vestingImmediate: always true for safe harbor (safe harbor contributions are ALWAYS 100% immediately vested by law, except QACA which can have up to 2-year cliff)
- profitSharing: object describing profit sharing contributions:
  * available: true if the plan allows profit sharing contributions
  * type: "discretionary" if employer decides each year, "fixed" if it's a set formula
  * formula: description of the profit sharing formula if specified, or "Discretionary — employer decides annually"
  * lastDayApplies: does the last-day-of-year provision apply to profit sharing?
- fundsData: array of fund objects. ONLY populate if the document contains an explicit fund lineup, menu, or investment option table. If no fund list exists in the document, return "fundsData": []. For each fund found, include:
  * name: fund name exactly as printed in the document
  * category: must be one of exactly these values — "Cash & Stable Value", "Bonds", "Large Cap", "Mid Cap", "Small Cap", "International", "Specialty", "Asset Allocation", "Target Date"
  * expenseRatio: annual expense ratio as a decimal (e.g. 0.0045 for 0.45%) if explicitly stated in the document — otherwise null
  * factSheetUrl: the fund company's official fact sheet or fund detail page URL. ONLY include if you are certain of the exact URL for this specific fund and share class. For Vanguard funds use: https://investor.vanguard.com/investment-products/mutual-funds/profile/{TICKER}#overview. For iShares ETFs: https://www.ishares.com/us/products/{TICKER}/. For Fidelity funds: https://fundresearch.fidelity.com/mutual-funds/summary/{TICKER}. For all other fund families, return null. NEVER guess a URL — return null when uncertain. A missing link is better than a broken one.`,
    errorRead: "Something went wrong reading your document. Please try again.",
    errorReply: "The document you uploaded may not contain that specific answer. Try uploading additional plan documents for more detail, or log into your account for more information.",
    errorFormat: "Please upload a PDF file of your plan document.",
    clearSession: "End Session & Clear Data",
    clearConfirmTitle: "End this session?",
    clearConfirmBody: "This will permanently erase your plan document and conversation from memory.",
    clearConfirmYes: "Yes, clear everything", clearConfirmNo: "Keep my session",
    clearedTitle: "Session cleared",
    clearedBody: "Your document and conversation have been erased. No data was saved.",
    clearedButton: "Start over",
    privacyTitle: "How we handle your document",
    privacyIntro: "Before you upload, here's what happens:",
    privacyPoints: [
      ["Your document is never stored.", "Held in temporary browser memory only. Gone when you close the tab."],
      ["Sent to our AI provider via HTTPS.", "Anthropic processes it to answer your questions. They don't use your data for training."],
      ["No accounts, no tracking.", "No login, no profiles, nothing saved."],
      ["Not personal financial data.", "SPDs and enrollment booklets describe plan rules, not your individual balance or SSN."],
    ],
    privacyAgree: "I understand — let me upload", privacyCancel: "Go back",
    securityBadge: "Session-only • No data stored",
    calcTitle: "Contribution & Match Calculator",
    calcSalary: "Annual Salary", calcDob: "Date of Birth",
    calcContribution: "Your Contribution Rate",
    calcMatchFormula: "Discretionary Match Formula",
    calcNoMatch: "No discretionary employer match. Check if your plan has a safe harbor contribution instead.",
    calcYourContrib: "Your annual contribution", calcEmployerMatch: "Employer match",
    calcTotal: "Total saved / year", calcPerPaycheck: "Your per-paycheck contribution",
    calcPayPeriod: "Pay period",
    calcBiweekly: "Biweekly (26)", calcSemimonthly: "Semi-monthly (24)",
    calcMonthly: "Monthly (12)", calcWeekly: "Weekly (52)",
    calcIrsLimit: "IRS Annual Limit",
    calcCatchUp: "Catch-Up Eligible",
    calcRothAvail: "Roth Available",
    calcPreTax: "Pre-Tax Available",
    calcYes: "Yes", calcNo: "No",
    calcEnterDob: "Enter DOB",
    calcSecureNote: "Contribution limits reflect current IRS guidelines and SECURE 2.0 Act provisions. Ages 60–63 qualify for enhanced catch-up contributions ($11,250 vs. $7,500).",
    calcLastDayYes: "This plan requires employment on the last day of the plan year to receive DISCRETIONARY employer contributions (match and/or profit sharing). This does NOT apply to safe harbor contributions — safe harbor money is yours regardless of your employment date.",
    calcLastDayNo: "This plan does not require employment on the last day of the plan year for discretionary matching contributions.",
    calcNote: "For education only. Verify all details with your plan administrator or HR department.",
    calcWaiting: "Upload a plan document to auto-detect your match formula and plan features",
    calcCatchUpNotAllowed: "Plan does not permit catch-up",
    quickAsks: [
      "How does the employer match work?",
      "When am I fully vested?",
      "Can I take a loan from my 401(k)?",
      "What happens to my paycheck if I contribute 6%?",
      "What investment options do I have?",
      "How do I enroll in the plan?",
    ],
    // Dashboard / TOC
    dashWelcome: "Your Plan Guide",
    dashSubtitle: "Tap any section to explore it in detail",
    dashUploadAnother: "Upload Another Document",
    dashStartChat: "Ask Your Own Question",
    suggestionTitle: "Submit an Improvement Suggestion",
    suggestionTopic: "Topic",
    suggestionDetails: "Details",
    suggestionSubmit: "Submit Suggestion",
    suggestionThanks: "Thanks! Suggestion submitted.",
    suggestionAdd: "Add Another Suggestion",
    suggestionTopicPlaceholder: "e.g. Loan process, Roth explanation...",
    suggestionDetailsPlaceholder: "What would you like to see improved or explained differently?",
  },
  es: {
    heroLine1: "Tu 401(k),", tagline: "totalmente claro",
    subtitle: "Sube tu documento del plan o folleto de inscripción. Pregunta lo que quieras.",
    dropTitle: "Arrastra tu documento aquí",
    dropSub: "PDF — Descripción del Plan (SPD) o Folleto de Inscripción",
    trustPrivate: "Documento nunca almacenado", trustEducation: "Solo educación",
    trustPlain: "Respuestas claras", trustEncrypted: "Cifrado en tránsito",
    readingTitle: "Haciendo tu plan transparente...",
    readingSubPrefix: "Leyendo", readingSubSuffix: "para que tú no tengas que",
    disclaimer: "Solo educación — no asesoría",
    inputPlaceholder: "Pregunta sobre tu plan...",
    footerDisclaimer: "Plansparency ofrece educación, no asesoría financiera personalizada.",
    firstMessage: `Acabo de subir mi documento de plan 401(k). Dame un resumen de bienvenida — nombre del plan, tipos de contribución del empleador (distingue safe harbor de match discrecional y profit sharing), calendario de vesting, y una característica destacada. Menciona disponibilidad de Roth y catch-up. Responde en español.

IMPORTANTE — al final incluye en una línea:
<!--PLANDATA:{"matchTiers":[{"pct":100,"upTo":4}],"hasRoth":true,"planAllowsCatchUp":true,"noMatch":false,"recordkeeperUrl":"https://www.example.com","recordkeeperName":"Example","lastDayProvision":false,"planName":"Plan 401(k) Ejemplo","contribEligibility":{"requirement":"21 años y 1 año de servicio","entryDates":"Primer día del mes siguiente","autoEnroll":false,"autoEnrollPct":0},"matchEligibility":{"requirement":"1 año de servicio","entryDates":"Igual que elegibilidad de contribución","immediateMatch":false},"vestingSchedule":"6 años gradual: 20% por año","loanAvailable":true,"rothAvailable":true,"hardshipAvailable":true,"investmentOptions":"Auto-dirigido con fondos de fecha objetivo","distributionInfo":{"inServiceAge":59.5,"rmdAge":73,"rolloversIn":true,"separationOptions":"Suma global, cuotas, o transferencia a IRA/otro plan"},"safeHarbor":{"type":"none","formula":"","vestingImmediate":true},"profitSharing":{"available":false,"type":"discretionary","formula":"","lastDayApplies":false},"fundsData":[]}-->
Llena según el plan real. matchTiers = solo match DISCRECIONAL. safeHarbor y profitSharing son campos separados.
- fundsData: array of fund objects. ONLY populate if the document contains an explicit fund lineup, menu, or investment option table. If no fund list exists in the document, return "fundsData": []. For each fund found, include:
  * name: fund name exactly as printed in the document
  * category: must be one of exactly these values — "Cash & Stable Value", "Bonds", "Large Cap", "Mid Cap", "Small Cap", "International", "Specialty", "Asset Allocation", "Target Date"
  * expenseRatio: annual expense ratio as a decimal (e.g. 0.0045 for 0.45%) if explicitly stated in the document — otherwise null
  * factSheetUrl: the fund company's official fact sheet or fund detail page URL. ONLY include if you are certain of the exact URL for this specific fund and share class. For Vanguard funds use: https://investor.vanguard.com/investment-products/mutual-funds/profile/{TICKER}#overview. For iShares ETFs: https://www.ishares.com/us/products/{TICKER}/. For Fidelity funds: https://fundresearch.fidelity.com/mutual-funds/summary/{TICKER}. For all other fund families, return null. NEVER guess a URL — return null when uncertain. A missing link is better than a broken one.`,
    errorRead: "Error al leer. Intenta de nuevo.",
    errorReply: "Es posible que el documento que subiste no contenga esa respuesta específica.",
    errorFormat: "Sube un PDF.",
    clearSession: "Terminar sesión",
    clearConfirmTitle: "¿Terminar?", clearConfirmBody: "Se borrará todo permanentemente.",
    clearConfirmYes: "Sí, borrar", clearConfirmNo: "No, mantener",
    clearedTitle: "Sesión terminada", clearedBody: "Todo borrado.", clearedButton: "Empezar de nuevo",
    privacyTitle: "Cómo manejamos tu documento", privacyIntro: "Antes de subir:",
    privacyPoints: [
      ["Nunca se almacena.", "Solo en memoria temporal del navegador."],
      ["Se envía vía HTTPS.", "Anthropic lo procesa pero no usa tus datos para entrenamiento."],
      ["Sin cuentas ni rastreo.", "Nada se guarda."],
      ["No son datos personales.", "Los SPD describen reglas del plan, no tu saldo."],
    ],
    privacyAgree: "Entiendo — subir", privacyCancel: "Regresar",
    securityBadge: "Solo sesión • Sin datos",
    calcTitle: "Calculadora de Contribuciones",
    calcSalary: "Salario Anual", calcDob: "Fecha de Nacimiento",
    calcContribution: "Tu Tasa de Contribución",
    calcMatchFormula: "Fórmula de Match Discrecional",
    calcNoMatch: "Sin match discrecional. Verifica si tu plan tiene contribución safe harbor.",
    calcYourContrib: "Tu contribución anual", calcEmployerMatch: "Match del empleador",
    calcTotal: "Total ahorrado / año", calcPerPaycheck: "Tu contribución por cheque",
    calcPayPeriod: "Período de pago",
    calcBiweekly: "Quincenal (26)", calcSemimonthly: "Bimensual (24)",
    calcMonthly: "Mensual (12)", calcWeekly: "Semanal (52)",
    calcIrsLimit: "Límite Anual IRS", calcCatchUp: "Contribución Adicional",
    calcRothAvail: "Roth Disponible", calcPreTax: "Pre-Impuesto",
    calcYes: "Sí", calcNo: "No",
    calcEnterDob: "Ingresa fecha",
    calcSecureNote: "Límites reflejan provisiones del IRS y SECURE 2.0. Edades 60–63 califican para contribuciones adicionales mejoradas ($11,250 vs. $7,500).",
    calcLastDayYes: "Este plan requiere empleo en el último día del año del plan para recibir contribuciones DISCRECIONALES del empleador (match y/o profit sharing). Esto NO aplica a contribuciones safe harbor — el dinero safe harbor es tuyo sin importar la fecha.",
    calcLastDayNo: "Este plan no requiere empleo en el último día del año del plan para contribuciones discrecionales.",
    calcNote: "Solo educativa. Verifica con tu administrador del plan o recursos humanos.",
    calcWaiting: "Sube un documento para detectar tu fórmula de match",
    calcCatchUpNotAllowed: "El plan no permite catch-up",
    quickAsks: [
      "¿Cómo funciona el match del empleador?",
      "¿Cuándo estoy completamente investido?",
      "¿Puedo tomar un préstamo?",
      "¿Qué pasa con mi cheque si contribuyo 6%?",
      "¿Qué opciones de inversión tengo?",
      "¿Cómo me inscribo en el plan?",
    ],
    dashWelcome: "Tu Guía del Plan",
    dashSubtitle: "Toca cualquier sección para explorarla",
    dashUploadAnother: "Subir Otro Documento",
    dashStartChat: "Haz Tu Propia Pregunta",
    suggestionTitle: "Enviar Sugerencia de Mejora",
    suggestionTopic: "Tema",
    suggestionDetails: "Detalles",
    suggestionSubmit: "Enviar Sugerencia",
    suggestionThanks: "¡Gracias! Sugerencia enviada.",
    suggestionAdd: "Agregar Otra Sugerencia",
    suggestionTopicPlaceholder: "ej. Proceso de préstamo, explicación Roth...",
    suggestionDetailsPlaceholder: "¿Qué te gustaría que se mejore o explique diferente?",
  },
};

// ── System Prompt ──
function getSystemPrompt(lang, planData) {
  const acctUrl = planData?.recordkeeperUrl || "";
  const acctName = planData?.recordkeeperName || "your plan's recordkeeper";
  const acctBlock = acctUrl ? `
ACCOUNT MANAGEMENT QUESTIONS: For ANY question about changing contributions, changing investments, taking a loan, taking a withdrawal, taking a distribution, processing a rollover, or any other account management action, tell the participant they can do this by logging into their account. Provide this link: ${acctUrl} and tell them to log in at ${acctName}. Frame it helpfully. ALWAYS include the URL.` : "";

  const shared = `CRITICAL GUARDRAILS:
1. EDUCATION only, never ADVICE. 2. Never say "you should" — say "your plan allows..."
3. Redirect advice-seeking to education. 4. Never provide tax advice. 5. Never recommend investments.
6. Use $50K salary example for match math. 8. Keep responses concise. 9. Suggest 1-2 follow-ups.
10. Never repeat PII from the document.

The document may be a Summary Plan Description (SPD) OR an Enrollment Booklet. Both contain plan provisions.
${acctBlock}

ANSWERING QUESTIONS: The participant's plan document has already been uploaded and is in the conversation. ALWAYS answer questions based on the actual plan document content. Look thoroughly through the document before concluding information isn't available.

ONLY use this fallback if you have genuinely searched the entire document and the information is truly not there: "The document you uploaded may not contain that specific answer. Try uploading additional plan documents for more detail, or log into your account for more information."

===== CRITICAL: EMPLOYER CONTRIBUTION TYPES ARE NOT THE SAME THING =====
ALWAYS distinguish between these three types of employer contributions. They have different rules, different vesting, and different conditions:

1. SAFE HARBOR CONTRIBUTIONS — guaranteed by the employer to meet IRS safe harbor requirements.
   - Types: Non-elective (employer contributes 3% of pay regardless of employee contributions), Basic Match (100% of first 3% + 50% of next 2%), Enhanced Match (e.g. 100% of first 4%+), QACA
   - ALWAYS 100% immediately vested (except QACA which may have up to 2-year cliff vesting)
   - The last-day-of-year employment provision does NOT apply to safe harbor contributions
   - Safe harbor contributions cannot be forfeited based on employment date

2. DISCRETIONARY MATCH — employer chooses to match employee contributions, but it's not guaranteed.
   - Subject to a vesting schedule (may take years to be fully yours)
   - MAY be subject to last-day-of-year employment requirement
   - Employer can change or eliminate the match

3. PROFIT SHARING — a separate discretionary employer contribution, not based on employee contributions.
   - Employer decides each year whether to contribute and how much
   - Subject to its own vesting schedule
   - MAY be subject to last-day-of-year employment requirement
   - Completely separate from both safe harbor and match

EVERY TIME you discuss employer contributions, vesting, or the last-day-of-year provision, you MUST clearly state which type of contribution you are referring to. Never lump them together.

When discussing LAST-DAY-OF-YEAR provisions: ALWAYS explicitly state that this provision applies ONLY to discretionary contributions (match and/or profit sharing) and does NOT apply to safe harbor contributions. Safe harbor money is yours regardless of your employment date.

When discussing VESTING: ALWAYS distinguish that safe harbor contributions are immediately vested (100% yours from day one), while discretionary match and profit sharing may follow a vesting schedule.
=====

When answering questions about eligibility, ALWAYS clearly distinguish between:
- CONTRIBUTION ELIGIBILITY: When an employee can start putting their own money into the plan
- MATCH ELIGIBILITY: When the employer starts matching (may have different or additional requirements)
Make this distinction crystal clear every time eligibility comes up.

TOPIC-SPECIFIC GUIDANCE:
- ROTH vs PRE-TAX: Explain what each means in plain language. Pre-tax = money goes in before taxes, you pay taxes when you withdraw in retirement. Roth = money goes in after taxes, but grows and comes out tax-free in retirement. Then state what THIS plan offers based on the document.
- VESTING: Explain what vesting means (how much of employer contributions you get to keep if you leave). State the specific schedule from the document. ALWAYS note which contributions are immediately vested (safe harbor) vs which follow the vesting schedule (discretionary match, profit sharing).
- EMPLOYER MATCH: First clarify whether this is a safe harbor match or discretionary match. Explain the formula from the document with a clear dollar example using a $50K salary. Mention the calculator is available for personalized numbers.
- SAFE HARBOR: Explain what safe harbor means — it's a guaranteed contribution from the employer that is immediately yours (100% vested from day one). Explain the specific safe harbor formula in this plan. Emphasize that unlike discretionary match, safe harbor cannot be taken away and is not subject to last-day-of-year provisions.
- PROFIT SHARING: Explain that this is a separate employer contribution that is discretionary — the employer decides each year. It has its own vesting schedule and may have a last-day-of-year requirement.
- LOANS: Explain the plan's loan provisions from the document — availability, limits, repayment terms.
- HARDSHIP WITHDRAWALS: Explain what qualifies and the plan's specific rules.
- INVESTMENT OPTIONS: Describe what's available in the plan based on the document.
- ENROLLMENT: Explain how to enroll based on the document, including the recordkeeper website if available.
- WITHDRAWALS, DISTRIBUTIONS & ROLLOVERS: This is a critical topic — cover ALL of these clearly:
  * In-service withdrawals: Can participants take money out while still employed? At what age (typically 59½)? Explain the 10% early withdrawal penalty for under 59½ and that withdrawals are taxed as income.
  * Separation from employment: When someone leaves the job (quit, layoff, retirement), explain ALL options — lump sum, installments, leaving money in the plan, rolling over to an IRA or new employer's plan. Note that the vesting schedule affects how much of discretionary employer contributions they keep — but safe harbor is always 100% theirs.
  * Rollovers IN: Does this plan accept rollovers from other qualified plans or IRAs?
  * Rollovers OUT: Explain that participants can roll their balance to an IRA or new employer plan, typically tax-free if done as a direct rollover.
  * Required Minimum Distributions (RMDs): Explain that participants must start withdrawing at age 73 (per SECURE 2.0), unless still working for the employer sponsoring the plan.
  * Age 59½ rule: Clearly explain this is the age when early withdrawal penalties typically stop.
  * Always note that age AND employment status both affect what options are available.

OPENING (first message only): Brief summary — plan name, employer contribution types (clearly distinguish safe harbor from discretionary match and profit sharing if applicable), vesting, one standout feature. Mention Roth and catch-up availability.

PLANDATA BLOCK: Only include on your FIRST response. At the very end (after all human-readable content), include on its own line:
<!--PLANDATA:{"matchTiers":[...],"hasRoth":true,...,"safeHarbor":{...},"profitSharing":{...}}-->
Fill from the actual document. matchTiers = DISCRETIONARY match only. Do NOT include PLANDATA on follow-up responses.`;

  if (lang === "es") return `You are Plansparency. RESPOND IN SPANISH except PLANDATA block. Use tú. Bridge terms: Spanish (English).\n\n${shared}`;
  return `You are Plansparency — "plan" + "transparency." Warm, casual, zero condescension. Real dollar examples.\n\n${shared}`;
}

// ── IRS Limits (SECURE 2.0) ──
function getIRSLimits(dob) {
  if (!dob) return { base: 23500, catchUp: 0, total: 23500, catchUpEligible: false, enhanced: false, age: null };
  const today = new Date(); const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  const base = 23500;
  if (age >= 60 && age <= 63) return { base, catchUp: 11250, total: base + 11250, catchUpEligible: true, enhanced: true, age };
  if (age >= 50) return { base, catchUp: 7500, total: base + 7500, catchUpEligible: true, enhanced: false, age };
  return { base, catchUp: 0, total: base, catchUpEligible: false, enhanced: false, age };
}

// ── Helpers ──
function fileToBase64(f) { return new Promise((r, j) => { const x = new FileReader(); x.onload = () => r(x.result.split(",")[1]); x.onerror = () => j(new Error("fail")); x.readAsDataURL(f); }); }
async function callClaude(msgs, pdf, lang, planData) {
  const am = msgs.map((m, i) => i === 0 && pdf ? { role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf } }, { type: "text", text: m.content }] } : { role: m.role, content: m.content });
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: getSystemPrompt(lang, planData), messages: am }) });
  const d = await r.json(); if (d.error) throw new Error(d.error.message);
  return d.content.filter(b => b.type === "text").map(b => b.text).join("\n");
}
function parsePlanData(text) { const m = text.match(/<!--PLANDATA:(.*?)-->/); if (!m) return null; try { return JSON.parse(m[1]); } catch { return null; } }
function stripPlanData(text) { return text.replace(/<!--PLANDATA:.*?-->/g, "").trim(); }

// ── Markdown ──
function Md({ text }) {
  const lines = text.split("\n"), els = []; let li = [];
  const flush = () => { if (li.length) { els.push(<ul key={`u${els.length}`} style={{ margin: "8px 0", paddingLeft: 20 }}>{li.map((x, i) => <li key={i} style={{ marginBottom: 4, color: C.text }}><Fm t={x} /></li>)}</ul>); li = []; } };
  lines.forEach((l, i) => { const b = l.match(/^[\-\*•]\s+(.*)/), n = l.match(/^\d+[\.\)]\s+(.*)/); if (b) { li.push(b[1]); return; } if (n) { li.push(n[1]); return; } flush(); if (!l.trim()) els.push(<div key={i} style={{ height: 8 }} />); else els.push(<p key={i} style={{ margin: "4px 0", lineHeight: 1.6, color: C.text }}><Fm t={l} /></p>); }); flush(); return <>{els}</>;
}
function Fm({ t }) { const p = t.split(/(\*\*.*?\*\*)/g); return <>{p.map((s, i) => s.startsWith("**") && s.endsWith("**") ? <strong key={i} style={{ color: C.accent }}>{s.slice(2, -2)}</strong> : <span key={i}>{s}</span>)}</>; }

// ── Shared UI ──
function LangToggle({ lang, setLang, disabled }) {
  return <div style={{ display: "inline-flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, background: C.surface, opacity: disabled ? .5 : 1, pointerEvents: disabled ? "none" : "auto" }}>
    {["en", "es"].map(l => <button key={l} onClick={() => setLang(l)} style={{ padding: "7px 14px", border: "none", cursor: "pointer", fontFamily: F.body, fontSize: 12, fontWeight: 600, background: lang === l ? C.accentDim : "transparent", color: lang === l ? C.accent : C.textMuted, transition: "all .15s" }}>{l === "en" ? "EN" : "ES"}</button>)}
  </div>;
}
function Logo({ small }) {
  return <div style={{ display: "inline-flex", alignItems: "center", gap: small ? 8 : 10, padding: small ? 0 : "8px 16px", borderRadius: small ? 0 : 100, border: small ? "none" : `1px solid ${C.border}`, background: small ? "transparent" : C.surface }}>
    <div style={{ width: small ? 28 : 30, height: small ? 28 : 30, borderRadius: 8, background: `linear-gradient(135deg,${C.accent},#B8863A)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: small ? 13 : 14, fontWeight: 700, color: "#0F1621" }}>P</div>
    <span style={{ fontFamily: F.display, fontSize: small ? 17 : 22, fontWeight: 600, letterSpacing: "-.01em", color: C.text }}>Plan<span style={{ color: C.accent }}>sparency</span></span>
  </div>;
}
function Shield({ color, sz = 18 }) { return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>; }
function Modal({ children }) { return <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)" }}><div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, maxWidth: 520, width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "32px 28px", boxShadow: "0 24px 80px rgba(0,0,0,.6)" }}>{children}</div></div>; }

// ── TOC Section Icons ──
function SectionIcon({ type, sz = 20 }) {
  const s = { width: sz, height: sz, viewBox: "0 0 24 24", fill: "none", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    eligContrib: <svg {...s} stroke="#D4A853"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/><path d="M16 11l2 2 4-4"/></svg>,
    eligMatch: <svg {...s} stroke="#5CB88A"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
    match: <svg {...s} stroke="#5CB88A"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/></svg>,
    vesting: <svg {...s} stroke="#D4A853"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    loans: <svg {...s} stroke="#94A0B2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
    roth: <svg {...s} stroke="#D4A853"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>,
    investments: <svg {...s} stroke="#5CB88A"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    hardship: <svg {...s} stroke="#D46A5A"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    enroll: <svg {...s} stroke="#D4A853"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    distributions: <svg {...s} stroke="#94A0B2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    safeHarbor: <svg {...s} stroke="#5CB88A"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
    profitSharing: <svg {...s} stroke="#D4A853"><circle cx="12" cy="12" r="10"/><path d="M16 8l-4 4-4-4"/><path d="M16 16l-4-4-4 4"/></svg>,
  };
  return icons[type] || null;
}

// ── Suggestion Box ──
function SuggestionBox({ t }) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!topic.trim() || !details.trim()) return;
    setSuggestions(prev => [...prev, { topic: topic.trim(), details: details.trim(), ts: Date.now() }]);
    setTopic(""); setDetails(""); setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 2500);
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box", background: C.surfaceAlt, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "10px 14px", color: C.text, fontFamily: F.body, fontSize: 13,
    outline: "none", resize: "vertical", transition: "border-color .15s",
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "14px 18px", background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 14, cursor: "pointer", fontFamily: F.body, display: "flex", alignItems: "center",
        justifyContent: "space-between", transition: "all .15s",
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(212,168,83,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t.suggestionTitle}</span>
          {suggestions.length > 0 && <span style={{ fontSize: 11, background: C.accentDim, color: C.accent, padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>{suggestions.length}</span>}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {open && (
        <div style={{ marginTop: 8, padding: "18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, animation: "fadeIn .25s" }}>
          {suggestions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{ padding: "10px 14px", background: C.surfaceAlt, borderRadius: 10, marginBottom: 8, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 3 }}>{s.topic}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{s.details}</div>
                </div>
              ))}
            </div>
          )}

          {justSubmitted && (
            <div style={{ padding: "10px 14px", background: C.greenDim, borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", gap: 8, border: `1px solid rgba(92,184,138,.2)` }}>
              <Shield color={C.green} sz={14} />
              <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>{t.suggestionThanks}</span>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 5 }}>{t.suggestionTopic}</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder={t.suggestionTopicPlaceholder} style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 5 }}>{t.suggestionDetails}</label>
            <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder={t.suggestionDetailsPlaceholder} rows={3} style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border} />
          </div>
          <button onClick={handleSubmit} disabled={!topic.trim() || !details.trim()} style={{
            width: "100%", padding: "11px", border: "none", borderRadius: 10, fontFamily: F.body, fontWeight: 600,
            fontSize: 13, cursor: topic.trim() && details.trim() ? "pointer" : "default",
            background: topic.trim() && details.trim() ? `linear-gradient(135deg,${C.accent},#B8863A)` : C.border,
            color: topic.trim() && details.trim() ? "#0F1621" : C.textDim, transition: "all .15s",
          }}>{suggestions.length > 0 ? t.suggestionAdd : t.suggestionSubmit}</button>
        </div>
      )}
    </div>
  );
}

// ── Tab Bar ──
function TabBar({ activeTab, setActiveTab, hasFunds }) {
  const tabs = [
    { id: "guide", label: "Plan Guide",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
    { id: "investments", label: "Investments",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  ];
  return (
    <div style={{ display: "flex", gap: 4, padding: "8px 16px", background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10,
            border: isActive ? `1px solid ${C.accent}` : `1px solid transparent`,
            background: isActive ? C.accentDim : "transparent",
            color: isActive ? C.accent : C.textMuted,
            fontSize: 12, fontWeight: 600, fontFamily: F.body, cursor: "pointer",
            transition: "all .15s",
          }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.surfaceAlt; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = "transparent"; } }}
          >
            {tab.icon}{tab.label}
            {tab.id === "investments" && !hasFunds && (
              <span style={{ fontSize: 9, background: C.border, color: C.textDim, padding: "1px 5px", borderRadius: 4, fontWeight: 500 }}>UPLOAD DOC</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Investments Panel ──
function InvestmentsPanel({ fundsData, lang }) {
  const [sortBy, setSortBy] = useState("category");
  const hasExpenseRatios = fundsData.some(f => f.expenseRatio !== null && f.expenseRatio !== undefined);

  const RISK = {
    "Cash & Stable Value": { label: "Low Risk", color: C.green },
    "Bonds":               { label: "Low–Med",  color: C.textMuted },
    "Target Date":         { label: "Varies",   color: C.accent },
    "Asset Allocation":    { label: "Varies",   color: C.accent },
    "Large Cap":           { label: "Medium",   color: C.accent },
    "Mid Cap":             { label: "Med–High", color: C.accent },
    "Small Cap":           { label: "High Risk",color: C.danger },
    "International":       { label: "Med–High", color: C.accent },
    "Specialty":           { label: "High Risk",color: C.danger },
  };

  const CATEGORY_ORDER = ["Cash & Stable Value","Bonds","Large Cap","Mid Cap","Small Cap","International","Specialty","Asset Allocation","Target Date"];

  const getSorted = () => {
    const funds = [...fundsData];
    if (sortBy === "name") return funds.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "expenseRatio") return funds.sort((a, b) => (a.expenseRatio ?? 9999) - (b.expenseRatio ?? 9999));
    return funds.sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category), bi = CATEGORY_ORDER.indexOf(b.category);
      if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.name.localeCompare(b.name);
    });
  };

  const FundRow = ({ fund, showCategory }) => {
    const risk = RISK[fund.category] || { label: "—", color: C.textMuted };
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${C.border}`, background: C.surface, transition: "background .15s" }}
        onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
        onMouseLeave={e => e.currentTarget.style.background = C.surface}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fund.name}</div>
          {showCategory && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{fund.category}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {fund.expenseRatio !== null && fund.expenseRatio !== undefined && (
            <span style={{ fontSize: 11, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}`, padding: "2px 7px", borderRadius: 6 }}>
              {(fund.expenseRatio * 100).toFixed(2)}%
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color: risk.color, background: `${risk.color}15`, border: `1px solid ${risk.color}25`, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
            {risk.label}
          </span>
          {fund.factSheetUrl ? (
            <a href={fund.factSheetUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.accent, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}
              onClick={e => e.stopPropagation()}>
              View Summary <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          ) : (
            <span style={{ fontSize: 11, color: C.textDim, width: 80, textAlign: "right" }}>—</span>
          )}
        </div>
      </div>
    );
  };

  if (fundsData.length === 0) {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", padding: "40px 24px", background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600, color: C.text, margin: "0 0 8px" }}>Fund lineup not found</h3>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, margin: "0 0 16px" }}>
            The uploaded document does not contain a fund investment lineup. Upload the plan's enrollment booklet, investment guide, or 404(a)(5) fee disclosure to load the fund list here.
          </p>
          <div style={{ fontSize: 11, color: C.textDim, padding: "8px 12px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
            Accepted sources: Enrollment Booklet · Investment Guide · 404(a)(5) Fee Disclosure
          </div>
        </div>
      </div>
    );
  }

  const sorted = getSorted();
  const showByCategory = sortBy === "category";
  const categories = showByCategory ? CATEGORY_ORDER.filter(cat => sorted.some(f => f.category === cat)) : [];

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 16px", background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginRight: 4 }}>Sort:</span>
        {[
          { key: "category", label: "By Category" },
          { key: "name", label: "A–Z" },
          ...(hasExpenseRatios ? [{ key: "expenseRatio", label: "Expense Ratio" }] : []),
        ].map(opt => (
          <button key={opt.key} onClick={() => setSortBy(opt.key)} style={{
            padding: "5px 12px", borderRadius: 8, border: `1px solid ${sortBy === opt.key ? C.accent : C.border}`,
            background: sortBy === opt.key ? C.accentDim : "transparent",
            color: sortBy === opt.key ? C.accent : C.textMuted,
            fontSize: 11, fontWeight: 600, fontFamily: F.body, cursor: "pointer", transition: "all .15s",
          }}>{opt.label}</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: C.textDim }}>{fundsData.length} fund{fundsData.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {showByCategory ? (
          categories.map(cat => (
            <div key={cat}>
              <div style={{ padding: "10px 16px 6px", fontSize: 11, fontWeight: 700, color: RISK[cat]?.color || C.accent, textTransform: "uppercase", letterSpacing: ".06em", background: C.bg, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 1 }}>
                {cat}
              </div>
              {sorted.filter(f => f.category === cat).map((fund, i) => <FundRow key={i} fund={fund} showCategory={false} />)}
            </div>
          ))
        ) : (
          sorted.map((fund, i) => <FundRow key={i} fund={fund} showCategory={true} />)
        )}
      </div>
      <div style={{ padding: "10px 16px", fontSize: 10, color: C.textDim, lineHeight: 1.6, borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        This fund list is for educational reference only. Sourced from your plan document. Not investment advice or a recommendation of any fund. Consult your plan advisor for investment guidance. Links go to fund company materials — Plansparency is not affiliated with any fund listed.
      </div>
    </div>
  );
}

// ── Plan Guide Dashboard (TOC) ──
function PlanDashboard({ t, planData, onSectionClick, onChat, onUploadAnother, lang }) {
  const pd = planData || {};
  const tiers = pd.matchTiers || [];
  const noMatch = pd.noMatch || tiers.length === 0;
  const matchDesc = noMatch ? null : tiers.map(tier => `${tier.pct}% of first ${tier.upTo}%`).join(", then ");
  const hasSafeHarbor = pd.safeHarbor && pd.safeHarbor.type !== "none";
  const hasProfitSharing = pd.profitSharing?.available;

  const sections = [
    {
      id: "eligContrib", icon: "eligContrib",
      title: lang === "es" ? "Elegibilidad para Contribuir" : "Eligibility to Contribute",
      subtitle: lang === "es" ? "Cuándo puedes empezar a aportar tu propio dinero" : "When you can start putting your own money in",
      detail: pd.contribEligibility?.requirement || (lang === "es" ? "Sube tu documento para ver" : "Upload your document to see"),
      extra: pd.contribEligibility?.autoEnroll
        ? (lang === "es" ? `Inscripción automática al ${pd.contribEligibility.autoEnrollPct}%` : `Auto-enrolled at ${pd.contribEligibility.autoEnrollPct}%`)
        : null,
      color: C.accent,
      prompt: lang === "es"
        ? "Explícame la elegibilidad para contribuir al plan. ¿Cuáles son los requisitos de edad y servicio? ¿Cuándo puedo empezar a aportar mi propio dinero?"
        : "Explain contribution eligibility for this plan. What are the age and service requirements? When can I start contributing my own money?",
    },
    {
      id: "eligMatch", icon: "eligMatch",
      title: lang === "es" ? "Elegibilidad para Contribuciones del Empleador" : "Eligibility for Employer Contributions",
      subtitle: lang === "es" ? "Cuándo el empleador empieza a contribuir" : "When the employer starts contributing on your behalf",
      detail: pd.matchEligibility?.requirement || (noMatch && !hasSafeHarbor ? (lang === "es" ? "Ver detalles en tu documento" : "See your document for details") : (lang === "es" ? "Sube tu documento para ver" : "Upload your document to see")),
      extra: pd.matchEligibility?.immediateMatch
        ? (lang === "es" ? "Match empieza inmediatamente" : "Match begins immediately")
        : null,
      color: C.green,
      prompt: lang === "es"
        ? "Explícame la elegibilidad para contribuciones del empleador. Distingue claramente entre la elegibilidad para safe harbor, match discrecional, y profit sharing si aplican."
        : "Explain eligibility for employer contributions. Clearly distinguish between eligibility for safe harbor, discretionary match, and profit sharing if they apply.",
    },
    // Safe Harbor card — highlighted if present
    ...(hasSafeHarbor ? [{
      id: "safeHarbor", icon: "safeHarbor",
      title: lang === "es" ? "Contribución Safe Harbor" : "Safe Harbor Contribution",
      subtitle: lang === "es" ? "Dinero garantizado del empleador — 100% tuyo desde el día uno" : "Guaranteed employer money — 100% yours from day one",
      detail: pd.safeHarbor?.formula || (lang === "es" ? "Safe harbor disponible" : "Safe harbor available"),
      extra: lang === "es" ? "Inmediatamente investido • No aplica provisión de último día" : "Immediately vested • Last-day provision does NOT apply",
      color: C.green,
      prompt: lang === "es"
        ? "Explícame la contribución safe harbor de este plan. ¿Cuánto contribuye el empleador? ¿Por qué es 100% inmediatamente investido? ¿Cómo es diferente del match discrecional y del profit sharing?"
        : "Explain the safe harbor contribution in this plan. How much does the employer contribute? Why is it 100% immediately vested? How is it different from the discretionary match and profit sharing?",
    }] : []),
    {
      id: "match", icon: "match",
      title: lang === "es" ? "Match Discrecional" : "Discretionary Match",
      subtitle: lang === "es" ? "Match adicional del empleador (no garantizado)" : "Additional employer match (not guaranteed)",
      detail: noMatch ? (lang === "es" ? "Sin match discrecional" : "No discretionary match") : matchDesc,
      extra: noMatch ? null : (pd.lastDayProvision
        ? (lang === "es" ? "Sujeto a provisión de último día del año" : "Subject to last-day-of-year provision")
        : null),
      color: noMatch ? C.textMuted : C.green,
      prompt: lang === "es"
        ? "¿Cómo funciona el match discrecional del empleador? Dame un ejemplo con un salario de $50,000. ¿Cómo es diferente de la contribución safe harbor? ¿Aplica la provisión de último día del año?"
        : "How does the discretionary employer match work? Give me a dollar example using a $50,000 salary. How is it different from the safe harbor contribution? Does the last-day-of-year provision apply?",
      disabled: noMatch,
    },
    // Profit Sharing card — if available
    ...(hasProfitSharing ? [{
      id: "profitSharing", icon: "profitSharing",
      title: lang === "es" ? "Profit Sharing" : "Profit Sharing",
      subtitle: lang === "es" ? "Contribución adicional del empleador basada en ganancias" : "Additional employer contribution based on company performance",
      detail: pd.profitSharing?.formula || (lang === "es" ? "Discrecional — el empleador decide anualmente" : "Discretionary — employer decides annually"),
      extra: pd.profitSharing?.lastDayApplies
        ? (lang === "es" ? "Sujeto a provisión de último día del año" : "Subject to last-day-of-year provision")
        : null,
      color: C.accent,
      prompt: lang === "es"
        ? "Explícame el profit sharing en este plan. ¿Es garantizado o discrecional? ¿Cómo es diferente del match y del safe harbor? ¿Tiene su propio calendario de vesting? ¿Aplica la provisión de último día del año?"
        : "Explain profit sharing in this plan. Is it guaranteed or discretionary? How is it different from the match and safe harbor? Does it have its own vesting schedule? Does the last-day-of-year provision apply?",
    }] : []),
    {
      id: "vesting", icon: "vesting",
      title: lang === "es" ? "Calendario de Vesting" : "Vesting Schedule",
      subtitle: lang === "es" ? "Cuándo las contribuciones del empleador son realmente tuyas" : "When employer contributions are truly yours to keep",
      detail: pd.vestingSchedule || (lang === "es" ? "Sube tu documento para ver" : "Upload your document to see"),
      extra: hasSafeHarbor ? (lang === "es" ? "Safe harbor = siempre 100% tuyo" : "Safe harbor = always 100% yours") : null,
      color: C.accent,
      prompt: lang === "es"
        ? "Explícame el calendario de vesting. Distingue claramente: ¿qué contribuciones son inmediatamente investidas (como safe harbor) y cuáles siguen un calendario de vesting (como match discrecional y profit sharing)? ¿Qué pasa si me voy antes de estar totalmente investido?"
        : "Explain the vesting schedule. Clearly distinguish: which contributions are immediately vested (like safe harbor) and which follow a vesting schedule (like discretionary match and profit sharing)? What happens if I leave before I'm fully vested?",
    },
    {
      id: "roth", icon: "roth",
      title: lang === "es" ? "Roth vs Pre-Impuesto" : "Roth vs Pre-Tax",
      subtitle: lang === "es" ? "Pagar impuestos ahora o después" : "Pay taxes now or pay taxes later",
      detail: pd.hasRoth
        ? (lang === "es" ? "Roth disponible en este plan" : "Roth is available in this plan")
        : (lang === "es" ? "Solo pre-impuesto" : "Pre-tax only"),
      color: pd.hasRoth ? C.green : C.textMuted,
      prompt: lang === "es"
        ? "Explícame las opciones Roth y pre-impuesto en este plan. ¿Cuál es la diferencia en términos simples?"
        : "Explain the Roth and pre-tax options in this plan. What's the difference in simple terms?",
    },
    {
      id: "loans", icon: "loans",
      title: lang === "es" ? "Préstamos del Plan" : "Plan Loans",
      subtitle: lang === "es" ? "Pedir prestado de tu propio dinero" : "Borrowing from your own money",
      detail: pd.loanAvailable
        ? (lang === "es" ? "Préstamos disponibles" : "Loans available")
        : (pd.loanAvailable === false ? (lang === "es" ? "Préstamos no disponibles" : "Loans not available") : (lang === "es" ? "Sube tu documento para ver" : "Upload your document to see")),
      color: pd.loanAvailable ? C.green : C.textMuted,
      prompt: lang === "es"
        ? "¿Puedo tomar un préstamo de mi 401(k)? ¿Cuáles son las reglas, límites y cómo funciona el repago?"
        : "Can I take a loan from my 401(k)? What are the rules, limits, and how does repayment work?",
    },
    {
      id: "investments", icon: "investments",
      title: lang === "es" ? "Opciones de Inversión" : "Investment Options",
      subtitle: lang === "es" ? "Dónde se invierte tu dinero" : "Where your money gets invested",
      detail: pd.investmentOptions || (lang === "es" ? "Sube tu documento para ver" : "Upload your document to see"),
      color: C.green,
      prompt: lang === "es"
        ? "¿Qué opciones de inversión están disponibles en este plan? Explícalas en términos simples."
        : "What investment options are available in this plan? Explain them in simple terms.",
    },
    {
      id: "hardship", icon: "hardship",
      title: lang === "es" ? "Retiros por Dificultad" : "Hardship Withdrawals",
      subtitle: lang === "es" ? "Acceso de emergencia a tus fondos" : "Emergency access to your funds",
      detail: pd.hardshipAvailable
        ? (lang === "es" ? "Retiros por dificultad disponibles" : "Hardship withdrawals available")
        : (pd.hardshipAvailable === false ? (lang === "es" ? "No disponible" : "Not available") : (lang === "es" ? "Sube tu documento para ver" : "Upload your document to see")),
      color: pd.hardshipAvailable ? C.warning : C.textMuted,
      prompt: lang === "es"
        ? "¿Puedo hacer un retiro por dificultad? ¿Cuáles son las reglas y circunstancias que califican?"
        : "Can I take a hardship withdrawal? What are the rules and qualifying circumstances?",
    },
    {
      id: "enroll", icon: "enroll",
      title: lang === "es" ? "Cómo Inscribirte" : "How to Enroll",
      subtitle: lang === "es" ? "Los pasos para empezar" : "The steps to get started",
      detail: pd.recordkeeperName
        ? (lang === "es" ? `Inscríbete en ${pd.recordkeeperName}` : `Enroll through ${pd.recordkeeperName}`)
        : (lang === "es" ? "Sube tu documento para ver" : "Upload your document to see"),
      color: C.accent,
      prompt: lang === "es"
        ? "¿Cómo me inscribo en el plan? ¿Cuáles son los pasos exactos?"
        : "How do I enroll in the plan? What are the exact steps?",
    },
    {
      id: "distributions", icon: "distributions",
      title: lang === "es" ? "Retiros, Distribuciones y Rollovers" : "Withdrawals, Distributions & Rollovers",
      subtitle: lang === "es" ? "Cuándo y cómo puedes acceder a tu dinero" : "When and how you can access your money",
      detail: (() => {
        const di = pd.distributionInfo;
        if (!di) return lang === "es" ? "Sube tu documento para ver" : "Upload your document to see";
        const parts = [];
        if (di.inServiceAge) parts.push(lang === "es" ? `Retiro en servicio a los ${di.inServiceAge}` : `In-service at age ${di.inServiceAge}`);
        if (di.rolloversIn) parts.push(lang === "es" ? "Acepta rollovers" : "Accepts rollovers in");
        if (di.separationOptions) parts.push(lang === "es" ? "Opciones al separarse" : "Options when you leave");
        return parts.length ? parts.join(" • ") : (lang === "es" ? "Ver detalles" : "See details");
      })(),
      color: C.textMuted,
      prompt: lang === "es"
        ? `Explícame todas las formas en que puedo acceder al dinero en mi 401(k). Para cada opción, dime:
1. Retiros en servicio — ¿puedo retirar dinero mientras sigo trabajando? ¿A qué edad? ¿Cuáles son las consecuencias fiscales y penalidades?
2. Distribuciones al separarse del empleo — si renuncio, me despiden o me jubilo, ¿cuáles son mis opciones? (suma global, cuotas, dejarlo en el plan, rollover)
3. Rollovers — ¿puedo transferir dinero DE otro plan a este? ¿Y de este a otro plan o IRA?
4. Distribuciones mínimas requeridas (RMDs) — ¿a qué edad tengo que empezar a retirar?
5. ¿Cómo afecta mi edad a cada opción? ¿Cuál es la regla del 59½? ¿Qué es la penalidad del 10%?`
        : `Explain all the ways I can access money in my 401(k). For each option, tell me:
1. In-service withdrawals — can I take money out while still employed? At what age? What are the tax consequences and penalties?
2. Distributions at separation from employment — if I quit, get laid off, or retire, what are my options? (lump sum, installments, leave it in the plan, rollover)
3. Rollovers — can I roll money FROM another plan into this one? And from this plan OUT to another plan or IRA?
4. Required Minimum Distributions (RMDs) — at what age do I have to start taking money out?
5. How does my age affect each option? What is the age 59½ rule? What is the 10% early withdrawal penalty?`,
    },
  ];

  return (
    <div style={{ padding: "0 16px 16px", overflowY: "auto", flex: 1 }}>
      {/* Dashboard title */}
      <div style={{ textAlign: "center", padding: "18px 0 16px" }}>
        <h2 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 600, color: C.text, margin: "0 0 6px" }}>{t.dashWelcome}</h2>
        <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>{t.dashSubtitle}</p>
      </div>

      {/* Sections grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {sections.map((sec) => (
          <button key={sec.id} onClick={() => !sec.disabled && onSectionClick(sec.prompt)}
            style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
              padding: "16px 14px", cursor: sec.disabled ? "default" : "pointer", fontFamily: F.body,
              textAlign: "left", transition: "all .2s", opacity: sec.disabled ? .45 : 1,
              position: "relative", overflow: "hidden",
            }}
            onMouseEnter={e => { if (!sec.disabled) { e.currentTarget.style.borderColor = sec.color; e.currentTarget.style.background = C.surfaceAlt; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${sec.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <SectionIcon type={sec.icon} sz={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 2 }}>{sec.title}</div>
                <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.4 }}>{sec.subtitle}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: sec.color, fontWeight: 600, lineHeight: 1.4, padding: "8px 10px", background: `${sec.color}10`, borderRadius: 8, border: `1px solid ${sec.color}20` }}>
              {sec.detail}
              {sec.extra && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3, fontWeight: 400 }}>{sec.extra}</div>}
            </div>
            {/* Tap indicator */}
            {!sec.disabled && <div style={{ position: "absolute", top: 10, right: 10 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>}
          </button>
        ))}
      </div>

      {/* Upload another doc + free chat */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
        <button onClick={onUploadAnother} style={{
          padding: "14px 18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
          cursor: "pointer", fontFamily: F.body, display: "flex", alignItems: "center", gap: 10, transition: "all .15s",
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
        >
          <div style={{ width: 32, height: 32, borderRadius: 9, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.dashUploadAnother}</span>
        </button>
        <button onClick={onChat} style={{
          padding: "14px 18px", background: `linear-gradient(135deg,${C.accent},#B8863A)`, border: "none", borderRadius: 14,
          cursor: "pointer", fontFamily: F.body, display: "flex", alignItems: "center", gap: 10, transition: "all .15s",
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(15,22,33,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F1621" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0F1621" }}>{t.dashStartChat}</span>
        </button>
      </div>

      {/* Suggestion box */}
      <SuggestionBox t={t} />

      {/* Disclaimer */}
      <div style={{ textAlign: "center", marginTop: 16, padding: "10px", fontSize: 10, color: C.textDim, lineHeight: 1.5 }}>
        {t.footerDisclaimer}
      </div>
    </div>
  );
}

// ── Calculator (High Contrast) ──
function CalcPanel({ t, planData, expanded, setExpanded }) {
  const [salary, setSalary] = useState(50000);
  const [pct, setPct] = useState(6);
  const [dob, setDob] = useState("");
  const [pp, setPp] = useState(26);

  const tiers = planData?.matchTiers || [];
  const noMatch = planData?.noMatch || tiers.length === 0;
  const hasRoth = planData?.hasRoth ?? false;
  const planAllowsCatchUp = planData?.planAllowsCatchUp ?? true;
  const lastDayProvision = planData?.lastDayProvision ?? null;
  const limits = getIRSLimits(dob || null);

  // Safe Harbor calculation
  const sh = planData?.safeHarbor;
  const hasSH = sh && sh.type !== "none";
  let shAmt = 0;
  if (hasSH) {
    if (sh.type === "nonelective") { shAmt = salary * 0.03; }
    else if (sh.type === "basic_match") {
      const t1 = Math.min(pct, 3); const t2 = Math.max(0, Math.min(pct, 5) - 3);
      shAmt = salary * t1 / 100 * 1.0 + salary * t2 / 100 * 0.5;
    }
    else if (sh.type === "enhanced_match") {
      const t1 = Math.min(pct, 4);
      shAmt = salary * t1 / 100;
    }
    else if (sh.type === "qaca") {
      const t1 = Math.min(pct, 1); const t2 = Math.max(0, Math.min(pct, 6) - 1);
      shAmt = salary * t1 / 100 * 1.0 + salary * t2 / 100 * 0.5;
    }
  }

  const catchUpActive = limits.catchUpEligible && planAllowsCatchUp;
  const maxContrib = catchUpActive ? limits.total : limits.base;
  const empContrib = Math.min(salary * pct / 100, maxContrib);
  const total = empContrib + shAmt;
  const perPaycheck = empContrib / pp;

  const fmt = n => "$" + Math.round(n).toLocaleString();
  const fmt2 = n => "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const iS = {
    backgroundColor: C.calcInput, border: `1px solid ${C.calcInputBorder}`, borderRadius: 8,
    color: C.calcText, fontFamily: F.body, fontSize: 13, padding: "8px 11px", width: "100%",
    outline: "none", boxSizing: "border-box",
  };
  const lS = { fontSize: 11, color: C.calcMuted, fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" };

  const shLabels = {
    nonelective: { en: "3% of pay — regardless of your contributions", es: "3% del salario — sin importar tus contribuciones" },
    basic_match: { en: "100% of first 3% + 50% of next 2%", es: "100% del primer 3% + 50% del siguiente 2%" },
    enhanced_match: { en: sh?.formula || "Enhanced safe harbor match", es: sh?.formula || "Match safe harbor mejorado" },
    qaca: { en: "QACA: 100% of first 1% + 50% of next 5%", es: "QACA: 100% del primer 1% + 50% del siguiente 5%" },
  };
  const lang = t.calcYes === "Yes" ? "en" : "es";

  let catchUpDisplay, catchUpColor;
  if (!dob) { catchUpDisplay = t.calcEnterDob; catchUpColor = C.calcMuted; }
  else if (!planAllowsCatchUp) { catchUpDisplay = t.calcCatchUpNotAllowed; catchUpColor = "#B84A3A"; }
  else if (catchUpActive) { catchUpDisplay = t.calcYes + (limits.enhanced ? " (60-63)" : " (50+)"); catchUpColor = "#2E7D52"; }
  else { catchUpDisplay = t.calcNo; catchUpColor = "#B84A3A"; }

  return (
    <div style={{ flexShrink: 0, borderBottom: `2px solid ${C.calcBorder}`, background: C.calcBg, boxShadow: "0 4px 20px rgba(0,0,0,.15)" }}>
      <button onClick={() => setExpanded(!expanded)} style={{
        width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: F.body,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${C.accent},#B8863A)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F1621" strokeWidth="2.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.calcText, fontFamily: F.display, letterSpacing: ".01em" }}>{t.calcTitle}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {!expanded && planData && <div style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
            <span style={{ color: C.calcMuted }}>{t.calcYourContrib}: <strong style={{ color: C.calcText }}>{fmt(empContrib)}</strong></span>
            {hasSH && <span style={{ color: C.calcMuted }}>Safe Harbor: <strong style={{ color: "#2E7D52" }}>{fmt(shAmt)}</strong></span>}
            <span style={{ color: "#8B6914", fontWeight: 700 }}>{fmt(total)}/yr</span>
          </div>}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.calcMuted} strokeWidth="2" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: "0 16px 18px" }}>
          {!planData && <div style={{ padding: "16px", textAlign: "center", color: C.calcMuted, fontSize: 13, background: "#F3EDE3", borderRadius: 10, border: `1px dashed ${C.calcBorder}` }}>{t.calcWaiting}</div>}

          {planData && <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div><label style={lS}>{t.calcSalary}</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.calcMuted, fontSize: 13 }}>$</span>
                  <input type="number" value={salary} onChange={e => setSalary(Math.max(0, +e.target.value))} style={{ ...iS, paddingLeft: 22 }} />
                </div>
              </div>
              <div><label style={lS}>{t.calcDob}</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={iS} />
              </div>
              <div><label style={lS}>{t.calcPayPeriod}</label>
                <select value={pp} onChange={e => setPp(+e.target.value)} style={{ ...iS, cursor: "pointer" }}>
                  <option value={26}>{t.calcBiweekly}</option><option value={24}>{t.calcSemimonthly}</option><option value={12}>{t.calcMonthly}</option><option value={52}>{t.calcWeekly}</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ ...lS, marginBottom: 0 }}>{t.calcContribution}</label>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#8B6914" }}>{pct}%</span>
              </div>
              <input type="range" min={0} max={30} step={1} value={pct} onChange={e => setPct(+e.target.value)} style={{ width: "100%", height: 10, cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.calcMuted, marginTop: 3 }}><span>0%</span><span>30%</span></div>
            </div>

            {/* === SAFE HARBOR — calculated, always first === */}
            {hasSH && (
              <div style={{ marginBottom: 12, padding: "14px 16px", borderRadius: 12, background: "#E8F8EF", border: `2px solid #5CB88A`, position: "relative" }}>
                <div style={{ position: "absolute", top: -9, left: 14, background: "#5CB88A", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  {lang === "es" ? "Garantizado" : "Guaranteed"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 4 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1A5C37", marginBottom: 4 }}>
                      {lang === "es" ? "Contribución Safe Harbor" : "Safe Harbor Contribution"}
                    </div>
                    <div style={{ fontSize: 12, color: "#3D7A55", lineHeight: 1.4 }}>
                      {shLabels[sh.type]?.[lang] || sh.formula}
                    </div>
                    <div style={{ fontSize: 10, color: "#5D9A73", marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>✓ {lang === "es" ? "100% investido inmediatamente" : "100% vested immediately"}</span>
                      <span>✓ {lang === "es" ? "No aplica provisión de último día" : "Last-day provision does NOT apply"}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#1A5C37" }}>{fmt(shAmt)}</div>
                    <div style={{ fontSize: 10, color: "#5D9A73" }}>/yr</div>
                  </div>
                </div>
              </div>
            )}

            {/* === DISCRETIONARY MATCH — informational only, no formula, no calculation === */}
            {!noMatch && (
              <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 10, background: "#FFFBF2", border: `1px dashed ${C.calcBorder}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#8B6914", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>
                  {lang === "es" ? "Match Discrecional" : "Discretionary Match"}
                </div>
                <div style={{ fontSize: 13, color: C.calcText, lineHeight: 1.5 }}>
                  {lang === "es"
                    ? "Este plan también ofrece un match discrecional del empleador. Esta contribución es discrecional y no está garantizada — el empleador puede cambiarla o eliminarla en cualquier momento."
                    : "This plan also offers a discretionary employer match. This contribution is discretionary and not guaranteed — the employer can change or eliminate it at any time."}
                </div>
                {lastDayProvision && <div style={{ fontSize: 10, color: "#B84A3A", marginTop: 6 }}>
                  ⚠ {lang === "es" ? "Sujeto a provisión de último día del año y calendario de vesting" : "Subject to last-day-of-year provision and vesting schedule"}
                </div>}
                {!lastDayProvision && <div style={{ fontSize: 10, color: C.calcMuted, marginTop: 6 }}>
                  {lang === "es" ? "Sujeto a calendario de vesting" : "Subject to vesting schedule"}
                </div>}
              </div>
            )}

            {/* === NO EMPLOYER CONTRIBUTIONS AT ALL === */}
            {!hasSH && noMatch && (
              <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 10, background: "#FDF2F0", border: `1px solid #E8C4BE` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#B84A3A", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>
                  {lang === "es" ? "Contribuciones del Empleador" : "Employer Contributions"}
                </div>
                <div style={{ fontSize: 13, color: "#B84A3A" }}>
                  {lang === "es"
                    ? "Este plan no incluye contribución safe harbor ni match discrecional del empleador."
                    : "This plan does not include a safe harbor contribution or discretionary employer match."}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={{ padding: "8px 10px", borderRadius: 8, background: "#FFF8EB", border: `1px solid #EBD9A8` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, textTransform: "uppercase", marginBottom: 3 }}>{t.calcIrsLimit}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#8B6914" }}>{fmt(catchUpActive ? limits.total : limits.base)}</div>
                {catchUpActive && <div style={{ fontSize: 10, color: "#2E7D52", marginTop: 2 }}>+{fmt(limits.catchUp)} catch-up</div>}
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 8, background: C.calcCard, border: `1px solid ${C.calcCardBorder}` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, textTransform: "uppercase", marginBottom: 3 }}>{t.calcCatchUp}</div>
                <div style={{ fontSize: catchUpDisplay.length > 10 ? 11 : 14, fontWeight: 700, color: catchUpColor }}>{catchUpDisplay}</div>
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 8, background: C.calcCard, border: `1px solid ${C.calcCardBorder}` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, textTransform: "uppercase", marginBottom: 3 }}>{t.calcRothAvail}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: hasRoth ? "#2E7D52" : "#B84A3A" }}>{hasRoth ? t.calcYes : t.calcNo}</div>
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 8, background: C.calcCard, border: `1px solid ${C.calcCardBorder}` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, textTransform: "uppercase", marginBottom: 3 }}>{t.calcPreTax}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#2E7D52" }}>{t.calcYes}</div>
              </div>
            </div>

            {/* Summary totals — only your contribution + safe harbor */}
            <div style={{ display: "grid", gridTemplateColumns: hasSH ? "1fr 1fr 1.3fr 1fr" : "1fr 1.3fr 1fr", gap: 8, marginBottom: 10 }}>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "#FFFFFF", border: `1px solid ${C.calcCardBorder}` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".04em" }}>{t.calcYourContrib}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.calcText }}>{fmt(empContrib)}</div>
              </div>
              {hasSH && <div style={{ padding: "10px 12px", borderRadius: 10, background: "#E8F8EF", border: `1px solid #B8DFC9` }}>
                <div style={{ fontSize: 9, color: "#3D7A55", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".04em" }}>Safe Harbor</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#1A5C37" }}>{fmt(shAmt)}</div>
              </div>}
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "#FFF8EB", border: `1px solid #EBD9A8` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".04em" }}>{hasSH ? (lang === "es" ? "Total Garantizado / Año" : "Guaranteed Total / Year") : t.calcTotal}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#8B6914" }}>{fmt(total)}</div>
                {!noMatch && <div style={{ fontSize: 9, color: C.calcMuted, marginTop: 2 }}>{lang === "es" ? "+ match discrecional (no calculado)" : "+ discretionary match (not calculated)"}</div>}
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "#FFFFFF", border: `1px solid ${C.calcCardBorder}` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".04em" }}>{t.calcPerPaycheck}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.calcText }}>{fmt2(perPaycheck)}</div>
              </div>
            </div>

            <div style={{ fontSize: 10, color: C.calcMuted, lineHeight: 1.6, marginTop: 6 }}>
              <p style={{ margin: "0 0 4px" }}>{t.calcSecureNote}</p>
              {lastDayProvision !== null && <p style={{ margin: "0 0 4px", color: lastDayProvision ? "#B84A3A" : C.calcMuted }}>
                {lastDayProvision ? t.calcLastDayYes : t.calcLastDayNo}
              </p>}
              <p style={{ margin: 0, color: "#9A8E7F" }}>{t.calcNote}</p>
            </div>
          </>}
        </div>
      )}
    </div>
  );
}

// ── Main App ──
export default function Plansparency() {
  const [lang, setLang] = useState("en");
  const [stage, setStage] = useState("landing");
  const [pdfBase64, setPdfBase64] = useState(null);
  const [fileName, setFileName] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [calcExpanded, setCalcExpanded] = useState(false);
  const [planData, setPlanData] = useState(null);
  const [activeTab, setActiveTab] = useState("guide");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingFileRef = useRef(null);
  const addDocRef = useRef(null);

  const t = i18n[lang];
  const fontLink = <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />;
  const btnBase = { border: "none", cursor: "pointer", fontFamily: F.body, fontWeight: 600, borderRadius: 12, transition: "all .15s" };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (stage === "chat" && !loading) inputRef.current?.focus(); }, [stage, loading]);

  const clearSession = () => { setPdfBase64(null); setFileName(""); setMessages([]); setInput(""); setLoading(false); setShowClearConfirm(false); setPlanData(null); setCalcExpanded(false); setActiveTab("guide"); pendingFileRef.current = null; setStage("cleared"); };
  const initiateUpload = f => {
    if (!f || f.type !== "application/pdf") { alert(t.errorFormat); return; }
    // Base64 encoding inflates file by ~33%. Total payload limit is ~7MB.
    // Files over 4.5MB raw will exceed the limit after encoding + request overhead.
    const MAX_RAW_BYTES = 4.5 * 1024 * 1024; // 4.5 MB
    if (f.size > MAX_RAW_BYTES) {
      const sizeMB = (f.size / 1048576).toFixed(1);
      const msg = lang === "es"
        ? `Este documento tiene ${sizeMB} MB. Por el momento, el límite es ~4.5 MB. Prueba con una versión comprimida del PDF, o el sistema completo (sin esta limitación) estará disponible pronto.`
        : `This document is ${sizeMB} MB. The current limit is ~4.5 MB. Try a compressed version of the PDF, or the full system (without this limit) will be available shortly.`;
      alert(msg);
      return;
    }
    pendingFileRef.current = f;
    setStage("privacy");
  };

  const proceedAfterConsent = async () => {
    const f = pendingFileRef.current; if (!f) return;
    setFileName(f.name); setStage("uploading");
    try {
      const b = await fileToBase64(f); setPdfBase64(b); pendingFileRef.current = null;
      const m1 = { role: "user", content: t.firstMessage };
      const raw = await callClaude([m1], b, lang, null);
      const pd = parsePlanData(raw);
      if (pd) setPlanData(pd);
      setMessages([m1, { role: "assistant", content: stripPlanData(raw) }]);
      setStage("dashboard"); setActiveTab("guide");
    } catch (e) { console.error(e); alert(t.errorRead); setPdfBase64(null); pendingFileRef.current = null; setStage("landing"); }
  };

  // Upload additional document
  const handleAdditionalUpload = async (f) => {
    if (!f || f.type !== "application/pdf") { alert(t.errorFormat); return; }
    if (f.size > 4.5 * 1024 * 1024) {
      const sizeMB = (f.size / 1048576).toFixed(1);
      alert(lang === "es"
        ? `Documento de ${sizeMB} MB excede el límite de ~4.5 MB.`
        : `Document is ${sizeMB} MB — exceeds the ~4.5 MB limit for this version.`
      );
      return;
    }
    setFileName(prev => prev + " + " + f.name);
    setStage("uploading");
    try {
      const b = await fileToBase64(f);
      // Send the new doc with a merge prompt
      const mergePrompt = lang === "es"
        ? "Acabo de subir un documento adicional del plan. Lee este documento y combina la información con lo que ya sabemos del plan. Dime brevemente qué nueva información encontraste. Incluye al final el bloque PLANDATA actualizado."
        : "I just uploaded an additional plan document. Read through this document and merge the information with what we already know about the plan. Briefly tell me what new information you found. Include the updated PLANDATA block at the end. If this document contains a fund investment lineup or investment option table, also extract fundsData in the same format as the initial PLANDATA block and include it in the updated PLANDATA.";
      const m = { role: "user", content: mergePrompt };
      const am = [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: b } }, { type: "text", text: mergePrompt }] }];
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: getSystemPrompt(lang, planData), messages: am })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      const raw = d.content.filter(bl => bl.type === "text").map(bl => bl.text).join("\n");
      const newPd = parsePlanData(raw);
      if (newPd) setPlanData(prev => ({ ...prev, ...newPd }));
      // Add the merge exchange to conversation history and keep new pdf for chat
      setMessages(prev => [...prev, m, { role: "assistant", content: stripPlanData(raw) }]);
      setPdfBase64(b);
      setStage("dashboard");
    } catch (e) { console.error(e); alert(t.errorRead); setStage("dashboard"); }
  };

  const sendMessage = async text => {
    if (!text.trim() || loading) return;
    const um = { role: "user", content: text.trim() }; const nm = [...messages, um]; setMessages(nm); setInput(""); setLoading(true);
    if (stage === "dashboard") setStage("chat");
    try { const raw = await callClaude(nm, pdfBase64, lang, planData); setMessages([...nm, { role: "assistant", content: stripPlanData(raw) }]); }
    catch { setMessages([...nm, { role: "assistant", content: t.errorReply }]); }
    setLoading(false);
  };

  const handleKeyDown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } };
  const handleDrop = e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) initiateUpload(e.dataTransfer.files[0]); };
  const lastMsg = messages[messages.length - 1];
  const showChips = stage === "chat" && !loading && lastMsg?.role === "assistant";

  // ── Privacy ──
  if (stage === "privacy") return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    {fontLink}<div style={{ maxWidth: 540, width: "100%" }}><div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "32px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><div style={{ width: 38, height: 38, borderRadius: 12, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid rgba(212,168,83,.2)` }}><Shield color={C.accent} sz={20} /></div>
        <h2 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600, margin: 0 }}>{t.privacyTitle}</h2></div>
      <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 22 }}>{t.privacyIntro}</p>
      {t.privacyPoints.map(([title, body], i) => <div key={i} style={{ marginBottom: 14, paddingLeft: 14, borderLeft: `2px solid ${i === 1 ? C.warning : C.accent}` }}><p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 3px" }}>{title}</p><p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5, margin: 0 }}>{body}</p></div>)}
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button onClick={() => { pendingFileRef.current = null; setStage("landing"); }} style={{ ...btnBase, flex: 1, padding: "12px", fontSize: 14, background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` }}>{t.privacyCancel}</button>
        <button onClick={proceedAfterConsent} style={{ ...btnBase, flex: 1, padding: "12px", fontSize: 14, background: `linear-gradient(135deg,${C.accent},#B8863A)`, color: "#0F1621" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Shield color="#0F1621" sz={14} />{t.privacyAgree}</span></button>
      </div></div></div></div>;

  // ── Cleared ──
  if (stage === "cleared") return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
    {fontLink}<div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}><Shield color={C.accent} sz={24} /></div>
    <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 600, margin: "0 0 8px" }}>{t.clearedTitle}</h2>
    <p style={{ color: C.textMuted, fontSize: 14, margin: "0 0 28px", textAlign: "center" }}>{t.clearedBody}</p>
    <button onClick={() => setStage("landing")} style={{ ...btnBase, padding: "12px 28px", fontSize: 14, background: `linear-gradient(135deg,${C.accent},#B8863A)`, color: "#0F1621" }}>{t.clearedButton}</button></div>;

  // ── Landing ──
  if (stage === "landing") return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", overflow: "hidden" }}>
    {fontLink}
    <div style={{ position: "absolute", inset: 0, opacity: .02, backgroundImage: `linear-gradient(${C.accent} 1px,transparent 1px),linear-gradient(90deg,${C.accent} 1px,transparent 1px)`, backgroundSize: "80px 80px" }} />
    <div style={{ position: "absolute", top: -200, left: "25%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,168,83,.12) 0%,transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />
    <div style={{ position: "relative", zIndex: 1, maxWidth: 600, textAlign: "center" }}>
      <div style={{ marginBottom: 24 }}><LangToggle lang={lang} setLang={setLang} /></div>
      <div style={{ marginBottom: 36 }}><Logo /></div>
      <h1 style={{ fontFamily: F.display, fontSize: "clamp(38px,7vw,64px)", fontWeight: 600, lineHeight: 1.08, margin: "0 0 20px", letterSpacing: "-.02em" }}>
        {t.heroLine1}{" "}<span style={{ fontStyle: "italic", background: `linear-gradient(135deg,${C.accent},${C.green})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t.tagline}</span>
      </h1>
      <p style={{ fontSize: 17, color: C.textMuted, lineHeight: 1.65, margin: "0 0 42px", maxWidth: 480, marginInline: "auto" }}>{t.subtitle}</p>
      <div onClick={() => fileInputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        style={{ border: `2px dashed ${dragOver ? C.accent : C.border}`, borderRadius: 16, padding: "42px 32px", cursor: "pointer", background: dragOver ? C.accentDim : "rgba(23,31,45,.6)", transition: "all .25s", marginBottom: 36 }}>
        <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) initiateUpload(e.target.files[0]); e.target.value = ""; }} />
        <div style={{ width: 50, height: 50, borderRadius: 14, margin: "0 auto 14px", background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid rgba(212,168,83,.2)` }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 5px" }}>{t.dropTitle}</p>
        <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>{t.dropSub}</p>
      </div>
      <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
        {[[<Shield key="s" color={C.accent} sz={14} />, t.trustPrivate], ["🔒", t.trustEncrypted], ["📚", t.trustEducation], ["💬", t.trustPlain]].map(([ic, lb], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.textMuted }}>{ic}<span>{lb}</span></div>)}
      </div>
    </div></div>;

  // ── Uploading ──
  if (stage === "uploading") return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
    {fontLink}<div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, animation: "pulse 2s ease-in-out infinite", border: `1px solid rgba(212,168,83,.2)` }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg></div>
    <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 600, margin: "0 0 8px" }}>{t.readingTitle}</h2>
    <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>{t.readingSubPrefix} <span style={{ color: C.accent }}>{fileName}</span> {t.readingSubSuffix}</p>
    <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.06);opacity:.75}}`}</style></div>;

  // ── Dashboard (TOC) ──
  if (stage === "dashboard") return <div style={{ height: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column" }}>
    {fontLink}
    <input ref={addDocRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handleAdditionalUpload(e.target.files[0]); e.target.value = ""; }} />

    {/* Header */}
    <div style={{ padding: "10px 16px", borderBottom: `2px solid ${C.accent}`, background: C.surface, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <Logo small />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.green, background: C.greenDim, padding: "3px 8px", borderRadius: 100, border: "1px solid rgba(92,184,138,.15)" }}><Shield color={C.green} sz={10} />{t.securityBadge}</div>
          <LangToggle lang={lang} setLang={setLang} disabled={loading} />
          <div style={{ fontSize: 10, color: C.warning, background: "rgba(212,168,67,.08)", padding: "3px 8px", borderRadius: 100, border: "1px solid rgba(212,168,67,.18)", whiteSpace: "nowrap" }}>{t.disclaimer}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, flexShrink: 0 }} />
        <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: ".01em" }}>
          {planData?.planName || fileName || "Your Plan"}
        </div>
      </div>
    </div>

    <CalcPanel t={t} planData={planData} expanded={calcExpanded} setExpanded={setCalcExpanded} />

    <TabBar activeTab={activeTab} setActiveTab={setActiveTab} hasFunds={(planData?.fundsData?.length ?? 0) > 0} />
    {activeTab === "guide" && (
      <PlanDashboard
        t={t} planData={planData} lang={lang}
        onSectionClick={(prompt) => sendMessage(prompt)}
        onChat={() => setStage("chat")}
        onUploadAnother={() => addDocRef.current?.click()}
      />
    )}
    {activeTab === "investments" && (
      <InvestmentsPanel fundsData={planData?.fundsData || []} lang={lang} />
    )}
    <style>{`
      @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      *{box-sizing:border-box;margin:0}
      ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
      input[type=range]{-webkit-appearance:none;appearance:none;background:#C8BFAE;border-radius:6px;outline:none;height:10px}
      input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,${C.accent},#B8863A);cursor:pointer;border:3px solid #FBF7F0;box-shadow:0 0 10px rgba(212,168,83,.4)}
      input[type=range]::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,${C.accent},#B8863A);cursor:pointer;border:3px solid #FBF7F0;box-shadow:0 0 10px rgba(212,168,83,.4)}
      select{-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A6B5D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px}
    `}</style>
  </div>;

  // ── Chat ──
  return <div style={{ height: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column" }}>
    {fontLink}
    {showClearConfirm && <Modal><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><div style={{ width: 36, height: 36, borderRadius: 10, background: C.dangerDim, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></div>
      <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600, margin: 0 }}>{t.clearConfirmTitle}</h3></div>
      <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 24 }}>{t.clearConfirmBody}</p>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => setShowClearConfirm(false)} style={{ ...btnBase, flex: 1, padding: "11px", fontSize: 14, background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` }}>{t.clearConfirmNo}</button>
        <button onClick={clearSession} style={{ ...btnBase, flex: 1, padding: "11px", fontSize: 14, background: C.danger, color: "#fff" }}>{t.clearConfirmYes}</button>
      </div></Modal>}

    <div style={{ padding: "10px 16px", borderBottom: `2px solid ${C.accent}`, background: C.surface, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <button onClick={() => setStage("dashboard")} style={{
          padding: "7px 14px", borderRadius: 10, border: `1px solid ${C.accent}`, background: C.accentDim,
          color: C.accent, fontSize: 12, fontFamily: F.body, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6, transition: "all .15s", flexShrink: 0,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = C.accentGlow; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.accentDim; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          {lang === "es" ? "Guía del Plan" : "Plan Guide"}
        </button>
        <Logo small />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.green, background: C.greenDim, padding: "3px 8px", borderRadius: 100, border: "1px solid rgba(92,184,138,.15)" }}><Shield color={C.green} sz={10} />{t.securityBadge}</div>
          <LangToggle lang={lang} setLang={setLang} disabled={loading} />
          <div style={{ fontSize: 10, color: C.warning, background: "rgba(212,168,67,.08)", padding: "3px 8px", borderRadius: 100, border: "1px solid rgba(212,168,67,.18)", whiteSpace: "nowrap" }}>{t.disclaimer}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, flexShrink: 0 }} />
        <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: ".01em" }}>
          {planData?.planName || fileName || "Your Plan"}
        </div>
      </div>
    </div>

    <CalcPanel t={t} planData={planData} expanded={calcExpanded} setExpanded={setCalcExpanded} />

    <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
      {messages.filter(m => m.role !== "user" || (!m.content.startsWith("I just uploaded") && !m.content.startsWith("Acabo de subir"))).map((msg, i) => (
        <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "fadeIn .3s" }}>
          <div style={{ maxWidth: "85%", padding: "12px 15px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? C.userBubble : C.aiBubble, border: `1px solid ${msg.role === "user" ? "rgba(212,168,83,.1)" : C.border}`, fontSize: 14, lineHeight: 1.6 }}>
            {msg.role === "assistant" ? <Md text={msg.content} /> : msg.content}
          </div>
        </div>
      ))}
      {loading && <div style={{ display: "flex" }}><div style={{ padding: "12px 15px", borderRadius: "16px 16px 16px 4px", background: C.aiBubble, border: `1px solid ${C.border}`, display: "flex", gap: 6 }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, opacity: .5, animation: `bounce 1.2s ease-in-out ${i * .15}s infinite` }} />)}</div></div>}
      {showChips && <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center", padding: "4px 0 8px" }}>
        {t.quickAsks.map(q => <button key={q} onClick={() => sendMessage(q)}
          style={{ padding: "7px 13px", borderRadius: 100, fontSize: 12, background: C.accentDim, color: C.accent, border: `1px solid rgba(212,168,83,.18)`, cursor: "pointer", fontFamily: F.body, transition: "all .15s", whiteSpace: "nowrap" }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentGlow} onMouseLeave={e => e.currentTarget.style.background = C.accentDim}
        >{q}</button>)}</div>}
      <div ref={chatEndRef} />
    </div>

    <div style={{ padding: "10px 16px 12px", borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: C.bg, borderRadius: 14, padding: "4px 4px 4px 14px", border: `1px solid ${C.border}` }}>
        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={t.inputPlaceholder} rows={1}
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.text, fontSize: 14, fontFamily: F.body, resize: "none", padding: "9px 0", lineHeight: 1.5, maxHeight: 100, minHeight: 18 }}
          onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }} />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
          style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: input.trim() && !loading ? `linear-gradient(135deg,${C.accent},#B8863A)` : C.border, cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? "#0F1621" : C.textDim} strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: C.textDim }}>{t.footerDisclaimer}</span>
        <button onClick={() => setShowClearConfirm(true)} style={{ ...btnBase, padding: "3px 10px", fontSize: 10, background: "transparent", color: C.danger, border: `1px solid ${C.dangerDim}`, borderRadius: 8, opacity: .7 }}
          onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = ".7"}>{t.clearSession}</button>
      </div>
    </div>

    <style>{`
      @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
      *{box-sizing:border-box;margin:0}
      ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
      textarea::placeholder{color:${C.textDim}}
      input[type=range]{-webkit-appearance:none;appearance:none;background:#C8BFAE;border-radius:6px;outline:none;height:10px}
      input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,${C.accent},#B8863A);cursor:pointer;border:3px solid #FBF7F0;box-shadow:0 0 10px rgba(212,168,83,.4)}
      input[type=range]::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,${C.accent},#B8863A);cursor:pointer;border:3px solid #FBF7F0;box-shadow:0 0 10px rgba(212,168,83,.4)}
      select{-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A6B5D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px}
    `}</style>
  </div>;
}
