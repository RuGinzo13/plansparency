# Plansparency — OPEN-ITEMS.md
*The only to-do list. Ranked. Last updated: September 30, 2026 (verified against repo `fd1e02f` + Vercel: all 7 PHASE-07 deploys Ready).*
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
| 6 | ~~IRS limits / calculator upgrade~~ | ✅ | Phase 02 done: `3697a23`, `6378a3f`, `b735d77`. |
| 7 | **PARKED (Ross, Sept 28): upload limit 4.5 MB vs 25 MB** | Ross → CC | Vercel docs say function request bodies max out at 4.5 MB; June's 5.9 MB success contradicts that. Decide by test #12 when Ross is ready. If >4.5 MB fails, the fix is architectural and touches the "no storage" promise. Conflicts with CLAUDE.md "25MB, do not lower" rule. |
| 8 | ~~Stale advisor layout comment~~ | ✅ | Phase 03 `ba25e82`. |
| 19 | ~~Redesign the Calculator tab~~ | ✅ | PHASE-07 Step 6 `3dc02e6` (Sept 30). Revisit list is #23. |
| 20 | ~~IRS limits in one yearly file~~ | ✅ | PHASE-07 Step 1 `f82a19a`: `lib/plan/irs-limits.ts`, with 415(c) and HCE lines. Update each November. |
| 21 | **Design fixes, what's left after PHASE-07** | CC | Done in `40e2765` + `3dc02e6`: fonts load, readable text colors, warning color, input borders, dark-mode rules removed, calculator colors merged. Still open: (c) 9 to 10px text outside the calculator (Plan Guide footer disclaimer, StatChip labels, others); (f) hardcoded colors and corner sizes in other files. Update the Design System artifact to the new colors. |
| 22 | ~~Match eligibility never shown~~ | ✅ | PHASE-07 Step 4 `5f22386`: shown on Plan Guide "When Can You Start?"; calculator links to it. |
| 23 | **Come back to the calculator after PHASE-07 is live** | Ross + Cowork | Ross, Sept 29: "implement this and make a note to come back to it later." Open questions parked: (1) new hires: ask "how many paychecks are left this year?" so yearly totals aren't overstated; (2) optional "last year's W-2 Box 3" input for an exact Roth catch-up answer instead of the salary estimate; (3) hover preview for the Traditional/Roth bubbles on web; (4) a "Good to know" line on year-end match true-ups; (5) native-speaker review of the new Spanish strings; (6) where the calculator tab's real width switches to two columns (880px set in the phase, confirm on real screens). (7) status chips in the new calculator are 10px, spec said 11px minimum (`CalcPanel.tsx`, 3 places). (8) Spanish review list: artifact "Phase 07 Spanish Review" (123 strings, EN beside ES). **Items 1, 2, 3, 4, 7 → PHASE-08 (ready). Items 5, 6, 8 stay with Ross.** |
| 24 | **Definitions stay in one place** | CC (standing rule) | Ross, Sept 29: definitions and key terms must be consistent everywhere. After PHASE-07 every definition lives in `lib/glossary.ts`; any new screen that explains a term reads from it. Chat answers are still written by the model, not the glossary; consider feeding glossary wording into the chat instructions later. |
| 25 | **Cancel on the privacy screen crashes the app** | CC | Verified Sept 30: `components/PlansparencyApp.tsx` privacy modal Cancel button sets `pendingFileRef.current`, but that ref was renamed to `pendingFilesRef`; clicking Cancel throws and shows the error screen. One-line fix (`pendingFilesRef.current = []`). Reported by Claude Code at the end of PHASE-07. Small phase, do first. **→ PHASE-08 (ready).** |
| 26 | **Advisor page plan reader missing `hasPreTax`** | CC | `app/advisor/page.tsx` has its own copy of the plan-reading instructions (`FIRST_MSG`) that PHASE-07 didn't update. Plans uploaded through `/advisor` will show Traditional as "Likely". Better fix: one shared copy of the instructions instead of two. **→ PHASE-08 (ready).** |
| 27 | **Repo in a synced Desktop folder (accepted risk)** | Ross | Oct 3: Ross decided not to move the folder. Duplicate sync copies exist in `.git` (`index 2` to `index 6`); harmless so far. Safety net: every phase pushes to GitHub, so the worst case is re-downloading the repo. Optional low-effort fix if problems show up: rename only `plansparency-nextjs` to `plansparency-nextjs.nosync` (iCloud skips folders ending in .nosync); Cowork's connected folder stays the same, VS Code reopens the renamed folder. Cowork checks `git status` and `git fsck` after each phase. |
| 28 | **Commit `.claude/settings.json` (Auto mode)** | CC | Oct 3: Cowork changed `defaultMode` to `auto` while PHASE-08 was running, so PHASE-08's docs step won't stage it. The next phase's Step 1 must allow and commit it. |

## P2 — Reliability and testing

| # | Item | Owner | Notes |
|---|------|-------|-------|
| 9 | ~~Friendly upload errors~~ | ✅ | Phase 03 `71115a5` (EN/ES, no raw "Failed to fetch"). |
| 10 | ~~Finding #4 cancel signal~~ | ✅ | Phase 03 `71115a5`. |
| 11 | Test Investments tab with the Equitable enrollment booklet (~30 funds, pp. 13–14) | Ross | |
| 12 | **PARKED:** upload the 12 MB test file (`Info Source Documents/Upload Size Tests/TEST-12MB-Equitable-x2.pdf`) and re-upload the 5.9 MB booklet | Ross | Decides #7. |
| 13 | ~~EIN + Plan Number~~ | ✅ (checked) | Sept 28 DB check: advisor flow saves EIN + plan number (3 of 5 rows have both). Participant /try flow is sessionless and doesn't need them. No build needed. |
| 14 | ~~Delete merged branch~~ | ✅ | Phase 03: only `main` remains locally and on GitHub. |
| 15 | ~~Advisor's typed plan name never saved~~ | ✅ | PHASE-04 `d14fba8`. Confirm with next advisor upload. |
| 16 | ~~Two firm plans in the database~~ | ✅ | Sept 28: rows deleted (Cowork), stored PDFs deleted (Ross, dashboard). Verified: storage now holds exactly 3 PDFs matching the 3 remaining test plans. Anthropic copies removed by `PHASE-05`. |
| 17 | ~~Documents deleted from Anthropic when the session ends~~ | ✅ | PHASE-04 (`d108907`, `66b743a`) + PHASE-05 cleanup (`bb7ad25`): 16 old uploads deleted Sept 28. Temp key removed from `.env.local` (verified) and disabled in the console. |
| 18 | ~~Delete 2 stored PDFs in Supabase~~ | ✅ | Ross, Sept 28; verified by Cowork. |

## P3 — Pre-launch gate (nothing here goes public until done)

- [ ] Employment agreement IP clause reviewed (attorney if unclear)
- [ ] Compliance OBA written approval ← **GATE** (see #1)
- [ ] ERISA attorney review, including Investments tab and disclaimers ($500–$800, estimate)
- [ ] Privacy policy (Termly.io), name Anthropic as processor
- [ ] **PRE-PILOT PRIVACY / CONFIDENTIALITY / SECURITY WORKSTREAM (Ross, Sept 28: "a huge consideration before the pilot").** Must be designed and built before any pilot advisor gets access. Includes the items below plus: **share links (`/p/...`) — TABLED Sept 28** (today anyone with the link receives the full PDF in their browser; options: short-lived links, participant verification, server-side answering so the PDF never leaves the server); statements vs. plan documents sensitivity tiers; Zero Data Retention decision (ZDR does not cover the Files API); Supabase retention/deletion schedule; logging review (no document text in logs).
- [ ] **Document privacy at launch (Ross, Sept 28):** an uploaded document must be accessible ONLY to the person who uploaded it. Covers: real user accounts (Clerk), per-user access checks on every document read, private storage with short-lived signed links (no public URLs), encryption at rest, automatic deletion schedule, no document ever in Anthropic file storage, audit of who accessed what. Also decide whether advisor-shared plans (`/p/` links) count as "the advisor's document" and how participants are verified.
- [ ] Ask Anthropic sales about Zero Data Retention (ZDR) for the Messages API (default: inputs deleted within 30 days).
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
- [x] ~~Remaining FR/IT dead branches~~: none left (checked Sept 28; all were in CalcPanel, removed in Phase 02).

- [ ] Decompose `components/PlansparencyApp.tsx` (~2,500 lines). **Part 1 ready: `PHASE-06-split-app-file.md`** (pure moves, 5 commits; also deletes 4 unused components). Part 2 later: add types file by file and remove `@ts-nocheck` per file.
- [x] ~~Retired prototype in repo root~~: deleted in Phase 03 (`ba25e82`).
- [ ] `Project-Execution-Plan.md` is stale (May 28) and tells Ross to run terminal commands. Retire or rewrite.

## claude.ai project housekeeping (Ross)

- [ ] Remove `plansparency-mvp (1).jsx` and `Plansparency-Session-Summary.md` (April) from the project docs. Both are retired and can mislead project chats.

---

## Done (recent)
- ✅ Sept 28, 2026 — Phases 01–03: Supabase restored + keep-alive fixed; site locked until OBA; calculator 2026 upgrade; EN/ES upload errors; housekeeping
- ✅ Sept 28 — `claude-sonnet-4-6` checked: active, retirement not before Feb 17, 2027 (Anthropic deprecations page)
- ✅ Sept 27, 2026 — Docs re-verified against code; drift corrected; workflow reset (see MEMORY.md)
- ✅ May 26, 2026 (found Sept 27) — Finding #3 AbortSignal fallback, Finding #5 error string, Finding #1 maxDuration → 120 (commit `273ef03`)
- ✅ June 11, 2026 — API key rotated; Basic Auth gate; rate-limit env vars confirmed; Blob token removed
