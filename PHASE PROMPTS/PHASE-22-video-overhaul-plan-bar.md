# PHASE 22: Video overhaul, plan bar above the tabs, Videos tab, focus ×, in-service answer, clean AI text, "Helps with" line
**Created:** Oct 27, 2026 in Cowork
**Run (Auto mode, walk away), AFTER PHASE-21:** `Read "PHASE PROMPTS/PHASE-22-video-overhaul-plan-bar.md" and execute all steps in order.` 9 steps, 9 commits, each pushed to `main`. No checkpoints. No new npm packages. No database change (new fields live in `plandata_json` and `team_json`).
**Open items:** #69 (video overhaul), #70 (focus ×), #71 (Videos tab + plan bar), in-service withdrawals (no number; Ross picked it Oct 27), #41 (AI text), #60 ("Helps with" line). ElevenLabs (#68) stays on the to-do: videos stay silent with captions.
**Status:** Done Oct 27, 2026. Commits: e750459 (plan bar), ffcb687 (player), 86a4ef1 (Videos tab), 9e54100 (watch-first rows), 5c0a0d2 (focus x), 8d881c3 (in-service), 90256a3 (AI text), e9727a6 (helps-with), docs commit (step 9). Ross's click-through is pending.
**Approved design (Landing Redesign canvas, row "Video overhaul"):** "Video overhaul 1: Videos tab (4th tab), table of contents + big player" (`SunVideosTab`) and "Video overhaul 2: Your plan with the plan bar above the tabs (stays on screen), videos at the top of each topic, focus with ×" (`SunTopicVideos`). Scene content stays as built in PHASE-21 (board "Video storyboards: 8 videos for PHASE-21").

## Why (Ross, Oct 27)
- "I hate how you implemented the videos. It's not intuitive at all. I don't even see some of the videos. This needs an overhaul."
- Let people × out of "Your focus". Add a Videos tab, as the 4th tab, organized like a table of contents.
- Only 4 tabs: "Meet your advisor's team" leaves the tab bar and becomes a contrasted card on the same line as the plan and the recordkeeper. That bar moves above the tabs, stays on screen, centered and symmetric.

## What Cowork found (`47404bd`, Oct 27)
- All 8 videos build for Tierra Sur (checked with `buildVideo`), so "missing" videos are a findability problem: entry points are text pills (`WatchButton.tsx` "▶ Watch: … · 40 s") placed **inside answers that only exist after a card is opened** (`PlanOverview.tsx` ~143 `CARD_VIDEO`), at the top of 2 of 4 topics (~126, ~127), and in 401(k) terms (`KeyTermsPanel.tsx` ~122). The player opens inline (`WatchButton` renders `VideoPlayer` below itself) and pushes the page down. Nothing looks like a video.
- Layout today (`PlansparencyApp.tsx` ~728 to 760): `AppHeader` (logo, plan title, security badge, language) → `TabBar` (4 tabs incl. `team`, `nav.tsx`) → `main`. Each panel has its own charcoal pinned bar inside its scroll area: `PlanOverview.tsx` ~77 (plan name, advisor, recordkeeper; uses `headerRef` for the side-panel sticky math in `useStickyPanel.ts`), `KeyTermsPanel.tsx` ~179, `TeamPanel.tsx` ~40.
- In-service: the plan reader already asks for `distributionInfo.inServiceAge` (`lib/i18n/index.ts` ~70); `normalizePlanData` passes `distributionInfo` through untyped (`plandata.ts` ~197); the panel row always shows the tap text (`overview.ts` ~411) and `getStockAnswer('inService')` always returns null (`stockAnswers.ts` ~278).
- AI text: `fixedInstructions` (`app/api/chat/route.ts` ~248) itself contains an em dash ("Never say "you should" — say…"), and so does `firstMessage` (`lib/i18n/index.ts` ~46). Nothing cleans AI output before `Md` shows it; `Md` (`ui.tsx` line 8) prints a `---` line as text.

## Rules for Claude Code
Same rules as PHASE-07. Auto mode, repo root, stage only named files, no deny-list commands, never `git reset/clean/stash`, never force-push. Checks after each step: `npx tsc --noEmit`, `npm run build`, every `scripts/check-*.ts` (`npx --yes tsx scripts/<name>.ts`). Colors/widths from `theme.ts`, fonts from `F`. CLAUDE.md "Accessibility Rules". EN + ES for every participant string (list ES in the report). No em/en dashes. New wording is DRAFT (#39). Delete code that the new design replaces; don't leave two ways of doing the same thing.

## STEP 1: Plan bar above the tabs, 4 tabs, team out of the tab bar (board "Video overhaul 2")

**Check the ground:** latest commit is `47404bd` or a later Cowork docs commit; `git status` clean except Cowork docs. If not, STOP.

1. New `components/plansparency/PlanBar.tsx`, rendered in `PlansparencyApp.tsx` right after `AppHeader` and before `TabBar`, on every tab (not inside any scroll area, so it never scrolls away). `className="on-dark"`, `C.bar`, bottom 2px `C.barLine`. Inner: max-width `LAYOUT.page`, padding 16px 20px, **grid of 3 equal columns** (`repeat(3, minmax(0, 1fr))`), `alignItems: center`, `justifyItems: center`, gap 16px 24px:
   - **Left: Recordkeeper card** (only when `recordkeeperName`): link (new tab if the URL starts with `https://`, otherwise not a link), width 100%, max-width 360, min-height 76, padding 12px 16px, radius 14, transparent background, 1px `C.textMuted` border, `C.barText`; a 40x40 radius-10 icon box (`C.tabShadeText` background) with a lock icon stroked `C.barLink`; label "Recordkeeper" / "Administrador del plan" (11/700 uppercase `.06em` `C.barMuted`), name 15/700, "Log in to your account ↗" / "Entra a tu cuenta ↗" 13/600 `C.barLink` + `.sr-only` "(opens in a new tab)".
   - **Center:** "Your plan" / "Tu plan" (12/600 uppercase `C.barMuted`), plan name (`F.display`, `clamp(22px, 2.6vw, 30px)`, 700, centered), the reviewed / "Read from the document" chip (moved from `PlanOverview`, same colors).
   - **Right: "Meet your advisor's team" card** (only when the team has people or an advisor is known): `<button>` that opens the team view, same size as the left card, `C.surface` background, `C.text`, box-shadow `0 6px 18px ${C.shadowStrong}`; up to 4 overlapping `TeamAvatar` 32px (2px white ring, -10px overlap); label "Your advisor" / "Tu asesor" (11/700 uppercase `C.accentText`), "Meet your advisor’s team" / "Conoce al equipo de tu asesor" 15/700, "{first name} and {n} others" / "{first name} y {n} más" (or just the name) 13px `C.textMuted`; "→" 20/700 `C.accentText` (`aria-hidden`).
   - When one side card is missing, keep the 3 columns so the plan name stays centered.
   - **Under 700px wide:** one compact row to save height: plan name (single line, ellipsis, `F.display` 20px) on the left, then two 44x44 icon buttons: lock ("Log in at {recordkeeper}") and people ("Meet your advisor's team"), each with an `aria-label`. Total bar height about 64px.
2. `AppHeader` on the plan app: logo + language only (drop the plan title there, it's in the bar; keep the security badge only if it still fits on one line, else drop it from this screen).
3. `TabBar` (`nav.tsx`): 4 tabs: Your plan, Calculator, 401(k) terms, **Videos** (id `videos`, video icon: `<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>`). Remove the `team` tab and its shading styles (`tabShade` tokens stay only if still used; otherwise remove them and their contrast checks). The team view still exists (`activeTab === 'team'`), reached from the bar card, the Welcome dialog link and nowhere else; while it is open, no tab is marked current.
4. Remove the panel bars: delete the charcoal pinned bar in `PlanOverview.tsx` (~77) and make the side-panel sticky math work without it (pass the topic-tabs row as `headerRef`, or adjust `useStickyPanel`; the glance panel must still travel and stay centered, test by scrolling). `KeyTermsPanel.tsx` and `TeamPanel.tsx`: their charcoal bars become plain page headings at the top of the content (h1 `F.display` 36/700 `C.text`, subtitle 15px `C.textMuted`), not sticky. `TeamPanel` adds a "← Back to your plan" / "← Volver a tu plan" link above the heading (14/600 `C.accentText`).
5. Checks -> `git add components/plansparency/PlanBar.tsx components/PlansparencyApp.tsx components/plansparency/nav.tsx components/plansparency/PlanOverview.tsx components/plansparency/KeyTermsPanel.tsx components/plansparency/TeamPanel.tsx components/plansparency/useStickyPanel.ts components/plansparency/theme.ts scripts/check-theme.ts lib/i18n/index.ts app/globals.css` (only those changed) -> commit `feat(layout): plan bar above the tabs on every tab, 4 tabs, team card in the bar` -> push.

## STEP 2: One big player for every video, real thumbnails (board "Video overhaul 1")

1. `lib/videos/scripts.ts`: add a short chapter label per scene (2 to 5 words, EN + ES, e.g. "You save part of each paycheck", "Your employer matches 3%") and a one-line "what you'll learn" per video (EN from the board: welcome "Who runs your plan, where your account lives, and how to use this site."; match "How your employer adds money and how to get all of it."; vesting "When the money your employer adds is yours to keep."; taxes "The one difference: when you pay taxes."; limits "The yearly limit, and the extra you can add at 50+."; access "Loans and hardship withdrawals, and what they cost you later."; leave "Your 4 choices for your money when you leave a job."; tdf "One fund built around the year you plan to retire."). Add `VIDEO_ORDER = ['welcome', 'limits', 'taxes', 'match', 'vesting', 'access', 'leave', 'tdf']` and `VIDEO_SECTIONS` (1 Start here: welcome; 2 Your money: limits, taxes; 3 Employer money: match, vesting; 4 Using your money while you work: access; 5 When you leave: leave; 6 Investments: tdf).
2. `components/plansparency/video/VideoThumb.tsx`: the poster = the video's first content scene (scene index 1, or 0 if only one) drawn by the scene kit **with animations off** (finished state), in a 16:9 box radius 12, `C.highlight` background; a 60px play circle centered (`C.captionBg`, white triangle); a time badge bottom-right ("0:41", 13/700 white on `C.captionBg`, radius 6). Sizes: `lg` (Videos tab rows 176px wide, Start here), `sm` (topic rows 168px). Always inside a `<button>` with `aria-label` "Play video: {title}, {seconds} seconds" / ES.
3. `components/plansparency/video/VideoTheater.tsx`, **one instance for the whole app** (mounted in `PlansparencyApp.tsx`), opened through the existing `VideoContext` (`openVideo(id, { from })`, `closeVideo()`); delete the inline open-key logic and the inline player rendering in `WatchButton.tsx` (`WatchButton`/`WatchVideo` go away; STEP 4 replaces every use).
   - Dialog over the page (reuse `Modal` focus trap, Esc, backdrop click closes; focus returns to the thumbnail or link that opened it). Box max-width 1180, radius 20, `C.surface`, grid `minmax(0, 1fr) 280px` (under 900px: one column, side panel under the stage).
   - Left: the stage (existing `VideoPlayer` stage + captions, captions on), then a control row (padding 12px 16px, top border 1px `C.borderLight`): Play/Pause (primary, min-height 44), a progress bar you can click or drag to seek (6px, `C.accent` on `C.accentSoft`, `role="slider"` with arrow keys, `aria-valuetext` "0:14 of 0:41"), time "0:14 / 0:41" 13/700 `C.textMuted`, "CC" checkbox.
   - Right side panel (padding 20, left border 1px `C.borderLight`, new token `panelSoft: "#F9FAFB"`): × (44x44, `aria-label` "Close video"), title (`F.display` 26/700), "Chapters" (12/700 uppercase `C.textMuted`) list: one button per scene "1. {chapter label}" (min-height 36, radius 8, 14px; current: `C.accentSoft`/`C.accentText` 700), clicking jumps there. Bottom block (top border, gap 8): "After this video" label, the video's next-step button (primary), "Up next: {next title} →" (secondary, next in `VIDEO_ORDER` that exists for this plan), "Show transcript" text button (transcript shows in the panel, scrollable).
   - It starts playing when it opens (the person just clicked Play). Pause on Space when the stage has focus. Reduced motion: scenes show finished state, timing unchanged.
   - **Play all in order** mode (from the Videos tab): when a video ends, a 5-second "Up next: {title}" bar with "Play now" and "Cancel" appears over the stage, then the next video starts; Cancel stops the chain.
   - Watched: a `Set` of video ids in React state (this visit only, never stored) marked when a video reaches its last scene.
4. Checks -> `git add lib/videos/scripts.ts components/plansparency/video components/PlansparencyApp.tsx components/plansparency/theme.ts` -> commit `feat(video): one big player with chapters, up next and play all; real thumbnails` -> push.

## STEP 3: Videos tab as a table of contents (board "Video overhaul 1")

New `components/plansparency/VideosPanel.tsx` for `activeTab === 'videos'`, max-width `LAYOUT.page`, padding 28px 20px 48px, gap 32:
1. Heading: "Videos" (`F.display` 36/700) + "Short, under a minute each. Tap one to watch. Captions are always on." / ES (15px `C.textMuted`).
2. Summary bar (padding 18px 20px, radius 16, `C.highlight`, 1px `C.accentBorder`, wrap): "{n} short videos · about {m} minutes in all" (18/700) and "Watch in order, or jump to what you need. **{w} of {n} watched** this visit." (14px); right: "▶ Play all in order" (primary, min-height 52, 16/700). Counts only include videos that exist for this plan.
3. Two columns (`300px minmax(0, 1fr)`, gap 36; one column under 900px with the contents list on top, not sticky):
   - **Contents** (`<nav aria-label="Video contents">`, sticky below the plan bar and tabs, padding 16, 1px `C.border`, radius 16): label "Contents" (12/700 uppercase), one link per section "{k}. {section}" (15/700) + "{count} video(s) · {m:ss}" (13px `C.textMuted`); the section in view gets `C.highlight` + 4px left `C.accent` bar (others a transparent 4px bar). Clicking scrolls to the section.
   - **Sections:** `<section aria-labelledby>`; heading "{k}. {section}" (`F.display` 30/700, number in `C.accentText`) + total "m:ss" (14/600 `C.textMuted`). Rows in an `<ol>`: grid `56px 176px minmax(0, 1fr) auto`, gap 18, padding 14px 0, top border 1px `C.borderLight`: number "{k}.{n}" (`F.display` 26/700 `C.accentText`), `VideoThumb lg`, title 18/700 + learn line 14px `C.textMuted` + time 13/700 + "Watched" chip (12/700 `C.greenSoft`/`C.green`, only once watched), "▶ Watch" button (min-height 44, 1px `C.accent`, `C.surface`, 14/700 `C.accentText`). Under 700px: number + thumb on one line, text and button below.
   - Sections whose videos are all hidden for this plan are left out; numbering stays continuous.
4. Footnote 13px `C.textDim`: "The same videos also show up on Your plan, right where each topic is. Education only, not advice." / ES.
5. Checks -> `git add components/plansparency/VideosPanel.tsx components/PlansparencyApp.tsx lib/i18n/index.ts` -> commit `feat(video): Videos tab as a table of contents` -> push.

## STEP 4: Videos where the questions are (board "Video overhaul 2")

1. New `components/plansparency/video/WatchFirstRow.tsx`: `<section aria-labelledby>` padding 16, radius 16, `C.panelSoft`, 1px `C.borderLight`; heading "Watch first: {n} short video(s) on {topic}" / ES (15/700); grid `repeat(auto-fit, minmax(380px, 1fr))` gap 12 of mini cards: a `<button>` (padding 10, radius 14, 1px `C.border`, `C.surface`) with `VideoThumb sm` + "Video · 0:41" (12/700 uppercase `C.accentText`) + title 16/700 + learn line 13px `C.textMuted`. Opens the theater.
2. Placement (each only if the video exists for this plan):
   | Place | Videos |
   |---|---|
   | Your plan, topic Your money (top, under the topic tabs, above the cards) | limits, taxes |
   | Topic Employer money | match, vesting |
   | Topic Access my money | access |
   | Topic When you leave | leave (above Visual 6) |
   | Investments sub-tab (top) | tdf |
   | Calculator (top) | limits |
   | Welcome step 1 (under the details box) | welcome (opening it closes the Welcome; its end button "Pick what to learn first" reopens the Welcome at step 2) |
3. Inside answers: a small text link at the top of the open answer, "▶ Prefer to watch? {s}-second video" / "▶ ¿Prefieres verlo? Video de {s} segundos" (min-height 40, 15/700 `C.accentText`, underlined, with a 26px `C.bar` circle holding a white ▶, `aria-hidden`): safe harbor and match → match; vesting → vesting; Roth → taxes; savings limit → limits. 401(k) terms entries Traditional, Roth → taxes; Target date fund → tdf: same link.
4. Focus strip: "▶ Watch first · {s} s" now opens the theater (same mapping as PHASE-21).
5. Delete every old `WatchVideo` / pill use (`PlanOverview.tsx`, `KeyTermsPanel.tsx`, `PlansparencyApp.tsx`, `WatchFirst.tsx` if replaced). Grep must find no `WatchButton`/`WatchVideo` left.
6. Checks -> `git add` (list) -> commit `feat(video): watch-first rows at the top of each topic, prefer-to-watch links, old pills removed` -> push.

## STEP 5: × on "Your focus" (#70)

`FocusStrip.tsx`: a 40x40 × button inside the strip at the right (absolute, vertically centered, `aria-label` "Hide your focus" / "Ocultar tu enfoque"; strip gets right padding 56). Clicking hides the strip **for this visit** (React state, not stored) and shows a one-line `role="status"` message in its place: "Focus hidden for this visit." + text button "Show it again" / "Mostrar de nuevo". The footer "Welcome and focus" still reopens the picker; picking again shows the strip again.
Checks -> `git add components/plansparency/FocusStrip.tsx components/PlansparencyApp.tsx lib/i18n/index.ts` -> commit `feat(guide): x to hide the focus strip for this visit` -> push.

## STEP 6: In-service withdrawals answer

1. `lib/plan/plandata.ts`: type `distributionInfo` as `{ inServiceAge?: number | null; inServiceAvailable?: boolean | null; rmdAge?: number | null; rolloversIn?: boolean | null; separationOptions?: string[] }`; normalize: `inServiceAge` a number between 50 and 75 (59.5 allowed) or null; `inServiceAvailable` true if an age is found, false only when the plan document says no in-service withdrawals, else null. Update the PLANDATA instruction line in `lib/i18n/index.ts` (EN and ES) to ask for `inServiceAvailable` too.
2. `lib/plan/reviewRows.ts`: new row `{ key: 'inService', label: 'In-service withdrawals (taking money out while still working)', fields: [ { path: ['distributionInfo', 'inServiceAvailable'], kind: 'tri', label: 'Offered' }, { path: ['distributionInfo', 'inServiceAge'], kind: 'text', label: 'Starting at age' } ] }` (store the age as a number; accept "59½" and "59.5"). It shows on the new-plan review, Edit plan details and Additional doc compare automatically.
3. `overview.ts` ~411: value "Yes, at age {age}" / "Sí, a los {age} años" (59.5 shown as 59½), "No" when false, tap text when unknown. `stockAnswers.ts` `inService`: when available with an age: "**Yes. Once you’re {age}, you can take money out while you still work here.** Pre-tax money you take out is taxed as income." + if age < 59.5: " Before 59½, a 10% extra tax usually applies too." + "\n\nIf you move it straight to an IRA instead, it isn’t taxed now." (ES too, DRAFT). When false: "**No, your plan doesn’t allow taking money out while you still work here,** except for loans or hardship withdrawals if your plan offers them." When unknown: null (AI, as today).
4. `scripts/check-answers.ts`: cases for 59.5, 55, false, unknown.
5. Checks -> `git add lib/plan/plandata.ts lib/plan/reviewRows.ts lib/plan/overview.ts lib/answers/stockAnswers.ts lib/i18n/index.ts scripts/check-answers.ts scripts/check-review.ts` -> commit `feat(plan): in-service withdrawal answer from the plan, checked by the advisor` -> push.

## STEP 7: Clean AI-written text (#41)

1. New `lib/text/clean.ts` `cleanAiText(text: string): string`: number–number with an en or em dash becomes "number to number" (e.g. "3%–5%" -> "3% to 5%"); any other em/en dash becomes ", " (no double spaces, no ", ," ); remove emoji (`\p{Extended_Pictographic}` and variation selectors); drop lines that are only `---`, `***` or `___`; collapse 3+ blank lines to 1; trim. Never touch text inside `<!--PLANDATA ... -->`.
2. Use it on every AI-written text before it shows: AI answers in `AnswerBody`, any summary shown to participants, and the advisor-side AI text if shown. Do it at display time (the stream can arrive in pieces; clean the joined text).
3. `app/api/chat/route.ts` `fixedInstructions`: replace the em dash in rule 2 with a comma, and add a rule: "Writing: plain words, short sentences. No em dashes or en dashes, no emojis, no horizontal rules (---), bold only for one key phrase." (EN and ES blocks). `lib/i18n/index.ts` `firstMessage` (EN and ES): replace the em dash with a comma. `Md` in `ui.tsx`: ignore lines that are only `---`.
4. `scripts/check-clean.ts`: the examples above, plus a real-looking answer with all four problems, plus PLANDATA left untouched.
5. Checks -> `git add lib/text/clean.ts components/plansparency/AnswerBody.tsx components/plansparency/ui.tsx app/api/chat/route.ts lib/i18n/index.ts scripts/check-clean.ts` (+ any other file where AI text shows) -> commit `fix(ai): clean dashes, emojis and stray rules from AI text; instructions follow the writing rules` -> push.

## STEP 8: "Helps with" line per team member (#60)

1. `lib/team.ts`: `TeamMember.helps: string` (trimmed, max 120, default `''`); `normalizeTeam` + `scripts/check-team.ts` cases (old records load with `''`, 121 chars cut).
2. Team editor (`app/advisor/plans/[plan_id]/team/page.tsx`): after the Title field, a textarea (2 rows, max 120, counter "{n}/120") labeled "What {first name} helps with (optional)" (or "What this person helps with (optional)" before a name is typed), placeholder "e.g. Questions about loans, enrollment meetings in Spanish". List rows show it under the title (13px `C.textMuted`, one line, ellipsis).
3. `TeamPanel.tsx` card: under the chips, when set: "**Helps with:** {text}" / "**Ayuda con:** {text}" (14px line-height 1.45 `C.textMuted`, bold part `C.text`). Not translated (advisor's own words).
4. Checks -> `git add lib/team.ts scripts/check-team.ts "app/advisor/plans/[plan_id]/team/page.tsx" components/plansparency/TeamPanel.tsx lib/i18n/index.ts` -> commit `feat(team): optional helps-with line per person` -> push.

## STEP 9: Docs
1. This file: Status -> Done with the nine commit hashes and the date.
2. `OPEN-ITEMS.md`: #69, #70, #71, #41, #60 and the in-service item -> built (commits). START HERE: Ross's test on `/p/<Tierra Sur id>`: the plan bar stays put on every tab and is centered; 4 tabs; team card opens the team page and Back works; Videos tab (contents, jump, Play all, watched count); open a video from a topic row, from an answer link, from the Welcome, from the Calculator; chapters, seek, Up next, Esc; × on Your focus; in-service row and answer; a team member with a "Helps with" line; phone width once.
3. `MEMORY.md`: "Oct 27, 2026: plan bar sits above the tabs on every tab (recordkeeper, plan, advisor team card). 4 tabs: Your plan, Calculator, 401(k) terms, Videos. One app-wide video theater; thumbnails everywhere; Videos tab is a table of contents. AI text is cleaned at display."
4. `git add "PHASE PROMPTS/PHASE-22-video-overhaul-plan-bar.md" OPEN-ITEMS.md MEMORY.md` (+ any other Cowork doc that changed) -> commit `docs: phase 22` -> push.

## Report back
- Nine commit hashes, files per step.
- How the side-panel sticky math was fixed after the plan bar moved (STEP 1).
- Every place a video opens from (STEP 4), and confirmation that no `WatchButton`/`WatchVideo` remains.
- ES strings added.
- Output of `check-videos`, `check-answers`, `check-clean`, `check-team`, `check-a11y`, `check-theme`.

## Checklist (Cowork reviews the diff and the rendered pages before Ross tests)
- [ ] Plan bar above the tabs on all 4 tabs and the team view, never scrolls away, 3 equal columns, plan name centered, side cards equal size; compact one-row bar under 700px.
- [ ] 4 tabs in this order: Your plan, Calculator, 401(k) terms, Videos. No team tab.
- [ ] No charcoal bars left inside panels; side panel on Your plan still travels and centers.
- [ ] Every video entry point shows a thumbnail with a play button and length, or is the "Prefer to watch?" link; all open the same big player.
- [ ] Player: chapters, seek with keyboard, captions on, transcript, After this video + Up next, Esc and backdrop close, focus returns.
- [ ] Videos tab: summary bar, Play all in order with a cancelable 5-second Up next, contents list, numbered sections and rows, watched count for this visit only.
- [ ] Focus strip ×: hides for this visit, "Show it again".
- [ ] In-service: row and answer from the plan, advisor can check it on all three advisor screens.
- [ ] No em/en dashes, emojis or `---` in any AI text on screen.
- [ ] "Helps with" line saves and shows.
- [ ] Spanish everywhere; nothing under 12px; all checks pass.
