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
**Why:** Next.js migration completed May 3–5. Two Vercel projects exist: `Plansparency` (old artifact, retired) and `Plansparency-nextjs` (live). The JSX file in the Claude.ai project is a relic.
**What was rejected:** Continuing to write prompts targeting the old JSX artifact; treating the Claude.ai project file as the source of truth.

---

## May 20, 2026 — Version Drift Prevention
**What was decided:** GitHub is source of truth for code. Claude.ai project is source of truth for context. After every Claude Code session: run `/close`, re-upload the 5 context files (MEMORY.md, ERRORS.md, AddlCONTEXT.md, Session-Log, GIT-COMMIT.md). No other sync required.
**Why:** Claude Code edits GitHub directly — no drift possible at the code level. Drift only happens in context files when sessions aren't closed properly.
**What was rejected:** Keeping the JSX file in the project in sync — impossible; using the artifact environment for further development — retired.

---

## May 24, 2026 — Code Review Findings: Direct Upload (5 Open Items)
*From /code-review run after deploying direct FormData upload. Fix these before raising the file size ceiling.*

| # | Severity | File | Issue | Status |
|---|----------|------|-------|--------|
| 1 | High | `ingest/route.ts:4` | `maxDuration=60` — server kills TCP at 60s; browser sees "Failed to fetch" not a 504; user gets raw browser error string | ⚠️ Open |
| 2 | High | `ingest/route.ts` | Vercel platform ~4.5 MB payload cap still rejects large PDFs before route runs (direct upload path inherits this constraint) | ⚠️ Open |
| 3 | Medium | `PlansparencyApp.tsx:367` | `AbortSignal.any` fallback silently drops caller's abort on Safari <17.4 / Chrome <116 / Firefox <124 — cancel doesn't stop upload | ⚠️ Open |
| 4 | Low | `PlansparencyApp.tsx:2087` | `abortRef.current` can be replaced between uploadFile resolve and callClaude — second upload's signal bleeds into first | ⚠️ Open |
| 5 | Low | `ingest/route.ts:96` | `parsed?.error` fallback can be an object → `String()` → `"[object Object]"` error message | ⚠️ Open |

See ERRORS.md for full diagnosis and suggested fixes for each.

---

## May 24, 2026 — Upload Flow: Vercel Blob Client-Side Upload
**What was decided:** Replace Lambda-proxied PDF upload with Vercel Blob client-side direct upload. `/api/upload` is now a token generator only. New `/api/ingest` route handles blob URL → Anthropic Files API. Base64 fallback removed.
**Why:** AWS Lambda 6MB payload cap was blocking uploads above ~5.9MB. `serverActions.bodySizeLimit: '50mb'` in `next.config.mjs` does not apply to Route Handlers — it was a no-op. Client-side Vercel Blob upload bypasses Lambda entirely.
**What was rejected:** Keeping the Lambda-proxied route with a higher limit — no clean way to raise AWS Lambda's hard cap for serverless functions.

---

## May 24, 2026 — No Local Dev Environment
**What was decided:** Ross does not run the app locally. All development ships directly to Vercel via GitHub push. `.env.local` exists but all values are blank except `NEXT_PUBLIC_POSTHOG_HOST` and `BLOB_READ_WRITE_TOKEN` (added May 24).
**Why:** No terminal knowledge; no local Node version configured for this project (system Node is v12.3.1, too old; Node@25 is installed at `/usr/local/opt/node@25/bin/` but not on PATH by default).
**What was rejected:** Local dev server testing — not feasible given setup.
**Note:** When npm is needed, use `PATH="/usr/local/opt/node@25/bin:$PATH" npm ...`

---

## May 24, 2026 — Component Map (Reference for All Future Sessions)
The 10 addressable sections of the app:
1. **Upload Flow** — `app/api/upload/route.ts`, `app/api/ingest/route.ts`, `uploadFile()` in PlansparencyApp.tsx
2. **AI / Chat Engine** — `app/api/chat/route.ts` (Anthropic call, streaming, system prompt)
3. **Plan Dashboard** — `PlanDashboard` component, PlansparencyApp.tsx ~line 1047 (tile cards after SPD upload)
4. **Contribution Calculator** — `CalcPanel` component, PlansparencyApp.tsx ~line 1323
5. **Statement Dashboard** — `StatementDashboard` component, PlansparencyApp.tsx ~line 1629
6. **Chat Interface** — `Plansparency` main function, PlansparencyApp.tsx ~line 1828 (CHAT/UPLOADING stages)
7. **Privacy & Consent Screen** — `STAGE.PRIVACY` logic, PlansparencyApp.tsx ~line 1976
8. **Investments Panel** — `InvestmentsPanel` + `FundRow`, PlansparencyApp.tsx ~line 738
9. **Key Terms** — `KeyTermsPanel` + `i18n.en.keyTerms`, PlansparencyApp.tsx ~line 557 / line 154
10. **Advisor & Participant Pages** — `app/advisor/`, `app/p/[slug]/[planId]/page.tsx`, `lib/supabase.ts`

---

## Session Summary, May 20, 2026
**Worked on:** Investments tab architecture — fund extraction, sortable lineup, TabBar design; file size fix; version drift diagnosis.
**Completed:** All architecture decisions finalized; 3 Claude Code prompts written and corrected to target PlansparencyApp.tsx; TO-DO list established; version drift problem diagnosed and resolved conceptually.
**In progress:** Claude Code prompts not yet run — Step 1 (fundsData), Step 2 (TabBar + InvestmentsPanel), file size fix.
**Decisions made:** Fund company fact sheets only; no performance data; medium depth; expense ratio sort conditional; Version A advisor fallback; ERISA attorney required before public launch; GitHub is source of truth; JSX file retired.
**Next session:** Run the 3 Claude Code prompts in order (file size fix → Step 1 → Step 2). Test with Equitable enrollment booklet. If 404(a)(5) docs are available, upload them and check expense ratio extraction.

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
**Why:** Enables the core advisor→participant product loop: advisor uploads → shareable `/p/{plan_id}` URL → participant loads pre-analyzed plan without re-uploading.
**What was rejected:** File-based storage; Vercel KV (not suited for binary blobs); keeping participant upload as the only entry point.

---

## May 28, 2026 — Advisor Upload Flow: /api/ingest → fileId → /api/chat
**What was decided:** Advisor upload page uses `/api/ingest` (Node.js) to get an Anthropic `fileId` first, then passes `fileIds: [fileId]` to `/api/chat` (edge). Raw base64 is never sent to the edge function.
**Why:** Vercel Edge Functions have a ~4MB request body cap. A 3MB PDF base64-encodes to ~4MB. Any real-world plan document would hit the cap before the app's own 30MB guard fires. The `/api/ingest` Node.js route (pre-existing) handles large bodies correctly. The `/api/chat` edge route already had a `fileIds` code path — it just wasn't wired up from the advisor page.
**What was rejected:** Sending raw base64 to the edge function (broken for real documents); creating a new upload route (unnecessary — `/api/ingest` already exists).

---

## May 28, 2026 — Security Hardening: Auth on Save-Plan + Advisor Layout
**What was decided:** `/api/save-plan` checks Clerk session when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is present. `app/advisor/layout.tsx` blocks `/advisor` in production when Clerk key is absent (redirects to `/`).
**Why:** The save-plan route had zero auth — any anonymous client could create Supabase rows. The layout had a bypass that silently served the page publicly when Clerk wasn't configured.
**Pattern (both files):** Conditional on `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — enforces auth when Clerk is configured, allows dev access when key is absent. Layout adds a third case: production without key → redirect `/`.
**What was rejected:** Unconditional Clerk auth (breaks dev without keys); leaving the bypass as-is (public advisor page in any misconfigured deploy).

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
- Full Supabase setup (tables, bucket, env vars) done via Management API — no manual SQL/dashboard steps required
- Advisor upload page live and functional
- Participant plan page (`/p/[plan_id]`) live
- 7 consecutive Vercel build failures resolved (3 root causes: lazy Supabase init, params Promise fix, @types/react mismatch)
- 6 code-review findings resolved across 6 commits
**In progress:** Nothing blocking.
**Decisions made:** See May 28 entries above.
**Next session:** Read MEMORY.md first. Investments tab build (prompts were written May 20 — still pending). Test advisor upload end-to-end with a real plan document.
