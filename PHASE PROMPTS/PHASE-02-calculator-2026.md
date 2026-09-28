# PHASE 02 — Calculator: year-based IRS limits, Roth catch-up rule, limit tracker
**Created:** Sept 28, 2026 in Cowork
**Open items covered:** OPEN-ITEMS.md #6 (IRS limits stale). Also cleans dead FR/IT code inside the calculator.
**Status:** Step 1 `3697a23` · Step 2 `6378a3f` · Step 3 `b735d77` (Ross live checks for Step 3 pending)

---

## How Ross runs this (Claude Code ignores this part)

3 steps. **One step per fresh Claude Code conversation**, in order. Keep Claude Code in the **ask-permission mode** if auto mode is still flaky.

- Step 1: `Read "PHASE PROMPTS/PHASE-02-calculator-2026.md" and execute STEP 1 only. Stop when Step 1 is done.`
- Step 2: same, with `STEP 2 only`
- Step 3: same, with `STEP 3 only`

After each step: Vercel shows **Ready** with that step's commit message, do the "Ross checks", tell Cowork.

Step 1 changes nothing you can see. Step 2 is the first visible change (2026 numbers). Step 3 adds the new features.

---

## Rules for Claude Code (every step)

- Execute ONLY the step named. Do "Check the ground" first; if anything doesn't match, STOP and report.
- Change only the files the step lists. Stage only those files (never `git add -A` / `git add .`).
- `components/PlansparencyApp.tsx` has `// @ts-nocheck`. Do NOT remove it in this phase. All new logic goes in typed `lib/` files so it IS type-checked.
- Languages are EN and ES only. Every new user-facing string needs both, word for word as written here.
- Education only. Never add wording that tells the user what they should contribute or choose.
- Never force-push. Never rewrite history. Report: commit hash, files changed, anything unexpected.

---

## Verified facts this phase is built on (source: IRS, Nov 2025; checked by Cowork Sept 28, 2026)

| Limit | 2025 | 2026 |
|---|---|---|
| Employee contribution limit (402(g)) | 23,500 | 24,500 |
| Catch-up, age 50+ | 7,500 | 8,000 |
| Catch-up, ages 60–63 (SECURE 2.0) | 11,250 | 11,250 |
| Pay counted for employer contributions (401(a)(17)) | 350,000 | 360,000 |
| Roth catch-up wage threshold (prior-year Social Security wages from this employer) | not in effect | 150,000 |

Rules:
- Catch-up eligibility uses the age you **reach by Dec 31** of that year, not your age today. Ages 60, 61, 62, 63 by Dec 31 get the 60–63 amount. 64+ goes back to the regular 50+ amount.
- Starting 2026: if you earned **more than $150,000** in Social Security wages (W-2 Box 3) **from this employer last year**, your catch-up money must go in as **Roth**. If the plan has no Roth option, you can't make catch-up contributions at all. People at or under $150,000, or with no wages from this employer last year, are not affected.

---

## STEP 1 — Build the math in typed library files (no visible change)

**Why:** The limits are hardcoded 2025 numbers, age is measured wrong for catch-up, and the safe harbor math lives inside an un-type-checked 2,400-line UI file. Move all math into small typed files first, so Step 2 and 3 just display results.

**Check the ground**
- `git status` and `git log --oneline -3`. Latest commit should be `f412806` (site lock). Allowed uncommitted changes: `MEMORY.md`, `OPEN-ITEMS.md`, `PHASE PROMPTS/PHASE-01-stabilize.md`, and this file `PHASE PROMPTS/PHASE-02-calculator-2026.md` (Cowork's doc edits). Anything else changed = STOP.
- `ls lib/plan/`. Open `lib/plan/irs.ts` and confirm `getIRSLimits` uses `23500` / `7500` / `11250`.
- Run `grep -rn "getIRSLimits" app components lib` and confirm the ONLY caller is `components/PlansparencyApp.tsx` (CalcPanel). If there are others, STOP and report.

**Files you may change:** `lib/plan/irs.ts` (rewrite), `lib/plan/calc.ts` (new). Plus commit the allowed doc files above.

**Do not touch:** `components/PlansparencyApp.tsx`, `lib/i18n/index.ts`, anything in `app/`.

**Do this**

1. Rewrite `lib/plan/irs.ts`:
   - A year-keyed table `IRS_LIMITS` for 2025 and 2026 with fields: `deferral`, `catchUp50`, `catchUp6063`, `compLimit`, `rothCatchUpWageThreshold` (`null` for 2025, `150000` for 2026). Values exactly from the table above. Top-of-file comment: "Add next year's row here each November when the IRS announces limits. Source: IRS newsroom / Notice 2025-67 for 2026."
   - `getLimitYear(today = new Date())`: returns `{ year, isFallback }`. If the current calendar year is in the table, use it. Otherwise use the latest year in the table and set `isFallback: true`.
   - `getIRSLimits(dob: string | null | undefined, year?: number)`: keep the existing return fields (`base`, `catchUp`, `total`, `catchUpEligible`, `enhanced`, `age`) so the current UI keeps working, and ADD `year`, `isFallback`, `compLimit`, `rothCatchUpWageThreshold`, `ageAtYearEnd`.
     - Age rule: `ageAtYearEnd = year - birthYear`, where `birthYear` is read straight from the `YYYY-MM-DD` string (do not use `new Date(dob)`; it shifts dates by timezone). Set `age` to the same value as `ageAtYearEnd`.
     - `enhanced` = ageAtYearEnd between 60 and 63 inclusive → `catchUp = catchUp6063`. Else if ageAtYearEnd ≥ 50 → `catchUp = catchUp50`. Else 0.
     - Bad or empty DOB → no catch-up, `age: null`.
2. Create `lib/plan/calc.ts` with pure, typed functions (no React, no DOM):
   - `safeHarborAmount(type, payForEmployer, pct)`: move the four formulas out of CalcPanel EXACTLY as they are today (nonelective 3%; basic 100% of first 3% + 50% of next 2%; enhanced 100% up to 4%; QACA 100% of first 1% + 50% of next 5%). Returns 0 for `none` or unknown.
   - `rothCatchUpStatus({ catchUpEligible, planAllowsCatchUp, planHasRoth, earnedOverThreshold, thresholdApplies })` returning one of: `'not_eligible'` (not 50+ or plan has no catch-up), `'rule_not_in_effect'` (no threshold for that year), `'unknown'` (user hasn't answered), `'not_affected'` (answered No), `'roth_required'` (Yes + plan has Roth), `'blocked_no_roth'` (Yes + no Roth).
   - `contributionSummary({ salary, pct, payPeriods, limits, catchUpAllowed })` returning:
     - `annualLimit` = `limits.base + (catchUpAllowed ? limits.catchUp : 0)`
     - `electedAnnual` = salary × pct / 100
     - `perPaycheck` = electedAnnual / payPeriods (what comes out of each check while contributing)
     - `annualContribution` = min(electedAnnual, annualLimit)
     - `hitsLimit` = electedAnnual > annualLimit
     - `limitReachedAtPaycheck` = if hitsLimit: ceil(annualLimit / perPaycheck), else null
     - `pctToReachLimit` = salary > 0 ? (annualLimit / salary × 100) rounded to 1 decimal, capped at 100 : null
     - `payForEmployer` = min(salary, limits.compLimit), and `payCapped` = salary > compLimit
     - Guard every division: salary 0, pct 0, payPeriods 0 must never produce NaN or Infinity.
3. Type check: `npx tsc --noEmit` (if Node is too old: `export PATH="/usr/local/opt/node@25/bin:$PATH"` first). Must pass.
4. Sanity check with a throwaway script (do NOT commit it): write `/tmp/calc-check.mts` that imports from the two lib files via relative path and prints results, run it with `npx --yes tsx /tmp/calc-check.mts`. If `tsx` can't be fetched, skip this sub-step and say so. Expected:

   | Input (year 2026) | Expected |
   |---|---|
   | DOB `1976-12-15` | ageAtYearEnd 50, catchUp 8000, total 32500 |
   | DOB `1964-06-01` | 62, enhanced true, catchUp 11250, total 35750 |
   | DOB `1962-03-01` | 64, enhanced false, catchUp 8000 |
   | DOB `1990-01-01` | 36, catchUp 0, total 24500 |
   | salary 300000, pct 10, 26 checks, age 36 | electedAnnual 30000, annualContribution 24500, hitsLimit true, perPaycheck 1153.85, limitReachedAtPaycheck 22, pctToReachLimit 8.2 |
   | salary 400000, nonelective safe harbor | payForEmployer 360000, safeHarborAmount 10800 |
   | salary 0 | no NaN anywhere, pctToReachLimit null |

5. Stage ONLY: `lib/plan/irs.ts lib/plan/calc.ts` plus the allowed doc files that show as modified. Commit: `feat(calc): year-keyed IRS limits + typed calculator math (no UI change)`. Push.

**Ross checks**
- Vercel Ready with that message. The calculator should look and act exactly the same as before (still showing 2025 numbers until Step 2; that's expected).

---

## STEP 2 — Wire the calculator to the new math (first visible change)

**Why:** Switch the calculator onto the typed math, show which year's limits are in use, fix per-paycheck display, and delete the dead French/Italian code inside the calculator.

**Check the ground**
- `git status`: latest commit is `3697a23` (Step 1). The only allowed uncommitted change is this file, `PHASE PROMPTS/PHASE-02-calculator-2026.md` (Cowork's update). Anything else = STOP.
- Confirm `lib/plan/calc.ts` exists and exports `safeHarborAmount`, `rothCatchUpStatus`, `contributionSummary`.
- In `components/PlansparencyApp.tsx`, find `function CalcPanel` by name (do not trust line numbers).

**Files you may change:** `components/PlansparencyApp.tsx` (ONLY inside `function CalcPanel`, plus its import lines at the top), `lib/i18n/index.ts` (only the `calcSecureNote` keys and the new keys below), `lib/plan/irs.ts` (only item 0 below).

**Do not touch:** any other component, the chat engine, upload flow, statement dashboard, Investments tab, or any file in `app/`.

**Do this**
0. **Switch to the current year (this is what makes 2026 show up).** Step 1 left `getIRSLimits` defaulting to 2025 on purpose. Now:
   - In `lib/plan/irs.ts`: remove `DEFAULT_YEAR` and its comment; make the default for `year` be `getLimitYear().year`.
   - In CalcPanel: `const limitYear = getLimitYear();` and `const limits = getIRSLimits(dob || null, limitYear.year);` (import `getLimitYear` from `@/lib/plan/irs`). The year label and fallback warning in item 4 use `limitYear.year` / `limitYear.isFallback`, and `{currentYear}` = `new Date().getFullYear()`.
1. Import `safeHarborAmount` and `contributionSummary` from `@/lib/plan/calc`. Replace the inline safe harbor math in CalcPanel with `safeHarborAmount(sh.type, summary.payForEmployer, pct)`. Replace `empContrib`, `total`, `perPaycheck` with values from `contributionSummary`. `catchUpAllowed` for now = `limits.catchUpEligible && planAllowsCatchUp` (Step 3 adds the Roth rule).
2. Per-paycheck box shows `summary.perPaycheck` (the real amount taken from each check). "Your annual contribution" shows `summary.annualContribution`.
3. Inside CalcPanel ONLY: remove every `fr` and `it` branch (e.g. `lang === "fr" ? … : lang === "it" ? …`, and `fr:`/`it:` keys in `shLabels`). Keep the EN and ES text exactly as it is now. The app only supports `en` and `es`.
4. Add a small label at the top of the calculator (above the inputs): EN `Using {year} IRS limits` / ES `Usando los límites del IRS de {year}`. If `limits.isFallback` is true, add on the next line: EN `{currentYear} limits aren't loaded yet. Numbers may be out of date.` / ES `Los límites de {currentYear} aún no están cargados. Las cifras pueden estar desactualizadas.` Add these as i18n keys `calcLimitsYear` and `calcLimitsFallback` (use `{year}` / `{currentYear}` placeholders and replace in the component).
5. Replace the hardcoded numbers in `calcSecureNote` (EN + ES) so the sentence is built from the table. New text:
   - EN: `Limits shown are for {year}. If you turn 50 or older by Dec 31, you can add catch-up money ({catchUp50}). If you turn 60–63 by Dec 31, the catch-up is higher ({catchUp6063}).`
   - ES: `Los límites mostrados son de {year}. Si cumples 50 años o más antes del 31 de diciembre, puedes agregar contribuciones adicionales ({catchUp50}). Si cumples entre 60 y 63 antes del 31 de diciembre, el monto adicional es mayor ({catchUp6063}).`
   Format dollar amounts with the existing `fmtRounded`.
6. Type check (`npx tsc --noEmit`) must pass. Build check: `npm run build` must pass.
7. Stage ONLY `components/PlansparencyApp.tsx lib/i18n/index.ts lib/plan/irs.ts "PHASE PROMPTS/PHASE-02-calculator-2026.md"`. Commit: `feat(calc): 2026 limits, year label, correct catch-up age rule, remove dead FR/IT in calculator`. Push.

**Ross checks (log in, upload a test SPD, open Calculator tab)**
- Top label says **Using 2026 IRS limits**.
- No DOB: IRS limit shows **$24,500**.
- DOB `12/15/1976` (turns 50 this year): limit **$32,500**, catch-up Yes (50+).
- DOB `06/01/1964`: limit **$35,750**, catch-up Yes (60-63).
- Salary $300,000 at 10%: annual contribution **$24,500**, per paycheck (biweekly) **$1,153.85**.
- Switch to ES: all calculator text is Spanish, nothing in French/Italian, no English leftovers.

---

## STEP 3 — New features: limit tracker + Roth catch-up rule

**Why:** Two things people actually get confused about: "when do I hit the max?" and the new 2026 rule that forces some catch-up money into Roth.

**Check the ground**
- `git status`: latest commit is `6378a3f` (Step 2). Only allowed uncommitted change: this file (Cowork's status update). Anything else = STOP. Find `function CalcPanel` by name. Note: Step 2 added a `tpl()` placeholder helper and imports `getLimitYear`; reuse them, don't duplicate.

**Files you may change:** `components/PlansparencyApp.tsx` (ONLY inside `function CalcPanel`), `lib/i18n/index.ts` (new keys only).

**Do not touch:** everything else. Do not change the safe harbor card, discretionary match card, or last-day text.

**Do this**

1. **Limit tracker** (place right under the contribution slider):
   - A horizontal progress bar: `annualContribution` out of `annualLimit`, labeled `{annualContribution} of {annualLimit}` / ES `{annualContribution} de {annualLimit}`.
   - One line under it, pick by state:
     - Not hitting limit: EN `At {pct}%, you'd put in {annualContribution} this year. The {year} limit for you is {annualLimit}.` ES `Con {pct}%, aportarías {annualContribution} este año. Tu límite de {year} es {annualLimit}.`
     - Hitting limit: EN `At {pct}%, you'd reach the {year} limit after paycheck {n} of {payPeriods}. After that, contributions stop for the rest of the year.` ES `Con {pct}%, llegarías al límite de {year} después del cheque {n} de {payPeriods}. Después de eso, las contribuciones se detienen por el resto del año.`
   - Plus, always when salary > 0: EN `The limit works out to about {pctToReachLimit}% of your pay.` ES `El límite equivale a aproximadamente {pctToReachLimit}% de tu salario.`
   - When hitting limit AND the plan has a safe harbor MATCH (basic, enhanced or QACA, not nonelective), add: EN `Some plans only match on paychecks where you contribute. Ask HR whether your plan does a year-end "true-up."` ES `Algunos planes solo igualan en los cheques donde contribuyes. Pregunta a Recursos Humanos si tu plan hace un "ajuste de fin de año" (true-up).`
2. **Pay limit note:** when `payCapped` is true, show under the safe harbor card: EN `Employer contributions are figured on pay up to {compLimit} (the {year} IRS pay limit).` ES `Las contribuciones del empleador se calculan sobre un salario de hasta {compLimit} (el límite de salario del IRS de {year}).`
3. **Roth catch-up card** — show ONLY when `limits.catchUpEligible && planAllowsCatchUp && limits.rothCatchUpWageThreshold !== null`:
   - Title: EN `New in {year}: catch-up rule for higher earners` / ES `Nuevo en {year}: regla de contribución adicional para ingresos altos`
   - Question: EN `Last year, did you earn more than {threshold} from this employer? (Check Box 3 of your W-2.)` / ES `El año pasado, ¿ganaste más de {threshold} con este empleador? (Revisa la casilla 3 de tu W-2.)`
   - Three buttons (component state, default unanswered): EN `Yes` `No` `Not sure` / ES `Sí` `No` `No estoy seguro`.
   - Use `rothCatchUpStatus` from `@/lib/plan/calc` (`planHasRoth` = the existing `hasRoth`). Show one message by status:
     - `unknown` / Not sure: EN `This only matters for your catch-up money. If you earned more than {threshold} here last year, your catch-up has to go in as Roth (you pay tax now, not later). New to this employer this year? The rule doesn't apply to you yet.` ES `Esto solo afecta tu contribución adicional. Si ganaste más de {threshold} aquí el año pasado, tu contribución adicional debe ser Roth (pagas impuestos ahora, no después). ¿Eres nuevo con este empleador este año? La regla aún no aplica para ti.`
     - `not_affected`: EN `The rule doesn't apply to you. Your catch-up can go in pre-tax or Roth, whichever your plan offers.` ES `La regla no aplica para ti. Tu contribución adicional puede ser antes de impuestos o Roth, según lo que ofrezca tu plan.`
     - `roth_required`: EN `Your {catchUp} catch-up has to go in as Roth. That means it's taxed now, and qualified withdrawals later can be tax-free. Your regular contributions up to {base} aren't affected.` ES `Tu contribución adicional de {catchUp} debe ser Roth. Eso significa que pagas impuestos ahora y los retiros calificados en el futuro pueden estar libres de impuestos. Tus contribuciones regulares hasta {base} no cambian.`
     - `blocked_no_roth`: EN `This plan doesn't show a Roth option, so under the {year} rule you can't make catch-up contributions here. Your limit is {base}. Ask HR if a Roth option is being added.` ES `Este plan no muestra una opción Roth, así que bajo la regla de {year} no puedes hacer contribuciones adicionales aquí. Tu límite es {base}. Pregunta a Recursos Humanos si se agregará una opción Roth.`
   - Feed the answer back into the math: `catchUpAllowed = limits.catchUpEligible && planAllowsCatchUp && status !== 'blocked_no_roth'`. The IRS limit box, tracker and totals must all update when the answer changes.
   - Small footer on the card: EN `For education only. Your plan administrator applies this rule, not this calculator.` ES `Solo educativo. El administrador de tu plan aplica esta regla, no esta calculadora.`
4. All new strings go in `lib/i18n/index.ts` under both `en` and `es` with clear `calc…` key names. Placeholders are replaced in the component. Dollar amounts use `fmtRounded`.
5. Mobile: everything must wrap on a 375px-wide screen (use `flexWrap: "wrap"` like the existing cards). No horizontal scrolling.
6. `npx tsc --noEmit` and `npm run build` must pass.
7. Stage ONLY `components/PlansparencyApp.tsx lib/i18n/index.ts "PHASE PROMPTS/PHASE-02-calculator-2026.md"`. Commit: `feat(calc): limit tracker + 2026 Roth catch-up rule card (EN/ES)`. Push.

**Ross checks (Calculator tab, test SPD loaded)**
- Salary $100,000, 10%, biweekly, no DOB: bar shows $10,000 of $24,500; line says limit is about 24.5% of pay.
- Salary $300,000, 10%: "reach the 2026 limit after paycheck 22 of 26".
- DOB `06/01/1970` (56): Roth catch-up card appears. Click **Yes**:
  - On a plan WITH Roth: card says catch-up must be Roth; limit stays **$32,500**.
  - On a plan WITHOUT Roth (if a test SPD has none): card says no catch-up; limit drops to **$24,500**.
- Click **No**: "rule doesn't apply" and limit is $32,500.
- DOB `1990`: the Roth card is NOT shown.
- Switch to ES and repeat one case. Check on your phone that nothing runs off the screen.
