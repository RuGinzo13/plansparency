# PHASE 03 — Clear upload errors (EN/ES) + housekeeping
**Created:** Sept 28, 2026 in Cowork
**Run:** full phase, unattended. 2 steps, 2 commits, each pushed. No checkpoints (nothing irreversible; the branch delete refuses unless already merged).
**Open items covered:** OPEN-ITEMS.md #8, #9, #10, #14, tech debt "retired plansparency-mvp.jsx in repo"
**Not covered on purpose:** #7 (the "4.5 MB" vs "25 MB" upload limit). That waits for Ross's 12 MB upload test, because Vercel's docs say function request bodies max out at 4.5 MB. See OPEN-ITEMS #7/#12.
**Status:** Ready (run only after Phase 02 Step 3 is confirmed done)

---

## How Ross runs this

One fresh Claude Code conversation:

`Read "PHASE PROMPTS/PHASE-03-upload-errors-cleanup.md" and execute all steps in order.`

Claude Code commits and pushes after each step and stops at the first failed check. When it finishes, do the "Ross checks" at the bottom, then tell Cowork.

---

## Rules for Claude Code (every step)

- Execute the steps in order. Before each step, do its "Check the ground". If anything doesn't match, STOP and report. Do not guess.
- Change only the files a step lists. Stage only those files (never `git add -A` / `git add .`).
- Find code by searching for names or text, not line numbers (line numbers move).
- EN and ES only. Every new user-facing string needs both, word for word as written here.
- `components/PlansparencyApp.tsx` keeps its `// @ts-nocheck`. Do not remove it.
- After each step: `npx tsc --noEmit` and `npm run build` must pass before committing (if Node is too old: `export PATH="/usr/local/opt/node@25/bin:$PATH"`). Then commit + push. Never force-push or rewrite history.
- At the end, report every commit hash, files changed per step, and anything unexpected.

---

## STEP 1 — Plain-language upload errors in EN and ES, and fix the cancel mix-up

**Why:** When an upload fails, participants can see raw browser text like "Failed to fetch", and the 429/504/413 messages are English-only. Separately, the "analyze" step reads the cancel signal after the upload finishes, so starting a second upload can cancel the first one's analysis (code-review Finding #4).

**Check the ground**
- `git status` and `git log --oneline -3`. The latest commit must be Phase 02 Step 3 (`feat(calc): limit tracker + 2026 Roth catch-up rule card (EN/ES)`). If it isn't, STOP.
- Allowed uncommitted changes (Cowork's doc edits): `CLAUDE.md`, `MEMORY.md`, `OPEN-ITEMS.md`, anything under `PHASE PROMPTS/`. Leave them alone until Step 2. Anything else changed = STOP.
- `grep -n "const analyzeSignal = abortRef.current.signal" components/PlansparencyApp.tsx` should find 2 places (the two upload handlers). `grep -n "userMsg" components/PlansparencyApp.tsx` should find the error mapping in `processUpload`. Report what you find if it differs.

**Files you may change:** `components/PlansparencyApp.tsx`, `lib/i18n/index.ts`

**Do not touch:** `app/api/ingest/route.ts`, `app/advisor/page.tsx`, the chat engine, the calculator, anything else.

**Do this**
1. Add these keys to `lib/i18n/index.ts` under both `en` and `es`:

   | Key | EN | ES |
   |---|---|---|
   | `errUploadNetwork` | The upload lost its connection before it finished. Check your internet and try again. Bigger files take longer. | La carga perdió la conexión antes de terminar. Revisa tu internet e inténtalo de nuevo. Los archivos más grandes tardan más. |
   | `errUploadTooLarge` | This file is too big for us to upload right now. Try a smaller PDF, like just the pages about your plan. | Este archivo es demasiado grande para cargarlo en este momento. Prueba con un PDF más pequeño, como solo las páginas sobre tu plan. |
   | `errRateLimit` | Too many requests. Please wait a minute and try again. | Demasiadas solicitudes. Espera un minuto e inténtalo de nuevo. |
   | `errTimeout` | This is taking longer than expected. Try again, or try a smaller document. | Esto está tardando más de lo esperado. Inténtalo de nuevo o prueba con un documento más pequeño. |

2. In `processUpload`'s catch block, replace the English `userMsg` lines with:
   - `status === 429` → `t.errRateLimit`
   - `status === 504` → `t.errTimeout`
   - `status === 413` → `t.errUploadTooLarge`
   - No status AND (`e instanceof TypeError` OR message matches `/Failed to fetch|Load failed|NetworkError/i`) → `t.errUploadNetwork`
   - Anything else → `t.errorRead` (do NOT show raw `e.message` to the user; keep the existing `console.error` so it's still in logs).
3. Apply the same mapping in any other upload handler that shows an upload error to the user (search for `setUploadError(` inside catch blocks). If a handler has no user-facing error, leave it.
4. Cancel fix in BOTH upload handlers that contain `const analyzeSignal = abortRef.current.signal`: create the controller once as a local (`const ctrl = new AbortController(); abortRef.current = ctrl;`) and use `ctrl.signal` for both the upload and the analyze call. Remove the later read of `abortRef.current.signal`. Keep every other line of those handlers the same.
5. Checks pass, then stage ONLY `components/PlansparencyApp.tsx lib/i18n/index.ts`. Commit: `fix(upload): plain-language EN/ES upload errors; cancel signal captured once (Finding #4)`. Push.

---

## STEP 2 — Housekeeping

**Why:** Small leftovers that confuse future work.

**Check the ground**
- Step 1's commit is the latest.
- `git branch -a --merged main` must list `dashboard-redesign` and `remotes/origin/dashboard-redesign`. If it's NOT listed as merged, skip item 3 and report.
- `grep -rn "plansparency-mvp" --include=*.ts --include=*.tsx --include=*.js --include=*.mjs --include=*.json . | grep -v node_modules` must return nothing. If anything imports or references it, skip item 2 and report.

**Files you may change:** `app/advisor/layout.tsx` (comment only), delete `plansparency-mvp.jsx` (repo root only). Plus commit Cowork's doc edits: `CLAUDE.md`, `MEMORY.md`, `OPEN-ITEMS.md`, `PHASE PROMPTS/` (only those that show as modified or new).

**Do not touch:** the file one level ABOVE the repo also named `plansparency-mvp.jsx`, and the `app/` folder above the repo. They're outside git; leave them.

**Do this**
1. In `app/advisor/layout.tsx`, replace the comment that says the advisor area is "OPEN (pilot mode)" with: `// No Clerk key configured: Clerk is skipped here. Access is still protected by the Basic Auth gate in middleware.ts (all of /advisor always requires the password).` No code changes.
2. `git rm plansparency-mvp.jsx` (the retired prototype in the repo root).
3. Delete the merged branch: `git branch -d dashboard-redesign` (lowercase `-d`, which refuses if not merged) and `git push origin --delete dashboard-redesign`.
4. Checks pass, then stage ONLY `app/advisor/layout.tsx`, the removal of `plansparency-mvp.jsx`, and the allowed doc files. Commit: `chore: fix stale advisor comment, remove retired prototype from repo; docs update`. Push.

---

## Ross checks (after both steps; logged in, incognito)
- Upload a normal test SPD: works exactly as before.
- Start an upload, then switch to Spanish and trigger an error if you can (easiest: turn Wi-Fi off mid-upload). The message should be the plain Spanish one, never "Failed to fetch".
- Vercel shows both deployments Ready.
- GitHub no longer lists a `dashboard-redesign` branch.
