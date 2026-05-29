# Plansparency — Project Execution Plan
*Ross Ginsberg · Last updated: May 28, 2026*
*This is the operational document. It tells you what to do next, in order, with no strategy fluff.*
*For context and rationale, see CONTEXT.md. For decisions, see MEMORY.md.*

---

## How to Use This Document
Work through phases in order. Do not start Phase 2 until Phase 1's blockers are cleared.
Each task has: what to do, how to do it, cost, and done-when criteria.
Update the checkboxes as you complete items.

---

## PHASE 0 — Compliance & Legal (Weeks 1–4)
**Gate: Nothing else moves until items 1 and 2 are done.**

### Step 1 — Employment Agreement Review
- [ ] Pull your employment agreement today
- [ ] Search for: "work made for hire," "inventions assignment," "outside activities," "competing activities," "intellectual property created during employment"
- [ ] If any clause is unclear → retain an employment attorney for 1 hour review
- **Cost**: $0 (self-review) or $300–$500 (attorney)
- **Done when**: You have a definitive answer on whether Plansparency IP is yours or the firm's

### Step 2 — Compliance OBA Disclosure
- [ ] Write a one-page description of Plansparency (see template below)
- [ ] Submit to compliance department as an Outside Business Activity disclosure
- [ ] Get written approval before any other step
- **Cost**: $0
- **Done when**: Written approval in hand
- **OBA Description Template**:
  > *"I am developing an educational technology tool called Plansparency. The tool allows 401(k) plan participants to upload their plan's enrollment booklet and ask plain-English questions about their plan's rules — such as how the match formula works, vesting schedules, and contribution limits. The tool provides educational information only and never provides investment advice, financial advice, or account management services. It does not interact with any recordkeeper systems, does not access any account data, and does not touch any client plan. It has no affiliation with [Firm Name] and will be separately branded. I am building it independently, on my own time, using my own resources."*

### Step 3 — ERISA Attorney Review
*(Start after compliance approval)*
- [ ] Book 1-hour ERISA attorney consultation
- [ ] Prepare materials: live demo on laptop, printed system prompt (CRITICAL GUARDRAILS section), current disclaimer language, 1-page product description, 3–5 sample Q&A outputs, Anthropic API terms PDF
- [ ] Ask: Does this output constitute "investment advice" under ERISA Section 3(21)?
- [ ] Ask: Is current disclaimer language sufficient?
- [ ] Ask: Does the recordkeeper redirect create any ERISA exposure?
- [ ] Ask: When we move to Version B (paid advisor tool), does that change the fiduciary analysis?
- [ ] Ask: Any recent DOL guidance on AI-generated retirement plan education?
- **Cost**: $500–$800
- **Done when**: Written confirmation that education-only positioning is defensible
- **Future session**: Say "build the ERISA attorney deck" to get a formatted prep brief and slides

### Step 4 — Privacy Policy
*(Can run parallel to ERISA attorney)*
- [ ] Go to termly.io → Create Policy → Privacy Policy
- [ ] Use the 7 section prompts in Session-Log-2026-05-01.md (all have copy buttons)
- [ ] Key sections: Business Description, Data Collected, Third-Party Services (name Anthropic PBC), Cookies, File Uploads, Children's Privacy, Custom Education-Only Disclaimer
- [ ] Publish at plansparency.com/privacy (after domain registration)
- **Cost**: $0 (free tier) or $99 (paid tier)
- **Done when**: Policy live at /privacy URL, linked in footer and privacy consent gate

### Step 5 — Register Domains
*(Only after compliance written approval)*
- [ ] Go to namecheap.com
- [ ] Register plansparency.com (~$15/yr)
- [ ] Register plansparency.ai (~$15/yr)
- **Cost**: ~$30 total
- **Done when**: Both domains registered, pointed at Vercel (Step 8)

### Step 6 — LLC Formation
*(Can wait — not required at launch, but do before first paying customer)*
- [ ] Use your state's online business registration portal
- [ ] File as a single-member LLC
- **Cost**: $150–$500 depending on state
- **Done when**: LLC certificate received

---

## PHASE 1 — Version A Build (Weeks 5–9)
**Gate: Steps 1, 2, 3 above must be complete. Domain registered.**

### Step 7 — Install VSCode + Claude Code
- [ ] Download VSCode free from code.visualstudio.com
- [ ] Open Terminal, run: `npm install -g @anthropic-ai/claude-code`
- [ ] Sign in with your Anthropic account
- **Cost**: $0 (included in Claude Max $20/mo)
- **Time**: 10 minutes
- **Done when**: Claude Code responds to commands in VSCode terminal

### Step 8 — Convert App to Next.js + Secure API Route
- [ ] Open plansparency-mvp.jsx in VSCode
- [ ] Tell Claude Code exactly this:
  > *"Convert this React app to Next.js. Add a serverless API route at /api/chat that proxies all Anthropic API calls so the API key is never in the browser. Use process.env.ANTHROPIC_API_KEY. Add IP rate limiting — max 10 requests per hour per IP using Vercel KV."*
- [ ] Watch it work. Ask it to fix anything that looks wrong.
- **Cost**: $0
- **Time**: ~10–30 minutes
- **Done when**: App runs locally at localhost:3000 without errors

### Step 9 — Update PLANDATA to Extract EIN + Plan Number
- [ ] Tell Claude Code:
  > *"Update the PLANDATA extraction in the system prompt to also extract EIN (Employer Identification Number) and Plan Number from the uploaded plan document. Add them to the PLANDATA JSON block alongside existing fields."*
- **Time**: 15 minutes
- **Done when**: Test SPD upload shows EIN and Plan Number in extracted data

### Step 10 — Server-Side PDF Text Extraction
*(Do this before any public traffic — permanent 45% cost reduction)*
- [ ] Tell Claude Code:
  > *"When a PDF is uploaded, extract the text server-side using pdf-parse before sending to Anthropic. Store the extracted text in the Vercel edge session. For all follow-up questions, send the extracted text instead of the base64 PDF."*
- **Time**: ~2 hours
- **Done when**: Follow-up questions cost ~$0.04 instead of ~$0.08 per call (verify in Anthropic usage dashboard)

### Step 11 — Push to GitHub + Deploy to Vercel
- [ ] Create free account at github.com
- [ ] Tell Claude Code: *"Create a GitHub repository called 'plansparency' and push this project to it."*
- [ ] Go to vercel.com → Create free account → New Project → Select your GitHub repo → Deploy
- [ ] In Vercel: Settings → Environment Variables → Add `ANTHROPIC_API_KEY` → paste your key → Save → Redeploy
- **Cost**: $0
- **Time**: ~20 minutes
- **Done when**: App is live at [your-project].vercel.app with no console errors

### Step 12 — Connect Domain
- [ ] In Vercel: Settings → Domains → Add → type plansparency.com
- [ ] Vercel gives you two DNS values — paste them into Namecheap DNS settings
- **Time**: 10 minutes setup, up to 1 hour for DNS propagation
- **Done when**: plansparency.com loads your app

### Step 13 — Add Analytics
- [ ] Create free account at posthog.com
- [ ] Tell Claude Code:
  > *"Add PostHog analytics with project key [paste your key]. Track these events: session_started (on PDF upload), question_asked (on each follow-up), topic_clicked (on topic cards), language_switched, session_ended (on tab close / 30 min inactivity). Include plan_id as a property on all events."*
- **Cost**: $0 (free tier: 1M events/mo)
- **Done when**: PostHog dashboard shows events firing during test sessions

### Step 14 — Test All 3 SPDs in Production
- [ ] Upload Principal/Baer's Rug SPD — verify PLANDATA extraction, EIN, calculator, match formula
- [ ] Upload Transamerica/Conflict International SPD — verify same
- [ ] Upload EQ/Tierra Sur SPD (EIN: 20-3525109, PN: 001) — verify same
- [ ] Test both English and Spanish modes
- [ ] Test rate limiting: try 11 requests from same IP in one hour
- [ ] Test privacy consent gate
- [ ] Test recordkeeper redirect for account management questions
- **Done when**: All 3 SPDs work correctly, bilingual toggle works, limits enforce

---

## PHASE 2 — Private Advisor Pilot (Weeks 10–14)
**Gate: Version A is live and tested. ERISA attorney review complete.**

### Step 15 — Recruit Pilot Advisors
- [ ] Ask trusted partners to identify 2–3 advisors (zero connection to your firm or 45 managed plans)
- [ ] Contact each with this message:
  > *"I built something I want you to try with one of your plans — 30-day free access, no commitment, completely free. It reads 401(k) plan documents and answers participant questions in plain English. Takes 5 minutes to test. Can I send you a link?"*
- **Done when**: 2–3 advisors confirm they'll participate

### Step 16 — Set Up Pilot Plans
- [ ] Pilot advisors upload one of their own plans (not firm-related plans)
- [ ] Use public test SPD link (share plansparency.com URL)
- [ ] Ask each advisor to test it in at least one real enrollment meeting or participant conversation
- **Done when**: Each pilot advisor has run at least 5 real participant sessions

### Step 17 — Collect Structured Feedback
For each pilot advisor, document:
- [ ] What worked well
- [ ] What was confusing or incorrect
- [ ] What participants asked that the tool couldn't answer
- [ ] What features would make them pay $99–$249/month
- [ ] Direct quotes for social proof content (get written permission to use)
- **Done when**: Feedback documented for all pilot advisors

---

## PHASE 3 — Version A Public Launch (Week 15+)

### Step 18 — LinkedIn Launch Post
- [ ] Write post: "I just uploaded a real 401(k) plan document to a tool I built. Here's what happened in 5 minutes." Include screenshot of PLANDATA output and calculator.
- [ ] Tag: #401k #retirementplanning #financialwellness #planadviser
- [ ] Target: plan advisors, HR directors, benefits managers

### Step 19 — Product Hunt Submission
- [ ] Create account at producthunt.com
- [ ] Submit Plansparency as a new product
- [ ] Tagline: *"Your 401(k) plan document, finally in plain English"*
- **Done when**: Submission live, share in LinkedIn post same day

### Step 20 — Reddit Posts
- [ ] Post in r/personalfinance: *"Built a tool that reads 401k plan documents and answers your questions — free to try"*
- [ ] Post in r/humanresources: frame as a resource for HR teams fielding participant questions
- [ ] Post in r/financialindependence: frame as educational tool for understanding your plan

### Step 21 — Advisor Waitlist Form
- [ ] Create free account at carrd.co ($0)
- [ ] Set up a simple one-field form: email address + "I want Plansparency for my clients"
- [ ] Link it from LinkedIn bio and plansparency.com homepage
- **Target**: 50 advisor emails before Version B launch

---

## PHASE 4 — Version B Build (Months 4–7)
**Gate: 90 days of Version A data. At least 10 advisor waitlist signups. Pilot feedback documented.**

### Build Order (via Claude Code — each item is one conversation)
- ✅ **Done**: Supabase database setup — `plans` + `plan_sessions` tables, `plan-documents` storage bucket, env vars in Vercel. Schema at `supabase/schema.sql`. (May 28, 2026)
- ✅ **Done**: Advisor upload page — `/advisor` with drag-drop PDF, plan list, copy/preview shareable links. (May 28, 2026)
- ✅ **Done**: Shareable participant links — `/p/[plan_id]` server component loads pre-analyzed plan from Supabase. (May 28, 2026)
- ✅ **Done**: Auth gates wired (Clerk conditional) — `/advisor` layout + `/api/save-plan` route. Activates automatically when Clerk keys are added to Vercel. (May 28, 2026)
- [ ] **Next**: Add Clerk publishable key + secret key to Vercel env vars to activate live auth on advisor surface
- [ ] **Day 1**: EIN+PN AOR lock — "On plan upload, check Supabase `plans` for existing `ein` + `plan_number` combo. If found by different advisor_token, show conflict message. If not found, allow."
- [ ] **Day 1**: Stripe subscription billing — "Add Stripe subscriptions: Starter $99/mo, Pro $249/mo, Enterprise $499/mo. Redirect to advisor dashboard after payment."
- [ ] **Day 1**: Stripe metered overage — "Add Stripe metered usage. Track sessions per advisor per month. Bill $0.30/session above 750 for Pro tier."
- [ ] **Day 1**: AI Accuracy Flag — "Add a 'Flag this answer' button. On click, log: advisor_id, plan_id, question, AI response, advisor correction. Store in Supabase feedback table."
- [ ] **Day 1**: Canny.io voting board embed — paste embed code into advisor dashboard settings page (30 min)
- [ ] **Month 2**: Advisor analytics dashboard — sessions per plan, questions asked, topics viewed
- [ ] **Month 2**: White-label branding — advisor logo upload + firm name, applied to participant view at `/p/[plan_id]`
- [ ] **Month 2**: DOL EFAST2 verification — "On plan upload, call https://efts.dol.gov/LATEST/search-index with extracted EIN. Show 'Plan Verified ✓' if found."
- [ ] **Month 3**: Dispute process — challenger form, plan sponsor tiebreaker email, 72-hour hold
- [ ] **Month 3**: QR code generator for enrollment kits

---

## PHASE 5 — Version B Launch (Month 8)

### Pre-Launch Checklist
- [ ] DPA (Data Processing Agreement) drafted by attorney ($500) — have it ready
- [ ] All 4 AOR layers functional
- [ ] Session limits and overage billing tested end-to-end
- [ ] Feedback portal live (all 4 Day 1 components)
- [ ] Advisor onboarding flow is fully self-serve (no manual steps)
- [ ] Pricing page live with Stripe checkout

### Launch Actions
- [ ] Email advisor waitlist: "Plansparency for Advisors is now available"
- [ ] LinkedIn announcement post with pilot advisor quote (with permission)
- [ ] Offer founding rate: first 20 advisors get 3 months at 50% off (converts to full rate month 4)
- [ ] **Target**: 10 paying advisors within 30 days of Version B launch

---

## PHASE 6 — LinkedIn Automation Setup (Version B, Month 1)

### Setup Steps
- [ ] Create Vercel cron function that calls Claude API with rotating theme prompt (Claude Code builds this — "Build a Vercel cron function that runs every Monday at 8am, calls the Claude API with this prompt template, and outputs a LinkedIn post to a Supabase table: [paste master prompt from Session-Log-2026-05-01.md]")
- [ ] Create free Make.com account
- [ ] Build scenario: Monday cron trigger → fetch post from Supabase → send to Buffer
- [ ] Create Buffer account → connect LinkedIn
- [ ] Test full flow end-to-end
- **Cost**: ~$0–$6/mo
- **Done when**: Post appears in Buffer queue every Monday without manual action

---

## PHASE 7 — Scale (Months 10–18)
*Do not start until 25+ paying advisors and AOR system fully operational.*

### HR Direct Sales
- [ ] Identify 5–10 mid-market companies (100–500 employees) with no active advisor relationship
- [ ] Pitch HR Director: $4/employee/mo, billed annually
- [ ] DPA ready to send within 48 hours of request
- [ ] AOR domain check confirms no advisor lock before accepting HR Direct purchase

### Recordkeeper Conversations
- [ ] Target: Ascensus, John Hancock, or Nationwide (avoid Fidelity, Vanguard — 18–24 month sales cycles)
- [ ] Pitch: white-label license, advisor-branded upgrade path must be preserved
- [ ] SOC 2 Type 1 required for this stage (~$15,000–$30,000)

---

## Open Questions Requiring Decisions
*(These cannot be resolved without more information)*

1. **Overage billing opt-in vs. automatic?** Automatic is cleaner operationally. Opt-in is more advisor-friendly. Decide before Version B builds Stripe metered billing.
2. **Anthropic API commercial resale terms.** Confirm metered resale of API usage is permitted. Do this before overage billing goes live.
3. **Participant count ceiling for Pro tier.** Does a Pro advisor with 50 plans and 200+ employees each need Enterprise? Define the ceiling before large advisors onboard.
4. **Compliance OBA form.** Does your firm have a specific form, or is a written description sufficient?
5. **LinkedIn automation — approve before post, or fully automated?** Buffer free tier allows manual approval queue. Taplio allows full automation. Decide based on how much you trust the generated content after 4–6 weeks.

---

## Key Numbers to Memorize
| Metric | Value |
|--------|-------|
| Typical session cost (unoptimized) | ~$0.195 |
| Typical session cost (with PDF extraction) | ~$0.105 |
| Pro tier margin at 375 sessions/mo | ~70% |
| API cost break-even on Pro ($249) | ~1,245 sessions/mo |
| Open enrollment usage spike | 3–5x normal |
| Competitive window | ~18 months |
| Full-time MRR trigger | ~$8K–$12K/mo |
| Version A launch cost (total) | ~$600–$1,000 |
| Version B added monthly cost | ~$0–$50/mo |

---

*This is a working document. Update phase checkboxes as tasks are completed.*
*For strategy questions, see CONTEXT.md. For decision history, see MEMORY.md.*
