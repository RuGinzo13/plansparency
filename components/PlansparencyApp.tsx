// @ts-nocheck — migrated from app.jsx; type annotations to be added incrementally
'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
// @vercel/blob client-side upload removed — browser now POSTs FormData directly to /api/ingest


// ── Colors ──
const C = {
  bg: "#F4EFE6", surface: "#FDFAF6", surfaceAlt: "#EDE8DE",
  border: "#D5C9B8", borderLight: "#E5DDD0",
  accent: "#B8860B", accentDim: "rgba(184,134,11,.13)", accentGlow: "rgba(184,134,11,.24)",
  green: "#2E7D52", greenDim: "rgba(46,125,82,.11)", greenGlow: "rgba(46,125,82,.2)",
  text: "#1E1408", textMuted: "#5E4E3A", textDim: "#9A8878",
  userBubble: "#E6DCCC", aiBubble: "#FFFFFF",
  warning: "#B8860B", danger: "#B83232", dangerDim: "rgba(184,50,50,.1)",
  calcBg: "#FDFAF6", calcBorder: "#B8860B", calcText: "#1E1408",
  calcMuted: "#7A6B5D", calcCard: "#EDE8DE", calcCardBorder: "#D5C9B8",
  calcInput: "#FFFFFF", calcInputBorder: "#C8BFAE",
};
const F = { display: "'Cormorant Garamond','Georgia',serif", body: "'DM Sans','Segoe UI',sans-serif" };

// ── Stage constants ──
const STAGE = Object.freeze({ CHOOSER:"chooser", LANDING:"landing", PRIVACY:"privacy", UPLOADING:"uploading", APP:"app", DASHBOARD:"dashboard", STMT_DASHBOARD:"stmtDashboard", CHAT:"chat", CLEARED:"cleared" });

// ── Module-level formatters ──
const fmtRounded = (n: number) => "$" + Math.round(n || 0).toLocaleString();
const fmtDollars = (n: number) => "$" + Math.abs(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShortAmt = (n: number) => { const a = Math.abs(n || 0); if (a >= 1000000) return "$" + (a/1000000).toFixed(1) + "M"; if (a >= 1000) return "$" + (a/1000).toFixed(1) + "K"; return "$" + a.toFixed(0); };
const fmtPctVal = (n: number) => (n || 0).toFixed(2) + "%";

// ── Module-level shared styles ──
const btnBase = { border: "none", cursor: "pointer", fontFamily: F.body, fontWeight: 600, borderRadius: 12, transition: "all .15s" };

// ── i18n ──
const i18n = {
  en: {
    heroLine1: "Your 401(k),", tagline: "crystal clear",
    subtitle: "Upload your plan document or enrollment booklet. Ask anything. Finally understand your retirement plan.",
    dropTitle: "Drop your plan document here",
    dropSub: "PDF — SPD, Enrollment Booklet, or Fee Disclosure · 4.5 MB max per doc",
    trustPrivate: "Document never stored", trustEducation: "Education only, never advice",
    trustPlain: "Plain English answers", trustEncrypted: "Encrypted in transit",
    readingTitle: "Making your plan transparent...",
    readingSubPrefix: "Reading through", readingSubSuffix: "so you don't have to",
    disclaimer: "Education only — not financial advice",
    inputPlaceholder: "Ask about your plan...",
    footerDisclaimer: "Plansparency provides education about your plan, not personalized financial advice.",
    planProvisionDisclaimer: "Education only — not financial advice. Plan provisions reflect the documents you uploaded and are current as of the date of those documents. Plan provisions are subject to change — always confirm current details with your plan administrator or HR department.",
    firstMessage: `I just uploaded my 401(k) plan document. Please read through it and give me a brief welcome summary of my plan — plan name, employer contribution types (distinguish safe harbor from discretionary match and profit sharing), vesting schedule, and one standout feature. Mention Roth and catch-up availability.

IMPORTANT — include at the very end of your response a hidden data block on its own line in this EXACT format:
<!--PLANDATA:{"matchTiers":[{"pct":100,"upTo":4}],"hasRoth":true,"planAllowsCatchUp":true,"noMatch":false,"recordkeeperUrl":"https://www.example.com","recordkeeperName":"Example","lastDayProvision":false,"planName":"Example 401(k) Plan","ein":"","planNumber":"","contribEligibility":{"requirement":"Age 21 and 1 year of service","entryDates":"First day of the month following eligibility","autoEnroll":false,"autoEnrollPct":0},"matchEligibility":{"requirement":"1 year of service","entryDates":"Same as contribution eligibility","immediateMatch":false},"vestingSchedule":"6-year graded: 20% per year","loanAvailable":true,"rothAvailable":true,"hardshipAvailable":true,"investmentOptions":"Self-directed with target-date funds available","distributionInfo":{"inServiceAge":59.5,"rmdAge":73,"rolloversIn":true,"separationOptions":"Lump sum, installments, or rollover to IRA/other plan"},"safeHarbor":{"type":"none","formula":"","vestingImmediate":true},"profitSharing":{"available":false,"type":"discretionary","formula":"","lastDayApplies":false},"fundsData":[]}-->

Fill in based on the actual plan document:
- matchTiers: array of DISCRETIONARY match tiers ONLY with "pct" (match %) and "upTo" (% of pay). Do NOT include safe harbor match here.
- hasRoth: does the plan allow Roth elective deferrals?
- planAllowsCatchUp: does the plan document allow catch-up contributions for eligible participants?
- noMatch: true ONLY if there is NO discretionary employer match (safe harbor match does NOT go here)
- recordkeeperUrl: the URL where participants log in to manage their account
- recordkeeperName: the name of the recordkeeper/plan provider
- lastDayProvision: does the plan require employment on the last day of the plan year for DISCRETIONARY contributions (match and/or profit sharing)? This NEVER applies to safe harbor contributions.
- planName: the official name of the plan
- ein: the Employer Identification Number (EIN) if shown in the document, formatted XX-XXXXXXX
- planNumber: the 3-digit plan number (e.g. "001") from the document header if shown
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
- fundsData: array of fund objects. ONLY populate if the document contains an explicit fund lineup or investment option table. If no fund list exists, return "fundsData": []. For each fund found:
  * name: fund name exactly as printed
  * category: must be one of: "Cash & Stable Value", "Bonds", "Large Cap", "Mid Cap", "Small Cap", "International", "Specialty", "Asset Allocation", "Target Date"
  * expenseRatio: decimal if stated in document (0.0045 = 0.45%), else null
  * factSheetUrl: official fund company fact sheet URL only if you are certain of the exact URL for this fund and share class. For Vanguard: https://investor.vanguard.com/investment-products/mutual-funds/profile/{TICKER}#overview. For iShares: https://www.ishares.com/us/products/{TICKER}/. For Fidelity: https://fundresearch.fidelity.com/mutual-funds/summary/{TICKER}. Return null for all other fund families unless certain. NEVER guess — a missing link is better than a broken one.`,
    errorRead: "Something went wrong reading your document. Please try again.",
    errorPlanData: "We couldn't extract your plan data. This sometimes happens with scanned or image-based PDFs. Please try uploading again — if the problem continues, try a different copy of your plan document.",
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
    navYourPlan: "Your Plan",
    navCalculator: "Calculator",
    navKeyTerms: "Key Terms",
    navAsk: "Ask",
    keyTermsTitle: "Key Terms & Definitions",
    keyTermsSubtitle: "Plain-English explanations of 401(k) language",
    keyTerms: [
      { term: "401(k)", def: "A retirement savings account your employer sponsors. Your contributions come out of your paycheck before taxes — so you pay less in taxes today. Your money grows tax-deferred, meaning you pay taxes when you withdraw it in retirement." },
      { term: "Contribution", def: "The money you put in from your paycheck. You choose a percentage or dollar amount. The more you put in, the more your money can grow over time." },
      { term: "Employer Match", def: "Free money your employer adds when you contribute. Example: '50% match on the first 6%' means for every $1 you put in (up to 6% of your pay), your employer adds $0.50. That's an instant 50% return — hard to beat." },
      { term: "Safe Harbor Contribution", def: "A guaranteed employer contribution required by law. It's immediately 100% yours — no vesting wait. Unlike a regular match, a nonelective safe harbor doesn't require you to contribute to receive it." },
      { term: "Profit Sharing", def: "An extra employer contribution based on company performance. It's discretionary — the employer decides each year whether to give it and how much. Not guaranteed like a safe harbor." },
      { term: "Vesting", def: "The process of earning full ownership of your employer's contributions over time. Your own contributions are always 100% yours immediately. Employer contributions may have a waiting period." },
      { term: "Vesting Schedule", def: "The timeline that determines what percentage of employer contributions you keep if you leave. Example: '3-year cliff' = you get 0% if you leave before year 3, then 100% at year 3. 'Graded' means you earn it gradually year by year." },
      { term: "Pre-Tax (Traditional)", def: "You contribute money before paying income taxes on it. This lowers your taxable income today. You pay taxes when you withdraw in retirement. Good choice if you expect to be in a lower tax bracket in retirement." },
      { term: "Roth", def: "You contribute money you've already paid taxes on. Your money grows completely tax-free, and qualified withdrawals in retirement are tax-free too. Good choice if you expect to be in a higher tax bracket in retirement." },
      { term: "IRS Contribution Limit", def: "The maximum you're allowed to put in per year, set by the IRS. For 2025 it's $23,500. This limit is for your contributions only — employer contributions don't count toward it." },
      { term: "Catch-Up Contribution", def: "Extra contributions allowed if you're age 50 or older. In 2025: $7,500 extra for ages 50–59 and 64+, and $11,250 extra for ages 60–63 (a SECURE 2.0 boost). Your plan must allow catch-ups." },
      { term: "Rollover", def: "Moving money from one retirement account to another — like from an old job's 401(k) to an IRA or new employer's plan — without paying taxes. Must be done correctly (direct rollover) to avoid a tax hit." },
      { term: "Required Minimum Distribution (RMD)", def: "Starting at age 73, the IRS requires you to withdraw a minimum amount from your 401(k) each year, whether you need the money or not. Skipping it triggers a steep penalty." },
      { term: "Hardship Withdrawal", def: "Taking money out while still employed due to a serious financial emergency. Usually subject to income tax plus a 10% early withdrawal penalty if you're under age 59½. This is generally a last resort." },
      { term: "Plan Loan", def: "Borrowing from your own 401(k) balance. You repay yourself with interest. There are limits (usually up to 50% of your vested balance, max $50,000) and risks — if you leave your job, the loan may become due immediately." },
    ],
    suggestionTopicPlaceholder: "e.g. Loan process, Roth explanation...",
    suggestionDetailsPlaceholder: "What would you like to see improved or explained differently?",
    // Chooser
    chooserTitle: "What are you looking at today?",
    chooserSub: "We'll tailor the experience based on your document type",
    chooserSpd: "Plan Document",
    chooserSpdSub: "SPD, Enrollment Booklet, or Fee Disclosure — learn the rules of your plan",
    chooserStmt: "Account Statement",
    chooserStmtSub: "Quarterly or annual statement — see where your money stands",
    // Statement
    stmtFirstMessage: `I just uploaded my 401(k) account statement. Extract ALL financial data from this statement. Respond ONLY with the data block below — no summary.

<!--STMTDATA:{"planName":"","participantName":"","statementPeriod":{"start":"","end":""},"calendarYTD":{"start":"","end":""},"beginBalance":0,"endBalance":0,"ytdBeginBalance":0,"vestedBalance":0,"vestedPct":100,"personalROR":{"period":0,"ytd":0,"oneYear":0,"threeYear":0},"period":{"moneyIn":{"employeeSalaryDeferral":0,"employeeRoth":0,"employerMatch":0,"employerSafeHarbor":0,"employerProfitSharing":0,"employerOther":0,"rolloverIn":0,"loanRepayment":0,"total":0},"moneyOut":{"withdrawals":0,"distributions":0,"rollovers":0,"loans":0,"total":0},"fees":{"items":[{"name":"","amount":0}],"total":0},"gainLoss":0,"dividendsInterest":0},"ytd":{"moneyIn":{"employeeSalaryDeferral":0,"employeeRoth":0,"employerMatch":0,"employerSafeHarbor":0,"employerProfitSharing":0,"employerOther":0,"rolloverIn":0,"loanRepayment":0,"total":0},"moneyOut":{"withdrawals":0,"distributions":0,"rollovers":0,"loans":0,"total":0},"fees":{"items":[{"name":"","amount":0}],"total":0},"gainLoss":0,"dividendsInterest":0},"investments":[{"name":"","category":"","beginValue":0,"endValue":0,"shares":0,"pctOfAccount":0}],"sources":[{"name":"","beginValue":0,"contributions":0,"endValue":0,"vestedPct":100,"vestedValue":0}],"assetAllocation":{"stocks":0,"bonds":0,"multiAsset":0,"other":0},"recordkeeperName":"","recordkeeperUrl":"","recordkeeperPhone":""}-->

Fill EVERY field from the actual statement:
- statementPeriod: the quarter or period dates. calendarYTD: Jan 1 to end date.
- beginBalance/endBalance: for the statement period. ytdBeginBalance: balance at start of calendar year.
- period: all money in, money out, fees, gain/loss for the STATEMENT PERIOD only.
- ytd: all money in, money out, fees, gain/loss for the CALENDAR YEAR-TO-DATE. Many statements show both columns. If YTD is not shown, copy the period values.
- moneyIn: parse each contribution type separately. employeeSalaryDeferral = pre-tax employee contributions. employeeRoth = Roth contributions. employerMatch = discretionary match. employerSafeHarbor = safe harbor contributions. employerProfitSharing = profit sharing. employerOther = any other employer contribution.
- moneyOut: withdrawals, distributions, rollovers OUT, loans taken. All as positive numbers.
- fees.items: array of EVERY fee line item with name and amount (as positive number). Include ALL fees — administrative, asset charges, TPA fees, investment fees, consultant fees, etc.
- gainLoss: net change in market value / investment earnings (can be negative).
- investments: every fund with name, category, begin/end value, shares, % of account.
- sources: contribution source breakdown (Employee Salary Deferral, Roth, Employer Match, Safe Harbor, Profit Sharing, etc.) with vesting.
- For missing data use 0 or empty string. Never leave nulls.`,
    stmtDashTitle: "Your Account Snapshot",
    stmtDashSub: "Interactive summary of your statement",
    stmtUploadAnother: "Upload Another Statement",
    stmtAskQuestion: "Ask a Question",
    stmtMoneyIn: "Money In", stmtMoneyOut: "Money Out",
    stmtFees: "Fees & Expenses", stmtGainLoss: "Growth",
    stmtInvestments: "Your Investments",
    stmtSources: "Contribution Sources",
    stmtAllocation: "Asset Allocation",
    stmtPerformance: "Performance",
    stmtPeriod: "Statement Period",
    stmtDisclaimer: "This is a summary of your statement for educational purposes. It is not financial advice. Verify all figures with your plan administrator.",
  },
  es: {
    heroLine1: "Tu 401(k),", tagline: "totalmente claro",
    subtitle: "Sube tu documento del plan o folleto de inscripción. Pregunta lo que quieras.",
    dropTitle: "Arrastra tu documento aquí",
    dropSub: "PDF — SPD, Folleto de Inscripción o Divulgación de Comisiones · máx. 4.5 MB por doc",
    trustPrivate: "Documento nunca almacenado", trustEducation: "Solo educación",
    trustPlain: "Respuestas claras", trustEncrypted: "Cifrado en tránsito",
    readingTitle: "Haciendo tu plan transparente...",
    readingSubPrefix: "Leyendo", readingSubSuffix: "para que tú no tengas que",
    disclaimer: "Solo educación — no asesoría",
    inputPlaceholder: "Pregunta sobre tu plan...",
    footerDisclaimer: "Plansparency ofrece educación, no asesoría financiera personalizada.",
    planProvisionDisclaimer: "Solo educación — no es asesoramiento financiero. Las disposiciones del plan reflejan los documentos cargados y están vigentes a la fecha de esos documentos. Las disposiciones del plan están sujetas a cambios — confirma los detalles actuales con el administrador del plan o tu departamento de Recursos Humanos.",
    firstMessage: `Acabo de subir mi documento de plan 401(k). Dame un resumen de bienvenida — nombre del plan, tipos de contribución del empleador (distingue safe harbor de match discrecional y profit sharing), calendario de vesting, y una característica destacada. Menciona disponibilidad de Roth y catch-up. Responde en español.

IMPORTANTE — al final incluye en una línea:
<!--PLANDATA:{"matchTiers":[{"pct":100,"upTo":4}],"hasRoth":true,"planAllowsCatchUp":true,"noMatch":false,"recordkeeperUrl":"https://www.example.com","recordkeeperName":"Example","lastDayProvision":false,"planName":"Plan 401(k) Ejemplo","ein":"","planNumber":"","contribEligibility":{"requirement":"21 años y 1 año de servicio","entryDates":"Primer día del mes siguiente","autoEnroll":false,"autoEnrollPct":0},"matchEligibility":{"requirement":"1 año de servicio","entryDates":"Igual que elegibilidad de contribución","immediateMatch":false},"vestingSchedule":"6 años gradual: 20% por año","loanAvailable":true,"rothAvailable":true,"hardshipAvailable":true,"investmentOptions":"Auto-dirigido con fondos de fecha objetivo","distributionInfo":{"inServiceAge":59.5,"rmdAge":73,"rolloversIn":true,"separationOptions":"Suma global, cuotas, o transferencia a IRA/otro plan"},"safeHarbor":{"type":"none","formula":"","vestingImmediate":true},"profitSharing":{"available":false,"type":"discretionary","formula":"","lastDayApplies":false},"fundsData":[]}-->
Llena según el plan real. matchTiers = solo match DISCRECIONAL. safeHarbor y profitSharing son campos separados.
- fundsData: array de objetos de fondos. SOLO completa si el documento contiene una lista explícita de fondos o tabla de opciones de inversión. Si no hay lista de fondos, devuelve "fundsData": []. Para cada fondo:
  * name: nombre exacto del fondo tal como aparece en el documento
  * category: debe ser uno de: "Cash & Stable Value", "Bonds", "Large Cap", "Mid Cap", "Small Cap", "International", "Specialty", "Asset Allocation", "Target Date"
  * expenseRatio: decimal si está en el documento (0.0045 = 0.45%), o null
  * factSheetUrl: URL oficial de la ficha del fondo solo si estás seguro de la URL exacta. Para Vanguard: https://investor.vanguard.com/investment-products/mutual-funds/profile/{TICKER}#overview. Para iShares: https://www.ishares.com/us/products/{TICKER}/. Para Fidelity: https://fundresearch.fidelity.com/mutual-funds/summary/{TICKER}. Devuelve null para otras familias. NUNCA adivines.`,
    errorRead: "Error al leer. Intenta de nuevo.",
    errorPlanData: "No pudimos extraer los datos del plan. Esto puede ocurrir con PDFs escaneados. Por favor intenta subir de nuevo.",
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
    chooserTitle: "¿Qué estás viendo hoy?",
    chooserSub: "Adaptaremos la experiencia según tu documento",
    chooserSpd: "Documento del Plan",
    chooserSpdSub: "SPD, Folleto de Inscripción o Divulgación de Comisiones — aprende las reglas",
    chooserStmt: "Estado de Cuenta",
    chooserStmtSub: "Estado trimestral o anual — ve dónde está tu dinero",
    stmtFirstMessage: `Acabo de subir mi estado de cuenta 401(k). Extrae TODOS los datos financieros. Responde SOLO con el bloque de datos — sin resumen.

<!--STMTDATA:{"planName":"","participantName":"","statementPeriod":{"start":"","end":""},"calendarYTD":{"start":"","end":""},"beginBalance":0,"endBalance":0,"ytdBeginBalance":0,"vestedBalance":0,"vestedPct":100,"personalROR":{"period":0,"ytd":0,"oneYear":0,"threeYear":0},"period":{"moneyIn":{"employeeSalaryDeferral":0,"employeeRoth":0,"employerMatch":0,"employerSafeHarbor":0,"employerProfitSharing":0,"employerOther":0,"rolloverIn":0,"loanRepayment":0,"total":0},"moneyOut":{"withdrawals":0,"distributions":0,"rollovers":0,"loans":0,"total":0},"fees":{"items":[{"name":"","amount":0}],"total":0},"gainLoss":0,"dividendsInterest":0},"ytd":{"moneyIn":{"employeeSalaryDeferral":0,"employeeRoth":0,"employerMatch":0,"employerSafeHarbor":0,"employerProfitSharing":0,"employerOther":0,"rolloverIn":0,"loanRepayment":0,"total":0},"moneyOut":{"withdrawals":0,"distributions":0,"rollovers":0,"loans":0,"total":0},"fees":{"items":[{"name":"","amount":0}],"total":0},"gainLoss":0,"dividendsInterest":0},"investments":[{"name":"","category":"","beginValue":0,"endValue":0,"shares":0,"pctOfAccount":0}],"sources":[{"name":"","beginValue":0,"contributions":0,"endValue":0,"vestedPct":100,"vestedValue":0}],"assetAllocation":{"stocks":0,"bonds":0,"multiAsset":0,"other":0},"recordkeeperName":"","recordkeeperUrl":"","recordkeeperPhone":""}-->
Llena cada campo. period = solo período del estado. ytd = año calendario completo. Si YTD no aparece, copia los valores del período.`,
    stmtDashTitle: "Tu Resumen de Cuenta",
    stmtDashSub: "Resumen interactivo de tu estado de cuenta",
    stmtUploadAnother: "Subir Otro Estado",
    stmtAskQuestion: "Hacer una Pregunta",
    stmtMoneyIn: "Dinero que Entró", stmtMoneyOut: "Dinero que Salió",
    stmtFees: "Costos y Gastos", stmtGainLoss: "Crecimiento",
    stmtInvestments: "Tus Inversiones",
    stmtSources: "Fuentes de Contribución",
    stmtAllocation: "Distribución de Activos",
    stmtPerformance: "Rendimiento",
    stmtPeriod: "Período del Estado",
    stmtDisclaimer: "Este es un resumen educativo de tu estado de cuenta. No es asesoría financiera.",
    navYourPlan: "Tu Plan",
    navCalculator: "Calculadora",
    navKeyTerms: "Términos",
    navAsk: "Preguntar",
    keyTermsTitle: "Términos y Definiciones Clave",
    keyTermsSubtitle: "Explicaciones claras del lenguaje de los planes 401(k)",
    keyTerms: [
      { term: "401(k)", def: "Una cuenta de ahorro para el retiro patrocinada por tu empleador. Tus contribuciones salen de tu cheque antes de impuestos — pagas menos impuestos hoy. Tu dinero crece con impuestos diferidos hasta que lo retires en el retiro." },
      { term: "Contribución", def: "El dinero que aportas de tu cheque de pago. Tú eliges el porcentaje o la cantidad en dólares. Cuanto más aportes, más puede crecer tu dinero con el tiempo." },
      { term: "Match del Empleador", def: "Dinero gratis que tu empleador agrega cuando contribuyes. Ejemplo: '50% en los primeros 6%' significa que por cada $1 que pones (hasta el 6% de tu salario), tu empleador agrega $0.50. Es un retorno inmediato del 50%." },
      { term: "Contribución Safe Harbor", def: "Una contribución garantizada del empleador requerida por ley. Es 100% tuya inmediatamente — sin período de espera de vesting. El safe harbor no electivo no requiere que contribuyas para recibirlo." },
      { term: "Profit Sharing", def: "Una contribución adicional del empleador basada en el desempeño de la empresa. Es discrecional — el empleador decide cada año si la da y cuánto. No está garantizada como el safe harbor." },
      { term: "Vesting", def: "El proceso de ganar la propiedad total de las contribuciones de tu empleador con el tiempo. Tus propias contribuciones siempre son 100% tuyas de inmediato." },
      { term: "Calendario de Vesting", def: "El cronograma que determina qué porcentaje de las contribuciones del empleador conservas si te vas. Ejemplo: '3 años cliff' = obtienes 0% si te vas antes del año 3, luego 100% al año 3." },
      { term: "Pre-Impuesto (Tradicional)", def: "Contribuyes dinero antes de pagar impuestos sobre él. Esto reduce tu ingreso gravable hoy. Pagas impuestos cuando retiras en la jubilación." },
      { term: "Roth", def: "Contribuyes dinero sobre el que ya pagaste impuestos. Tu dinero crece completamente libre de impuestos, y los retiros calificados en la jubilación también son libres de impuestos." },
      { term: "Límite de Contribución del IRS", def: "El máximo que puedes aportar por año, establecido por el IRS. Para 2025 es $23,500. Este límite es solo para tus contribuciones — las del empleador no cuentan." },
      { term: "Contribución de Recuperación (Catch-Up)", def: "Contribuciones adicionales permitidas si tienes 50 años o más. En 2025: $7,500 extra para edades 50–59 y 64+, y $11,250 extra para edades 60–63. Tu plan debe permitirlas." },
      { term: "Rollover (Transferencia)", def: "Mover dinero de una cuenta de retiro a otra — como de un 401(k) anterior a una IRA o plan de nuevo empleador — sin pagar impuestos. Debe hacerse correctamente (rollover directo)." },
      { term: "Distribución Mínima Requerida (RMD)", def: "A partir de los 73 años, el IRS requiere que retires una cantidad mínima de tu 401(k) cada año. Saltarte el retiro activa una multa importante." },
      { term: "Retiro por Dificultad", def: "Retirar dinero mientras sigues empleado debido a una emergencia financiera grave. Generalmente sujeto al impuesto sobre la renta más una penalidad del 10% si tienes menos de 59½ años." },
      { term: "Préstamo del Plan", def: "Pedir prestado de tu propio saldo del 401(k). Te reembolsas a ti mismo con intereses. Hay límites (normalmente hasta el 50% de tu saldo investido, máx $50,000) y riesgos." },
    ],
  },
};

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
// Sends the PDF as FormData directly to /api/ingest (Node.js route).
// No Vercel Blob intermediary — eliminates the SDK retry-loop hang.
// onProgress(pct) fires with 0..100 as the upload progresses.
async function uploadFile(
  f: File,
  onProgress?: (pct: number) => void,
  abortSignal?: AbortSignal,
): Promise<string> {
  // 3-minute hard timeout; also respects the caller's AbortSignal
  const localCtrl = new AbortController();
  const timeoutId = setTimeout(() => localCtrl.abort(), 180_000);

  // Combine caller signal + our timeout signal
  let signal: AbortSignal;
  if (!abortSignal) {
    signal = localCtrl.signal;
  } else if ((AbortSignal as any).any) {
    signal = (AbortSignal as any).any([abortSignal, localCtrl.signal]);
  } else {
    // AbortSignal.any unavailable: forward caller abort into localCtrl so both are respected
    if (abortSignal.aborted) {
      localCtrl.abort(abortSignal.reason);
    } else {
      abortSignal.addEventListener('abort', () => localCtrl.abort(abortSignal.reason), { once: true });
    }
    signal = localCtrl.signal;
  }

  // Fake progress animation (fetch doesn't expose upload progress)
  let fakeProgress = 0;
  let progressTimer: ReturnType<typeof setInterval> | null = null;
  if (onProgress) {
    onProgress(0);
    progressTimer = setInterval(() => {
      // Asymptotically approach 80 % so it never reaches 100 before we're done
      fakeProgress = fakeProgress + (80 - fakeProgress) * 0.12;
      onProgress(Math.round(fakeProgress));
    }, 350);
  }

  const clearProgress = () => {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
    clearTimeout(timeoutId);
  };

  try {
    const formData = new FormData();
    formData.append('file', f, f.name || 'upload.pdf');

    const res = await fetch('/api/ingest', {
      method: 'POST',
      body: formData,
      signal,
    });

    clearProgress();
    if (onProgress) onProgress(90); // ingest received; Anthropic upload in progress

    if (!res.ok) {
      let data: any = {};
      try { data = await res.json(); } catch {}
      const err: any = new Error(data?.error || `Upload failed: HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    if (!data?.fileId) throw new Error('No fileId returned from upload');
    if (onProgress) onProgress(100);
    return data.fileId as string;

  } catch (e: any) {
    clearProgress();
    if (e.name === 'AbortError') {
      const te: any = new Error(
        'Upload timed out — please check your internet connection and try again.'
      );
      te.status = 504;
      throw te;
    }
    throw e;
  }
}

// pdf: base64-encoded PDF string (small-file fallback only); null for follow-up questions
// fileIds: one or more Anthropic Files API file_ids; accepts string (legacy) or string[]
// onChunk: called with each streamed text token as it arrives
async function callClaude(
  msgs: any[],
  pdf: string | null,
  lang: string,
  planData: any,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
  fileIds?: string | string[] | null
): Promise<string> {
  const ids: string[] = Array.isArray(fileIds) ? fileIds : (fileIds ? [fileIds] : []);
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: msgs,
      pdf: pdf ?? undefined,
      fileIds: ids.length > 0 ? ids : undefined,
      lang,
      planData,
    }),
    signal,
  });

  if (!response.ok) {
    // Error responses are JSON — parse for the error message
    let data: any = {};
    try { data = await response.json(); } catch {}
    const msg = data?.error || `HTTP ${response.status}`;
    const err: any = new Error(msg);
    err.status = response.status;
    throw err;
  }

  // Success — stream plain-text token chunks from the route
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onChunk(chunk);
  }

  return full;
}
function parsePlanData(text) { const m = text.match(/<!--PLANDATA:(.*?)-->/s); if (!m) return null; try { return JSON.parse(m[1]); } catch { return null; } }
function stripPlanData(text) { return text.replace(/<!--PLANDATA:.*?-->/gs, "").trim(); }

// ── normalizePlanData ──────────────────────────────────────────────────────
// Single validation + coercion layer between raw Claude output and the dashboard.
// Accepts the parsed object (or null) and returns a clean, type-safe object or null.
// Prevents: boolean strings, wrong safeHarbor enum values, object vestingSchedule,
// missing safeHarbor.type, and wrong matchTier field names from breaking the UI.
function normalizePlanData(raw: any): any {
  if (!raw || typeof raw !== 'object') return null;

  // ── booleans: coerce "true"/"false"/1/0 strings to real booleans ──────────
  const toBool = (v: any, fallback: boolean | null = null): boolean | null => {
    if (typeof v === 'boolean') return v;
    if (v === 'true' || v === 1 || v === 'yes') return true;
    if (v === 'false' || v === 0 || v === 'no') return false;
    return fallback;
  };

  // ── safeHarbor.type: normalize to exact enum the calculator expects ────────
  const SAFE_HARBOR_ENUM = ['nonelective', 'basic_match', 'enhanced_match', 'qaca', 'none'];
  const normalizeSHType = (t: any): string => {
    if (!t || typeof t !== 'string') return 'none';
    const lower = t.toLowerCase().replace(/[^a-z_]/g, '');
    if (SAFE_HARBOR_ENUM.includes(lower)) return lower;
    // Common Claude variations → canonical enum
    if (lower.includes('nonelective') || lower.includes('non_elective') || lower === '3') return 'nonelective';
    if (lower.includes('basic')) return 'basic_match';
    if (lower.includes('enhanced')) return 'enhanced_match';
    if (lower.includes('qaca')) return 'qaca';
    return 'none';
  };

  // ── vestingSchedule: must be a string ────────────────────────────────────
  const normalizeVesting = (v: any): string | undefined => {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (v && typeof v === 'object') {
      // Claude sometimes outputs {type:"graded", years:6} — flatten to readable string
      const parts: string[] = [];
      if (v.type) parts.push(String(v.type));
      if (v.years) parts.push(`${v.years}-year`);
      if (v.schedule) parts.push(String(v.schedule));
      if (v.description) parts.push(String(v.description));
      const joined = parts.join(' ').trim();
      return joined || undefined;
    }
    return undefined;
  };

  // ── matchTiers: normalize pct/upTo field names ────────────────────────────
  // Claude may use: percentage/pct/matchPct/rate AND upToPercent/upTo/cap/maxPct
  const normalizeTiers = (tiers: any): any[] => {
    if (!Array.isArray(tiers)) return [];
    return tiers.map(t => {
      if (typeof t !== 'object' || !t) return null;
      const pct = t.pct ?? t.percentage ?? t.matchPct ?? t.rate ?? t.matchPercentage;
      const upTo = t.upTo ?? t.upToPercent ?? t.cap ?? t.maxPct ?? t.upToPercentage ?? t.limit;
      if (pct == null || upTo == null) return null;
      return { pct: Number(pct), upTo: Number(upTo) };
    }).filter(Boolean);
  };

  const sh = raw.safeHarbor && typeof raw.safeHarbor === 'object' ? raw.safeHarbor : {};
  const ps = raw.profitSharing && typeof raw.profitSharing === 'object' ? raw.profitSharing : {};
  const ce = raw.contribEligibility && typeof raw.contribEligibility === 'object' ? raw.contribEligibility : {};

  return {
    // identity
    planName: typeof raw.planName === 'string' ? raw.planName.trim() : undefined,
    ein: raw.ein ?? undefined,
    planNumber: raw.planNumber ?? undefined,
    recordkeeperName: typeof raw.recordkeeperName === 'string' ? raw.recordkeeperName.trim() : undefined,
    recordkeeperUrl: typeof raw.recordkeeperUrl === 'string' ? raw.recordkeeperUrl.trim() : undefined,
    // match
    matchTiers: normalizeTiers(raw.matchTiers),
    noMatch: toBool(raw.noMatch, false),
    lastDayProvision: toBool(raw.lastDayProvision, null),
    // safe harbor — type MUST be a valid enum string
    safeHarbor: {
      type: normalizeSHType(sh.type),
      formula: typeof sh.formula === 'string' ? sh.formula.trim() : '',
      vestingImmediate: toBool(sh.vestingImmediate, true),
    },
    // profit sharing
    profitSharing: {
      available: toBool(ps.available, false),
      type: typeof ps.type === 'string' ? ps.type : 'discretionary',
      formula: typeof ps.formula === 'string' ? ps.formula.trim() : '',
      lastDayApplies: toBool(ps.lastDayApplies, null),
    },
    // eligibility
    contribEligibility: {
      requirement: typeof ce.requirement === 'string' ? ce.requirement.trim() : undefined,
      entryDates: typeof ce.entryDates === 'string' ? ce.entryDates.trim() : undefined,
      autoEnroll: toBool(ce.autoEnroll, false),
      autoEnrollPct: typeof ce.autoEnrollPct === 'number' ? ce.autoEnrollPct : 0,
    },
    matchEligibility: raw.matchEligibility ?? undefined,
    // features — booleans coerced
    loanAvailable: toBool(raw.loanAvailable, null),
    hardshipAvailable: toBool(raw.hardshipAvailable, null),
    // rothAvailable / hasRoth — accept either field name
    hasRoth: toBool(raw.hasRoth ?? raw.rothAvailable, false),
    rothAvailable: toBool(raw.rothAvailable ?? raw.hasRoth, false),
    planAllowsCatchUp: toBool(raw.planAllowsCatchUp, true),
    // vesting — must be a string
    vestingSchedule: normalizeVesting(raw.vestingSchedule),
    // text fields
    investmentOptions: typeof raw.investmentOptions === 'string' ? raw.investmentOptions.trim() : undefined,
    distributionInfo: raw.distributionInfo ?? undefined,
    // funds — must be an array
    fundsData: Array.isArray(raw.fundsData) ? raw.fundsData : [],
  };
}

// ── Markdown ──
function Md({ text }) {
  const lines = text.split("\n"), els = []; let li = [];
  const flush = () => { if (li.length) { els.push(<ul key={`u${els.length}`} style={{ margin: "8px 0", paddingLeft: 20 }}>{li.map((x, i) => <li key={i} style={{ marginBottom: 4, color: C.text }}><Fm t={x} /></li>)}</ul>); li = []; } };
  lines.forEach((l, i) => { const b = l.match(/^[\-\*•]\s+(.*)/), n = l.match(/^\d+[\.\)]\s+(.*)/); if (b) { li.push(b[1]); return; } if (n) { li.push(n[1]); return; } flush(); if (!l.trim()) els.push(<div key={i} style={{ height: 8 }} />); else els.push(<p key={i} style={{ margin: "4px 0", lineHeight: 1.6, color: C.text }}><Fm t={l} /></p>); }); flush(); return <>{els}</>;
}
function Fm({ t }) { const p = t.split(/(\*\*.*?\*\*)/g); return <>{p.map((s, i) => s.startsWith("**") && s.endsWith("**") ? <strong key={i} style={{ color: C.accent }}>{s.slice(2, -2)}</strong> : <span key={i}>{s}</span>)}</>; }

// ── Shared UI ──
function LangToggle({ lang, setLang, disabled }) {
  const labels = { en: "EN", es: "ES" };
  return (
    <div style={{ display: "inline-flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, background: C.surface, opacity: disabled ? .5 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      {["en", "es"].map(l => (
        <button key={l} onClick={() => setLang(l)} style={{ padding: "7px 11px", border: "none", cursor: "pointer", fontFamily: F.body, fontSize: 11, fontWeight: 600, background: lang === l ? C.accentDim : "transparent", color: lang === l ? C.accent : C.textMuted, transition: "all .15s" }}>{labels[l]}</button>
      ))}
    </div>
  );
}
function Logo({ small }) {
  return <div style={{ display: "inline-flex", alignItems: "center", gap: small ? 8 : 10, padding: small ? 0 : "8px 16px", borderRadius: small ? 0 : 100, border: small ? "none" : `1px solid ${C.border}`, background: small ? "transparent" : C.surface }}>
    <div style={{ width: small ? 28 : 30, height: small ? 28 : 30, borderRadius: 8, background: `linear-gradient(135deg,${C.accent},#B8863A)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: small ? 13 : 14, fontWeight: 700, color: "#0F1621" }}>P</div>
    <span style={{ fontFamily: F.display, fontSize: small ? 17 : 22, fontWeight: 600, letterSpacing: "-.01em", color: C.text }}>Plan<span style={{ color: C.accent }}>sparency</span></span>
  </div>;
}
function Shield({ color, sz = 18 }) { return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>; }
function Modal({ children }) { return <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)" }}><div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, maxWidth: 520, width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "32px 28px", boxShadow: "0 24px 80px rgba(0,0,0,.6)" }}>{children}</div></div>; }

function TabBar({ activeTab, setActiveTab, t }) {
  const tabs = [
    {
      id: "dashboard",
      label: t.navYourPlan,
      icon: (active) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? C.accent : C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      id: "calculator",
      label: t.navCalculator,
      icon: (active) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? C.accent : C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2"/>
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="10" x2="16" y2="10"/>
          <line x1="8" y1="14" x2="11" y2="14"/>
          <line x1="13" y1="14" x2="16" y2="14"/>
          <line x1="8" y1="18" x2="11" y2="18"/>
          <line x1="13" y1="18" x2="16" y2="18"/>
        </svg>
      ),
    },
    {
      id: "keyterms",
      label: t.navKeyTerms,
      icon: (active) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? C.accent : C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          <line x1="9" y1="7" x2="15" y2="7"/>
          <line x1="9" y1="11" x2="15" y2="11"/>
          <line x1="9" y1="15" x2="12" y2="15"/>
        </svg>
      ),
    },
    {
      id: "chat",
      label: t.navAsk,
      icon: (active) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? C.accent : C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      display: "flex",
      borderBottom: `1px solid ${C.border}`,
      background: C.surface,
      flexShrink: 0,
    }}>
      {tabs.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "10px 4px 8px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${active ? C.accent : "transparent"}`,
              cursor: "pointer",
              fontFamily: F.body,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              transition: "all .15s",
              color: active ? C.accent : C.textMuted,
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textMuted; }}
          >
            {tab.icon(active)}
            <span style={{
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              letterSpacing: ".03em",
              textTransform: "uppercase",
            }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Key Terms Panel ──
function KeyTermsPanel({ t }) {
  const [openIndex, setOpenIndex] = React.useState(null);
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: F.head }}>{t.keyTermsTitle}</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{t.keyTermsSubtitle}</div>
      </div>
      {t.keyTerms.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={i} style={{
            borderRadius: 10,
            border: `1px solid ${open ? C.accent : C.border}`,
            marginBottom: 8,
            overflow: "hidden",
            background: open ? `${C.accent}08` : C.surface,
            transition: "border-color .15s, background .15s",
          }}>
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", background: "none", border: "none", cursor: "pointer",
                fontFamily: F.body, textAlign: "left",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: open ? C.accent : C.text }}>{item.term}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={open ? C.accent : C.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {open && (
              <div style={{ padding: "0 14px 14px", fontSize: 13, color: C.textMuted, lineHeight: 1.6, animation: "fadeIn .2s" }}>
                {item.def}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Plan Guide / Investments 2-Tab Bar ──
function PlanGuideTabBar({ activeTab, setActiveTab, hasFunds }) {
  const tabs = [
    { id: "guide", label: "Plan Guide" },
    { id: "investments", label: "Investments" },
  ];
  return (
    <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      {tabs.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: "11px 8px 9px",
              background: active ? C.accentDim : "transparent",
              border: "none",
              borderBottom: `2px solid ${active ? C.accent : "transparent"}`,
              cursor: "pointer", fontFamily: F.body,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all .15s",
              color: active ? C.accent : C.textMuted,
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textMuted; }}
          >
            <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, letterSpacing: ".03em", textTransform: "uppercase" }}>
              {tab.label}
            </span>
            {tab.id === "investments" && !hasFunds && (
              <span style={{
                fontSize: 9, fontWeight: 700, background: C.accentDim, color: C.accent,
                border: `1px solid ${C.accent}44`, borderRadius: 100, padding: "1px 6px",
                textTransform: "uppercase", letterSpacing: ".04em",
              }}>
                UPLOAD DOC
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Fund Row ──
function FundRow({ fund, showCategory, riskMap }) {
  const risk = riskMap[fund.category] || { label: "—", color: C.textDim };
  const erPct = fund.expenseRatio !== null && fund.expenseRatio !== undefined
    ? (fund.expenseRatio * 100).toFixed(2) + "%"
    : null;
  return (
    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: showCategory && fund.category ? 2 : 0, lineHeight: 1.3 }}>{fund.name}</div>
        {showCategory && fund.category && (
          <div style={{ fontSize: 10, color: C.textDim }}>{fund.category}</div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: risk.color,
          background: `${risk.color}18`, border: `1px solid ${risk.color}30`,
          borderRadius: 100, padding: "2px 8px", whiteSpace: "nowrap",
        }}>
          {risk.label}
        </span>
        {erPct && (
          <span style={{ fontSize: 11, color: C.textMuted, whiteSpace: "nowrap" }}>{erPct}</span>
        )}
        {fund.factSheetUrl && (
          <a
            href={fund.factSheetUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: C.accent, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
          >
            View Summary →
          </a>
        )}
      </div>
    </div>
  );
}

// ── Investments Panel ──
const CATEGORY_ORDER = [
  "Cash & Stable Value", "Bonds", "Large Cap", "Mid Cap", "Small Cap",
  "International", "Specialty", "Asset Allocation", "Target Date",
];
const RISK_MAP = {
  "Cash & Stable Value": { label: "Low Risk",  color: C.green },
  "Bonds":               { label: "Low–Med",   color: C.textMuted },
  "Target Date":         { label: "Varies",    color: C.accent },
  "Asset Allocation":    { label: "Varies",    color: C.accent },
  "Large Cap":           { label: "Medium",    color: C.accent },
  "Mid Cap":             { label: "Med–High",  color: C.accent },
  "Small Cap":           { label: "High Risk", color: C.danger },
  "International":       { label: "Med–High",  color: C.accent },
  "Specialty":           { label: "High Risk", color: C.danger },
};

const FUND_DISCLAIMER = "This fund list is for educational reference only. Not investment advice or a recommendation of any fund. Consult your plan advisor for investment guidance. Links open fund company materials — Plansparency is not affiliated with any fund listed.";

function DisclosureCallout({ lang = "en" }) {
  const [open, setOpen] = useState(false);
  const es = lang === "es";
  const title = es
    ? "Solo Uso Educativo — No Es Asesoría de Inversión"
    : "Educational Use Only — Not Investment Advice";
  return (
    <div style={{
      margin: "12px 16px 4px",
      borderLeft: `4px solid ${C.accent}`,
      background: "rgba(184,134,11,.06)",
      borderRadius: "0 10px 10px 0",
      flexShrink: 0,
      overflow: "hidden",
    }}>
      {/* Always-visible header — tap to expand/collapse */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", background: "none", border: "none", cursor: "pointer",
        fontFamily: F.body, gap: 8,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: ".05em", textAlign: "left" }}>
          {title}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {/* Expandable body */}
      {open && (
        <div style={{ padding: "0 16px 14px", fontSize: 12, color: C.textMuted, lineHeight: 1.65 }}>
          {es ? (<>
            <p style={{ margin: "0 0 8px" }}>Los fondos aquí listados provienen directamente de los documentos de tu plan, tal como fueron proporcionados por tu empleador y administrador. Nada en esta página es una recomendación, respaldo o sugerencia de invertir en ningún fondo específico.</p>
            <p style={{ margin: "0 0 8px" }}>Tú eres responsable de todas las decisiones de inversión en tu plan — incluyendo qué fondos eliges, cuánto asignas y cuándo realizas cambios. Los resultados de tus inversiones, incluyendo ganancias y pérdidas, son tu responsabilidad exclusiva.</p>
            <p style={{ margin: "0 0 8px" }}>Plansparency no evalúa, compara ni determina si algún fondo es adecuado para tu situación. Los enlaces llevan a materiales publicados por la gestora del fondo — Plansparency no tiene ninguna relación con los fondos listados.</p>
            <p style={{ margin: 0, fontWeight: 600, color: C.textMuted }}>Si necesitas orientación sobre cómo invertir tu 401(k), habla con el asesor de tu plan o un profesional financiero calificado.</p>
          </>) : (<>
            <p style={{ margin: "0 0 8px" }}>The funds listed here are taken directly from your plan documents exactly as provided by your employer and recordkeeper. Nothing on this page is a recommendation, endorsement, or suggestion to invest in any specific fund.</p>
            <p style={{ margin: "0 0 8px" }}>You are responsible for all investment decisions in your plan — including which funds you choose, how much you allocate, and when you make changes. Investment outcomes, including gains and losses, are your responsibility alone.</p>
            <p style={{ margin: "0 0 8px" }}>Plansparency does not evaluate, compare, or assess whether any fund is right for your situation. Any links go to fund company materials published by the fund manager — Plansparency has no relationship with any fund listed.</p>
            <p style={{ margin: 0, fontWeight: 600, color: C.textMuted }}>If you need guidance on how to invest your 401(k), please speak with your plan advisor or a qualified financial professional.</p>
          </>)}
        </div>
      )}
    </div>
  );
}

function InvestmentsPanel({ fundsData, lang }) {
  const [sortBy, setSortBy] = useState("category");
  const hasExpenseRatios = fundsData.some(f => f.expenseRatio !== null && f.expenseRatio !== undefined);

  if (fundsData.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <DisclosureCallout lang={lang} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: C.accentDim,
              border: `1px solid ${C.accent}22`, display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 16px",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 10px" }}>
              Fund lineup not found in this document
            </h3>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, margin: 0 }}>
              Upload your enrollment booklet, investment guide, or 404(a)(5) fee disclosure to load your fund lineup.
            </p>
          </div>
        </div>
        <div style={{ padding: "10px 16px", background: C.surfaceAlt, borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.textDim, lineHeight: 1.6, flexShrink: 0 }}>
          {FUND_DISCLAIMER}
        </div>
      </div>
    );
  }

  const sortedFunds = [...fundsData].sort((a, b) => {
    if (sortBy === "category") {
      const ai = CATEGORY_ORDER.indexOf(a.category);
      const bi = CATEGORY_ORDER.indexOf(b.category);
      if (ai !== bi) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "expense") {
      const av = a.expenseRatio ?? Infinity;
      const bv = b.expenseRatio ?? Infinity;
      return av - bv;
    }
    return 0;
  });

  const sortOpts = [
    { id: "category", label: "By Category" },
    { id: "name", label: "A–Z" },
    ...(hasExpenseRatios ? [{ id: "expense", label: "Expense Ratio" }] : []),
  ];

  let listContent;
  if (sortBy === "category") {
    const grouped: Record<string, typeof fundsData> = {};
    sortedFunds.forEach(f => {
      const cat = f.category || "Other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(f);
    });
    const cats = CATEGORY_ORDER.filter(c => grouped[c]);
    // Tack on any uncategorized
    Object.keys(grouped).filter(c => !CATEGORY_ORDER.includes(c)).forEach(c => cats.push(c));
    listContent = cats.map(cat => (
      <React.Fragment key={cat}>
        <div style={{
          padding: "7px 16px 5px", background: C.surfaceAlt,
          borderBottom: `1px solid ${C.borderLight}`,
          position: "sticky", top: 0, zIndex: 1,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em" }}>{cat}</span>
        </div>
        {grouped[cat].map((fund, i) => (
          <FundRow key={i} fund={fund} showCategory={false} riskMap={RISK_MAP} />
        ))}
      </React.Fragment>
    ));
  } else {
    listContent = sortedFunds.map((fund, i) => (
      <FundRow key={i} fund={fund} showCategory={true} riskMap={RISK_MAP} />
    ));
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <DisclosureCallout />

      {/* Sort controls */}
      <div style={{ padding: "10px 16px", display: "flex", gap: 6, alignItems: "center", borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.surface }}>
        <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", marginRight: 4 }}>Sort:</span>
        {sortOpts.map(opt => (
          <button key={opt.id} onClick={() => setSortBy(opt.id)} style={{
            padding: "5px 12px", borderRadius: 100,
            border: `1px solid ${sortBy === opt.id ? C.accent : C.border}`,
            background: sortBy === opt.id ? C.accentDim : "transparent",
            color: sortBy === opt.id ? C.accent : C.textMuted,
            fontSize: 11, fontWeight: sortBy === opt.id ? 700 : 500, fontFamily: F.body,
            cursor: "pointer", transition: "all .15s",
          }}>
            {opt.label}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 10, color: C.textDim }}>{fundsData.length} {fundsData.length === 1 ? "fund" : "funds"}</span>
      </div>

      {/* Fund list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {listContent}
      </div>

      {/* Pinned disclaimer */}
      <div style={{ padding: "10px 16px", background: C.surfaceAlt, borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.textDim, lineHeight: 1.6, flexShrink: 0 }}>
        {FUND_DISCLAIMER}
      </div>
    </div>
  );
}

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
    keyTerms: <svg {...s} stroke="#D4A853"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  };
  return icons[type] || null;
}

// ── Error Boundary ──
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, fontFamily: F.body }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "32px 28px", maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontFamily: F.display, fontSize: 22, color: C.text, marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24, lineHeight: 1.6 }}>{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })} style={{ ...btnBase, padding: "11px 24px", background: `linear-gradient(135deg,${C.accent},#B8863A)`, color: "#0F1621", fontSize: 14 }}>Try again</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// ── App Header (shared across dashboard / statement / chat stages) ──
function AppHeader({ accentColor, title, onBack, backLabel, lang, setLang, loading, t, advisorLogo, advisorFirmName }) {
  return (
    <div style={{ padding: "10px 16px", borderBottom: `2px solid ${accentColor}`, background: C.surface, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {onBack && (
          <button onClick={onBack} style={{
            padding: "7px 14px", borderRadius: 10, border: `1px solid ${accentColor}`,
            background: `${accentColor}22`, color: accentColor, fontSize: 12, fontFamily: F.body,
            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            transition: "all .15s", flexShrink: 0,
          }}
            onMouseEnter={e => e.currentTarget.style.background = `${accentColor}44`}
            onMouseLeave={e => e.currentTarget.style.background = `${accentColor}22`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            {backLabel}
          </button>
        )}
        {advisorLogo || advisorFirmName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {advisorLogo && <img src={advisorLogo} alt={advisorFirmName || 'Advisor'} style={{ height: 28, borderRadius: 6, objectFit: 'contain' }} />}
            {advisorFirmName && <span style={{ fontFamily: F.display, fontSize: 17, fontWeight: 600, color: C.text }}>{advisorFirmName}</span>}
          </div>
        ) : (
          <Logo small />
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.green, background: C.greenDim, padding: "3px 8px", borderRadius: 100, border: "1px solid rgba(92,184,138,.15)" }}>
            <Shield color={C.green} sz={10} />{t.securityBadge}
          </div>
          <LangToggle lang={lang} setLang={setLang} disabled={loading} />
          <div style={{ fontSize: 10, color: C.warning, background: "rgba(212,168,67,.08)", padding: "3px 8px", borderRadius: 100, border: "1px solid rgba(212,168,67,.18)", whiteSpace: "nowrap" }}>
            {t.disclaimer}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: accentColor, flexShrink: 0 }} />
        <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: ".01em" }}>{title}</div>
      </div>
    </div>
  );
}

// ── Page Background (shared across landing / chooser) ──
function PageBackground() {
  return <>
    <div style={{ position: "absolute", inset: 0, opacity: .02, backgroundImage: `linear-gradient(${C.accent} 1px,transparent 1px),linear-gradient(90deg,${C.accent} 1px,transparent 1px)`, backgroundSize: "80px 80px" }} />
    <div style={{ position: "absolute", top: -200, left: "25%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,168,83,.12) 0%,transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />
  </>;
}

// ── Trust Row (shared across landing / chooser) ──
function TrustRow({ t }) {
  return (
    <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
      {[[<Shield key="s" color={C.accent} sz={14} />, t.trustPrivate], ["🔒", t.trustEncrypted], ["📚", t.trustEducation], ["💬", t.trustPlain]]
        .map(([ic, lb], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.textMuted }}>{ic}<span>{lb}</span></div>)}
    </div>
  );
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

// ── Plan Guide Dashboard (Tile Cards) ──
function PlanDashboard({ t, planData, onSectionClick, onChat, onUploadAnother, lang }) {
  const pd = planData || {};
  const tiers = pd.matchTiers || [];
  const noMatch = pd.noMatch || tiers.length === 0;
  const matchDesc = noMatch ? null : tiers.map(tier => `${tier.pct}% on first ${tier.upTo}%`).join(" + ");
  const hasSafeHarbor = pd.safeHarbor?.type && pd.safeHarbor.type !== "none";
  const hasProfitSharing = pd.profitSharing?.available;
  // Claude may output either "hasRoth" or "rothAvailable" — check both, same question
  const planHasRoth = pd.hasRoth ?? pd.rothAvailable ?? false;

  const es = lang === "es";

  const planName = pd.planName || (es ? "Tu Plan 401(k)" : "Your 401(k) Plan");

  // Detect whether a field was actually found in the document vs just defaulted
  const rothKnown = pd.hasRoth != null || pd.rothAvailable != null;
  const freeMoney = hasSafeHarbor ? "Safe Harbor"
    : pd.noMatch === true ? (es ? "No hay" : "None")
    : matchDesc || "N/A";
  const freeMoneyColor = (hasSafeHarbor || matchDesc) ? C.green : C.textDim;
  const vestingValue = pd.vestingSchedule
    ? (pd.vestingSchedule.toLowerCase().includes("immediate") || pd.vestingSchedule.includes("100%")
        ? (es ? "Inmediato" : "Immediate")
        : (es ? "Gradual" : "Graded"))
    : "N/A";
  const rothValue = !rothKnown ? "N/A" : planHasRoth ? (es ? "Sí" : "Yes") : (es ? "No" : "No");
  const rothColor = !rothKnown ? C.textDim : planHasRoth ? C.green : C.textDim;
  const loansValue = pd.loanAvailable === true ? (es ? "Sí" : "Yes")
    : pd.loanAvailable === false ? (es ? "No" : "No")
    : "N/A";

  // Quick-glance stat chips shown in the hero — each is clickable to ask Claude for detail
  const quickStats = [
    {
      emoji: "💰", label: es ? "Dinero Gratis" : "Free Money", value: freeMoney, color: freeMoneyColor,
      prompt: es
        ? "Explícame en detalle el dinero gratis que ofrece este plan. Distingue entre safe harbor, match discrecional y profit sharing. ¿Cuánto aporta el empleador? ¿Hay condiciones? Usa un ejemplo con $50,000 de salario."
        : "Explain in detail the free money available in this plan. Distinguish between safe harbor, discretionary match, and profit sharing. How much does the employer contribute? Are there any conditions? Use a $50,000 salary example.",
    },
    {
      emoji: "⏳", label: "Vesting", value: vestingValue, color: C.accent,
      prompt: es
        ? "Explícame el calendario de vesting de este plan. ¿Qué contribuciones son inmediatamente 100% mías (como safe harbor)? ¿Cuáles siguen un calendario de vesting? ¿Qué pasa si me voy antes de estar totalmente vestido?"
        : "Explain the vesting schedule in this plan. Which contributions are immediately 100% mine (like safe harbor)? Which follow a vesting schedule? What happens if I leave before I'm fully vested?",
    },
    {
      emoji: "☀️", label: "Roth", value: rothValue, color: rothColor,
      prompt: es
        ? "Explícame las opciones Roth y pre-impuesto en este plan. ¿Cuál es la diferencia práctica? ¿Cuándo conviene elegir Roth? ¿Cuándo conviene pre-impuesto? ¿Qué ofrece exactamente este plan?"
        : "Explain the Roth and pre-tax options in this plan. What's the practical difference? When does Roth make more sense? When does pre-tax make more sense? What exactly does this plan offer?",
    },
    {
      emoji: "🏦", label: es ? "Préstamos" : "Loans", value: loansValue, color: pd.loanAvailable === true ? C.green : C.textDim,
      prompt: es
        ? "¿Puedo tomar un préstamo de mi 401(k)? Explícame las reglas: ¿cuánto puedo pedir, por cuánto tiempo, cómo funciona el repago, y qué riesgos hay si dejo el trabajo?"
        : "Can I take a loan from my 401(k)? Explain the rules: how much can I borrow, for how long, how does repayment work, and what are the risks if I leave my job?",
    },
  ];

  // All feature tiles
  const tiles = useMemo(() => {
    const list = [];

    if (hasSafeHarbor) list.push({
      id: "safeHarbor", emoji: "🎁",
      title: es ? "Dinero Gratis Garantizado" : "Guaranteed Free Money",
      status: pd.safeHarbor?.formula || (es ? "100% tuyo desde el día 1" : "100% yours from day one"),
      desc: es
        ? "Tu empleador pone dinero en tu cuenta sin importar si tú contribuyes."
        : "Your employer puts money in your account no matter what — you don't have to contribute to get it.",
      accent: C.green, bg: C.greenDim,
      prompt: es
        ? "Explícame la contribución safe harbor de este plan. ¿Cuánto contribuye el empleador? ¿Por qué es 100% inmediatamente investido? ¿Cómo es diferente del match discrecional y del profit sharing?"
        : "Explain the safe harbor contribution in this plan. How much does the employer contribute? Why is it 100% immediately vested? How is it different from the discretionary match and profit sharing?",
    });

    if (!noMatch) list.push({
      id: "match", emoji: "🤜🤛",
      title: es ? "Tu Jefe Te Iguala" : "Your Employer Matches You",
      status: matchDesc,
      desc: es
        ? "Por cada dólar que aportas, tu empleador añade más. ¡No dejes ese dinero gratis sobre la mesa!"
        : "For every dollar you put in, your employer adds more on top. Don't leave that free money behind!",
      accent: C.green, bg: C.greenDim,
      prompt: es
        ? "¿Cómo funciona el match discrecional del empleador? Dame un ejemplo con un salario de $50,000. ¿Cómo es diferente de la contribución safe harbor? ¿Aplica la provisión de último día del año?"
        : "How does the discretionary employer match work? Give me a dollar example using a $50,000 salary. How is it different from the safe harbor contribution? Does the last-day-of-year provision apply?",
    });

    if (hasProfitSharing) list.push({
      id: "profitSharing", emoji: "📈",
      title: es ? "Bonificación por Ganancias" : "Company Profit Bonus",
      status: pd.profitSharing?.formula || (es ? "El jefe decide cada año" : "Employer decides each year"),
      desc: es
        ? "Cuando la empresa va bien, puede compartir las ganancias contigo en tu cuenta."
        : "When the company does well, they may share the profits directly into your retirement account.",
      accent: C.accent, bg: C.accentDim,
      prompt: es
        ? "Explícame el profit sharing en este plan. ¿Es garantizado o discrecional? ¿Cómo es diferente del match y del safe harbor? ¿Tiene su propio calendario de vesting? ¿Aplica la provisión de último día del año?"
        : "Explain profit sharing in this plan. Is it guaranteed or discretionary? How is it different from the match and safe harbor? Does it have its own vesting schedule? Does the last-day-of-year provision apply?",
    });

    list.push({
      id: "vesting", emoji: "🔐",
      title: es ? "¿Cuándo Es Realmente Tuyo?" : "When Is It Really Yours?",
      status: pd.vestingSchedule || (es ? "Ver documento" : "See your document"),
      desc: es
        ? "El dinero del empleador se 'gana' con el tiempo. Si te vas pronto, podrías dejar parte atrás."
        : "Employer money becomes fully yours over time. Leave too soon and you might leave some behind.",
      accent: C.accent, bg: C.accentDim,
      prompt: es
        ? "Explícame el calendario de vesting. Distingue claramente: ¿qué contribuciones son inmediatamente investidas (como safe harbor) y cuáles siguen un calendario de vesting (como match discrecional y profit sharing)? ¿Qué pasa si me voy antes de estar totalmente investido?"
        : "Explain the vesting schedule. Clearly distinguish: which contributions are immediately vested (like safe harbor) and which follow a vesting schedule (like discretionary match and profit sharing)? What happens if I leave before I'm fully vested?",
    });

    list.push({
      id: "eligContrib", emoji: "🚪",
      title: es ? "¿Cuándo Puedes Empezar?" : "When Can You Start?",
      status: pd.contribEligibility?.requirement || (es ? "Ver documento" : "See your document"),
      desc: pd.contribEligibility?.autoEnroll
        ? (es
            ? `Te inscribieron automáticamente al ${pd.contribEligibility.autoEnrollPct}%. Puedes cambiar esto.`
            : `You were auto-enrolled at ${pd.contribEligibility.autoEnrollPct}%. You can change this anytime.`)
        : (es
            ? "Hay requisitos de edad y tiempo de servicio antes de poder unirte."
            : "There are age and service requirements before you can join the plan."),
      accent: C.accent, bg: C.accentDim,
      prompt: es
        ? "Explícame la elegibilidad para contribuir al plan. ¿Cuáles son los requisitos de edad y servicio? ¿Cuándo puedo empezar a aportar mi propio dinero?"
        : "Explain contribution eligibility for this plan. What are the age and service requirements? When can I start contributing my own money?",
    });

    list.push({
      id: "roth", emoji: "☀️",
      title: es ? "¿Pagar Impuestos Ahora o Después?" : "Pay Taxes Now or Later?",
      status: planHasRoth ? (es ? "Roth disponible ✓" : "Roth available ✓") : (es ? "Solo pre-impuesto" : "Pre-tax only"),
      desc: es
        ? "Pre-impuesto: pagas al retirar. Roth: pagas ahora, retiras libre de impuestos después."
        : "Pre-tax: pay taxes when you withdraw. Roth: pay now, then withdraw tax-free in retirement.",
      accent: planHasRoth ? C.green : C.textDim,
      bg: planHasRoth ? C.greenDim : "rgba(154,136,120,.08)",
      prompt: es
        ? "Explícame las opciones Roth y pre-impuesto en este plan. ¿Cuál es la diferencia en términos simples?"
        : "Explain the Roth and pre-tax options in this plan. What's the difference in simple terms?",
    });

    list.push({
      id: "investments", emoji: "📊",
      title: es ? "¿Dónde Va Tu Dinero?" : "Where Does Your Money Go?",
      status: pd.investmentOptions || (es ? "Ver documento" : "See your document"),
      desc: es
        ? "Tú eliges entre las opciones de inversión disponibles. Tú decides cómo crecer tu dinero."
        : "You choose how your money is invested from the available funds — you're in control.",
      accent: C.green, bg: C.greenDim,
      prompt: es
        ? "¿Qué opciones de inversión están disponibles en este plan? Explícalas en términos simples."
        : "What investment options are available in this plan? Explain them in simple terms.",
    });

    list.push({
      id: "loans", emoji: "🏦",
      title: es ? "¿Puedes Pedir Prestado?" : "Can You Borrow From It?",
      status: pd.loanAvailable === true
        ? (es ? "Préstamos disponibles ✓" : "Loans available ✓")
        : pd.loanAvailable === false
          ? (es ? "No disponible" : "Not available")
          : (es ? "Ver documento" : "See your document"),
      desc: pd.loanAvailable === false
        ? (es ? "Este plan no ofrece préstamos del 401(k)." : "This plan does not offer 401(k) loans.")
        : (es ? "Puedes pedir prestado de TU propio dinero y devolvértelo a ti mismo con intereses." : "You can borrow from YOUR own savings and pay yourself back with interest."),
      accent: pd.loanAvailable ? C.green : C.textDim,
      bg: pd.loanAvailable ? C.greenDim : "rgba(154,136,120,.08)",
      prompt: es
        ? "¿Puedo tomar un préstamo de mi 401(k)? ¿Cuáles son las reglas, límites y cómo funciona el repago?"
        : "Can I take a loan from my 401(k)? What are the rules, limits, and how does repayment work?",
    });

    list.push({
      id: "hardship", emoji: "🆘",
      title: es ? "Dinero de Emergencia" : "Emergency Money Access",
      status: pd.hardshipAvailable === true
        ? (es ? "Disponible en emergencias" : "Available for emergencies")
        : pd.hardshipAvailable === false
          ? (es ? "No disponible" : "Not available")
          : (es ? "Ver documento" : "See your document"),
      desc: pd.hardshipAvailable === false
        ? (es ? "Este plan no permite retiros por dificultad económica." : "This plan does not allow hardship withdrawals.")
        : (es ? "En casos extremos puedes retirar dinero, pero hay impuestos y posibles penalidades." : "In extreme situations you can access your money early — but taxes and penalties may apply."),
      accent: C.warning, bg: "rgba(184,134,11,.07)",
      prompt: es
        ? "¿Puedo hacer un retiro por dificultad? ¿Cuáles son las reglas y circunstancias que califican?"
        : "Can I take a hardship withdrawal? What are the rules and qualifying circumstances?",
    });

    list.push({
      id: "distributions", emoji: "🎯",
      title: es ? "¿Cómo Retiro Mi Dinero?" : "How Do You Get the Money Out?",
      status: es ? "Ver todas las opciones" : "See all your options",
      desc: es
        ? "Al jubilarte o cambiar de trabajo, hay varias formas de acceder a tu dinero."
        : "When you retire or change jobs, you have several options for accessing your savings.",
      accent: C.accent, bg: C.accentDim,
      prompt: es
        ? `Explícame todas las formas en que puedo acceder al dinero en mi 401(k). Para cada opción, dime:\n1. Retiros en servicio — ¿puedo retirar mientras sigo trabajando? ¿A qué edad?\n2. Distribuciones al separarme — si renuncio, me despiden o me jubilo, ¿cuáles son mis opciones?\n3. Rollovers — ¿puedo transferir dinero de otro plan a este?\n4. RMDs — ¿a qué edad tengo que empezar a retirar?\n5. ¿Cuál es la regla del 59½? ¿Qué es la penalidad del 10%?`
        : `Explain all the ways I can access money in my 401(k). For each option, tell me:\n1. In-service withdrawals — can I take money out while still employed? At what age?\n2. Distributions at separation — if I quit, get laid off, or retire, what are my options?\n3. Rollovers — can I roll money from another plan into this one?\n4. RMDs — at what age do I have to start withdrawing?\n5. What is the age 59½ rule? What is the 10% early withdrawal penalty?`,
    });

    list.push({
      id: "enroll", emoji: "✍️",
      title: es ? "¿Cómo Me Uno?" : "How Do I Sign Up?",
      status: pd.recordkeeperName
        ? (es ? `A través de ${pd.recordkeeperName}` : `Through ${pd.recordkeeperName}`)
        : (es ? "Ver documento" : "See your document"),
      desc: es
        ? "Los pasos exactos para inscribirte y empezar a construir tu jubilación hoy."
        : "The exact steps to enroll and start building your retirement savings today.",
      accent: C.accent, bg: C.accentDim,
      prompt: es
        ? "¿Cómo me inscribo en el plan? ¿Cuáles son los pasos exactos?"
        : "How do I enroll in the plan? What are the exact steps?",
    });

    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planData, lang]);

  // All sections start collapsed; user taps header to expand
  const [collapsedSections, setCollapsedSections] = useState<Record<string,boolean>>({
    yourMoney: true, companyMoney: true, whileEmployed: true, afterEmployment: true,
  });
  const toggleSection = (key: string) =>
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Four named sections that group all tiles ──────────────────────────────
  const SECTIONS = [
    {
      key: "yourMoney",
      color: C.green, dim: C.greenDim,
      icon: "💵",
      title: es ? "Tu Dinero" : "Your Money",
      sub: es ? "Tus aportaciones, opciones de cuenta y cómo crece tu dinero" : "Your contributions, account options, and how your money grows",
      ids: ["eligContrib", "roth", "investments", "enroll"],
    },
    {
      key: "companyMoney",
      color: C.accent, dim: C.accentDim,
      icon: "🏢",
      title: es ? "El Dinero de Tu Empresa" : "Your Company's Money",
      sub: es ? "Lo que tu empleador aporta — y cuándo es realmente tuyo" : "What your employer puts in for you — and when it's truly yours",
      ids: ["safeHarbor", "match", "profitSharing", "vesting"],
    },
    {
      key: "whileEmployed",
      color: "#2C6A9A", dim: "rgba(44,106,154,.11)",
      icon: "💼",
      title: es ? "Tu Acceso Mientras Trabajas" : "Your Access While Employed",
      sub: es ? "Cómo puedes usar tu dinero antes de jubilarte" : "How you can tap your account before you retire",
      ids: ["loans", "hardship"],
    },
    {
      key: "afterEmployment",
      color: "#6B5B9A", dim: "rgba(107,91,154,.11)",
      icon: "🏁",
      title: es ? "Tu Acceso Al Salir" : "Your Access After Employment Ends",
      sub: es ? "Qué pasa con tu dinero cuando te vas o te jubilas" : "Your options when you leave or retire",
      ids: ["distributions"],
    },
  ];

  const renderTile = (tile) => (
    <button key={tile.id} onClick={() => onSectionClick(tile.prompt)} style={{
      background: C.surface, border: `1.5px solid ${tile.accent}28`, borderRadius: 16,
      padding: "14px 12px", cursor: "pointer", fontFamily: F.body,
      textAlign: "left", transition: "all .2s", display: "flex",
      flexDirection: "column", gap: 8, boxShadow: "0 2px 6px rgba(0,0,0,.04)",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 18px ${tile.accent}20`; e.currentTarget.style.borderColor = `${tile.accent}55`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,.04)"; e.currentTarget.style.borderColor = `${tile.accent}28`; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: tile.bg, border: `1px solid ${tile.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{tile.emoji}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: tile.accent, background: `${tile.accent}14`, border: `1px solid ${tile.accent}28`, borderRadius: 20, padding: "3px 7px", maxWidth: "56%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", alignSelf: "flex-start", marginTop: 2 }}>{tile.status}</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{tile.title}</div>
      <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>{tile.desc}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: tile.accent, display: "flex", alignItems: "center", gap: 3 }}>
        {es ? "Toca para saber más" : "Tap to learn more"}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </button>
  );

  const renderSection = (sec) => {
    const sectionTiles = tiles.filter(tile => sec.ids.includes(tile.id));
    if (sectionTiles.length === 0) return null;
    const collapsed = collapsedSections[sec.key];
    return (
      <div key={sec.key} style={{ marginBottom: collapsed ? 10 : 24 }}>
        {/* Section header — tap to expand / collapse */}
        <button onClick={() => toggleSection(sec.key)} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          marginBottom: collapsed ? 0 : 10, padding: "10px 12px",
          background: sec.dim, borderRadius: 10,
          border: `1px solid ${sec.color}22`,
          cursor: "pointer", fontFamily: F.body, textAlign: "left",
          transition: "margin-bottom .2s",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: `${sec.color}1A`, border: `1.5px solid ${sec.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
          }}>{sec.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: sec.color, lineHeight: 1.2 }}>{sec.title}</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{sec.sub}</div>
          </div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={sec.color} strokeWidth="2.5"
            style={{ flexShrink: 0, transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform .2s" }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {/* Cards — hidden when collapsed */}
        {!collapsed && (
          <div style={{
            display: "grid",
            gridTemplateColumns: sectionTiles.length === 1 ? "1fr" : "1fr 1fr",
            gap: 10, alignItems: "start",
          }}>
            {sectionTiles.map(renderTile)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px" }}>

        {/* Hero banner */}
        <div style={{
          margin: "0 -16px 20px", padding: "22px 20px 18px",
          background: `linear-gradient(160deg, ${C.accentDim} 0%, rgba(244,239,230,0) 70%)`,
          borderBottom: `1px solid ${C.border}`, textAlign: "center",
        }}>
          <div style={{ fontSize: 38, marginBottom: 6 }}>📋</div>
          <h2 style={{ fontFamily: F.display, fontSize: 21, fontWeight: 700, color: C.text, margin: "0 0 4px", lineHeight: 1.2 }}>{planName}</h2>
          <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 14px" }}>
            {es ? "Tu guía en lenguaje simple — toca cualquier tarjeta" : "Your plain-English guide — tap any card to learn more"}
          </p>
          {/* Quick-glance stat chips — clickable */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {quickStats.map((s, i) => (
              <button key={i} onClick={() => onSectionClick(s.prompt)} style={{
                background: C.surface, borderRadius: 20, padding: "5px 11px 5px 9px",
                border: `1px solid ${s.color}35`, display: "flex", alignItems: "center", gap: 6,
                cursor: "pointer", fontFamily: F.body, transition: "all .15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${s.color}12`; e.currentTarget.style.borderColor = `${s.color}60`; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = `${s.color}35`; e.currentTarget.style.transform = "none"; }}
              >
                <span style={{ fontSize: 13 }}>{s.emoji}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 9, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", lineHeight: 1 }}>{s.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: s.color, lineHeight: 1.3 }}>{s.value || "?"}</div>
                </div>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5" opacity={0.5} style={{ flexShrink: 0, marginLeft: 1 }}><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            ))}
          </div>
        </div>

        {/* Four grouped sections */}
        {SECTIONS.map(renderSection)}

      </div>
    </div>
  );
}

// ── Calculator (High Contrast) ──
function CalcPanel({ t, planData, expanded, setExpanded, lang, asTab = false }) {
  const [salary, setSalary] = useState(50000);
  const [pct, setPct] = useState(6);
  const [dob, setDob] = useState("");
  const [pp, setPp] = useState(26);

  const tiers = planData?.matchTiers || [];
  const noMatch = planData?.noMatch || tiers.length === 0;
  const hasRoth = planData?.hasRoth ?? planData?.rothAvailable ?? false;
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

  const iS = {
    backgroundColor: C.calcInput, border: `1px solid ${C.calcInputBorder}`, borderRadius: 8,
    color: C.calcText, fontFamily: F.body, fontSize: 13, padding: "8px 11px", width: "100%",
    outline: "none", boxSizing: "border-box",
  };
  const lS = { fontSize: 11, color: C.calcMuted, fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" };

  const shLabels = {
    nonelective: {
      en: "3% of pay — regardless of your contributions",
      es: "3% del salario — sin importar tus contribuciones",
      fr: "3% du salaire — quelle que soit votre cotisation",
      it: "3% della retribuzione — indipendentemente dai tuoi contributi",
    },
    basic_match: {
      en: "100% of first 3% + 50% of next 2%",
      es: "100% del primer 3% + 50% del siguiente 2%",
      fr: "100% des 3 premiers % + 50% des 2 suivants",
      it: "100% dei primi 3% + 50% dei successivi 2%",
    },
    enhanced_match: {
      en: sh?.formula || "Enhanced safe harbor match",
      es: sh?.formula || "Match safe harbor mejorado",
      fr: sh?.formula || "Match safe harbor amélioré",
      it: sh?.formula || "Match safe harbor migliorato",
    },
    qaca: {
      en: "QACA: 100% of first 1% + 50% of next 5%",
      es: "QACA: 100% del primer 1% + 50% del siguiente 5%",
      fr: "QACA : 100% du 1er % + 50% des 5 suivants",
      it: "QACA: 100% del primo 1% + 50% dei successivi 5%",
    },
  };

  let catchUpDisplay, catchUpColor;
  if (!dob) { catchUpDisplay = t.calcEnterDob; catchUpColor = C.calcMuted; }
  else if (!planAllowsCatchUp) { catchUpDisplay = t.calcCatchUpNotAllowed; catchUpColor = "#B84A3A"; }
  else if (catchUpActive) { catchUpDisplay = t.calcYes + (limits.enhanced ? " (60-63)" : " (50+)"); catchUpColor = "#2E7D52"; }
  else { catchUpDisplay = t.calcNo; catchUpColor = "#B84A3A"; }

  const showExpanded = asTab ? true : expanded;

  return (
    <div style={asTab
      ? { flex: 1, overflowY: "auto", background: C.calcBg }
      : { flexShrink: 0, borderBottom: `2px solid ${C.calcBorder}`, background: C.calcBg, boxShadow: "0 4px 20px rgba(0,0,0,.15)" }
    }>
      {!asTab && (
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
              <span style={{ color: C.calcMuted }}>{t.calcYourContrib}: <strong style={{ color: C.calcText }}>{fmtRounded(empContrib)}</strong></span>
              {hasSH && <span style={{ color: C.calcMuted }}>Safe Harbor: <strong style={{ color: "#2E7D52" }}>{fmtRounded(shAmt)}</strong></span>}
              <span style={{ color: "#8B6914", fontWeight: 700 }}>{fmtRounded(total)}/yr</span>
            </div>}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.calcMuted} strokeWidth="2" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </button>
      )}

      {showExpanded && (
        <div style={{ padding: asTab ? "16px 16px 32px" : "0 16px 18px" }}>
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
                  {lang === "es" || lang === "it" ? "Garantizado" : lang === "fr" ? "Garanti" : "Guaranteed"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 4 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1A5C37", marginBottom: 4 }}>
                      {lang === "es" ? "Contribución Safe Harbor" : lang === "fr" ? "Contribution Safe Harbor" : lang === "it" ? "Contributo Safe Harbor" : "Safe Harbor Contribution"}
                    </div>
                    <div style={{ fontSize: 12, color: "#3D7A55", lineHeight: 1.4 }}>
                      {shLabels[sh.type]?.[lang] || sh.formula}
                    </div>
                    <div style={{ fontSize: 10, color: "#5D9A73", marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>✓ {lang === "es" ? "100% investido inmediatamente" : lang === "fr" ? "100% acquis immédiatement" : lang === "it" ? "100% maturato immediatamente" : "100% vested immediately"}</span>
                      <span>✓ {lang === "es" ? "No aplica provisión de último día" : lang === "fr" ? "Disposition dernier jour NON applicable" : lang === "it" ? "Clausola ultimo giorno NON applicabile" : "Last-day provision does NOT apply"}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#1A5C37" }}>{fmtRounded(shAmt)}</div>
                    <div style={{ fontSize: 10, color: "#5D9A73" }}>/yr</div>
                  </div>
                </div>
              </div>
            )}

            {/* === DISCRETIONARY MATCH — informational only, no formula, no calculation === */}
            {!noMatch && (
              <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 10, background: "#FFFBF2", border: `1px dashed ${C.calcBorder}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#8B6914", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>
                  {lang === "es" ? "Match Discrecional" : lang === "fr" ? "Match Discrétionnaire" : lang === "it" ? "Match Discrezionale" : "Discretionary Match"}
                </div>
                <div style={{ fontSize: 13, color: C.calcText, lineHeight: 1.5 }}>
                  {lang === "es"
                    ? "Este plan también ofrece un match discrecional del empleador. Esta contribución es discrecional y no está garantizada — el empleador puede cambiarla o eliminarla en cualquier momento."
                    : lang === "fr"
                    ? "Ce régime offre également un match discrétionnaire de l'employeur. Cette contribution est discrétionnaire et non garantie — l'employeur peut la modifier ou l'éliminer à tout moment."
                    : lang === "it"
                    ? "Questo piano offre anche un match discrezionale del datore di lavoro. Questo contributo è discrezionale e non garantito — il datore di lavoro può modificarlo o eliminarlo."
                    : "This plan also offers a discretionary employer match. This contribution is discretionary and not guaranteed — the employer can change or eliminate it at any time."}
                </div>
                {lastDayProvision && <div style={{ fontSize: 10, color: "#B84A3A", marginTop: 6 }}>
                  ⚠ {lang === "es" ? "Sujeto a provisión de último día del año y calendario de vesting" : lang === "fr" ? "Soumis à la disposition du dernier jour et au calendrier d'acquisition" : lang === "it" ? "Soggetto alla clausola dell'ultimo giorno e al calendario di maturazione" : "Subject to last-day-of-year provision and vesting schedule"}
                </div>}
                {!lastDayProvision && <div style={{ fontSize: 10, color: C.calcMuted, marginTop: 6 }}>
                  {lang === "es" ? "Sujeto a calendario de vesting" : lang === "fr" ? "Soumis au calendrier d'acquisition" : lang === "it" ? "Soggetto al calendario di maturazione" : "Subject to vesting schedule"}
                </div>}
              </div>
            )}

            {/* === NO EMPLOYER CONTRIBUTIONS AT ALL === */}
            {!hasSH && noMatch && (
              <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 10, background: "#FDF2F0", border: `1px solid #E8C4BE` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#B84A3A", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>
                  {lang === "es" ? "Contribuciones del Empleador" : lang === "fr" ? "Contributions Patronales" : lang === "it" ? "Contributi del Datore di Lavoro" : "Employer Contributions"}
                </div>
                <div style={{ fontSize: 13, color: "#B84A3A" }}>
                  {lang === "es"
                    ? "Este plan no incluye contribución safe harbor ni match discrecional del empleador."
                    : lang === "fr"
                    ? "Ce régime ne comprend pas de contribution safe harbor ni de match discrétionnaire de l'employeur."
                    : lang === "it"
                    ? "Questo piano non include un contributo safe harbor né un match discrezionale del datore di lavoro."
                    : "This plan does not include a safe harbor contribution or discretionary employer match."}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={{ padding: "8px 10px", borderRadius: 8, background: "#FFF8EB", border: `1px solid #EBD9A8` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, textTransform: "uppercase", marginBottom: 3 }}>{t.calcIrsLimit}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#8B6914" }}>{fmtRounded(catchUpActive ? limits.total : limits.base)}</div>
                {catchUpActive && <div style={{ fontSize: 10, color: "#2E7D52", marginTop: 2 }}>+{fmtRounded(limits.catchUp)} catch-up</div>}
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
                <div style={{ fontSize: 17, fontWeight: 700, color: C.calcText }}>{fmtRounded(empContrib)}</div>
              </div>
              {hasSH && <div style={{ padding: "10px 12px", borderRadius: 10, background: "#E8F8EF", border: `1px solid #B8DFC9` }}>
                <div style={{ fontSize: 9, color: "#3D7A55", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".04em" }}>Safe Harbor</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#1A5C37" }}>{fmtRounded(shAmt)}</div>
              </div>}
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "#FFF8EB", border: `1px solid #EBD9A8` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".04em" }}>{hasSH ? (lang === "es" ? "Total Garantizado / Año" : lang === "fr" ? "Total Garanti / An" : lang === "it" ? "Totale Garantito / Anno" : "Guaranteed Total / Year") : t.calcTotal}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#8B6914" }}>{fmtRounded(total)}</div>
                {!noMatch && <div style={{ fontSize: 9, color: C.calcMuted, marginTop: 2 }}>{lang === "es" ? "+ match discrecional (no calculado)" : lang === "fr" ? "+ match discrétionnaire (non calculé)" : lang === "it" ? "+ match discrezionale (non calcolato)" : "+ discretionary match (not calculated)"}</div>}
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "#FFFFFF", border: `1px solid ${C.calcCardBorder}` }}>
                <div style={{ fontSize: 9, color: C.calcMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".04em" }}>{t.calcPerPaycheck}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.calcText }}>{fmtDollars(perPaycheck)}</div>
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

// ── Statement Data Parser ──
function parseStmtData(text) { const m = text.match(/<!--STMTDATA:(.*?)-->/); if (!m) return null; try { return JSON.parse(m[1]); } catch { return null; } }
function stripStmtData(text) { return text.replace(/<!--STMTDATA:.*?-->/g, "").trim(); }

// ── Mini Bar Chart ──
function MiniBar({ items, maxVal, colorFn }) {
  const mv = maxVal || Math.max(...items.map(i => Math.abs(i.value)), 1);
  return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{items.filter(i => i.value !== 0).map((item, idx) => (
    <div key={idx}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: C.text }}>{item.label}</span>
        <span style={{ fontWeight: 700, color: colorFn ? colorFn(item.value) : C.text }}>${Math.abs(item.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div style={{ height: 8, background: C.surfaceAlt, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(Math.abs(item.value) / mv * 100, 100)}%`, background: colorFn ? colorFn(item.value) : C.accent, borderRadius: 4, transition: "width .5s ease" }} />
      </div>
    </div>
  ))}</div>;
}

// ── Donut Chart ──
function DonutChart({ segments, size = 140 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  const r = size / 2 - 12, cx = size / 2, cy = size / 2;
  let cumAngle = -90;
  const paths = segments.filter(s => s.value > 0).map((seg, i) => {
    const angle = (seg.value / total) * 360;
    const startAngle = cumAngle * Math.PI / 180;
    const endAngle = (cumAngle + angle) * Math.PI / 180;
    cumAngle += angle;
    const largeArc = angle > 180 ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const ir = r * 0.55;
    const x3 = cx + ir * Math.cos(endAngle), y3 = cy + ir * Math.sin(endAngle);
    const x4 = cx + ir * Math.cos(startAngle), y4 = cy + ir * Math.sin(startAngle);
    return <path key={i} d={`M${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} L${x3},${y3} A${ir},${ir} 0 ${largeArc},0 ${x4},${y4} Z`} fill={seg.color} />;
  });
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{paths}</svg>;
}

// ── Statement Dashboard ──
function StatementDashboard({ t, stmtData, onChat, onUploadAnother, lang }) {
  const [viewMode, setViewMode] = useState("period");
  const [expandedCards, setExpandedCards] = useState({});
  const sd = stmtData || {};
  const toggle = id => setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  const num = v => { if (v === null || v === undefined) return 0; if (typeof v === "number") return isNaN(v) ? 0 : v; const s = String(v).replace(/[$,\s]/g, "").replace(/[()]/g, m => m === "(" ? "-" : ""); const n = Number(s); return isNaN(n) ? 0 : n; };

  // Robust data access: try nested period/ytd, fallback to top-level
  const periodData = sd.period || {};
  const ytdData = sd.ytd || sd.period || {};
  const data = viewMode === "ytd" ? ytdData : periodData;
  const mi = (data.moneyIn && typeof data.moneyIn === "object") ? data.moneyIn : (sd.moneyIn && typeof sd.moneyIn === "object") ? sd.moneyIn : {};
  const mo = (data.moneyOut && typeof data.moneyOut === "object") ? data.moneyOut : (sd.moneyOut && typeof sd.moneyOut === "object") ? sd.moneyOut : {};
  const rawFees = (data.fees && typeof data.fees === "object") ? data.fees : (sd.fees && typeof sd.fees === "object") ? sd.fees : (typeof data.fees === "number" || typeof sd.fees === "number") ? { total: num(data.fees || sd.fees), items: [] } : {};
  const gainLoss = num(data.gainLoss ?? sd.gainLoss);
  const divInt = num(data.dividendsInterest ?? sd.dividendsInterest);

  // Fees: handle items/details array, fallback to category totals
  const rawItems = Array.isArray(rawFees.items) ? rawFees.items : Array.isArray(rawFees.details) ? rawFees.details : [];
  const feeItems = rawItems.filter(f => f && num(f.amount) !== 0).map(f => ({ name: f.name || f.label || "Fee", amount: Math.abs(num(f.amount)) }));
  const categoryItems = [
    rawFees.administrative ? { name: lang === "es" ? "Administrativos" : "Administrative", amount: Math.abs(num(rawFees.administrative)) } : null,
    rawFees.investment ? { name: lang === "es" ? "Inversión" : "Investment", amount: Math.abs(num(rawFees.investment)) } : null,
    rawFees.advisor ? { name: lang === "es" ? "Asesor" : "Advisor", amount: Math.abs(num(rawFees.advisor)) } : null,
    rawFees.other ? { name: lang === "es" ? "Otro" : "Other", amount: Math.abs(num(rawFees.other)) } : null,
  ].filter(Boolean);
  const effectiveFeeItems = feeItems.length > 0 ? feeItems : categoryItems;
  const feeTotal = Math.abs(num(rawFees.total)) || effectiveFeeItems.reduce((s, f) => s + f.amount, 0);
  const feePctOfAssets = num(sd.endBalance) > 0 && feeTotal > 0 ? (feeTotal / num(sd.endBalance) * 100) : 0;
  const annualizedFeePct = viewMode === "ytd" ? feePctOfAssets : feePctOfAssets * 4;

  const ror = sd.personalROR || {};
  const investments = sd.investments || [];
  const sources = sd.sources || [];
  const alloc = sd.assetAllocation || {};
  const startBal = viewMode === "ytd" ? num(sd.ytdBeginBalance || sd.beginBalance) : num(sd.beginBalance);
  const balanceChange = num(sd.endBalance) - startBal;
  const allocSegments = [
    { label: lang === "es" ? "Acciones" : "Stocks", value: num(alloc.stocks), color: "#5CB88A" },
    { label: lang === "es" ? "Bonos" : "Bonds", value: num(alloc.bonds), color: "#D4A853" },
    { label: "Multi-Asset", value: num(alloc.multiAsset), color: "#94A0B2" },
    { label: lang === "es" ? "Otro" : "Other", value: num(alloc.other), color: "#536178" },
  ];
  const periodLabel = sd.statementPeriod ? `${sd.statementPeriod.start} — ${sd.statementPeriod.end}` : "";
  const ytdLabel = sd.calendarYTD ? `${sd.calendarYTD.start} — ${sd.calendarYTD.end}` : (lang === "es" ? "Año Calendario" : "Calendar Year-to-Date");

  const card = (id, children) => (<div style={{ background: C.surface, border: `1px solid ${expandedCards[id] ? C.accent : C.border}`, borderRadius: 14, overflow: "hidden", transition: "border-color .2s" }}>{children}</div>);
  const cardHeader = (id, icon, title, right) => (<button onClick={() => toggle(id)} style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: F.body, display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 18 }}>{icon}</span><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</span></div><div style={{ display: "flex", alignItems: "center", gap: 10 }}>{right}<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" style={{ transform: expandedCards[id] ? "rotate(180deg)" : "none", transition: "transform .2s" }}><polyline points="6 9 12 15 18 9"/></svg></div></button>);
  const dateLabel = () => (<div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10, padding: "6px 10px", background: C.surfaceAlt, borderRadius: 6, textAlign: "center" }}>{viewMode === "ytd" ? ytdLabel : periodLabel}</div>);
  const dataRow = (label, value, color, definition) => { const v = num(value); if (v === 0) return null; const mx = Math.max(num(mi.total), 1); return (<div style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}><span style={{ fontSize: 12, color: C.text }}>{label}</span><span style={{ fontSize: 13, fontWeight: 700, color }}>{fmtDollars(v)}</span></div><div style={{ height: 10, background: C.surfaceAlt, borderRadius: 5, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(Math.abs(v) / mx * 100, 100)}%`, background: color, borderRadius: 5, transition: "width .4s ease" }} /></div>{definition && <div style={{ fontSize: 10, color: C.textDim, marginTop: 3, lineHeight: 1.4, paddingLeft: 2 }}>{definition}</div>}</div>); };

  return (
    <div style={{ padding: "0 16px 16px", overflowY: "auto", flex: 1 }}>
      <div style={{ textAlign: "center", padding: "14px 0 12px" }}>
        <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 600, color: C.text, margin: "0 0 10px" }}>{t.stmtDashTitle}</h2>
        <div style={{ display: "inline-flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, background: C.bg }}>
          <button onClick={() => setViewMode("period")} style={{ padding: "9px 20px", border: "none", cursor: "pointer", fontFamily: F.body, fontSize: 12, fontWeight: 600, background: viewMode === "period" ? C.accentDim : "transparent", color: viewMode === "period" ? C.accent : C.textMuted, transition: "all .15s" }}>{lang === "es" ? "Este Período" : "This Period"}</button>
          <button onClick={() => setViewMode("ytd")} style={{ padding: "9px 20px", border: "none", cursor: "pointer", fontFamily: F.body, fontSize: 12, fontWeight: 600, background: viewMode === "ytd" ? C.greenDim : "transparent", color: viewMode === "ytd" ? C.green : C.textMuted, transition: "all .15s" }}>YTD</button>
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>{viewMode === "ytd" ? ytdLabel : periodLabel}</div>
      </div>

      {/* Balance */}
      <div style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceAlt})`, border: `2px solid ${C.accent}`, borderRadius: 16, padding: "20px", marginBottom: 12, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{lang === "es" ? "Saldo Final" : "Ending Balance"}</div>
        <div style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: C.accent }}>{fmtDollars(sd.endBalance)}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10, fontSize: 12, flexWrap: "wrap" }}>
          <span style={{ color: C.textMuted }}>{lang === "es" ? "Inicio" : "Start"}: <strong style={{ color: C.text }}>{fmtDollars(startBal)}</strong></span>
          <span style={{ color: balanceChange >= 0 ? C.green : C.danger, fontWeight: 700 }}>{balanceChange >= 0 ? "+" : "-"}{fmtDollars(balanceChange)}</span>
          {num(sd.vestedBalance) > 0 && num(sd.vestedBalance) !== num(sd.endBalance) && <span style={{ color: C.textMuted }}>{lang === "es" ? "Investido" : "Vested"}: <strong style={{ color: C.text }}>{fmtDollars(sd.vestedBalance)}</strong></span>}
        </div>
      </div>

      {/* Performance */}
      {(ror.period || ror.ytd || ror.oneYear) && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
        {[[lang === "es" ? "Período" : "Period", ror.period], ["YTD", ror.ytd], [lang === "es" ? "1 Año" : "1 Year", ror.oneYear], [lang === "es" ? "3 Años" : "3 Years", ror.threeYear]].map(([label, val], i) => (
          <div key={i} style={{ padding: "10px 6px", borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: num(val) > 0 ? C.green : num(val) < 0 ? C.danger : C.textMuted }}>{val ? fmtPctVal(val) : "—"}</div>
          </div>))}
      </div>}

      {/* Quick stats — tappable */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
        {[[lang === "es" ? "Entró" : "In", num(mi.total), C.green, C.greenDim, "rgba(92,184,138,.15)", "moneyIn"],
          [lang === "es" ? "Salió" : "Out", num(mo.total), num(mo.total) ? C.danger : C.green, num(mo.total) ? C.dangerDim : C.greenDim, num(mo.total) ? "rgba(212,106,90,.15)" : "rgba(92,184,138,.15)", "moneyOut"],
          [lang === "es" ? "Crecimiento" : "Growth", gainLoss, gainLoss >= 0 ? C.green : C.danger, gainLoss >= 0 ? C.greenDim : C.dangerDim, gainLoss >= 0 ? "rgba(92,184,138,.15)" : "rgba(212,106,90,.15)", "growth"],
          [lang === "es" ? "Costos" : "Fees", feeTotal, C.accent, "rgba(212,168,83,.08)", "rgba(212,168,83,.15)", "fees"],
        ].map(([label, val, color, bg, bdr, cardId], i) => (
          <div key={i} onClick={() => toggle(cardId)} style={{ padding: "10px 8px", borderRadius: 10, background: bg, border: `1px solid ${bdr}`, textAlign: "center", cursor: "pointer", transition: "transform .15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <div style={{ fontSize: 9, color, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color }}>{i === 2 ? ((val >= 0 ? "+" : "") + fmtShortAmt(val)) : fmtShortAmt(val)}</div>
          </div>))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {/* Money In */}
        {card("moneyIn", <>{cardHeader("moneyIn", "💰", t.stmtMoneyIn, <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{fmtDollars(mi.total)}</span>)}
          {expandedCards.moneyIn && <div style={{ padding: "0 16px 16px" }}>{dateLabel()}
            {dataRow(lang === "es" ? "Diferimiento Salarial (Pre-Tax)" : "Salary Deferral (Pre-Tax)", mi.employeeSalaryDeferral, C.green, lang === "es" ? "Tu dinero, antes de impuestos." : "Your money, before taxes. You pay taxes when you withdraw.")}
            {dataRow("Roth", mi.employeeRoth, "#6BB8D4", lang === "es" ? "Tu dinero, después de impuestos. Sale libre de impuestos." : "Your money, after taxes. Grows and comes out tax-free.")}
            {dataRow(lang === "es" ? "Match del Empleador" : "Employer Match", mi.employerMatch, "#7A9EC9", lang === "es" ? "Discrecional — sujeto a vesting." : "Discretionary — subject to vesting.")}
            {dataRow("Safe Harbor", mi.employerSafeHarbor, "#5CB88A", lang === "es" ? "Garantizado. 100% tuyo inmediatamente." : "Guaranteed. 100% yours immediately.")}
            {dataRow("Profit Sharing", mi.employerProfitSharing, "#D4A853", lang === "es" ? "Discrecional — el empleador decide anualmente." : "Discretionary — employer decides annually.")}
            {dataRow(lang === "es" ? "Otro del Empleador" : "Other Employer", mi.employerOther, "#94A0B2", null)}
            {dataRow("Rollover", mi.rolloverIn, "#8B7EC9", lang === "es" ? "De otro plan o IRA." : "From another plan or IRA.")}
            {dataRow(lang === "es" ? "Pago de Préstamo" : "Loan Repayment", mi.loanRepayment, "#94A0B2", null)}
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 10, display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Total</span><span style={{ fontSize: 15, fontWeight: 700, color: C.green }}>{fmtDollars(mi.total)}</span></div>
          </div>}</>)}

        {/* Money Out */}
        {card("moneyOut", <>{cardHeader("moneyOut", "📤", t.stmtMoneyOut, <span style={{ fontSize: 14, fontWeight: 700, color: num(mo.total) ? C.danger : C.green }}>{num(mo.total) ? fmtDollars(mo.total) : "$0.00"}</span>)}
          {expandedCards.moneyOut && <div style={{ padding: "0 16px 16px" }}>{dateLabel()}
            {num(mo.total) > 0 ? <>{dataRow(lang === "es" ? "Retiros" : "Withdrawals", mo.withdrawals, C.danger, lang === "es" ? "Dinero sacado de tu cuenta." : "Money taken out of your account.")}
              {dataRow(lang === "es" ? "Distribuciones" : "Distributions", mo.distributions, C.danger, lang === "es" ? "Pagos formales del plan." : "Formal plan payouts.")}
              {dataRow(lang === "es" ? "Rollovers (salidas)" : "Rollovers Out", mo.rollovers, "#D4A853", lang === "es" ? "Transferido a otro plan o IRA." : "Transferred to another plan or IRA.")}
              {dataRow(lang === "es" ? "Préstamos Tomados" : "Loans Taken", mo.loans, "#94A0B2", lang === "es" ? "Préstamo de tu saldo." : "Loan from your balance. Must be repaid.")}
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 10, display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Total</span><span style={{ fontSize: 15, fontWeight: 700, color: C.danger }}>{fmtDollars(mo.total)}</span></div>
            </> : <div style={{ padding: "8px 0", fontSize: 13, color: C.green, fontWeight: 600 }}>✓ {lang === "es" ? "No salió dinero de tu cuenta" : "No money left your account"}</div>}
          </div>}</>)}

        {/* Fees */}
        {card("fees", <>{cardHeader("fees", "📋", t.stmtFees, <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{fmtDollars(feeTotal)}</span>{feePctOfAssets > 0 && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(212,168,83,.1)", color: C.accent, fontWeight: 600 }}>{feePctOfAssets.toFixed(3)}%</span>}</div>)}
          {expandedCards.fees && <div style={{ padding: "0 16px 16px" }}>{dateLabel()}
            {effectiveFeeItems.length > 0 ? effectiveFeeItems.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < effectiveFeeItems.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 12, color: C.text }}>{item.name}</span><span style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>{fmtDollars(item.amount)}</span></div>
            )) : <div style={{ fontSize: 12, color: C.textMuted, padding: "8px 0" }}>{feeTotal > 0 ? `Total: ${fmtDollars(feeTotal)}` : (lang === "es" ? "Sin costos reportados" : "No fees reported")}</div>}
            {feeTotal > 0 && <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Total</span><span style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>{fmtDollars(feeTotal)}</span></div>
              <div style={{ padding: "12px", borderRadius: 10, background: "rgba(212,168,83,.06)", border: "1px solid rgba(212,168,83,.12)", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{viewMode === "ytd" ? (lang === "es" ? "% anual de tu saldo" : "Annual % of balance") : (lang === "es" ? "% de tu saldo (período)" : "% of balance (period)")}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.accent }}>{feePctOfAssets.toFixed(3)}%</span></div>
                {viewMode !== "ytd" && annualizedFeePct > 0 && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{lang === "es" ? "Estimado anualizado" : "Annualized estimate"}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>~{annualizedFeePct.toFixed(3)}%</span></div>}
                <div style={{ height: 8, background: C.surfaceAlt, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ height: "100%", width: `${Math.min((viewMode === "ytd" ? feePctOfAssets : annualizedFeePct) * 20, 100)}%`, background: `linear-gradient(90deg, ${C.accent}, #B8863A)`, borderRadius: 4 }} /></div>
                <div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.5 }}>{lang === "es" ? `Por cada $10,000, ~$${((viewMode === "ytd" ? feePctOfAssets : annualizedFeePct) * 100).toFixed(2)}/año va a costos.` : `For every $10,000, ~$${((viewMode === "ytd" ? feePctOfAssets : annualizedFeePct) * 100).toFixed(2)}/year goes to fees.`}</div>
              </div></div>}
            <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5, padding: "8px 10px", background: C.surfaceAlt, borderRadius: 8 }}>{lang === "es" ? "Una diferencia de 0.5% anual puede significar decenas de miles menos al jubilarte." : "A 0.5% annual fee difference can mean tens of thousands less by retirement."}</div>
          </div>}</>)}

        {/* Growth */}
        {card("growth", <>{cardHeader("growth", "📈", t.stmtGainLoss, <span style={{ fontSize: 14, fontWeight: 700, color: gainLoss >= 0 ? C.green : C.danger }}>{gainLoss >= 0 ? "+" : ""}{fmtDollars(gainLoss)}</span>)}
          {expandedCards.growth && <div style={{ padding: "0 16px 16px" }}>{dateLabel()}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ padding: "14px", borderRadius: 10, background: gainLoss >= 0 ? C.greenDim : C.dangerDim, border: `1px solid ${gainLoss >= 0 ? "rgba(92,184,138,.2)" : "rgba(212,106,90,.2)"}`, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", marginBottom: 4 }}>{lang === "es" ? "Ganancia/Pérdida" : "Gain/Loss"}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: gainLoss >= 0 ? C.green : C.danger }}>{gainLoss >= 0 ? "+" : ""}{fmtDollars(gainLoss)}</div></div>
              <div style={{ padding: "14px", borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", marginBottom: 4 }}>{lang === "es" ? "Dividendos e Intereses" : "Dividends & Interest"}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{fmtDollars(divInt)}</div></div></div>
            <div style={{ marginTop: 10, fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>{lang === "es" ? "Rendimiento pasado no garantiza resultados futuros." : "Past performance does not guarantee future results."}</div>
          </div>}</>)}

        {/* Allocation */}
        {allocSegments.some(s => s.value > 0) && card("allocation", <>{cardHeader("allocation", "🎯", t.stmtAllocation, <span style={{ fontSize: 12, color: C.textMuted }}>{allocSegments.filter(s => s.value > 0).map(s => `${s.value}% ${s.label}`).join(" · ")}</span>)}
          {expandedCards.allocation && <div style={{ padding: "0 16px 16px" }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
              <DonutChart segments={allocSegments} />
              <div style={{ flex: 1, minWidth: 140 }}>{allocSegments.filter(s => s.value > 0).map((seg, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><div style={{ width: 14, height: 14, borderRadius: 4, background: seg.color, flexShrink: 0 }} /><span style={{ fontSize: 12, color: C.text, flex: 1 }}>{seg.label}</span><span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{seg.value}%</span></div>))}</div></div>
            <div style={{ marginTop: 10, fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>{lang === "es" ? "Más acciones = más potencial pero más riesgo. Más bonos = más estabilidad." : "More stocks = higher growth potential but more risk. More bonds = more stability."}</div>
          </div>}</>)}

        {/* Investments */}
        {investments.length > 0 && card("investments", <>{cardHeader("investments", "📊", t.stmtInvestments, <span style={{ fontSize: 12, color: C.textMuted }}>{investments.length} {lang === "es" ? "fondos" : "funds"}</span>)}
          {expandedCards.investments && <div style={{ padding: "0 16px 16px" }}>{investments.map((inv, i) => { const ch = num(inv.endValue) - num(inv.beginValue); return (<div key={i} style={{ padding: "10px 12px", background: C.surfaceAlt, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 6 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: C.text, flex: 1, marginRight: 8 }}>{inv.name}</span><span style={{ fontSize: 13, fontWeight: 700, color: C.accent, flexShrink: 0 }}>{fmtDollars(inv.endValue)}</span></div><div style={{ display: "flex", gap: 10, fontSize: 10, color: C.textMuted, flexWrap: "wrap" }}>{inv.category && <span style={{ padding: "1px 5px", background: C.bg, borderRadius: 3 }}>{inv.category}</span>}{num(inv.pctOfAccount) > 0 && <span>{inv.pctOfAccount}%</span>}{num(inv.shares) > 0 && <span>{num(inv.shares).toLocaleString()} {lang === "es" ? "unid." : "shares"}</span>}{num(inv.beginValue) > 0 && <span style={{ color: ch >= 0 ? C.green : C.danger, fontWeight: 600 }}>{ch >= 0 ? "↑" : "↓"} {fmtDollars(Math.abs(ch))}</span>}</div></div>); })}</div>}</>)}

        {/* Sources */}
        {sources.length > 0 && card("sources", <>{cardHeader("sources", "🏦", t.stmtSources, <span style={{ fontSize: 12, color: C.textMuted }}>{sources.length} {lang === "es" ? "fuentes" : "sources"}</span>)}
          {expandedCards.sources && <div style={{ padding: "0 16px 16px" }}>{sources.map((src, i) => (<div key={i} style={{ padding: "10px 12px", background: C.surfaceAlt, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 6 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{src.name}</span><span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{fmtDollars(src.endValue)}</span></div><div style={{ display: "flex", gap: 12, fontSize: 10, color: C.textMuted }}><span>{lang === "es" ? "Investido" : "Vested"}: <strong style={{ color: num(src.vestedPct) === 100 ? C.green : C.accent }}>{src.vestedPct || 100}%</strong></span>{num(src.contributions) > 0 && <span style={{ color: C.green }}>+{fmtDollars(src.contributions)} {viewMode === "ytd" ? "YTD" : (lang === "es" ? "período" : "period")}</span>}</div>{num(src.vestedPct) < 100 && num(src.vestedPct) > 0 && <div style={{ marginTop: 6, height: 6, background: C.bg, borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${src.vestedPct}%`, background: C.accent, borderRadius: 3 }} /></div>}</div>))}
            <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.5, marginTop: 6, padding: "8px 10px", background: C.surfaceAlt, borderRadius: 8 }}>{lang === "es" ? "Tus contribuciones y Safe Harbor = siempre 100% tuyas. Match y Profit Sharing pueden seguir vesting." : "Your contributions and Safe Harbor = always 100% yours. Match and Profit Sharing may follow a vesting schedule."}</div>
          </div>}</>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
        <button onClick={onUploadAnother} style={{ padding: "14px 18px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, cursor: "pointer", fontFamily: F.body, display: "flex", alignItems: "center", gap: 10, transition: "all .15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}><span style={{ fontSize: 18 }}>📄</span><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.stmtUploadAnother}</span></button>
        <button onClick={onChat} style={{ padding: "14px 18px", background: `linear-gradient(135deg,${C.accent},#B8863A)`, border: "none", borderRadius: 14, cursor: "pointer", fontFamily: F.body, display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 18 }}>💬</span><span style={{ fontSize: 13, fontWeight: 700, color: "#0F1621" }}>{t.stmtAskQuestion}</span></button>
      </div>
      <SuggestionBox t={t} />
      <div style={{ textAlign: "center", marginTop: 16, padding: "10px", fontSize: 10, color: C.textDim, lineHeight: 1.5 }}>{t.stmtDisclaimer}</div>
    </div>
  );
}

// ── Props interface ──
interface PlansparencyAppProps {
  mode?: 'version-a' | 'version-b';
  preloadedPlanText?: string;
  advisorLogo?: string;
  advisorFirmName?: string;
  planId?: string;
  advisorSlug?: string;
  // Participant mode — pre-load an existing plan without requiring upload
  initialPdfBase64?: string | null;
  initialPlanData?: Record<string, unknown> | null;
  initialMessages?: Array<{ role: string; content: string }>;
  initialStage?: string;
}

// ── Main App ──
function Plansparency({ mode = 'version-a', preloadedPlanText, advisorLogo, advisorFirmName, planId, advisorSlug, initialPdfBase64 = null, initialPlanData = null, initialMessages = [], initialStage = STAGE.CHOOSER }: PlansparencyAppProps = {}) {
  const [lang, setLang] = useState("en");
  const [stage, setStage] = useState(initialStage);
  const [docType, setDocType] = useState(null); // "spd" or "statement"
  const [fileName, setFileName] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [calcExpanded, setCalcExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [planData, setPlanData] = useState(initialPlanData);
  const [planGuideTab, setPlanGuideTab] = useState<"guide" | "investments">("guide");
  const [stmtData, setStmtData] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100 during upload phase
  const [uploadPhase, setUploadPhase] = useState<'uploading'|'analyzing'>('uploading');
  const [uploadDocIndex, setUploadDocIndex] = useState(0);   // which file is uploading (0-based)
  const [uploadDocCount, setUploadDocCount] = useState(1);   // total files being uploaded
  const [stagedFiles, setStagedFiles] = useState<File[]>([]); // files queued on landing before privacy
  const [streamingText, setStreamingText] = useState('');
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingFilesRef = useRef<File[]>([]);  // replaces pendingFileRef
  const addDocRef = useRef(null);
  const abortRef = useRef(null);
  const fileIdsRef = useRef<string[]>([]);  // replaces fileIdRef; array of all uploaded file IDs

  const t = i18n[lang];

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (stage === "chat" && !loading) inputRef.current?.focus(); }, [stage, loading]);

  // ── Version-B: process preloaded plan text (skips upload) ──
  const processVersionB = useCallback(async (planText: string) => {
    setDocType('spd');
    setStage(STAGE.UPLOADING);
    try {
      const m1 = { role: 'user', content: t.firstMessage };
      const raw = await callClaude([m1], null, lang, null, () => {}, undefined);
      const pd = parsePlanData(raw);
      if (pd) setPlanData(pd);
      setMessages([m1, { role: 'assistant', content: stripPlanData(raw) }]);
      setStage(STAGE.APP);
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error('[processVersionB] Failed — status:', e.status, 'message:', e.message, e);
      setStage(STAGE.CHOOSER);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, t]);

  useEffect(() => {
    if (mode === 'version-b' && preloadedPlanText) {
      processVersionB(preloadedPlanText);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearSession = () => {
    setFileName(""); setMessages([]); setInput(""); setLoading(false);
    setShowClearConfirm(false); setPlanData(null); setStmtData(null);
    setCalcExpanded(false); setActiveTab("dashboard"); setPlanGuideTab("guide"); setDocType(null); setStreamingText(''); setUploadError("");
    pendingFilesRef.current = [];
    fileIdsRef.current = [];
    setStagedFiles([]);
    setStage(STAGE.CLEARED);
  };

  // Stage a file on the landing page (does not navigate away)
  const stageFile = (f: File) => {
    if (!f || f.type !== "application/pdf") { setUploadError(t.errorFormat); return; }
    if (f.size > 25 * 1024 * 1024) { setUploadError(lang === "es" ? "El archivo es demasiado grande. Máximo 25 MB." : "This PDF is too large. Please try a document under 25 MB."); return; }
    if (stagedFiles.length >= 3) { setUploadError(lang === "es" ? "Máximo 3 documentos." : "Maximum 3 documents allowed."); return; }
    setUploadError("");
    setStagedFiles(prev => [...prev.filter(s => s.name !== f.name), f]);
  };

  // Proceed to privacy screen with all staged files
  const initiateUpload = (f?: File) => {
    if (f) stageFile(f);
    // If files are already staged, go to privacy now (called by "Continue" button)
  };

  const proceedToPrivacy = () => {
    if (stagedFiles.length === 0) return;
    pendingFilesRef.current = stagedFiles;
    setStage(STAGE.PRIVACY);
  };

  // Shared upload processor — accepts an array of files
  const processUpload = useCallback(async (files: File[], resetState = false) => {
    if (!files?.length) return;
    if (resetState) {
      setMessages([]); setPlanData(null); setStmtData(null);
      setCalcExpanded(false);
    }
    const primaryFile = files[0];
    setUploadError(""); setFileName(primaryFile.name);
    setUploadProgress(0); setUploadPhase('uploading');
    setUploadDocIndex(0); setUploadDocCount(files.length);
    setStage(STAGE.UPLOADING);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const uploadSignal = abortRef.current.signal;

      // ── Upload all files sequentially → collect fileIds ──────────────────
      const collectedIds: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadDocIndex(i);
        setFileName(files[i].name);
        setUploadProgress(0);
        const fid = await uploadFile(files[i], (pct) => setUploadProgress(pct), uploadSignal);
        collectedIds.push(fid);
      }

      // Capture signal before next await
      const analyzeSignal = abortRef.current.signal;
      fileIdsRef.current = collectedIds;
      setUploadPhase('analyzing');
      setStagedFiles([]);
      pendingFilesRef.current = [];

      if (docType === "statement") {
        const m1 = { role: "user", content: t.stmtFirstMessage };
        const raw = await callClaude([m1], null, lang, null, () => {}, analyzeSignal, collectedIds);
        const sd = parseStmtData(raw);
        if (sd) setStmtData(sd);
        setMessages([m1, { role: "assistant", content: stripStmtData(raw) }]);
        setStage(STAGE.STMT_DASHBOARD);
      } else {
        const m1 = { role: "user", content: t.firstMessage };
        const raw = await callClaude([m1], null, lang, null, () => {}, analyzeSignal, collectedIds);
        const pd = normalizePlanData(parsePlanData(raw));
        if (pd) setPlanData(pd);
        setMessages([m1, { role: "assistant", content: stripPlanData(raw) }]);
        if (!pd) {
          setUploadError(t.errorPlanData);
          setStage(STAGE.LANDING);
        } else {
          setStage(STAGE.APP);
        }
      }
      abortRef.current = null;
    } catch (e) {
      if ((e as any).name === "AbortError") { return; }
      console.error('[processUpload] Upload failed:', (e as any).message, e);
      pendingFilesRef.current = [];
      abortRef.current = null;

      let userMsg: string = t.errorRead;
      const status = (e as any).status;
      if (status === 429) userMsg = "Too many requests — please wait a minute and try again.";
      else if (status === 504) userMsg = "The AI took too long. Try a shorter document or simpler question.";
      else if (status === 413) userMsg = "Upload failed — the file may be too large for the current upload path. Please try again or contact support.";
      else if ((e as any).message) userMsg = (e as any).message;

      setUploadError(userMsg);
      setStage(resetState ? (docType === "statement" ? STAGE.STMT_DASHBOARD : STAGE.APP) : STAGE.LANDING);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, docType, t]);

  const proceedAfterConsent = () => { setPlanGuideTab("guide"); processUpload(pendingFilesRef.current, false); };

  // Complete fresh-start re-upload: wipe all state then open file picker.
  // addDocRef is used for in-session supplemental uploads (APP/stmtDashboard stages) — bypasses privacy screen.
  const startFreshUpload = () => {
    setMessages([]); setPlanData(null); setStmtData(null);
    setFileName(""); setInput(""); setLoading(false); setCalcExpanded(false);
    setStreamingText(''); setStagedFiles([]); pendingFilesRef.current = []; fileIdsRef.current = [];
    setDocType(null); setStage(STAGE.CHOOSER);
  };

  // Supplemental upload: user already in APP/stmtDashboard — skip privacy, append fileId, ask Claude to review new doc
  const supplementalUpload = useCallback(async (file: File) => {
    if (!file) return;
    setUploadError("");
    setFileName(file.name);
    setUploadProgress(0);
    setUploadPhase('uploading');
    setUploadDocIndex(0);
    setUploadDocCount(1);
    setStage(STAGE.UPLOADING);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const uploadSignal = abortRef.current.signal;
      const fid = await uploadFile(file, (pct) => setUploadProgress(pct), uploadSignal);
      const updatedIds = [...fileIdsRef.current, fid];
      fileIdsRef.current = updatedIds;
      setUploadPhase('analyzing');
      const analyzeSignal = abortRef.current.signal;
      const es = lang === "es";
      const followUp = { role: "user" as const, content: es
        ? `He añadido otro documento (${file.name}). Por favor revísalo y dime si contiene información adicional sobre el plan, especialmente opciones de inversión, comisiones u otras disposiciones no cubiertas en el documento anterior.`
        : `I've added another document (${file.name}). Please review it and let me know if it contains any additional plan information — especially investment options, fund lineup, fees, or plan provisions not covered in the original document.`
      };
      const updatedMsgs = [...messages, followUp];
      setMessages(updatedMsgs);
      setActiveTab("chat");
      setStage(STAGE.APP);
      setLoading(true);
      setStreamingText('');
      let reply = '';
      const raw = await callClaude(updatedMsgs, null, lang, planData, (chunk) => {
        reply += chunk;
        setStreamingText(reply);
      }, analyzeSignal, updatedIds);
      setMessages([...updatedMsgs, { role: "assistant", content: raw }]);
      setStreamingText('');
      setLoading(false);
      abortRef.current = null;
    } catch (e: any) {
      if (e.name === "AbortError") { setLoading(false); return; }
      console.error('[supplementalUpload] failed:', e);
      setUploadError(e.message || t.errorRead);
      setStage(STAGE.APP);
      setLoading(false);
      abortRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, lang, planData, t]);

  const sendMessage = async text => {
    if (!text.trim() || loading) return;
    const um = { role: "user", content: text.trim() }; const nm = [...messages, um]; setMessages(nm); setInput(""); setLoading(true); setStreamingText('');
    if (stage === STAGE.APP) setActiveTab("chat");
    else if (stage === STAGE.STMT_DASHBOARD) setStage(STAGE.CHAT);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const raw = await callClaude(nm, null, lang, planData, chunk => setStreamingText(prev => prev + chunk), abortRef.current.signal, fileIdsRef.current);
      setStreamingText('');
      const cleaned = docType === "statement" ? stripStmtData(raw) : stripPlanData(raw);
      setMessages([...nm, { role: "assistant", content: cleaned }]);
      abortRef.current = null;
    } catch (e) {
      setStreamingText('');
      if (e.name === "AbortError") { abortRef.current = null; setLoading(false); return; }
      console.error('[sendMessage] Failed — status:', (e as any).status, 'message:', e.message, e);
      let replyMsg = t.errorReply;
      if ((e as any).status === 429) {
        replyMsg = "Too many requests — please wait a minute and try again.";
      } else if (e.message === 'API key not configured') {
        replyMsg = "Configuration error — please contact support.";
      }
      setMessages([...nm, { role: "assistant", content: replyMsg }]);
      abortRef.current = null;
    }
    setLoading(false);
  };

  const handleKeyDown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } };
  const handleDrop = e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) stageFile(e.dataTransfer.files[0]); };
  const lastMsg = messages[messages.length - 1];
  const showChips = stage === "chat" && !loading && lastMsg?.role === "assistant";

  // ── Privacy ──
  if (stage === "privacy") return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ maxWidth: 540, width: "100%" }}><div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "32px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><div style={{ width: 38, height: 38, borderRadius: 12, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid rgba(212,168,83,.2)` }}><Shield color={C.accent} sz={20} /></div>
        <h2 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600, margin: 0 }}>{t.privacyTitle}</h2></div>
      <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 22 }}>{t.privacyIntro}</p>
      {t.privacyPoints.map(([title, body], i) => <div key={i} style={{ marginBottom: 14, paddingLeft: 14, borderLeft: `2px solid ${i === 1 ? C.warning : C.accent}` }}><p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 3px" }}>{title}</p><p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5, margin: 0 }}>{body}</p></div>)}
      <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(212,168,67,.08)", border: `1px solid rgba(212,168,67,.18)`, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>📚</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.warning, margin: "0 0 4px" }}>
              {t.disclaimer}
            </p>
            <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5, margin: 0 }}>
              {lang === "es"
                ? "Plansparency te ayuda a entender tu plan de jubilación. No proporciona asesoría financiera, fiscal ni de inversión personalizada. Consulta a un profesional calificado para decisiones financieras."
                : "Plansparency helps you understand your retirement plan. It does not provide personalized financial, tax, or investment advice. Consult a qualified professional for financial decisions."}
            </p>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button onClick={() => { pendingFileRef.current = null; setStage("landing"); }} style={{ ...btnBase, flex: 1, padding: "12px", fontSize: 14, background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` }}>{t.privacyCancel}</button>
        <button onClick={proceedAfterConsent} style={{ ...btnBase, flex: 1, padding: "12px", fontSize: 14, background: `linear-gradient(135deg,${C.accent},#B8863A)`, color: "#0F1621" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Shield color="#0F1621" sz={14} />{t.privacyAgree}</span></button>
      </div></div></div></div>;

  // ── Chooser ──
  if (stage === "chooser") return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .02, backgroundImage: `linear-gradient(${C.accent} 1px,transparent 1px),linear-gradient(90deg,${C.accent} 1px,transparent 1px)`, backgroundSize: "80px 80px" }} />
    <div style={{ position: "absolute", top: -200, left: "25%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,168,83,.12) 0%,transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />
    <div style={{ position: "relative", zIndex: 1, maxWidth: 600, textAlign: "center" }}>
      <div style={{ marginBottom: 24 }}><LangToggle lang={lang} setLang={setLang} /></div>
      <div style={{ marginBottom: 28 }}><Logo /></div>
      <h1 style={{ fontFamily: F.display, fontSize: "clamp(38px,7vw,62px)", fontWeight: 600, lineHeight: 1.08, margin: "0 0 6px", letterSpacing: "-.02em" }}>
        {t.heroLine1}{" "}<span style={{ fontStyle: "italic", background: `linear-gradient(135deg,${C.accent},${C.green})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t.tagline}</span>
      </h1>
      <p style={{ fontSize: 16, color: C.textMuted, lineHeight: 1.6, margin: "0 0 10px", maxWidth: 460, marginInline: "auto" }}>{t.subtitle}</p>
      <p style={{ fontSize: 13, color: C.textDim, margin: "0 0 32px" }}>{t.chooserSub}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* SPD option */}
        <button onClick={() => { setDocType("spd"); setStage("landing"); }} style={{
          background: C.surface, border: `2px solid ${C.border}`, borderRadius: 20, padding: "32px 24px",
          cursor: "pointer", fontFamily: F.body, textAlign: "center", transition: "all .2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: `1px solid rgba(212,168,83,.2)` }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: F.display, marginBottom: 8 }}>{t.chooserSpd}</div>
          <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{t.chooserSpdSub}</div>
        </button>

        {/* Statement option */}
        <button onClick={() => { setDocType("statement"); setStage("landing"); }} style={{
          background: C.surface, border: `2px solid ${C.border}`, borderRadius: 20, padding: "32px 24px",
          cursor: "pointer", fontFamily: F.body, textAlign: "center", transition: "all .2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.greenDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: `1px solid rgba(92,184,138,.2)` }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="1.5"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="12" y2="15"/><path d="M17 15l2 2-2 2"/></svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: F.display, marginBottom: 8 }}>{t.chooserStmt}</div>
          <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{t.chooserStmtSub}</div>
        </button>
      </div>

      {/* Trust & Security */}
      <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginTop: 36 }}>
        {[[<Shield key="s" color={C.accent} sz={14} />, t.trustPrivate], ["🔒", t.trustEncrypted], ["📚", t.trustEducation], ["💬", t.trustPlain]].map(([ic, lb], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.textMuted }}>{ic}<span>{lb}</span></div>)}
      </div>
      <div style={{ marginTop: 16, padding: "10px 18px", borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.border}`, maxWidth: 480 }}>
        <p style={{ fontSize: 11, color: C.textMuted, textAlign: "center", margin: 0, lineHeight: 1.5 }}>
          {t.footerDisclaimer}
        </p>
      </div>
    </div>
  </div>;

  // ── Cleared ──
  if (stage === "cleared") return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}><Shield color={C.accent} sz={24} /></div>
    <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 600, margin: "0 0 8px" }}>{t.clearedTitle}</h2>
    <p style={{ color: C.textMuted, fontSize: 14, margin: "0 0 28px", textAlign: "center" }}>{t.clearedBody}</p>
    <button onClick={() => setStage("chooser")} style={{ ...btnBase, padding: "12px 28px", fontSize: 14, background: `linear-gradient(135deg,${C.accent},#B8863A)`, color: "#0F1621" }}>{t.clearedButton}</button></div>;

  // ── Landing ──
  if (stage === "landing") return <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .02, backgroundImage: `linear-gradient(${C.accent} 1px,transparent 1px),linear-gradient(90deg,${C.accent} 1px,transparent 1px)`, backgroundSize: "80px 80px" }} />
    <div style={{ position: "absolute", top: -200, left: "25%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,168,83,.12) 0%,transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />
    <div style={{ position: "relative", zIndex: 1, maxWidth: 600, textAlign: "center" }}>
      <div style={{ marginBottom: 24 }}><LangToggle lang={lang} setLang={setLang} /></div>
      <div style={{ marginBottom: 36 }}><Logo /></div>
      <h1 style={{ fontFamily: F.display, fontSize: "clamp(38px,7vw,64px)", fontWeight: 600, lineHeight: 1.08, margin: "0 0 20px", letterSpacing: "-.02em" }}>
        {t.heroLine1}{" "}<span style={{ fontStyle: "italic", background: `linear-gradient(135deg,${C.accent},${C.green})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t.tagline}</span>
      </h1>
      <p style={{ fontSize: 17, color: C.textMuted, lineHeight: 1.65, margin: "0 0 42px", maxWidth: 480, marginInline: "auto" }}>
        {docType === "statement"
          ? (lang === "es" ? "Sube tu estado de cuenta trimestral o anual para ver un resumen interactivo." : "Upload your quarterly or annual statement to see an interactive breakdown.")
          : t.subtitle}
      </p>
      {/* Drop zone — smaller when files are staged */}
      <div onClick={() => fileInputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        style={{ border: `2px dashed ${dragOver ? C.accent : (stagedFiles.length > 0 ? C.border : C.border)}`, borderRadius: 16, padding: stagedFiles.length > 0 ? "24px 32px" : "42px 32px", cursor: "pointer", background: dragOver ? C.accentDim : (stagedFiles.length > 0 ? C.surfaceAlt : "rgba(23,31,45,.6)"), transition: "all .25s", marginBottom: stagedFiles.length > 0 ? 12 : 36 }}>
        <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) stageFile(e.target.files[0]); e.target.value = ""; }} />
        <div style={{ width: 50, height: 50, borderRadius: 14, margin: "0 auto 14px", background: docType === "statement" ? C.greenDim : C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${docType === "statement" ? "rgba(92,184,138,.2)" : "rgba(212,168,83,.2)"}` }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={docType === "statement" ? C.green : C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 5px" }}>
          {stagedFiles.length > 0
            ? (lang === "es" ? "+ Agregar otro documento" : "+ Add another document")
            : docType === "statement"
              ? (lang === "es" ? "Arrastra tu estado de cuenta aquí" : "Drop your account statement here")
              : t.dropTitle}
        </p>
        <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>
          {stagedFiles.length > 0
            ? (lang === "es" ? "p.ej. 408(b)(2), folleto de inversiones" : "e.g. 408(b)(2) fee disclosure, investment guide")
            : docType === "statement"
              ? (lang === "es" ? "PDF — Estado de cuenta trimestral o anual" : "PDF — Quarterly or annual account statement")
              : t.dropSub}
        </p>
      </div>

      {/* Staged file chips */}
      {stagedFiles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {stagedFiles.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.surface, border: `1px solid ${C.accent}33`, borderRadius: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
              <span style={{ fontSize: 11, color: C.textMuted, flexShrink: 0 }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              <button onClick={e => { e.stopPropagation(); setStagedFiles(prev => prev.filter((_, j) => j !== i)); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, padding: "2px 4px", borderRadius: 4, fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {uploadError && <p style={{ fontSize: 13, color: C.danger, textAlign: "center", margin: "0 0 16px", fontWeight: 600 }}>{uploadError}</p>}

      {/* Continue button — only shown once at least one file is staged */}
      {stagedFiles.length > 0 && (
        <button onClick={proceedToPrivacy} style={{ ...btnBase, width: "100%", padding: "14px", fontSize: 15, background: `linear-gradient(135deg,${C.accent},#B8863A)`, color: "#0F1621", marginBottom: 20 }}>
          {lang === "es" ? `Analizar ${stagedFiles.length > 1 ? stagedFiles.length + " documentos" : "mi plan"} →` : `Analyze ${stagedFiles.length > 1 ? stagedFiles.length + " documents" : "my plan"} →`}
        </button>
      )}

      <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
        {[[<Shield key="s" color={C.accent} sz={14} />, t.trustPrivate], ["🔒", t.trustEncrypted], ["📚", t.trustEducation], ["💬", t.trustPlain]].map(([ic, lb], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.textMuted }}>{ic}<span>{lb}</span></div>)}
      </div>
      <button onClick={() => { setStagedFiles([]); setStage("chooser"); }} style={{ ...btnBase, padding: "8px 20px", fontSize: 12, background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` }}>
        ← {lang === "es" ? "Cambiar tipo de documento" : "Change document type"}
      </button>
    </div></div>;

  // ── Uploading ──
  if (stage === "uploading") {
    const isMulti = uploadDocCount > 1;
    const es = lang === "es";
    return (
      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, animation: "pulse 2s ease-in-out infinite", border: `1px solid rgba(212,168,83,.2)` }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
        </div>
        <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 600, margin: "0 0 6px", textAlign: "center" }}>{t.readingTitle}</h2>

        {/* Status label */}
        <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 16px", textAlign: "center", maxWidth: 320 }}>
          {uploadPhase === 'uploading' ? (
            isMulti
              ? <>{es ? `Enviando documento ${uploadDocIndex + 1} de ${uploadDocCount}` : `Uploading document ${uploadDocIndex + 1} of ${uploadDocCount}`}: <span style={{ color: C.accent }}>{fileName}</span></>
              : <>{es ? "Enviando" : "Uploading"} <span style={{ color: C.accent }}>{fileName}</span>…</>
          ) : (
            <>{es ? "Analizando tu plan" : "Analyzing your plan"}…</>
          )}
        </p>

        {/* Progress bar — always visible */}
        <div style={{ width: "100%", maxWidth: 300, marginBottom: 4 }}>
          <div style={{ width: "100%", height: 8, background: C.surfaceAlt, borderRadius: 4, overflow: "hidden", border: `1px solid ${C.borderLight}`, position: "relative" }}>
            {uploadPhase === 'uploading' ? (
              /* Determinate fill */
              <div style={{ height: "100%", width: `${uploadProgress}%`, background: `linear-gradient(90deg,${C.accent},#D4A853)`, borderRadius: 4, transition: "width .3s ease" }} />
            ) : (
              /* Indeterminate shimmer */
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent 0%, ${C.accent} 40%, #D4A853 60%, transparent 100%)`, animation: "shimmer 1.6s ease-in-out infinite" }} />
            )}
          </div>
        </div>

        {/* Percentage label */}
        {uploadPhase === 'uploading' && (
          <p style={{ color: C.textDim, fontSize: 11, margin: 0, fontVariantNumeric: "tabular-nums" }}>{uploadProgress}%</p>
        )}

        <style>{`
          @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.06);opacity:.75}}
          @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        `}</style>
      </div>
    );
  }

  // ── Dashboard (TOC) ──
  // ── SPD App (dashboard + calculator + key terms + chat) ──
  if (stage === STAGE.APP) {
    const chatPanel = (
      <>
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.filter(m => m.role !== "user" || (!m.content.startsWith("I just uploaded") && !m.content.startsWith("Acabo de subir"))).map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "fadeIn .3s" }}>
              <div style={{ maxWidth: "85%", padding: "12px 15px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? C.userBubble : C.aiBubble, border: `1px solid ${msg.role === "user" ? "rgba(212,168,83,.1)" : C.border}`, fontSize: 14, lineHeight: 1.6 }}>
                {msg.role === "assistant" ? <Md text={msg.content} /> : msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex" }}>
              {streamingText ? (
                <div style={{ maxWidth: "85%", padding: "12px 15px", borderRadius: "16px 16px 16px 4px", background: C.aiBubble, border: `1px solid ${C.border}`, fontSize: 14, lineHeight: 1.6 }}>
                  <Md text={streamingText} />
                  <span style={{ display: "inline-block", width: 2, height: "1em", background: C.accent, verticalAlign: "text-bottom", marginLeft: 2, animation: "blink 1s step-end infinite" }} />
                </div>
              ) : (
                <div style={{ padding: "12px 15px", borderRadius: "16px 16px 16px 4px", background: C.aiBubble, border: `1px solid ${C.border}`, display: "flex", gap: 6 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, opacity: .5, animation: `bounce 1.2s ease-in-out ${i * .15}s infinite` }} />)}
                </div>
              )}
            </div>
          )}
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
      </>
    );

    return (
      <div style={{ height: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column" }}>
        <input ref={addDocRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) supplementalUpload(e.target.files[0]); e.target.value = ""; }} />

        {showClearConfirm && <Modal>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.dangerDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </div>
            <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600, margin: 0 }}>{t.clearConfirmTitle}</h3>
          </div>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 24 }}>{t.clearConfirmBody}</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setShowClearConfirm(false)} style={{ ...btnBase, flex: 1, padding: "11px", fontSize: 14, background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` }}>{t.clearConfirmNo}</button>
            <button onClick={clearSession} style={{ ...btnBase, flex: 1, padding: "11px", fontSize: 14, background: C.danger, color: "#fff" }}>{t.clearConfirmYes}</button>
          </div>
        </Modal>}

        <AppHeader accentColor={C.accent} title={planData?.planName || fileName || "Your Plan"} lang={lang} setLang={setLang} loading={loading} t={t} advisorLogo={advisorLogo} advisorFirmName={advisorFirmName} />

        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} t={t} />

        {activeTab === "dashboard" && (
          <>
            <PlanGuideTabBar
              activeTab={planGuideTab}
              setActiveTab={setPlanGuideTab}
              hasFunds={(planData?.fundsData || []).length > 0}
            />
            {planGuideTab === "guide" && (
              <PlanDashboard t={t} planData={planData} lang={lang} onSectionClick={(prompt) => sendMessage(prompt)} onChat={() => setActiveTab("chat")} onUploadAnother={startFreshUpload} />
            )}
            {planGuideTab === "investments" && (
              <InvestmentsPanel fundsData={planData?.fundsData || []} lang={lang} />
            )}
          </>
        )}
        {activeTab === "calculator" && <CalcPanel t={t} planData={planData} expanded={true} setExpanded={() => {}} lang={lang} asTab={true} />}
        {activeTab === "keyterms" && <KeyTermsPanel t={t} />}
        {activeTab === "chat" && chatPanel}

        {activeTab !== "chat" && (
          <div style={{ flexShrink: 0, padding: "8px 16px", background: C.surfaceAlt, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", gap: 7 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{ margin: 0, fontSize: 10, color: C.textDim, lineHeight: 1.6 }}>{t.planProvisionDisclaimer}</p>
          </div>
        )}

        <style>{`
          @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
          @keyframes blink{50%{opacity:0}}
          *{box-sizing:border-box;margin:0}
          ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
          textarea::placeholder{color:${C.textDim}}
          input[type=range]{-webkit-appearance:none;appearance:none;background:#C8BFAE;border-radius:6px;outline:none;height:10px}
          input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,${C.accent},#B8863A);cursor:pointer;border:3px solid #FBF7F0;box-shadow:0 0 10px rgba(212,168,83,.4)}
          input[type=range]::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,${C.accent},#B8863A);cursor:pointer;border:3px solid #FBF7F0;box-shadow:0 0 10px rgba(212,168,83,.4)}
          select{-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A6B5D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px}
        `}</style>
      </div>
    );
  }

  // ── Statement Dashboard ──
  if (stage === "stmtDashboard") return <div style={{ height: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column" }}>
        <input ref={addDocRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) supplementalUpload(e.target.files[0]); e.target.value = ""; }} />

    <AppHeader accentColor={C.green} title={stmtData?.planName || fileName || "Your Statement"} lang={lang} setLang={setLang} loading={loading} t={t} advisorLogo={advisorLogo} advisorFirmName={advisorFirmName} />

    <StatementDashboard
      t={t} stmtData={stmtData} lang={lang}
      onChat={() => setStage("chat")}
      onUploadAnother={startFreshUpload}
    />
  </div>;

  // ── Statement Chat ──
  return <div style={{ height: "100vh", background: C.bg, color: C.text, fontFamily: F.body, display: "flex", flexDirection: "column" }}>
        {showClearConfirm && <Modal><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><div style={{ width: 36, height: 36, borderRadius: 10, background: C.dangerDim, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></div>
      <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600, margin: 0 }}>{t.clearConfirmTitle}</h3></div>
      <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 24 }}>{t.clearConfirmBody}</p>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => setShowClearConfirm(false)} style={{ ...btnBase, flex: 1, padding: "11px", fontSize: 14, background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` }}>{t.clearConfirmNo}</button>
        <button onClick={clearSession} style={{ ...btnBase, flex: 1, padding: "11px", fontSize: 14, background: C.danger, color: "#fff" }}>{t.clearConfirmYes}</button>
      </div></Modal>}

    <AppHeader
      accentColor={C.green}
      title={stmtData?.planName || fileName || "Your Statement"}
      onBack={() => setStage(STAGE.STMT_DASHBOARD)}
      backLabel={lang === "es" ? "Tu Estado" : "Your Statement"}
      lang={lang} setLang={setLang} loading={loading} t={t}
      advisorLogo={advisorLogo} advisorFirmName={advisorFirmName}
    />

    <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
      {messages.filter(m => m.role !== "user" || (!m.content.startsWith("I just uploaded") && !m.content.startsWith("Acabo de subir"))).map((msg, i) => (
        <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "fadeIn .3s" }}>
          <div style={{ maxWidth: "85%", padding: "12px 15px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? C.userBubble : C.aiBubble, border: `1px solid ${msg.role === "user" ? "rgba(212,168,83,.1)" : C.border}`, fontSize: 14, lineHeight: 1.6 }}>
            {msg.role === "assistant" ? <Md text={msg.content} /> : msg.content}
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ display: "flex" }}>
          {streamingText ? (
            <div style={{ maxWidth: "85%", padding: "12px 15px", borderRadius: "16px 16px 16px 4px", background: C.aiBubble, border: `1px solid ${C.border}`, fontSize: 14, lineHeight: 1.6 }}>
              <Md text={streamingText} />
              <span style={{ display: "inline-block", width: 2, height: "1em", background: C.accent, verticalAlign: "text-bottom", marginLeft: 2, animation: "blink 1s step-end infinite" }} />
            </div>
          ) : (
            <div style={{ padding: "12px 15px", borderRadius: "16px 16px 16px 4px", background: C.aiBubble, border: `1px solid ${C.border}`, display: "flex", gap: 6 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, opacity: .5, animation: `bounce 1.2s ease-in-out ${i * .15}s infinite` }} />)}
            </div>
          )}
        </div>
      )}
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
      @keyframes blink{50%{opacity:0}}
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

export default function PlansparencyApp(props: PlansparencyAppProps) {
  return React.createElement(ErrorBoundary, null, React.createElement(Plansparency, props));
}
