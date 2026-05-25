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
**What didn't work:** Writing Claude Code prompts targeting `plansparency-mvp__1_.jsx` — that file is the old artifact prototype, retired after Next.js migration in May 2026. Running prompts against it would have no effect on the live app.
**What worked:** Checking `recent_chats` to discover the Next.js migration had already happened. Confirmed correct file: `components/PlansparencyApp.tsx`. All prompts corrected before any code was run.
**Note for next time:** Always confirm the actual file structure with Claude Code (`ls app/ components/`) before writing any prompts. The Claude.ai project files may be stale. The GitHub repo is the source of truth.

---

## Code Review Findings — Direct Upload Architecture — May 24, 2026
*Found via /code-review after deploying the FormData direct-upload fix. 5 findings, ranked by severity.*

### Finding 1 (High — CONFIRMED): maxDuration=60s produces "Failed to fetch", not a clean timeout message
**File:** `app/api/ingest/route.ts` line 4 (`export const maxDuration = 60`)
**What happens:** When a large PDF takes >60s to forward to Anthropic, Vercel kills the TCP connection. The browser `fetch` throws a `TypeError: Failed to fetch` (not an `AbortError`, not an HTTP response). `uploadFile`'s catch checks `e.name === 'AbortError'` (false), re-throws bare with no `.status`. `processUpload`'s catch reads `e.status` → `undefined`, skips the 504 branch, hits `else if (e.message)`, and shows the raw browser string `"Failed to fetch"` to the user. The 180s client timer keeps ticking 2 more minutes before expiring harmlessly.
**Fix:** Raise `maxDuration` to 120 (Vercel Pro supports up to 300s), OR in `uploadFile` catch also detect `TypeError` with a message matching `"Failed to fetch"` / `"Load failed"` and re-throw with `.status = 504`.

### Finding 2 (High — PLAUSIBLE): Vercel platform payload cap (~4.5 MB) still blocks large PDFs
**File:** `app/api/ingest/route.ts` (entire route)
**What happens:** Next.js App Router route handlers have no framework-imposed body size limit. However, Vercel's platform enforces its own payload ceiling on Node.js serverless functions — approximately 4.5 MB. A large enrollment booklet (10-20 MB) gets rejected by Vercel's load balancer before `route.ts` ever runs, returning a raw HTML error page. `res.json()` in `uploadFile` silently fails, the client sees `HTTP 413`, shows the file-too-large message. Files between ~4.5 MB and the client-side 25 MB limit all fail this way.
**Note:** The old Vercel Blob flow bypassed this because file bytes never went through the serverless function. This is the core architectural trade-off of the direct-upload approach.
**Fix:** Confirm actual Vercel plan limit. For files above the limit, consider chunked upload, presigned URL approach, or routing large files back through Vercel Blob (with proper retry control).

### Finding 3 (Medium — CONFIRMED): AbortSignal.any fallback silently drops caller's abort signal
**File:** `components/PlansparencyApp.tsx` lines 366-370
**What happens:** `AbortSignal.any` is unavailable on Safari <17.4, Chrome <116, Firefox <124. When `abortSignal` is provided but `AbortSignal.any` doesn't exist, the fallback uses only `localCtrl.signal`, silently discarding the caller's signal. `abortRef.current.abort()` fires (Cancel / End Session), the UI resets, but `fetch('/api/ingest')` is never cancelled. Upload continues server-side for up to 3 minutes, consuming Anthropic API quota.
**Fix:** Replace `AbortSignal.any` conditional with two independent `abort` event listeners — one on each signal — both aborting a shared controller. No browser compatibility issues.

### Finding 4 (Low — PLAUSIBLE): abortRef.current replaced between uploadFile resolve and callClaude execution
**File:** `components/PlansparencyApp.tsx` lines 2087, 2094
**What happens:** `uploadFile` resolves. Before the async continuation executes, user drops a second file. `processUpload` fires: aborts old controller, creates new one. When upload #1's continuation resumes at line 2087, `abortRef.current.signal` is now upload #2's signal. Cancelling upload #2 also aborts upload #1's `callClaude`.
**Fix:** Capture `const signal = abortRef.current?.signal` immediately after `uploadFile` resolves, before any further `await`, and use that local const for `callClaude`.

### Finding 5 (Low — PLAUSIBLE): parsed?.error object → "[object Object]" error message
**File:** `app/api/ingest/route.ts` line 96
**What happens:** If Anthropic returns `{ error: { type: "...", message: "" } }` with an empty `message`, `parsed?.error?.message` is falsy, the expression falls to `parsed?.error` (the raw object), and `String(errMsg)` at line 98 serializes it as `"[object Object]"`.
**Fix:** `typeof parsed?.error === 'string' ? parsed.error : (parsed?.error?.message || errMsg)`

---

## Upload Failure Above 5.9MB — Lambda Payload Cap — May 24, 2026
**Root cause:** `/api/upload/route.ts` was a Node.js serverless function (no `export const runtime = 'edge'`). Vercel serverless functions run on AWS Lambda, which has a hard 6MB synchronous invocation payload limit. A multipart/form-data request for a ~5.9MB PDF exceeded this limit with boundary overhead. The Lambda rejected it at the infrastructure level before the route handler ran.

**What made it hard to spot:**
- `next.config.mjs` had `serverActions.bodySizeLimit: '50mb'` — this only applies to Server Actions, NOT Route Handlers. It was a no-op for `/api/upload`.
- Files under ~5.9MB worked fine, creating a confusing partial failure.
- The base64 fallback only activated for files ≤5MB, leaving a 5–6MB gap with no fallback path.
- No explicit body size config existed on the route itself.

**What worked:**
- Replaced Lambda-proxied upload with Vercel Blob client-side direct upload (`@vercel/blob/client`).
- New flow: client → Vercel Blob (direct, bypasses Lambda entirely) → `/api/ingest` fetches from blob URL server-to-server → Anthropic Files API → blob deleted → `fileId` returned.
- The Lambda body-size cap is completely irrelevant when the file never passes through Lambda.

**Files changed:** `app/api/upload/route.ts` (rewritten as token generator), `app/api/ingest/route.ts` (new), `components/PlansparencyApp.tsx` (`uploadFile()` rewritten, `fileToBase64` and base64 fallback removed), `package.json` (`@vercel/blob` added).

**Note for next time:**
- `serverActions.bodySizeLimit` in `next.config.mjs` does NOT apply to Route Handlers — only Server Actions.
- AWS Lambda 6MB hard cap = Vercel serverless function 6MB hard cap. Files proxied through a serverless route hit this wall.
- `BLOB_READ_WRITE_TOKEN` must be set in Vercel project env vars AND pulled to `.env.local` for local dev. It is NOT auto-created; you must connect the Blob store in the Vercel dashboard first.
- User does not have `.env.local` values set for local dev — app runs deployed on Vercel only.

---

## Session Summary, May 20, 2026
**No new multi-attempt failures this session.** Two near-misses caught before execution:
1. Prompts targeting wrong file (JSX artifact vs. PlansparencyApp.tsx) — caught by checking recent_chats
2. Instructing user to "find the current working artifact" — caught when recent_chats revealed Next.js migration was complete
Both corrected before any code was run.
