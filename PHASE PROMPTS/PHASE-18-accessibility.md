# PHASE 18: Accessibility (WCAG 2.2 AA) foundations, fixes and a check script
**Created:** Oct 12, 2026 in Cowork
**Run (Auto mode, walk away), AFTER PHASE-17 is done:** `Read "PHASE PROMPTS/PHASE-18-accessibility.md" and execute all steps in order.` 4 steps, 4 commits, each pushed to `main`. No checkpoints. No new npm packages.
**Open items:** #52 (this), #53 (browser scan with axe, needs Ross to approve an install).
**Status:** Done Oct 12, 2026. STEP 1 `2baf1c7`, STEP 2 `fa751b0`, STEP 3 `cd61425`, STEP 4 docs commit (`docs: phase 18 accessibility`).
**Target:** WCAG 2.2 level AA. This is the benchmark courts and buyers use for "ADA compliant" websites. Code changes alone can't prove compliance: Ross's keyboard + screen reader test (end of this file) and, before public launch, an outside audit are still needed (#53, P3 pre-launch gate).

## Why
Ross, Oct 12: "make sure the pages are ADA compliant." Cowork scanned the code at `2e6a281` (PHASE-17 adds the contrast check; this phase covers everything else).

## What Cowork found (`2e6a281`)
| # | Problem | Where | WCAG |
|---|---|---|---|
| 1 | Focus ring removed (`outline: none`) and no `:focus-visible` style anywhere. Keyboard users can't see where they are. | `PlansparencyApp.tsx` ~689, ~763, ~784; `KeyTermsPanel.tsx` ~188; `StatementDashboard.tsx` ~26; `CalcPanel.tsx` ~44 | 2.4.7, 2.4.11 |
| 2 | Page language is always `en`. In Spanish mode screen readers read Spanish with an English voice. | `app/layout.tsx` line 24 | 3.1.1 |
| 3 | No "Skip to main content" link; sticky header + tabs come first on every page. | app shell | 2.4.1 |
| 4 | Clickable `<div>` (statement summary tiles): mouse only, no keyboard, no role. | `StatementDashboard.tsx` ~180 | 2.1.1, 4.1.2 |
| 5 | `Modal` has no `role="dialog"`, `aria-modal`, title link, focus move, focus trap or Escape. | `ui.tsx` line 33; used in `PlansparencyApp.tsx` ~632, ~713 | 2.1.2, 2.4.3, 4.1.2 |
| 6 | Animations (`pulse`, `shimmer`, `blink`, `fade`) ignore "reduce motion". | `PlansparencyApp.tsx` ~583, ~607, ~732, ~743; `StatementDashboard.tsx` ~50 | 2.2.2, 2.3.3 |
| 7 | 64 places use 9, 10 or 11px text (e.g. statement tile labels are 9px). | 10 files, most in `StatementDashboard.tsx` (22), `CalcPanel.tsx` (14), `InvestmentsPanel.tsx` (10) | 1.4.4 (readability) |
| 8 | Language toggle: 11px text, ~28px tall, no `aria-pressed` (state not announced). Canvas uses 44x36 with `aria-pressed`. | `ui.tsx` `LangToggle` line 16 | 2.5.8, 4.1.2 |
| 9 | About 14 inputs may lack a linked label (Cowork's scan is rough; verify each). | `CalcPanel.tsx` (6), `StatementDashboard.tsx` (2), `Landing.tsx` 181, `app/advisor/page.tsx` 74 and 80, `KeyTermsPanel.tsx` 185, `PlansparencyApp.tsx` 762 | 1.3.1, 3.3.2, 4.1.2 |
| 10 | Only 3 live regions. Upload progress, "reading your document", calculator results and errors are not announced. | app-wide | 4.1.3 |
| 11 | 11 emoji used as icons (read aloud as "books emoji" etc.). | components | 1.1.1 |
| 12 | Only 2 `aria-expanded` (PlanOverview 157, CalcPanel 675). Other open/close controls may not announce state. | components | 4.1.2 |

## Rules for Claude Code
Same rules as PHASE-07. Auto mode, repo root, stage only named files, no deny-list commands, never `git reset/clean/stash`, never force-push. Checks after each step: `npx tsc --noEmit`, `npm run build`, all `scripts/check-*.ts` (run with `npx --yes tsx scripts/<name>.ts`). Colors from `C`, fonts from `F`. EN + ES for every new string (list ES in the report). No em/en dashes. No content wording changes except the new accessibility labels listed here. Do not install packages.

## STEP 1: Foundations (focus, language, skip link, reduced motion, text size)

**Check the ground:** PHASE-17's docs commit is the latest commit; `git status` clean except Cowork docs. Re-run each search in the table above; if a count is very different, list it in the report and fix what you find. If PHASE-17 has not run (no `scripts/check-theme.ts`), STOP.

1. `theme.ts`: add `focus: "#111827"` and `focusOnDark: "#FFFFFF"` to `C`. (Focus rings must be 3:1 against what's next to them: dark ring on white, white ring on the charcoal bar.)
2. One global style (in the `globalCss()` from PHASE-17, or `app/globals.css` with the values the theme check allows; pick one place and say which):
   - `:focus-visible { outline: 2px solid ${C.focus}; outline-offset: 2px; }`
   - `.on-dark :focus-visible { outline-color: ${C.focusOnDark}; }` and add `className="on-dark"` to the two charcoal bars (`PlanOverview.tsx`, `KeyTermsPanel.tsx`) and the `/p/[plan_id]` screen.
   - `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }`
3. Remove every `outline: none` / `outline:none` listed in row 1. Where a text box sits inside a styled wrapper (search box, chat box), keep `outline: none` on the input ONLY if the wrapper gets a visible ring with `:focus-within` (2px `C.focus`). Mark those lines `// a11y-ok: wrapper shows focus`.
4. Page language follows the toggle: wherever `lang` state lives in `PlansparencyApp.tsx`, add a `useEffect` that sets `document.documentElement.lang = lang` (`'en'` or `'es'`). Same on `/advisor` pages if they have a toggle.
5. Skip link: first focusable element in the app shell: `<a href="#main" className="skip-link">Skip to main content</a>` / `Saltar al contenido principal`. Hidden off-screen until focused, then shown top-left (padding 10px 16px, `C.surface` background, `C.text`, 2px `C.focus` border, radius 8, z-index above the sticky bars). Wrap the content area below the tabs in `<main id="main" tabIndex={-1}>` (only one `<main>` per page).
6. Minimum text size 12px: every `fontSize: 9`, `10` or `11` (and `font-size: 9px|10px|11px`) becomes `12`. Uppercase labels stay uppercase. If something then wraps badly, allow wrapping (no fixed heights); do not go below 12.
7. Checks -> `git add` (the files you changed, list them) -> commit `feat(a11y): focus rings, page language, skip link, reduced motion, 12px minimum text` -> push.

## STEP 2: Controls (keyboard, names, states, dialogs)

1. Statement summary tiles (`StatementDashboard.tsx` ~180): `<div onClick>` -> `<button type="button">` with `aria-expanded={open}` and `aria-controls` pointing at the card it opens. Keep the look (reset button styles: `font: inherit; color: inherit; width: 100%`). Keep the hover scale.
2. Every other open/close control (cards, tooltips, "show more", accordions): must be a `<button>` with `aria-expanded`; the panel it controls has an `id` and the button has `aria-controls`. Search for `toggle(`, `setOpen(`, `open ?` and fix each. List them in the report.
3. `Modal` (`ui.tsx`): `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (new optional `titleId` prop; both callers pass the id of their heading). On open: remember the focused element, move focus to the first button inside. Tab and Shift+Tab stay inside the dialog. Escape calls a new optional `onClose` prop (both callers pass their "cancel" action). On close: focus returns to the remembered element.
4. Inputs (row 9): every `<input>`, `<select>`, `<textarea>` has a visible `<label htmlFor>` or, for a search box with a visible icon only, `aria-label`. Placeholder text is never the only label. Hidden file inputs are fine (the visible button opens them). Checkbox labels: the whole label text is clickable.
5. Language toggle (`ui.tsx` `LangToggle`): each button `aria-pressed`, `minWidth: 44, minHeight: 36`, `fontSize: 13`, group `role="group" aria-label="Language"` / `"Idioma"` (copy canvas board `SunMain` header).
6. Every icon-only button has `aria-label` (EN + ES). Every decorative `<svg>` has `aria-hidden="true"`; an svg that carries meaning gets `role="img"` + `aria-label`. Every emoji used as an icon is wrapped `<span aria-hidden="true">`.
7. Main tab bar (`nav.tsx` `TabBar`): the active tab gets `aria-current="page"`; every tab is a `<button>` with visible text.
8. Touch targets: every button and link is at least 24x24px (aim 44px tall where space allows). Fix any smaller ones you find; list them.
9. Checks -> `git add` (list) -> commit `feat(a11y): keyboard-safe controls, dialog focus, labels, states` -> push.

## STEP 3: Announcements and a guardrail script

1. Live regions (one shared `<div role="status" aria-live="polite" className="sr-only">` in the app shell, with a small `announce(text)` helper, is the preferred pattern):
   - Upload: "Reading your document" when it starts, "Your plan is ready" when it finishes (EN + ES).
   - Calculator: the main result summary sentence when an input changes (debounce 600ms).
   - Errors already use `role="alert"`; any error text without it gets it.
   - Add `.sr-only` (visually hidden, still read) to the global style.
2. Charts (`StatementDashboard.tsx`): the graphic gets `aria-hidden="true"` when the same numbers are already shown as text next to it; otherwise `role="img"` with an `aria-label` that lists each part and its amount. Color is never the only way to tell parts apart (each legend dot has its text label).
3. Heading order: one `<h1>` per screen, then `<h2>`/`<h3>` without skipping levels. Fix any skips you find; list them.
4. New `scripts/check-a11y.ts` (header: `// Run with: npx --yes tsx scripts/check-a11y.ts`). Use the `typescript` package that's already installed to parse every `.tsx` in `app/` and `components/` (no regex for JSX). FAIL on:
   - `outline: none` / `outline: 'none'` / `outline:none` unless the line ends with `// a11y-ok: wrapper shows focus`
   - any `fontSize` number under 12, or CSS `font-size` under 12px
   - `onClick` on a `div`, `span`, `li`, `p`, `img` or `svg`
   - `<input>`, `<select>`, `<textarea>` (not `type="file"`/`hidden`) with neither `aria-label`, `aria-labelledby` nor an `id` that a `<label htmlFor>` in the same file points to
   - `<img>` without `alt`; `<svg>` without `aria-hidden` or (`role="img"` + `aria-label`)
   - `<button>` with no text child and no `aria-label`
   - a `role="dialog"` element without `aria-modal` and `aria-labelledby`
   - `app/layout.tsx` `<html>` without `lang`
   Print `PASS n / FAIL n` with file:line for each fail, exit 1 on any fail. Make it pass on the current code.
5. Checks (including the new script) -> `git add` (list, plus `scripts/check-a11y.ts`) -> commit `feat(a11y): announcements, chart text, check-a11y guardrail` -> push.

## STEP 4: Docs
1. This file: Status -> Done with commit hashes and the date.
2. `OPEN-ITEMS.md`: #52 -> "Built (commits), awaiting Ross's keyboard + screen reader test." START HERE: add Ross's test below.
3. `MEMORY.md`: "Oct 12, 2026: Accessibility target is WCAG 2.2 AA. `scripts/check-a11y.ts` and `scripts/check-theme.ts` run on every phase."
4. `git add "PHASE PROMPTS/PHASE-18-accessibility.md" OPEN-ITEMS.md MEMORY.md` (only those that changed) -> commit `docs: phase 18 accessibility` -> push.

## Report back
- Four commit hashes, files per step.
- Every open/close control, touch target and heading you fixed (STEP 2 items 2 and 8, STEP 3 item 3).
- Where the global style lives.
- `check-a11y.ts` output.
- Anything you could NOT fix and why.

## Checklist (Cowork reviews the diff before Ross tests)
- [ ] Tab through `/advisor/preview`: a dark 2px ring is visible on every control; a white ring on the charcoal bars.
- [ ] First Tab press shows "Skip to main content"; Enter jumps past the header and tabs.
- [ ] Switch to ES: `<html lang="es">`.
- [ ] Nothing smaller than 12px.
- [ ] Statement tiles open with Enter and Space.
- [ ] Clear-session dialog: focus starts inside, Tab can't leave it, Escape cancels, focus returns to the button that opened it.
- [ ] Language toggle buttons 44x36, state announced.
- [ ] With "Reduce motion" on (Mac: System Settings > Accessibility > Display), the upload screen does not pulse or shimmer.
- [ ] `check-a11y.ts` and `check-theme.ts` both pass.

## Ross's test after it runs (10 minutes, Mac + Safari)
1. **Keyboard only** (no mouse): Tab, Shift+Tab, Enter, Space, Escape. Upload a document, open three cards on Your plan, use the calculator, switch to Spanish, clear the session. You should always see where you are and never get stuck.
2. **VoiceOver** (Cmd+F5 turns it on and off): open Your plan, press Ctrl+Option+U to open the rotor and look at Headings and Form controls. Every control should have a name that makes sense spoken aloud.
3. **Zoom** to 200% (Cmd + four times): nothing cut off, no sideways scrolling on the phone width.
Note anything odd in OPEN-ITEMS #52.
