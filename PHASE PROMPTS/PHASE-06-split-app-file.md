# PHASE 06 — Split the 2,500-line app file into smaller files (no visible change)
**Created:** Sept 28, 2026 in Cowork
**Run:** after PHASE-04 (and PHASE-05 if done). `Read "PHASE PROMPTS/PHASE-06-split-app-file.md" and execute all steps in order.` Unattended. 5 steps, 5 commits, each pushed. No checkpoints (pure code moves, every step reversible with a revert).
**Open items covered:** Tech debt "Decompose components/PlansparencyApp.tsx"
**Status:** Ready

---

## Why
`components/PlansparencyApp.tsx` is ~2,500 lines holding 30+ pieces (theme, API calls, every tab, the main app). Every change means Claude Code reads a huge file, edits get riskier, and the whole thing skips type checking (`// @ts-nocheck`). This phase **moves code into smaller files without changing behavior**. A later phase adds types file by file and removes `@ts-nocheck` one file at a time.

**Found by Cowork, will be deleted in Step 1 (defined but never used anywhere):** `SectionIcon`, `PageBackground`, `TrustRow`, `MiniBar`.

## Target layout
```
lib/format.ts                         fmtRounded, fmtDollars, fmtShortAmt, fmtPctVal   (typed, no ts-nocheck)
lib/client/api.ts                     uploadFile, callClaude                            (typed, no ts-nocheck)
components/plansparency/theme.ts      C, F, STAGE, btnBase                              (typed, no ts-nocheck)
components/plansparency/ui.tsx        Md, Fm, LangToggle, Logo, Shield, Modal, StatChip, DonutChart
components/plansparency/nav.tsx       TabBar, PlanGuideTabBar, AppHeader
components/plansparency/KeyTermsPanel.tsx
components/plansparency/InvestmentsPanel.tsx   FundRow, DisclosureCallout, CATEGORY_ORDER, RISK_MAP, FUND_DISCLAIMER, InvestmentsPanel
components/plansparency/PlanDashboard.tsx      SuggestionBox (if only used here; otherwise ui.tsx), PlanDashboard
components/plansparency/CalcPanel.tsx
components/plansparency/StatementDashboard.tsx
components/PlansparencyApp.tsx         main Plansparency component + default export (same path, same props)
```
UI files that are moved keep a first line `// @ts-nocheck` plus `'use client';` for now. Files under `lib/` and `theme.ts` must type-check with NO `@ts-nocheck`.

---

## Rules for Claude Code (every step)

- **Move, don't rewrite.** Cut/paste code exactly. Only allowed edits: adding `export`, adding `import` lines, deleting the 4 dead components listed above. No renames, no logic changes, no styling changes, no "while I'm here" fixes. If you see a bug, note it in the final report instead.
- `components/PlansparencyApp.tsx` must keep the same path, the same default export, and the same props (`app/try/page.tsx` and `app/p/[plan_id]/page.tsx` import it; do not touch those pages).
- Find code by name, not line number.
- Stage only the files the step names (never `git add -A` / `git add .`).
- **Missing-name check after every step (important):** because moved UI files have `@ts-nocheck`, a forgotten import would NOT fail the build; it would crash in the browser. So after each step: temporarily remove the `// @ts-nocheck` line from every file created or edited in that step, run `npx tsc --noEmit 2>&1 | grep -E "TS2304|TS2552|TS2305|TS2307|TS2724"` (cannot find name / module / export), fix ONLY missing imports/exports until that grep is empty, then put `// @ts-nocheck` back exactly as it was. Other TS errors are expected and ignored for now.
- Then `npx tsc --noEmit` (with ts-nocheck restored) and `npm run build` must pass. Node too old → `export PATH="/usr/local/opt/node@25/bin:$PATH"`.
- Then commit + push. Never force-push. Final report: commit hashes, new files with line counts, final line count of `PlansparencyApp.tsx`, and any bugs noticed but not fixed.

---

## STEP 1 — Shared basics + delete dead code

**Check the ground:** `git status` clean except Cowork docs (`*.md` in repo root, `PHASE PROMPTS/`); latest commit is PHASE-04's (or PHASE-05's). `grep -n "SectionIcon\|PageBackground\|TrustRow\|MiniBar" components/PlansparencyApp.tsx` shows each only at its own `function` line (unused). If any is used, do NOT delete it; move it with the others and report.

**Do:**
1. Create `lib/format.ts` (the four `fmt*` helpers, typed as they are) and `components/plansparency/theme.ts` (`C`, `F`, `STAGE`, `btnBase`). Export them; import them in `PlansparencyApp.tsx`; delete the originals there.
2. Delete `SectionIcon`, `PageBackground`, `TrustRow`, `MiniBar`.
3. Checks → `git add lib/format.ts components/plansparency/theme.ts components/PlansparencyApp.tsx` → commit `refactor(app): extract theme + format helpers, remove 4 unused components` → push.

## STEP 2 — API client functions

**Do:** move `uploadFile` and `callClaude` (and any small helper only they use) into `lib/client/api.ts`, typed, no `@ts-nocheck`. They must stay browser-safe (they use `fetch` to our own `/api/*` routes; no server imports, no secrets). Import them in `PlansparencyApp.tsx`.
Checks → `git add lib/client/api.ts components/PlansparencyApp.tsx` → commit `refactor(app): move upload/chat client calls to lib/client/api.ts` → push.

## STEP 3 — Small UI pieces + navigation

**Do:** create `components/plansparency/ui.tsx` (`Md`, `Fm`, `LangToggle`, `Logo`, `Shield`, `Modal`, `StatChip`, `DonutChart`) and `components/plansparency/nav.tsx` (`TabBar`, `PlanGuideTabBar`, `AppHeader`). Each starts with `// @ts-nocheck` then `'use client';`. Export each piece; import where used.
Checks → `git add components/plansparency/ui.tsx components/plansparency/nav.tsx components/PlansparencyApp.tsx` → commit `refactor(app): extract shared UI pieces and navigation` → push.

## STEP 4 — The panels

**Do:** one file each, same header (`// @ts-nocheck`, `'use client';`): `KeyTermsPanel.tsx`, `InvestmentsPanel.tsx` (with `FundRow`, `DisclosureCallout`, `CATEGORY_ORDER`, `RISK_MAP`, `FUND_DISCLAIMER`), `PlanDashboard.tsx` (with `SuggestionBox` if nothing else uses it; if something else does, put `SuggestionBox` in `ui.tsx`), `CalcPanel.tsx`, `StatementDashboard.tsx`, all in `components/plansparency/`. Import in `PlansparencyApp.tsx`.
Checks → `git add components/plansparency/*.tsx components/PlansparencyApp.tsx` → commit `refactor(app): split tab panels into their own files` → push.

## STEP 5 — Tidy + docs

**Do:**
1. Update the comment block at the top of `components/PlansparencyApp.tsx`: it is now the main app shell only; list where each piece moved (one line each); keep `// @ts-nocheck` + reason ("typing happens file by file in a later phase").
2. Stage any modified Cowork doc files (`OPEN-ITEMS.md`, `MEMORY.md`, `ERRORS.md`, `CONTEXT.md`, `PHASE PROMPTS/`).
3. Checks → `git add components/PlansparencyApp.tsx` + those docs → commit `docs: record app split layout` → push.

---

## Ross checks (end of phase, logged in, one pass through everything)
Nothing should look or behave differently. Click through:
- `/try`: language toggle EN/ES, upload a test SPD, the dashboard tiles, **Calculator** (move the slider, enter a DOB), **Key Terms**, **Investments** (upload the Equitable booklet if handy), ask one question in **Ask**.
- Upload a statement PDF (e.g. Fidelity Statement) and see the statement dashboard.
- Open an existing `/p/...` share link.
- Any blank screen or error = tell Cowork which screen. Cowork will check the Vercel logs.
