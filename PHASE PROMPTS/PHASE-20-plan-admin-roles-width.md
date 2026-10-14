# PHASE 20: Fix the missing stylesheet, wider pages, multiple roles, Edit plan details, Upload additional plan doc
**Created:** Oct 14, 2026 in Cowork
**Run (Auto mode, walk away), AFTER PHASE-19:** `Read "PHASE PROMPTS/PHASE-20-plan-admin-roles-width.md" and execute all steps in order.` 7 steps, 8 commits, each pushed to `main`. No checkpoints. No new npm packages. No database change (everything new lives in `plans.plandata_json` and `plans.team_json`).
**Open items:** #58 (stylesheet bug), #59 (width), #60 (multiple roles), #61 (Edit plan details), #62 (Upload additional plan doc), #63 (condensed, sortable plans list).
**Status:** Done Oct 14, 2026. STEP 1 `d1848eb`, STEP 2 `f5d0ab4`, STEP 3 `87bdc5d`, STEP 4 `8c3b1c3`, STEP 5 `4601dd4`, STEP 6 `6d7b128`, STEP 7 `7608465`, docs commit (`docs: phase 20`).
**Approved design:** Landing Redesign canvas: `SunTeamEdit` (now "Main role" + "Also helps with"), `SunTeam` (one chip per role), `SunPlanAdmin` (preview switcher at the top: Plans list / Edit details / Additional doc). Every value below was copied from those boards and mapped to `theme.ts` tokens.

## Why (Ross, Oct 14, after PHASE-19)
1. "Skip to main content" shows at the top of every page, and the 4th tab shows BOTH "Meet your advisor's team" and "Advisor team". Ross asked to remove the skip link.
2. Widen everything a bit, on all pages.
3. Let a team member have more than one role; one role's description doesn't always fit the person.
4. On each saved plan: "Edit Plan Details" (plan rules change over time) and "Upload Additional Plan Doc" (supplement what's there).
5. Plans list: condense it, make it sortable, collapsed rows that expand (added Oct 14).

## What Cowork found (`c82bdd1`, Oct 14)
- **Root cause of #1: `app/globals.css` is never imported.** `app/layout.tsx` has no `import './globals.css'` (it was dropped long ago). So every rule PHASE-18 and PHASE-19 put there never reached the browser: the skip link's hide rule, `.sr-only` (screen-reader-only text like "Call Jordan Lee:" is visible on the page), the focus rings, `.on-dark` focus color, `.focus-wrap`, reduced motion, and the `.tab-long` / `.tab-short` switch. Cowork's PHASE-18 review checked the code, not the rendered page (logged in ERRORS).
- **Decision on the skip link (Cowork, explained to Ross): keep it, hidden.** It is required for WCAG 2.4.1 (keyboard users skip the header and tabs). With the stylesheet loaded it is invisible until someone presses Tab. If Ross still wants it gone after seeing it hidden, that's a one-line removal later.
- `globals.css` also still has Create Next App starter rules that never applied: `html, body { max-width: 100vw; overflow-x: hidden }`, `* { padding: 0; margin: 0 }`, `a { color: inherit; text-decoration: none }`. Loading them now would change spacing site-wide and remove link underlines (links must stay visibly different, WCAG 1.4.1). Delete those three blocks; keep `* { box-sizing: border-box }`.
- Page widths are hard-coded: `maxWidth: 1180` in `PlanOverview.tsx` (2), `KeyTermsPanel.tsx` (2), `TeamPanel.tsx` (2); `1120` in `app/advisor/page.tsx`, `app/advisor/plans/[plan_id]/team/page.tsx`, `CalcPanel.tsx` (2), `Landing.tsx`.
- `lib/team.ts` `TeamMember.role` is a single `TeamRole`. `TeamPanel.tsx` line 34 builds the legend from `m.role` only.
- `app/advisor/page.tsx` holds `REVIEW_ROWS`, `getAt`, `setAt`, `triLabel`, `ReviewField`, and the document read (`/api/ingest` -> `/api/chat` with `i18n.en.firstMessage` -> `parsePlanData`) inline (lines ~13 to 118 and ~186 to 236). Edit details and Additional doc need the same pieces: move them to shared files instead of copying.
- `REVIEW_ROWS` has no row for plan name, recordkeeper name or recordkeeper website.
- The plans list on `/advisor` comes from this browser's `localStorage` (`plansparency_plans`), so it only shows plans saved on this computer: Ross's list shows 3, the database has 4. Each plan is a tall card (name, date, link, 2 buttons).
- `app/api/chat/route.ts` ~105: system prompt = fixed instructions + `accountLine(planData)`. The AI never sees the reviewed details, so after an advisor edits a detail, AI answers (which read the original PDF) could contradict the written answers. Fix in STEP 6 (also helps #38).

## Rules for Claude Code
Same rules as PHASE-07. Auto mode, repo root, stage only named files, no deny-list commands, never `git reset/clean/stash`, never force-push. Checks after each step: `npx tsc --noEmit`, `npm run build`, every `scripts/check-*.ts` (run with `npx --yes tsx scripts/<name>.ts`). Colors and widths only from `theme.ts`, fonts from `F`. CLAUDE.md "Accessibility Rules". EN + ES for participant strings (advisor screens English only). No em/en dashes.

## STEP 1: Load the stylesheet (fixes the skip link, the double tab label, hidden screen-reader text, focus rings)

**Check the ground:** latest commit is `c82bdd1` or a later Cowork docs commit; `git status` clean except Cowork docs. If not, STOP.

1. `app/globals.css`: delete the `html, body { max-width…; overflow-x… }` block, the `* { padding: 0; margin: 0 }` part (keep `* { box-sizing: border-box; }`), and the `a { color: inherit; text-decoration: none; }` block. Keep everything else.
2. `app/layout.tsx`: add `import './globals.css';` at the top.
3. `scripts/check-a11y.ts`: add a FAIL if `app/layout.tsx` does not import `./globals.css`, and a FAIL if `.skip-link`, `.sr-only`, `.tab-short` or `:focus-visible` is missing from `app/globals.css`.
4. Run `npm run build`, then confirm in the built CSS output (search `.next/static/css/`) that `.skip-link` and `.sr-only` are present. Report the file name.
5. Checks -> `git add app/globals.css app/layout.tsx scripts/check-a11y.ts` -> commit `fix(a11y): load globals.css so the skip link, screen-reader text and tab labels work` -> push.

## STEP 2: Wider pages, one setting

1. `theme.ts`: `export const LAYOUT = { page: 1360, advisor: 1280, reading: 760 };` (was 1180 participant / 1120 advisor; about 15% wider).
2. Replace every `maxWidth: 1180` with `LAYOUT.page` and every `maxWidth: 1120` with `LAYOUT.advisor` in the files listed above. `760` reading-width text blocks become `LAYOUT.reading`. Leave smaller widths (cards, dialogs, inputs) alone.
3. `PlanOverview.tsx`: the side panel (`maxWidth: 360`) may grow to 400 so the wider page isn't all empty space; nothing else in that file.
4. `scripts/check-theme.ts`: FAIL on any `maxWidth` number of 900 or more outside `theme.ts` (so widths stay in one place).
5. Checks -> `git add components/plansparency/theme.ts scripts/check-theme.ts` + every file you changed (list them) -> commit `feat(layout): one width setting, pages about 15% wider` -> push.

## STEP 3: More than one role per person (boards `SunTeamEdit`, `SunTeam`)

1. `lib/team.ts`: `TeamMember` gains `also: TeamRole[]`. `normalizeTeam`: `also` = valid roles only, no duplicates, never the main `role`, in `TEAM_ROLES` order, max 4; missing -> `[]` (old saved teams still load). Add `export function rolesOf(m) { return [m.role, ...m.also]; }`.
2. `scripts/check-team.ts`: add cases for `also` (invalid dropped, duplicate dropped, main role removed, order fixed, old record without `also` loads).
3. Editor (`app/advisor/plans/[plan_id]/team/page.tsx`), copy `SunTeamEdit`: the select label becomes "Main role (sets the color employees see)"; keep the live `RoleChip` + "what" line under it. Below it a `<fieldset>` legend "Also helps with (optional)" (14/600) with one 20x20 checkbox per other role (labels 15px, min-height 36, gap 4px 18px), and hint 12px `C.textDim`: "Each role shows as its own tag on the card. The card color follows the main role." Changing the main role removes it from "also". List rows show one `RoleChip` per role (wrap, gap 4). Card color, avatar and left border stay on the main role.
4. `TeamPanel.tsx`: chips row shows one `RoleChip` per role in `rolesOf(m)` order, then the lead chip. "Who does what" lists every role that appears in anyone's `rolesOf`.
5. Checks -> `git add lib/team.ts scripts/check-team.ts "app/advisor/plans/[plan_id]/team/page.tsx" components/plansparency/TeamPanel.tsx` -> commit `feat(team): main role plus other roles per person` -> push.

## STEP 4: Shared review pieces + plan-details route (no visible change)

1. New `lib/plan/reviewRows.ts`: move `FieldSpec`, `ReviewRow`, `SAFE_HARBOR_OPTIONS`, `REVIEW_ROWS`, `getAt`, `setAt`, `triLabel` out of `app/advisor/page.tsx`. Add a first row `{ key: 'basics', label: 'Plan basics', fields: [ { path: ['planName'], kind: 'text', label: 'Plan name' }, { path: ['recordkeeperName'], kind: 'text', label: 'Recordkeeper' }, { path: ['recordkeeperUrl'], kind: 'text', label: 'Recordkeeper website (https only)' } ] }`. Add `export function rowValueText(row, data): string` (the plain-English value the board shows in each row) and `export function diffRows(a, b): string[]` (keys of rows whose field values differ, using `JSON.stringify` per field).
2. New `components/plansparency/advisor/ReviewField.tsx`: move `ReviewField` (and `controlStyle`) there unchanged.
3. New `lib/plan/readPlanDocument.ts` (browser): `readPlanDocument(file, onStatus) -> { planData, initialSummary, fileId }`, the exact ingest + chat + parse code from `handleFile` (same checks: PDF only, 25 MB, same status texts, same errors). `app/advisor/page.tsx` now imports all three and behaves exactly as before. The new-plan review screen gets the "Plan basics" row too (advisors check it like the others).
4. New route `app/api/plan-details/[plan_id]/route.ts` (Node.js, UUID check, same Clerk guard pattern as `save-plan`):
   - `GET` -> `{ planData, employerName, lastUpdated: { at, by } | null }` (`lastUpdated` = last entry of `planData.review.history`, else `review.reviewedAt` / `review.reviewerName`).
   - `PUT` body `{ planData, employerName?, by, note?, source: 'edit' | 'document', fileName? }`: `by` required (max 80). Run `normalizePlanData` on `planData` (400 if null). Recordkeeper URL kept only if it starts with `https://`. Keep the stored `review` object (never trust one from the client), set `review.reviewerName = by`, `review.reviewedAt = now`, and push `{ at, by, source, fileName?, note? (max 200), fields: diffRows(old, new) labels }` onto `review.history` (keep the last 50). If no row changed and `employerName` didn't change, return 400 "Nothing changed." Update `plandata_json` (and `employer_name` if sent, max 120). Return `{ planData, lastUpdated }`.
5. `middleware.ts`: add `pathname.startsWith('/api/plan-details')` to `alwaysPrivate`; update the top comment.
6. New `scripts/check-review.ts`: `diffRows` finds a vesting change, ignores identical data, catches a recordkeeper URL change; `rowValueText` returns readable text for every row on a sample from `scripts/samples.ts`.
7. Checks -> `git add lib/plan/reviewRows.ts components/plansparency/advisor/ReviewField.tsx lib/plan/readPlanDocument.ts app/advisor/page.tsx "app/api/plan-details/[plan_id]/route.ts" middleware.ts scripts/check-review.ts` -> commit `refactor(advisor): shared review rows and document reader, plan-details route` -> push.

## STEP 5: Edit plan details (board `SunPlanAdmin`, view "Edit details")

New page `app/advisor/plans/[plan_id]/details/page.tsx`, advisor shell (Logo, "For advisors" chip, `SkipLink`, `<main id="main">`, width `LAYOUT.advisor`):
- "← Your plans" (to `/advisor`), H1 "Edit plan details" (`F.display` 36/700), plan name 16px `C.textMuted`.
- Note box (`role="note"`, max-width 860, padding 14px 16px, radius 12, `C.warningDim` background, `C.warning` text, 15px, line-height 1.55): "**Employees see changes right away.** Written answers update. AI answers still read the original plan document, so if the change comes from an amendment, also use “Upload additional plan doc”." (Keep the wording even after STEP 6: the AI is told to prefer reviewed details, but the document is still there.)
- Two columns (flex-wrap, gap 28): rows list (`flex: 999 1 560px`) and a save panel (`flex: 1 1 320px`, max-width 420).
- Row per `REVIEW_ROWS` entry plus an "Employer name" row (the `employer_name` column): padding 14px 16px, radius 14, `C.surface`, border 1px `C.border`, or 2px `C.accent` when changed; label 13/700 uppercase `C.textMuted` with a "Changed" chip (12px, `C.accentSoft`/`C.accentText`) when changed; value 16px line-height 1.5 from `rowValueText`; "Edit" / "Done" button (min-height 40, 1px `C.border`, radius 10, 14/700 `C.accentText`) that swaps the value for the row's `ReviewField` controls.
- Save panel (padding 22, radius 16, 1px `C.border`, `C.surfaceAlt`, gap 16): heading "Save {n} change(s)" 18/700; "What changed and why (optional)" input (placeholder "e.g. Amendment effective Jan 1, 2027"); "Your name (required)"; checkbox "I checked these changes against the current plan document."; "Save changes" (primary gradient). Errors (`role="alert"`, 13px `C.danger`): "Change at least one detail, add your name and check the box." Success (`role="status"`, 14/600 `C.green`): "Saved. Employees see the new details now." Then the rows reset to "not changed".
- "Change history" (top border 1px `C.border`, h3 14/700, items 13px `C.textMuted`): newest first, "Oct 14, 2026 · RMG changed Vesting, Loans. Note: …", and the original review last ("Oct 4, 2026 · RMG reviewed all details (original document)").
- PUT with `source: 'edit'`.
- Checks -> `git add "app/advisor/plans/[plan_id]/details/page.tsx"` -> commit `feat(advisor): edit plan details with change history` -> push.

## STEP 6: Upload additional plan doc (board `SunPlanAdmin`, view "Additional doc") + AI uses reviewed details

1. New page `app/advisor/plans/[plan_id]/add-document/page.tsx`, same shell:
   - Header like STEP 5 with H1 "Upload additional plan doc".
   - Drop zone button (max-width 860, padding 40px 24px, 2px dashed `C.inputBorder`, radius 16): "Drop a PDF here or click to upload" 17/700; "An amendment, a newer SPD, an enrollment booklet or a fee disclosure. PDF, 25 MB max." 14px `C.textMuted`; "We read it once to find new or different details, then delete it. Nothing changes until you approve." 13px `C.textDim`. Status text from `readPlanDocument` while reading.
   - After reading: compare the new `planData` with the saved one using `diffRows`. Only show rows where the new document **has a value** and it **differs** (a field the new document doesn't mention never wipes a saved value). Tag "New" (`C.greenSoft`/`C.green`) when the saved value was empty, "Different" (`C.warningDim`/`C.warning`) otherwise. Plus an "Investment options" row when the new document has `fundsData` and it differs from the saved list: "{n} funds found. Add them to the Investments tab." (tag New if the saved list was empty).
   - Intro line 16px `C.textMuted`: "From **{file name}**. We found **{n} details** that are new or different. {m} details match what you have and aren’t shown." If n = 0: "Nothing new or different in this document. Your plan stays as it is." and a "Back to your plans" link.
   - Compare table (`role="table"`, max-width 1080, 1px `C.border`, radius 16, overflow hidden): header row `C.surfaceAlt` 13/700 uppercase `C.textMuted`, columns `1.1fr 1.4fr 1.4fr 140px`: Detail / Now / In the new document / Use new. Rows 15px line-height 1.5, top border 1px `C.borderLight`; "Now" in `C.textMuted`; a 20x20 "Use" checkbox, checked by default. Under 700px wide, stack each row (label, then "Now:", "New:", checkbox).
   - Bottom bar (max-width 1080, padding 20, radius 16, `C.surfaceAlt`, wrap): "Your name (required)"; checkbox "I checked the details I’m using against the new document."; "Update plan ({count})" primary; "Cancel" (deletes the uploaded file, back to `/advisor`). Error: "Pick at least one detail, add your name and check the box." Success: "Plan updated. The document was deleted."
   - Save = saved planData with only the checked rows' fields (and `fundsData` if checked) taken from the new document, PUT with `source: 'document'`, `fileName`. Always delete the uploaded file afterwards with the existing `endSessionFiles([fileId])` (success, failure, cancel, and on `pagehide`), same as the new-plan review.
2. `app/api/chat/route.ts`: new `reviewedDetailsLine(planData)` returning, when `planData?.review` exists, a short text block: "Plan details reviewed by the advisor (newer than the plan document; when they differ, use these):" followed by one line per `REVIEW_ROWS` row using `rowValueText`. Add it to `systemBlocks` right after the account line (after the cache marker, so caching is unchanged). Confirm in the report which requests from `PlansparencyApp.tsx` send `planData` (card AI answers must).
3. Checks -> `git add "app/advisor/plans/[plan_id]/add-document/page.tsx" app/api/chat/route.ts` (+ any shared file you touched) -> commit `feat(advisor): add a document, compare and approve changes; AI prefers reviewed details` -> push.

## STEP 7: Condensed, sortable plans list (board `SunPlanAdmin`, view "Plans list") + docs

1. New route `app/api/plans-list/route.ts` (Node.js, same Clerk guard pattern): `GET` -> every row in `plans` as `{ planId, name (plandata_json->>planName, else employer_name, else 'Unnamed plan'), uploadedAt (created_at), lastUpdated: { at, by } (last `review.history` entry, else `review.reviewedAt`/`reviewerName`, else null), teamCount (length of team_json) }`. Never return `plandata_json`, the PDF path or the advisor token. `middleware.ts`: add `pathname === '/api/plans-list'` to `alwaysPrivate`. (Today everyone with the shared password sees every plan anyway; when advisor accounts arrive this route must filter by advisor, #34.)
2. `app/advisor/page.tsx` saved-plans section, rebuilt as a new component `components/plansparency/advisor/PlansTable.tsx` (keep the page file from growing), copied from the board:
   - Heading row: H1 "Your plans" (`F.display` 40/700) + count "({n})" 16/600 `C.textMuted`; on the right a search box (label wrapping an icon + visually hidden "Find a plan" + `<input type="search">`, min-height 44, 1px `C.inputBorder`, radius 10, placeholder "Find a plan"; filters by plan name, case-insensitive) and "+ Upload another plan" (min-height 44, 1px `C.accent`, `C.accentSoft`, `C.accentText` 15/700, radius 10; does what the current button does).
   - One real `<table>` (width 100%, collapse, 15px) inside a box (1px `C.border`, radius 16, overflow hidden). Header row `C.surfaceAlt`; columns Plan (44%), Uploaded, Last updated, Team, plus a narrow actions column with a visually hidden "Actions" header.
   - **Sortable headers:** each `<th scope="col" aria-sort>` holds a `<button>` (min-height 40, 13/700 uppercase `.04em`; `C.text` when sorted, `C.textMuted` otherwise) with an arrow `aria-hidden` (▲ ascending, ▼ descending, ↕ unsorted). Click the sorted column to flip direction; a new column starts ascending for Plan and descending for the others. Default sort: Last updated, newest first. Remember the sort in `localStorage` (`plansparency_plans_sort`, try/catch).
   - **Collapsed rows:** each plan is its own `<tbody>`. Main row (top border 1px `C.borderLight`, `C.surface`): `<th scope="row">` with the plan name as a full-width text `<button aria-expanded>` (700, `C.text`); Uploaded `M/D/YYYY` (`C.textMuted`, no wrap); Last updated `M/D/YYYY · name` (or "Not changed" if null); Team "{n} people" / "1 person" (600) or a "Not added" chip (13/600, `C.warningDim` / `C.warning`, padding 3px 8px, radius 100); a 40x40 +/− button (1px `C.border`, radius 10, `aria-expanded`, `aria-label` "Show actions for {name}" / "Hide actions for {name}"). Name button and +/− toggle the same row; one row open at a time.
   - **Expanded row** (`background C.highlight`, both rows): `<td colSpan={5}>` padding 4px 16px 18px: the share link in a `<code>` box (`C.surface`, 1px `C.borderLight`, radius 8, 13px, ellipsis) + "Copy link" (copies, then "Copied" for 2 s, `role="status"`); then the four actions in this order, same style (min-height 44, 1px `C.accent`, radius 10, `C.surface`, 14/700 `C.accentText`): "Preview →" (new tab), "Edit team", "Edit plan details" (`/advisor/plans/{id}/details`), "Upload additional plan doc" (`/advisor/plans/{id}/add-document`).
   - No match: "No plans match “{query}”." 15px `C.textMuted`. Loading: "Loading your plans…" (`role="status"`). Error: `role="alert"` with a "Try again" button.
   - Under 700px wide: hide the Uploaded and Team columns (CSS class in `globals.css`), keep Plan, Last updated and the +/− button; the expanded row shows Uploaded and Team as text.
   - Data comes from `/api/plans-list`. After a new plan is saved, refetch the list. Keep writing `plansparency_plans` to `localStorage` as before (other code may read it), but the table no longer reads it.
3. Checks -> `git add "app/api/plans-list/route.ts" middleware.ts components/plansparency/advisor/PlansTable.tsx app/advisor/page.tsx app/globals.css` -> commit `feat(advisor): condensed sortable plans table with expandable rows and plan actions` -> push.
4. Docs:
   - This file: Status -> Done with the eight commit hashes and the date.
   - `OPEN-ITEMS.md`: #58 to #63 -> built (commits). START HERE: Ross's test: (a) any page: no "Skip to main content" visible until you press Tab; 4th tab shows one label; (b) pages are wider; (c) give someone two roles; (d) edit a detail on Tierra Sur, check the participant page and the change history; (e) upload the Tierra Sur enrollment booklet as an additional doc and approve the funds; (f) plans list: all 4 plans show, sort each column, expand a row, search.
   - `MEMORY.md`: "Oct 14, 2026: globals.css was never loaded (fixed PHASE-20). Widths in `LAYOUT`. Team members have `role` + `also`. Plan details editable after save with `review.history`; additional documents are read once, compared, approved per detail, then deleted. The AI gets the reviewed details and prefers them over the document. The advisor plans list reads `/api/plans-list` (all plans), not localStorage."
   - `CONTEXT.md`: add the 2 new advisor pages, `/api/plan-details/[plan_id]` and `/api/plans-list` (both always private).
5. `git add "PHASE PROMPTS/PHASE-20-plan-admin-roles-width.md" OPEN-ITEMS.md MEMORY.md CONTEXT.md` (+ any other Cowork doc that changed) -> commit `docs: phase 20` -> push.

## Report back
- Eight commit hashes, files per step.
- The built CSS file name with `.skip-link` in it (STEP 1).
- Every file whose width changed (STEP 2).
- Which `PlansparencyApp.tsx` requests send `planData` to `/api/chat` (STEP 6).
- Output of `check-a11y`, `check-theme` (lowest pair), `check-team`, `check-review`.
- Anything you couldn't match to the boards and why.

## Checklist (Cowork reviews the diff, and this time the rendered pages, before Ross tests)
- [ ] `app/layout.tsx` imports `./globals.css`; starter resets gone; links still underlined where they were.
- [ ] Skip link invisible until Tab; screen-reader-only text not visible; 4th tab shows one label (long on wide screens, short under 700px).
- [ ] Participant pages 1360 wide, advisor pages 1280; no `maxWidth` 900+ outside `theme.ts`.
- [ ] A person can have a main role plus others; one chip per role; card color = main role; legend counts every role.
- [ ] Edit plan details: rows show current values, Changed chip + coral border, save needs a change + name + checkbox, history newest first, participant page shows the new value and "Details reviewed by {name} on {date}".
- [ ] Additional doc: only new/different details shown, nothing ever erased by a blank, checkboxes default on, funds row, file always deleted, save writes history with the file name.
- [ ] `/api/plan-details/*` asks for the password even with `SITE_PUBLIC=true`.
- [ ] AI system prompt includes the reviewed details after the cache marker.
- [ ] Plans list: all saved plans (from the database), one compact row each, every column sorts with `aria-sort`, default newest update first, one row expands at a time with link + 4 actions, search filters, phone width hides 2 columns.
- [ ] `/api/plans-list` asks for the password and never returns plan data, PDF paths or tokens.
- [ ] All checks pass.
