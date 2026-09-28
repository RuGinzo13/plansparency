<!-- Template for ONE step inside a PHASE-NN file. Copy this block per step.
     Phase header: **Run:** `Read "PHASE PROMPTS/PHASE-NN-name.md" and execute all steps in order.`
     Every step MUST end with: checks pass -> exact `git add <files>` -> exact commit message -> push.
     The LAST step MUST also stage any modified Cowork docs (CLAUDE.md, CONTEXT.md, MEMORY.md, ERRORS.md, OPEN-ITEMS.md, PHASE PROMPTS/).
     Only use a 🛑 CHECKPOINT before an irreversible action.
     Commands: only forms allowed in .claude/settings.json; run from repo root; no `cd x && git`; no `$(...)`. -->
## STEP N — Short title
**Status:** Ready | Done (commit `abc1234`, YYYY-MM-DD)
**Open item:** OPEN-ITEMS.md #__
**Runtime (if an API route is touched):** Edge / Node.js

## Why
One or two sentences, plain language.

## Step 0 — Check the ground (do not skip)
Run `git status` and `git log --oneline -3`. Run `ls app/ components/ lib/` plus any folder below. If the working tree is not clean, or anything does not match what this prompt expects, STOP and report. Do not guess.

## Files you may change
- `path/one`

## Do not touch
- Everything else. Especially: ...

## Changes
1. ...

## Check your work
- Type check: ...
- Search to confirm: ...

## Commit and push
Commit: "type: description"
Push to `main`. Never force-push.

## Report back
- Commit hash
- Files changed
- Anything unexpected

## Done when (Ross checks)
- Vercel deployment Ready with the commit message above
- Live: ...
