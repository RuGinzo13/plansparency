# PHASE 15 — Advisor-only access (participants come in through their advisor; Ross keeps an upload preview)
**Created:** Oct 4, 2026 in Cowork
**Run (Auto mode, walk away):** `Read "PHASE PROMPTS/PHASE-15-advisor-only-access.md" and execute all steps in order.` 3 steps, 3 commits, each pushed. No checkpoints.
**Open items:** #50 (this). Related: #31, #34 (plan codes + advisor verification, still open), #49 (Your plan merge, next phase).
**Status:** Done, Oct 4, 2026 (STEP 1 `3b55640`, STEP 2 `fa277d3`)

## Why
Ross, Oct 4: participant access must depend on an advisor subscribing and setting up the plan. A participant uploading their own plan document gives the product away, is the most expensive session (~$1.03 vs ~$0.16, #37), skips the advisor's accuracy review, and is harder to clear with compliance (#1). Ross still needs to upload documents and see every participant screen to keep tuning the site, so the upload flow moves behind the advisor password instead of being deleted.

## What Cowork checked (`b41c3f0`)
- `app/page.tsx` renders `<PlansparencyApp mode="version-a" />`; the start screen is `components/plansparency/Landing.tsx` (upload tiles + a plan-code box that is built but hidden: `PLAN_CODES_ENABLED = false`, line 11; no backend behind it yet).
- `middleware.ts`: `/advisor/*` and `/api/save-plan` always need the advisor password; everything else is locked too until `SITE_PUBLIC=true`. So a page under `/advisor/` is private no matter what.
- `app/try/page.tsx` redirects to `/` (PHASE-09).

## Rules for Claude Code
Same rules as PHASE-07. Auto mode, repo root, stage only named files, no deny-list commands, never `git reset/clean/stash`, never force-push. Checks after each step: `npx tsc --noEmit`, `npm run build`, and all scripts in `scripts/` (`check-calc`, `check-answers`, `check-overview`, `check-terms`). Colors from `C`, fonts from `F`, EN + ES for new strings, no em/en dashes.

## STEP 1 — Ross's preview: the upload flow at `/advisor/preview`

**Check the ground:** `git status` clean except Cowork docs. Latest commit `b41c3f0`. Otherwise STOP.

1. `components/PlansparencyApp.tsx`: add a prop `allowUpload?: boolean` (default `false`) and pass it to `<Landing>`.
2. Create `app/advisor/preview/page.tsx` rendering `<PlansparencyApp mode="version-a" allowUpload />`. Same page shell as `app/page.tsx` (copy its metadata if any). Nothing else changes in the upload, review or answer flows: this page must behave exactly like today's `/`.
3. `app/advisor/page.tsx`: near the top of the advisor page add a text link (15px/700 `C.accentText`, minHeight 44) to `/advisor/preview`: "Preview the participant screens with any document →". (Advisor page is English only today; keep it that way.)
4. Checks → `git add components/PlansparencyApp.tsx app/advisor/preview/page.tsx app/advisor/page.tsx` → commit `feat(advisor): preview page with the participant upload flow` → push.

## STEP 2 — Participant start screen: no upload, plan code only

In `components/plansparency/Landing.tsx`:
1. When `allowUpload` is true: render exactly what renders today (no visual change).
2. When `allowUpload` is false (the public `/`): keep the header (logo, language toggle), the hero heading and subtext, the plain-English example and the footer/trust line. REMOVE the document tiles, drag-and-drop, staged-file list and the go button. In their place show the plan-code card, always (ignore `PLAN_CODES_ENABLED` for showing it), styled as the existing `CodeBox`:
   - While `PLAN_CODES_ENABLED` is false: the input and button are `disabled` (`opacity: .6`, `cursor: not-allowed`) and the help line reads "Plan codes open soon. Your employer or advisor will send you yours." / "Los códigos de plan llegan pronto. Tu empleador o asesor te enviará el tuyo." (new i18n key `landCodeSoon`). Hide the "Remember this plan" checkbox.
   - While true (future): today's `CodeBox` behavior.
   - Hero subtext for this mode: "Your employer or advisor set up your plan here. Enter the plan code from your enrollment materials." / "Tu empleador o asesor configuró tu plan aquí. Ingresa el código del plan de tus materiales de inscripción." (new key `landSubCode`).
3. A participant on `/` can no longer reach the privacy, upload or chooser stages. Make sure no button on that screen leads there (the "Cleared" screen's restart button returns to this same start screen).
4. Checks → `git add components/plansparency/Landing.tsx lib/i18n/index.ts` → commit `feat(landing): participants enter by plan code; upload moved to the advisor preview` → push.

## STEP 3 — Self-check, then docs
1. Fill in with file + line: [ ] `/advisor/preview` shows today's upload landing and the full flow works (upload → review → Your plan, Calculator, terms) [ ] `/` shows no upload tiles, no drop zone, a disabled plan-code card with the "open soon" line [ ] `/advisor/preview` is covered by the `/advisor` rule in `middleware.ts` (no middleware change needed) [ ] `/p/[plan_id]` unchanged [ ] all checks pass.
2. `OPEN-ITEMS.md`: mark #50 done with hashes. Set **Status:** Done here.
3. `git add OPEN-ITEMS.md ERRORS.md MEMORY.md CONTEXT.md CLAUDE.md "PHASE PROMPTS/"` (modified only) → commit `docs: phase 15 advisor-only access` → push.

## Report back
Three hashes, the checklist, the Spanish strings, anything unexpected.

## Done when
Ross, after Vercel is Ready: `/advisor` → "Preview the participant screens" → upload a test SPD → everything works as before. `/` → only the plan-code card (disabled, "open soon"). Spanish toggle on `/` shows the Spanish lines.

## Not in this phase (logged)
- Plan-code backend (code per plan, lookup, wrong-try limits) and advisor name/email on the plan: after the 🔴 security decisions (#31, #34).
- Before `SITE_PUBLIC=true`: `/api/ingest` and file-based `/api/chat` requests must only be accepted from signed-in advisors, or anyone could call them directly and run up AI cost (#50 notes).
