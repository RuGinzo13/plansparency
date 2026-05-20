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

## Session Summary, May 20, 2026
**Worked on:** Investments tab architecture — fund extraction, sortable lineup, TabBar design; file size fix; version drift diagnosis.
**Completed:** All architecture decisions finalized; 3 Claude Code prompts written and corrected to target PlansparencyApp.tsx; TO-DO list established; version drift problem diagnosed and resolved conceptually.
**In progress:** Claude Code prompts not yet run — Step 1 (fundsData), Step 2 (TabBar + InvestmentsPanel), file size fix.
**Decisions made:** Fund company fact sheets only; no performance data; medium depth; expense ratio sort conditional; Version A advisor fallback; ERISA attorney required before public launch; GitHub is source of truth; JSX file retired.
**Next session:** Run the 3 Claude Code prompts in order (file size fix → Step 1 → Step 2). Test with Equitable enrollment booklet. If 404(a)(5) docs are available, upload them and check expense ratio extraction.
