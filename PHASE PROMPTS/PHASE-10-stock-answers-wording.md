# Stock answers: wording (DRAFT, waiting for Ross's final approval)
**Created:** Oct 4, 2026 in Cowork. **Status:** DRAFT. Ross approves the final wording himself (open item #39). PHASE-10 builds it as written here; edits later only change this file and `lib/answers/stockAnswers.ts`.
**Interactive preview:** "Stock answers, button taps" board on the Landing Redesign canvas.

## Rules for every answer
- English only for now. In Spanish, the buttons keep going to the AI until Spanish wording is approved.
- `{braces}` = filled from planData. Text in "quotes from review" is shown exactly as the advisor approved it.
- **Any field marked REQUIRED that is `null`, empty, or not usable → the whole answer returns `null` and that tap goes to the AI.** Never show a blank, "undefined" or "unknown".
- `safeHarbor.type === 'qaca'` → answers 1, 2 and 7 return `null` (QACA vesting is different; the AI handles it).
- Definitions come from `lib/glossary.ts` through `getTerm(id, 'en')` so they match Key Terms and the calculator. Never retype them here.
- IRS numbers come from `IRS_LIMITS[getLimitYear()]`. Never type a dollar limit into an answer.
- Each paragraph = **bold lead** + plain rest. No dashes as punctuation.
- Footer, plans saved by an advisor (`/p`): "Plan details reviewed by {reviewerName} on {reviewedAt}. Education only, not advice."
- Footer, self-upload (`/`): "Based on the plan document you uploaded. Education only, not advice." The badge says "From your plan document", never "reviewed".

## 1. How does my employer match work?
REQUIRED: `safeHarbor.type`, and either `noMatch` or a non-empty `matchTiers`.
- Safe harbor match (`basic_match`, `enhanced_match`): **Your employer matches what you save, and it's guaranteed.** This is a safe harbor match: {tier text}.
- Safe harbor nonelective: **Your employer adds money for you even if you don't save anything.** It's guaranteed (safe harbor): {safeHarbor.formula}. Then, if `matchTiers` is also non-empty, add the discretionary match lines below.
- Discretionary match (no safe harbor, tiers present): **Your employer may match what you save.** This plan's match is {tier text}. It isn't guaranteed: your employer decides each year and can change it.
- No match (`noMatch === true`, no safe harbor): **This plan doesn't have an employer match right now.** What you save is still yours, and it still gets tax benefits.
- Example (when there's a match): **Example:** on a $50,000 salary, saving {pct needed for full match}% (${employee $} a year) adds ${employer $} a year from your employer. Compute with the calculator's own function in `lib/plan/calc.ts`, not new math.
- Safe harbor and `safeHarbor.vestingImmediate !== false`: **It's yours right away.** Safe harbor money is 100% yours from day one.
- Discretionary match: **It follows a vesting schedule.** Tap "When is the match mine to keep?" to see when it's fully yours.
- Discretionary match and `lastDayProvision === true`: **Be here at year end.** You may need to be working here on the last day of the plan year to get the match for that year.
- Match starts later (`matchEligibility.immediateMatch === false` and `matchEligibility.requirement` differs from `contribEligibility.requirement`): **The match starts later:** "{matchEligibility.requirement}". You can save before then. It just isn't matched yet.
- `profitSharing.available === true`: **There's also profit sharing.** It's a separate amount your employer may add each year, whether or not you save. Add "You may need to be working here on the last day of the plan year to get it." when `profitSharing.lastDayApplies === true`.
- Link under the answer: "See it with your pay in the calculator".

## 2. When is the match mine to keep?
REQUIRED: `safeHarbor.type`. Also REQUIRED: `vestingSchedule` when there is a discretionary match or profit sharing.
- Always first: **Your own savings are always 100% yours.**
- Safe harbor: **Your safe harbor money is 100% yours right away.**
- Discretionary match and/or profit sharing: **{Your match / Your profit sharing money / Your match and profit sharing} vesting schedule:** "{vestingSchedule}". Then the glossary `vestingSchedule` definition as a second paragraph led by **What that means:**.
- No employer money at all: **There's no employer money in this plan right now,** so there's nothing to wait for.
- When a schedule applies: **If you leave early,** you keep your own savings plus whatever part is already yours. The rest goes back to the plan.

## 3. When can I start saving?
REQUIRED: `contribEligibility.requirement` (or `contribEligibility` showing immediate eligibility).
- **When you can start saving:** "{contribEligibility.requirement}".
- `contribEligibility.autoEnroll === true`: **You may be signed up automatically** at {autoEnrollPct}% of your pay. You can change that amount or stop it.
- No match: **There's no match to wait for.** Same timing: **The match starts at the same time.** Different: **The match starts later:** "{matchEligibility.requirement}". Saving before then still counts for you. It just isn't matched yet.
- `contribEligibility.entryDates` present: **Entry dates:** "{entryDates}". Otherwise: **Your exact start date** can depend on set entry dates, like the first of the next month. HR or your plan's website can confirm it.

## 4. Roth or Traditional: what's the difference?
REQUIRED: `hasPreTax` and (`hasRoth` ?? `rothAvailable`).
- **Traditional (before-tax):** glossary `traditional`.
- **Roth (after-tax):** glossary `roth`.
- Both: **Your plan offers both.** You can pick one or split your savings between them. Traditional only: **Your plan offers Traditional only right now.** Roth only: **Your plan offers Roth only right now.**
- **Which one fits depends on your taxes now and later.** A tax professional can help you think it through.

## 5. Can I borrow from my 401(k)?
REQUIRED: `loanAvailable`.
- Yes: **Yes, your plan allows loans.** / **How much:** generally up to half of what's yours in the account, with a $50,000 maximum. / **Paying it back:** you repay yourself, with interest, through your paycheck. Usually within 5 years, or longer if the loan is for buying your main home. / **If you leave your job,** any unpaid amount may need to be repaid soon. If it isn't, it's taxed like a withdrawal. / **Fees and the exact terms** are on your plan's website{, recordkeeperName if present}.
- No: **Your plan doesn't offer loans right now.** Add, if `hardshipAvailable === true`: It does allow hardship withdrawals, which have different rules. Tap "Can I take money out for a hardship?" to learn more.

## 6. Can I take money out for a hardship?
REQUIRED: `hardshipAvailable`.
- Yes: **Yes, your plan allows hardship withdrawals.** / **They're for serious, urgent money needs.** IRS examples include medical bills, stopping an eviction or foreclosure, buying your main home, college costs, funeral costs, and some home repairs. / **You don't pay it back.** That also means the money leaves your retirement savings for good. / **Taxes:** it counts as income. If you're under 59½, there's usually an extra 10% tax too. / **To request one,** go to your plan's website. They'll tell you what proof they need.
- No: **Your plan doesn't offer hardship withdrawals right now.** Add, if `loanAvailable === true`: It does allow loans. Tap "Can I borrow from my 401(k)?" to learn more.

## 7. What happens to my 401(k) if I leave my job?
REQUIRED: same as answer 2.
- **Your own savings go with you, always.** / Safe harbor: **So does your safe harbor money.** It's 100% yours. / Discretionary match or profit sharing: **{that money}:** you keep the part that's already yours. Tap "When is the match mine to keep?" for the schedule.
- **Your main options:** leave it in this plan, move it to your new job's plan, move it to an IRA, or cash it out.
- **Moving it directly** (a "direct rollover") keeps it tax-free. Cashing out is taxed as income, and if you're under 59½ there's usually an extra 10% tax.
- **Small balances** (under $7,000) may be moved out of the plan for you if you don't choose.
- `loanAvailable === true`: **Have a loan?** Any unpaid amount may need to be repaid soon after you leave.
- **Each option has trade-offs.** Your plan's website can walk you through the steps.

## 8. How much can I save in {year}?
REQUIRED: `planAllowsCatchUp`.
- **In {year} you can save up to {deferral}** of your own pay. Then the glossary `irsLimit` definition is NOT repeated; just add **Employer money doesn't count** toward your {deferral}.
- Catch-up allowed: **Age 50 or older?** glossary `catchUp`. Then **Roth catch-up rule:** glossary `rothCatchUpRule`. If the plan has no Roth, replace that with: **Roth catch-up rule:** if you earned more than {rothThreshold} here last year, catch-up money for you must go in as Roth, and this plan doesn't offer Roth, so you can't make catch-up contributions here right now.
- Catch-up not allowed: **Your plan doesn't offer catch-up contributions,** so {deferral} is the limit at every age.
- Link under the answer: "Open the calculator".

## Ross: check before final approval
1. Every glossary definition these answers reuse (traditional, roth, vestingSchedule, catchUp, rothCatchUpRule). Changing one changes it everywhere in the app.
2. #7 "Small balances (under $7,000)": only true if the plan adopted that rule.
3. #4 Roth "59½ and 5 years": simplified.
4. #8 $150,000 Roth catch-up wording vs final IRS guidance.
5. #5/#6 are general IRS rules because review only stores yes/no for loans and hardship.
6. #7 stays "here are your options", never which one to pick.
