# PHASE 14 — Plan name stays put, glance panel travels with you, vesting fix, General 401(k) key terms
**Created:** Oct 4, 2026 in Cowork
**Run (Auto mode, walk away):** `Read "PHASE PROMPTS/PHASE-14-sticky-plan-name-and-panel.md" and execute all steps in order.` 5 steps, 5 commits, each pushed. No checkpoints.
**Open items:** #43, #44 (vesting contradiction), #45 (this layout), #46 (eligibility always shown), #47 (General 401(k) key terms; wording DRAFT, Ross reviewing as #48).
**Status:** Done, Oct 4, 2026 (run in the order 3, 4, 1, 2, 5 at Ross's request)
- STEP 3 (`5c149ec`) — general key terms data
- STEP 4 (`302dff6`) — general key terms screen
- STEP 1 (`0fc8c9b`) — immediately vested answers, eligibility always shown
- STEP 2 (`e772c06`) — sticky plan name, traveling glance panel
- STEP 5 (docs, this commit)
**Design:** Landing Redesign canvas, boards "Ask tab v2, web" and "Your plan tab, web" (updated Oct 4 with the sticky plan name and sticky panel), and "General 401(k) key terms, web (mix)". Key terms text: `PHASE PROMPTS/PHASE-14-general-terms-content.md`.

## Why
Ross, Oct 4, after PHASE-13:
1. The plan name must stay on screen while the page scrolls (Ask and Your plan).
2. Each question and answer makes the Ask page longer, so "Your plan at a glance" must travel with you, vertically centered in the visible area.
Plus a wrong answer Cowork spotted in Ross's screenshot: a plan with a non-safe-harbor match and the schedule "100% immediately vested for both employee deferrals and employer match" got "The extra match follows a vesting schedule" in the match answer, and a generic "What that means: the timeline…" paragraph in the vesting answer. Both contradict the plan.

## What Cowork checked (`f4dd114`)
- PHASE-13 matches its prompt: summary hidden (`summary: true`, `PlansparencyApp.tsx` line 263 and `app/p/[plan_id]/page.tsx` line 72), row-reverse layout (line 535), `PlanGlance.tsx`, `PlanOverview.tsx` hero at lines 52-61.
- Both tabs scroll inside their own `<div style={{ flex: 1, overflowY: "auto" }}>` (Ask `PlansparencyApp.tsx` line 534, Your plan `PlanOverview.tsx` line 49), not the window. So `position: sticky` works relative to those divs, and "centered" means centered in that div's visible height, not `100vh`.
- `stockAnswers.ts` line 96 always says "follows a vesting schedule" for a non-safe-harbor match; line 120 always adds the glossary definition. `parseVesting` (PHASE-13) already recognizes "100% immediately vested".

## Rules for Claude Code
Same rules as PHASE-07. Auto mode, repo root, stage only named files, no deny-list commands, never `git reset/clean/stash`, never force-push. Checks after each step: `npx tsc --noEmit`, `npm run build`, `npx --yes tsx scripts/check-calc.ts`, `npx --yes tsx scripts/check-answers.ts`, `npx --yes tsx scripts/check-overview.ts`. Colors from `C`, fonts from `F`. No em or en dashes in user-facing text.

## STEP 1 — Vesting answers can't contradict an "immediately vested" plan; eligibility always shown

**Check the ground:** `git status` clean except Cowork docs. Latest commit `f4dd114`. Otherwise STOP.

In `lib/answers/stockAnswers.ts`:
1. Match answer, the `if (f.disc)` block: when `parseVesting(pd.vestingSchedule)?.kind === 'immediate'`, push `para('It\'s yours right away.', 'Your plan says this match is 100% yours as soon as it\'s paid in.')` instead of the "follows a vesting schedule" line. Keep the last-day line as is.
2. Vesting answer: when `parseVesting(v.schedule)?.kind === 'immediate'`, push `para(\`${v.label} is 100% yours right away.\`, \`Your plan says: "${v.schedule}".\`)` and skip the "What that means" and "If you leave early" lines. All other schedules unchanged.
3. Add a sample to `scripts/samples.ts`: match tiers `[{ pct: 100, upTo: 4 }]`, no safe harbor, `vestingSchedule: "100% immediately vested for both employee deferrals and employer match"`. In `check-answers.ts` assert: its match text does not contain "follows a vesting schedule"; its vesting text contains "100% yours right away" and does not contain "What that means".
4. **Eligibility is always there (Ross, Oct 4).** In `lib/plan/overview.ts` (~line 151 and ~line 197): the "When you can save" glance row and the Your plan "When can I start?" card must show for every plan, not only when `contribEligibility.requirement` was read. When it's missing: glance value "Ask HR" / "Pregunta a Recursos Humanos"; card with no fact pill and body "Your plan document didn't say. HR or your plan's website can tell you." / "El documento de tu plan no lo dice. Recursos Humanos o el sitio web de tu plan te lo pueden decir." (`anchor` stays `when-can-you-start`). Tapping still calls `openStock('elig')`, which goes to the AI when the written answer can't be built. The "When the match starts" row stays conditional. In `scripts/check-overview.ts`: the all-null sample now has exactly one glance row (eligibility) and the "When can I start?" card; update that assertion.
5. Checks → `git add lib/answers/stockAnswers.ts lib/plan/overview.ts scripts/samples.ts scripts/check-answers.ts scripts/check-overview.ts` → commit `fix(answers): immediately vested plans; eligibility always shown` → push.

## STEP 2 — Sticky plan name (both tabs) + glance panel centered and traveling (Ask)

**Files:** `components/plansparency/useStickyPanel.ts` (new), `components/plansparency/PlanGlance.tsx`, `components/plansparency/PlanOverview.tsx`, `components/PlansparencyApp.tsx`.

1. **One sticky header style for both tabs.** At the top of each tab's scroll div (first child), a bar: `position: "sticky"; top: 0; zIndex: 5; background: C.bg; borderBottom: 1px solid C.borderLight`. Inside it a container `maxWidth` (1180 on Ask, 1120 on Your plan), `margin: "0 auto"`, `padding: "16px 20px 12px"`, `boxSizing: "border-box"`, flex column, gap 4 (Ask) / 6 (Your plan). Contents:
   - Ask: the existing label (`t.askHeader`) and plan name `<h1>`, MOVED out of `main` into this bar.
   - Your plan: the existing hero (label, `<h1>`, source pill), MOVED out of the content column into this bar.
   - Plan name size on both: `fontSize: "clamp(24px, 4.5vw, 36px)"`, lineHeight 1.05, `F.display`, 700. On a phone add `whiteSpace: "nowrap"; overflow: "hidden"; textOverflow: "ellipsis"` so a long name stays one line.
   - Remove the top padding the old hero/header left behind (the content container's top padding becomes 20).
2. **`useStickyPanel()` hook** (`components/plansparency/useStickyPanel.ts`): takes refs to the scroll div, the sticky header bar and the layout container. With one `ResizeObserver` (clean up on unmount) it returns `{ twoCol, top, height }`:
   - `twoCol` = layout container width ≥ 900 (that's where `main` 520 + panel 300 + gap 28 + padding fit side by side).
   - `top` = header bar height + 16.
   - `height` = scroll div `clientHeight` − header bar height − 32.
3. **Ask layout:** wrap `<PlanGlance>` in a column div that takes over the flex sizing: `flex: "1 1 300px"; maxWidth: 380; minWidth: 0`. When `twoCol`: also `position: "sticky"; top; height; display: "flex"; alignItems: "center"`. When not: none of those (phone: panel stays below the questions in normal flow, exactly as now).
4. **`PlanGlance`:** remove its own `flex`/`maxWidth`/`minWidth`; add `width: "100%"; boxSizing: "border-box"; maxHeight: "100%"; overflowY: "auto"`. Result: on a tall screen the panel sits centered in the visible area and moves with the page; on a short screen it fills the visible area and scrolls inside itself. Nothing else in the panel changes.
5. **Scroll targets under a sticky bar:** the PHASE-12 "scroll the question bubble to the top" behavior would now hide the bubble under the sticky bar. Give every message row in Ask `scrollMarginTop` = header bar height + 12 (from the hook). In Your plan, give the cards with an `anchor` (`when-can-you-start`) `scrollMarginTop: 120` so the calculator link still lands with the card visible.
6. Checks → `git add components/plansparency/useStickyPanel.ts components/plansparency/PlanGlance.tsx components/plansparency/PlanOverview.tsx components/PlansparencyApp.tsx` → commit `feat(layout): plan name stays on screen; glance panel travels centered on wide screens` → push.

## STEP 3 — General 401(k) key terms: data (no UI)

**Why:** Ross, Oct 4: rename Key Terms to "General 401(k) key terms". These are general meanings for any plan, not this plan's details; new sections, 7 new terms, a short one-liner, examples, side-by-side 2026 limits and catch-up rules. Wording is a DRAFT (Ross reviews later, #48), so build it exactly as written.

**What Cowork checked:** `getTerm()` is also used by `CalcPanel.tsx` (traditional, roth, totalLimit, discretionaryMatch, payLimit, hce, trueUp) and `stockAnswers.ts` (vestingSchedule, traditional, roth, catchUp, rothCatchUpRule). So no entry is deleted and those definitions don't change. The Key terms page picks its terms from a new layout list instead.

**Do** in `lib/glossary.ts` (one source for definitions, #24):
1. Add optional fields to the entry type: `short: Localized`, `example?: Localized`, `rows?: { label: Localized; value: string; note?: Localized }[]` (values may hold placeholders), `visual?: 'vestingChart'`, `rel?: TermId[]`, `ask?: StockId | 'calculator'`. Import `StockId` as a type only.
2. Add the 7 new ids to `TermId` and their entries; update the existing entries' term names, `short`, `example`, `rows`, `rel`, `ask` and (only where the content file gives one) `def`, all exactly per `PHASE PROMPTS/PHASE-14-general-terms-content.md`. Write Spanish for every new string.
3. `fillPlaceholders`: add `limit50` (deferral + catchUp50) and `limit6063` (deferral + catchUp6063). Apply it to `short`, `def`, `example`, row values and notes, and term names.
4. Export `KEY_TERMS_LAYOUT` (ordered `{ section: 'start'|'employer'|'access'|'invest'; sub?: 'work'|'leave'; child?: boolean; id: TermId }[]`, the Layout table) and `getKeyTerms(lang)` returning the layout entries resolved (term, short, def, example, rows, visual, rel, ask, section/sub/child) with placeholders filled. Skip the Roth catch-up row when `rothCatchUpWageThreshold` is null. Keep `getGlossary` and `getTerm` working as today.
5. Add `scripts/check-terms.ts`: for both languages, every `getKeyTerms` string has no `{`, `undefined`, `NaN`, `—`, `–`; every `rel` id is in the layout; every layout id has a `short`; `annualLimits` rows show $24,500 / $32,500 / $35,750 for 2026; `getTerm('catchUp','en').def` is unchanged from before this step. Print a pass count; exit 1 on failure.
6. Checks (all five plus `npx --yes tsx scripts/check-terms.ts`) → `git add lib/glossary.ts scripts/check-terms.ts` → commit `feat(terms): general 401(k) key terms content and layout` → push.

## STEP 4 — General 401(k) key terms: the screen

**Files:** `components/plansparency/KeyTermsPanel.tsx` (rewrite, same export), `components/plansparency/theme.ts` (one token), `lib/i18n/index.ts`, `components/PlansparencyApp.tsx` (pass `openStock` and the calculator switch).
1. `theme.ts`: add `highlight: "#F1EBE0"` to `C` (selected row tint from the board).
2. i18n: `navKeyTerms` → "401(k) terms" / "Términos 401(k)" (the full name doesn't fit a 4-tab bar on a phone). `keyTermsTitle` → "General 401(k) key terms" / "Términos generales del 401(k)". `keyTermsSubtitle` → "General meanings that apply to most 401(k) plans. Your plan's own rules are in the Your plan and Ask tabs." (+ ES).
3. **Sticky header bar** exactly like Step 2's (first child of the tab's scroll div, `position: sticky; top: 0; zIndex: 5; background: C.bg; borderBottom: 1px solid C.borderLight`, container maxWidth 1180, padding "16px 20px 12px"): `<h1>` = `t.keyTermsTitle` (same size as the plan name on the other tabs), then the subtitle 14px `C.textMuted`.
4. **Content** container maxWidth 1180, padding "20px 20px 48px", flex column, gap 18:
   - Search box: maxWidth 420, flex, gap 10, padding "0 14px", border 1px `C.inputBorder`, radius 14, background `C.aiBubble`; 18px magnifier (stroke `C.textMuted`); input height 44, 15px, placeholder "Search all terms" / "Buscar en todos los términos". Searches term + short + def across all sections.
   - Topic tabs: `role="tablist"`, flex wrap, gap 8, borderBottom 1px `C.borderLight`. Each `<button role="tab" aria-selected>`: minHeight 44, padding "0 4px", marginRight 14, no background, borderBottom 3px solid (`C.accent` when selected and not searching, else transparent), 15px; selected 700 `C.text`, else 600 `C.textMuted`. Tapping a tab clears the search and selects that section's first term.
   - Two columns: flex wrap, gap 40, alignItems flex-start. Left `<nav>` flex "1 1 260px", maxWidth 300. Right `<article aria-live="polite">` flex "999 1 520px", minWidth 0.
5. **Left list** (selected section; while searching: all matches, no sub-headings, no indent, each with its section name under it in 12px/600 `F.body` `C.textMuted`, plus a line "N terms match" or "No terms match. Try a shorter word." 13px `C.textMuted` at the top):
   - Sub-heading (While you work / When you leave): 12px, 700, uppercase, letterSpacing .06em, `C.accentText`, padding "16px 10px 6px".
   - Term row `<button aria-current>`: flex, alignItems center, gap 10, minHeight 52, padding "6px 10px" (left padding 30 for child terms), no border except borderBottom 1px `C.borderLight`, radius 0, `F.display`, 21px (child 19px), textAlign left. Selected: background `C.highlight`, 700, `C.text`; else transparent, 600, `C.textMuted`. Leading 8px dot, radius 50%, `C.accent` when selected, transparent otherwise.
6. **Right entry (dictionary page):** borderTop "3px double" `C.text`, paddingTop 8, flex column, gap 20.
   - Headword block (paddingTop 18, gap 6): `<h2>` `F.display`, `clamp(40px, 6vw, 56px)`, 700, lineHeight 1; section name 13px, 600, letterSpacing .08em, uppercase, `C.accentText`.
   - `<ol>` (no list style, gap 18). Each `<li>` grid `32px minmax(0,1fr)`, gap "4px 12px": number `F.display` 24/700 `C.accentText`; small label 12px/600 uppercase .06em `C.textMuted`; then the text. 1 "In a few words" / "En pocas palabras": `short` in `F.display` 26px italic 600, lineHeight 1.25. 2 "What it means" / "Qué significa": `def` 17px, lineHeight 1.65. 3 "For example" / "Por ejemplo" (only with `example`): 17px, lineHeight 1.6.
   - Rows table (only with `rows`): border 1px `C.border`, radius 12, overflow hidden, background `C.surface`. Each row grid `minmax(0,1fr) auto`, gap "4px 16px", padding "14px 18px", borderBottom 1px `C.borderLight`: label 16/700; value `F.display` 26/700 right-aligned; note spans both columns, 14px `C.textMuted`.
   - `visual: 'vestingChart'`: box padding "16px 18px", radius 12, background `C.surfaceAlt`; label "Example: a 6-year graded schedule" (12px/600 uppercase); 7 columns (years 0 to 6: 0, 0, 20, 40, 60, 80, 100%), each a bar max 36px wide, height pct × 0.8 px (min 3), radius "6px 6px 0 0", `C.accent` (`C.green` at 100), the % above (12px/700) and "Yr n" below (12px `C.textMuted`), column height 120.
   - "See also" (12px/600 uppercase) then each `rel` as a text button `F.display` 20/700 `C.accentText` "→ {term}", minHeight 44; tapping selects it (and its tab).
   - When `ask` is set: a 15px/700 `C.accentText` text link, minHeight 44: stock id → "How does my plan handle this? →" / "¿Cómo lo maneja mi plan? →" calling `openStock(ask)`; `calculator` → "Try it in the calculator →" switching to the calculator tab.
   - Previous / next: borderTop 1px `C.border`, paddingTop 14, space-between, buttons 15px/600 `C.textMuted`, minHeight 44: "← {previous term}" and "{next term} →" in layout order, wrapping at the ends; they also switch the tab.
7. Footer 12px `C.textDim`: "General education about 401(k) plans, not personalized financial advice. Your plan's own rules can differ, and the Your plan and Ask tabs show them." (+ ES).
8. **Phone** (container under 900px, measure with the same ResizeObserver approach as Step 2): show the list full width; tapping a term shows the entry full width with a "← All terms" / "← Todos los términos" button (minHeight 44) at the top that returns to the list. Wide screens: both columns always.
9. Default selection: the first term of the first section.
10. Checks → `git add components/plansparency/KeyTermsPanel.tsx components/plansparency/theme.ts lib/i18n/index.ts components/PlansparencyApp.tsx` → commit `feat(terms): General 401(k) key terms screen, dictionary style` → push.

## STEP 5 — Self-check, then docs
1. Fill in with file + line: [ ] plan name bar is the first child of each tab's scroll div with `position: sticky; top: 0` [ ] it was moved, not duplicated (`grep -c "t.askHeader" components/PlansparencyApp.tsx` = 1) [ ] panel sticky + centered only when `twoCol` [ ] panel scrolls inside itself when taller than the space [ ] ResizeObserver disconnected on unmount [ ] stock-answer scroll lands below the sticky bar [ ] calculator "check when you qualify" still shows the "When can I start?" card [ ] statement chat untouched [ ] Key terms: no plan-specific text anywhere on the page [ ] `getTerm` definitions used by the calculator and answers unchanged (`git diff f4dd114 -- lib/glossary.ts` shows no edits to those `def` strings) [ ] 22 terms in 4 tabs, sub-headings and indented children as in the layout [ ] phone list → entry → back works [ ] all six checks pass.
2. `OPEN-ITEMS.md`: mark #44, #45, #46 and #47 done with commit hashes (#48, Ross's definitions review, stays open). Set **Status:** Done here.
3. `git add OPEN-ITEMS.md ERRORS.md MEMORY.md CONTEXT.md CLAUDE.md "PHASE PROMPTS/"` (modified only) → commit `docs: phase 14 sticky plan name and panel` → push.

## Report back
Five hashes, the filled checklist, every Spanish string you wrote, files changed, anything unexpected.

## Done when
Cowork reviews the diff first. Then Ross after Vercel is Ready: Ask on a laptop, tap 5 questions in a row and scroll: plan name stays at the top, glance panel stays centered beside the answers. Make the window short: panel scrolls inside itself. Phone width: plan name on one line at the top, panel below the questions. Your plan: plan name and reviewed pill stay at the top while scrolling. A plan with "100% immediately vested": match and vesting answers both say it's yours right away. 401(k) terms tab: 4 topic tabs, tap Contribution's children, Annual limits shows $24,500 / $32,500 / $35,750, search "roth" finds terms across tabs, previous/next pages through all 22, "How does my plan handle this?" opens the matching answer in Ask.
