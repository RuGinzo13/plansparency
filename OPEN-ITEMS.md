# Plansparency — OPEN-ITEMS.md
*The only to-do list. Ranked. Last updated: October 4, 2026 (verified against repo `27e6f7e` + Vercel: all 5 PHASE-10 deploys Ready).*
*Owner key: **Ross** = decision or dashboard task. **CC** = Claude Code prompt file needed. Nothing marked CC gets a prompt file until it has been talked through in Cowork.*

---

## ▶ START HERE (next chat, written Oct 4, 2026)
0. **✅ Done Oct 4, 2026 (`131cbce`), awaiting Ross's click-through (#40):** the 8 quick-question buttons never show for plan documents (bug, found Oct 4 when Ross saw nothing). In Claude Code: `Read "PHASE PROMPTS/PHASE-11-show-quick-buttons.md" and execute all steps in order.` Then do the click-through below; the buttons are in the **Chat** tab after an upload, not on the start page.
1. **Ross click-through of PHASE-09 + PHASE-10** (both committed and live, not yet tested by Ross):
   - `/` new one-screen landing: upload a test SPD, ask 4 typed questions in a row, then tap all 8 quick-question buttons (instant answers, badge "From your plan document"). Switch to Spanish: buttons go to the AI as before.
   - `/advisor`: upload, accuracy pop-up, 12-row review screen, save. Then open that plan's `/p/<id>` yourself only (invite links stay off): ask 3 questions; buttons show "reviewed" badge with your name and date.
   - Interim privacy line (#30) reads right on the landing page.
2. **Then tell Cowork.** Cowork reads `chat_usage` and `stock_answer` lines from Vercel runtime logs (none yet as of Oct 4) and replaces the revenue estimates (#37).
3. **🟡 Ross: final approval of stock answer wording + the glossary definitions they reuse** (#39; checklist at the bottom of `PHASE PROMPTS/PHASE-10-stock-answers-wording.md`).
4. Uncommitted Cowork doc edits since `27e6f7e` (this /close): the next phase's docs step commits them.
5. Bigger open decisions, in order: 🔴 security section below (#31, #33, #34), #38 (invite chat only sees the summary), #32 (stop storing PDFs), pricing (#35, Enterprise allowance, free-session cap).

---

## 🔴 HIGH PRIORITY SECURITY — come back to before any advisor invite link goes live (Ross, Oct 3)
**Problem:** plan details shared through an advisor's invite link must not spread beyond the plan's participants (current and former employees with a balance), while access must not depend on employment status or a work email.
**Decided so far:** one link per plan (#31); employees never get or download a plan PDF and Plansparency keeps no plan PDFs (#32); advisor must review and confirm extracted details before sharing (#32); work-email check rejected; employee list rejected for now.
**Still open:** how access is limited (#31: access code, when it changes, expiry, turning a link off), whether the plan's text can be kept for chat (#33), what a leaked link exposes, logging who opened what, and how this reads to the firm's compliance review (#1).
**Plan code on the participant landing page (Oct 4):** the start screen gets an "Enter your plan code" box so employees can reach an advisor-set-up plan without the original link. No searchable list of employers (that would reveal which companies use Plansparency). No participant log-in or accounts for now (nothing personal to store). Security needs: codes long and random enough not to be guessed, limited wrong tries per device/IP, optional "remember this plan on this device".
**Rule until solved:** invite links (`/p/...`) stay off. Nothing about advisor sharing ships before this section is closed.
**Advisor authorization (Ross, Oct 3):** what stops someone from uploading a plan they don't serve and posing as its advisor to cold-call employees? Today: nothing (`/advisor` is one shared password; plan documents are easy to get). Proposed layers, to decide: (1) verify the advisor's identity and registration (CRD number checked against FINRA BrokerCheck / SEC IAPD, firm email domain); (2) the plan sponsor approves the advisor for that plan before any link goes live. Form 5500 lookup REJECTED (Ross, Oct 3): new plans have none, plans with a fiduciary TPA have the TPA's signer not the sponsor's, names go stale. Options being brainstormed (none decided): (a) firm-level onboarding, the advisor's broker-dealer/RIA vouches for its advisors and attests the plan is on its books; (b) Plansparency calls the employer's main number from an independent public source (company website, state business registry, business listing) and asks for HR/plan administrator; (c) sponsor verifies their business by EIN through a business-verification (KYB) service, then approves the advisor; (d) proof from the recordkeeper that the advisor is advisor of record (report/letter now, recordkeeper integration later); (e) the plan's TPA confirms the sponsor contact; (f) mailed code to the business address (postcard-style, slow but strong); (g) email to an address on the company's own domain (weak for small companies on Gmail). Pilot leaning: (a) + (b) by hand. Scale: (c) or (d), still with (a). (3) one plan record per plan, matched on EIN + plan number; MULTIPLE advisors allowed (Ross, Oct 3): a lead advisor plus added advisors, every advisor approved by the sponsor (same-firm colleagues may be fast-tracked), sponsor sees and can remove anyone; a second upload of an existing plan becomes a "request to join" instead of a duplicate; (4) employees see "Verified: [firm] is the authorized advisor for [plan], confirmed by [employer] on [date]" plus a "Report a problem" link; (5) advisors never get employee names or contact info from Plansparency, so it can't be used as a lead list; (6) sponsor can remove an advisor or turn a link off anytime; (7) audit log of who uploaded, approved, shared and changed what; (8) advisor terms with an attestation.


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
| 25 | ~~Cancel on the privacy screen crashes the app~~ | ✅ | Fixed in PHASE-08 (verified live Oct 3). |
| 26 | ~~Advisor page plan reader missing `hasPreTax`~~ | ✅ | PHASE-08: advisor page now uses the shared `i18n.en.firstMessage` (verified Oct 3). |
| 27 | **Repo in a synced Desktop folder (accepted risk)** | Ross | Oct 3: Ross decided not to move the folder. Duplicate sync copies exist in `.git` (`index 2` to `index 6`); harmless so far. Safety net: every phase pushes to GitHub, so the worst case is re-downloading the repo. Optional low-effort fix if problems show up: rename only `plansparency-nextjs` to `plansparency-nextjs.nosync` (iCloud skips folders ending in .nosync); Cowork's connected folder stays the same, VS Code reopens the renamed folder. Cowork checks `git status` and `git fsck` after each phase. |
| 28 | ~~Commit `.claude/settings.json` (Auto mode)~~ | ✅ | PHASE-09 Step 1 `6f1a8e4`. |
| 29 | ~~Landing page redesign + its own file~~ | ✅ | PHASE-09: `6f1a8e4` (moved to `components/plansparency/Landing.tsx`), `0e7a2c7` (one-screen start page), `1fbb2eb` (`/` is the app, `/try` redirects), `a6c7495` (advisor page restyle). Plan-code box built but switched off (`PLAN_CODES_ENABLED = false`) until the 🔴 section closes. Ross click-through pending (START HERE). |
| 30 | **Landing page says "Document never stored" (not accurate)** | Ross + Cowork | Found Oct 3. The file is held at Anthropic for the session (up to 2 hours) and Anthropic may keep request data up to 30 days under standard terms. Replace with true wording as part of the privacy workstream; the mockup shows a placeholder. Fix before anyone outside Ross sees the site. **Interim wording in PHASE-09: "Plansparency doesn't save your document." (true for participant uploads; Ross to confirm).** |
| 31 | **Invite link access** | Ross | One link per plan (Ross, Oct 3). Access follows plan participation, not employment: former employees with a balance keep access. Work-email check REJECTED (Ross, Oct 3: locks out former employees and anyone without a work email). Employee list REJECTED for now (personal data + upkeep). Leading option: link + access code; the code changes only if the link leaks or the advisor wants a reset, not on each termination; new code goes out in the regular participant mailings that already reach former employees with balances. Plan-year auto-expiry: decide (it would cut off people who miss the new link). |
| 32 | **Stop storing plan PDFs; advisor review screen** | CC (after #33 decision) | Per Ross Oct 3: `/api/save-plan` keeps only extracted, advisor-reviewed plan info; PDF deleted after extraction; `/p/{plan_id}` never sends a PDF; existing PDFs in the `plan-documents` bucket deleted (🛑 own phase). Advisor gets an accuracy pop-up + review/correct screen before sharing is allowed. | **Oct 4:** advisor accuracy pop-up + 12-row review screen shipped in PHASE-09 `27b6990` (saves `review: {reviewerName, reviewedAt, editedFields}` inside planData). Still open: stop storing PDFs, stop sending the unused PDF to `/p` browsers.
| 33 | **Can we keep the plan's text (not the PDF)?** | Ross | Needed so invite-link employees can ask detailed questions in chat. Keeping only the structured plan info (match, vesting, limits, eligibility, loans...) limits chat to those topics. Keeping the extracted text server-side (never shown or downloadable) allows full Q&A but is close to keeping the document. Decide before #32. |
| 34 | **🔴 Advisor authorization: prove an advisor really serves a plan** | Ross + Cowork | Ross, Oct 3: stop an advisor from claiming a plan they don't serve and posing as its advisor to cold-call employees. Multiple advisors per plan must be allowed. Form 5500 lookup rejected (no 5500 for new plans; fiduciary TPA signs instead of sponsor; stale names). Seven alternative verification options and the full protection list are in the 🔴 HIGH PRIORITY SECURITY section at the top. Undecided. Blocks advisor sharing / invite links. |
| 35 | **Pricing: add advisor seats / teams?** | Ross | Ross, Oct 4: should plans-based tiers also price by number of advisors (solo vs firm)? Cowork's view: costs come from sessions (AI usage), not advisors, so plans + sessions stay the meters. Include advisors in each tier (e.g. Starter 1, Pro up to 5, Enterprise unlimited + firm admin/compliance view), optional low-cost extra seat, never a steep per-seat charge: per-seat pricing pushes teams to share one login, which breaks the per-advisor verification and audit log (#34). Co-advisors from another firm join a plan free under the lead advisor's subscription. All numbers are placeholders until tested with advisors. Mockup: "Just me / My firm" choice on create-account. |
| 36 | **Show source page numbers on the advisor review screen** | CC (later) | The mockup shows "Page 14" next to each extracted detail so advisors can check fast. The plan reader doesn't return page numbers yet; add to the extraction instructions after PHASE-09. |
| 37 | **AI cost: free self-upload tool is the cost risk; paid tiers near the old model** | Ross + Cowork + CC | CORRECTED Oct 4 (revised report in Reports/Plansparency-Revenue-Model-Oct-2026.pdf). Code check: invite-link (`/p`) chat sends only planData + saved `initial_summary`, never the PDF (`initialPdfBase64` reaches the browser but is unused, see #32). Estimated cost: invite session ~$0.16 today, ~$0.08 with caching; self-upload session ~$1.03 today, ~$0.40 with caching. Full-use margins with caching: Starter 83%, Pro 75%, Enterprise 59%. Next: (1) run PHASE-10 (caching + token logging) after PHASE-09; (2) Cowork reads `chat_usage` logs from 10 test sessions and replaces estimates; (3) cap free sessions; (4) decide Enterprise allowance/price (1,500 at $499 or $699 for 2,500); (5) overage at 3x measured cost; (6) shorter answers / Haiku test / answer common questions once per plan; (7) Vercel Pro before pilot. **Oct 4: PHASE-10 done** (`2c1e50d` caching, `197f131` `chat_usage` log). Waiting on Ross's test session, then Cowork reads the logs. |
| 38 | **Invite-link chat only sees the saved summary** | Cowork + CC | Found Oct 4: on `/p` the AI gets the fixed instructions + the saved summary + the questions. It never gets the reviewed plan details (`planData` is only used for the recordkeeper link), and the instructions tell it "the plan document is in the conversation", which is false there. Detailed questions (loan terms, hardship reasons, vesting years) can get vague or invented answers. Fix candidates: (a) stock answers built from reviewed fields (#39); (b) send a short plain-text version of the reviewed details with invite chats and swap the "document is uploaded" line for one that matches. Ties to #33. |
| 39 | **Stock answers for common questions** | Ross + Cowork | Decided Oct 4: button taps only get stock answers (typed questions go to the AI); Ross approves wording. 8 buttons: match, vesting, when can I start, Roth vs Traditional, loans, hardship, leaving my job, 2026 limit. Paycheck button opens the calculator, investments button opens the investments panel, enroll button dropped. Any missing reviewed field = that tap goes to the AI. Interactive draft: "Stock answers" board on the Landing Redesign canvas. Built in PHASE-10 Steps 3-4 from `PHASE PROMPTS/PHASE-10-stock-answers-wording.md` (DRAFT). **🟡 ROSS TO COME BACK: final approval of the stock answer wording and the glossary definitions they reuse (traditional, roth, vestingSchedule, catchUp, rothCatchUpRule); checklist at the bottom of the wording file.** Then Spanish versions. Open: loans/hardship answers are thin because review only stores yes/no. **Oct 4: built in PHASE-10** (`c4d32bd` module + `scripts/check-answers.ts` 265 checks pass; `a245ed1` chat wiring, `/api/track`, calculator link). Wording still DRAFT. |
| 40 | **Quick-question buttons never show for plan documents** | CC | Found Oct 4 (Ross saw no buttons). `showChips` checks `stage === "chat"`; plan documents use `stage "app"` with a Chat tab, so the 8 stock-answer buttons (#39) are unreachable on `/` and `/p`. Fix ready: `PHASE PROMPTS/PHASE-11-show-quick-buttons.md`. See ERRORS.md. |

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
- ✅ Oct 4, 2026 — PHASE-10: prompt caching, token logging, stock answers (`2c1e50d` → `27e6f7e`, all Vercel Ready)
- ✅ Oct 4, 2026 — PHASE-09: landing page, `/` routing, advisor restyle, advisor review step (`6f1a8e4` → `936a045`)
- ✅ Oct 3, 2026 — PHASE-08: calculator follow-ups, Cancel crash, shared plan-reader instructions
- ✅ Sept 30, 2026 — PHASE-07: calculator redesign
- ✅ Sept 28, 2026 — Phases 01–03: Supabase restored + keep-alive fixed; site locked until OBA; calculator 2026 upgrade; EN/ES upload errors; housekeeping
- ✅ Sept 28 — `claude-sonnet-4-6` checked: active, retirement not before Feb 17, 2027 (Anthropic deprecations page)
- ✅ Sept 27, 2026 — Docs re-verified against code; drift corrected; workflow reset (see MEMORY.md)
- ✅ May 26, 2026 (found Sept 27) — Finding #3 AbortSignal fallback, Finding #5 error string, Finding #1 maxDuration → 120 (commit `273ef03`)
- ✅ June 11, 2026 — API key rotated; Basic Auth gate; rate-limit env vars confirmed; Blob token removed
