# PHASE-14 content: General 401(k) key terms (DRAFT wording, Ross reviewing, open item #48)
Source: Landing Redesign canvas, board "General 401(k) key terms, web (mix)", Oct 4, 2026. Claude Code copies this text exactly into `lib/glossary.ts` and writes the Spanish alongside (list every Spanish string in the report for native review).
Placeholders in `{braces}` are filled by `fillPlaceholders` from `lib/plan/irs-limits.ts`, so the numbers update each year. New placeholders: `{limit50}` = deferral + catchUp50, `{limit6063}` = deferral + catchUp6063.
**"keep existing def"** = the definition is also used by the calculator or the written answers; don't change it (one source, #24).

## Layout (order matters: list order, previous/next order)
| Section | Sub-heading | Child (indented) | id | Term (EN) |
|---|---|---|---|---|
| Get started | | | `401k` | 401(k) |
| Get started | | | `eligibility` | Eligibility |
| Get started | | | `contribution` | Contribution |
| Get started | | ✓ | `annualLimits` (new) | Annual limits ({year}) |
| Get started | | ✓ | `traditional` | Traditional (pre-tax) |
| Get started | | ✓ | `roth` | Roth (after-tax) |
| Get started | | ✓ | `catchUp` | Catch-up |
| Get started | | ✓ | `autoEnroll` (new) | Auto-enrollment |
| Get started | | | `beneficiary` (new) | Beneficiary |
| Employer money | | | `employerMatch` | Employer match |
| Employer money | | | `safeHarbor` | Safe harbor |
| Employer money | | | `profitSharing` | Profit sharing |
| Employer money | | | `vesting` | Vesting |
| Employer money | | | `vestingSchedule` | Vesting schedule |
| Employer money | | | `trueUp` | True-up |
| Access your money | While you work | | `loan` | Plan loan |
| Access your money | While you work | | `hardship` | Hardship withdrawal |
| Access your money | While you work | | `inService` (new) | In-service withdrawal |
| Access your money | When you leave | | `rollover` | Rollover |
| Access your money | When you leave | | `standardWithdrawal` (new) | Standard withdrawal |
| Investments | | | `targetDate` (new) | Target-date fund |
| Investments | | | `fees` (new) | Fees (expense ratio) |
Section names ES: Para empezar, Dinero del empleador, Acceso a tu dinero (Mientras trabajas, Cuando te vas), Inversiones.
Glossary entries NOT in the layout stay in `lib/glossary.ts` unchanged (calculator and answers use them): `discretionaryMatch`, `irsLimit`, `rothCatchUpRule`, `payLimit`, `totalLimit`, `hce`, `rmd`.

## Entries
`ask` = what "How does my plan handle this?" opens: a stock answer id, or `calculator` (link text "Try it in the calculator").

**401k** · short: "A retirement account you save into from your paycheck." · def: "A retirement savings account offered through your job. Money comes out of your paycheck automatically, before you ever see it. Depending on the plan, it can go in before-tax (Traditional), after-tax (Roth), or both." · rel: contribution, eligibility, employerMatch

**eligibility** · short: "When you can start saving, and when employer money starts." · def: "The rules for when you can join the plan and when employer money starts. Some plans let you start on day one. Others make new employees wait, for example until they have worked there a few months or a year, or until they turn 21." · rel: autoEnroll, employerMatch · ask: elig

**contribution** · short: "The money you put in from each paycheck." · def: "The money you put in from your paycheck. You pick a percent or a dollar amount, and most plans let you change it any time. It can go in as Traditional, Roth, or both, up to the yearly limits." · example: "Save 6% of a $2,000 paycheck and $120 goes into your account." · rel: annualLimits, traditional, roth · ask: calculator

**annualLimits** · short: "The most you can save from your pay in {year}." · def: "The IRS caps how much you can put in from your paychecks each year, across every job you have that year. Money your employer adds doesn't count toward it. The limits usually go up each year. These are for {year}, based on your age on December 31." · rows: "Under 50" = {deferral} · "50 to 59, or 64 and older" = {limit50}, note "{deferral} + {catchUp50} catch-up" · "60 to 63" = {limit6063}, note "{deferral} + {catchUp6063} super catch-up" · rel: catchUp, contribution · ask: limit

**traditional** · short: "Save before taxes. Pay taxes later." · def: keep existing · example: "Save $100 before tax and your take-home pay drops by less than $100, because you pay less tax today." · rel: roth · ask: roth

**roth** · short: "Pay taxes now. Take it out tax-free later." · def: keep existing · example: "Save $100 after tax. Years later, that money and what it earned can come out tax-free if you follow the rules." · rel: traditional, catchUp · ask: roth

**catchUp** · short: "Extra savings once you're 50 or older." · def: keep existing · rows: "Age 50+ catch-up" = "+{catchUp50}", note "For anyone 50 or older." · "Super catch-up, ages 60 to 63" = "+{catchUp6063}", note "Replaces the {catchUp50} for those four years." · "Roth catch-up rule" = "Over {rothThreshold}", note "Earned more than this from your employer last year (W-2 Box 3)? Your catch-up money must go in as Roth." · rel: annualLimits, roth (Rows only when `rothCatchUpWageThreshold` is not null for the year; skip the third row otherwise.)

**autoEnroll** · short: "Your job signs you up automatically. You can change or stop it." · def: "Some plans sign new employees up automatically, saving a set percent of each paycheck. You can pick a different amount or opt out. Many plans also raise the amount a little each year unless you say no." · example: "Signed up at 3%? You can change it to 6%, or stop saving, on the plan's website." · rel: contribution, eligibility

**beneficiary** · short: "Who gets your account if you die." · def: "The person or people you name to receive your 401(k) if you die. You choose them on your plan's website and can change them any time. If you're married, your spouse is usually the beneficiary unless they sign a form agreeing to someone else." · rel: 401k

**employerMatch** · short: "Money your employer adds when you save. Not required by law." · def: "Money your employer adds based on what you save. The law doesn't require it: your employer chooses whether to offer it, how much, and can change or stop it. Some plans also ask you to work a full year, or be employed on the last day of the year, to get it." · example: "Earn $50,000 with a 50% match on the first 6%. Save 6% ($3,000) and your employer adds $1,500." · rel: safeHarbor, vesting, trueUp · ask: match

**safeHarbor** · short: "Required employer money that's usually yours right away." · def: "Money your employer must put in every year when the plan follows safe harbor rules, as long as you're eligible. It's usually 100% yours right away. It comes either as a match on what you save, or as a set percent of your pay (usually 3%) that goes in even if you don't save." · rel: employerMatch, vesting

**profitSharing** · short: "A yearly amount your employer may add, if it chooses." · def: "An extra amount your employer may add, often based on how the company did. The employer decides each year whether to give it and how much, so it isn't guaranteed. You don't have to save anything yourself to get it." · rel: vestingSchedule, employerMatch

**vesting** · short: "How long until employer money is fully yours." · def: "Earning full ownership of your employer's money over time. Your own savings are always 100% yours. Employer money may have a waiting period, and if you leave before it's over, you can lose part of it." · rel: vestingSchedule, safeHarbor · ask: vesting

**vestingSchedule** · short: "The timeline for owning employer money." · def: keep existing · visual: the 6-year graded chart (see the prompt) · rel: vesting, profitSharing · ask: vesting

**trueUp** · short: "A year-end top-up of match you missed." · def: keep existing · rel: employerMatch, annualLimits

**loan** · short: "Borrow from your 401(k) and pay yourself back." · def: "Borrowing from your own 401(k). You pay yourself back with interest, usually from your paycheck. Most plans let you borrow up to half of what's yours, up to $50,000. If you leave your job, what you still owe may come due soon." · example: "$20,000 is yours in the account. You could borrow up to $10,000." · rel: hardship, inService · ask: loans

**hardship** · short: "Take money out early for a serious emergency." · def: "Taking money out while you still work there, for a serious money emergency like medical bills or stopping an eviction. It's taxed as income, and if you're under 59½ there's usually an extra 10% tax. You don't pay it back." · rel: loan, inService · ask: hardship

**inService** · short: "Taking money out while you still work there, no hardship needed." · def: "Some plans let you take money out while you're still working, once you reach a certain age (often 59½) or from certain money, like money you rolled in from an old plan. It's taxed as income, and under 59½ there's usually an extra 10% tax. Not every plan allows it." · rel: hardship, standardWithdrawal

**rollover** · short: "Move your 401(k) to another account without tax." · def: "Moving money from one retirement account to another, like from an old job's 401(k) to an IRA or your new job's plan, without paying taxes. Done directly (a \"direct rollover\"), it avoids a tax hit." · rel: standardWithdrawal · ask: leave

**standardWithdrawal** · short: "Taking money out after you leave your job or retire." · def: "Once you leave your job or retire, you can take money out of your 401(k). Traditional money is taxed as income when it comes out. Under 59½ there's usually an extra 10% tax, unless you left your job in or after the year you turned 55. In your 70s, the IRS requires you to start taking out a minimum amount each year." · rel: rollover, inService · ask: leave

**targetDate** · short: "One fund that adjusts itself as you near retirement." · def: "A single fund built around the year you plan to retire, like a 2060 fund. It holds a mix of stocks and bonds and slowly shifts to less risky investments as that year gets closer." · example: "Planning to retire around 2060? A 2060 fund is built for that timeline." · rel: fees

**fees** · short: "What a fund charges each year, as a percent of your money." · def: "Every fund charges a yearly fee, called the expense ratio. It comes out of the fund's returns, so you never see a bill. Plans can also charge account or service fees. Lower fees leave more of your money growing." · example: "A 0.50% expense ratio costs $50 a year on $10,000." · rel: targetDate
