# Plansparency — CONTEXT.md (Single Source of Truth)
*Last updated: October 4, 2026 — Founder: Ross Ginsberg*

---

## Operating Rules (Quick Reference)
Full rules live in CLAUDE.md. Key rules for every session:
- Read MEMORY.md → ERRORS.md → CONTEXT.md before acting on anything
- Output Claude Code prompts only — never terminal commands
- Break code into multiple steps to avoid token overload
- Log decisions in MEMORY.md, failures in ERRORS.md
- Never contradict a logged decision without flagging it first
- Workflow (Sept 27, 2026): Cowork = talk it out + keep .md files + write `PHASE PROMPTS/PHASE-NN-name.md`; Claude Code in VS Code = run one prompt file at a time. `/close` edits the 5 .md files in the repo directly (no download/re-upload)
- The to-do list lives in **OPEN-ITEMS.md** only
- **Proof a code change shipped = a Ready deployment in Vercel with the expected commit message + live behavior change. Never an agent saying "done." (June 11, 2026)**

---

## Verified State — October 4, 2026 (read from repo + Vercel, not from memory)
- **Repo `main` = `origin/main` = production.** Last commit `27e6f7e` (PHASE-10 docs). All PHASE-10 deployments READY in Vercel.
- **Phases done:** 01 to 10. Latest: PHASE-07 calculator redesign (Sept 30), PHASE-08 calculator follow-ups (Oct 3), PHASE-09 landing + advisor review step (Oct 4), PHASE-10 prompt caching + token logging + stock answers (Oct 4).
- **Not yet tested by Ross:** PHASE-09 and PHASE-10 click-through (see OPEN-ITEMS "START HERE"). No `chat_usage` / `stock_answer` log lines in Vercel yet.
- **Uncommitted:** Cowork doc edits from the Oct 4 /close only.
- **Invite links (`/p/...`) stay off** until the 🔴 security section in OPEN-ITEMS closes. Plan-code box on the landing page is built but hidden (`PLAN_CODES_ENABLED = false`).
- **Cowork git rule (Oct 4):** Cowork runs only read-only git (`git --no-optional-locks status`, `git log`). A plain `git status` from Cowork once left `.git/index.lock` behind.

---

## What It Is
AI-powered 401(k) plan document interpreter. Participant uploads their SPD or enrollment booklet. Claude reads it and answers questions in plain English — education only, never advice. Auto-populates a contribution/match calculator via PLANDATA extraction. Bilingual EN/ES. Sessionless — no data stored.

---

## Current Build — Live as of June 2026

- **Framework**: Next.js (App Router) — migration completed May 3–5, 2026
- **Repo**: `RuGinzo13/plansparency` (GitHub, private)
- **Live component**: `components/PlansparencyApp.tsx` ← THE REAL FILE. All Claude Code prompts target this.
- **App structure**: `app/advisor/`, `app/api/`, `app/p/`, `app/try/`, `app/page.tsx`, `components/PlansparencyApp.tsx`, `lib/`, `middleware.ts` (Basic Auth gate, June 11 2026), `supabase/schema.sql`
- **lib/ modules (extracted in Phase 5, June 4, 2026)**: `lib/plan/plandata.ts`, `lib/plan/stmtdata.ts`, `lib/plan/irs.ts` (PLANDATA/STMTDATA parsing + SECURE 2.0 IRS limits), `lib/i18n/index.ts` (EN/ES strings), `lib/anthropic/client.ts` (Anthropic client setup), `lib/ratelimit.ts` (Upstash rate limiting, fails open), `lib/supabase-server.ts` (lazy admin client). **`lib/supabase.ts` does NOT exist** — earlier docs referencing it were wrong (corrected June 11, 2026).
- **Deployment**: **Vercel project is named `plansparency`, live at `plansparency.vercel.app`** (verified June 11, 2026 — earlier docs said "Plansparency-nextjs"; that name is stale/wrong). `plansparency.com` currently points to a GoDaddy website builder, NOT Vercel — domain cutover is a launch-prep item.
- **⚠️ plansparency-mvp__1_.jsx IS RETIRED** — artifact from pre-Next.js prototype. Do not reference it.
- **AI**: model `claude-sonnet-4-6` (set in `lib/anthropic/client.ts`), `max_tokens` 4000, via Anthropic API — proxied through Vercel serverless route. API key never in browser. **Key rotated June 11, 2026** (old exposed key revoked; no abnormal usage found; all temp copies destroyed; `.env.local` value blanked).
- **Upload (single path since June 4 Phase 4)**: Browser → `/api/ingest` (Node.js, FormData) → Anthropic Files API → `fileId` → `/api/chat` (edge, fileId only — no PDF bytes). **Vercel Blob is fully removed from code** (confirmed by repo search June 11, 2026); `BLOB_READ_WRITE_TOKEN` deleted from Vercel. Upload **tested clean at 5.9 MB** in production June 11, 2026 — the old ~4.5 MB platform-cap fear did not bite at that size. Sizes above 5.9 MB remain untested (client limit is 25 MB).
- **Chat**: SSE streaming — stream: true to Anthropic, pipe text_delta chunks to ReadableStream. Mandatory for Vercel Hobby Edge 25s timeout.
- **Database**: Supabase project `iqloseaxxpgdpffpsizo`. Tables: `plans`, `plan_sessions`. Storage bucket: `plan-documents` (private). Env vars `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set in Vercel. Service-role key is server-only; no browser-side Supabase client exists anywhere (verified June 11, 2026).
- **Auth (current state, June 11, 2026)**: `middleware.ts` at repo root enforces **HTTP Basic Auth** on `/advisor/:path*` and `/api/save-plan` (commit `71f9357`). Fail-closed: if `ADVISOR_ACCESS_PASSWORD` env var is missing, protected paths return 401. Any username; password compared against the env var. Password was set fresh June 11 (never typed into any chat window). Participant paths (`/`, `/p/*`, `/try`, `/api/chat`, `/api/ingest`) are unaffected. Clerk remains conditional-when-key-present in `/api/save-plan` and the advisor layout; no Clerk keys configured. Full Clerk login remains the pre-public-launch plan (Task #2).
- **Rate limiting**: Upstash limiters live on `/api/chat` (20/min) and `/api/ingest` (10/min), keyed by client IP (`x-forwarded-for`, Vercel-set). `UPSTASH_REDIS_REST_URL` + `TOKEN` confirmed present in Vercel, All Environments (June 11, 2026). Limiter fails open by design. `/api/save-plan` is NOT rate limited — acceptable now that it's behind the password gate; optional hardening later.
- **advisor_token**: Generated (`crypto.randomUUID`) and stored in the advisor's localStorage, but **no server code validates it anywhere** — it is currently decorative, not an auth mechanism (verified June 11, 2026). Must be given real server-side validation before any plan-management features (edit/delete) are built.
- **plan_id**: `crypto.randomUUID()` — UUIDv4, ~122 bits of entropy, not enumerable. `/p/` links are safe to share.
- **Code quality (June 4, 2026)**: 6-phase cleanup completed — (1) dead-code removal, (2) Upstash rate limiting, (3) dependency prune, (4) collapsed upload paths, (5) extracted `lib/` modules, (6) restored type safety. `next.config.mjs` now has `typescript.ignoreBuildErrors: false`; all TS typechecks except `components/PlansparencyApp.tsx`, which keeps a documented `@ts-nocheck` (pure-UI monolith, ~193 deferred errors) pending future decomposition. `tsconfig.json` target `ES2018`. No functional behavior changed in any phase.
- **Features built**: PDF upload → SSE streaming → Claude, PLANDATA auto-extraction, calculator (PLANDATA-populated), EN/ES toggle, SECURE 2.0 IRS limits (⚠️ hardcoded to 2025 values in `lib/plan/irs.ts`: $23,500 / $7,500 / $11,250), safe harbor vs. discretionary match distinction, recordkeeper URL extraction + redirect, sessionless/no-storage, privacy consent gate, quick-ask chips, topic dashboard (12 sections), last-day provision detection, static Key Terms accordion tab, static top nav TabBar (Plan Guide | Calculator | Key Terms | Ask), advisor upload page + plan storage, participant shareable plan page, Basic Auth gate on advisor surface
- **Test SPDs**: Principal/Baer's Rug (EIN: 11-2570999), Transamerica/Conflict International, EQ/Tierra Sur (EIN: 20-3525109, PN: 001)
- **Test enrollment booklets**: Equitable (fund lineup on pages 13–14 — ~30 funds), Voya (no fund lineup), Transamerica (no fund lineup)

---

## Security Posture — Demo Scope CLOSED (June 11, 2026)

Scope decision: this build is a **demo for advisors pre-subscription**. Demo-phase security = protect Ross's money, data integrity, and demo credibility — not full product hardening.

**Closed (demo scope):**
1. ✅ Anthropic API key rotated; old key revoked; no abnormal usage; all copies destroyed; `.env.local` blanked
2. ✅ Rate limiting wired + env vars confirmed on the two expensive routes (`/api/chat`, `/api/ingest`)
3. ✅ plan_id unguessable (UUIDv4)
4. ✅ Dead `BLOB_READ_WRITE_TOKEN` credential deleted from Vercel; Blob store removed
5. ✅ `/advisor` + `/api/save-plan` behind fail-closed Basic Auth (`ADVISOR_ACCESS_PASSWORD`), fresh password
6. ✅ Live verification: `/` = 200, `/advisor` no-creds = 401 + `WWW-Authenticate`; wrong password rejected; correct password admits. End-to-end upload-through-gate (check #5) reported working but not explicitly re-confirmed — verify first thing next session.

**Parked at pre-public-launch gate (deliberate, do not re-litigate):** full Clerk login on advisor area, security headers in `next.config.mjs`, adversarial prompt-injection testing of the system prompt, server-side PDF magic-byte validation, Supabase RLS review, rate limit on `/api/save-plan`, server-side validation of `advisor_token` (required before plan-management features), >5.9 MB upload testing.

**Standing hygiene rules:** No API keys or passwords pasted into ANY chat window, ever. Secrets exist only in the issuing console + Vercel env vars. Mark remaining env vars "Sensitive" in Vercel when convenient.

---

## Investments Tab — BUILT (May 20 decisions; built + polished June 4, 2026)

> **Status (June 4, 2026):** The Investments tab is fully built — `InvestmentsPanel` + `FundRow` render the sortable, categorized fund lineup with expense ratios and fact-sheet links per the decisions below. June 4 work was **visual/UX polish only** (per user): added a `StatChip` summary strip (fund count / category count / avg expense ratio), localized sort labels + "View Summary →"/"Ver resumen →", `flexWrap` responsiveness, and fixed a bilingual bug (`<DisclosureCallout lang={lang} />` was missing its `lang` prop in the populated fund view). **Still gated: ERISA attorney review before this tab goes live publicly.**

### Decisions Finalized
- **Source documents**: Enrollment booklet or 404(a)(5) fee disclosure. SPDs do not contain fund lineups.
- **Link destination**: Fund company official fact sheet only. No Morningstar. No performance data displayed.
- **No-link rule**: If factSheetUrl cannot be confidently constructed, return null. No broken links.
- **Depth**: Medium — fund name, category, risk level, expense ratio (if in document), fact sheet link.
- **Sort**: Always available: By Category (default), A–Z. Expense Ratio sort shown only if at least one fund has expenseRatio data.
- **Default sort**: Category order → A–Z within category. Order: Cash & Stable Value → Bonds → Large Cap → Mid Cap → Small Cap → International → Specialty → Asset Allocation → Target Date.
- **Version A fallback** (no funds found): "Upload your enrollment booklet, investment guide, or 404(a)(5) fee disclosure to load your fund lineup." Advisor-facing language.
- **Version B fallback**: "Please consult your plan advisor." Via `?mode=participant` URL flag. Not yet built.
- **Risk level**: Derived from category mapping — not extracted from document.
- **⚠️ ERISA flag**: Attorney must review before this tab goes live publicly. Closer to investment advice territory than any prior feature.

### fundsData Schema (added to PLANDATA)
Each fund object: `{ name, category, expenseRatio (decimal or null), factSheetUrl (string or null) }`
Returns `[]` if no fund lineup found in document.

### Best Test Case
Equitable enrollment booklet — pages 13–14, ~30 funds, 9 categories. Full fund list should render with category headers, risk pills, and fact sheet links for Vanguard/iShares/Fidelity funds.

---

## TO-DO List

Moved to **OPEN-ITEMS.md** (Sept 27, 2026). That file is the only to-do list. Do not re-add to-dos here.

---

## Business Model

### Core Strategy
- **Revenue path**: B2B SaaS via advisor channel — NOT consumer/B2C
- **Version A**: Free public tool — proves demand, drives Version B sales. Advisors are the audience.
- **Version B**: White-label advisor dashboard — primary MRR engine

### Pricing (Version B)
| Tier | Price | Plan Limit | Session Limit | Overage | Margin Floor |
|------|-------|-----------|---------------|---------|--------------|
| Starter | $99/mo | 5 active plans | 200 sessions/mo | $0.35/session | ~75% |
| Pro | $249/mo | Unlimited | 750 sessions/mo | $0.30/session | ~82% |
| Enterprise | $499+/mo | Unlimited | 2,500 sessions/mo | $0.25/session | ~80% |
| Per-Participant (HR Direct) | $4/employee/mo | — | — | — | — |

### Session Definition
Begins on PDF upload + initial AI summary. Continues through all follow-up questions in same browser window. Ends on tab close, 30-min inactivity, or manual clear. Returning participant = new session.

### Session Cost Model
| Session Type | API Cost | Notes |
|---|---|---|
| Initial upload + summary | ~$0.08 | Always incurred |
| Each follow-up question | ~$0.038 | History grows each turn |
| Typical 4-question session | ~$0.195 | Standard use case |
| Power user (8–10 questions) | ~$0.45–$0.60 | Covered by session limits |

**⚠️ Oct 4 update (estimates, to be replaced by PHASE-10 logs):** invite-link session ~$0.16 today, ~$0.08 with caching (close to the $0.195 above). Free self-upload session ~$1.03 (whole PDF re-read each question), ~$0.40 with caching: this is the real cost risk. Stock answers (button taps) cost $0. Full report: `Reports/Plansparency-Revenue-Model-Oct-2026.pdf` (revised). See OPEN-ITEMS #37.

### ⚠️ API Margin Risk
Model per-advisor, not aggregate. Large advisors (30 plans × 150 employees × 30% adoption = 1,350 sessions ≈ $270 API cost) can exceed Pro revenue. Session limits + overage billing must be live before any large advisor onboards. Open enrollment (Oct–Dec) spikes 3–5x.

### MRR Targets
| Milestone | MRR | ARR |
|---|---|---|
| Y1 Q4 | $2,235 | $26,820 |
| Y2 Mid | $10,445 | $125,340 |
| Y2 End | $27–35K | $324–420K |
| Breakout | $75–150K | $1M+ |

**Full-time reassessment trigger**: ~$8K–$12K MRR

---

## Founder Profile — Ross Ginsberg
- 20 years in 401(k) and employee benefits advisory
- Manages 45 corporate 401(k) plans professionally — firm clients, **OFF LIMITS for pilot**
- Side business model until reassessment trigger hit
- Competitive advisor environment — no trusted advisor peers; trusted partners finding 2–3 pilot advisors
- No coding background — Claude Code is the developer

---

## #1 Priority: Compliance Gate
**Everything gates on written approval. Do not register domains, build publicly, or contact any advisor first.**

1. Pull employment agreement → review IP clause → retain attorney ($300–$500) if unclear
2. Submit OBA: one-page description — educational tech tool, no firm clients, no firm resources, separate brand, education only never advice
3. Get written approval in hand

**⚠️ Flagged June 11, 2026:** the demo at `plansparency.vercel.app` is publicly reachable, which touches the "nothing public-facing until OBA approval" rule. OBA status was raised in-session and not resolved. Address explicitly.

---

## Tech Stack

| Layer | Tool | Status |
|-------|------|--------|
| Developer | Claude Code (VS Code), driven by prompt files in `PHASE PROMPTS/` | ⚠️ Tool identity from June 11 still unconfirmed. Evidence since found: commit `71f9357` has a Claude Code co-author trailer. Confirm which panel is used before the next prompt runs |
| Framework | Next.js App Router | ✅ Live |
| API Security | Vercel Serverless API Route | ✅ Live — API key never in browser; key rotated June 11, 2026 |
| File Upload | Single path: browser → `/api/ingest` (Node.js) → Anthropic Files API | ✅ Live — Vercel Blob fully removed; tested to 5.9 MB |
| Streaming | SSE (mandatory for Vercel Hobby Edge 25s limit) | ✅ Live |
| Hosting | Vercel — project **`plansparency`**, live at plansparency.vercel.app | ✅ Live — "Plansparency-nextjs" name in older docs is stale. plansparency.com → GoDaddy builder (cutover pending) |
| Code Storage | GitHub (RuGinzo13/plansparency) | ✅ Live |
| Access Gate | `middleware.ts` Basic Auth on `/advisor` + `/api/save-plan` (`ADVISOR_ACCESS_PASSWORD`, fail-closed) | ✅ Live June 11, 2026 — demo-phase stopgap |
| Rate Limiting | Upstash via `lib/ratelimit.ts` — chat 20/min, ingest 10/min, fails open | ✅ Live — env vars confirmed June 11, 2026 |
| Analytics | PostHog | TBD |
| Privacy Policy | Termly.io free tier | ❌ Not done |
| Auth (full) | Clerk (conditional — enforced when key is set) | ⚠️ No Clerk keys configured. Pre-launch item |
| Database | Supabase (`iqloseaxxpgdpffpsizo`) | ✅ Live — plans + plan_sessions tables, plan-documents bucket; service key server-only |
| Billing | Stripe metered | ❌ Version B |
| LinkedIn | Buffer → Taplio | ❌ Version B |

---

## Build Status

| Status | Feature | Notes |
|--------|---------|-------|
| ✅ Done | PLANDATA auto-population | Core differentiator — do not change |
| ✅ Done | Education-only guardrails | Critical for ERISA |
| ✅ Done | EN/ES bilingual | Premium B2B feature |
| ✅ Done | Sessionless / no storage | Correct for Version A |
| ✅ Done | Safe harbor vs. discretionary logic | Advisors will test this |
| ✅ Done | API key secured | Vercel serverless route; rotated June 11, 2026 |
| ✅ Done | SSE streaming | Eliminates Vercel Edge timeout |
| ✅ Done | Next.js migration | GitHub → Vercel auto-deploy |
| ✅ Done | Direct FormData upload to /api/ingest | Single upload path since June 4 Phase 4; tested clean at 5.9 MB (June 11) |
| ✅ Done | Static top nav TabBar | Plan Guide, Calculator, Key Terms, Ask |
| ✅ Done | Supabase backend — plans table + plan_sessions + storage bucket | Tables live, env vars set in Vercel, schema in repo |
| ✅ Done | Advisor upload page (`/advisor`) | Drag-drop PDF → /api/ingest → /api/chat → /api/save-plan → shareable link |
| ✅ Done | Participant plan page (`/p/[plan_id]`) | Server component — fetches plan + PDF from Supabase, renders pre-loaded PlansparencyApp |
| ✅ Done | Demo-phase advisor gate | `middleware.ts` Basic Auth on `/advisor` + `/api/save-plan`, fail-closed (June 11, 2026, commit `71f9357`). Full Clerk login remains pre-launch |
| ✅ Done | Investments tab | Built + polished June 4 2026. ⚠️ ERISA review still required before public launch |
| ✅ Done | Code-quality cleanup (6 phases) | Behavior-neutral. PlansparencyApp.tsx keeps documented `@ts-nocheck` |
| ✅ Done | Calculator redesign (PHASE-07/08) | Age + salary first, 2026 limits incl. catch-up / super catch-up / Roth catch-up rule, one glossary (`lib/glossary.ts`), IRS limits in `lib/plan/irs-limits.ts` |
| ✅ Done | Landing page (PHASE-09) | One-screen start at `/` (`components/plansparency/Landing.tsx`), `/try` redirects, advisor page restyled, plan-code box hidden |
| ✅ Done | Advisor review step (PHASE-09) | Accuracy pop-up + 12-row review screen; saves `review` inside planData |
| ✅ Done | Prompt caching + token logging (PHASE-10) | `app/api/chat/route.ts`; log line `chat_usage` (numbers only) |
| ✅ Done (wording DRAFT) | Stock answers (PHASE-10) | 8 English buttons answered from planData with no AI call (`lib/answers/stockAnswers.ts`); Spanish buttons still go to the AI; taps logged via `/api/track` (`stock_answer`) |
| ⚠️ Partial | Upload: Vercel platform payload cap | 5.9 MB confirmed working in production (June 11). >5.9 MB untested; client limit 25 MB. Test a 15–20 MB scanned booklet when available |
| ⚠️ Partial | Upload: server timeout vs client timeout | `/api/ingest` maxDuration raised 60 → 120 (commit `273ef03`, May 26). Client timeout is still 180s and there is still no "Failed to fetch" → friendly message mapping |
| ✅ Done | Upload: AbortSignal.any fallback | Fixed in `273ef03` (May 26): caller abort is forwarded into the local controller when `AbortSignal.any` is missing |
| ⚠️ Fix | IRS limits stale | `lib/plan/irs.ts` uses 2025 limits. 2026 base limit is $24,500 per IRS |
| ⚠️ Fix | Upload copy contradicts code | `lib/i18n/index.ts` `dropSub` says "4.5 MB max per doc" (EN + ES); code allows 25 MB |
| ⚠️ Fix | Privacy policy | Termly.io before Version A launch |
| ⚠️ Fix | ERISA disclaimer | Attorney review before Investments tab goes live |
| ⚠️ Fix | EIN + Plan Number in PLANDATA | 15-min Claude Code update before Version B |
| ⚠️ Fix | advisor_token has no server-side validation | Currently decorative. Must be validated server-side before plan edit/delete features exist |
| ❌ Build | Advisor dashboard / white-label | Version B core |
| ❌ Build | AOR lock (EIN+PN in Supabase) | Version B Day 1 — ~4 hours |
| ❌ Build | Session limit enforcement | Version B Day 1 |
| ❌ Build | Stripe metered overage billing | Version B Day 1 — ~3 hours |
| ❌ Build | Advisor feedback portal | Version B Day 1 |
| ❌ Build | DOL EFAST2 auto-verification | Version B Month 2 — ~3 hours |
| ❌ Build | LinkedIn automation | Version B — Make.com + Vercel cron |

---

## Launch Timeline

| Phase | Timing | Status | Actions |
|-------|--------|--------|---------|
| Pre-Launch | Weeks 1–4 | 🔄 Partial | Employment attorney → compliance OBA ← **GATE** → ERISA attorney → Termly → DPA |
| Version A Build | Weeks 5–6 | ✅ Done | Next.js migration, API security, streaming |
| Version A Test | Weeks 7–9 | 🔄 Active | Investments tab test, 3 SPDs in production, demo-security closed June 11 |
| Private Pilot | Weeks 10–14 | ❌ | 2–3 advisors via partners, real plans, structured feedback |
| Version A Public | Week 15+ | ❌ | LinkedIn, Product Hunt, Reddit, advisor waitlist |
| Version B Build | Months 4–7 | ❌ | Clerk + Supabase + Stripe + AOR + white-label + feedback portal |
| Version B Launch | Month 8 | ❌ | First paying advisors, NAPA outreach |
| Scale | Month 10–18 | ❌ | HR Direct (non-advised only) + recordkeeper partnerships |

---

## Advisor of Record (AOR) System

### What the SPD Provides
- ✅ EIN — unique employer identifier (PLANDATA must be updated to extract this)
- ✅ Plan Number — combined with EIN = unique federal plan ID (add to PLANDATA)
- ✅ Plan Administrator address — used for sponsor confirmation email
- ✅ Recordkeeper name — cross-check
- ✗ Advisor name — never in SPD

### Four-Layer Safeguard
| Layer | What | When | Build Time |
|-------|------|------|------------|
| 1 | ToS attestation checkbox: "I am the AOR for this plan" | Version B Day 1 | 30 min |
| 2 | EIN+PN first-upload-wins lock in Supabase + HR Direct domain block | Version B Day 1 | ~4 hrs |
| 3 | Optional plan sponsor confirmation email (confirm/report) | Version B Month 2 | ~2 hrs |
| 4 | DOL EFAST2 auto-verification + "Plan Verified ✓" badge | Version B Month 3 | ~3 hrs |

### Dispute Process
- Challenger submits → plan sponsor gets tiebreaker email → one-click resolution
- 72-hour hold; original lock holds if no sponsor response in 7 days
- 2+ unsuccessful disputes = account flagged for manual review

---

## Legal & Compliance

### ERISA Attorney Meeting
- Core question: does output constitute "investment advice" under ERISA Section 3(21)?
- **Investments tab must be reviewed before going live** — closer to advice territory than plan feature questions
- Bring: live demo, printed system prompt, current disclaimers, 1-page product description, 3–5 sample Q&A outputs, Anthropic API terms
- Future session prompt: *"build the ERISA attorney deck"*

### Privacy Policy
- Termly.io free tier
- Critical: name Anthropic PBC as data processor; state session-only processing
- Add custom education-only disclaimer in Additional Disclosures
- Publish at plansparency.com/privacy before Version A launch

### Data Processing Agreement (DPA)
- BAA (HIPAA term) does NOT apply — Plansparency is ERISA-governed
- When enterprise buyers ask for "BAA" — provide DPA instead
- Response: *"Plansparency processes under ERISA not HIPAA. We provide a Data Processing Agreement covering exactly what your compliance team needs. We can have it within 48 hours."*
- Cost: ~$500 attorney draft. Required before first HR Direct sales conversation.

### Legal Checklist
- [ ] Employment agreement IP clause reviewed
- [ ] Employment attorney retained (if needed)
- [ ] Compliance OBA submitted + **written approval received** ← GATE
- [ ] ERISA attorney disclaimer review ($500–$800) ← required before Investments tab live
- [ ] Termly privacy policy published
- [ ] DPA drafted ($500) — before Month 10 HR Direct
- [ ] LLC formed (after compliance approval)
- [ ] Stripe + metered billing configured
- [ ] Anthropic API commercial terms confirmed
- [ ] Domains registered (AFTER compliance approval only)

---

## Advisor Feedback Portal (Version B)
| Component | Method | Priority |
|-----------|--------|----------|
| AI Accuracy Flag (wrong answer reporting) | Claude Code + Supabase | Day 1 — **highest priority** |
| Bug/issue report (auto-includes session ID) | Claude Code + Supabase | Day 1 |
| Feature request form | Claude Code + Supabase | Day 1 |
| Session rating (1–5 stars) | PostHog event | Day 1 |
| Feature voting board | Canny.io embed | Month 2 |
| Quarterly NPS survey | Resend.com | Month 3 |

---

## LinkedIn Automation (Version B)
- **Flow**: Vercel cron (Mon 8am) → Claude API → Make.com → Buffer/Taplio → LinkedIn
- **Themes**: Live Demo / Education / Data+Stats / Bilingual Spotlight / Social Proof
- **Cost**: $0–$6/mo (Buffer) → $39/mo (Taplio when LinkedIn drives revenue)
- **Start now**: Collect pilot advisor quotes — social proof posts convert best

---

## Channel Conflict Rules
- **Months 1–8**: Advisors only
- **Month 10+**: HR Direct — non-advised plans only (no active advisor relationship)
- **Year 2+**: Recordkeeper partnerships — additive only; advisor-branded upgrade must exist alongside generic version
- **AOR lock prevents**: HR bypassing advisor, competing advisors claiming same plan
- **Hard rule**: No recordkeeper deal can give free access to plans managed by paying advisors

---

## Competitive Landscape
| Competitor | Threat | Plansparency Edge |
|-----------|--------|-------------------|
| Fidelity/Empower/Vanguard | HIGH | Recordkeeper-locked; cross-recordkeeper is the wedge |
| LearnLux/Financial Finesse | MED | Generic education; Plansparency reads your specific plan |
| ChatGPT/generic AI | MED | No advisor wrapper, no white-label, no ERISA guardrails |
| RiXtrema 401kAI | LOW | Advisor-side only — different use case |
| HR Benefits Portals | MED | Different buyer, slower to move |

**Window**: ~18 months.
**Positioning**: *"The only tool that reads your clients' actual plan documents and answers their 401(k) questions in plain English — in English and Spanish — so you can serve more participants without more hours."*

---

## Component Map — Reference for All Future Sessions
*Use these names to scope any feature request, fix, or change. Line numbers re-checked Sept 27, 2026; they move, so prompts should find components by name, not line.*

| # | Name | Files / Location | Scope |
|---|------|-----------------|-------|
| 1 | **Upload Flow** | `app/api/ingest/route.ts`, `uploadFile()` in PlansparencyApp.tsx | File size limits, supported types, upload errors, Anthropic handoff. (`app/api/upload` was deleted in June 4 Phase 4) |
| 2 | **AI / Chat Engine** | `app/api/chat/route.ts` | System prompt, guardrails, answer tone, new topics, streaming |
| 3 | **Plan Dashboard** | `PlanDashboard` (~line 860), PlansparencyApp.tsx | Tile cards after SPD upload — eligibility, match, vesting, loans, etc. |
| 4 | **Contribution Calculator** | `CalcPanel` (~line 1241), PlansparencyApp.tsx | Salary/match/IRS limit math, SECURE 2.0 catch-up logic |
| 5 | **Statement Dashboard** | `StatementDashboard` (~line 1545), PlansparencyApp.tsx | Account statement view — balance, money in/out, fees, charts |
| 6 | **Chat Interface** | `Plansparency` main fn (~line 1749), PlansparencyApp.tsx | Conversation UI, message bubbles, quick-ask chips, streaming display |
| 7 | **Privacy & Consent Screen** | `STAGE.PRIVACY` ~line 1976, PlansparencyApp.tsx | Pre-upload privacy disclosure and consent gate |
| 8 | **Investments Panel** | `InvestmentsPanel` (~line 526) + `FundRow` (~line 401), PlansparencyApp.tsx | Fund lineup — categories, expense ratios, risk labels, fact sheet links |
| 9 | **Key Terms** | `KeyTermsPanel` (~line 309), `i18n` in `lib/i18n/index.ts` | Glossary accordion — EN/ES 401(k) definitions |
| 10 | **Advisor & Participant Pages** | `app/advisor/page.tsx`, `app/advisor/layout.tsx`, `app/p/[plan_id]/page.tsx`, `app/api/save-plan/route.ts`, `lib/supabase-server.ts` | Advisor upload + plan list, shareable participant plan pages, Supabase plan storage. (`lib/supabase.ts` does not exist — June 11 correction) |
| 11 | **Access Gate** | `middleware.ts` (repo root) | Basic Auth on `/advisor/:path*` + `/api/save-plan`; fail-closed on missing `ADVISOR_ACCESS_PASSWORD` |

---

## Version Drift — Resolved
**Problem**: Claude.ai project files (stale JSX) vs. GitHub repo (live Next.js) were diverging. Same bugs kept recurring because fixes were made in the artifact and never committed to GitHub.
**Resolution**: GitHub is the single source of truth for code. The JSX artifact is retired. Claude Code edits GitHub directly.
**Process (Sept 27, 2026)**: Cowork reads and edits the .md files directly in the repo folder, then mirrors them to the claude.ai project. No manual re-upload. The repo copy wins any conflict.
**June 11 addendum**: proof of any shipped change = Ready deployment in Vercel (project `plansparency`) with the expected commit message + live behavior change. Agent chat output is never proof.

---

## Key Files
| File | Description |
|------|-------------|
| `MEMORY.md` | **Read first every session** — all logged decisions |
| `OPEN-ITEMS.md` | The single prioritized to-do list |
| `PHASE PROMPTS/` | Phase prompt files for Claude Code (`_TEMPLATE-step.md`, `README.md`, `PHASE-NN-name.md`) |
| `ERRORS.md` | Check before suggesting approaches to prior failed tasks |
| `CONTEXT.md` | This file — single source of truth |
| `CLAUDE.md` | Operating rules for Claude |
| `components/PlansparencyApp.tsx` | **Live working code** — all builds target this |
| `middleware.ts` | Basic Auth gate — `/advisor` + `/api/save-plan` (June 11, 2026, commit `71f9357`) |
| `app/page.tsx` | Next.js entry point |
| `app/api/ingest/route.ts` | FormData → Anthropic Files API → return fileId (single upload path) |
| `app/api/chat/route.ts` | Anthropic streaming call + system prompt |
| `app/api/save-plan/route.ts` | Validates body, uploads PDF to Supabase Storage, inserts plan row, returns plan_id + advisor_token + share_url. Behind Basic Auth |
| `app/advisor/page.tsx` | Client component — advisor upload UI, plan list, copy/preview shareable links |
| `app/advisor/layout.tsx` | Clerk gate when key present; open when absent — superseded in practice by middleware Basic Auth |
| `app/p/[plan_id]/page.tsx` | Server component — fetches plan + PDF from Supabase, renders PlansparencyApp pre-loaded |
| `lib/supabase-server.ts` | Lazy-initialized Supabase admin client (server-only, singleton). Only Supabase client in the codebase |
| `lib/plan/plandata.ts`, `lib/plan/stmtdata.ts`, `lib/plan/irs.ts` | PLANDATA/STMTDATA extraction + SECURE 2.0 IRS limits |
| `lib/i18n/index.ts` | EN/ES string tables |
| `lib/anthropic/client.ts` | Anthropic client setup |
| `lib/ratelimit.ts` | Upstash rate limiting — fails open |
| `supabase/schema.sql` | Table definitions for plans + plan_sessions — re-runnable (IF NOT EXISTS) |
| `401k_Education_Project_Knowledge_Base.md` | Research foundation |
| `Plansparency-Project-Brief.docx` | Formal project spec v3 |
| `EQ_SPD_Test.pdf` | Test doc — Tierra Sur (EIN: 20-3525109, PN: 001) |
| `Equitable_Enrollment_Booklet.pdf` | Best Investments tab test — has fund lineup |
| `Principal_SPD_Test.pdf` | Test doc — Baer's Rug (EIN: 11-2570999) |
| `Transamerica_SPD_Test.pdf` | Test doc — Conflict International |

---

*Single source of truth for build state. Edited in place in the repo; mirrored to the claude.ai project.*

---

## Design References (added Sept 29, 2026)
- **Design System "Plansparency"** (claude.ai artifact, Ross's gallery): colors, type, spacing and core components exactly as `components/plansparency/theme.ts` had them at `e573bf2`, with contrast problems flagged and fixes proposed. PHASE-07 applies most fixes; update the artifact after it lands.
- **Design canvas "Calculator Redesign"** (claude.ai artifact): approved clickable mockup, phone + web boards. Source for PHASE-07 Step 6. Revisit per OPEN-ITEMS #23.
- **Definitions:** after PHASE-07, `lib/glossary.ts` is the only place a term is defined (Key Terms, calculator bubbles, Plan Guide wording). IRS amounts in definitions come from `lib/plan/irs-limits.ts`.

