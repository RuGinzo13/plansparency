# PHASE 07 — Calculator redesign, yearly limits file, one glossary
**Created:** Sept 29, 2026 in Cowork
**Run:** `Read "PHASE PROMPTS/PHASE-07-calculator-redesign.md" and execute all steps in order.` Unattended. 7 steps, 7 commits, each pushed. No checkpoints (no data deletion, no schema change; every step reverts cleanly).
**Open items covered:** #19 calculator redesign, #20 limits in their own yearly file, #21 design fixes (a, b, d, e, g, h and the 11px minimum inside the calculator), #22 match eligibility never shown, plus "definitions consistent everywhere" (Ross, Sept 29).
**Design source of truth:** the approved mockup, Design canvas "Calculator Redesign" in Ross's claude.ai artifacts (phone + web boards, version 13). Everything the UI needs from it is written out in STEP 6 below. Claude Code cannot open the canvas; do not try.
**Status:** Done, Sept 30, 2026
- STEP 1 (`f82a19a`) — yearly IRS limits file
- STEP 2 (`ac4e25e`) — one glossary for every definition
- STEP 3 (`40e2765`) — brand fonts, readable colors, dark-mode rules removed
- STEP 4 (`5f22386`) — before-tax option read, match eligibility shown
- STEP 5 (`1ef83bb`) — calculator math in one pure, tested function
- STEP 6 (`3dc02e6`) — calculator screen rebuilt
- STEP 7 (docs, this commit) — Cowork docs updated

---

## Why
The calculator was cluttered: the answer sat at the bottom, the same numbers appeared two or three times, it asked for a full birthday, one tile ("Pre-Tax Available") was hardcoded to "Yes", and it only worked on wide screens. Ross approved a redesign that asks about the person first, shows their 2026 limit (regular, catch-up, super catch-up, Roth catch-up rule, Traditional vs Roth), then the save slider, then the result. Along the way: IRS limits move to one yearly file, and every definition in the app comes from one glossary so the calculator, Key Terms and Plan Guide never disagree.

---

## Rules for Claude Code (every step)
- Run from the repo root. Commands only in the forms `.claude/settings.json` allows. No `cd x && git`, no `$(...)`. Stage only the files the step names (never `git add -A` / `git add .`).
- Education only, never advice. No "you should", no "good choice if", no "hard to beat". Plain words a non-finance person understands. No em dashes in user-facing copy.
- Every new user-facing string exists in **English and Spanish** (`lib/i18n/index.ts` or the glossary). Spanish: natural Latin-American Spanish matching the tone already in the file. List every new Spanish string in your final report so Ross can have it reviewed.
- Files under `lib/` must type-check with NO `@ts-nocheck`. UI files that already have `// @ts-nocheck` keep it.
- Missing-name check for UI files you edit (they have `@ts-nocheck`, so a missing import would only crash in the browser): temporarily remove the `// @ts-nocheck` line, run `npx tsc --noEmit 2>&1 | grep -E "TS2304|TS2552|TS2305|TS2307|TS2724"`, fix only missing imports/exports until empty, put the line back exactly.
- Then `npx tsc --noEmit` and `npm run build` must pass. Node too old → `export PATH="/usr/local/opt/node@25/bin:$PATH"`.
- Commit, push to `main`. Never force-push. If a check fails and you cannot fix it inside the files the step names, STOP and report.
- Find code by name, not by line number.

---

## STEP 1 — Housekeeping + IRS limits in their own yearly file (#20)

**Check the ground:** `git status` must show ONLY: `.claude/settings.json` (untracked; Cowork created it, PHASE-06 was supposed to commit it and did not), modified Cowork docs (`*.md` in repo root), and this file under `PHASE PROMPTS/`. Latest commit `e573bf2` or later. Anything else → STOP and report.

**Do:**
1. Create `lib/plan/irs-limits.ts` holding ONLY the yearly table and its type. Top of file, a plain-English comment:
   ```
   // HOW TO UPDATE EACH YEAR (every November, when the IRS announces next year's limits)
   // 1. Copy the newest year's row, change the year, and type in the new numbers.
   // 2. Leave older years in place. Nothing else needs to change.
   // 3. On Jan 1 the calculator switches to the new year's row by itself.
   //    If the row is missing, it keeps using the newest row and shows a notice.
   // Source for each row: the IRS newsroom announcement / notice for that year.
   ```
   Fields per year (name them exactly): `deferral` (402(g) employee limit), `catchUp50`, `catchUp6063`, `compLimit` (401(a)(17) pay limit), `rothCatchUpWageThreshold` (number or null), `totalAdditions` (415(c) limit on everything going in from you + employer, catch-up not counted), `hceThreshold` (highly compensated employee pay line).
   Values:
   - 2025: deferral 23500, catchUp50 7500, catchUp6063 11250, compLimit 350000, rothCatchUpWageThreshold null, totalAdditions 70000, hceThreshold 160000
   - 2026: deferral 24500, catchUp50 8000, catchUp6063 11250, compLimit 360000, rothCatchUpWageThreshold 150000, totalAdditions 72000, hceThreshold 160000
2. `lib/plan/irs.ts`: import the table from `irs-limits.ts` and re-export `IRS_LIMITS` (so existing imports keep working). Add `totalAdditions` and `hceThreshold` to the `IRSLimits` result.
   Add `getIRSLimitsForAge(ageAtYearEnd: number | null, year?: number): IRSLimits` holding the catch-up logic (60–63 → catchUp6063 and `enhanced: true`; 50+ otherwise → catchUp50; the super catch-up REPLACES the regular one, never both). Rewrite `getIRSLimits(dob, year)` as a thin wrapper that turns the birth year into age-at-year-end and calls it (keep it until STEP 6 removes the last caller; then delete it if nothing else uses it).
3. Checks → `git add .claude/settings.json lib/plan/irs-limits.ts lib/plan/irs.ts` → commit `feat(limits): yearly IRS limits file with 415(c) and HCE lines` → push.

---

## STEP 2 — One glossary for every definition in the app

**Why:** Key Terms has definitions typed straight into `lib/i18n/index.ts`, including old 2025 numbers ("$23,500", "$7,500") and advice-style lines. The calculator will now show definition bubbles. One source stops them drifting apart.

**Do:**
1. Create `lib/glossary.ts` (typed, no `@ts-nocheck`):
   - `TermId` union and a list of entries `{ id, term: {en, es}, def: {en, es} }`.
   - Definitions may contain placeholders `{year} {deferral} {catchUp50} {catchUp6063} {compLimit} {rothThreshold} {totalAdditions} {hceThreshold}` filled from `IRS_LIMITS` for `getLimitYear().year`, formatted like `$24,500` (use `fmtRounded` from `lib/format.ts`). No dollar limit is ever typed into a definition by hand.
   - `getGlossary(lang)` returns the ordered list with placeholders filled; `getTerm(id, lang)` returns one `{term, def}`.
2. Entries, in this order. English is final wording; write the Spanish to match. Keep existing Spanish where the English did not change.
   - `401k` "401(k)": "A retirement savings account offered through your job. Money comes out of your paycheck automatically. Depending on your plan, it can go in before-tax (Traditional), after-tax (Roth), or both."
   - `contribution` "Contribution": keep current text.
   - `employerMatch` "Employer match": "Money your employer adds when you save. Example: a '50% match on the first 6%' means for every $1 you put in, up to 6% of your pay, your employer adds 50 cents."
   - `safeHarbor` "Safe harbor contribution": keep current text.
   - `discretionaryMatch` "Extra (discretionary) match" (NEW): "Money your employer may add on top, if it decides to. It can change or skip it any year, so it is not guaranteed."
   - `profitSharing` "Profit sharing": keep current text.
   - `eligibility` "Eligibility and waiting period" (NEW): "The rules for when you can start saving in the plan and when employer money starts. Some plans make new employees wait, for example until they have worked there a year."
   - `vesting`, `vestingSchedule`: keep current text.
   - `traditional` "Traditional (before-tax)": "Money goes in before income tax, so less of your paycheck is taxed today. You pay income tax later, when you take the money out in retirement."
   - `roth` "Roth (after-tax)": "Money goes in after you pay income tax on it, so there's no tax break today. Later, you can take it out tax-free, including what it earned, generally once you're 59½ or older and your Roth account has been open at least 5 years."
   - `irsLimit` "IRS contribution limit": "The most you can put in from your paychecks in a year, across every job you have that year. For {year} it's {deferral}. Money your employer adds does not count toward it."
   - `catchUp` "Catch-up contribution": "Extra savings allowed the year you turn 50 or older. In {year} that's {catchUp50} more. If you're 60 to 63 by Dec 31, the extra is {catchUp6063} instead (the 'super catch-up'). Your plan has to allow catch-ups."
   - `rothCatchUpRule` "Roth catch-up rule" (NEW): "Starting in 2026, if you earned more than {rothThreshold} from your employer last year (Box 3 of your W-2), your catch-up money has to go in as Roth. Your regular savings aren't affected."
   - `payLimit` "Pay limit for employer money" (NEW): "Employer contributions are figured on pay up to {compLimit} in {year}. Pay above that doesn't earn more employer money."
   - `totalLimit` "Total yearly limit" (NEW): "Everything going into your account in one year, from you and your employer together, can't be more than {totalAdditions} in {year}. Catch-up savings don't count toward it."
   - `hce` "Highly compensated employee" (NEW): "Someone who earned more than {hceThreshold} last year. In some plans, their savings can be limited or partly refunded after the plan's yearly fairness test."
   - `rollover`, `rmd`, `hardship`, `loan`: keep current text.
3. `components/plansparency/KeyTermsPanel.tsx`: read from `getGlossary(lang)` instead of `t.keyTerms`. It needs `lang`: add the prop and pass it from `components/PlansparencyApp.tsx`. While in this file: `F.head` does not exist in `theme.ts`; change it to `F.display`.
4. Delete the `keyTerms` arrays (EN and ES) from `lib/i18n/index.ts`. Search the repo for `keyTerms` first; if anything else reads them, switch it to the glossary.
5. `components/plansparency/PlanDashboard.tsx`: the Roth tile's `desc` and any other tile text that defines Traditional/pre-tax or Roth must match the glossary meaning (short form is fine: "Traditional: taxed when you take it out. Roth: taxed now, qualified withdrawals later can be tax-free."). Do not change prompts sent to chat.
6. Checks → `git add lib/glossary.ts lib/i18n/index.ts components/plansparency/KeyTermsPanel.tsx components/plansparency/PlanDashboard.tsx components/PlansparencyApp.tsx` → commit `feat(glossary): one source for every definition, limits filled from the yearly table` → push.

---

## STEP 3 — Load the real fonts + readable colors (#21 a, b, d, e, g)

**Do:**
1. `app/layout.tsx`: load Cormorant Garamond (600, 700) and DM Sans (400, 500, 600, 700) with `next/font/google`, each with a CSS variable (`--font-display`, `--font-body`), and put both variable classNames on `<html>`. (next/font serves the files from our own site at build time, so visitors' browsers never call Google.) Keep ClerkProvider behavior exactly as is.
2. `components/plansparency/theme.ts` `F`: `display: "var(--font-display), Georgia, serif"`, `body: "var(--font-body), 'Segoe UI', system-ui, sans-serif"`. Replace the hardcoded font strings in `app/advisor/page.tsx` and `app/p/[plan_id]/page.tsx` with the same stacks.
3. `app/globals.css`: body `font-family: var(--font-body), 'Segoe UI', system-ui, sans-serif`; body background `#F4EFE6`, color `#1E1408`. Delete both `@media (prefers-color-scheme: dark)` blocks (the app has no dark theme; they could turn text near-white on the cream background).
4. `theme.ts` `C` color changes (values checked for readability, 4.5:1 or better on the cream backgrounds):
   - change: `textDim` → `#6F6254`, `green` → `#287048`, `warning` → `#A4470F`
   - add: `accentText: "#7F5F0F"` (gold words on cream), `accentSoft: "#F6ECD6"`, `warningDim: "#FBE9D9"`, `greenSoft: "#E8F1EA"`, `dangerSoft: "#F6E0E0"`, `inputBorder: "#9A8878"`, `primaryEnd: "#B8863A"`, `onPrimary: "#0F1621"`
   - `components/plansparency/ui.tsx` `Fm` (bold words in chat answers): `C.accent` → `C.accentText`.
5. Checks → `git add app/layout.tsx app/globals.css app/advisor/page.tsx "app/p/[plan_id]/page.tsx" components/plansparency/theme.ts components/plansparency/ui.tsx` → commit `fix(design): load brand fonts, readable text colors, drop stray dark-mode rules` → push.

---

## STEP 4 — Plan data: before-tax option + match eligibility shown (#22)

**Do:**
1. `lib/i18n/index.ts` plan-reading instructions (both EN and ES blocks, the PLANDATA field list and the example JSON): add `hasPreTax` ("does the plan allow before-tax (traditional) elective deferrals? true/false, null if the document doesn't say"). Make sure `matchEligibility` is described as `{ requirement, entryDates, immediateMatch }`.
2. `lib/plan/plandata.ts`: add `hasPreTax: boolean | null` (keep null when missing; do NOT default to true). Type `matchEligibility` as `{ requirement?: string; entryDates?: string; immediateMatch: boolean | null }` and normalize it the way `contribEligibility` is normalized.
3. `components/plansparency/PlanDashboard.tsx`, the "When Can You Start?" tile (`id: "eligContrib"`):
   - give the tile's element `id="when-can-you-start"`;
   - add match eligibility under the existing text: EN "Employer money starts: {requirement}" plus "(entry: {entryDates})" when present; `immediateMatch === true` → "Employer money starts right away."; nothing extracted → "Employer money: see your plan document." ES equivalents.
4. `components/PlansparencyApp.tsx`: add `openEligibility()` that sets the main tab to `"dashboard"`, the plan guide tab to `"guide"`, expands the section that holds `eligContrib` if it is collapsed (read how `collapsedSections` works in `PlanDashboard.tsx`; lift or expose what you need, smallest change), then scrolls `#when-can-you-start` into view after render (`requestAnimationFrame` or a short `setTimeout`). Pass it to `CalcPanel` as `onOpenEligibility` (used in STEP 6).
5. Checks → `git add lib/i18n/index.ts lib/plan/plandata.ts components/plansparency/PlanDashboard.tsx components/PlansparencyApp.tsx` → commit `feat(plan): read before-tax option, show match eligibility, link target for calculator` → push.

---

## STEP 5 — Calculator math in one pure, tested function

**Do:**
1. `lib/plan/calc.ts`: keep `safeHarborAmount`. Add `calculatorResult(input)` (typed, pure). Input: `salary, pct, payPeriods, ageAtYearEnd (number|null), priorPlanAmount (number, 0 if box unchecked), plan: { safeHarborType, hasDiscretionaryMatch, hasRoth (boolean|null), hasPreTax (boolean|null), planAllowsCatchUp (boolean|null) }, year`.
   Rules (exactly):
   - limits from `getIRSLimitsForAge`. `band` = `"60-63"` | `"50+"` | null. Catch-up only if `planAllowsCatchUp !== false`.
   - `overRothLine = salary > rothCatchUpWageThreshold` (only when the threshold is not null). This is an ESTIMATE from this year's pay; the real test is last year's W-2 Box 3 from this employer. The UI must say "likely".
   - `rothBlocked = catchUpRaw > 0 && overRothLine && hasRoth === false` → catch-up is 0.
   - `limit = deferral + catchUp`; `priorUsed = min(priorPlanAmount, limit)`; `priorOver = priorPlanAmount > limit`; `room = limit - priorUsed`.
   - `wanted = salary * pct / 100`; `you = min(wanted, room)`; `perPaycheck = room > 0 ? wanted / payPeriods : 0`; `hitsLimit = wanted > room && room > 0`; `hitAtPaycheck = hitsLimit ? max(1, ceil(room / (wanted / payPeriods))) : null`; `pctToMax = salary > 0 ? ceil(room / salary * 100) : null`.
   - employer: `payForEmployer = min(salary, compLimit)`; `effectivePct = wanted > 0 ? pct * (you / wanted) : 0`; `employer = safeHarborAmount(type, payForEmployer, effectivePct)` (nonelective ignores pct, as today). Discretionary match is never calculated.
   - `total = you + employer`; `overTotalLimit = you - catchUpUsed + employer > totalAdditions` where `catchUpUsed = max(0, you - deferral)`.
   - tax-type matrix: `regular: { traditional: hasPreTax !== false, roth: hasRoth === true }`, `catchUp` (only when `catchUpRaw > 0`): available = `!rothBlocked`; `traditional = available && hasPreTax !== false && !overRothLine`; `roth = available && hasRoth === true`. Also return `hasPreTaxUnknown = hasPreTax === null`.
   - Return every value above plus `limits` and `band`.
2. Create `scripts/check-calc.ts` using `node:assert`. Cases (salary, pct, pay periods 26, safe harbor basic_match, hasRoth true, hasPreTax true unless stated):
   - age 34, $62,000, 6% → limit 24500, you 3720, employer 2480, total 6200, perPaycheck ≈ 143.08, hitsLimit false
   - age 65, $110,000, 6% → limit 32500 (band "50+"), you 6600
   - age 61, $110,000 → limit 35750 (band "60-63", catch-up 11250 not 8000+11250)
   - age 52, $180,000, hasRoth false → rothBlocked true, limit 24500, catchUp row not available
   - age 65, $110,000, 6%, prior 10000 → room 22500
   - age 65, $110,000, 20%, prior 30000 → room 2500, hitsLimit true, hitAtPaycheck 3
   - age 65, $110,000, prior 40000 → room 0, priorOver true, you 0, employer 0 for basic_match
   - nonelective plan, room 0 → employer still 3% of pay
   - age 55, hasPreTax false, hasRoth true → regular.traditional false, catchUp.traditional false
   Run `npx --yes tsx scripts/check-calc.ts`; it must print "all calculator checks passed".
3. Checks → `git add lib/plan/calc.ts scripts/check-calc.ts` → commit `feat(calc): one tested function for the redesigned calculator` → push.

---

## STEP 6 — Rebuild the calculator screen (#19, #21 h)

**Do:** rewrite `components/plansparency/CalcPanel.tsx` (keep `// @ts-nocheck` + `'use client';`) on top of `calculatorResult`. Remove the old header/expanded mode (`asTab` is always true now; the only caller passes `asTab={true}`), and update the call in `PlansparencyApp.tsx` (drop `expanded`/`setExpanded`, pass `onOpenEligibility`). Remove the `calcExpanded` state in `PlansparencyApp.tsx` if nothing else uses it. No plan loaded → keep today's "upload a plan" empty state.

**Layout.** Measure the panel's own width (ResizeObserver on the root). Under 880px: one column in this order. 880px or wider: two columns, LEFT = cards 1–2, RIGHT = cards 3–5 + footer. Max content width 1120px, centered. Cards: `C.surface`, 1px `C.border`, radius 14, padding 20, 16px gaps. No text smaller than 11px anywhere in this file; body text 13–15px. Tap targets at least 44px tall. Numbers use `font-variant-numeric: tabular-nums`. Headings and big numbers in `F.display`.

Header row: "Savings calculator" (`F.display`, 26px) and, right side, "{year} IRS limits" (12px, `C.textDim`). If `isFallback`, the existing fallback notice under it.

1. **"Start with you"** (heading `F.display` 20px):
   - "Your age on Dec 31, {year}", number input, 18–100, empty by default. Helper: "Only used to check catch-up limits. We don't need your birthday."
   - "Your yearly pay, before taxes", $ input, default 50000.
   - "How often you're paid": 4 buttons (Every week 52 / Every 2 weeks 26 / Twice a month 24 / Once a month 12), 2×2 grid under 880px, one row of 4 when wide. Selected: `C.accentSoft` fill, 2px `C.accent` border; others white with 1px `C.inputBorder`. Default 26. `aria-pressed`.
   - Inputs: white, 1px `C.inputBorder`, radius 8, height 48, 16px text.
2. **"Your {year} limit"**: big number = `limit` (`F.display` 40px). Then three rows (label + small grey sub-label on the left, status chip + amount on the right):
   - Regular limit / "Everyone" / {deferral}
   - Catch-up / "Age 50 or older by Dec 31" / chip "Applies" (green) · "Replaced" (grey, when band 60–63) · "Not yet" (grey) · "Blocked" (red, rothBlocked) / +{catchUp50}, struck through and grey when it doesn't apply
   - Super catch-up / "Ages 60 to 63 by Dec 31, instead of the regular catch-up" / chip "Applies" · "Not your age" · "Blocked" / +{catchUp6063}, same styling rule
   - No age entered: sub-line "Enter your age to check catch-up limits." Age under 50: "Catch-up savings start the year you turn 50."
   - **"How your money can go in"**: a table, columns "Traditional (before-tax)" and "Roth (after-tax)", rows "Regular {deferral}" and (only when `catchUpRaw > 0`) "Catch-up {catchUpRaw}". Cells "✓ Yes" (C.green) or "✕ Not offered" / "✕ Roth only" / "✕ Not available" (C.danger). Build each row as its own grid so conditional rows can't break the columns. The words "Traditional" and "Roth" in the header are buttons styled as dotted-underline links (`C.accentText`); tapping opens a dark bubble (`C.text` background, `C.surface` text, radius 12, small arrow pointing at that column, close ✕ button with `aria-label`) showing `getTerm('traditional'|'roth', lang).def`. Tap again or ✕ to close; the other word switches it. Bubble must not be clipped by a parent with `overflow: hidden`. `hasPreTaxUnknown` → Traditional cells show "✓ Likely" and a note "Your plan document didn't say. Most plans offer before-tax."
     Note line under the table: both offered → "Your plan offers both. You can split your regular savings between them however you like." Roth only / before-tax only → say which. Then, if catch-up applies: rothBlocked → "Catch-up isn't available to you here (see the Roth rule below)."; overRothLine → "Based on your pay, your catch-up likely has to go in as Roth."; both offered → "Your catch-up can go either way."
   - **Roth catch-up rule box** (only when `band` is set): title "New in {year}: the Roth catch-up rule". Green background (`C.greenSoft`) when not over the line: "Based on the pay you entered ({salary}), this likely doesn't apply to you. It only applies if you earned more than {threshold} here last year. Your catch-up can go in before-tax or Roth, whichever your plan offers." Orange (`C.warningDim`) when over and plan has Roth: "...this likely applies to you. If you earned more than {threshold} here last year, your {catchUp} catch-up has to go in as Roth. You pay tax on it now, and qualified withdrawals later can be tax-free. Your regular {deferral} isn't affected." Red (`C.dangerSoft`) when rothBlocked: "...this likely applies to you, and this plan has no Roth option. That means you likely can't make catch-up contributions here in {year}, so your limit stays {deferral}. Ask HR if a Roth option is coming." Always add, small: "The rule looks at what you earned from this employer last year (Box 3 of your W-2), not this year's pay. New to this job? It doesn't apply to you yet."
   - **Prior-plan checkbox** at the bottom: "I'm new to this job and already saved in another employer's 401(k) or 403(b) earlier in {year}." Checked → reveal "How much did you put in at your other job in {year}?" ($ input) with helper "Only money taken out of your paychecks there, before-tax and Roth. Don't count what that employer added. Your last pay stub or that plan's website will show it." Then rows "Already used at your other job −{priorUsed}" and "Left to save here in {year} {room}". `priorOver` → red note: "That's more than your {year} limit. Money over the limit has to be returned to you, usually by April 15, {year+1}, or it gets taxed twice. Tell HR or your old plan soon."
3. **"How much of your pay you save"**: − button, big % (`F.display` 40px, `C.accentText`), + button (44×44, `aria-label` "Save 1% less"/"Save 1% more"), range slider 0–30 step 1 (`accent-color: C.accent`), default 6. Hint: safe harbor match plan and pct < full-match point → "Your employer's guaranteed match stops growing at {X}%. You're at {pct}%." (X: basic_match 5, qaca 6, enhanced_match 4; not shown for nonelective); at or above → "You're getting the full guaranteed match (it tops out at {X}%)."; discretionary only → "Any extra match depends on your employer each year."; none → "This plan has no employer match." Under a divider: "Your limit used" with "{you} of {room}", a 10px bar (`C.accent`, turns `C.warning` when hitsLimit), and note: room 0 → "You've already used your whole {year} limit at your other job, so you can't save more here until January."; hitsLimit → "At {pct}%, you'd hit the limit on paycheck {n} of {payPeriods}. Saving stops for the rest of the year after that."; else → "You'd use {n}% of your limit. To max it out, you'd save about {pctToMax}% of your pay."
4. **Result**: label "Together, you and your employer would save" (safe harbor plans) or "You would save"; big number `total` (`F.display` 48px; 64px in two-column mode) + " a year". Two-color bar (you `C.accent`, employer `C.green`). Legend rows "From you {you}", "From your employer (guaranteed) {employer}" (safe harbor only). Discretionary plans: "Your employer may add more. That extra match isn't guaranteed, so it's not counted here." No employer money: "This plan doesn't show any money from your employer. Everything above comes from you." `overTotalLimit` → note using `getTerm('totalLimit')`.
   Then a highlighted row (`C.accentSoft`): "Your part, from each paycheck" + `perPaycheck` (dollars and cents, `C.accentText`). hitsLimit → "Only until paycheck {n} of {payPeriods}, when you reach your limit. After that, nothing comes out of your pay for the rest of {year}."
   Then small bullet notes: (always) "These amounts assume you save for all of {year}. Starting partway through the year, or changing your rate, changes the totals."; (safe harbor) "When your employer adds its money (each paycheck, each quarter or once a year) is up to your employer."; (any employer money) "Some plans make you wait before employer money starts, for example until you've worked there a year." + link-styled button "Check when you qualify in your Plan Guide" → `onOpenEligibility()`.
5. **"Good to know about your plan"**: tap-to-open rows (min 52px, chip + caret, `aria-expanded`), one open at a time:
   - safe harbor: "Guaranteed employer money", chip "Guaranteed" (green); body = plan's formula in plain words (reuse the existing `shLabels` wording per type) + "It's yours right away (100% vested), even if you leave before year-end."
   - discretionary: "Extra employer match", chip "Not guaranteed" (orange) + `getTerm('discretionaryMatch')`; if `lastDayProvision` → add "To get it, you usually have to still work there on the last day of the plan year."
   - no employer money: "Employer money", chip "None".
   - salary > compLimit: "Pay limit for employer money", chip {compLimit} + `getTerm('payLimit')`.
   - NOT a safe harbor plan and salary > hceThreshold: "Highly compensated employee", chip "May apply" + `getTerm('hce')`.
   (Catch-up and Roth rows are NOT repeated here; they live in card 2.)
Footer: "For education only, not advice. These are estimates. Your plan administrator or HR has the final numbers." (12px, `C.textDim`).

**Also:**
- i18n: add the new strings (EN + ES) under a `calc2` prefix or similar; then delete every old `calc*` key that no longer has a reader (search each before deleting; `calcSessionEndedIdle` and any key used outside `CalcPanel.tsx` stay).
- `theme.ts`: delete the `calc*` colors once nothing reads them (search first).
- `lib/plan/irs.ts`: delete `getIRSLimits(dob)` if nothing reads it anymore; delete `rothCatchUpStatus` and `contributionSummary` from `calc.ts` if nothing reads them.
- Every color comes from `C`. No hex values typed into `CalcPanel.tsx`.
- Checks (plus `npx --yes tsx scripts/check-calc.ts` again) → `git add components/plansparency/CalcPanel.tsx components/PlansparencyApp.tsx components/plansparency/theme.ts lib/i18n/index.ts lib/plan/irs.ts lib/plan/calc.ts` → commit `feat(calc): redesigned calculator, you first, limit, slider, result` → push.

---

## STEP 7 — Docs
**Do:** stage any modified Cowork docs (`OPEN-ITEMS.md`, `MEMORY.md`, `ERRORS.md`, `CONTEXT.md`, `CLAUDE.md`, `PHASE PROMPTS/`). In THIS file set **Status:** Done with each step's commit hash and today's date. Commit `docs: phase 07 calculator redesign complete` → push.
**Final report:** all 7 commit hashes; every new Spanish string (for review); anything you could not do exactly as written and why; any bug noticed but not fixed.

---

## Ross checks (end of phase, one pass)
On `/try` (logged in), upload a test SPD, then:
- **Calculator:** type age 65 and pay 110,000 → limit shows $32,500, catch-up "Applies", super catch-up crossed out. Age 61 → $35,750. Age 40 → $24,500 and "Catch-up savings start the year you turn 50."
- Pay 180,000 at age 52 → Roth box turns orange, table shows catch-up "✕ Roth only" under Traditional.
- Tap "Traditional" and "Roth" → bubbles open with the same wording as those words in **Key Terms**.
- Tick the new-job box, enter 30,000 at 20% → "Left to save here" $2,500 and the paycheck-3 note.
- "Check when you qualify in your Plan Guide" jumps to "When Can You Start?" and shows when employer money starts.
- Resize the browser: wide = two columns, narrow/phone = one column in order.
- Switch to ES and repeat one screen.
- **Key Terms:** limits show 2026 numbers ($24,500, $8,000, $11,250). No "good choice if".
- Fonts: headings now in the serif (Cormorant Garamond) on a computer that never installed it.
