# PHASE 01 — Stabilize: save the docs, fix the keep-alive, lock the site
**Created:** Sept 28, 2026 in Cowork
**Open items covered:** OPEN-ITEMS.md #2, #5, #1
**Status:** ✅ PHASE COMPLETE (Sept 28, 2026). Step 1 `6fc4269`+`0fe1d44` (by hand) · Step 2a `8d53a79` (cron 200) · Step 2b `a46e66e` · Step 3 `f412806` (Ross checks 1-4 passed; advisor upload → share link → question passed)

---

## How Ross runs this (read this part, Claude Code ignores it)

This phase has **3 steps. Run ONE step per fresh Claude Code conversation**, in order. Do not start the next step until the "Ross checks" list for the current one passes.

In VS Code, open the **Claude Code** panel (not Copilot), start a new conversation, and type exactly:

- Step 1: `Read "PHASE PROMPTS/PHASE-01-stabilize.md" and execute STEP 1 only. Stop when Step 1 is done.`
- Step 2: `Read "PHASE PROMPTS/PHASE-01-stabilize.md" and execute STEP 2 only. Stop when Step 2 is done.`
- Step 3: `Read "PHASE PROMPTS/PHASE-01-stabilize.md" and execute STEP 3 only. Stop when Step 3 is done.`

After each step: check the Vercel deployment is **Ready** with the step's commit message, do the "Ross checks" list, then tell Cowork. Cowork updates this file's Status line and the .md files.

If anything in a step looks wrong, stop and bring it back to Cowork. Don't ask Claude Code to improvise a fix.

---

## Rules for Claude Code (apply to every step)

- Execute ONLY the step you were told to. Do not read ahead and do not do other steps.
- Always do that step's "Check the ground" first. If what you find does not match what the step expects, STOP and report. Do not guess.
- Change only the files the step lists. Nothing else.
- Never force-push. Never invent passwords, keys, or test values.
- Finish by reporting: commit hash, files changed, anything unexpected.

---

## STEP 1 — Commit the updated docs and this folder
**Why:** Cowork updated the project's .md files and created this `PHASE PROMPTS/` folder. They need to be in git so GitHub stays the source of truth.

**Check the ground**
- Run `git status` and `git log --oneline -3`.
- Expected: branch `main`, last commit `71f9357`, changes ONLY in `CLAUDE.md`, `CONTEXT.md`, `MEMORY.md`, `ERRORS.md`, new `OPEN-ITEMS.md`, new `PHASE PROMPTS/` folder, and the untracked `.claude/401k_Plansparency.code-workspace`.
- If any app code file (`app/`, `components/`, `lib/`, `middleware.ts`, config files) shows as changed, STOP and report.

**Files you may change:** none. Stage and commit only.

**Do not touch:** do not edit any file. Do NOT stage `.claude/401k_Plansparency.code-workspace`.

**Do this**
1. `git add CLAUDE.md CONTEXT.md MEMORY.md ERRORS.md OPEN-ITEMS.md "PHASE PROMPTS"`
2. Run `git status` again and confirm only those paths are staged.
3. Commit: `docs: Sept 27-28 catch-up, OPEN-ITEMS.md, PHASE PROMPTS workflow`
4. Push to `main`.

**Ross checks**
- Vercel shows a new Ready deployment with that commit message. The live site looks exactly the same (docs only).

---

## STEP 2 — Fix the Supabase keep-alive (it has never worked)
**Why:** The daily keep-alive asks the `plans` table for a column named `id`. That column does not exist (the key is `plan_id`), so the ping has failed every day since June 4. Supabase shut the project down for inactivity. Cowork restored it on Sept 28. Without this fix it shuts down again in about a week.
**Runtime:** Node.js (unchanged)

**Check the ground**
- Run `git status` and `git log --oneline -3`. Expected: latest commit `0fe1d44` ("docs: add PHASE PROMPTS README and step template"). The only changes allowed are Cowork's doc edits: `ERRORS.md`, `OPEN-ITEMS.md`, `PHASE PROMPTS/PHASE-01-stabilize.md`. Leave those alone during 2a; they get committed in 2b. Anything else changed = STOP and report.
- Run `ls app/api/ lib/`.
- Open `app/api/keepalive/route.ts` and confirm it contains `.select('id', { count: 'exact', head: true })`. If not, STOP and report what you see.

**Files you may change:** `app/api/keepalive/route.ts`

**Do not touch:** everything else. Especially `vercel.json`, the cron schedule, the `CRON_SECRET` logic, `lib/supabase-server.ts`, `supabase/schema.sql`.

**Do this**
1. Change `.select('id', { count: 'exact', head: true })` to `.select('plan_id', { count: 'exact', head: true })`.
2. In both failure paths (the `if (error)` block and the `catch` block), add `console.error('[keepalive] failed:', <the error message>)` before returning, so failures show in Vercel logs.
3. Update the header comment: the query must use a column that really exists (`plan_id`); a failing query is why the project paused in Sept 2026.
4. Type check: `npx tsc --noEmit` (if it fails on Node version, use `export PATH="/usr/local/opt/node@25/bin:$PATH"` first). Must pass.
5. Confirm `grep -rn "select('id'" app lib` returns nothing.
6. Stage ONLY this file: `git add app/api/keepalive/route.ts` (never `git add -A` or `git add .`). Commit: `fix: keepalive queried nonexistent plans.id column, Supabase paused`
7. Push to `main`. Report the full new contents of `app/api/keepalive/route.ts`.

**Step 2b — housekeeping, separate commit (run as its own conversation: "execute STEP 2b only")**
Check the ground: `git status` and `git log --oneline -3`. Expected: latest commit `8d53a79` (the keep-alive fix). Only allowed changes: `ERRORS.md`, `OPEN-ITEMS.md`, `PHASE PROMPTS/PHASE-01-stabilize.md`, and possibly `CONTEXT.md`, `MEMORY.md` (Cowork doc edits). Anything else = STOP and report.
`.claude/401k_Plansparency.code-workspace` was committed by accident in `0fe1d44` (a local VS Code file, no secrets). Remove it from git WITHOUT deleting it from disk:
1. `git rm --cached ".claude/401k_Plansparency.code-workspace"`
2. Add the line `*.code-workspace` to `.gitignore` (append at the end, do not reorder anything else).
3. Confirm the file still exists on disk (`ls .claude/`).
4. Also stage Cowork's doc edits: `git add` whichever of `ERRORS.md OPEN-ITEMS.md CONTEXT.md MEMORY.md "PHASE PROMPTS/PHASE-01-stabilize.md"` show as modified. `git status` should show only: `.gitignore` modified, the workspace file removed from the index, and those three docs.
5. Commit: `chore: stop tracking local VS Code workspace file; docs: Step 1 done`
6. Push to `main`. Do NOT rewrite history (no amend, no rebase, no force-push).

**Ross checks**
- Vercel deployment Ready with that commit message.
- Vercel → project `plansparency` → Settings → Cron Jobs → click **Run** next to `/api/keepalive`. Then open Logs: that request shows **200**, not 500.
- A Ready deploy alone does NOT count. The cron must actually succeed once.

---

## STEP 3 — Put the whole site behind the advisor password until compliance approves
**Why:** Compliance (OBA) hasn't been asked yet, and CLAUDE.md says nothing is public-facing before written approval. Today anyone can open the site and upload documents on Ross's API bill. This locks every page behind the password that already protects `/advisor`. Building continues normally; Ross logs in once per browser. After approval, Ross adds `SITE_PUBLIC` = `true` in Vercel env vars and redeploys. No code change needed to reopen.
**Runtime:** middleware (unchanged)

**Check the ground**
- Run `git status` and `git log --oneline -3`. Expected: Step 2b's commit ("chore: stop tracking local VS Code workspace file; docs: Step 1 done") is the latest, working tree clean.
- Run `ls app/ app/api/`.
- Open `middleware.ts` (repo root). Confirm it is the Basic Auth gate with `matcher: ['/advisor/:path*', '/api/save-plan']`. If different, STOP and report.
- Note: Next.js 16 prefers the name `proxy.ts`, but `middleware.ts` is live and verified working. Do NOT rename it.

**Files you may change:** `middleware.ts`

**Do not touch:** everything else, including `app/advisor/layout.tsx`, all API routes, `vercel.json`, `next.config.mjs`.

**Do this**
1. Change the matcher so the middleware runs on everything EXCEPT `/api/keepalive` (the daily cron must reach it without a password), `_next/static`, `_next/image`, and `favicon.ico`. Use one negative-lookahead matcher, e.g. `'/((?!api/keepalive|_next/static|_next/image|favicon.ico).*)'`.
2. "Always private": paths starting with `/advisor`, and `/api/save-plan`, ALWAYS require the password no matter what.
3. "Site open" switch for every other path: only if `process.env.SITE_PUBLIC === 'true'`, return `NextResponse.next()`. Missing or any other value = locked (fail-closed).
4. Keep existing fail-closed behavior: if `ADVISOR_ACCESS_PASSWORD` is missing, protected paths return 401.
5. The 401 response is written out three times today. Build it once in a small helper inside the file and reuse it.
6. Add a short comment block at the top explaining the two rules and how to reopen later (`SITE_PUBLIC=true` in Vercel, then redeploy).
7. Type check: `npx tsc --noEmit`. Must pass.
8. Re-read the final file and confirm: `/api/keepalive` is excluded; `/advisor` and `/api/save-plan` can never be opened by `SITE_PUBLIC`; nothing is open when env vars are missing.
9. Commit: `feat(security): lock whole site behind Basic Auth until OBA approval (SITE_PUBLIC to open)`
10. Push to `main`.
11. After Vercel shows Ready, run ONLY these checks: `curl -s -o /dev/null -w "%{http_code}" https://plansparency.vercel.app/` (expect 401) and the same for `https://plansparency.vercel.app/api/keepalive` (expect NOT 401). Do NOT test with any password. You don't know it and must not guess one.
12. Report the full new `middleware.ts` and both curl results.

**Ross checks (incognito window)**
- plansparency.vercel.app shows the browser password prompt.
- After the password: landing page loads, "Try it free" works, and uploading a test SPD gets a full answer (proves the upload and chat calls carry the login).
- An existing `/p/...` share link loads after login.
- Then do OPEN-ITEMS #4: advisor upload → share link opens.
- If the upload fails after login, STOP and tell Cowork.
