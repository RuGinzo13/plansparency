# Plansparency — CONTEXT.md (Single Source of Truth)
*Last updated: May 20, 2026 — Founder: Ross Ginsberg*
*Merged from CONTEXT.md (May 2) + AddlCONTEXT.md (May 20). AddlCONTEXT.md is now retired.*

---

## Operating Rules (Quick Reference)
Full rules live in CLAUDE.md. Key rules for every session:
- Read MEMORY.md → ERRORS.md → CONTEXT.md before acting on anything
- Output Claude Code prompts only — never terminal commands
- Break code into multiple steps to avoid token overload
- Log decisions in MEMORY.md, failures in ERRORS.md
- Never contradict a logged decision without flagging it first
- `/close` produces: CONTEXT.md, MEMORY.md, ERRORS.md (3 files only)

---

## What It Is
AI-powered 401(k) plan document interpreter. Participant uploads their SPD or enrollment booklet. Claude reads it and answers questions in plain English — education only, never advice. Auto-populates a contribution/match calculator via PLANDATA extraction. Bilingual EN/ES. Sessionless — no data stored.

---

## Current Build — Live as of May 2026

- **Framework**: Next.js (App Router) — migration completed May 3–5, 2026
- **Repo**: `RuGinzo13/plansparency` (GitHub, private)
- **Live component**: `components/PlansparencyApp.tsx` ← THE REAL FILE. All Claude Code prompts target this.
- **App structure**: `app/advisor/`, `app/api/`, `app/p/`, `app/try/`, `app/page.tsx`, `components/PlansparencyApp.tsx`
- **Deployment**: Vercel project: `Plansparency-nextjs` (live). Old project `Plansparency` is retired.
- **⚠️ plansparency-mvp__1_.jsx IS RETIRED** — artifact from pre-Next.js prototype. Do not reference it.
- **AI**: Claude Sonnet 4 via Anthropic API — proxied through Vercel serverless route. API key never in browser.
- **Upload**: SSE streaming — stream: true to Anthropic, pipe text_delta chunks to ReadableStream. Mandatory for Vercel Hobby Edge 25s timeout.
- **Features built**: PDF upload → SSE streaming → Claude, PLANDATA auto-extraction, calculator (PLANDATA-populated), EN/ES toggle, SECURE 2.0 IRS limits, safe harbor vs. discretionary match distinction, recordkeeper URL extraction + redirect, sessionless/no-storage, privacy consent gate, quick-ask chips, topic dashboard (12 sections), last-day provision detection, static Key Terms accordion tab, static top nav TabBar (Plan Guide | Calculator | Key Terms | Ask)
- **Test SPDs**: Principal/Baer's Rug (EIN: 11-2570999), Transamerica/Conflict International, EQ/Tierra Sur (EIN: 20-3525109, PN: 001)
- **Test enrollment booklets**: Equitable (fund lineup on pages 13–14 — ~30 funds), Voya (no fund lineup), Transamerica (no fund lineup)

---

## Investments Tab — In Progress (May 20, 2026)

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

### Claude Code Prompts — Ready to Run (in order)
1. `fix(upload): raise PDF size limit to 25MB` — find size check in PlansparencyApp.tsx or API route, raise to 25MB
2. `feat(investments): add fundsData extraction to PLANDATA schema` — Step 1 prompt
3. `feat(investments): add Investments tab with sortable fund lineup` — Step 2 prompt

### Best Test Case
Equitable enrollment booklet — pages 13–14, ~30 funds, 9 categories. Full fund list should render with category headers, risk pills, and fact sheet links for Vanguard/iShares/Fidelity funds.

---

## TO-DO List

### Investments Tab
- [ ] Run Step 1 prompt (fundsData extraction)
- [ ] Run Step 2 prompt (TabBar + InvestmentsPanel)
- [ ] Run file size fix (25MB)
- [ ] Test with Equitable enrollment booklet
- [ ] Upload 404(a)(5) fee disclosure documents (unlocks expense ratio data + sort)
- [ ] ERISA attorney review before Investments tab goes live publicly
- [ ] Version B: participant-facing fallback message (`?mode=participant`)
- [ ] Key Terms tab integration into updated TabBar

### Pre-Launch
- [ ] Privacy policy — Termly.io
- [ ] ERISA disclaimer — attorney review ($500–$800)
- [ ] Compliance OBA — written approval
- [ ] Employment agreement IP clause reviewed
- ✅ ~~API key in browser~~ — solved (Vercel serverless route)
- ✅ ~~PDF re-sent on every call~~ — solved (SSE streaming)
- ✅ ~~Version drift~~ — solved (GitHub is source of truth)

### Version B (Not Started)
- [ ] Advisor dashboard / white-label
- [ ] AOR lock (EIN+PN in Supabase)
- [ ] Session limit enforcement (Supabase + Stripe metered)
- [ ] Stripe metered overage billing
- [ ] Advisor feedback portal (AI Accuracy Flag + bug report)
- [ ] DOL EFAST2 auto-verification
- [ ] Clerk auth
- [ ] LinkedIn automation

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

---

## Tech Stack

| Layer | Tool | Status |
|-------|------|--------|
| Developer | Claude Code (VSCode) | ✅ Active |
| Framework | Next.js App Router | ✅ Live |
| API Security | Vercel Serverless API Route | ✅ Live — API key never in browser |
| Streaming | SSE (mandatory for Vercel Hobby Edge 25s limit) | ✅ Live |
| Hosting | Vercel (Plansparency-nextjs project) | ✅ Live |
| Code Storage | GitHub (RuGinzo13/plansparency) | ✅ Live |
| Analytics | PostHog | TBD |
| Privacy Policy | Termly.io free tier | ❌ Not done |
| Auth | Clerk | ❌ Version B |
| Database | Supabase | ❌ Version B |
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
| ✅ Done | API key secured | Vercel serverless route |
| ✅ Done | SSE streaming | Eliminates Vercel Edge timeout |
| ✅ Done | Next.js migration | GitHub → Vercel auto-deploy |
| ✅ Done | Static top nav TabBar | Plan Guide, Calculator, Key Terms, Ask |
| 🔄 In progress | Investments tab | Prompts written, not yet run |
| ⚠️ Fix | File size limit | Raise to 25MB — prompt ready |
| ⚠️ Fix | Privacy policy | Termly.io before Version A launch |
| ⚠️ Fix | ERISA disclaimer | Attorney review before Investments tab goes live |
| ⚠️ Fix | EIN + Plan Number in PLANDATA | 15-min Claude Code update before Version B |
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
| Version A Test | Weeks 7–9 | 🔄 Active | Investments tab build + test 3 SPDs in production |
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

## Version Drift — Resolved
**Problem**: Claude.ai project files (stale JSX) vs. GitHub repo (live Next.js) were diverging. Same bugs kept recurring because fixes were made in the artifact and never committed to GitHub.
**Resolution**: GitHub is the single source of truth for code. The JSX artifact is retired. Claude Code edits GitHub directly.
**Process**: After every Claude Code session that changes code → run `/close` here → re-upload CONTEXT.md, MEMORY.md, ERRORS.md. That's the only sync required.

---

## Key Files
| File | Description |
|------|-------------|
| `MEMORY.md` | **Read first every session** — all logged decisions |
| `ERRORS.md` | Check before suggesting approaches to prior failed tasks |
| `CONTEXT.md` | This file — single source of truth |
| `CLAUDE.md` / `PlanCLAUDE.md` | Operating rules for Claude |
| `components/PlansparencyApp.tsx` | **Live working code** — all builds target this |
| `app/page.tsx` | Next.js entry point |
| `app/api/` | Serverless API routes |
| `401k_Education_Project_Knowledge_Base.md` | Research foundation |
| `Plansparency-Project-Brief.docx` | Formal project spec v3 |
| `EQ_SPD_Test.pdf` | Test doc — Tierra Sur (EIN: 20-3525109, PN: 001) |
| `Equitable_Enrollment_Booklet.pdf` | Best Investments tab test — has fund lineup |
| `Principal_SPD_Test.pdf` | Test doc — Baer's Rug (EIN: 11-2570999) |
| `Transamerica_SPD_Test.pdf` | Test doc — Conflict International |

---

*Single source of truth. Replace both CONTEXT.md and AddlCONTEXT.md with this file. AddlCONTEXT.md is retired.*
*Re-upload after every session alongside MEMORY.md and ERRORS.md.*
