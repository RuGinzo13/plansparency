# Plansparency — OPEN-ITEMS.md
*The only to-do list. Ranked. Last updated: September 28, 2026 (verified against repo `71f9357` + Vercel production).*
*Owner key: **Ross** = decision or dashboard task. **CC** = Claude Code prompt file needed. Nothing marked CC gets a prompt file until it has been talked through in Cowork.*

---

## P0 — Decide or confirm before any new build work

| # | Item | Owner | Notes |
|---|------|-------|-------|
| 1 | **OBA: talk to compliance** | Ross | **Sept 28:** site now locked behind the advisor password (`f412806`, verified), so the public exposure is closed. Still open: the compliance conversation itself. When approved: add `SITE_PUBLIC` = `true` in Vercel env vars and redeploy. |
| 2 | ~~Commit the doc changes~~ | ✅ | Done Sept 28 by hand in VS Code (`6fc4269`, `0fe1d44`), Vercel Ready. Claude Code auto mode was down. A local workspace file got committed by accident; removal is Phase 01 Step 2b. |
| 3 | ~~Confirm which VS Code panel runs prompts~~ | ✅ | Settled Sept 28: `8d53a79` was written by Claude Code (co-author trailer "Claude Sonnet 5"). The June 11 "wrong tool" theory is retired. |
| 4 | ~~Confirm check #5~~ | ✅ | Sept 28: advisor upload → share link → participant view loaded and answered a question, behind the new site lock. |
| 5 | ~~Supabase keep-alive is broken~~ | ✅ (verify Oct 5) | Fixed Sept 28: `8d53a79` (queries `plan_id`, logs failures), Vercel Ready, manual cron run returned 200. Cowork re-checks around Oct 5 that the project is still ACTIVE_HEALTHY. |

## P1 — Wrong or misleading things participants can see

| # | Item | Owner | Notes |
|---|------|-------|-------|
| 6 | **IRS limits are 2025 values** → calculator upgrade | CC | **Sept 28:** Ross chose Option B + feature build. Ready: `PHASE PROMPTS/PHASE-02-calculator-2026.md` (3 steps: typed math + year table; wire UI + 2026 label + dead FR/IT removal; limit tracker + Roth catch-up card). 2026 figures verified from IRS/Notice 2025-67. |
| 7 | **Upload copy contradicts code:** drop zone says "4.5 MB max per doc" (EN + ES, `lib/i18n/index.ts` `dropSub`); code allows 25 MB | CC | Decide the honest number first. Only 5.9 MB is proven in production. |
| 8 | Stale comment in `app/advisor/layout.tsx` says the advisor area is "OPEN" | CC | Middleware has gated it since June 11. Comment-only fix; fold into another prompt. |

## P2 — Reliability and testing

| # | Item | Owner | Notes |
|---|------|-------|-------|
| 9 | Finding #1 (partial): no friendly message when the upload connection drops | CC | `maxDuration` is already 120. Missing: map `TypeError: Failed to fetch` / `Load failed` to a plain-language timeout message. |
| 10 | Finding #4: `analyzeSignal` read after the upload `await` | CC | Capture the controller once at the start of the upload handler(s). Low severity. |
| 11 | Test Investments tab with the Equitable enrollment booklet (~30 funds, pp. 13–14) | Ross | |
| 12 | Test an upload above 5.9 MB (15–20 MB scanned booklet) | Ross | Result decides #7. |
| 13 | EIN + Plan Number: advisor flow extracts and saves them; `/api/chat` system prompt does not mention them | CC | Verify whether the participant flow needs them before building anything. |
| 14 | Delete merged `dashboard-redesign` branch (local + GitHub) | CC | Housekeeping. |

## P3 — Pre-launch gate (nothing here goes public until done)

- [ ] Employment agreement IP clause reviewed (attorney if unclear)
- [ ] Compliance OBA written approval ← **GATE** (see #1)
- [ ] ERISA attorney review, including Investments tab and disclaimers ($500–$800, estimate)
- [ ] Privacy policy (Termly.io), name Anthropic as processor
- [ ] Security bundle (parked June 11): Clerk login, security headers, prompt-injection testing, PDF magic-byte check, Supabase RLS review, `/api/save-plan` rate limit, server-side `advisor_token` validation
- [ ] Point `plansparency.com` at Vercel (currently GoDaddy builder)
- [ ] 404(a)(5) fee disclosure test docs (unlocks expense-ratio sort)
- [ ] Investments Version B fallback (`?mode=participant`)
- [ ] Key Terms in the Plan Guide tab bar (verify whether still needed; the top TabBar already has Key Terms)

## P4 — Version B backlog (after pilot)

- [ ] Clerk keys in Vercel → real advisor accounts
- [ ] AOR lock (EIN+PN first-upload-wins)
- [ ] Session limits + Stripe metered overage (must exist before any large advisor onboards)
- [ ] Advisor dashboard (plans, session counts)
- [ ] White-label (logo + firm name)
- [ ] Advisor feedback portal (AI accuracy flag first)
- [ ] DOL EFAST2 verification
- [ ] LinkedIn automation

## Tech debt (schedule deliberately, not opportunistically)

- [ ] Calculator does not compute non-safe-harbor match formulas (all treated as "discretionary, not calculated" per earlier decision). Many plans have a fixed formula. Revisit only as a deliberate decision (needs PLANDATA to tell fixed vs discretionary, and ERISA-wording care).
- [ ] Remaining FR/IT dead branches outside CalcPanel in `PlansparencyApp.tsx` (Phase 02 only cleans the calculator).

- [ ] Decompose `components/PlansparencyApp.tsx` (2,430 lines, `@ts-nocheck`, ~193 deferred type errors). Multi-prompt project; plan it in Cowork first.
- [ ] Retired prototype `plansparency-mvp.jsx` (110 KB, May 23) is still tracked in the repo root. Nothing should import it; confirm and delete in a future phase step.
- [ ] `Project-Execution-Plan.md` is stale (May 28) and tells Ross to run terminal commands. Retire or rewrite.

## claude.ai project housekeeping (Ross)

- [ ] Remove `plansparency-mvp (1).jsx` and `Plansparency-Session-Summary.md` (April) from the project docs. Both are retired and can mislead project chats.

---

## Done (recent)
- ✅ Sept 27, 2026 — Docs re-verified against code; drift corrected; workflow reset (see MEMORY.md)
- ✅ May 26, 2026 (found Sept 27) — Finding #3 AbortSignal fallback, Finding #5 error string, Finding #1 maxDuration → 120 (commit `273ef03`)
- ✅ June 11, 2026 — API key rotated; Basic Auth gate; rate-limit env vars confirmed; Blob token removed
