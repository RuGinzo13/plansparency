# PHASE 17: Sunrise color theme across the whole app
**Created:** Oct 12, 2026 in Cowork
**Run (Auto mode, walk away), AFTER PHASE-16 is done:** `Read "PHASE PROMPTS/PHASE-17-sunrise-theme.md" and execute all steps in order.` 3 steps, 3 commits, each pushed to `main`. No checkpoints.
**Open item:** #51 (this).
**Status:** Done Oct 12, 2026. STEP 1 `56c16f4`, STEP 2 `28e9a76`, STEP 3 docs commit (see git log: `docs: phase 17 Sunrise theme`).
**Approved design:** Landing Redesign canvas, row "Sunrise on every page" (boards `SunMain`, `SunWeb`, `SunInvite`, `SunAdvisor`, `SunAdvisorHome`, `SunPlan`, `SunTerms`, `SunCalcPhone`, `SunCalcWeb`). Every value below was copied from those boards. Ross picked Sunrise on Oct 12, 2026.

## Why
- The site has too many shades of ecru. Sunrise is white and light gray with a coral/orange accent and a charcoal top bar.
- Today a theme swap only half works: Cowork counted **93 hard-coded colors in 13 files** outside `theme.ts` (the Oct 4 note said ~46, that was wrong). Many are leftovers from the old dark theme (`#D4A853`, `rgba(212,168,83,…)`, `#0F1621`). They would stay gold after a swap.
- So: STEP 1 moves every hard-coded color into `theme.ts` with no visible change, and adds a check that blocks new ones. STEP 2 swaps the values to Sunrise and restyles the two pinned bars. STEP 3 is docs.
- Straight to `main`, no preview branch: the site is password-locked (advisor-only), Ross is the only viewer, and a bad result is undone with one `git revert`. A branch would need `git switch`/`git merge`, which are not on the allow list, and the Preview environment may not have `ADVISOR_ACCESS_PASSWORD` (middleware fails closed, so the preview would show 401 only).

## What Cowork checked (`2e6a281`, Oct 12)
- `components/plansparency/theme.ts`: `C` (31 keys) and `F`. Every component imports `C` from it.
- Hard-coded colors by file: `PlansparencyApp.tsx` 33, `StatementDashboard.tsx` 32, `CalcPanel.tsx` 6, `ui.tsx` 4, `app/page.module.css` 4, `nav.tsx` 3, `app/p/[plan_id]/page.tsx` 3, `PlanOverview.tsx` 2, `app/globals.css` 2, `PlanGlance.tsx` 1, `KeyTermsPanel.tsx` 1, `InvestmentsPanel.tsx` 1, `app/layout.tsx` 1. `lib/` and `app/advisor/*` have none.
- `app/page.module.css` is the Next.js starter file; nothing imports it.
- `PlansparencyApp.tsx` has the same global `<style>` block twice (~line 686 and ~line 781: range slider, scrollbar, select).
- The two pinned bars are `PlanOverview.tsx` ~line 104 (Your plan) and `KeyTermsPanel.tsx` ~line 175 (General 401(k) key terms). Both use `C.accentSoft` + 2px `C.accentBorder`.
- No `'white'` / `'black'` named colors in `app/` or `components/`.

## Rules for Claude Code
Same rules as PHASE-07. Auto mode, repo root, stage only named files, no deny-list commands, never `git reset/clean/stash`, never force-push. Checks after each step: `npx tsc --noEmit`, `npm run build`, all `scripts/check-*.ts` (run with `npx --yes tsx scripts/<name>.ts`). Colors from `C` (and `CHART`), fonts from `F`. No em/en dashes. No wording changes anywhere: this phase is colors only.

## STEP 1: Move every hard-coded color into theme.ts (no visible change)

**Check the ground:** latest commit is `2e6a281` or a later Cowork docs commit; `git status` clean except Cowork docs (`CLAUDE.md`, `OPEN-ITEMS.md`, `ERRORS.md`, `MEMORY.md`, `PHASE PROMPTS/`). Re-run the color search below and compare with the counts above. If a file has MORE than listed, include it and list it in the report. If something does not match in a way that changes the plan, STOP.

Search: `grep -rnoiE '#[0-9a-f]{3,8}\b|rgba?\(' app components lib --include=*.ts --include=*.tsx --include=*.css`

1. `theme.ts`: add these keys to `C` with TODAY's values (so nothing changes on screen yet):
   ```
   field: "#FFFFFF",            // input and option backgrounds (CalcPanel)
   onDanger: "#FFFFFF",         // text on C.danger buttons
   track: "#C8BFAE",            // range slider track
   thumbRing: "#FBF7F0",        // range slider thumb border
   accentTint: "rgba(212,168,83,.08)",  // light accent wash (replaces alpha .06 to .1)
   accentLine: "rgba(212,168,83,.18)",  // accent hairline border (replaces alpha .12 to .2)
   greenLine: "rgba(92,184,138,.18)",
   dangerLine: "rgba(212,106,90,.18)",
   shadow: "rgba(30,20,8,.07)",         // soft card/bar shadow (replaces .06, .07, .10)
   shadowStrong: "rgba(0,0,0,.25)",
   overlay: "rgba(0,0,0,.6)",
   overlayStrong: "rgba(0,0,0,.75)",
   bar: "#F6ECD6", barLine: "#E5C77A", barText: "#1E1408", barMuted: "#5E4E3A", barLink: "#7F5F0F",
   ```
   And a new export for chart and legend colors in `StatementDashboard.tsx`:
   ```
   export const CHART = {
     stocks: "#5CB88A", bonds: "#D4A853", multiAsset: "#94A0B2", other: "#536178",
     roth: "#6BB8D4", match: "#7A9EC9", safeHarbor: "#5CB88A", profit: "#D4A853",
     rollover: "#8B7EC9", rolloverOut: "#D4A853", neutral: "#94A0B2",
   };
   ```
2. Replace every hard-coded color with a token. Mapping:
   - `#B8863A`, `#D4A853` inside gradients -> `C.primaryEnd`. `#0F1621` as text/stroke on the accent -> `C.onPrimary`. `"#fff"` on `C.danger` -> `C.onDanger`.
   - `#C8BFAE` -> `C.track`. `#FBF7F0` -> `C.thumbRing`. Slider thumb glow `rgba(212,168,83,.4)` -> `C.accentGlow`.
   - `rgba(212,168,83 | 212,168,67 | 184,134,11, alpha)`: alpha 0.12 or less -> `C.accentTint`; alpha above 0.12 up to 0.2 -> `C.accentLine`.
   - `rgba(92,184,138, …)` -> `C.greenLine`. `rgba(212,106,90, …)` -> `C.dangerLine`.
   - `rgba(30,20,8, …)` shadows -> `C.shadow`. `rgba(0,0,0,.25)` -> `C.shadowStrong`. Modal `rgba(0,0,0,.75)` -> `C.overlayStrong`, `rgba(0,0,0,.6)` -> `C.overlay`.
   - `CalcPanel.tsx` `"#FFFFFF"` -> `C.field`.
   - `StatementDashboard.tsx` series colors -> `CHART.*` by label (Stocks->stocks, Bonds->bonds, Multi-Asset->multiAsset, Other->other, Roth->roth, Employer Match->match, Safe Harbor->safeHarbor, Profit Sharing->profit, Other Employer->neutral, Rollover->rollover, Loan Repayment->neutral, Rollovers Out->rolloverOut, Loans Taken->neutral).
   - `app/layout.tsx` body background -> `C.bg` (import `C` from `@/components/plansparency/theme` or the relative path the file already uses for imports).
   - `app/p/[plan_id]/page.tsx`: `#0F1621` -> `C.bar`, `#F4EFE6` -> `C.barText`, `#9A8878` -> `C.barMuted`. (This loading/error screen turns from dark navy to the bar color. Accepted: it becomes charcoal in STEP 2.)
   - `app/globals.css` can't import TS. Leave its two values; the check script below verifies them.
   - Any color found that is not in this list: pick the closest existing `C` key, list it in the report.
3. `PlansparencyApp.tsx` duplicate `<style>` blocks: if the two blocks are identical, move them into ONE function `globalCss()` in that file and use it in both places. If they differ, keep both and only swap colors.
4. Delete `app/page.module.css` with `git rm` (confirm first with a search that nothing imports it; if something does, keep it and tokenize instead).
5. New `scripts/check-theme.ts` (header comment: `// Run with: npx --yes tsx scripts/check-theme.ts`):
   - Walk `app/`, `components/`, `lib/` (`.ts`, `.tsx`, `.css`). FAIL on any match of `/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/` or `/rgba?\(/` outside `components/plansparency/theme.ts`. Skip a line that ends with `// theme-ok` (for a rare false positive like an anchor link; there should be none today).
   - `app/globals.css`: allowed, but its `background` must equal `C.bg` and its `color` must equal `C.text` (case-insensitive). FAIL otherwise.
   - Print `PASS n / FAIL n`, exit 1 on any fail (same style as `check-terms.ts`).
6. Checks (all `check-*.ts` including the new one) -> `git add components/plansparency/theme.ts components/PlansparencyApp.tsx components/plansparency/StatementDashboard.tsx components/plansparency/CalcPanel.tsx components/plansparency/ui.tsx components/plansparency/nav.tsx components/plansparency/PlanOverview.tsx components/plansparency/PlanGlance.tsx components/plansparency/KeyTermsPanel.tsx components/plansparency/InvestmentsPanel.tsx app/layout.tsx "app/p/[plan_id]/page.tsx" scripts/check-theme.ts` (plus the `git rm` from item 4, plus any extra file you listed) -> commit `refactor(theme): move every hard-coded color into theme tokens, add check-theme` -> push.

## STEP 2: Swap to Sunrise and restyle the pinned bars

1. `theme.ts`: set these values (keep every key, nothing removed):
   ```
   bg "#FFFFFF", surface "#FFFFFF", surfaceAlt "#F3F4F6", border "#D1D5DB", borderLight "#E5E7EB",
   accent "#C2410C", accentDim "rgba(194,65,12,.10)", accentGlow "rgba(194,65,12,.22)",
   green "#166534", greenDim "rgba(22,101,52,.10)", greenGlow "rgba(22,101,52,.20)",
   text "#111827", textMuted "#4B5563", textDim "#646B78",
   userBubble "#F3F4F6", aiBubble "#FFFFFF",
   warning "#854D0E", danger "#B91C1C", dangerDim "rgba(185,28,28,.08)",
   accentText "#A3360A", accentSoft "#FFEDE3",
   warningDim "#FEF3C7", greenSoft "#E6F4EA", dangerSoft "#FEE2E2",
   inputBorder "#9CA3AF", primaryEnd "#CC440C", onPrimary "#FFFFFF",
   accentBorder "#FDBA94", highlight "#FFF3EC",
   field "#FFFFFF", onDanger "#FFFFFF", track "#D1D5DB", thumbRing "#FFFFFF",
   accentTint "rgba(194,65,12,.08)", accentLine "rgba(194,65,12,.20)",
   greenLine "rgba(22,101,52,.20)", dangerLine "rgba(185,28,28,.20)",
   shadow "rgba(17,24,39,.08)", shadowStrong "rgba(17,24,39,.25)",
   overlay "rgba(17,24,39,.60)", overlayStrong "rgba(17,24,39,.75)",
   bar "#1F2937", barLine "#EA580C", barText "#FFFFFF", barMuted "#CBD2DC", barLink "#FDBA74",
   ```
   `CHART`:
   ```
   stocks "#0F766E", bonds "#C2410C", multiAsset "#6B7280", other "#1F2937",
   roth "#2563EB", match "#7C3AED", safeHarbor "#166534", profit "#A16207",
   rollover "#BE185D", rolloverOut "#BE185D", neutral "#6B7280",
   ```
   Notes (do not put in code): `textDim` is `#646B78`, not the board's `#6B7280`, because `#6B7280` on the gray panel is 4.39:1 (fails). `primaryEnd` is `#CC440C`, not `#EA580C`, because white on `#EA580C` is 3.56:1 (fails); `#EA580C` is used only for the bar's bottom line.
2. `app/globals.css`: `color: #111827;` and `background: #FFFFFF;`.
3. Your plan pinned bar, `PlanOverview.tsx` (~line 104), copy board `SunPlan`:
   - Bar: `background: C.bar`, `borderBottom: 2px solid C.barLine`, `boxShadow: 0 8px 20px ${C.shadow}`.
   - "Your plan" label: `color: C.barMuted`. Plan name `h1`: `color: C.barText`.
   - "Your advisor" and "Recordkeeper" small labels: `{ ...small11, color: C.barMuted }` (leave `small11` itself alone; it's used off the bar too).
   - Advisor name and recordkeeper name: `color: C.barText`. Email link and "Log in to your account ↗": `color: C.barLink`.
   - Source chip: reviewed -> `background: C.greenSoft, color: C.green` (unchanged); not reviewed -> `background: C.accentSoft, color: C.accentText` (was `C.accentDim`, which is unreadable on charcoal).
4. Key terms pinned bar, `KeyTermsPanel.tsx` (~line 175), copy board `SunTerms`: same bar background, line and shadow as item 3; `h1` `C.barText`; subtitle `C.barMuted`.
5. Extend `scripts/check-theme.ts` with a contrast check (WCAG formula: relative luminance, ratio = (L1+0.05)/(L2+0.05)). FAIL if under 4.5:
   `text/bg, textMuted/surface, textMuted/surfaceAlt, textDim/surface, textDim/surfaceAlt, accent/surface, accent/accentSoft, accentText/surface, accentText/accentSoft, accentText/highlight, onPrimary/accent, onPrimary/primaryEnd, onDanger/danger, green/greenSoft, green/surface, warning/warningDim, danger/dangerSoft, danger/surface, barText/bar, barMuted/bar, barLink/bar`.
   FAIL if any `CHART` value against `C.surface` is under 3.0 (shapes, not text). Skip pairs where a value is `rgba(`.
   Expected lowest pair: `accent/accentSoft` at about 4.56.
6. Search for leftover ecru: `grep -rniE 'F4EFE6|FDFAF6|EDE8DE|1E1408|B8860B|D4A853|0F1621' app components lib` must return nothing outside comments.
7. Checks -> `git add components/plansparency/theme.ts app/globals.css components/plansparency/PlanOverview.tsx components/plansparency/KeyTermsPanel.tsx scripts/check-theme.ts` -> commit `feat(theme): Sunrise colors, charcoal pinned bars, contrast check` -> push.

## STEP 3: Docs
1. This file: Status -> Done with the three commit hashes and the date.
2. `OPEN-ITEMS.md`: #51 -> "Built (commits), awaiting Ross's click-through". Add to START HERE: "Ross: click through `/advisor/preview` (landing, upload, Your plan, Investments, Calculator, Key terms, statement dashboard, clear session) and `/advisor`. Undo if needed: `git revert` the STEP 2 commit." Add an item: "Cowork: update the Plansparency design system artifact to Sunrise."
3. `MEMORY.md`: "Oct 12, 2026: Sunrise theme chosen. Every color lives in `theme.ts` (`C`, `CHART`); `scripts/check-theme.ts` fails on any color outside it and on contrast under 4.5."
4. `git add "PHASE PROMPTS/PHASE-17-sunrise-theme.md" OPEN-ITEMS.md MEMORY.md ERRORS.md CONTEXT.md CLAUDE.md "PHASE PROMPTS/_TEMPLATE-step.md" "PHASE PROMPTS/PHASE-18-accessibility.md"` (only the ones that changed) -> commit `docs: phase 17 Sunrise theme` -> push.

## Report back
- Three commit hashes. Files changed per step.
- Any color found that was not in the STEP 1 mapping, and which token it got.
- Whether the two `<style>` blocks were identical (merged or not).
- `check-theme.ts` output from STEP 2 (lowest contrast pair and its ratio).

## Checklist (Cowork reviews the diff against the boards before Ross tests)
- [ ] `grep` from STEP 1 finds colors only in `theme.ts` and `app/globals.css`.
- [ ] Page background white `#FFFFFF`; panels `#F3F4F6`; borders `#D1D5DB`; body text `#111827`.
- [ ] Primary buttons and the "P" logo: gradient `#C2410C` -> `#CC440C`, white text.
- [ ] Your plan bar: `#1F2937`, 2px `#EA580C` bottom line, plan name white, labels `#CBD2DC`, links `#FDBA74`, unreviewed chip `#FFEDE3` / `#A3360A`.
- [ ] Key terms bar: same charcoal bar, white title, `#CBD2DC` subtitle.
- [ ] Selected tabs and active states use `#C2410C` (not gold).
- [ ] Statement dashboard legend dots: none gold, none pale blue.
- [ ] Range slider: track `#D1D5DB`, thumb coral with white ring.
- [ ] `/p/[plan_id]` loading/error screen: charcoal with white text.
- [ ] No wording changed anywhere.
