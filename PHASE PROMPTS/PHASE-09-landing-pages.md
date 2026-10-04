# PHASE 09 — New participant landing page, `/` becomes the front door, advisor upload restyle + review step
**Created:** Oct 4, 2026 in Cowork
**Run (Auto mode, walk away):** `Read "PHASE PROMPTS/PHASE-09-landing-pages.md" and execute all steps in order.` 6 steps, 6 commits, each pushed. No checkpoints (nothing deleted, no database schema change).
**Open items covered:** #29 landing redesign + its own file, #30 untrue privacy line, #28 commit `.claude/settings.json`, #32 (advisor accuracy pop-up + review screen part only).
**Design source of truth:** Design canvas "Landing Redesign" in Ross's claude.ai artifacts, boards "Landing, phone", "Landing, web" and "Advisor, web" (Oct 4 versions). Everything needed is written out below; Claude Code cannot open the canvas.
**Not in this phase (blocked by the 🔴 security section in OPEN-ITEMS, #31/#33/#34):** advisor sign-in / create account / advisor home, the invite-link page for employees, employer approval, turning plan codes on, stopping PDF storage. Do not build any of those.
**Status:** Done, Oct 4, 2026
- STEP 1 (`6f1a8e4`) — start screens in their own file; auto mode settings committed
- STEP 2 (`0e7a2c7`) — one-screen start page with plain-English example
- STEP 3 (`1fbb2eb`) — `/` is the front door, `/try` redirects
- STEP 4 (`a6c7495`) — advisor upload page in the brand look
- STEP 5 (`27b6990`) — accuracy pop-up and review step before saving
- STEP 6 (docs, this commit) — Cowork docs updated

---

## Rules for Claude Code (every step)
Same rules as PHASE-07 (read its "Rules for Claude Code" once at the start). In short: Auto mode, repo root, prefer allow-list command forms, never anything on the deny list, no `cd x && git`, no `$(...)`, stage only named files, education never advice, plain words, no em dashes in user-facing copy, every new string in English AND Spanish, every color from `C` and every font from `F` in `components/plansparency/theme.ts` (no hex values typed into components), no text under 11px, tap targets at least 44px, `lib/` type-checks with no `@ts-nocheck`, missing-name check on every `@ts-nocheck` file you edit, then `npx tsc --noEmit`, `npm run build`, `npx --yes tsx scripts/check-calc.ts`. Never `git reset`, `git clean`, `git stash`, or force-push. If a check fails and you can't fix it inside the named files, STOP and report.

---

## STEP 1 — Housekeeping + move the start screens into their own file (no visible change)

**Check the ground:** `git status` shows only: `.claude/settings.json` (modified: `defaultMode` is now `auto`, Cowork changed it Oct 3), modified Cowork docs (`*.md` in repo root), and this file. Latest commit `126a6e5` or later. Anything else → STOP.

**Do:**
1. In `components/PlansparencyApp.tsx`, the screens rendered for `stage === "chooser"` and `stage === "landing"` move, unchanged, into a new `components/plansparency/Landing.tsx` (`// @ts-nocheck` + `'use client';` like the other panels). Export `Landing`. It receives everything it uses as props (language, `setLang`, `docType`, `setDocType`, staged files and their setters, `fileInputRef`, `stageFile`, `handleDrop`, `dragOver`/`setDragOver`, `uploadError`, `proceedToPrivacy`, `setStage`, `t`, plus any other value the moved code reads). Cut and paste only; no wording, layout or logic changes.
2. `PlansparencyApp.tsx` renders `<Landing … />` for those two stages.
3. Checks → `git add .claude/settings.json components/plansparency/Landing.tsx components/PlansparencyApp.tsx` → commit `refactor(landing): start screens in their own file; auto mode settings` → push.

---

## STEP 2 — Redesign the participant start screen (#29, #30)

**Do** in `components/plansparency/Landing.tsx` (plus `lib/i18n/index.ts` and `theme.ts` only if a token is truly missing):
1. **One screen instead of two.** Render the same new screen for both `chooser` and `landing` stages. Remove the faint grid background, the blurred glow, the navy drop-zone background, the gold-to-green gradient headline and the emoji trust row.
2. **Layout.** Measure the component's own width (ResizeObserver). Under 900px: one column. 900px+: two columns, max width 1120px, centered: LEFT = headline, subtitle, two document cards, staged-files area, plan-code box; RIGHT = example card + 1-2-3 strip. Footer row full width.
3. **Header:** logo (existing `Logo`), then on the right a "For advisors" text link to `/advisor` and the existing EN/ES toggle.
4. **Headline:** "Your 401(k)," + new line in italic `C.accentText`: "crystal clear." (`F.display`, 44px phone, up to 76px wide). Subtitle (16–18px, `C.textMuted`): "Upload your plan document or a statement. Get answers in plain words, in minutes."
5. **Two document cards** (real `<button>`s, `C.surface`, 2px `C.border`, radius 16, padding 22, side by side when wide, stacked on phone):
   - "My plan's rules" / "Plan document, SPD or enrollment booklet" / "How your match, vesting and limits work" / "Choose a PDF →" (`C.accentText`; on wide screens add " or drop it here"). Icon: document, on `C.accentSoft`.
   - "My account" / "Quarterly or annual statement" / "Where your money stands today" / "Choose a PDF →" (`C.green`). Icon: chart, on `C.greenSoft`.
   Tapping a card sets `docType` ("spd" / "statement") and opens the file picker right away (`fileInputRef.current?.click()`). Dropping a file on a card does the same plus stages the file. Selected card: 2px `C.accent` border + soft shadow; the other card dims to 55% opacity.
6. **Staged files** (only when at least one file is staged): file rows (name, size, remove ×), then for plans only "+ Add another document" / "Fee disclosure or investment guide" (dashed `C.inputBorder`), then the primary button (existing gradient style, 52px tall): "Explain my plan →" or "Explain my statement →" (Spanish: "Explicar mi plan →" / "Explicar mi estado de cuenta →"), calling the existing `proceedToPrivacy`. Under it a text button "Start over" that clears staged files and `docType`. Keep `uploadError` display.
7. **Plan-code box** (`C.surfaceAlt` panel): label "Did your employer or advisor set up your plan here?", helper "Enter the plan code from your enrollment materials or plan mailing. No upload needed.", input + "Open my plan" button, checkbox "Remember this plan on this device" (off by default). **Hidden for now:** wrap it in `const PLAN_CODES_ENABLED = false;` at the top of the file with a comment: `// Turns on when invite links are allowed (OPEN-ITEMS 🔴 security section, #31/#34). Until then the box is not shown.` Build the markup and strings so turning it on later is a one-line change; the button does nothing yet.
8. **Example card** (right column on wide screens, below the cards on phone): top half `C.surfaceAlt`, small uppercase label "From a typical plan document", quote in Georgia serif 13–14px `C.textMuted`: "Elective deferrals for any taxable year shall not exceed the limitation under Code Section 402(g), as adjusted for cost-of-living increases." Bottom half `C.text` background with `C.surface` text, small uppercase label "In plain English", then (`F.display`, 22–30px) "You can save up to {deferral} from your paychecks in {year}." with `{deferral}` and `{year}` filled from `IRS_LIMITS` / `getLimitYear()` (never typed). Spanish label "De un documento de plan típico" / "En palabras simples"; the legal quote stays in English in both languages.
9. **1-2-3 strip:** three numbered circles (1px `C.accent`, number in `C.accentText`): "Upload" / "We read it" / "You ask anything" (ES: "Subes" / "Lo leemos" / "Preguntas lo que quieras").
10. **Trust row + footer** (top border `C.borderLight`, inline stroke SVG icons, no emoji): "Plansparency doesn't save your document." (#30 interim wording, replaces "Document never stored"; ES: "Plansparency no guarda tu documento.") · "Education only, never advice" · "Plain-English answers". Then the existing `footerDisclaimer`, 12px `C.textDim`.
11. i18n: add new keys (EN + ES); delete keys that lose their last reader (search first: `chooserSub`, `chooserSpd`, `chooserSpdSub`, `chooserStmt`, `chooserStmtSub`, `trustPrivate`, `trustEncrypted`, `dropTitle`, `dropSub`, `heroLine1`, `tagline`, `subtitle` are candidates; keep any key still read elsewhere).
12. Checks → `git add components/plansparency/Landing.tsx lib/i18n/index.ts components/plansparency/theme.ts` → commit `feat(landing): one-screen start page with plain-English example` → push.

---

## STEP 3 — `/` is the front door; `/try` points to it

**Do:**
1. `app/page.tsx`: replace the placeholder (navy title, "Try it free", "For Advisors") with the same thing `/try` renders today: `<PlansparencyApp mode="version-a" />`.
2. `app/try/page.tsx`: send visitors to `/` (`redirect('/')` from `next/navigation`), so old links keep working.
3. Search the repo for links to `/try` (`href="/try"`, `'/try'`) and point them to `/`.
4. Do not touch `middleware.ts` (the whole site stays behind the password until OBA approval).
5. Checks → `git add app/page.tsx app/try/page.tsx` plus any file changed in item 3 → commit `feat(routes): new landing page at /, /try redirects` → push.

---

## STEP 4 — Advisor upload page in the brand look

**Do** in `app/advisor/page.tsx` only:
1. Remove the local navy `C`/`F` constants; import `C`, `F`, `btnBase` from `components/plansparency/theme.ts` and `Logo` from `components/plansparency/ui.tsx` (add `'use client'`-safe imports only).
2. Header: `Logo` + a small pill "For advisors". Upload view: two columns when wide (left: headline "Set up a plan once." + italic `C.accentText` line "Every employee gets it clear.", one paragraph "Upload the plan document. We pull out the match, vesting, eligibility and limits. You check every detail, then share one link with the employees.", and a 1-2-3 list "Upload / You review every detail / Share one link"; right: employer name field (48px, white, 1px `C.inputBorder`), upload drop box (dashed, inline upload SVG, no emoji), helper "SPD or plan document, PDF").
3. Keep every behavior exactly as is (upload, extraction, save, plan list, copy link). Plans list ("Your Plans") gets the same cards/colors as the rest of the app. No new features in this step.
4. Checks → `git add app/advisor/page.tsx` → commit `style(advisor): brand look for the advisor upload page` → push.

---

## STEP 5 — Accuracy pop-up + review screen before an advisor plan is saved (#32, part)

**Why:** the AI can misread a plan; employees will see what the advisor approves, under the advisor's name.

**Do** in `app/advisor/page.tsx` (plus i18n is NOT needed: the advisor page is English-only for now):
1. After extraction succeeds and BEFORE `/api/save-plan` is called, stop and show:
   - **Pop-up** (real dialog: `role="dialog"`, `aria-modal`, focus moves into it, warning icon on `C.warningDim`): title "Check every detail before you share"; text "We read plan documents with AI, and it can get things wrong. Employees will see exactly what you approve, under your name."; bullets "Compare each item to the plan document." / "Fix anything that's wrong or missing." / "The plan can't be saved or shared until every item is checked."; button "I'll review every item".
   - **Review screen:** title = plan name; progress pill "N of M checked"; warning strip (`C.warningDim`) repeating the first sentence. One row per item, in plain words, each with **Edit** and **Mark checked** (checked = `C.greenSoft`/`C.green`, editing un-checks it):
     1. Guaranteed employer money: `safeHarbor.type` (select: none / nonelective 3% / basic match / enhanced match / QACA) + `formula` text
     2. Extra (discretionary) match: `noMatch` (Yes/No/Not stated) + `matchTiers` rows (pct, upTo numbers; add/remove row)
     3. Must work on the last day of the year for extra employer money: `lastDayProvision` (Yes/No/Not stated)
     4. Profit sharing: `profitSharing.available` (Yes/No/Not stated) + `formula`
     5. Vesting: `vestingSchedule` text
     6. Who can join: `contribEligibility.requirement` + `entryDates` text
     7. When employer money starts: `matchEligibility.requirement` + `entryDates` text + `immediateMatch` (Yes/No/Not stated)
     8. Before-tax (Traditional): `hasPreTax` · 9. Roth: `hasRoth` · 10. Catch-up allowed: `planAllowsCatchUp` · 11. Loans: `loanAvailable` · 12. Hardship withdrawals: `hardshipAvailable` (all Yes/No/Not stated)
     "Not stated" saves `null`. Keep the same field names and types the app already uses (`lib/plan/plandata.ts`), so the calculator and dashboard keep working.
   - Bottom: text field "Your name" (required) + checkbox "I checked every item against the plan document and they're accurate. My name and today's date will be recorded." + button "Approve and save". Disabled (grey, `C.surfaceAlt`) until every row is checked, the name is filled and the box is ticked.
2. "Approve and save" sends the EDITED plan data to `/api/save-plan` exactly as today, with one addition inside the plan data object: `review: { reviewerName, reviewedAt: <ISO date>, editedFields: [<labels of rows that were edited>] }`. No database or API changes (it rides inside the existing `plandata_json`).
3. A "Cancel" on the review screen discards the extraction, deletes the uploaded file from Anthropic (existing `endSessionFiles`), and returns to the upload view. The existing `finally` that deletes the file after saving must still run.
4. Checks → `git add app/advisor/page.tsx` → commit `feat(advisor): accuracy warning and review step before saving a plan` → push.

---

## STEP 6 — Docs
**Do:** stage modified Cowork docs (`OPEN-ITEMS.md`, `MEMORY.md`, `ERRORS.md`, `CONTEXT.md`, `CLAUDE.md`, `PHASE PROMPTS/`). In this file set **Status:** Done with each step's commit hash and date. Commit `docs: phase 09 landing pages complete` → push.
**Final report:** 6 commit hashes; every new Spanish string; i18n keys deleted; anything not done exactly as written and why.

---

## Ross checks (end of phase)
- Go to the site's home address (`/`): the new start page shows (not the old navy "Try it free" page). Typing `/try` lands on the same page.
- Phone and computer: two cards, example card with "$24,500 … 2026", 1-2-3 strip, one trust row with "Plansparency doesn't save your document." No plan-code box yet (it's switched off on purpose).
- Tap "My plan's rules" → file picker opens; pick a test SPD → file row + "Explain my plan →" → privacy screen → app works as before. Repeat with a statement.
- EN/ES toggle switches everything.
- "For advisors" → `/advisor` (password): new look; upload a test SPD → warning pop-up → review screen; change one item, check all, type your name, tick the box → saved; the plan's calculator/dashboard reflect your edit.
