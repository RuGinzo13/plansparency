# PHASE 23: Right facts, pictures only where they apply, one clear look on every screen
**Created:** Oct 28, 2026 in Cowork
**Run (Auto mode, walk away):** `Read "PHASE PROMPTS/PHASE-23-relevance-facts-clarity.md" and execute all steps in order.` 7 steps, 7 commits, each pushed to `main`. No checkpoints. No new npm packages. No database change (new fields live inside `plandata_json`).
**Open items:** #74 (pictures and videos where they don't apply), #76 (plan facts read wrong), #75 + #77 (clarity look on every screen).
**Status:** Done Oct 28, 2026. Step 1 `1f7a1d7`, Step 2 `b827768`, Step 3 `c49fcb4`, Step 4 `733628c`, Step 5 `db1274e`, Step 6 `a293f8f` (leftover cleanup), Step 7 docs commit. Ross's click-through is pending.
**Design source:** Landing Redesign canvas, page **"Current site"** only: "1. Landing", "2. Participant site", "3. Advisor side" (built from `Plansparency/Design canvas source/`, values copied below). Never copy from the "Archive" page.

First run: `ls app/ components/ components/plansparency/ components/plansparency/visuals/ components/plansparency/video/ components/plansparency/advisor/ lib/ lib/plan/ lib/videos/ lib/answers/ scripts/ scripts/fixtures/` to confirm the current file structure. Do not act until you've read the output.

## Why (Ross, Oct 28)
- "Things are way too cluttered and there's not enough color contrast to easily find and navigate through things."
- "Be very careful about showing graphics that will confuse people. There is no safe harbor contribution, but you included a slider and tools." And: "the issue was not just limited to the safe harbor part... across the entire site."

## What Cowork found (`18be65e`, audit of the 4 real plans + 14 samples)
1. **Pictures/videos on "No" cards.** `visuals/CardVisual.tsx` gives BOTH `safeHarbor` and `match` the combined employer meter (`employerMoneyAt` adds safe harbor + match), and `PlanOverview.tsx` `CARD_VIDEO` maps both to the `match` video, with no look at the card's own answer. Baer's (no safe harbor) shows the meter + video under "No". Conflict International (safe harbor, "No, safe harbor only" match) shows them under the match "No". `WatchFirstRow` ids are hard-coded per topic.
2. **Tierra Sur numbers disagree in 4 places.** Saved `matchTiers` `[{pct:100, upTo:6, totalCap:4}]` sit next to a basic safe harbor. `normalizePlanData` drops `totalCap`. Match card says "up to 6%", meter and match video say "$5,000 at 6%", and the video narrates the 3% + 2% safe harbor steps then says "$5,000, that's all of it", mixing guaranteed money with a match that has a last-day rule and 6-year vesting. The real discretionary match is not known (Ross hasn't confirmed it), so it must show "Ask HR" until the advisor checks it.
3. **Conflict International "Discretionary QNEC" saved as profit sharing.** Card says "Yes, your plan has profit sharing." A QNEC is not profit sharing.
4. **In-service.** `normalizeDistribution` (`plandata.ts` ~93) turns ANY age found into `inServiceAvailable: true`; the panel shows "Yes, at age 59½" for all 4 plans. 59½ may be a default the reader filled in. Also `/p/[plan_id]/page.tsx` passes the stored `plandata_json` without `normalizePlanData`, so plans saved before PHASE-22 have no answer behind the "Yes" row.
5. **"Up to X% of pay" means two things.** Side panel = what the employer adds (50% x 6% = "up to 3%"); card answer = how much of your saving gets matched ("up to 6%").
6. **Calculator disagrees with Your plan.** `CalcPanel.tsx` ~96 `hasDiscretionaryMatch = !(noMatch ?? true)`: Conflict (`noMatch:false`, no tiers) gets an "Extra employer match, not guaranteed" row while Your plan says none. `calc.ts` counts only safe harbor money, so Baer's shows $0 employer money in the calculator but $2,000 a year on the match card.
7. **Target date video for every plan** (`build.ts` `tdf` has no condition), including all 4 real plans with no funds; it ends "Ready to look at your options?".
8. **Focus choices never filtered** (`WelcomeDialog.tsx` ~136 maps all of `FOCUS_CHOICES`); `focusPlace('access')` always opens `loans`, a "No" card for Baer's.
9. **Welcome scene** `welcome.4` says "Each topic has a short video, a picture and plain answers." Not true for every topic.

## Rules for Claude Code
Same rules as PHASE-22. Auto mode, repo root, stage only named files, no deny-list commands, never `git reset/clean/stash`, never force-push. Checks after each step: `npx tsc --noEmit`, `npm run build`, every `scripts/check-*.ts` (`npx --yes tsx scripts/<name>.ts`). Colors/widths only from `theme.ts`, fonts from `F`. CLAUDE.md "Accessibility Rules". EN + ES for every participant string (list ES in the report). No em/en dashes in copy. New wording is DRAFT (#39). Delete code the new design replaces; never leave two ways to decide the same thing. **One source of truth:** after STEP 2, nothing outside `lib/plan/relevance.ts` decides whether a card shows a picture, slider, video, link or which pill kind it gets.

## STEP 1: Read plan facts right; unsure facts become "Ask HR" until the advisor confirms (#76)

1. `lib/plan/plandata.ts`
   - `MatchTier` gets optional `cap?: number` (most % of pay the employer adds for this tier). `normalizeTiers` keeps `t.cap ?? t.totalCap ?? t.maxMatch` when it is a finite number 0 to 100.
   - `PlanData` gets `matchKind?: 'fixed' | 'discretionary' | null` (normalize: only those two strings, else null).
   - `ProfitSharing.type` accepts `'qnec'`; normalize `type` to `'qnec'` when `type` or `formula` matches `/\bQNEC\b|qualified non-?elective/i`.
   - `normalizeDistribution`: `inServiceAvailable` = the document's explicit answer only (`asked`); an age found no longer turns it into `true`. Keep the age.
2. `lib/i18n/index.ts` `firstMessage` (EN ~46 and the ES copy ~348): add to the instructions, same style as the lines around them:
   - matchTiers: `"cap"` = the most % of pay the employer adds for that tier, only if the document says so.
   - `matchKind`: `"fixed"` if the document gives a set match formula the employer must follow, `"discretionary"` if the employer decides each year, otherwise null.
   - profitSharing.type: add `"qnec"` for a qualified nonelective contribution (QNEC). A QNEC is not profit sharing.
   - distributionInfo: `inServiceAvailable` true ONLY if the document clearly says in-service withdrawals are allowed; `inServiceAge` ONLY if the document states the age. Never fill in 59.5 by default.
   - Add `matchKind`, `cap` to the example PLANDATA line.
3. New `lib/plan/unsure.ts`: `unsureKeys(pd): Set<'match' | 'profitSharing' | 'inService'>` (review row keys from `reviewRows.ts`), skipping any key in `pd.review?.confirmed` (string array):
   - `match`: the safe harbor is a match type (`basic_match`, `enhanced_match`, `qaca`) AND `matchTiers` is not empty (a second match next to a safe harbor match is usually the safe harbor read twice), OR any tier has a `cap` (we can't show a capped tier correctly yet).
   - `profitSharing`: `profitSharing.type === 'qnec'`.
   - `inService`: `inServiceAvailable` is not `true` but `inServiceAge` is a number.
4. Where unsure shows (same wording everywhere, DRAFT):
   - `lib/plan/overview.ts` panel values and card facts for that card: `"Ask HR"` / `"Pregunta a RR. HH."`.
   - `lib/answers/stockAnswers.ts` answers for `match`, `profit`, `inService` when unsure: `**Your plan document isn't clear on this.** Ask HR or your plan's advisor. Your advisor is checking it.` / `**El documento de tu plan no es claro sobre esto.** Pregunta a Recursos Humanos o al asesor de tu plan. Tu asesor lo está revisando.`
   - `profit` with `type === 'qnec'` once confirmed: `**Your employer may add a QNEC.** That's money your employer can add for everyone who's eligible, whether or not you save. It's yours right away.` / ES equivalent. Never call it profit sharing.
5. Advisor side (`components/plansparency/advisor/ReviewField.tsx` and the pages that render review rows: `app/advisor/page.tsx` review step, `app/advisor/plans/[plan_id]/details/page.tsx`): a row whose key is in `unsureKeys` gets a coral outline, the label "Please check: we weren't sure" and a short reason (`match`: "A second match was found next to the safe harbor match. Is there really an extra match?"; `profitSharing`: "We found a QNEC, which is not profit sharing."; `inService`: "An age appears, but the document doesn't clearly say this is allowed."). Saving the row (or a "This is right" button) adds its key to `review.confirmed`. The details route (`app/api/plan-details/[plan_id]/route.ts` ~102) and the new-plan save (`app/api/save-plan/route.ts`) must store `review.confirmed` server side the same way they store `history` (never trust a client `review` object; accept only the 3 known keys).
6. `app/p/[plan_id]/page.tsx`: pass `{ ...plan.plandata_json, ...normalizePlanData(plan.plandata_json) }` (keeps `review` and other fields, applies the normalizer) to `initialPlanData`. (`/advisor/preview` never loads a saved plan; leave it.)
7. Checks (add cases to `scripts/check-answers.ts` and `scripts/check-review.ts`): Tierra Sur fixture -> match "Ask HR"; Conflict fixture -> profit "Ask HR"; any plan with age but no explicit yes -> in-service "Ask HR"; after `review.confirmed` includes the key -> normal answer. Fixtures: `scripts/fixtures/real-plans.json` (added by Cowork Oct 28; the 4 test plans as saved, EIN removed).
8. `git add lib/plan/plandata.ts lib/i18n/index.ts lib/plan/unsure.ts lib/plan/overview.ts lib/answers/stockAnswers.ts components/plansparency/advisor/ReviewField.tsx app/advisor/page.tsx "app/advisor/plans/[plan_id]/details/page.tsx" "app/api/plan-details/[plan_id]/route.ts" app/api/save-plan/route.ts "app/p/[plan_id]/page.tsx" scripts/check-answers.ts scripts/check-review.ts scripts/fixtures/real-plans.json` (only those changed) -> commit `fix(plan): unsure facts show Ask HR until the advisor confirms; QNEC, capped match and in-service read right` -> push.

## STEP 2: One relevance rule for every card, picture and video (#74)

1. New `lib/plan/relevance.ts` (pure, no React):
   - `cardKind(id: StockId, pd): 'yes' | 'no' | 'info' | 'ask'`. `ask` = unknown or in `unsureKeys`. `info` = a plain fact (elig, limit, leave). `yes`/`no` from the plan.
   - `cardExtras(id, pd): { picture: 'employerSafeHarbor' | 'employerMatch' | 'vesting' | 'join' | 'tax' | 'limits' | 'leave' | null; video: VideoId | null; link: { to: StockId; text: { en: string; es: string } } | null }`. Rules (a picture or video ONLY when `cardKind` is `yes` or `info`):
     - `safeHarbor`: yes -> picture `employerSafeHarbor`, video `match` only when the safe harbor is a match type. No -> link to `match` when the match is yes ("See the match answer ↓" / "Ver la respuesta del match ↓").
     - `match`: yes -> picture `employerMatch`, video `match` only when there is no safe harbor match (otherwise the video lives on the safe harbor card). No + safe harbor yes -> link to `safeHarbor` ("See the safe harbor answer ↑" / "Ver la respuesta de safe harbor ↑").
     - `profit`, `inService`: never a picture or video.
     - `vesting`: yes only when the plan has any employer money; picture `vesting`, video `vesting`.
     - `roth`: picture `tax` when both facts are known; video `taxes` only when Roth is offered.
     - `limit`: picture `limits`, video `limits`. `elig`: picture `join` when `joinSteps` returns steps. `leave`: picture `leave`, video `leave`.
     - `loans` / `hardship`: video `access` on the FIRST yes card of the two; none when both are no. No loans + hardship yes -> loans card links to hardship ("See the hardship answer ↓").
   - `topicVideos(topic, pd): VideoId[]` = the videos of that topic's cards, in card order, no duplicates.
   - `pillKindFor(id, pd)` = `cardKind`, used by every pill on the site.
2. `lib/plan/visuals.ts`: `employerMoneyAt(pd, pct, pay, source)` with `source: 'safeHarbor' | 'match' | 'all'` (default `'all'` only for the calculator). `employerTiers(pd, source)` the same. `safeHarbor` = safe harbor money only; `match` = the extra match only (`matchTiers`, honoring `cap`, skipped when unsure). Remove the old combined use from the cards.
3. `components/plansparency/visuals/CardVisual.tsx` and `EmployerMoneyVisual.tsx`: render only `cardExtras(id).picture`; the employer visual takes `source` and its words say "Safe harbor adds" or "Match adds".
4. `PlanOverview.tsx`: delete `CARD_VIDEO` and the hard-coded `WatchFirstRow ids`; use `cardExtras` / `topicVideos`. A topic with no videos shows no "Watch first" row.
5. `lib/videos/build.ts`:
   - `match`: narrate ONE money source: the safe harbor match when there is one (guaranteed), else the match. When both exist, add one scene before the end: "Your employer may also add an extra match. It isn't guaranteed, so it isn't counted here." / "Tu empleador también puede agregar un match adicional. No está garantizado, así que no se cuenta aquí." Totals never mix the two. When the match is unsure, the extra-match scene says "Ask HR about an extra match." / "Pregunta a RR. HH. sobre un match adicional."
   - `tdf`: return null unless `fundsData` has at least one fund with category `"Target Date"`.
   - `lib/videos/scripts.ts` `welcome.4`: "Pick what you want to learn first. Each topic has plain answers, with pictures and short videos where they help." / "Elige qué quieres aprender primero. Cada tema tiene respuestas claras, con imágenes y videos cortos donde ayudan."
6. `lib/plan/focus.ts`: `focusChoicesFor(pd)` drops `employer` when the plan has no safe harbor, match or profit sharing; drops `access` when loans, hardship and in-service are all no; drops `invest` when `fundsData` is empty. `focusPlace('access')` opens the first yes card of loans, hardship, in-service. `WelcomeDialog.tsx` uses `focusChoicesFor`; its subtitle adds "Only topics that apply to your plan are listed." / "Solo aparecen los temas que aplican a tu plan."
7. Calculator (`CalcPanel.tsx`, `lib/plan/calc.ts`): use `facts(pd).disc` (never `!noMatch`). Employer money = safe harbor + match (match only when `cardKind('match') === 'yes'`), from the same `employerMoneyAt` sources as the cards, so at any % the calculator and the cards show the same dollars. Result rows: "From you", "Safe harbor (required every year)" / "Safe harbor (obligatorio cada año)" when present, "Match (your employer can change it)" / "Match (tu empleador puede cambiarlo)" when present. Match unsure -> no match row, a line "Ask HR about an extra match." The "not guaranteed, not counted" line only stays for `matchKind === 'discretionary'`. `trueUpRelevant` uses the same facts.
8. "Adds up to" wording: panel values and card facts for safe harbor and match say `Adds up to X% of pay` / `Agrega hasta X% del salario`, where X = the most the employer adds (already computed in `overview.ts`). Card answers keep the formula sentence.
9. New `scripts/check-relevance.ts`: for every plan in `scripts/samples.ts` AND `scripts/fixtures/real-plans.json` (run each through `normalizePlanData`), for every card: kind `no`/`ask` -> no picture, no video, no slider; picture source matches the card (safe harbor card never shows match money and the reverse); the side panel pill kind equals the card pill kind; at 6% on $50,000 the calculator employer total equals safe harbor card money + match card money; `topicVideos` only lists videos of yes/info cards; `tdf` only with a Target Date fund; `focusChoicesFor` never offers a topic whose cards are all no; the match video total never exceeds the safe harbor (or match) card total. Print PASS/FAIL counts like the other checks.
10. `git add lib/plan/relevance.ts lib/plan/visuals.ts components/plansparency/visuals/CardVisual.tsx components/plansparency/visuals/EmployerMoneyVisual.tsx components/plansparency/PlanOverview.tsx lib/videos/build.ts lib/videos/scripts.ts lib/plan/focus.ts components/plansparency/WelcomeDialog.tsx components/plansparency/CalcPanel.tsx lib/plan/calc.ts lib/plan/overview.ts lib/i18n/index.ts scripts/check-relevance.ts scripts/check-visuals.ts scripts/check-videos.ts scripts/check-calc.ts` (only those changed) -> commit `fix(plan): pictures, videos and calculator follow one relevance rule per card; check-relevance` -> push.

## STEP 3: Shared look pieces (#75, #77)
Values from the "Current site" boards. Tokens that already exist are reused; add only what's missing to `theme.ts`.
1. `theme.ts`: add `C.page: "#F3F4F6"` (page background), `C.cardShadow: "rgba(17,24,39,.12)"`. Everything else maps to existing tokens: card `C.surface`, line `C.borderLight`, strong border `C.bar`, yes `C.green`/`C.greenSoft`, no `C.textMuted`, ask `C.accent`/`C.accentText`/`C.highlight`, warn `C.warning`/`C.warningDim`. Add both to `check-theme.ts` contrast pairs as needed.
2. New `components/plansparency/Pill.tsx`: `<Pill kind="yes|no|info|ask" size="md|sm">`. md: 15px/700, padding 6px 14px; sm: 13px/700, padding 3px 10px; radius 100, no wrap, max-width 100%. yes: `C.green` background, white text. no: `C.textMuted` background, white text. info: white background, `C.text`, 2px `C.bar` border. ask: white background, `C.accentText`, 2px `C.accent` border. Every pill on the site uses it (cards, side panel, calculator "Good to know", advisor review rows, plans table).
3. New `components/plansparency/Panel.tsx`: white card, radius 16, `box-shadow: 0 1px 3px ${C.cardShadow}`, padding 20px; `strong` prop: 2px `C.bar` border + `0 4px 14px ${C.cardShadow}`.
4. New `components/plansparency/AnswerBand.tsx`: the answer line at the top of an open card: padding 14px 16px, radius 10, 18px/700, line-height 1.4, 6px left border; yes `C.greenSoft` + `C.green`; no `C.surfaceAlt` + `C.textMuted`; ask `C.highlight` + `C.accent`; info `C.surfaceAlt` + `C.bar`.
5. `app/globals.css` / page shells: participant and advisor page background `C.page` (white header row and the dark plan bar stay as they are).
6. `git add components/plansparency/theme.ts scripts/check-theme.ts components/plansparency/Pill.tsx components/plansparency/Panel.tsx components/plansparency/AnswerBand.tsx app/globals.css components/PlansparencyApp.tsx` (only those changed) -> commit `feat(theme): page background, Pill, Panel and AnswerBand shared pieces` -> push.

## STEP 4: Your plan in the clear look (board "2. Participant site", Your plan)
1. Topic tabs: ONE white bar (`Panel`, padding 6, gap 6), each topic a button min-height 52, radius 12, 15px/700, number circle 24px (`C.borderLight` bg, `C.text`). Selected: `C.bar` background, white text, number circle white with `C.bar` text. Drop the sub lines.
2. Cards: `Panel` with overflow hidden; open card = `strong`. Header row: the toggle `<button>` (question `F.display` 24/700, then `Pill` md of `pillKindFor` with the card fact, then the chevron) and, as a SIBLING button after it (never nested), the video chip when `cardExtras(id).video`: min-height 40, radius 100, `C.bar` background, white 13/700, a 26px white circle with a dark ▶, then the length ("0:45"); `aria-label` "Watch: {title}, {seconds} seconds" / ES. Open body, in order: `AnswerBand` (the first sentence of the answer), the rest of the answer (16px, line-height 1.6), the link button when `cardExtras(id).link` (700, `C.accentText`, underline), the picture, then ONE source line (12px `C.textDim`, top border `C.borderLight`): reviewed plans "From your plan's reviewed details · Education only, not advice." / "De los datos revisados de tu plan · Solo educación, no es asesoría."; otherwise "From your plan document · Education only, not advice." / "Del documento de tu plan · Solo educación, no es asesoría." (the reviewer name and date already show in the plan bar) Remove the old extra source/badge lines in `AnswerBody.tsx` and the `PreferToWatch` link inside cards.
3. "Watch first" row: dark panel (`C.bar`, radius 16, padding 16), title "Watch first: {n} short videos on {topic}" 15/700 white, thumbnails as built in PHASE-22 (keep `VideoThumb`), only `topicVideos`.
4. Side panel (`PlanGlance.tsx`): `Panel`; heading "Your plan at a glance" `F.display` 24/700; group labels 12/700 uppercase `.06em` `C.textMuted`; the showing group gets a 2px `C.bar` outline and " · showing"; rows are buttons min-height 48 with SHORT labels (When you can join, 2026 limit, Pre-tax or Roth, Safe harbor, Employer match, Profit sharing, Yours to keep, Loans, Hardship, While you work, When you leave; ES: Cuándo puedes unirte, Límite 2026, Antes de impuestos o Roth, Safe harbor, Match del empleador, Profit sharing, Tuyo para quedártelo, Préstamos, Dificultad, Mientras trabajas, Cuando te vas) and `Pill` sm; pills shorten "Adds up to 4% of pay" to "Up to 4%" / "Hasta 4%". Bottom legend row: Yes, No, Fact, Ask HR pills (sm). Add the missing vesting row ("Yours to keep") to Employer money (#73).
5. Focus strip: `Panel` with a 2px `C.accent` border, chips per pick (selected = `C.bar` filled), "Next: …" coral button, "Change focus" link, × button 40px.
6. Phone (under 700px): card header wraps (question full width, pill and chevron below, video chip under them); keep the PHASE-22 compact plan bar.
7. `git add components/plansparency/PlanOverview.tsx components/plansparency/PlanGlance.tsx components/plansparency/AnswerBody.tsx components/plansparency/FocusStrip.tsx components/plansparency/video/WatchFirstRow.tsx lib/plan/overview.ts lib/i18n/index.ts` (only those changed) -> commit `feat(plan): clear cards, solid pills, one topic bar, short side panel` -> push.

## STEP 5: The same look on every other screen (boards "2. Participant site" other tabs, "1. Landing", "3. Advisor side")
Apply `Panel`, `Pill`, page background, headings (h1 `F.display` 40/700, lead 17px `C.tabShadeText`) and buttons (primary `C.accent`, dark `C.bar`, ghost white + 2px `C.bar`, min-height 48, radius 12, 16/700) to:
1. **Calculator** (`CalcPanel.tsx`): 2 columns (`flex-wrap`): left = "Start with you" panel (age, yearly pay, pay frequency as chips), "How much of your pay you save" panel (− / big % / + and a thin slider `accent-color: C.accent`, then a message: green "You get all of your employer's money: $X a year." or yellow "Save N% to get all of your employer's money. Right now you'd miss $X a year."), "Good to know about your plan" rows each with a `Pill`. Right = result panel (`strong`): label, total `F.display` 56/700 + "a year", stacked bar (you `C.bar`, employer `C.green`), rows from STEP 2.7, "Your part, each paycheck" box (`C.highlight`, amount `C.accentText`), "Your 2026 limit used" bar. Same math as now except STEP 2.7.
2. **401(k) terms** (`KeyTermsPanel.tsx`): category chips; list panel on the left (rows min-height 52, selected `C.highlight` + `C.accentText`); entry panel (`strong`) with category label, name `F.display` 36, the short line as an info `AnswerBand`, "What it means", "For example", dark button "How does my plan handle this? →".
3. **Videos** (`VideosPanel.tsx`): keep the PHASE-22 table of contents; sections become `Panel`s; "Watched"/"New" become `Pill` sm yes/info; contents meta never wraps. List only `availableVideos` (STEP 2 already drops tdf without funds).
4. **Team** (`TeamPanel.tsx`): cards as `Panel`; role chip = solid `ROLE[...].base` with white text and the role name; "Book a meeting" aligned to the card bottom.
5. **Welcome** (`WelcomeDialog.tsx`): white dialog radius 20; step label coral 12/700 uppercase; employer and recordkeeper as two bordered boxes; focus options as large toggle cards (selected = `C.bar` filled, ✓).
6. **Landing** (`Landing.tsx`): plan-code panel (`strong`) "Open your plan" first; no employee upload (advisor-only, Oct 4). Keep `PLAN_CODES_ENABLED` as is.
7. **Advisor** (`AdvisorShell.tsx`, `PlansTable.tsx`, `ReviewField.tsx`, advisor pages): page background, `Panel`s, `Pill`s for review values and team counts, unsure rows from STEP 1 stand out first.
8. `Investments` and `StatementDashboard`: page background + `Panel` only (no layout change).
9. `git add` each changed file from this list -> commit `feat(theme): clear look on calculator, terms, videos, team, welcome, landing and advisor` -> push.

## STEP 6: Check it like Ross would
1. Run every check script, `npx tsc --noEmit`, `npm run build`.
2. Search the code for leftovers and remove them: any `CARD_VIDEO`, any `employerMoneyAt(` without a source outside the calculator, any `!(planData?.noMatch` or `noMatch ?? true`, any pill styled inline instead of `Pill`, any "Yes, up to" in `overview.ts`. Report each file touched.
3. Report back: commit hashes, files changed, check counts (check-relevance PASS/FAIL), every new ES string, and anything that didn't fit the spec.
4. Commit `chore: remove leftovers from the old card, pill and match logic` only if something changed.

## STEP 7: Docs
1. This file: Status -> Done with the commit hashes and date.
2. `git add CLAUDE.md CONTEXT.md MEMORY.md ERRORS.md OPEN-ITEMS.md "PHASE PROMPTS/PHASE-23-relevance-facts-clarity.md" "PHASE PROMPTS/_TEMPLATE-step.md"` (only those changed) -> commit `docs: phase 23 and Cowork quality gates` -> push.

## Done when (Cowork checks first, CLAUDE.md Gate 4; then Ross)
- Vercel Ready for all 7 commits.
- Baer's: safe harbor card "No" with a link to the match, no slider, no video; match card slider shows match money only; calculator employer = $2,000 at 4%+.
- Conflict International: match card "No extra match" with a link to safe harbor, no slider or video; profit sharing card "Ask HR"; calculator has no "extra match" row.
- Tierra Sur: safe harbor card shows $2,000 (safe harbor only); match card "Ask HR"; match video never says $5,000; in-service "Ask HR".
- No plan shows the target date video unless it has a Target Date fund.
- Every screen: gray page, white panels, solid pills, one topic bar; same look as the "Current site" boards.

## Accessibility
- Video chip and card toggle are separate buttons (no button inside a button); both keyboard reachable with visible focus.
- Pills carry words, never color alone. Contrast: white on `C.green` and `C.textMuted`, `C.accentText` on white, all 4.5:1+ (`check-theme`).
- `aria-expanded` on card toggles, `aria-selected` on topic tabs, `aria-pressed` on chips and focus options.
- Phone (390px): no sideways scroll; card headers wrap.
- EN + ES for every new string; `lang` follows the toggle.
