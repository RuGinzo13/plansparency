# PHASE 08 — Calculator follow-ups and bug fixes
**Created:** Sept 30, 2026 in Cowork
**Run:** `Read "PHASE PROMPTS/PHASE-08-calculator-followups.md" and execute all steps in order.` Unattended. 5 steps, 5 commits, each pushed. No checkpoints.
**Open items covered:** #25 privacy-screen Cancel crash, #26 advisor page's second copy of the plan-reading instructions, #23 items 1, 2, 3, 4, 7 (paychecks left for people who started this year, exact Roth rule from W-2 Box 3, hover on web, year-end true-up note, 10px chips).
**Not in this phase (Ross tasks):** #23 item 5/8 (native-speaker review of the Spanish), item 6 (confirm the two-column switch on real screens).
**Status:** Done, Oct 3, 2026
- STEP 1 (`ce1b17a`) — privacy screen Cancel fixed; calculator chips 11px
- STEP 2 (`7666219`) — advisor page uses the shared plan-reading instructions
- STEP 3 (`be19a30`) — math: started this year, exact Roth rule, true-up flag
- STEP 4 (`3131d0f`) — calculator screen for Step 3, hover bubbles, true-up note
- STEP 5 (docs, this commit) — Cowork docs updated

---

## Rules for Claude Code (every step)
Same rules as PHASE-07 (read its "Rules for Claude Code" section once at the start). In short: repo root, allowlisted commands only, no `cd x && git`, no `$(...)`, stage only named files, education never advice, plain words, no em dashes in user-facing copy, every new string in English AND Spanish, `lib/` files type-check with no `@ts-nocheck`, missing-name check on every `@ts-nocheck` file you edit, then `npx tsc --noEmit`, `npm run build`, and (from Step 3 on) `npx --yes tsx scripts/check-calc.ts` must pass. Never `git reset`, `git clean`, `git stash`, or force-push. If a check fails and you can't fix it inside the named files, STOP and report.

---

## STEP 1 — Bug fixes (#25, #23.7)

**Check the ground:** `git status` shows only modified Cowork docs (`OPEN-ITEMS.md`) and this new file. Latest commit `fd1e02f` or later. Anything else → STOP and report.

**Do:**
1. `components/PlansparencyApp.tsx`: the privacy screen's Cancel button sets `pendingFileRef.current = null`, but that ref was renamed to `pendingFilesRef` (an array). Clicking Cancel throws and shows the error screen. Change it to `pendingFilesRef.current = []`. Then search the whole repo for `pendingFileRef` (singular); there must be zero left.
2. `components/plansparency/CalcPanel.tsx`: the three status chips use `fontSize: 10`. Make them 11. Search the file for any other `fontSize` under 11 and raise those to 11 too.
3. Checks → `git add components/PlansparencyApp.tsx components/plansparency/CalcPanel.tsx` → commit `fix: privacy screen Cancel no longer crashes; calculator chips 11px` → push.

---

## STEP 2 — One copy of the plan-reading instructions (#26)

**Why:** `app/advisor/page.tsx` has its own `FIRST_MSG` with its own PLANDATA field list. PHASE-07 updated the main copy in `lib/i18n/index.ts` (`firstMessage`, EN and ES) but not this one, so advisor uploads never read `hasPreTax`. Two copies will keep drifting.

**Do:**
1. Compare `FIRST_MSG` in `app/advisor/page.tsx` with `i18n.en.firstMessage` in `lib/i18n/index.ts`. List every difference in your report.
2. If the advisor copy asks for any field or rule the i18n copy lacks, add it to `i18n.en.firstMessage` AND `i18n.es.firstMessage` (same field names; Spanish wording to match).
3. Replace `FIRST_MSG` in `app/advisor/page.tsx` with `i18n.en.firstMessage` (import `i18n` from `@/lib/i18n`, the same way other files do). Delete the old constant.
4. Checks → `git add app/advisor/page.tsx lib/i18n/index.ts` → commit `fix(advisor): use the shared plan-reading instructions` → push.

---

## STEP 3 — Math: started this year, exact Roth rule, true-up flag (#23.1, #23.2, #23.4)

**Do:** extend `calculatorResult` in `lib/plan/calc.ts` (keep everything that exists working the same when the new inputs are left at their defaults).

New inputs:
- `startedThisYear: boolean` (default false)
- `paychecksLeft: number` (default = `payPeriods`; clamp to 1..payPeriods; ignored unless `startedThisYear`)
- `lastYearBox3: number | null` (default null; W-2 Box 3 wages from THIS employer last year)
- `priorPlanAmount` stays as is (only used when `startedThisYear`; the UI will send 0 otherwise)

Rules:
- `share = startedThisYear ? paychecksLeft / payPeriods : 1`.
- `perPaycheck = salary * pct / 100 / payPeriods` (unchanged meaning: what comes out of each check).
- `wanted = perPaycheck * (startedThisYear ? paychecksLeft : payPeriods)`.
- `payThisYear = salary * share`. `payForEmployer = min(payThisYear, compLimit)`. Employer money uses `payForEmployer` (nonelective = 3% of it; match types use `effectivePct` as today).
- `hitAtPaycheck` counts within the paychecks left: `ceil(room / perPaycheck)`; return `paychecksCounted` (= paychecksLeft or payPeriods) so the UI can say "paycheck 3 of 13".
- `pctToMax = payThisYear > 0 ? ceil(room / payThisYear * 100) : null`.
- Roth catch-up rule, decided in this order, returned as `rothBasis`:
  1. `lastYearBox3 !== null` → `overRothLine = lastYearBox3 > threshold`, `rothBasis = "box3"` (exact).
  2. else `startedThisYear` → `overRothLine = false`, `rothBasis = "newHire"` (no wages from this employer last year, so the rule can't apply).
  3. else → estimate from `salary` as today, `rothBasis = "estimate"`.
- `trueUpRelevant = hitsLimit && (safeHarborType is basic_match | enhanced_match | qaca, or the plan has a discretionary match)`.

Add to `scripts/check-calc.ts` (keep all existing cases passing):
- started this year, 13 of 26 paychecks left, $110,000, 6%, age 34, basic_match → wanted 3300, perPaycheck ≈ 253.85, employer 2200 (4% of 55,000), paychecksCounted 13
- started this year, 13 of 26 left, $200,000, 30%, age 34 → wanted 30,000 capped, hitsLimit true, hitAtPaycheck 11, paychecksCounted 13
- age 55, salary $140,000, lastYearBox3 180,000, plan hasRoth true → overRothLine true, rothBasis "box3"
- age 55, salary $200,000, startedThisYear true → overRothLine false, rothBasis "newHire"
- age 55, salary $200,000, nothing else → rothBasis "estimate", overRothLine true
- $62,000 at 30%, basic_match, not started this year → hitsLimit false (18,600 under 24,500) → trueUpRelevant false; $110,000 at 30% age 34 → trueUpRelevant true
Checks → `git add lib/plan/calc.ts scripts/check-calc.ts` → commit `feat(calc): partial-year paychecks, exact Roth rule from W-2 Box 3, true-up flag` → push.

---

## STEP 4 — Calculator screen for Step 3 + hover on web (#23.1–4)

**Do** in `components/plansparency/CalcPanel.tsx` (plus i18n and glossary):
1. **Replace the prior-plan checkbox** at the bottom of the limit card with: checkbox "I started this job in {year}." Checked → reveal, indented:
   - "How many paychecks do you have left at this job in {year}?" number input, 1 to {payPeriods}, default {payPeriods}. Helper: "Count your next paycheck. Your pay stub or HR can tell you."
   - "Did you save in another employer's 401(k) or 403(b) earlier in {year}?" two buttons Yes / No (default No, 44px tall, `aria-pressed`). Yes → the existing amount input, helper text, "Already used" / "Left to save here" rows and over-limit warning, unchanged.
   Unchecked → send `startedThisYear: false`, `priorPlanAmount: 0`.
2. **Wherever the screen says "of {payPeriods}"** for the limit paycheck, use `paychecksCounted`.
3. **Full-year note** in the result card: `startedThisYear` → "These amounts cover the {n} paychecks you have left at this job in {year}. Changing your rate changes the totals." Otherwise keep today's text.
4. **Roth catch-up rule box** by `rothBasis`:
   - `box3`: drop "likely". Over → "Your W-2 shows more than {threshold} from this employer last year, so your {catchUp} catch-up has to go in as Roth..." (rest as today). Not over → "Your W-2 shows {threshold} or less from this employer last year, so the rule doesn't apply to you..." Blocked (over + no Roth in plan) → same as today without "likely".
   - `newHire`: green box: "You started this job in {year}, so you had no wages here last year. The rule doesn't apply to you this year. Your catch-up can go in before-tax or Roth, whichever your plan offers."
   - `estimate`: today's text, then add an optional input under it: label "Know last year's W-2 Box 3 amount from this job? Enter it for an exact answer." ($ input, empty by default). Clearing it goes back to the estimate. Hide this input when `startedThisYear`.
   - The Traditional/Roth table note and cells follow the same basis (no "likely" when basis is box3 or newHire).
5. **Hover on web:** on devices with a mouse (`window.matchMedia('(hover: hover)').matches`), the Traditional/Roth bubbles also open on mouse-enter and close on mouse-leave. A click pins it open until ✕ or a second click. Touch devices unchanged. Keyboard: bubble opens on focus of the word, closes on Escape.
6. **"Good to know" row** when `trueUpRelevant`: title "Year-end true-up", chip "Ask HR" (orange), body from a new glossary entry `trueUp`: EN "If you reach the yearly limit before December, money stops coming out of your paychecks, and a match paid per paycheck can stop too. Some plans make up the missing match at year-end (a 'true-up'). Others don't. This calculator assumes no true-up." Add `trueUp` to `lib/glossary.ts` (EN + ES) so Key Terms shows it too.
7. i18n: new strings EN + ES; delete any key that no longer has a reader (search first).
8. Checks (all four) → `git add components/plansparency/CalcPanel.tsx lib/i18n/index.ts lib/glossary.ts` → commit `feat(calc): started-this-year flow, exact Roth rule, hover bubbles, true-up note` → push.

---

## STEP 5 — Docs
**Do:** stage modified Cowork docs (`OPEN-ITEMS.md`, `MEMORY.md`, `ERRORS.md`, `CONTEXT.md`, `CLAUDE.md`, `PHASE PROMPTS/`). In this file set **Status:** Done with each step's commit hash and date. Commit `docs: phase 08 calculator follow-ups complete` → push.
**Final report:** 5 commit hashes; the FIRST_MSG differences found in Step 2; every new Spanish string; anything not done exactly as written and why.

---

## Ross checks (end of phase)
- `/try`: pick a file, reach the privacy screen, tap **Cancel** → back to the start screen, no error screen.
- Calculator, age 34, $110,000, 6%: tick "I started this job in 2026", paychecks left 13 → totals roughly half; paycheck line unchanged; note says "the 13 paychecks you have left". Change pay to $200,000 and 30% → the limit note says "paycheck 11 of 13".
- Age 55, $140,000: type 180,000 in the Box 3 box → Roth box turns orange with no "likely". Tick "started this year" → Box 3 input disappears and the box turns green ("no wages here last year").
- On a computer, hover over "Traditional" and "Roth" → bubbles open and close; click pins one open.
- $110,000 at 30% on a safe harbor match plan → "Year-end true-up" row appears; Key Terms has "True-up".
- `/advisor` (password): upload a test SPD → the plan's calculator shows Traditional as ✓ Yes (not "Likely") when the document says so.
