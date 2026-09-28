# Plansparency — MEMORY.md
*Decision log for Claude. Read this at the start of every session before doing anything.*
*Per CLAUDE.md Rule 7: never contradict a logged decision without flagging it first.*

---

## April 30, 2026 — Revenue Model
**What was decided:** B2B SaaS via advisor channel is the sole revenue path. Consumer (B2C) is not a business model.
**Why:** Market research confirmed participants want answers but don't pay. Advisors, HR teams, and plan sponsors pay for participant outcomes.
**What was rejected:** Direct-to-consumer subscription; generic financial wellness marketplace.

---

## April 30, 2026 — Version A Purpose
**What was decided:** Version A is an advisor proof tool, not a consumer product. Free and public, designed to convert advisors to Version B.
**Why:** Every screen, metric, and feature must demonstrate value to paying advisors.
**What was rejected:** "Free forever for everyone" consumer app positioning.

---

## April 30, 2026 — No Hired Developer
**What was decided:** Claude Code + Vercel serverless replaces a hired backend developer entirely.
**Why:** Vercel serverless API Routes solve API key security with 10 lines of code. $0 server cost.
**What was rejected:** Hiring a Node.js developer; backend server on Railway/Render.

---

## April 30, 2026 — Compliance as Absolute #1 Priority
**What was decided:** Talk to compliance department before registering domains, building publicly, or contacting any advisor. Written OBA approval first.
**Why:** OBAs involving retirement plans are among the most scrutinized compliance topics.
**What was rejected:** Proceeding with build while compliance review is pending.

---

## April 30, 2026 — IP Assignment Clause Review
**What was decided:** Review employment agreement for IP assignment clauses before the compliance conversation. Retain attorney ($300–$500) if any language is unclear.
**Why:** A 401(k) education tool built by a 401(k) plan manager is squarely within scope of most IP assignment clauses.
**What was rejected:** Proceeding without this review.

---

## April 30, 2026 — Side Business Model + Reassessment Trigger
**What was decided:** Side business until MRR reaches ~$8K–$12K/month.
**Why:** Compliance approval is conditional; income stability requires maintaining current practice.
**What was rejected:** Immediate full-time commitment.

---

## April 30, 2026 — Pilot Constraint
**What was decided:** 45 professionally managed plans are firm clients — OFF LIMITS for pilot.
**Why:** Using firm clients in a personal side project without compliance approval is a serious violation.
**What was rejected:** Using even one firm client plan in the pilot.

---

## April 30, 2026 — Advisor Pricing Tiers
**What was decided:** Starter $99/mo, Pro $249/mo, Enterprise $499+/mo, Per-Participant $4/employee/mo.
**Why:** Validated against competitor landscape, advisor WTP research, and margin math.
**What was rejected:** Per-plan pricing; free forever.

---

## May 1, 2026 — API Cost Model
**What was decided:** Session limits + Stripe metered overage billing required on all tiers. Correct model: 50–200 sessions per advisor per month.
**Why:** Large advisors can exceed Pro tier revenue without session limits.
**What was rejected:** Flat unlimited sessions; per-session billing to advisors.

---

## May 1, 2026 — Session Definition
**What was decided:** Session begins on upload + initial AI summary, continues through follow-up questions, ends on tab close / 30-min inactivity / manual clear.
**Why:** This is the billing unit and the cost unit.
**What was rejected:** Per-question billing; per-day billing.

---

## May 1, 2026 — PDF Text Extraction as Priority Fix
**What was decided:** Server-side PDF text extraction before sending to Anthropic — priority fix before Version A goes public.
**Why:** Eliminates re-sending full base64 PDF on every follow-up call. Cuts token count ~45%.
**What was rejected:** Deferring until Version B.

---

## May 1, 2026 — Advisor of Record Lock Mechanism
**What was decided:** EIN + Plan Number = unique federal plan identifier = lock key. First-upload-wins in Supabase.
**Why:** SPDs don't name advisors. EIN+PN is the only truly unique plan identifier in the document.
**What was rejected:** Manual verification; requiring proof of advisory contract.

---

## May 1, 2026 — Channel Sequencing
**What was decided:** Advisors only (Months 1–8) → HR Direct for non-advised plans only (Months 10–18) → Recordkeeper partnerships (Year 2+).
**Why:** Build advisor trust first, then introduce HR Direct with AOR protections in place.
**What was rejected:** Launching all three channels simultaneously; launching HR Direct before AOR lock is built.

---

## May 1, 2026 — BAA vs. DPA
**What was decided:** BAA does not apply. When enterprise buyers ask for "BAA," provide a Data Processing Agreement (DPA) instead.
**Why:** Plansparency is governed by ERISA, not HIPAA.
**What was rejected:** Signing actual BAAs.

---

## May 1, 2026 — Privacy Policy Approach
**What was decided:** Termly.io free tier for Version A.
**Why:** Generates compliant policies for minimal data collection profile.
**What was rejected:** Attorney-drafted privacy policy for Version A.

---

## May 2, 2026 — CLAUDE.md Operating Rules Applied
**What was decided:** All sessions operate under CLAUDE.md rules.
**Why:** Established by Ross for consistency and to prevent unwanted changes.
**What was rejected:** Prior operating mode (no rules file).

---

## May 2, 2026 — New Required Project Files
**What was decided:** MEMORY.md and ERRORS.md are permanent project files, updated every session.
**Why:** Required by CLAUDE.md Rules 7 and 9.
**What was rejected:** Treating decisions as session-only context.

---

## Session Summary, May 2, 2026
**Worked on:** CLAUDE.md review and application; generating MEMORY.md, ERRORS.md, updated CONTEXT.md.
**Completed:** All five files generated. CLAUDE.md rules applied.
**In progress:** Nothing — documentation session.
**Decisions made:** CLAUDE.md rules adopted; MEMORY.md and ERRORS.md established.
**Next session:** Read MEMORY.md first. Then compliance approval status.

---

## May 20, 2026 — Investments Tab: Link Destination
**What was decided:** Fund company official fact sheets only (Option B). No Morningstar. No performance data displayed in the tab.
**Why:** Fact sheets are the official 1–2 page documents, free and public. Morningstar requires tickers; institutional share classes are unreliable. No performance data reduces ERISA investment advice exposure.
**What was rejected:** Morningstar fund pages (Option A) — requires ticker, CITs not available; Morningstar search fallback (Option C) — not the 1–2 pager described.

---

## May 20, 2026 — Investments Tab: Card Depth and Sorting
**What was decided:** Medium depth. Sort options driven by available data only. Expense Ratio sort shown only if data present.
**Why:** Expense ratio typically not in enrollment booklets; showing it as a sort option when unavailable creates a confusing UX. Medium depth balances information and ERISA caution.
**What was rejected:** Full depth (performance summary included) — ERISA exposure; minimal depth — not useful enough for advisor demo.

---

## May 20, 2026 — Investments Tab: Version A Fallback Message
**What was decided:** When no fund lineup found: "Upload your enrollment booklet, investment guide, or 404(a)(5) fee disclosure to load your fund lineup." Version A only (advisor-facing). Version B will show "Please consult your plan advisor" via `?mode=participant` URL flag.
**Why:** Different audiences need different messages. Version A users are advisors testing the tool, not lost participants.
**What was rejected:** Toggle between advisor/participant mode — UX hack that creates confusion; hiding the tab entirely when no funds found — removes the upload prompt.

---

## May 20, 2026 — Investments Tab: ERISA Flag
**What was decided:** ERISA attorney must review Investments tab before it goes live publicly. Disclaimer language must be more specific than the general disclaimer.
**Why:** Fund names + category + risk level + links to fund materials is materially closer to investment advice territory than plan feature questions. Cannot go public without attorney sign-off.
**What was rejected:** Treating this like any other educational feature — the risk profile is different.

---

## May 20, 2026 — Source of Truth: GitHub, Not Artifact
**What was decided:** `plansparency-mvp__1_.jsx` is retired. The live code is `components/PlansparencyApp.tsx` in GitHub repo `RuGinzo13/plansparency`. All Claude Code prompts target this file.
**Why:** Next.js migration completed May 3–5. The JSX file in the Claude.ai project is a relic.
**What was rejected:** Continuing to write prompts targeting the old JSX artifact; treating the Claude.ai project file as the source of truth.

---

## May 20, 2026 — Version Drift Prevention
**What was decided:** GitHub is source of truth for code. Claude.ai project is source of truth for context. After every Claude Code session: run `/close`, re-upload the context files. No other sync required.
**Why:** Claude Code edits GitHub directly — no drift possible at the code level. Drift only happens in context files when sessions aren't closed properly.
**What was rejected:** Keeping the JSX file in the project in sync — impossible; using the artifact environment for further development — retired.

---

## May 24, 2026 — Code Review Findings: Direct Upload (5 Open Items)
*From /code-review run after deploying direct FormData upload. Fix these before raising the file size ceiling.*

| # | Severity | File | Issue | Status |
|---|----------|------|-------|--------|
| 1 | High | `ingest/route.ts:4` | `maxDuration=60` — server kills TCP at 60s; browser sees "Failed to fetch" not a 504; user gets raw browser error string | 🟡 Partial — raised to 120s in `273ef03` (May 26); friendly error mapping still missing (verified Sept 27) |
| 2 | High | `ingest/route.ts` | Vercel platform ~4.5 MB payload cap still rejects large PDFs before route runs | ✅ Partially closed June 11, 2026 — 5.9 MB confirmed working in production post-Blob-removal; >5.9 MB untested |
| 3 | Medium | `PlansparencyApp.tsx:367` | `AbortSignal.any` fallback silently drops caller's abort on Safari <17.4 / Chrome <116 / Firefox <124 — cancel doesn't stop upload | ✅ Fixed in `273ef03` (May 26; verified Sept 27) |
| 4 | Low | `PlansparencyApp.tsx:2087` | `abortRef.current` can be replaced between uploadFile resolve and callClaude — second upload's signal bleeds into first | ⚠️ Still open (Sept 27): `analyzeSignal` is read from `abortRef.current` after the upload `await`, comment says "capture" but it is too late |
| 5 | Low | `ingest/route.ts:96` | `parsed?.error` fallback can be an object → `String()` → `"[object Object]"` error message | ✅ Fixed in `273ef03` (verified Sept 27) |

See ERRORS.md for full diagnosis and suggested fixes for each.

---

## May 24, 2026 — Upload Flow: Vercel Blob Client-Side Upload
**What was decided:** Replace Lambda-proxied PDF upload with Vercel Blob client-side direct upload.
**Why:** AWS Lambda 6MB payload cap was blocking uploads above ~5.9MB.
**What was rejected:** Keeping the Lambda-proxied route with a higher limit.
**⚠️ SUPERSEDED June 4, 2026 (Phase 4):** all upload paths collapsed into `/api/ingest`; Vercel Blob fully removed from code (confirmed by repo search June 11, 2026; dead `BLOB_READ_WRITE_TOKEN` deleted from Vercel June 11). Note for the record: this May 24 decision contradicted CLAUDE.md's "No Vercel Blob. Ever." hard rule and was not flagged at the time — a process miss identified June 11.

---

## May 24, 2026 — No Local Dev Environment
**What was decided:** Ross does not run the app locally. All development ships directly to Vercel via GitHub push.
**Why:** No terminal knowledge; no local Node version configured for this project (system Node is v12.3.1; Node@25 at `/usr/local/opt/node@25/bin/`).
**What was rejected:** Local dev server testing — not feasible given setup.
**Note:** When npm is needed, use `PATH="/usr/local/opt/node@25/bin:$PATH" npm ...`
**⚠️ Record correction June 11, 2026:** the May 24 claim that `.env.local` values were all blank except PostHog/Blob was WRONG — an Anthropic API key was found in `.env.local` on June 11 and blanked. The exposure was on disk, not just in chat history.

---

## May 24, 2026 — Component Map (Reference for All Future Sessions)
The addressable sections of the app — superseded by the updated Component Map in CONTEXT.md (June 11, 2026), which adds the Access Gate (middleware.ts), removes the deleted `app/api/upload` route, and removes the nonexistent `lib/supabase.ts`.

---

## Session Summary, May 20, 2026
**Worked on:** Investments tab architecture — fund extraction, sortable lineup, TabBar design; file size fix; version drift diagnosis.
**Completed:** All architecture decisions finalized; 3 Claude Code prompts written and corrected to target PlansparencyApp.tsx; TO-DO list established; version drift problem diagnosed and resolved conceptually.
**In progress:** Claude Code prompts not yet run.
**Decisions made:** Fund company fact sheets only; no performance data; medium depth; expense ratio sort conditional; Version A advisor fallback; ERISA attorney required before public launch; GitHub is source of truth; JSX file retired.
**Next session:** Run the 3 Claude Code prompts in order. Test with Equitable enrollment booklet.

---

## May 28, 2026 — Supabase Backend: Full Advisor → Participant Flow
**What was decided:** Supabase is now the live backend for plan storage and participant delivery.
**Architecture:**
- `lib/supabase-server.ts` — lazy-initialized singleton (`getSupabaseAdmin()`), server-only
- `supabase/schema.sql` — `plans` table (plan_id, advisor_token, employer_name, plan_name, ein, plan_number, plandata_json, initial_summary NOT NULL, pdf_storage_path NOT NULL) + `plan_sessions` table
- `app/api/save-plan/route.ts` — Node.js runtime; uploads PDF to Storage, inserts plan row; rolls back orphaned blob on DB failure
- `app/p/[plan_id]/page.tsx` — server component; fetches plan + PDF, renders `PlansparencyApp` pre-loaded with plan data
- `app/advisor/page.tsx` — client component; full upload flow → /api/ingest → /api/chat → /api/save-plan → localStorage; shows plan list with copy/preview
**Supabase project:** `iqloseaxxpgdpffpsizo.supabase.co`
**Storage bucket:** `plan-documents` (private, service-role only)
**Why:** Enables the core advisor→participant product loop.
**What was rejected:** File-based storage; Vercel KV; keeping participant upload as the only entry point.

---

## May 28, 2026 — Advisor Upload Flow: /api/ingest → fileId → /api/chat
**What was decided:** Advisor upload page uses `/api/ingest` (Node.js) to get an Anthropic `fileId` first, then passes `fileIds: [fileId]` to `/api/chat` (edge). Raw base64 is never sent to the edge function.
**Why:** Vercel Edge Functions have a ~4MB request body cap. The `/api/ingest` Node.js route handles large bodies correctly.
**What was rejected:** Sending raw base64 to the edge function; creating a new upload route.

---

## May 28, 2026 — Security Hardening: Auth on Save-Plan + Advisor Layout
**What was decided:** `/api/save-plan` checks Clerk session when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is present. `app/advisor/layout.tsx` blocks `/advisor` in production when Clerk key is absent (redirects to `/`).
**Why:** The save-plan route had zero auth; the layout had a bypass.
**Pattern (both files):** Conditional on `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
**What was rejected:** Unconditional Clerk auth; leaving the bypass as-is.
**⚠️ Layout half SUPERSEDED June 4, 2026 (advisor area opened for pilot). Both halves effectively superseded June 11, 2026 — the Basic Auth middleware now provides real, unconditional protection on `/advisor` + `/api/save-plan`. Key lesson logged June 11: these "fixes" were conditional on a key that was never configured, so they protected nothing in production for two weeks.**

---

## May 28, 2026 — Code Review: 6 Findings, All Resolved
**What was decided:** All 6 findings from the `/code-review` run on the Supabase backend commits were fixed in the same session.

| # | File | Fix |
|---|------|-----|
| 1 | `app/api/save-plan/route.ts` | Added Clerk auth guard at route entry |
| 2 | `app/advisor/layout.tsx` | Block in prod when Clerk key absent; allow in dev |
| 3 | `app/advisor/page.tsx` | PDF routed through `/api/ingest` → `fileId`; edge body limit bypassed |
| 4 | `app/api/save-plan/route.ts` | `storage.remove()` rollback on DB insert failure |
| 5 | `app/p/[plan_id]/page.tsx` + schema | `initial_summary ?? ''` null guard + `NOT NULL` constraint applied live |
| 6 | `PlansparencyApp.tsx` + `app/api/chat/route.ts` | `body?.getReader()` null-guarded in all remaining locations |

**What was rejected:** Leaving any finding open; deferring to a future session.

---

## Session Summary, May 28, 2026
**Worked on:** Supabase backend build and integration; Vercel build failure debugging; advisor→participant flow; security hardening; code review and fix of all 6 findings.
**Completed:**
- Full Supabase setup (tables, bucket, env vars) done via Management API
- Advisor upload page live and functional
- Participant plan page (`/p/[plan_id]`) live
- 7 consecutive Vercel build failures resolved (3 root causes: lazy Supabase init, params Promise fix, @types/react mismatch)
- 6 code-review findings resolved across 6 commits
**In progress:** Nothing blocking.
**Decisions made:** See May 28 entries above.
**Next session:** Read MEMORY.md first. Investments tab build. Test advisor upload end-to-end with a real plan document.

---

## June 4, 2026 — Architecture Cleanup: 6-Phase Behavior-Neutral Refactor
**What was decided:** Run a 6-phase code-quality cleanup of `plansparency-nextjs` under the hard constraint *"do not change functionality — only improve code quality, scalability, maintainability."* Each phase committed separately and verified live on Vercel (deployment READY) before the next.
**Phases:** (1) delete dead code; (2) add Upstash rate limiting (fails open); (3) prune unused dependencies; (4) collapse three upload paths into one (`/api/ingest` multipart → Anthropic Files API → fileId); (5) extract pure modules out of the `PlansparencyApp.tsx` monolith into typed `lib/` files; (6) restore type safety.
**Why:** The monolith carried `@ts-nocheck` + `next.config` `ignoreBuildErrors`/`ignoreDuringBuilds`, masking all type/lint errors.
**What was rejected:** Big-bang rewrite; changing any user-facing behavior.

---

## June 4, 2026 — Phase 5: New `lib/` Modules Extracted from the Monolith
**What was decided:** Pure logic now lives in `lib/`, imported by `PlansparencyApp.tsx`:
- `lib/plan/plandata.ts` — `parsePlanData`, `stripPlanData`, `normalizePlanData` (+ PlanData interfaces)
- `lib/plan/stmtdata.ts` — `parseStmtData`, `stripStmtData`
- `lib/plan/irs.ts` — `getIRSLimits` (2025 limits: base $23,500; catch-up $7,500 / $11,250 for 60–63)
- `lib/i18n/index.ts` — the full EN/ES `i18n` object (~300 lines of pure data)
- `lib/anthropic/client.ts` — shared Anthropic constants (version, model `claude-sonnet-4-6`, beta headers, URLs)
- `lib/ratelimit.ts` — lazy Upstash limiters (chat 20/min, ingest 10/min), `checkRateLimit()` fails open
**Why:** These were duplicated/inlined in the 2,800-line component and in `app/advisor/page.tsx`.
**What was rejected:** Leaving logic inline; duplicating parse logic between the component and the advisor page.

---

## June 4, 2026 — Phase 6: Type Safety Gated at Build; Component @ts-nocheck Deferred
**What was decided:** Flipped `typescript.ignoreBuildErrors` to **false** — every API route, `lib/` module, and utility is now type-checked on each Vercel build and errors BLOCK the build. Bumped tsc `target` to ES2018. The single remaining `@ts-nocheck` is `components/PlansparencyApp.tsx`, now carrying a documented rationale.
**Why removing the component's @ts-nocheck was DEFERRED:** Removing it surfaces ~193 type errors on the 2,400-line file. It is pure presentational UI slated for decomposition. Typing 2,400 lines now, only to split the file apart later, is throwaway work.
**What was rejected:** Full component typing pass now; leaving `ignoreBuildErrors: true`.
**Commits:** 6a `c8e93f8`, 6b `c17ddb1`.

---

## June 4, 2026 — Investments Tab Was Already Built; Shipped Visual/UX Polish
**What was decided:** Confirmed the Investments tab is complete end-to-end. Shipped a presentation-only polish pass: summary stats strip, labeled per-fund expense ratio, flex-wrap on narrow phones, Spanish localization of fact-sheet link / expense label / sort controls. Fixed a bilingual bug where the populated fund view rendered `DisclosureCallout` without `lang`.
**Why:** Investigation showed the tab was built; the actionable gap was polish + the disclosure-language bug.
**What was rejected:** Re-implementing the tab; adding performance data — ERISA exposure + out of scope.
**Commits:** disclosure fix `97b1c1c`, polish `8b1241a`.

---

## June 4, 2026 — Advisor Area Opened for Pilot (SUPERSEDES May 28 "redirect to / in prod")
**What was decided:** `app/advisor/layout.tsx` no longer redirects `/advisor` → `/` when no Clerk key is configured in production.
**⚠️ This SUPERSEDED the May 28, 2026 decision.** That redirect was the root cause of the homepage **"For Advisors" button doing nothing**.
**Why:** Ross chose "Open it now, no login" for the pilot.
**Trade-off / follow-up:** The advisor upload tool became publicly reachable by anyone with the URL.
**⚠️ SUPERSEDED in turn June 11, 2026:** the Basic Auth middleware gate now protects `/advisor` (and `/api/save-plan`) unconditionally. The "open" period ran June 4–11.
**Commit:** `bd522e6`.

---

## June 4, 2026 — Local Typechecking Now Possible via node@25
**What was decided:** Local `tsc --noEmit` works by prepending node@25 to PATH: `export PATH="/usr/local/opt/node@25/bin:$PATH" && npx tsc --noEmit`. `npm install` under node@25 rewrites the lockfile — that churn was reverted to keep commits behavior-neutral.
**Why:** Enables real type-error baselines locally.
**What was rejected:** Committing the regenerated lockfile.

---

## Session Summary, June 4, 2026
**Worked on:** 6-phase architecture cleanup (Phase 6 finished); Investments tab review + polish; "For Advisors" dead-end fix.
**Completed:** Phase 6 type-safety gate live; phantom type-lib error resolved; Investments tab bilingual fix + polish; "For Advisors" button fixed; all changes deployed and verified READY.
**In progress:** Nothing blocking.
**Open TO-DOs (tracked):** (1) Rotate the exposed Anthropic API key; (2) Build advisor login / re-secure `/advisor` before public launch.
**Next session:** Read MEMORY.md first. Consider advisor login. Rotate Anthropic key.

---

## June 11, 2026 — Demo-Scope Security Boundary
**What was decided:** The current build is a demo for advisors pre-subscription. Demo-phase security scope = exactly three things: (1) rate limiting verified on the expensive routes, (2) a password gate on the advisor surface, (3) unguessable plan IDs — plus closing the exposed-key TO-DO. Everything else (full Clerk login, security headers, prompt-injection testing, server-side PDF byte validation, RLS review, save-plan rate limiting, advisor_token validation) is parked at the pre-public-launch gate.
**Why:** Demo-phase risks are Ross's money (API abuse), data integrity (junk rows ruining demos), and credibility with a compliance-sensitive advisor audience (real EINs in test docs behind guessable URLs). Those three items close all of that. Full hardening before launch anyway.
**What was rejected:** Full product-grade hardening now (over-engineering for a demo); doing nothing because "it's just a demo" (bots don't check whether a site is a demo; the test SPDs contain real EINs; CLAUDE.md's public-facing/OBA gate still applies).
**Open flag:** the demo IS publicly reachable at plansparency.vercel.app, which touches the "nothing public until written OBA approval" rule. Raised in-session; status unresolved. Must be addressed explicitly.

---

## June 11, 2026 — Anthropic API Key Rotation COMPLETED (closes June 4 TO-DO #1)
**What was decided / done:** New key created in Anthropic console → swapped into Vercel `ANTHROPIC_API_KEY` → redeployed → live app verified → old key revoked. Usage history showed NO unexpected activity from the exposure window. All temporary copies of the new key destroyed. `.env.local` checked: an Anthropic key WAS present (contradicting the May 24 record) and was blanked; `.env.local` confirmed gitignored.
**Why:** A key shared in prior chat context had never been rotated — the only open item where damage could already be accruing.
**What was rejected:** Continuing to defer; revoking before swapping (would have broken the live app).
**Standing rule established:** API keys and passwords are NEVER typed into any chat window. Secrets live only in the issuing console + Vercel env vars.

---

## June 11, 2026 — Security Diagnostic Findings (read-only audit)
**What was found (verified against deployed code):**
- `plan_id` = `crypto.randomUUID()` — UUIDv4, unguessable. `/p/` links safe to share. Enumeration concern CLOSED.
- `advisor_token` = generated and stored in localStorage but **validated by no server code anywhere** — it is decorative, not auth. Must gain server-side validation before any plan edit/delete features exist.
- Rate limiting: `checkRateLimit()` confirmed called in `/api/chat` and `/api/ingest`; keyed by `x-forwarded-for` (Vercel-set). `/api/save-plan` is NOT rate limited (acceptable behind the password gate).
- Vercel Blob: zero references in code. `BLOB_READ_WRITE_TOKEN` was a dead credential → deleted from Vercel same day. Upload tested clean at 5.9 MB in production (>5.9 MB untested).
- Supabase: service-role client is server-only; no browser-side Supabase client exists. `lib/supabase.ts` does NOT exist — prior docs were wrong.
**Why logged:** these findings close or downgrade several standing worries and correct three stale doc claims.

---

## June 11, 2026 — Advisor Gate: Basic Auth Middleware, Fail-Closed (Option A)
**What was decided:** Demo-phase gate = HTTP Basic Auth in `middleware.ts` (repo root) on `/advisor/:path*` and `/api/save-plan`. Env var `ADVISOR_ACCESS_PASSWORD`; any username; **fail-closed** — missing env var returns 401, never falls through to open. Browser-native login popup; sharing access = telling a pilot advisor the password. Commit `71f9357`. Verified live: `/` = 200; `/advisor` no-creds = 401 + `WWW-Authenticate: Basic realm="Plansparency Advisor"`; wrong password rejected; correct password admits. Password set fresh June 11 (never typed into any chat).
**Why:** Closes the open `/advisor` + unauthenticated `/api/save-plan` hole without contradicting the June 4 "no Clerk login for pilot" choice. Fail-closed is the explicit inversion of the May 28 Clerk pattern, whose fail-open condition silently disabled it.
**What was rejected:** Option B custom branded password page (more files, throwaway work once Clerk arrives); fail-open behavior when the env var is missing (the exact pattern that left the app unprotected for two weeks).
**This SUPERSEDES in practice:** the June 4 "advisor area OPEN" state and the May 28 conditional-Clerk protection. Full Clerk login remains the pre-public-launch plan.

---

## June 11, 2026 — Record Correction: Vercel Project Name + Domain
**What was decided / corrected:** The live Vercel project is named **`plansparency`**, serving `plansparency.vercel.app` — verified two independent ways (env-var dashboard header; agent's live curl checks; key rotation on that project took effect on the live app). Docs saying "Plansparency-nextjs" were stale. Also new: `plansparency.com` currently points to a GoDaddy website builder, not Vercel — domain cutover is a launch-prep item.
**Why:** Every dashboard instruction depends on naming the right project.
**What was rejected:** Leaving the discrepancy unexplained.

---

## June 11, 2026 — Verification Rule (process, permanent)
**What was decided:** Proof that a code change shipped = a **Ready deployment in Vercel with the expected commit message + observable live behavior change**. An agent's "done" message is never proof. After every code session, check the Deployments tab.
**Why:** This session's prompts had all gone to a non-Claude-Code VS Code chat agent without anyone noticing; the middleware gate initially didn't deploy; and the agent later fabricated a test credential ("pilot2024") and presented a meaningless test as evidence. The Vercel-plus-live-behavior check catches wrong tools, unpushed commits, and broken deploys all at once.
**What was rejected:** Trusting agent completion reports; treating tool identity as unimportant.
**Open item:** identify which VS Code agent it actually is (likely Copilot agent mode), then either switch to real Claude Code per CLAUDE.md or log a deliberate tool change.

---

## Session Summary, June 11, 2026
**Worked on:** Front-end/back-end security review and demo-scope hardening — the full Tier 1 list.
**Completed:**
- Anthropic API key rotated end-to-end (no abnormal usage; all copies destroyed; `.env.local` blanked)
- Upstash rate-limit env vars confirmed in Vercel; limiter call sites verified in code
- Read-only security diagnostic: plan_id unguessable; advisor_token decorative; save-plan unprotected (then fixed); Blob fully removed; Supabase server-only
- Dead `BLOB_READ_WRITE_TOKEN` deleted from Vercel; Blob store removed
- 5.9 MB production upload confirmed working (partially closes May 24 Finding #2)
- Basic Auth gate live on `/advisor` + `/api/save-plan` (fail-closed, commit `71f9357`), fresh password set, live-verified via curl + browser
- Record corrections: Vercel project name (`plansparency`), `.env.local` key presence, phantom `lib/supabase.ts`, stale Blob upload description
- Mystery solved at close: the passthrough middleware stub came from the May 28 build-failure fix (old 404-blocking middleware was neutered, not deleted) — not wrong-window debris
**In progress:** Check #5 (end-to-end upload through the password gate to a share link) reported working but not explicitly re-confirmed.
**Decisions made:** Demo-scope security boundary; Basic Auth Option A fail-closed; verification rule (Vercel Ready + live behavior = only proof); secrets-never-in-chat rule.
**Next session:** Read MEMORY.md first. (1) Confirm check #5 — one test upload through the gate. (2) Resolve the tool-identity question: which VS Code agent has been executing prompts, and switch to Claude Code or log the change. (3) Address the OBA/public-demo flag — the demo is publicly reachable and the compliance gate status is unresolved. Then back to product work: Investments tab testing with the Equitable booklet.

---

## September 27, 2026 — Workflow: Cowork Plans, Claude Code Builds From Prompt Files
**What was decided:** Split the work into two seats. Cowork (connected to the repo folder) is where problems get talked through, decisions get logged, the .md files get maintained, and phase prompt files get written to `PHASE PROMPTS/PHASE-NN-name.md`. Claude Code in VS Code only executes one prompt file per fresh conversation (`Read "PHASE PROMPTS/PHASE-NN-name.md" and execute STEP N only.`). No hand-pasted code.
**Why:** Ross had been typing instructions straight into Claude Code without thinking them through first. That skipped the stress-test step, produced prompts nobody could audit later, and let the docs drift from the code. Prompt files are reviewable before they run and leave a record after.
**What was rejected:** (1) Cowork handing Ross raw code to paste: error-prone in a 2,400-line file and it loses Claude Code's ability to read surrounding code and commit. (2) Keeping prompts only in chat: no history, easy to paste into the wrong window (see June 11 error). (3) Cowork editing application code directly: breaks the "one builder" rule and bypasses git history.

---

## September 27, 2026 — The Repo Is the Only Real Copy of the .md Files
**What was decided:** The five context files live in the repo root and are edited there directly by Cowork. The claude.ai project copies are mirrors, refreshed at /close. The download/re-upload ritual from the old /close protocol is retired.
**Why:** Two editable copies is how drift starts. Cowork can now read and write the repo folder, so there is no reason to move files by hand.
**What was rejected:** Treating the claude.ai project as the source of truth for context (it was, before Sept 27); keeping both as equals.

---

## September 27, 2026 — OPEN-ITEMS.md Added (Replaces the TO-DO Sections in CONTEXT.md)
**What was decided:** A fifth context file, OPEN-ITEMS.md, holds the only to-do list, ranked. CONTEXT.md keeps facts only. This passes CLAUDE.md's "replace, not additive" test because it replaces the TO-DO sections rather than duplicating them. The project instructions call it "OPEN ITEMS.md"; the file is named `OPEN-ITEMS.md` because spaces in file names cause quoting mistakes in prompts and shell commands.
**Why:** Project instructions require it, and to-dos buried inside a 430-line context file were being missed and going stale.
**What was rejected:** Keeping to-dos in CONTEXT.md; a literal file name with a space.
**⚠️ Flag:** this revises the old CLAUDE.md "Exactly 4 project files" rule. CLAUDE.md has been updated to 5 files + `PHASE PROMPTS/`.

---

## Session Summary, September 27, 2026
**Worked on:** Catch-up after a ~3.5 month gap; workflow reset (Cowork for thinking, VS Code for building); full audit of the .md files against the real repo and Vercel.
**Completed:**
- Verified: `main` = `origin/main` = Vercel production (`71f9357`, READY). No code changes since June 11.
- Found doc drift: Findings #1 (partial), #3, #5 were fixed May 26 in `273ef03`; docs said open. Corrected.
- Found in code: IRS limits still 2025; "4.5 MB max" upload copy contradicts 25 MB code limit; advisor layout comment says the area is "OPEN" (stale since the June 11 middleware gate); `dashboard-redesign` branch merged and stale.
- Found evidence on the June 11 tool question: `71f9357` carries a Claude Code co-author trailer.
- Updated CLAUDE.md, CONTEXT.md, MEMORY.md, ERRORS.md. Created OPEN-ITEMS.md and a prompts folder (renamed `PHASE PROMPTS/` on Sept 28).
**In progress:** Nothing in code.
**Decisions made:** Two-seat workflow; repo is the only real copy of the .md files; OPEN-ITEMS.md added.
**Next session:** (1) Run `PHASE PROMPTS/PHASE-01-stabilize.md` Step 1 in Claude Code. (2) Decide the OBA / public demo question (still the top gate). (3) Talk through the 2026 IRS limits fix before any prompt is written for it.

---

## September 28, 2026 — OBA: Not Yet Requested; Keep Building Meanwhile
**What was decided:** Ross has not spoken to compliance yet. Building continues in the meantime. Cowork's recommendation, written as `PHASE PROMPTS/PHASE-01-stabilize.md` Step 3: put the whole site behind the existing advisor password until written approval, with a `SITE_PUBLIC=true` env var to reopen later without a code change. Ross decides when to run it.
**Why:** Building and being public are separate things. Locking the site costs nothing in build speed and closes the gap between the CLAUDE.md compliance rule and reality (site public since May).
**What was rejected (so far):** Locking `/try` only (leaves a public branded page); leaving it public without logging the risk.
**⚠️ Open flag:** until prompt 02 runs, the site remains public without OBA approval. This contradicts the April 30 "Compliance as Absolute #1 Priority" decision. Flagged, not resolved.

---

## September 28, 2026 — Supabase Restored From Cowork
**What was decided / done:** With Ross's OK, Cowork restored the paused Supabase project via the Supabase connection. Status `ACTIVE_HEALTHY`; `plans` table intact (4 rows). Root cause and fix: see ERRORS.md and `PHASE PROMPTS/PHASE-01-stabilize.md` Step 2.
**Why:** Shared `/p/` links and advisor saves were broken while paused.
**What was rejected:** Waiting until the keep-alive fix shipped (links broken in the meantime).

---

## September 28, 2026 — Prompt Folder Renamed to PHASE PROMPTS, One File Per Phase
**What was decided:** At Ross's request, the prompts folder is `PHASE PROMPTS/`. Each phase is one file (`PHASE-NN-name.md`) split into numbered STEPS. Ross runs one step per fresh Claude Code conversation: `Read "PHASE PROMPTS/PHASE-NN-name.md" and execute STEP N only.` The earlier separate files (00/01/02) were merged into `PHASE-01-stabilize.md` before any were run, so nothing duplicates.
**Why:** One document per batch of action items is easier for Ross to follow. Keeping one step per conversation preserves the "one focused task per Claude Code conversation" rule.
**What was rejected:** Keeping both a `prompts/` folder and a `PHASE PROMPTS/` folder (two places = drift); letting Claude Code run a whole phase in one conversation (token overload, harder to verify each step).

---

## September 28, 2026 — Keep-Alive Fixed; Tool Identity Settled
**What was done:** Phase 01 Step 2a shipped via Claude Code in ask-permission mode (auto mode was down): `8d53a79` changes the keep-alive query to `plan_id` and logs failures. Vercel Ready; Ross ran the cron manually and it returned 200.
**Tool identity:** the commit's co-author trailer shows Claude Code wrote it. Combined with the June 11 trailer, the "non-Claude-Code agent" theory from June 11 is retired. OPEN-ITEMS #3 closed.
**Still to verify:** Supabase stays ACTIVE_HEALTHY a week later (around Oct 5).

---

## September 28, 2026 — Phase 01 Complete: Site Locked Until OBA
**What was done:** `f412806` puts every page behind the advisor Basic Auth password. `/advisor` and `/api/save-plan` are always private; everything else opens only when `SITE_PUBLIC=true` (fail-closed). `/api/keepalive` is exempt for the cron. Ross verified in incognito: password prompt, landing, /try upload + full answer, existing /p/ link, and a fresh advisor upload → share link → participant question. This also closed the June 11 "check #5".
**Why:** Closes the gap with the April 30 compliance-first decision without slowing the build. The Sept 28 "open flag" on public exposure is resolved; the OBA conversation itself is still pending.
**Known behavior:** while locked, participants opening a /p/ link must enter the password too. Fine pre-approval; goes away with `SITE_PUBLIC=true`.
**Next:** Phase 02 candidates: 2026 IRS limits in the calculator (OPEN-ITEMS #6) and the "4.5 MB" upload copy (#7). Talk through before writing prompts.

---

## September 28, 2026 — Calculator Upgrade Design (Phase 02)
**What was decided:** Option B. IRS limits move to a year-keyed table in `lib/plan/irs.ts` (2025 + 2026; add a row each November). All calculator math moves to typed `lib/plan/calc.ts`. Visible changes: "Using 2026 IRS limits" label (with fallback warning if the year isn't loaded), catch-up age measured by Dec 31 (IRS rule; the old code used age today), per-paycheck shows the real deduction, limit tracker ("you'd reach the limit after paycheck N"), employer contributions figured on pay capped at the 401(a)(17) limit, and a Roth catch-up card for 2026's rule (prior-year Social Security wages > $150,000 from this employer → catch-up must be Roth; no Roth in plan → no catch-up). The card asks the user (Yes/No/Not sure) rather than guessing from current salary, because the rule uses LAST year's wages.
**Why:** Stale numbers are the most visible error a participant can see, and the 2026 Roth rule is the biggest catch-up change in years.
**What was rejected:** Hardcoding 2026 numbers only (repeats every January); inferring the Roth rule from current salary (wrong wage year); calculating non-safe-harbor match formulas (contradicts the existing "discretionary, not calculated" decision; parked in OPEN-ITEMS tech debt); a pre-tax vs Roth tax comparison (needs tax assumptions, drifts toward advice).
**Uncertainty flagged:** 2026 numbers come from the IRS newsroom (deferral, catch-ups) and a practitioner summary of Notice 2025-67 (comp limit $360,000; Roth threshold $150,000), not read directly from the Notice PDF.

---

## September 28, 2026 — Run Whole Phases by Default
**What was decided:** Ross runs a full phase in one Claude Code conversation (`execute all steps in order`). Kept from the old rule: one concern per step, one commit + push per step, and automated gates (ground check, type check, build) between steps with stop-on-failure. Exception: phases touching auth/access, secrets, database schema, billing, or data deletion are marked STEP BY STEP with 🛑 checkpoints for Ross to verify live.
**Why:** Phase 01/02 showed the per-conversation split mostly added waiting. The real protections are small commits and automated checks, which survive. Live human checks matter most where a mistake locks people out, leaks data, or costs money, so those keep checkpoints.
**What was rejected:** One giant commit per phase (loses rollback granularity); keeping one-step-per-conversation for everything (slow, little added safety for UI/content work).
**⚠️ Revises** the Sept 27 "one step per fresh conversation" rule in CLAUDE.md (updated).

**Refined same day (Ross):** no babysitting. Every phase runs unattended start to finish; the STEP BY STEP mode is dropped. Per-step commits + pushes are written into each step. Only exception: a 🛑 CHECKPOINT before an irreversible action (prod data delete, schema change, live secret rotation), announced in chat first, with automated checks preferred over human pauses.

---

## September 28, 2026 — Firm Plans Deleted; Upload Privacy Fixes; App Split Plan
**What was decided / done:** (1) Ross confirmed two saved plans (Kenover Marketing Corp., Lockport Express Medical Group) are firm clients; Cowork deleted both `plans` rows. Stored PDFs: Ross deletes in the Supabase dashboard (SQL can't delete storage files). (2) Uploads to Anthropic's Files API now get a 6-hour expiry (PHASE-04), and a one-time cleanup deletes old `upload.pdf` files (PHASE-05, temporary key kept out of chat). (3) Advisor's typed plan name gets saved (PHASE-04). (4) App split (PHASE-06): pure moves into ~10 files; a missing-name tsc check after each step, since `@ts-nocheck` files would otherwise hide missing imports until runtime.
**Why:** Compliance (firm plans off-limits) and the privacy promise outrank refactoring; both fixes are small. Ross asked for the split next; it's queued right after.
**What was rejected:** Deleting every Files API file (could hit another project's files; filter on `upload.pdf`); typing the component during the split (mixes two risky changes); a password-protected purge endpoint in production (a destructive route living in prod).
**Expiry choice:** 6 hours. Uncertain whether a participant session ever needs longer; revisit if people report "document no longer available" in long sessions.

---

## September 28, 2026 — Hard Rule: Anthropic Never Holds Uploaded Documents
**What was decided (Ross):** No uploaded document may ever be held or stored by Anthropic. The Files API is banned (CLAUDE.md hard rule). **Revised same day by Ross:** Anthropic may hold a document only while the user's browser session is active; it must be deleted when the session ends (see PHASE-04: button, new upload, tab close, 30-min idle, 2-hour expiry backstop; advisor files deleted right after save). The Files API stays, under those rules. At launch, uploaded documents must be accessible only to the person who uploaded them.
**Facts (Anthropic docs, checked Sept 28):** Files API files persist until deleted or expired and are not ZDR-eligible. Messages API inputs/outputs are deleted within 30 days by default; with a Zero Data Retention agreement (via Anthropic sales, per organization) they are not stored after the response, except content flagged by trust & safety (up to 2 years) or legal holds. Prompt caching is ZDR-compatible (in-memory only for the cache lifetime).
**What this means honestly:** the strongest achievable promise is "never stored as a file; processed per request; deleted within 30 days (or not stored at all with ZDR)." Literal zero also requires ZDR.
**Superseded:** original PHASE-04 (6-hour expiry). PHASE-04 rewritten around session-scoped deletion. Broader security and confidentiality options for uploaded documents: to be discussed (Ross, Sept 28).

---

## September 28, 2026 — Anthropic File Storage Cleared
**Done:** PHASE-05 deleted 16 old `upload.pdf` files from Anthropic's Files API (including the two firm plans' copies). Temp key removed from `.env.local` (Cowork verified: no key text in the file, file not tracked by git, no key in recent commits) and disabled by Ross. From now on, uploads live only for the session (PHASE-04).

---

## September 28, 2026 — Zero-Click Phase Runs via Project Permission Allowlist
**What was decided:** Ross won't approve prompts during phase runs. Cowork created `plansparency-nextjs/.claude/settings.json`: `defaultMode: acceptEdits`, an allowlist of exactly the commands phases use (git status/log/diff/add/commit/push to main, tsc, build, curl, tsx/node in /tmp), `ask` for npm install/uninstall and remote branch deletes, `deny` for force-push, hard reset, clean, rebase, amend, filter-branch, the Vercel CLI, and reading/editing `.env*`. Claude Code must be opened with the repo as the workspace folder (it had been running from the parent `Plansparency` folder, forcing `cd … && git` commands that always prompt). Every phase is now written to stay inside the allowlist.
**Why:** Auto mode depends on a classifier that was down today; Manual mode needs clicks; `bypassPermissions` skips every safeguard on Ross's own Mac. An allowlist + deny list gives unattended runs with hard stops on the dangerous commands.
**What was rejected:** `bypassPermissions` (no guardrails, not in an isolated machine); relying on auto mode (outage-prone).

