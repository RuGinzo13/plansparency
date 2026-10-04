# PHASE 10 — Prompt caching, cost logging, stock answers
**Created:** Oct 4, 2026 in Cowork
**Run (Auto mode, walk away), AFTER PHASE-09 is finished:** `Read "PHASE PROMPTS/PHASE-10-prompt-caching.md" and execute all steps in order.` 5 steps, 5 commits, each pushed. No checkpoints.
**Open items:** #37 (AI cost per session), #39 (stock answers). Stock answer wording is a DRAFT: build it exactly as written in `PHASE PROMPTS/PHASE-10-stock-answers-wording.md`; Ross approves the final wording later.
**Status:** Done, Oct 4, 2026
- STEP 1 (`2c1e50d`) — prompt caching for instructions, plan document and history
- STEP 2 (`197f131`) — token usage log line per request
- STEP 3 (`c4d32bd`) — stock answers module + `scripts/check-answers.ts`
- STEP 4 (`a245ed1`) — stock answers in the chat, tap counting
- STEP 5 (docs, this commit) — Cowork docs updated

## Why
`app/api/chat/route.ts` re-sends everything with every question and uses no prompt caching. On the free self-upload route that includes the whole plan PDF (~60,000 tokens per question). On invite links it is the extracted plan details plus the saved summary (a few thousand tokens). Prompt caching lets Anthropic reuse what it read a moment ago at 1/10 of the input price ($0.30 vs $3.00 per million tokens for Sonnet 4.6; the first write costs 1.25x). We also don't know the real token counts, so this phase logs them (numbers only, never content).

## Rules for Claude Code
Same rules as PHASE-07 (read its "Rules for Claude Code" once). Auto mode, repo root, stage only named files, no deny-list commands, never `git reset/clean/stash`, never force-push. Checks after each step: `npx tsc --noEmit`, `npm run build`, `npx --yes tsx scripts/check-calc.ts`.

## STEP 1 — Make the cacheable part of every request identical, then mark it for caching

**Check the ground:** `git status` clean except Cowork docs (`*.md`, `PHASE PROMPTS/`). PHASE-09's docs commit is the latest commit. Otherwise STOP.

**Background (how caching works):** Anthropic caches the start of a request (system prompt, then messages, in that order) up to a marker `cache_control: { type: "ephemeral" }`. The cache lasts 5 minutes and resets each time it's used, which fits a chat session. Anything that changes earlier in the request breaks the cache for everything after it. So the parts that change (the extracted plan data, the latest question) must come AFTER the markers.

**What the code does today (checked by Cowork Oct 4):** `buildSystemPrompt(lang, planData)` is one long fixed text. The only part built from `planData` is the `acctBlock` line (recordkeeper URL and name), which sits near the top, so the fixed text after it is not identical across plans. The first user message carries the document blocks (self-upload only). Invite-link (`/p`) chats have no document blocks: they start with the saved summary as an assistant message.

**Do** in `app/api/chat/route.ts` only:
1. Split `buildSystemPrompt` into two functions: `fixedInstructions(lang)` (everything except `acctBlock`, same text for every request in that language) and `accountLine(planData)` (the `acctBlock` text, or empty string). Do not change any wording.
2. Send `system` as an array: first `{ type: "text", text: fixedInstructions(lang), cache_control: { type: "ephemeral" } }`, then, only if `accountLine(planData)` is not empty, `{ type: "text", text: accountLine(planData) }`.
3. On the first user message, put `cache_control: { type: "ephemeral" }` on the LAST document block (works for both `file` and `base64` sources). Skip when there are no document blocks.
4. Rolling history cache: when `messages.length >= 3`, convert the content of the second-to-last message to block form if it is a string (`[{ type: "text", text }]`) and put `cache_control: { type: "ephemeral" }` on its last block. Total markers per request must be 4 or fewer (system 1 + document 1 + history 1 = 3).
5. No other change to wording, model, `max_tokens`, streaming or error handling. No new beta header (caching is generally available); keep the existing `anthropic-beta` value.
6. Checks → `git add app/api/chat/route.ts` → commit `perf(chat): prompt caching for instructions, plan document and history` → push.

**Note:** Anthropic only caches a block of at least 1,024 tokens on Sonnet. The fixed instructions are well over that, so this should work; Step 2's log line is how we confirm it (`cacheRead` above 0 on question 2).

## STEP 2 — Log token usage per request (numbers only)

**Do** in `app/api/chat/route.ts`, inside the existing SSE loop:
1. From `message_start` read `message.usage` (`input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`); from `message_delta` read `usage.output_tokens`.
2. When the stream ends, write ONE line with `console.log(JSON.stringify({ event: "chat_usage", model, turn: messages.length, docs: <number of document blocks>, input, cacheWrite, cacheRead, output }))`. Nothing else: no text, no file ids, no plan names, no IP. (This is for cost measurement, open item #37.)
3. Checks → `git add app/api/chat/route.ts` → commit `chore(chat): log token usage per request for cost tracking` → push.

## STEP 3 — Stock answers: the content module (no UI yet)

**Read first:** `PHASE PROMPTS/PHASE-10-stock-answers-wording.md` (the whole file), `lib/plan/plandata.ts` (PlanData types), `lib/glossary.ts` (`getTerm`), `lib/plan/irs.ts` + `lib/plan/irs-limits.ts`, `lib/plan/calc.ts`.

**Do:**
1. Create `lib/answers/stockAnswers.ts`:
   - `export const STOCK_QUESTIONS: { id: StockId; label: string }[]` with the 8 questions, ids `match, vesting, elig, roth, loans, hardship, leave, limit`, labels exactly as the wording file's headings (#8 label uses `{year}` from `getLimitYear()`).
   - `export function getStockAnswer(id: StockId, planData: PlanData | null, lang: 'en' | 'es'): { text: string; link?: 'calculator' } | null`. Returns `null` when `lang !== 'en'`, when `planData` is null, or when any REQUIRED field for that answer is missing, exactly as the wording file says. `text` is markdown: one paragraph per line pair, each starting with a `**bold lead**`.
   - Definitions only through `getTerm(id, 'en').def` with the same `{year}`/`{deferral}`/`{catchUp50}`/`{catchUp6063}`/`{rothThreshold}` filling the glossary already uses (reuse its helper if one exists; do not write a second one). IRS numbers only from `IRS_LIMITS`. The $50K example in answer 1 must call the existing match function in `lib/plan/calc.ts` (read how `matchTiers` are interpreted there; do not re-implement match math).
   - The footer line (reviewed vs self-upload) is NOT part of `text`; the UI adds it in Step 4.
2. Create `scripts/check-answers.ts` (same style as `scripts/check-calc.ts`). Build at least 12 sample planData objects covering: basic safe harbor, enhanced, nonelective, QACA, discretionary with last-day rule, no match, profit sharing on/off, Roth on/off, catch-up on/off, loans/hardship on/off, and one with every field null. For every sample × every id assert: result is `null` or its text contains no `undefined`, `null`, `NaN`, `[object`, `{`, `—` or `–`; QACA returns `null` for match/vesting/leave; the all-null sample returns `null` for all 8; `lang 'es'` returns `null`. Print a pass count; exit 1 on any failure.
3. Checks (the usual three plus `npx --yes tsx scripts/check-answers.ts`) → `git add lib/answers/stockAnswers.ts scripts/check-answers.ts` → commit `feat(answers): stock answers for the 8 common questions (draft wording)` → push.

## STEP 4 — Stock answers in the chat + count button taps vs typed questions

**Do** in `components/PlansparencyApp.tsx` (both places that render `t.quickAsks`, around lines 521 and 666), plus one new route:
0. **Check first:** PHASE-09 saves `review: { reviewerName, reviewedAt, editedFields }` inside `plandata_json`. Find whether `initialPlanData` passes through `normalizePlanData` on the way into the app; that function builds a new object field by field, so it may drop `review`. If it does, add `review?: { reviewerName: string; reviewedAt: string; editedFields?: string[] }` to `PlanData` and copy it through only when `reviewerName` is a non-empty string. Include `lib/plan/plandata.ts` in this step's `git add` if changed.
1. When `lang === 'en'`, the chips are `STOCK_QUESTIONS` (labels). In Spanish, keep today's `t.quickAsks` chips and today's behavior unchanged.
2. On an English chip tap: call `getStockAnswer(id, planData, 'en')`.
   - If it returns an answer: append `{ role: 'user', content: label }` and `{ role: 'assistant', content: text, stock: true }` to the messages. **No call to `/api/chat`.** Under that assistant message show a small badge and footer: if `planData.review?.reviewerName` exists, badge "From your plan's reviewed details" and footer "Plan details reviewed by {reviewerName} on {reviewedAt as a short date}. Education only, not advice."; otherwise badge "From your plan document" and footer "Based on the plan document you uploaded. Education only, not advice." If `link === 'calculator'`, show a link button that opens the calculator the same way the app already does (find the existing tab/section switch; if there is no existing way, leave the link out and say so in the report).
   - If it returns `null`: send the label through the existing `sendMessage` exactly like today.
   - Typed follow-ups work as today; the stock messages are plain role/content strings in history, so the AI sees them. Make sure no extra fields (like `stock`) break `/api/chat` (it only reads role/content).
3. Count taps: create `app/api/track/route.ts` (Edge, POST). Accept only `{ event: 'stock_answer', id }` where `id` is one of the 8 ids; `console.log(JSON.stringify({ event: 'stock_answer', id }))`; return 204. Anything else → 400. No other data, no storage. The client fires it after a stock answer shows and ignores failures.
4. In `/api/chat`, accept an optional `source: 'button' | 'typed'` in the body and add it to the Step 2 `chat_usage` log line (default `'typed'`). The client sends `'button'` for chip taps that go to the AI (Spanish chips and `null` fallbacks) and `'typed'` for everything else.
5. Checks → `git add` the changed component, `app/api/track/route.ts`, `app/api/chat/route.ts` → commit `feat(chat): instant stock answers for English quick-question buttons` → push.

## STEP 5 — Docs
Stage modified Cowork docs (`OPEN-ITEMS.md`, `MEMORY.md`, `ERRORS.md`, `CONTEXT.md`, `CLAUDE.md`, `PHASE PROMPTS/`). Set this file's **Status:** Done with commit hashes and date. Do NOT change the wording file's DRAFT status. Commit `docs: phase 10 caching and stock answers complete` → push. Final report: commit hashes; exactly what moved out of the system prompt; how the calculator link opens (or why it was left out); any wording you could not build exactly as written and why; `check-answers` pass count.

## Ross checks (end of phase)
- `/` → upload a test SPD → ask 4 questions in a row (one session, within a few minutes). Answers should be as good as before.
- Open a saved advisor plan's `/p/<id>` link yourself (do not send it to anyone; invite links stay off) → ask 3 questions. Answers should be unchanged.
- English, `/` with a test SPD: tap each of the 8 buttons. Answers appear instantly, badge says "From your plan document". Switch to Spanish: the buttons work like before (AI).
- `/p` plan you saved yourself: badge says "reviewed" with your name and date.
- Tell Cowork. Cowork reads the `chat_usage` and `stock_answer` lines from Vercel's logs: questions 2 to 4 should show a large `cacheRead` and a small `input`. Those numbers replace the estimates in the revenue report.
