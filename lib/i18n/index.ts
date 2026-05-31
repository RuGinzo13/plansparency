// ── i18n strings (en / es) ──────────────────────────────────────────────────
// Extracted verbatim from components/PlansparencyApp.tsx (Phase 5). Pure data,
// no module dependencies. Consumed via i18n[lang] in the app + dashboards.
export const i18n = {
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
