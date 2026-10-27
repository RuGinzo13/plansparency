# PHASE 21: Guided start (pick your focus) + 6 pictures + 8 animated videos inside the answers + catch-up fix
**Created:** Oct 27, 2026 in Cowork
**Run (Auto mode, walk away), AFTER PHASE-20:** `Read "PHASE PROMPTS/PHASE-21-guided-focus-and-visuals.md" and execute all steps in order.` 9 steps, 9 commits, each pushed to `main`. No checkpoints. No new npm packages. No database change.
**Open items:** #64 (catch-up amount), #65 (guided start), #66 (visuals), #67 (videos). ElevenLabs voice (#68) is NOT in this phase: videos are silent with captions, and `lib/videos/narration.ts` is the hook where the voice plugs in later.
**Status:** Done Oct 27, 2026. Commits: STEP 1 `affa7ac`, STEP 2 `f159cb5`, STEP 3 `1f37249`, STEP 4 `61e52f9`, STEP 5 `f391d89`, STEP 6 `2c16682`, STEP 7 `6d83b69`, STEP 8 `f7ad458`, STEP 9 docs commit (see git log).
**Approved design (Landing Redesign canvas, row "Guided journey, visuals 1 to 6, video prototype"):** "Welcome step 2: pick your focus, then a guided start" (`SunFocus`), "Visual 1: How much your employer adds" (`SunVisual1`), "Visual 2: When employer money is yours to keep" (`SunVisual2`), "Visual 3: Your first steps, on a timeline" (`SunVisual3`), "Visual 4: When you pay the taxes" (`SunVisual4`), "Visual 5: How much you can put in, by age" (`SunVisual5`), "Visual 6: Your 4 choices when you leave" (`SunVisual6`). Ross, Oct 27: "build the next phase with all changes except the video", then the same day: "make the changes for all the aforementioned videos and build them as part of this next phase, integrated and placed on the appropriate parts of the site for fluidity and simple navigation; keep ElevenLabs on the to-do." Video boards: "Video prototype v2: free money from your employer (animated, 58 s)" (`SunVideoMatch2`, the style template) and "Video storyboards: 8 videos for PHASE-21" (`SunVideoStoryboards`).

## Why (Ross, Oct 27)
- Hold the participant's hand. After "Explore my plan", let them pick what to focus on so they aren't overwhelmed. Every screen should be a simple path to understanding their plan.
- Most people learn visually. Add pictures, not more text.
- Focus picks are **never remembered** (not on the device, not per person).

## Decided (do not re-open)
- The focus picker is **step 2 of the Welcome dialog**, not a second pop-up. If the Welcome has nothing to show (no employer and no recordkeeper), the dialog opens straight at step 2. If the person checked "Don't show this again" on step 1, the dialog (both steps) is skipped next time; the "Change focus" button opens step 2 anytime.
- Choices are goals in plain words, max 3, "Skip, show me everything" always available. Nothing is removed from the site; picks only decide where they start, what opens first, and what the side panel shows first.
- Each picture sits **inside the answer it explains**, uses **this plan's numbers**, and has an **"In words"** paragraph that says the same thing. The picture itself is `aria-hidden`; the words are what screen readers read. If the plan data needed for a picture is missing, the picture is not shown (never a picture with made-up numbers).
- Example pay is always $50,000 and is labeled "Example".

## What Cowork checked (`ab336a6`, Oct 27)
- `lib/plan/overview.ts` line 383: `catchUpValue` uses `limits.catchUp6063` ($11,250) under the label "Catch-up (age 50+)". In 2026 the 50+ amount is `catchUp50` ($8,000); $11,250 is ages 60 to 63 only (`lib/plan/irs-limits.ts` line 28). Wrong today for every plan.
- Topics: `TopicKey = 'you' | 'employer' | 'access' | 'leave'` (`overview.ts`), state `topic` in `PlansparencyApp.tsx` ~127, `selectTopic` ~423, cards `StockId` (`lib/answers/stockAnswers.ts` line 16): `elig`, `limit`, `roth`, `safeHarbor`, `match`, `profit`, `vesting`, `loans`, `hardship`, `inService`, `leave`.
- `PlanOverview.tsx` ~152 to 172 renders cards; `AnswerBody` takes `children` after the answer (today only `vestingBlock`, ~line 64, a years slider with one bar per money source). The leave choices render at ~176 from `o.leaveOptions` (4 options, text only, one tag each).
- `WelcomeDialog.tsx` (props `employerName, planName, recordkeeperName, recordkeeperUrl, team, lang, t, onClose, onOpenTeam`); `PlansparencyApp.tsx` ~99 to 113 opens it once per page load unless hidden; footer "Welcome info" button ~720.
- Calculator math: `lib/plan/calc.ts` `calculatorResult`, `safeHarborAmount`; vesting: `lib/plan/planFacts.ts` `vestingParts`, `parseVesting`; limits: `getIRSLimitsForAge` / `irs-limits.ts`.

## Rules for Claude Code
Same rules as PHASE-07. Auto mode, repo root, stage only named files, no deny-list commands, never `git reset/clean/stash`, never force-push. Checks after each step: `npx tsc --noEmit`, `npm run build`, every `scripts/check-*.ts` (run with `npx --yes tsx scripts/<name>.ts`). Colors and widths only from `theme.ts`, fonts from `F`. CLAUDE.md "Accessibility Rules". EN + ES for every new participant string (list ES in the report). No em/en dashes. All new wording is DRAFT (Ross approves with #39). Never invent a number: every figure comes from plan data, IRS limits, or the labeled $50,000 example.

## STEP 1: Fix the catch-up amount (#64)

**Check the ground:** latest commit is `ab336a6` or a later Cowork docs commit; `git status` clean except Cowork docs. If not, STOP.

1. `lib/plan/overview.ts` ~383: when catch-up is allowed show `Yes, up to {catchUp50} ({catchUp6063} at ages 60 to 63)` / `Sí, hasta {catchUp50} ({catchUp6063} entre los 60 y 63 años)` (amounts via `fmtRounded`, from the same `limits` object). Search the rest of `lib/` and `components/` for any other place that shows `catchUp6063` as the age 50+ amount and fix it the same way (list them).
2. `scripts/check-overview.ts`: add a case that the 50+ row contains $8,000 and the 60 to 63 amount for 2026.
3. Checks -> `git add lib/plan/overview.ts scripts/check-overview.ts` (+ any other fixed file) -> commit `fix(plan): catch-up row shows the age 50+ amount, not the 60 to 63 amount` -> push.

## STEP 2: Picture building blocks (no visible change yet)

1. New `lib/plan/visuals.ts` (pure functions, no React), each returning `null` when the data isn't there:
   - `employerMoneyAt(planData, pct, pay = 50000)` -> `{ you, employer, fullEmployer, pctForFull }`: the yearly employer money at `pct`% of pay, the most the employer adds, and the lowest % that gets it all. Use the same math as the calculator (`calculatorResult` / `safeHarborAmount` / match tiers); do not write a second formula. Counts safe harbor + extra match; leaves out profit sharing (not tied to what you save). `null` if neither has a usable formula.
   - `vestingSteps(planData)` -> `{ immediate: boolean, sources: [{ label, byYear: number[] }] }` from `vestingParts`/`parseVesting`. `null` if nothing parses.
   - `joinSteps(planData, lang)` -> up to 4 steps `{ title, detail }`: "You’re hired" (Day 1), "You can join" (`contribEligibility.requirement`), "Your entry date" (`contribEligibility.entryDates`, step left out if missing), "Employer money starts" (`matchEligibility.requirement`, or "Same time as you join" if `immediateMatch`; left out if unknown). Text comes from the plan as written. `null` if there's no requirement.
   - `limitBars(planData, year)` -> rows `{ label, base, extra, extraKind: 'catchUp50' | 'catchUp6063' | null, total }` for Under 50, 50 to 59 and 64+, 60 to 63, from `irs-limits.ts`. If `planAllowsCatchUp === false`, only the first row plus `catchUpNotOffered: true`.
   - `rothRows(planData)` -> which columns to show: pre-tax if `hasPreTax !== false`, Roth if `hasRoth === true`.
2. New `components/plansparency/visuals/VisualFrame.tsx`: wraps a picture inside an answer card: top border 1px `C.borderLight`, padding-top 16, flex column gap 14; small uppercase label 12/700 `.06em` `C.textMuted` (e.g. "Picture: how much your employer adds" / "Imagen: …"); the picture in a `<div aria-hidden="true">`; then `<p>` 14px line-height 1.55 `C.textMuted` starting with **"In words:"** / **"En palabras:"** (`C.text`, 700). Optional example note 12px `C.textDim`: "Example uses $50,000 pay. Education only, not advice." / ES.
3. New `scripts/check-visuals.ts`: on every sample in `scripts/samples.ts`: functions never throw; `employerMoneyAt` at `pctForFull` equals `fullEmployer` and is never above it; employer money never decreases as pct rises; vesting values between 0 and 100 and never go down; limit totals equal base + extra and match `irs-limits.ts`; no `NaN`/`undefined` in any text.
4. Checks -> `git add lib/plan/visuals.ts components/plansparency/visuals/VisualFrame.tsx scripts/check-visuals.ts` -> commit `feat(visuals): plan-data builders and a shared picture frame with words` -> push.

## STEP 3: Visual 1 (employer money) and Visual 2 (vesting)

1. `components/plansparency/visuals/EmployerMoneyVisual.tsx`, board "Visual 1: How much your employer adds". Shown in the `safeHarbor` and `match` cards (whichever opens; same component). Slider "If you save {n}% of pay" (`<input type="range">` 0 to 10, step 1, starts at `pctForFull` minus 2 if that's 0 or more, else 0; `aria-valuetext` "{n} percent" / "{n} por ciento"; the % shown 28/700 `C.accentText`). Two rows (label 120px 14/600, bar 28px tall radius 8 on `C.surfaceAlt`, amount 76px right-aligned 700): "You save" bar `C.bar`; "Employer adds" bar `C.green` with a striped part for what's still left (stripes from `C.warningDim` and a new token `stripe: "#FDE68A"`, add to `theme.ts` and the contrast check as a non-text color). Bars scale to 10% of pay. Message box (padding 12px 14px, radius 12, 15/600): when getting it all, `C.greenSoft`/`C.green` "You’re getting all {fullEmployer} your employer offers." / ES; otherwise `C.warningDim`/`C.warning` "You’re getting {employer}. Saving {pctForFull}% would add {fullEmployer minus employer} more a year (the striped part)." / ES. In words: built from `tierText`/safe harbor text, ending "Saving {pctForFull}% gets all of it: {fullEmployer} a year on $50,000 pay." Example note on.
2. `components/plansparency/visuals/VestingVisual.tsx`, board "Visual 2: When employer money is yours to keep". **Replaces** `vestingBlock` in `PlanOverview.tsx` (move any logic still needed; delete the old block so there is one vesting picture). Slider "If you work here {n} years" (0 to max years + 1). Columns, one per year (label "Yr 1" … "{max}+ yrs" 12px `C.textMuted`, % on top 12/700), height = % owned (min 3%), the selected year `C.accent`, earlier years `C.accentBorder`, later `C.borderLight`. More than one money source with different schedules: one row of columns per source with its label. Box `C.greenSoft`/`C.green` 15/600: "You keep {pct}% of the money your employer added. Your own savings are always 100% yours." / ES. If `immediate`: no slider, one full green bar "100% yours right away". In words from the parsed schedule ("You own 20% more each year from year 2. After 6 years you own all of it. If you leave earlier, you keep only the part you own.").
3. Checks -> `git add components/plansparency/visuals/EmployerMoneyVisual.tsx components/plansparency/visuals/VestingVisual.tsx components/plansparency/PlanOverview.tsx components/plansparency/theme.ts scripts/check-theme.ts lib/i18n/index.ts` -> commit `feat(visuals): employer money meter and vesting steps inside the answers` -> push.

## STEP 4: Visual 3 (joining), Visual 4 (taxes), Visual 5 (limits)

1. `JoinTimelineVisual.tsx` (board "Visual 3"), in the `elig` card: steps from `joinSteps` in a row (`repeat(n, 1fr)`, stacked under 560px wide), each a 44px numbered circle (`C.bar` for steps 1 and 2, `C.accent` for the entry date, `C.green` for employer money) on a 3px `C.border` line, title 14/700, detail 13px `C.textMuted` (plan text as written). In words: the steps in one sentence each.
2. `TaxTimingVisual.tsx` (board "Visual 4"), in the `roth` card: grid `110px 1fr 1fr` (one column when only one type is offered): headers "Pre-tax (Traditional)" (`C.surfaceAlt`) and "Roth" (`C.accentSoft`/`C.accentText`); rows "Going in", "While it grows", "Taking it out" with badges (no tax = `C.greenSoft`/`C.green`, taxed = `C.dangerSoft`/`C.danger`, 12/700, radius 100): pre-tax No tax now / No tax / Taxed then; Roth Taxed now / No tax / Tax-free*. Footnote 12px `C.textDim`: "* If you’re 59½ or older and your first Roth deposit was at least 5 years ago." (same wording as the Roth answer). If Roth isn't offered: "Your plan doesn’t offer Roth." under the table.
3. `LimitsVisual.tsx` (board "Visual 5"), in the `limit` card: one row per `limitBars` row (label 130px 14/600, bar 30px, total 76px 700); base `C.accent`, catch-up 50+ `C.accentBorder`, 60 to 63 `ROLE.consultant.base`; widths proportional to the largest total; legend with 12px squares. Title uses the plan year ("{year} savings limits"). In words: "In {year} you can save up to {base}. At 50 or older you can add {catchUp50} more. At ages 60 to 63 the extra is {catchUp6063} instead." If catch-up isn't offered: one bar and "Your plan doesn’t offer catch-up contributions."
4. Checks -> `git add components/plansparency/visuals/JoinTimelineVisual.tsx components/plansparency/visuals/TaxTimingVisual.tsx components/plansparency/visuals/LimitsVisual.tsx components/plansparency/PlanOverview.tsx lib/i18n/index.ts` -> commit `feat(visuals): joining timeline, tax timing, limits by age` -> push.

## STEP 5: Visual 6 (leaving)

1. `LeaveChoicesVisual.tsx` (board "Visual 6: Your 4 choices when you leave") **replaces** the leave choices section in `PlanOverview.tsx` ~176 (heading "Your 4 choices when you leave" stays). Grid 2 columns (1 under 560px), gap 10. Each choice: padding 14, radius 14, `C.surface`, 1px `C.border`; "Cash it out" gets 2px `C.danger` and `C.dangerSoft`-tinted background. Title 16/700, body 13px `C.textMuted` (keep today's `leaveOptions` body text), then two lines with badges: "Taxes now:" and "Extra penalty:" (No = `C.greenSoft`/`C.green`; Yes = `C.dangerSoft`/`C.danger`). Values: Leave it here No / No; new job's plan No (if moved directly) / No; IRA No (if moved directly) / No; Cash it out "Yes, on pre-tax money" / "10% if under 59½". Add to `LeaveOption` in `overview.ts` (fields `taxNow`, `penalty`, each `{ yes: boolean, text }`), EN + ES. In words: "Leaving it, or moving it to a new plan or an IRA, keeps taxes off for now. Cashing out means taxes on pre-tax money, plus a 10% extra tax if you’re under 59½. Roth money can come out tax-free if you meet the Roth rules." Keep today's footnote line.
2. Checks -> `git add components/plansparency/visuals/LeaveChoicesVisual.tsx components/plansparency/PlanOverview.tsx lib/plan/overview.ts lib/i18n/index.ts` -> commit `feat(visuals): leaving choices side by side with tax and penalty badges` -> push.

## STEP 6: Guided start, Welcome step 2 (board `SunFocus`)

1. `lib/plan/focus.ts`: the 6 choices, in order, each `{ id, icon, title, example, go }` (EN + ES):
   | id | title | example | where it goes |
   |---|---|---|---|
   | start | Get started saving / Empezar a ahorrar | When can I join? How much can I put in? Roth or pre-tax? | Your plan, topic `you`, open `elig` |
   | employer | Get my employer’s money / Recibir el dinero de mi empleador | Am I getting the full match? When is it mine to keep? | topic `employer`, open the first employer card (safe harbor, else match) |
   | access | Use my money while I work / Usar mi dinero mientras trabajo | Can I borrow from it? What if I have an emergency? | topic `access`, open `loans` |
   | leave | Leaving or changed jobs / Me voy o cambié de trabajo | What happens to my money? What are my choices? | topic `leave` |
   | invest | Pick my investments / Elegir mis inversiones | What are my options? What does a target date fund do? | Your plan, Investments sub-tab |
   | calc | See what I could save / Ver cuánto podría ahorrar | How much will I have? What if I save 1% more? | Calculator tab |
   Icons: inline SVGs from the board (16 to 22px, `aria-hidden`).
2. `WelcomeDialog.tsx` becomes two steps. Step 1 is today's content, with the primary button relabeled "Next: pick what to learn first" / "Siguiente: elige qué aprender primero", and a small progress bar (two 28x6 bars, radius 6, `C.accent` filled / `C.borderLight` empty) + "Step 1 of 2" (12/700 uppercase `C.accentText`). Step 2 (dialog max-width 720 when on step 2): same bar "Step 2 of 2"; H2 "What do you want to understand first?" / "¿Qué quieres entender primero?" (`F.display` 32/700); text "Pick up to 3. We’ll start there. You can change this anytime." / ES; `<fieldset>` with a visually hidden legend; grid `repeat(auto-fill, minmax(300px, 1fr))` gap 10 of checkbox cards (label wrapping a 22x22 checkbox, a 40x40 icon box radius 12, title 16/700, example 13px `C.textMuted`; checked: 2px `C.accent` border, `C.highlight` background, icon box `C.accent`/`C.onPrimary`; unchecked: 1px `C.border`, icon box `C.surfaceAlt`/`C.tabShadeText`). At 3 picks the others get `aria-disabled="true"` + opacity .55 and a `role="status"` note "That’s 3. Uncheck one to pick another." (13px `C.warning`). Buttons: "Show me my plan ({n})" primary, and "Skip, show me everything" (text button, 15/600 `C.textMuted`, underlined). The × and Esc/outside click on step 2 = skip. "Don’t show this again" checkbox stays on step 1 only. The step 1 → 2 move puts focus on the step 2 heading.
3. `PlansparencyApp.tsx`: `focus` state = ordered list of picked ids, **React state only** (no localStorage, no server). On "Show me my plan": go to the first pick's place and open its card. If the Welcome is set to not show, the dialog doesn't open at all (as today). If step 1 has nothing to show, open at step 2.
4. **Focus strip** (new `components/plansparency/FocusStrip.tsx`), shown on Your plan (both sub-tabs) and the Calculator when `focus` has picks: `<section aria-label="Your focus">` padding 12px 16px, radius 14, `C.highlight`, 1px `C.accentBorder`, wrap, gap 10: label "Your focus" (13/700 uppercase `C.accentText`); one chip button per pick (min-height 40, radius 100, 14/700; current: `C.accent`/`C.onPrimary`; others: `C.surface`/`C.accentText`, 1px `C.accentBorder`; `aria-pressed`), each jumps to its place; "Next: {next title} →" primary button while there is a next pick; "Change focus" (min-height 40, 1px `C.border`, `C.surface`, 14/700 `C.accentText`, pushed right) opens the dialog at step 2 with current picks checked. Place it under the pinned bar, above the topic tabs.
5. **Side panel follows the focus:** `PlanGlance` shows only the groups for picked topics (`you`, `employer`, `access`) plus a text button "Show all plan details" / "Ver todos los detalles del plan" that shows the rest; when no topic pick matches, it shows everything (as today). Nothing else is hidden.
6. Footer: rename "Welcome info" to "Welcome and focus" / "Bienvenida y enfoque" (opens step 1).
7. Checks -> `git add lib/plan/focus.ts components/plansparency/WelcomeDialog.tsx components/plansparency/FocusStrip.tsx components/PlansparencyApp.tsx components/plansparency/PlanOverview.tsx components/plansparency/PlanGlance.tsx lib/i18n/index.ts` -> commit `feat(guide): pick your focus in the welcome, focus strip and next steps` -> push.

## STEP 7: Video player and scene kit (no video placed yet)

Template: canvas board "Video prototype v2: free money from your employer (animated, 58 s)" (`SunVideoMatch2`). Storyboards: board "Video storyboards: 8 videos for PHASE-21" (`SunVideoStoryboards`), copied in the "Video storyboards" section below.

1. Architecture (data, not one component per video):
   - `lib/videos/types.ts`: `VideoId = 'welcome' | 'match' | 'vesting' | 'taxes' | 'limits' | 'access' | 'leave' | 'tdf'`; `Scene = { kind: SceneKind; props: Record<string, unknown>; caption: string }`; `Video = { id, title, scenes: Scene[], next: { label: string; action: NextAction } }`.
   - `lib/videos/build.ts`: `buildVideo(id, planData, ctx, lang): Video | null`. Fills captions from plan data using the STEP 2 builders (`employerMoneyAt`, `vestingSteps`, `limitBars`, `rothRows`) and `ctx` (`employerName`, `planName`, `recordkeeperName`, `hasTeam`). Returns `null` when the storyboard's "Plan data" rule says the video is hidden. Skips scenes the storyboard says to skip. Never leaves a `{blank}` in a caption.
   - `lib/videos/scripts.ts`: the EN captions from the storyboards (exact wording, DRAFT) and ES versions (Claude Code drafts natural Spanish, DRAFT, list in the report). One place for all video words, so ElevenLabs (#68) can read them later.
   - Scene duration = `max(5, ceil(words / 2.6 + 1.5))` seconds (reading speed); total must stay under 60 s per video (`check-videos.ts` fails otherwise).
   - `lib/videos/narration.ts`: `getNarration(video, lang): Promise<{ url: string; timings?: number[] } | null>`, returns `null` for now. This is where ElevenLabs plugs in (#68). When it returns audio, scene timing follows the audio; until then the player runs on the scene durations, silent, captions on.
2. `components/plansparency/video/scenes/`: one React SVG component per scene kind (viewBox `0 0 960 540`, scales to the player): `TitleScene`, `JarScene` (layers of $500, dark = `C.bar` "you", green = `C.green` employer, dashed falling layer), `PaycheckScene` (slice grows), `EmployerScene` (building), `CoinsScene` ("$1 → 50¢" big and small coin), `BarsScene` (side by side bars that grow), `StepsScene` (numbered timeline / year columns), `TaxScene` (jar with a tax slice cut off or not, badges), `ChoicesScene` (cards with badges), `CalendarScene` (year page + pin), `MixScene` (stocks/bonds bar that slides), `CalloutScene` (green or yellow box), `EndScene` (big line + the next-step button drawn as a real HTML button over the stage). Every scene draws the small P logo + plan name top left like the board. Colors only from `C`/`ROLE`; text in SVG uses `F.body`/`F.display`.
3. Animations: copy the board's keyframes (`drop`, `pop`, `slideIn`, `falloff`, `grow`, `pulse`) into `app/globals.css` with the `.vid-a` / `.vid-g` classes (`transform-box: fill-box`). Each scene is mounted fresh when it starts, so its animations replay. `@media (prefers-reduced-motion: reduce)` turns them off (scenes show their finished state). Counting numbers (e.g. "You: $1,500 a year") count up over 2 s from the scene start, or show the final value with reduced motion.
4. `components/plansparency/video/VideoPlayer.tsx` (copy the board's controls): stage 16:9, radius 18, `C.highlight` background, 1px `C.accentBorder`; 6px progress bar `C.accent` on `C.accentSoft`; caption box over the bottom (max 86%, padding 8px 14px, radius 8, background: new token `captionBg: "rgba(17,24,39,.85)"` in `theme.ts`, text `C.onPrimary` 18px line-height 1.4), on by default. Controls row: "▶ Play video" / "Pause" / "Play" (primary, min-height 44), "Restart", one 40x40 round button per scene ("Go to scene N", `aria-current`), "Captions" checkbox, "Show transcript" / "Hide transcript" (`aria-expanded`), transcript = ordered list of captions in `C.surfaceAlt`. The stage is `role="region"` with `aria-label="Video: {title}"`; the SVG is `aria-hidden`; a visually hidden `role="status"` repeats the current caption. Space toggles play when the player has focus; Escape pauses. Never autoplays. Stops when it scrolls out of view or its card closes. Small line under the player 12px `C.textDim`: "Silent with captions for now. Education only, not advice." / ES.
5. `components/plansparency/video/WatchButton.tsx`: the entry point everywhere: a pill button (min-height 40, radius 100, 1px `C.accentBorder`, `C.highlight`, 14/700 `C.accentText`) "▶ Watch: {title} · {seconds} s" / "▶ Ver: {title} · {seconds} s". Clicking it opens the player **inline right below the button** (not a pop-up) with focus on Play; clicking again ("Hide video") closes it. Only one player is open on the page at a time.
6. `scripts/check-videos.ts`: for every sample plan in `scripts/samples.ts` and both languages: `buildVideo` never throws; no `{`, `undefined`, `NaN`, em/en dash in any caption; every video under 60 s; hidden videos match the storyboard rules (e.g. `taxes` hidden when Roth isn't offered, `access` hidden when neither loans nor hardship); `match` numbers equal `employerMoneyAt`; `limits` numbers equal `irs-limits.ts`.
7. Checks -> `git add lib/videos components/plansparency/video app/globals.css components/plansparency/theme.ts scripts/check-videos.ts` -> commit `feat(video): data-driven animated video player and scene kit` -> push.

## STEP 8: Build the 8 videos and place them (fluid path, no new tab)

1. Build each video from the storyboards below with `buildVideo`. Placement, all through `WatchButton` (the button only appears when `buildVideo` returns a video):
   | Video | Placed | End button does |
   |---|---|---|
   | welcome | Welcome step 1, under the details box: "▶ Watch: your plan in {s} seconds". The player replaces the step 1 content inside the dialog with a "← Back" link; the end button moves to step 2. | opens Welcome step 2 |
   | match | first line inside the open safe harbor answer and the open match answer (same video) | opens the Calculator tab |
   | vesting | first line inside the open vesting answer, above Visual 2 | closes the player and scrolls to Visual 2 |
   | taxes | first line inside the open Roth answer; 401(k) terms entries "Traditional (Pre-tax)" and "Roth" (under the definition) | opens the Calculator tab |
   | limits | first line inside the open savings limit answer; top of the Calculator ("New to this? ▶ Watch: How much can you save · {s} s") | opens / scrolls to the calculator inputs |
   | access | top of the Access my money topic, above its cards | opens the loans card (or hardship if loans aren't offered) |
   | leave | top of the When you leave topic, above Visual 6 | scrolls to Visual 6 |
   | tdf | top of the Investments sub-tab (both the upload prompt and the fund list); 401(k) terms entry "Target date fund" | Investments sub-tab, fund list or upload prompt |
2. Guided start link-up: when the focus strip's current pick has a video (`start` → `limits`, `employer` → `match` then `vesting`, `access` → `access`, `leave` → `leave`, `invest` → `tdf`, `calc` → `limits`), the strip shows "▶ Watch first · {s} s" next to the chips; it opens the same inline player at the place the pick goes to. After a video ends, the end button and the strip's "Next" both stay available, so the person always has one obvious next step.
3. No "Videos" tab and no video list page: every video lives where its question is (keeps navigation the same 4 tabs).
4. Checks -> `git add` (list) -> commit `feat(video): 8 explainer videos placed in the answers, welcome, calculator, terms and investments` -> push.

## Video storyboards (copied from board "Video storyboards: 8 videos for PHASE-21")

#### Video 1: Welcome to your plan (`welcome`)
- **Where:** Welcome step 1 ("Watch: your plan in 30 seconds" link; plays inside the dialog, Back returns to step 1)
- **Data:** planName; scenes 2 and 3 skipped when employerName / recordkeeperName is missing
- **End card button:** Next: pick what to learn first (goes to step 2)

| # | Picture (animated, from the scene kit) | Caption / narration (EN, DRAFT) |
|---|---|---|
| 1 | Title card. Plan name in big type, the P logo pops in. | Welcome! This is your {planName}, explained in plain words. |
| 2 | A building (employer) slides in; a coin moves from it toward a jar labeled "Your 401(k)". | Your employer, {employerName}, offers this plan to help you save for later in life. |
| 3 | An account card labeled {recordkeeperName} with a login button glow. | {recordkeeperName} holds your account. That’s where you log in to see your balance or change how much you save. |
| 4 | Three icons appear one by one with arrows: pick a topic, watch or read, try the calculator. | Pick what you want to learn first. Each topic has a short video, a picture and plain answers. |

#### Video 2: Free money from your employer (`match`)
- **Where:** Top of the safe harbor and employer match answers; the Employer money focus pick; end card of the Welcome video if picked
- **Data:** employerMoneyAt (STEP 2). Nonelective safe harbor (employer adds money even if you save nothing) uses the alternate scenes in brackets. Hidden if neither safe harbor nor match has a usable formula.
- **End card button:** See it with your pay (opens the calculator)

| # | Picture (animated, from the scene kit) | Caption / narration (EN, DRAFT) |
|---|---|---|
| 1 | Title "Free money from your employer"; the jar drops 3 layers. | Your employer can add free money to your 401(k). Here’s how. |
| 2 | Paycheck card; a coral slice marked {tier1Pct}% grows; dark layers drop into the jar; counter "You: {youAtTier1} a year". [Nonelective: skip.] | Every paycheck, a small part of your pay goes into your 401(k). Save {tier1Pct}%, and that’s {youAtTier1} a year. |
| 3 | Employer building; green layers drop on top of the dark ones; "{tier1Rate}" in big green type; counter. [Nonelective: green layers drop with no dark ones: "{employerName} adds {fullEmployer} a year, even if you save nothing."] | {employerName} matches it: {tier1Words}. |
| 4 | Only when there is a second tier: a big dark coin, an arrow, a smaller green coin ("$1 → {tier2Coin}"). | Save {tier2Pct}% more, and {employerName} adds {tier2Words}. |
| 5 | Two bars grow side by side: You save {youAtFull}, {employerName} adds {fullEmployer}; green box "Every year, on $50,000 pay". | Save {pctForFull}% in total, and {employerName} adds {fullEmployer} a year. That’s all of it. |
| 6 | The jar with a dashed layer sliding off a table edge; yellow box "Saving {lowPct}%? You miss {missed} a year." [Nonelective: "You can add more on top. Your own savings are always yours."] | Save less, and some of that money stays on the table. You can change how much you save anytime. |

#### Video 3: Is your employer’s money yours to keep? (`vesting`)
- **Where:** Top of the vesting answer, above Visual 2; the Employer money focus pick (after the match video)
- **Data:** vestingSteps (STEP 2). Immediate vesting uses scenes 1, 2 and a single "100% yours right away" scene. Hidden if nothing parses.
- **End card button:** See your vesting picture (scrolls to Visual 2)

| # | Picture (animated, from the scene kit) | Caption / narration (EN, DRAFT) |
|---|---|---|
| 1 | Title; jar with dark and green layers. | Is the money your employer adds yours to keep? It depends on how long you work there. |
| 2 | Dark layers get a lock icon and "100% yours, always". | First, the money you save is always 100% yours. No matter what. |
| 3 | Green layers turn pale with a small clock. | The money your employer adds becomes yours over time. That’s called vesting. |
| 4 | Year columns grow one after another from the plan schedule ({scheduleWords}). | {scheduleWords} |
| 5 | Example at year {exampleYear}: {examplePct}% of the green layers stay, the rest fade out of the jar. | Leave after {exampleYear} years, and you keep {examplePct}% of your employer’s money. Stay longer, and you keep more. |

#### Video 4: Pre-tax or Roth: when do you pay taxes? (`taxes`)
- **Where:** Top of the Roth answer; 401(k) terms entries "Traditional (Pre-tax)" and "Roth"
- **Data:** Shown only when the plan offers Roth (hasRoth true). General content, no plan numbers.
- **End card button:** Open the calculator

| # | Picture (animated, from the scene kit) | Caption / narration (EN, DRAFT) |
|---|---|---|
| 1 | Title; two doors labeled Pre-tax and Roth. | Pre-tax or Roth? The only difference is when you pay taxes. |
| 2 | Paycheck; the tax slice is skipped, the whole amount drops into a jar labeled Pre-tax; green "No tax now". | With pre-tax, your money goes in before taxes. Your paycheck’s taxes go down today. |
| 3 | Older you takes money out of the pre-tax jar; a tax slice is cut off; red "Taxed then". | You pay the taxes later, when you take the money out. |
| 4 | Paycheck; tax slice cut first, the rest drops into a jar labeled Roth; red "Taxed now". | With Roth, you pay the taxes now, on the money you put in. |
| 5 | Older you takes money out of the Roth jar, nothing cut; green "Tax-free*" and the footnote line. | Later, it can all come out tax-free, if you’re 59 and a half or older and your first Roth deposit was at least 5 years ago. |
| 6 | Both jars side by side with a plus sign. | Your plan lets you pick one or use both. |

#### Video 5: How much can you save? (`limits`)
- **Where:** Top of the savings limit answer; top of the Calculator ("New to this? Watch: How much can you save, 35 s")
- **Data:** limitBars (STEP 2). Scenes 3 and 4 skipped when catch-up isn’t offered.
- **End card button:** Open the calculator

| # | Picture (animated, from the scene kit) | Caption / narration (EN, DRAFT) |
|---|---|---|
| 1 | Title; an empty bar with a finish line. | There’s a yearly limit on how much you can save from your paychecks. |
| 2 | The bar fills coral to {base}; label {year}. | In {year}, you can save up to {base}. |
| 3 | A light coral piece adds on: +{catchUp50}, label "Age 50+". | At 50 or older, you can add up to {catchUp50} more. That’s called catch-up. |
| 4 | The light piece swaps for a purple, longer one: +{catchUp6063}, label "Ages 60 to 63". | At ages 60 to 63, the extra is {catchUp6063} instead. |
| 5 | Green layers drop into a jar beside the bar, outside the limit line. | Money your employer adds doesn’t count toward your limit. |

#### Video 6: Need money before you retire? (`access`)
- **Where:** Top of the Access my money topic (above the loan and hardship answers); the Use my money focus pick
- **Data:** Loan scenes only if loanAvailable; hardship scenes only if hardshipAvailable. Hidden if neither is offered.
- **End card button:** Read the loan answer (opens the loans card), or the hardship answer when loans aren’t offered

| # | Picture (animated, from the scene kit) | Caption / narration (EN, DRAFT) |
|---|---|---|
| 1 | Title; the jar with a door on it. | Need money before you retire? Your plan may have two ways. |
| 2 | Loan: layers leave the jar, then come back one by one from paychecks; "+ interest goes back to you". | A loan lets you borrow from yourself. You pay it back from your paychecks, and the interest goes back into your account. |
| 3 | A briefcase walking out; a clock over the unpaid layers. | If you leave your job, what you still owe may be due soon. |
| 4 | Hardship: icons for medical bills, eviction, tuition; layers leave and don’t come back; red "Taxed". | A hardship withdrawal is for serious needs, like big medical bills or avoiding eviction. It’s taxed, often with a 10% extra tax if you’re under 59 and a half, and you can’t put it back. |
| 5 | The jar shrinks a little next to a fuller jar; "Less now means less later". | Either way, money taken out now has less time to grow. |

#### Video 7: Leaving your job? (`leave`)
- **Where:** Top of the When you leave topic, above Visual 6; the Leaving focus pick
- **Data:** General; scene 2 uses vesting words if vestingSteps exists, else a general line.
- **End card button:** See your 4 choices (scrolls to Visual 6)

| # | Picture (animated, from the scene kit) | Caption / narration (EN, DRAFT) |
|---|---|---|
| 1 | Title; a person with a briefcase and the jar. | Leaving your job? Your 401(k) money comes with you. |
| 2 | Dark layers locked "Yours"; green layers show the part you own. | Your own savings are always yours. Of your employer’s money, you keep the part you own. |
| 3 | Three cards pop in: Leave it, New job’s plan, IRA; each gets a green "No tax now". | You can leave it in the plan, move it to your new job’s plan, or move it to an IRA. Moved directly, none of these is taxed now. |
| 4 | Fourth card "Cash it out"; the jar tips, a red tax slice and a red "10% if under 59½" slice come off. | Or you can cash it out. That’s taxed, and usually there’s a 10% extra tax if you’re under 59 and a half. |
| 5 | All four cards in a row; the first three glow. | Take your time choosing. Your plan’s website walks you through the steps. |

#### Video 8: What is a target date fund? (`tdf`)
- **Where:** Top of the Investments tab (both the upload prompt and the fund list); 401(k) terms entry "Target date fund"; the Pick my investments focus pick
- **Data:** General, no plan numbers.
- **End card button:** See your investment options

| # | Picture (animated, from the scene kit) | Caption / narration (EN, DRAFT) |
|---|---|---|
| 1 | Title; a calendar page flips to a year. | What’s a target date fund? It’s one fund built around the year you plan to retire. |
| 2 | A calendar shows 2060 with a pin. | You pick the fund with the year closest to when you plan to stop working, like 2060. |
| 3 | A bar: mostly coral (stocks) with a small gray part (bonds); "Early on: more stocks, to grow". | Early on, it holds more stocks, which can grow more but go up and down more. |
| 4 | The same bar slides to mostly gray; "Closer to retirement: more bonds, to steady it". | As the year gets closer, it shifts to more bonds, which usually move less. |
| 5 | One fund card with a gear; "Check the fees and what’s inside". | One fund that adjusts over time. Check its fees and what’s inside before you choose. Education only, not advice. |

## STEP 9: Docs
1. This file: Status -> Done with the nine commit hashes and the date.
2. `OPEN-ITEMS.md`: #64, #65, #66, #67 -> built (commits); #68 (ElevenLabs) stays open. START HERE: Ross's test on `/p/<Tierra Sur id>`: Welcome step 1 → Next → pick 2 → land on the first, use the focus strip's Next, Change focus, Skip; reload (picks gone, by design); open each card with a picture and drag the sliders; switch to Spanish; keyboard only once; play every video once (Welcome link, each answer, Calculator, 401(k) terms, Investments), check captions, Pause, scene buttons, the end button, and that only one player is open at a time.
3. `MEMORY.md`: "Oct 27, 2026: Welcome has 2 steps (info, pick your focus). Focus picks live only in React state. Pictures live in `components/plansparency/visuals/`, built from `lib/plan/visuals.ts`, each with an 'In words' text version. Videos are data (`lib/videos/`), built from plan data, silent with captions; `narration.ts` is where ElevenLabs plugs in."
4. `git add "PHASE PROMPTS/PHASE-21-guided-focus-and-visuals.md" OPEN-ITEMS.md MEMORY.md` (+ any other Cowork doc that changed) -> commit `docs: phase 21` -> push.

## Report back
- Nine commit hashes, files per step.
- Every file where `catchUp6063` was shown as the 50+ amount (STEP 1).
- Which sample plans show which pictures, and which pictures were hidden for missing data (from `check-visuals.ts`).
- ES strings added.
- Output of `check-visuals`, `check-videos`, `check-overview`, `check-a11y`, `check-theme`.
- Which videos are hidden for which sample plans, and each video's total seconds.

## Checklist (Cowork reviews the diff and the rendered pages before Ross tests)
- [ ] Catch-up row: "$8,000 ($11,250 at ages 60 to 63)".
- [ ] Every picture: inside its card, plan numbers only, "In words" paragraph, picture `aria-hidden`, hidden when data is missing.
- [ ] Visual 1 math matches the calculator for the same pay and %.
- [ ] Only one vesting picture remains.
- [ ] Welcome: Step 1 of 2 → Step 2 of 2; max 3 picks; Skip works; × / Esc / outside click on step 2 = skip.
- [ ] Focus strip with chips, Next, Change focus; side panel shows picked groups first with "Show all plan details".
- [ ] Reload forgets the picks; no localStorage key for focus.
- [ ] 8 videos built from data, each under 60 s, v2 animation style, never autoplay, captions on, transcript, Pause, scene buttons, reduced motion shows finished scenes.
- [ ] Each video sits where its question is (table in STEP 8), opens inline under its Watch button, one player at a time, end button goes to the next useful place; focus strip offers "Watch first".
- [ ] Videos hidden when their plan data is missing; no `{blank}` ever shown.
- [ ] Spanish everywhere; nothing under 12px; all checks pass.
