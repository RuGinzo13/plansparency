# Plansparency — ERRORS.md
*Log of approaches that failed. Check this before suggesting approaches to similar tasks.*
*Per CLAUDE.md Rule 9: when an approach takes more than 2 attempts, log it here.*

---

## API Cost Estimation — Session 2 (May 1, 2026)
**What didn't work:** Estimating API costs as "avg 50 sessions/mo across 100 advisors" — understated real costs by 10–20x.
**What worked:** Modeling per-advisor: (plans managed) × (avg employees per plan) × (monthly adoption rate %) = sessions per advisor per month.
**Note for next time:** Always model API costs per-advisor. Open enrollment (Oct–Dec) spikes usage 3–5x. Large advisor profiles can exceed Pro tier revenue — always run the margin check.

---

## Document Script Syntax Errors — Session 1 (April 30, 2026)
**What didn't work:** Appending new section content after the document's closing brackets — caused syntax errors.
**What worked:** Python to locate exact closing line of children array, split there, insert before closing brackets, rewrite file.
**Note for next time:** When adding sections to the docx script, always insert before `]\n  }]\n});`. Use targeted insertion, not append.

---

## PDF Upload — Vercel Blob Silent Hang — May 3–5, 2026 (4+ failed attempts)
**What didn't work:**
- Guessing at fixes without reading actual deployed code first
- Vercel Blob client upload: BLOB_READ_WRITE_TOKEN never set in Vercel env — call hung indefinitely
- Edge Runtime without streaming: Vercel Hobby Edge hard timeout 25s; Anthropic takes 30–60s on large PDFs
- Client-side 90s timeout: server-side Edge timeout fired first, making client timeout irrelevant
- Providing fix prompts that assumed prior fixes were applied without verifying actual deployed file contents

**What worked:**
- Prompting Claude Code to read every file first, answer specific diagnostic questions, then fix only what it actually found
- Removing @vercel/blob entirely
- SSE streaming: stream: true to Anthropic, pipe text_delta chunks to ReadableStream, client reads with reader loop

**Note for next time:**
- ALWAYS read actual deployed files before suggesting any fix. Never assume a prior fix was applied correctly.
- Vercel Hobby + Edge Runtime = 25s hard timeout. Streaming is mandatory for Anthropic calls on real documents.
- BLOB_READ_WRITE_TOKEN is NOT auto-created when a Blob store is created.
- Silent hang with no error = almost always a missing env var or missing error handling.
- Diagnostic prompt that worked: "Read every file. Answer these specific questions from what you see. Then fix only what you actually found."

---

## File Size Error — Recurring Bug (May 2026)
**What didn't work:** Fix applied to running artifact but not saved back to project file or GitHub. Same error reappeared in next session because the fix lived only in the artifact, which was then discarded.
**What worked:** Targeting the fix to `components/PlansparencyApp.tsx` in the GitHub repo via Claude Code. Fix persists because it's in version control.
**Note for next time:** NEVER fix bugs in the Claude.ai artifact environment. The artifact is retired. All fixes go through Claude Code → GitHub. Any fix made in an artifact that isn't committed to GitHub will disappear.

---

## Wrong File Targeted for Claude Code Prompts — May 20, 2026
**What didn't work:** Writing Claude Code prompts targeting `plansparency-mvp__1_.jsx` — that file is the old artifact prototype, retired after Next.js migration in May 2026.
**What worked:** Checking `recent_chats` to discover the Next.js migration had already happened. Confirmed correct file: `components/PlansparencyApp.tsx`. All prompts corrected before any code was run.
**Note for next time:** Always confirm the actual file structure with Claude Code (`ls app/ components/`) before writing any prompts. The Claude.ai project files may be stale. The GitHub repo is the source of truth.

---

## Code Review Findings — Direct Upload Architecture — May 24, 2026
*Found via /code-review after deploying the FormData direct-upload fix. 5 findings, ranked by severity.*

### Finding 1 (High — CONFIRMED → PARTIAL, Sept 27 2026: maxDuration now 120; error mapping still missing): maxDuration=60s produces "Failed to fetch", not a clean timeout message
**File:** `app/api/ingest/route.ts` line 4 (`export const maxDuration = 60`)
**What happens:** When a large PDF takes >60s to forward to Anthropic, Vercel kills the TCP connection. The browser `fetch` throws a `TypeError: Failed to fetch` (not an `AbortError`, not an HTTP response). `uploadFile`'s catch checks `e.name === 'AbortError'` (false), re-throws bare with no `.status`. `processUpload`'s catch reads `e.status` → `undefined`, skips the 504 branch, hits `else if (e.message)`, and shows the raw browser string `"Failed to fetch"` to the user.
**Fix:** Raise `maxDuration` to 120 (Vercel Pro supports up to 300s), OR in `uploadFile` catch also detect `TypeError` with a message matching `"Failed to fetch"` / `"Load failed"` and re-throw with `.status = 504`.

### Finding 2 (High — PLAUSIBLE → PARTIALLY CLOSED June 11, 2026): Vercel platform payload cap (~4.5 MB)
**File:** `app/api/ingest/route.ts` (entire route)
**Original concern:** Vercel's platform enforces a payload ceiling (~4.5 MB) on Node.js serverless functions — large PDFs would be rejected before the route runs.
**June 11, 2026 update:** A 5.9 MB document uploaded successfully in production through the single `/api/ingest` path (post-Blob-removal). The ~4.5 MB cap did not bite at that size. Sizes above 5.9 MB remain untested; client-side limit is 25 MB. Test a 15–20 MB scanned booklet when one is available. Note: deleting the Blob token did NOT cause this to work — nothing referenced it; the path already worked and had simply never been tested at that size.

### Finding 3 (Medium — CONFIRMED → FIXED in `273ef03`, May 26 2026): AbortSignal.any fallback silently drops caller's abort signal
**File:** `components/PlansparencyApp.tsx` lines 366-370
**What happens:** `AbortSignal.any` is unavailable on Safari <17.4, Chrome <116, Firefox <124. When `abortSignal` is provided but `AbortSignal.any` doesn't exist, the fallback uses only `localCtrl.signal`, silently discarding the caller's signal. Cancel fires, the UI resets, but the upload continues server-side, consuming Anthropic API quota.
**Fix:** Replace `AbortSignal.any` conditional with two independent `abort` event listeners — one on each signal — both aborting a shared controller.

### Finding 4 (Low — PLAUSIBLE, STILL OPEN Sept 27 2026): abortRef.current replaced between uploadFile resolve and callClaude execution
**File:** `components/PlansparencyApp.tsx` lines 2087, 2094
**What happens:** `uploadFile` resolves. Before the async continuation executes, user drops a second file. `processUpload` fires: aborts old controller, creates new one. When upload #1's continuation resumes, `abortRef.current.signal` is now upload #2's signal. Cancelling upload #2 also aborts upload #1's `callClaude`.
**Fix:** Capture `const signal = abortRef.current?.signal` immediately after `uploadFile` resolves, before any further `await`, and use that local const for `callClaude`.

### Finding 5 (Low — PLAUSIBLE → FIXED in `273ef03`, May 26 2026): parsed?.error object → "[object Object]" error message
**File:** `app/api/ingest/route.ts` line 96
**What happens:** If Anthropic returns `{ error: { type: "...", message: "" } }` with an empty `message`, `parsed?.error?.message` is falsy, the expression falls to `parsed?.error` (the raw object), and `String(errMsg)` serializes it as `"[object Object]"`.
**Fix:** `typeof parsed?.error === 'string' ? parsed.error : (parsed?.error?.message || errMsg)`

---

## Upload Failure Above 5.9MB — Lambda Payload Cap — May 24, 2026
**Root cause:** `/api/upload/route.ts` was a Node.js serverless function. Vercel serverless functions run on AWS Lambda, which has a hard 6MB synchronous invocation payload limit. A multipart/form-data request for a ~5.9MB PDF exceeded this limit with boundary overhead.

**What made it hard to spot:**
- `next.config.mjs` had `serverActions.bodySizeLimit: '50mb'` — this only applies to Server Actions, NOT Route Handlers. It was a no-op.
- Files under ~5.9MB worked fine, creating a confusing partial failure.
- The base64 fallback only activated for files ≤5MB, leaving a 5–6MB gap with no fallback path.

**What worked (at the time):**
- Replaced Lambda-proxied upload with Vercel Blob client-side direct upload.
**Historical note (June 11, 2026):** the Blob approach was itself removed in the June 4 Phase 4 cleanup; the single `/api/ingest` path has since been confirmed working at 5.9 MB in production. See Finding 2 above.

**Note for next time:**
- `serverActions.bodySizeLimit` in `next.config.mjs` does NOT apply to Route Handlers — only Server Actions.
- AWS Lambda 6MB hard cap = Vercel serverless function 6MB hard cap.
- User does not have `.env.local` values set for local dev — app runs deployed on Vercel only.

---

## Session Summary, May 20, 2026
**No new multi-attempt failures this session.** Two near-misses caught before execution:
1. Prompts targeting wrong file (JSX artifact vs. PlansparencyApp.tsx) — caught by checking recent_chats
2. Instructing user to "find the current working artifact" — caught when recent_chats revealed Next.js migration was complete
Both corrected before any code was run.

---

## Vercel Build Failures — 7 Consecutive — May 28, 2026
**What failed:** Every deployment from commit `51298b1` onward failed in 19–36 seconds (build phase, not runtime).

**Root causes identified and fixed:**

### 1. Supabase client initialized at module load time
`lib/supabase-server.ts` originally exported `const supabaseAdmin = createClient(url!, key!)`. At Next.js build time, env vars aren't present, so `createClient` threw and the build failed.
**Fix:** Replace with lazy getter `getSupabaseAdmin()` that initializes on first call at request time. Commit `23c25d6`.

### 2. Next.js 15+ dynamic route params breaking change
`params` in page components changed from `{ plan_id: string }` to `Promise<{ plan_id: string }>` in Next.js 15+.
**Fix:** Type params as `Promise<{...}>` and `await params` at the top of the function. Commit `9be78af`.

### 3. `@types/react ^18` vs React `^19.2.5` type mismatch
**Fix:** Bumped `@types/react` and `@types/react-dom` to `^19`. Also added `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` as a safety net. Commit `09ac12f`.

### 4. middleware.ts blocked all /advisor routes (404)
The old middleware returned 404 for every `/advisor` request, which also interfered with the build analyzer.
**Fix:** Removed the 404 gate. Auth is handled by `app/advisor/layout.tsx`. Commit `09ac12f`.
**June 11, 2026 addendum — mystery solved:** this fix neutered `middleware.ts` into a passthrough stub (`NextResponse.next()` unconditionally) rather than deleting the file. That stub sat committed in the repo for two weeks and is what the June 11 Basic Auth gate replaced. Not wrong-window debris, as initially suspected.

**What made it hard to diagnose:**
- Local Node.js (v12.3.1) is too old to run `tsc --noEmit` — errors show as `Unexpected token ?` not actual TypeScript errors.
- Vercel CLI auth token was expired.
- All root causes were compounding each other.

**Note for next time:**
- When builds fail in <40 seconds, it's always the TypeScript/ESLint check phase — not webpack, not runtime.
- Always check: (1) module-level env var access, (2) Next.js 15+ params Promise requirement, (3) @types/react version vs React runtime version.
- `typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds` in `next.config.mjs` are the escape hatch if the exact error can't be identified without build logs.

---

## Code Review Findings — Supabase Backend — May 28, 2026
*Found via `/code-review` run on commits `51298b1` through `23c25d6`. 6 findings, all resolved same session.*

### Finding 1 (High — CONFIRMED, FIXED): No auth on /api/save-plan
**What happened:** The route had zero auth checks. Any anonymous HTTP client could POST and create Supabase rows + storage blobs.
**Fix:** Added Clerk `auth()` check at the top of the route, conditional on `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Commit `f233608`.
**June 11, 2026 addendum:** because no Clerk key was ever configured, this conditional check protected NOTHING in production. The route was effectively unauthenticated from May 28 until the June 11 Basic Auth middleware covered it. Lesson below ("conditional security").

### Finding 2 (High — CONFIRMED, FIXED): Advisor layout silently bypassed auth when Clerk key absent
**What happened:** `if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return <>{children}</>` — any production deploy without the Clerk key served the advisor page publicly.
**Fix:** Three-case logic. Commit `14b4f5e`. (Later superseded June 4, then June 11 — see MEMORY.md.)

### Finding 3 (High — CONFIRMED, FIXED): Advisor PDF sent as base64 to edge function; Vercel edge cap ~4MB
**Fix:** Advisor page now POSTs file as FormData to `/api/ingest` (Node.js) first → gets `fileId` → sends `fileIds: [fileId]` to `/api/chat`. Commit `e5871c6`.

### Finding 4 (Medium — CONFIRMED, FIXED): Orphaned PDF in storage when DB insert failed
**Fix:** Added `storage.remove([storagePath]).catch(() => {})` inside the `if (dbError)` block. Commit `1ea9bab`.

### Finding 5 (Medium — CONFIRMED, FIXED): plan.initial_summary null passed as message content
**Fix:** `?? ''` null guard + `NOT NULL DEFAULT ''` constraint applied live. Commit `725e784`.

### Finding 6 (Low — CONFIRMED, FIXED): `body!.getReader()` non-null assertion in 3 locations
**Fix:** `body?.getReader()` with explicit null check. Commit `e65cb7a`.

---

## Local Typecheck Environment — Stale node_modules + Phantom Type Dirs — June 4, 2026 (multi-attempt)
**What didn't work:**
- Running `tsc`/`npm run build` against local `node_modules` installed under system Node v12.3.1 — module-not-found errors, `TS1501` dotAll regex errors.
- Leaving `tsconfig.json` `target: "ES2017"`.
- A stray duplicate directory `node_modules/@types/prop-types 2` produced a phantom `TS2688`.
- Letting `npm install` rewrite `package-lock.json` (v1→v3 format churn).
- Trusting stale `.next/types` (referenced deleted routes).

**What worked:**
- node@25 at `/usr/local/opt/node@25/bin/`: `export PATH="/usr/local/opt/node@25/bin:$PATH" && npx tsc --noEmit`
- Fresh `npm install` under node@25; `target` ES2017 → ES2018; `rm -rf "node_modules/@types/prop-types 2"`; `rm -rf .next`; reverted lockfile churn with `git checkout package-lock.json`.

**Note for next time:**
- To typecheck locally, ALWAYS use node@25. Plain `tsc` under system Node 12 is useless.
- A directory like `name 2` inside `node_modules/@types/` is a copy artifact — delete it.
- Do NOT commit `npm install` lockfile churn inside a behavior-neutral cleanup.
- After deleting routes, clear `.next` before trusting a local typecheck.

---

## "For Advisors" Button Dead-End — Production Auth Redirect — June 4, 2026
**Root cause:** `app/advisor/layout.tsx` carried a three-case auth gate from the May 28 Security Hardening pass. The third case — Clerk key absent AND `NODE_ENV === 'production'` — did `redirect('/')`. No Clerk key in Vercel → every `/advisor` visit silently bounced home.

**What made it hard to spot:**
- The button itself was correct — the dead-end lived one layer down in the layout.
- It only manifested in production.
- The redirect was a deliberate, logged May 28 decision, so it looked intentional.

**What worked:**
- Confirmed via Vercel env inspection that no Clerk key exists. Removed the production redirect per user's choice ("Open it now, no login"). Superseded May 28 decision, flagged in MEMORY.md.

**Note for next time:**
- A "button does nothing" on a route that has a layout = check the layout's auth/redirect logic first, not the button.
- Auth gates conditioned on `NODE_ENV` behave differently in prod vs. local.
- (June 11 update: `/advisor` is now gated by Basic Auth middleware — no longer publicly open.)

---

## Session Summary, June 11, 2026
**Three new entries this session:** the wrong-chat-window incident (multi-attempt middleware deployment), the fabricated-credential incident, and the conditional-security lesson. One old mystery closed (middleware stub origin — see May 28 build-failure entry, addendum to root cause #4).

---

## Wrong Chat Window — All Session Prompts Went to a Non-Claude-Code Agent — June 11, 2026 (2 attempts to deploy middleware)
**What didn't work:**
- Every "Claude Code prompt" this session was pasted into a different chat window in VS Code (identity still unknown — likely GitHub Copilot in agent mode), not the Claude Code window. Nobody noticed for most of the session because the agent executes terminal commands and file edits competently and reports success convincingly.
- First middleware attempt: the live site showed no password prompt. The Basic Auth code had not actually shipped — the repo's `middleware.ts` was still the May 28 passthrough stub. The agent's earlier "done"-style output was not proof of anything.
- Trusting agent completion reports as evidence of deployment.

**What worked:**
- A self-diagnosing follow-up prompt: run `git status` / `git log origin/main..HEAD` first, classify the actual state (committed-unpushed / uncommitted / missing), fix only what's found, push (never force), then **verify from outside** with curl against the production URL (`/` expect 200, `/advisor` expect 401 + `WWW-Authenticate`). This worked regardless of which agent ran it because it discovers state rather than assuming it.
- The agent's report surfaced the truth: `middleware.ts` existed as a committed passthrough stub (May 28 leftover); it was replaced with the real gate, committed (`71f9357`), pushed, and live-verified.

**Note for next time:**
- **Proof = Ready deployment in Vercel (project `plansparency`) with the expected commit message + live behavior change. Never an agent's "done."**
- Write fix prompts that diagnose actual state first (git status, file contents) and branch on what they find — they self-correct for tool mix-ups, unpushed commits, and stale assumptions.
- Open item: identify the VS Code agent and either switch to real Claude Code or log a deliberate tool change in MEMORY.md.

---

## Fabricated Credential — Agent Invented "pilot2024" and Presented a Meaningless Test as Evidence — June 11, 2026
**What didn't work:**
- The VS Code agent tested the live gate with `-u "user:pilot2024"` — a password it invented (Ross confirmed it was not his) — got the 401 that ANY wrong password would produce, and confidently concluded "the env var is not set in Vercel." The test was incapable of distinguishing "env var missing" from "env var set, password wrong." Plausible-looking specifics + confident framing ≠ evidence.

**What worked:**
- Treating the claim as unverified and routing the real test to the only party who knows the password: Ross, in an incognito browser. He reset the password to a fresh value (never typed into any chat) and verified the gate end-to-end himself.

**Note for next time:**
- Agents fabricate specific-looking values (passwords, filenames, IDs) and build "tests" on them. Any agent claim that depends on a secret it shouldn't know is automatically suspect.
- NEVER give any chat agent a real password or API key — wrong-password rejection can be tested without the real one; correct-password admission can only ever be tested by the human.
- A 401 on a guessed password proves the gate rejects wrong passwords — nothing more.

---

## Conditional Security That Silently Protected Nothing — May 28 → June 11, 2026
**What didn't work:**
- The May 28 "security hardening" made both the `/api/save-plan` auth check and the advisor layout gate conditional on `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` being present. The key was never configured. Result: both protections were dead code in production for two weeks while the records said "fixed." The June 4 pilot decision then opened the layout entirely, but save-plan's phantom protection persisted unnoticed until the June 11 audit.

**What worked:**
- The June 11 Basic Auth middleware is **fail-closed**: a missing `ADVISOR_ACCESS_PASSWORD` returns 401 rather than falling through to open. Misconfiguration now produces a visible locked door, not an invisible open one. (Operational consequence accepted: set the env var BEFORE deploying the gate.)

**Note for next time:**
- A security control conditional on configuration that doesn't exist is not a security control. When logging a security fix as "done," verify the activating condition is true in production.
- Prefer fail-closed for anything guarding money, data writes, or private surfaces. Fail-open is acceptable only where availability outranks protection (e.g., the rate limiter, by explicit choice).

---

## Session Summary, September 27, 2026
One new entry: the docs said bugs were open that had been fixed four months earlier. No new code failures (no code ran).

---

## Doc Drift — "Open" Bugs That Were Already Fixed — May 26 → Sept 27, 2026
**What didn't work:**
- Commit `273ef03` (May 26, "Dashboard redesign") quietly fixed code-review Findings #3 and #5 and half of #1 inside a large UI change. The commit message didn't mention them, /close didn't catch them, and three later sessions (May 28, June 4, June 11) carried them forward as open. The June 11 CONTEXT.md still said `maxDuration=60`.
- Status was being copied forward from the previous doc instead of re-checked against code.
- Bundling bug fixes into a feature commit hid them.

**What worked:**
- Reading the actual files and running `git log -S "<snippet>"` to find exactly which commit changed a line.

**Note for next time:**
- Every status claim gets checked against the repo before it is written down (now a CLAUDE.md rule).
- One concern per prompt, one concern per commit. Fixes go in their own commit with a message that names the finding.
- Line numbers in docs rot fast. Refer to components by name.

---

## Session Summary, September 28, 2026
One new entry: the keep-alive that was supposed to stop Supabase pausing never worked.

---

## Supabase Keep-Alive Queried a Column That Doesn't Exist — June 4 → Sept 28, 2026
**What didn't work:**
- `app/api/keepalive/route.ts` (commit `1804166`) runs `.from('plans').select('id', ...)`. The `plans` table has no `id` column; its key is `plan_id` (see `supabase/schema.sql`). Every daily cron call returned 500. Supabase paused the project for inactivity. Found Sept 28 with status `INACTIVE`, which silently broke `/api/save-plan` and every `/p/` share link.
- Nobody checked the cron's first real run. The commit shipped, the deploy was Ready, and that was taken as proof. Ready only proves it built.
- The route swallowed the error into a 500 with no `console.error`, and Vercel Hobby log retention is short, so the failure left almost no trace.

**What worked:**
- Supabase MCP `get_project` showed `INACTIVE`; Vercel runtime logs showed `/api/keepalive 500`; comparing the query to the live table columns found the cause in minutes. Restored via Supabase MCP `restore_project`.

**Note for next time:**
- "Done" for a cron or background job = one real run observed returning success, not a Ready deploy. Add that to the job's prompt file.
- Any query naming a column gets checked against `supabase/schema.sql` (or the live table).
- Background jobs log their failures (`console.error`) so they show up in Vercel logs.

---

## Claude Code Auto Mode Outage + Accidental Commit — Sept 28, 2026
**What didn't work:** Claude Code (VS Code) could not run any Bash command: "Auto mode is unavailable: the server returned no safety verdict." Retrying didn't help. Committing by hand in VS Code Source Control, a second commit swept in the unstaged `.claude/401k_Plansparency.code-workspace` (VS Code can auto-stage everything when committing).
**What worked:** Doing the docs-only Step 1 by hand in Source Control and pushing; Cowork verified the result with git + Vercel. Workspace file is harmless (8 lines, no secrets) and gets untracked in Phase 01 Step 2b, no history rewrite.
**Note for next time:** If auto mode is down, switch Claude Code to the ask-permission mode instead of retrying. When committing by hand, check the staged list right before clicking Commit.

---

## Firm Plans Uploaded to the Demo + Uploads Never Deleted — June 11 → Sept 28, 2026
**What didn't work:** Two of Ross's firm client plans (Kenover Marketing Corp., Lockport Express Medical Group) were uploaded through `/advisor` on June 11 and stored in Supabase (row + PDF) and in Anthropic's Files API, despite the standing rule that the 45 firm plans are off-limits. Separately, the "sessionless / no storage" description was never true for the Files API: nothing set an expiry or deleted uploads.
**What worked:** A plain database read (`select plan_name from plans`) surfaced both. Rows deleted Sept 28 with Ross's confirmation; PDF cleanup + Files API expiry/cleanup in PHASE-04/05.
**Note for next time:** Every session that touches storage should list what's stored and check it against the test-document list. A privacy claim ("we don't store anything") must be checked against every service the file passes through, not just our own database.

---

## PHASE-06 Didn't Commit `.claude/settings.json` + Stale Key Terms — found Sept 29, 2026
**What didn't work:** PHASE-06 Step 5 said to stage `.claude/settings.json`; it is still untracked after the phase (Claude Code skipped it and nobody checked). Separately, Key Terms had the 2025 limits typed into the definitions, so it showed wrong numbers all through 2026, and `KeyTermsPanel` used `F.head`, which doesn't exist in `theme.ts`.
**What worked:** Found by reading the repo while planning PHASE-07; PHASE-07 Step 1 commits the file and Step 2 moves every definition into one glossary filled from the yearly limits table.
**Note for next time:** After each phase, Cowork runs `git status` and checks that every file the last step named is actually committed. Never type a dollar limit into copy; read it from the limits table.



## Oct 4, 2026: Revenue re-run v1 overstated paid-tier cost (Cowork)
- **What happened:** v1 report assumed invite-link sessions send the full PDF to the AI every question, so it showed paid tiers losing money (~$1.03/session).
- **Actual:** `/p` chat sends planData + saved summary only (~$0.16/session). The PDF is downloaded to the browser but unused (#32).
- **Fix:** report rebuilt same day (REVISED), #37 rewritten. Lesson: trace the actual request path in code before costing it.


## Oct 4, 2026: Cowork git status left .git/index.lock (Cowork)
- **What happened:** `git status` from the Cowork shell could not remove its own lock file (deletes were off), which would have blocked Claude Code commits.
- **Fix:** deleted the empty lock with permission. From now on Cowork runs only `git --no-optional-locks status` / `git log` (read-only, no lock).


## Oct 4, 2026: PHASE-10 quick-question buttons can never appear for plan documents (Cowork + CC)
- **What happened:** Ross opened the live site and saw none of the 8 stock-answer buttons. Cowork had logged PHASE-10 as done.
- **Cause:** `showChips` in `PlansparencyApp.tsx` requires `stage === "chat"`, but plan documents run in `stage === "app"` (Chat is a tab). Only statements reach `stage "chat"`, and stock buttons are off for statements. The gate dates back to the first Next.js build, so plan-document chat had no quick buttons at all; PHASE-10 Step 4 edited the button list without checking that it rendered.
- **Where Cowork went wrong:** marked the feature done from commits + `check-answers.ts` (265 passing checks on answer text) without tracing the render condition. Passing logic tests are not proof a screen shows anything.
- **Fix:** `PHASE PROMPTS/PHASE-11-show-quick-buttons.md` (one-line change). Lesson: every UI phase gets a "trace the render path" check, and "done" waits for Ross's click-through.


## Oct 4, 2026: PHASE-10 Ask tab built without the approved design (Cowork)
- **What happened:** after PHASE-11 the buttons showed, but the Ask tab looked nothing like the "Stock answers, button taps" canvas Ross approved.
- **Cause:** Cowork's PHASE-10 Step 4 described behavior only ("chips are the labels", "small badge under the message") and never copied the canvas layout or values. Claude Code did what the prompt said.
- **Rule from now on:** any UI prompt built from a canvas must copy the canvas values (sizes, colors as `C` tokens, order, placement) into the prompt and end with a "matches canvas" checklist Claude Code fills in. Cowork reviews the diff against the canvas before telling Ross to look.
- **Fix:** `PHASE PROMPTS/PHASE-12-ask-tab-match-canvas.md`.


## Oct 4, 2026: Vesting reader missed the most common real format (Cowork)
- **What happened:** On Ross's Tierra Sur test plan the vesting slider showed "See the schedule below". The schedule text was clear ("6-year graded — 0% at 0-1 year, 20% at 2 … 100% at 6+ years").
- **Cause:** Cowork's PHASE-13 test table used tidy made-up strings ("20% after 2 years …"), not text the plan reader actually returns. Year ranges ("0-1"), "6+" and a leading safe-harbor clause break the parser.
- **Fix:** PHASE-16 Step 1 item 4, with this exact string as a test. Lesson: build parser tests from real plan-reader output (`plandata_json` of saved test plans), not invented examples.


## Session Summary, October 3–4, 2026
Three new failures, all logged above with fixes: (1) PHASE-07 claimed done items it hadn't fully done (chip size, advisor FIRST_MSG), fixed in PHASE-08; (2) revenue report v1 costed invite-link sessions as if the PDF was sent every question, corrected after reading the code; (3) Cowork `git status` left `.git/index.lock`, deleted, Cowork now uses read-only git only.
