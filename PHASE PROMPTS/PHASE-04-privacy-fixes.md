# PHASE 04 — Documents live only as long as the session (+ advisor plan name)
**Created:** Sept 28, 2026 in Cowork (rewritten same day after Ross's decision)
**Run:** `Read "PHASE PROMPTS/PHASE-04-privacy-fixes.md" and execute all steps in order.` Unattended. 3 steps, 3 commits, each pushed. No human checkpoints. Step 1 touches the access gate (middleware); it has an automated live check.
**Open items covered:** OPEN-ITEMS.md #15, #17
**Status:** ✅ DONE Sept 28: `d108907`, `66b743a`, `d14fba8`, all Vercel Ready (verified by Cowork). Ross live checks pending.

---

## The rule this phase implements (Ross, Sept 28, 2026)
A document may stay in Anthropic's file storage **only while the user's session is active**. When the session ends, it is deleted. "Session ends" = any of:
1. User clicks **End Session & Clear Data**.
2. User uploads a different document (the old one is no longer needed).
3. User closes the tab or browser (best effort: browsers don't always report this, so 4 and 5 are the safety nets).
4. **30 minutes of inactivity** (matches the existing business definition of a session, May 1, 2026). The app ends the session itself and tells the user.
5. **Hard backstop:** every file is uploaded with a **2-hour expiry**, so Anthropic deletes it even if everything else fails (crashed tab, lost phone, bug).

Advisor uploads: the file is only needed to create the plan summary, so it's deleted **immediately after** saving (success or failure). Share-link pages (`/p/...`) don't use Anthropic file storage at all.

---

## Rules for Claude Code (every step)
- Execute steps in order. Do each step's "Check the ground" first. If anything doesn't match, STOP and report. Do not guess.
- Change only the files a step lists. Stage only those (never `git add -A` / `git add .`).
- Find code by searching names/text, not line numbers.
- EN and ES only; every new user-facing string in both, word for word as written here.
- After each step: `npx tsc --noEmit` and `npm run build` must pass (Node too old → `export PATH="/usr/local/opt/node@25/bin:$PATH"`). Commit + push. Never force-push.
- Never print or log API keys. Never guess the site password.
- Final report: commit hashes, files changed per step, results of the live checks, anything unexpected.

---

## STEP 1 — Server side: delete route, 2-hour backstop, clean "expired" error

**Check the ground**
- `git status`, `git log --oneline -3`: latest commit `ba25e82`. Allowed uncommitted: `CLAUDE.md`, `CONTEXT.md`, `MEMORY.md`, `ERRORS.md`, `OPEN-ITEMS.md`, anything in `PHASE PROMPTS/` (Cowork docs, committed in Step 3). Anything else = STOP.
- `grep -rn "ANTHROPIC_FILES_URL" app lib` → only `app/api/ingest/route.ts` uploads files. Otherwise STOP.
- Open `middleware.ts`; confirm the matcher is `'/((?!api/keepalive|_next/static|_next/image|favicon.ico).*)'`.

**Files you may change:** `lib/anthropic/client.ts`, `app/api/ingest/route.ts`, `app/api/session/end/route.ts` (new), `app/api/chat/route.ts`, `lib/ratelimit.ts`, `middleware.ts`

**Do this**
1. `lib/anthropic/client.ts`: add `export const FILE_EXPIRY_SECONDS = 7200;` with comment: "Backstop only. Files are deleted when the session ends; this guarantees deletion within 2 hours even if the browser never tells us. Anthropic allows 3,600 to 7,776,000." Also add `export const FILE_ID_PATTERN = /^file_[A-Za-z0-9_-]{8,}$/;`.
2. `app/api/ingest/route.ts`: when building the upstream FormData, also `upstream.append('expires_in_seconds', String(FILE_EXPIRY_SECONDS))`. Nothing else changes.
3. New `app/api/session/end/route.ts`, **Node.js runtime**, `POST` only:
   - Body: JSON `{ fileIds: string[] }`. Accept the body even when sent as `text/plain` (browsers' `sendBeacon` sends that): read `await req.text()` and `JSON.parse` it.
   - Keep only ids matching `FILE_ID_PATTERN`, max 10. If none are valid → 200 `{ deleted: 0 }`.
   - Rate limit with a new `'end'` limiter in `lib/ratelimit.ts` (30 / minute / IP, same lazy + fail-open pattern as the others).
   - For each id: `DELETE ${ANTHROPIC_FILES_URL}/${id}` with headers `x-api-key`, `anthropic-version`, `anthropic-beta: ANTHROPIC_BETA_FILES`. Treat 200 and 404 both as success (already gone). Run the deletes in parallel with `Promise.allSettled`.
   - Return 200 `{ deleted: <count of 200/404> }`. Never echo the key; log failures with `console.error('[session/end] …')` (id + status only).
4. `middleware.ts`: exclude `api/session/end` from the matcher (the browser's tab-close signal can't be relied on to carry the site password, and this route can only delete files, never read them). New matcher: `'/((?!api/keepalive|api/session/end|_next/static|_next/image|favicon.ico).*)'`. Update the top comment to mention it. Nothing else in middleware changes.
5. `app/api/chat/route.ts`: where an Anthropic error response is turned into our error, detect a missing/expired file (status 404, or an error message containing "file" together with "not found" / "does not exist" / "expired", case-insensitive) and return **status 410** with `{ error: 'session_expired' }`. All other error handling stays as is.
6. Checks pass → `git add lib/anthropic/client.ts app/api/ingest/route.ts app/api/session/end/route.ts app/api/chat/route.ts lib/ratelimit.ts middleware.ts` → commit `feat(privacy): session-end delete route, 2h file expiry backstop, 410 on expired file` → push.
7. **Automated live check** after Vercel shows the deploy Ready (curl, no credentials, never guess the password):
   - `curl -s -o /dev/null -w "%{http_code}" https://plansparency.vercel.app/` → expect `401` (site still locked).
   - `curl -s -X POST -H "Content-Type: text/plain" -d '{"fileIds":["not-a-file"]}' https://plansparency.vercel.app/api/session/end` → expect HTTP 200 and `{"deleted":0}`.
   - If your network can't reach the site, say so in the report and continue.

## STEP 2 — Browser side: end the session in every way listed above

**Check the ground:** Step 1's commit is the latest. In `components/PlansparencyApp.tsx` find `fileIdsRef`, `clearSession`, and every place `fileIdsRef.current =` is assigned.

**Files you may change:** `lib/client/session.ts` (new, typed, no `@ts-nocheck`), `components/PlansparencyApp.tsx`, `app/advisor/page.tsx`, `lib/i18n/index.ts`

**Do this**
1. New `lib/client/session.ts` exporting:
   - `endSessionFiles(fileIds: string[], opts?: { beacon?: boolean }): void` — no-op for an empty list. With `beacon: true` use `navigator.sendBeacon('/api/session/end', JSON.stringify({ fileIds }))`; otherwise `fetch('/api/session/end', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileIds }), keepalive: true })` and swallow errors (never block the UI).
   - `INACTIVITY_LIMIT_MS = 30 * 60 * 1000`.
2. `components/PlansparencyApp.tsx` (main `Plansparency` component only):
   - **End Session button:** in `clearSession`, call `endSessionFiles(fileIdsRef.current)` BEFORE the ref is cleared.
   - **New document replaces old:** wherever `fileIdsRef.current` is reassigned or reset while it already holds ids (e.g. starting a fresh upload), first call `endSessionFiles` on the old ids that are not in the new list.
   - **Tab/browser close:** a `useEffect` that adds a `pagehide` listener calling `endSessionFiles(fileIdsRef.current, { beacon: true })`; remove the listener on unmount.
   - **30-minute inactivity:** track last activity (message sent, file uploaded, tab click, key press inside the app). A timer checked every 60 s: if there are file ids and 30 minutes passed, call `clearSession()` and then show the notice `calcSessionEndedIdle` (below) on the landing screen. Reset on activity.
   - **Expired file:** when a chat call fails with status 410 or error `session_expired`, clear local state like `clearSession` does and show `errSessionExpired`.
3. `app/advisor/page.tsx`: after `/api/save-plan` finishes (success OR failure, use `finally`), call `endSessionFiles([fileId])`. The advisor flow never needs the file again.
4. `lib/i18n/index.ts`, both languages:

   | Key | EN | ES |
   |---|---|---|
   | `calcSessionEndedIdle` | For your privacy, your session ended after 30 minutes without activity and your document was deleted. Upload it again to keep going. | Por tu privacidad, tu sesión terminó después de 30 minutos sin actividad y tu documento fue eliminado. Súbelo de nuevo para continuar. |
   | `errSessionExpired` | Your session has ended and your document was deleted for your privacy. Please upload it again. | Tu sesión terminó y tu documento fue eliminado por tu privacidad. Súbelo de nuevo, por favor. |

5. Checks pass → `git add lib/client/session.ts components/PlansparencyApp.tsx app/advisor/page.tsx lib/i18n/index.ts` → commit `feat(privacy): delete uploaded files when the session ends (button, new upload, tab close, 30-min idle, advisor save)` → push.

## STEP 3 — Save the advisor's plan name; commit Cowork docs

**Check the ground:** Step 2's commit is the latest. In `app/advisor/page.tsx` the `/api/save-plan` body is `JSON.stringify({ pdfBase64, planData, initialSummary })` and `employerName` state exists; `app/api/save-plan/route.ts` inserts `employer_name: pd.employerName ?? null`. If different, STOP.

**Files you may change:** `app/advisor/page.tsx`, `app/api/save-plan/route.ts`, `app/p/[plan_id]/page.tsx`, plus modified Cowork docs from Step 1's allowed list.

**Do this**
1. `app/advisor/page.tsx`: add `employerName: employerName.trim()` to the save-plan JSON body.
2. `app/api/save-plan/route.ts` (Node runtime unchanged): read optional `employerName`, trim, cap at 120 chars; insert `employer_name: typedName || pd.employerName || null`. `plan_name` unchanged.
3. `app/p/[plan_id]/page.tsx`: metadata select adds `plan_name`; title uses `employer_name ?? plan_name ?? 'Your'` in the existing pattern. Nothing else.
4. Checks pass → `git add app/advisor/page.tsx app/api/save-plan/route.ts "app/p/[plan_id]/page.tsx"` + modified Cowork docs → commit `fix(advisor): save typed plan name; share page title falls back to plan name; docs update` → push.

---

## Ross checks (end of phase, logged in)
- `/try`: upload a test SPD, ask a question, then click **End Session & Clear Data**. Works as before.
- Upload a test SPD, then close the tab. (Cowork can confirm deletion afterwards once PHASE-05's key is set up.)
- Advisor upload with a typed name: share page tab title shows the name.
- Optional: leave a session idle 30+ minutes; you should land on the privacy notice.
