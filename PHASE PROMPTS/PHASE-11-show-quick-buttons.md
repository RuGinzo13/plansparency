# PHASE 11 — Make the quick-question buttons show up (PHASE-10 fix)
**Created:** Oct 4, 2026 in Cowork
**Run (Auto mode, walk away):** `Read "PHASE PROMPTS/PHASE-11-show-quick-buttons.md" and execute all steps in order.` 2 steps, 2 commits, each pushed. No checkpoints.
**Open items:** #39 (stock answers), #40 (this bug).
**Status:** Done, Oct 4, 2026 (STEP 1 `131cbce`)

## Why
Ross, Oct 4: "where are all the button taps we implemented in phase 10? I don't see anything."
Cowork traced it in the code (`27e6f7e`): the buttons are built but can never appear for a plan document.
- `components/PlansparencyApp.tsx` ~line 437: `const showChips = stage === "chat" && !loading && lastMsg?.role === "assistant";`
- A plan document (self-upload and `/p` invite links) runs in `stage === STAGE.APP` ("app"), with Chat as a tab. `stage === "chat"` only happens in the **statement** flow.
- The stock-answer buttons are switched off for statements (`stockChipsOn` needs `docType !== "statement"`).
- Result: plan documents never show buttons, statements show the old 6 AI buttons. The 8 stock answers are unreachable. This gate predates PHASE-10 (it is in the first Next.js build), so plan-document chat has had no quick buttons for a long time. PHASE-10's checks only tested the answer text, not the screen.

## Rules for Claude Code
Same rules as PHASE-07 (read its "Rules for Claude Code" once). Auto mode, repo root, stage only named files, no deny-list commands, never `git reset/clean/stash`, never force-push. Checks after each step: `npx tsc --noEmit`, `npm run build`, `npx --yes tsx scripts/check-calc.ts`, `npx --yes tsx scripts/check-answers.ts`.

## STEP 1 — Show the buttons in the plan-document Chat tab

**Check the ground:** `git status` clean except Cowork docs (`*.md`, `PHASE PROMPTS/`). Latest commit is `27e6f7e` (PHASE-10 docs). Open `components/PlansparencyApp.tsx` and confirm: (a) `showChips` is defined with `stage === "chat"`; (b) `chatPanel` is declared inside `if (stage === STAGE.APP)`; (c) `showChips` is used in exactly 2 places (inside `chatPanel`, and in the statement chat at the bottom of the file). If any of these is not true, STOP and report.

**Files you may change:** `components/PlansparencyApp.tsx` only.

**Do:**
1. Change the one line to:
   `const showChips = (stage === STAGE.CHAT || stage === STAGE.APP) && !loading && lastMsg?.role === "assistant";`
   (`chatPanel` only renders when the Chat tab is open, so no `activeTab` check is needed.)
2. Nothing else. Do not change button labels, styles, `onChip`, `stockChipsOn`, Spanish behavior or the statement flow.

**Check your work:** the four checks above, plus search the file and confirm no other `stage === "chat"` string remains that hides chat features from `STAGE.APP` (report any you find, do not change them).

**Commit and push:** `git add components/PlansparencyApp.tsx` → commit `fix(chat): show quick-question buttons in the plan document chat tab` → push.

## STEP 2 — Docs
1. In `OPEN-ITEMS.md`: mark #40 done with the Step 1 commit hash. In this file set **Status:** Done with the hash.
2. `git add OPEN-ITEMS.md ERRORS.md MEMORY.md CONTEXT.md CLAUDE.md "PHASE PROMPTS/"` (only files that are modified) → commit `docs: phase 11 quick buttons fix` → push.

## Report back
- Both commit hashes, files changed, anything unexpected.

## Done when (Ross checks, after Vercel shows Ready)
1. `/` in English, upload a test SPD, open the **Chat** tab: 8 buttons show under the plan summary.
2. Tap "How does my employer match work?": answer appears instantly (no typing dots) with the badge "From your plan document".
3. Tap a button whose detail is missing from the plan: it goes to the AI (typing dots), no badge.
4. Switch to Spanish: the old 6 buttons show and go to the AI.
5. Statement upload: unchanged (6 AI buttons in its chat).
