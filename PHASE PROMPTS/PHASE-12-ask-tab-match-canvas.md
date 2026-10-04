# PHASE 12 — Ask tab: match the approved "Stock answers, button taps" canvas
**Created:** Oct 4, 2026 in Cowork
**Run (Auto mode, walk away):** `Read "PHASE PROMPTS/PHASE-12-ask-tab-match-canvas.md" and execute all steps in order.` 3 steps, 3 commits, each pushed. No checkpoints.
**Open items:** #39, #42.
**Status:** Done, Oct 4, 2026 (STEP 1 `d23c62e`, STEP 2 `fc1fc39`)

## Why
The live Ask tab works but looks nothing like the approved canvas (Landing Redesign canvas, board "Stock answers, button taps", file `project/Answers.dc.html`). Cause: PHASE-10 Step 4 (written by Cowork) never gave the canvas design; it said "use the labels" and "small badge under the message", so Claude Code reused the old 12px chip style. Every value below was copied by Cowork from the canvas source. Build exactly these values. Do not restyle anything else.

## Rules for Claude Code
Same rules as PHASE-07 (read its "Rules for Claude Code" once). Auto mode, repo root, stage only named files, no deny-list commands, never `git reset/clean/stash`, never force-push. Checks after each step: `npx tsc --noEmit`, `npm run build`, `npx --yes tsx scripts/check-calc.ts`, `npx --yes tsx scripts/check-answers.ts`.
Scope: ONLY the plan-document Ask tab (`chatPanel` inside `if (stage === STAGE.APP)` in `components/PlansparencyApp.tsx`). The statement chat at the bottom of the file, the Plan Guide, Calculator and Key Terms are NOT touched. Colors come from `C` in `components/plansparency/theme.ts` (all exist except one, added in Step 1). No new hardcoded hex values in components.

## STEP 1 — Stock answer card as its own component

**Check the ground:** `git status` clean except Cowork docs (`*.md`, `PHASE PROMPTS/`). Latest commit is `bd6d6b2`. `stockExtras` exists in `PlansparencyApp.tsx`, and `lib/answers/stockAnswers.ts` joins paragraphs with `'\n\n'`, each starting `**lead**`. Otherwise STOP and report.

**Do:**
1. `components/plansparency/theme.ts`: add `accentBorder: "#E5C77A"` to `C` (chip outline from the canvas). Nothing else.
2. Create `components/plansparency/StockAnswerCard.tsx` exporting `StockAnswerCard({ text, link, stockId, review, onOpenCalculator })`:
   - Outer `<article>`: `display:flex; flexDirection:column; gap:12; padding:20; border:1px solid C.border; borderRadius:"4px 16px 16px 16px"; background:C.surface; maxWidth:"100%"`.
   - Badge FIRST (top, `alignSelf:flex-start`): `fontSize:12; fontWeight:600; padding:"4px 10px"; borderRadius:100`. Reviewed (`review?.reviewerName` non-empty): text "From your plan's reviewed details", `background:C.greenSoft; color:C.green`. Otherwise: "From your plan document", `background:C.accentSoft; color:C.accentText`.
   - Paragraphs: split `text` on `\n\n`; for each, match `/^\*\*(.+?)\*\*\s*([\s\S]*)$/`. Render `<p style={{margin:0, fontSize:16, lineHeight:1.6, color:C.text}}><strong>{lead}</strong> {rest}</p>`. `strong` keeps `C.text` (NOT gold). If a paragraph doesn't match, render it as plain text in the same `<p>`. Do not use `Md` here.
   - Link (only when `link === 'calculator'`): a `<button>` styled as a text link: `alignSelf:flex-start; background:none; border:none; padding:0; minHeight:44; fontSize:15; fontWeight:700; color:C.accentText; textDecoration:underline; cursor:pointer; fontFamily:inherit`. Text: `stockId === 'match'` → "See it with your pay in the calculator →", else "Open the calculator →". `onClick={onOpenCalculator}`.
   - Footer: `fontSize:12; lineHeight:1.5; color:C.textDim; paddingTop:8; borderTop:1px solid C.borderLight`. Text exactly as today's `stockExtras` (reviewed: "Plan details reviewed by {name} on {Mon D, YYYY}. Education only, not advice." / otherwise "Based on the plan document you uploaded. Education only, not advice.").
3. In `PlansparencyApp.tsx`: delete `stockExtras`. In `chatPanel`, an assistant message with `msg.stock` renders `<StockAnswerCard ... onOpenCalculator={() => setActiveTab("calculator")} review={planData?.review} />` INSTEAD of the bubble (no bubble wrapper around it). Non-stock messages unchanged in this step. In the statement chat, remove the `stockExtras(msg)` call (stock messages never occur there; confirm `stockChipsOn` excludes statements before removing).
4. Checks → `git add components/plansparency/theme.ts components/plansparency/StockAnswerCard.tsx components/PlansparencyApp.tsx` → commit `feat(chat): stock answer card matching the approved design` → push.

## STEP 2 — Ask tab layout: header, chips on top, dark question bubble, new input

All in `chatPanel` (plus 3 i18n keys).
1. **Width:** wrap the scroll content AND the input bar content each in an inner div `width:100%; maxWidth:760; margin:"0 auto"`. (Today text runs the full 2000px of a wide screen.)
2. **Header** (first thing in the scroll area, not sticky): label `t.askHeader` (`fontSize:12; fontWeight:600; letterSpacing:".06em"; textTransform:"uppercase"; color:C.textMuted`), then `<h1>` plan name (`planData?.planName || fileName || "Your Plan"`) with `margin:0; fontFamily:F.display; fontSize:"clamp(26px, 6vw, 36px)"; fontWeight:700; lineHeight:1.05`. Gap 4 between them.
3. **Chips directly under the header, above all messages, always visible** (remove the old chip block at the bottom of `chatPanel`; `showChips` is no longer used in `chatPanel`, keep it for the statement chat). Container: `display:flex; flexWrap:wrap; gap:8` (left aligned, not centered). Each chip `<button aria-pressed>`: `minHeight:44; padding:"8px 14px"; borderRadius:100; fontFamily:inherit; fontSize:14; fontWeight:600; cursor:pointer; textAlign:left` (NO `whiteSpace:nowrap`, so long labels wrap on a phone). Off: `background:C.accentSoft; color:C.accentText; border:1px solid C.accentBorder`. On: `background:C.text; color:C.surface; border:1px solid C.text`. While `loading`: `disabled`, `opacity:.6`, `cursor:default`. Remove the old hover handlers.
4. **Pressed state:** new state `pickedChip` (label string or null). Set it in `onChip` (both the stock path and the AI fallback). Set it back to null when a typed question is sent and in every place messages are reset (search `setMessages([])`). Same chips and pressed state in Spanish (labels from `t.quickAsks`, behavior unchanged: they go to the AI).
5. **User question bubble** (all user messages in `chatPanel`, typed or tapped): `background:C.text; color:C.surface; fontSize:15; fontWeight:600; padding:"12px 16px"; borderRadius:"16px 16px 4px 16px"; maxWidth:"80%"; border:none`.
6. **AI (non-stock) messages:** keep `Md` and today's bubble, but use `background:C.surface; border:1px solid C.border; borderRadius:"4px 16px 16px 16px"; padding:20; fontSize:15`. Loading/streaming bubble: same radius and background.
7. **Scroll after a tap:** the existing effect scrolls to the bottom on every message. When the newest message is a stock answer, instead scroll the matching user question bubble into view with `block:"start"` (use a ref on the last user bubble), so a long answer is read from its top.
8. **Input bar:** container `display:flex; gap:8; alignItems:center; padding:"4px 4px 4px 14px"; border:1px solid C.inputBorder; borderRadius:14; background:#FFFFFF` (use `C.aiBubble`). Textarea: `fontSize:15`, `minHeight:44` line box, placeholder `t.askFollowUp`. Replace the paper-plane icon button with a text button `t.askButton`: `minHeight:40; padding:"0 16px"; border:none; borderRadius:10; background:linear-gradient(135deg, C.accent, C.primaryEnd); color:C.onPrimary; fontSize:14; fontWeight:700`; when disabled `background:C.border; color:C.textDim`. Keep the disclaimer + "End Session" row below it unchanged.
9. `lib/i18n/index.ts`, add to `en`: `askHeader: "Ask about your plan"`, `askFollowUp: "Ask a follow-up in your own words"`, `askButton: "Ask"`. Add to `es`: `askHeader: "Pregunta sobre tu plan"`, `askFollowUp: "Haz otra pregunta con tus propias palabras"`, `askButton: "Preguntar"`. Do NOT change `inputPlaceholder` (the statement chat uses it).
10. Checks → `git add components/PlansparencyApp.tsx lib/i18n/index.ts` → commit `style(chat): Ask tab layout matching the approved design` → push.

## STEP 3 — Self-check against the canvas, then docs
1. Re-read your diff for Steps 1-2 and confirm each line of this checklist with the file and line where it is true. Put the filled checklist in your report. Any "no" = fix it before this commit.
   - [ ] Chips render above the messages, outside any `loading`/last-message condition
   - [ ] Chip 14px/600, minHeight 44, pill, accentSoft/accentText/accentBorder off, text/surface on, wraps on phone
   - [ ] Pressed chip = last tapped; cleared on typed question and on reset
   - [ ] Header label + serif plan name above chips
   - [ ] User bubble dark (`C.text`) with light text, 15px/600
   - [ ] Stock card: badge on TOP, 16px paragraphs with dark bold leads, underlined text link with →, divider + 12px footer
   - [ ] Content max width 760, centered
   - [ ] Input: white, `C.inputBorder`, "Ask" text button, new placeholder
   - [ ] Statement chat, Plan Guide, Calculator, Key Terms unchanged (`git diff --stat` shows only the named files)
2. In `OPEN-ITEMS.md` mark #42 done with the two commit hashes; set **Status:** Done in this file.
3. `git add OPEN-ITEMS.md ERRORS.md MEMORY.md CONTEXT.md CLAUDE.md "PHASE PROMPTS/"` (only modified ones) → commit `docs: phase 12 Ask tab matches design` → push.

## Report back
Three commit hashes, the filled checklist, files changed, anything unexpected.

## Done when (Cowork reviews the diff against the canvas FIRST, then Ross checks after Vercel is Ready)
Hard-refresh, upload a test SPD in English, open Ask: header + 8 chips at the top; tap "How does my employer match work?" → chip turns dark, dark question bubble, card with badge on top and calculator link. Phone width: chips wrap, nothing runs off screen. Spanish: same look, chips go to the AI.
