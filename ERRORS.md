# Plansparency — ERRORS.md
*Log of approaches that failed. Check this before suggesting approaches to similar tasks.*
*Per CLAUDE.md Rule 9: when an approach takes more than 2 attempts, log it here.*

---

## API Cost Estimation — Session 2 (May 1, 2026)
**What didn't work:** Estimating API costs as "avg 50 sessions/mo across 100 advisors" — understated real costs by 10–20x.
**What worked:** Modeling per-advisor: (plans managed) × (avg employees per plan) × (monthly adoption rate %) = sessions per advisor per month.
**Note for next time:** Always model API costs per-advisor. Open enrollment (Oct–Dec) spikes usage 3–5x. Large advisor profiles can exceed Pro tier revenue — always run the margin check.

---

## Document Script Syntax Errors — Session 1 (April 30, 2026)
**What didn't work:** Appending new section content after the document's closing brackets — caused syntax errors.
**What worked:** Python to locate exact closing line of children array, split there, insert before closing brackets, rewrite file.
**Note for next time:** When adding sections to the docx script, always insert before `]\n  }]\n});`. Use targeted insertion, not append.

---

## PDF Upload — Vercel Blob Silent Hang — May 3–5, 2026 (4+ failed attempts)
**What didn't work:**
- Guessing at fixes without reading actual deployed code first
- Vercel Blob client upload: BLOB_READ_WRITE_TOKEN never set in Vercel env — call hung indefinitely
- Edge Runtime without streaming: Vercel Hobby Edge hard timeout 25s; Anthropic takes 30–60s on large PDFs
- Client-side 90s timeout: server-side Edge timeout fired first, making client timeout irrelevant
- Providing fix prompts that assumed prior fixes were applied without verifying actual deployed file contents

**What worked:**
- Prompting Claude Code to read every file first, answer specific diagnostic questions, then fix only what it actually found
- Removing @vercel/blob entirely
- SSE streaming: stream: true to Anthropic, pipe text_delta chunks to ReadableStream, client reads with reader loop

**Note for next time:**
- ALWAYS read actual deployed files before suggesting any fix. Never assume a prior fix was applied correctly.
- Vercel Hobby + Edge Runtime = 25s hard timeout. Streaming is mandatory for Anthropic calls on real documents.
- BLOB_READ_WRITE_TOKEN is NOT auto-created when a Blob store is created.
- Silent hang with no error = almost always a missing env var or missing error handling.
- Diagnostic prompt that worked: "Read every file. Answer these specific questions from what you see. Then fix only what you actually found."

---

## File Size Error — Recurring Bug (May 2026)
**What didn't work:** Fix applied to running artifact but not saved back to project file or GitHub. Same error reappeared in next session because the fix lived only in the artifact, which was then discarded.
**What worked:** Targeting the fix to `components/PlansparencyApp.tsx` in the GitHub repo via Claude Code. Fix persists because it's in version control.
**Note for next time:** NEVER fix bugs in the Claude.ai artifact environment. The artifact is retired. All fixes go through Claude Code → GitHub. Any fix made in an artifact that isn't committed to GitHub will disappear.

---

## Wrong File Targeted for Claude Code Prompts — May 20, 2026
**What didn't work:** Writing Claude Code prompts targeting `plansparency-mvp__1_.jsx` — that file is the old artifact prototype, retired after Next.js migration in May 2026. Running prompts against it would have no effect on the live app.
**What worked:** Checking `recent_chats` to discover the Next.js migration had already happened. Confirmed correct file: `components/PlansparencyApp.tsx`. All prompts corrected before any code was run.
**Note for next time:** Always confirm the actual file structure with Claude Code (`ls app/ components/`) before writing any prompts. The Claude.ai project files may be stale. The GitHub repo is the source of truth.

---

## Session Summary, May 20, 2026
**No new multi-attempt failures this session.** Two near-misses caught before execution:
1. Prompts targeting wrong file (JSX artifact vs. PlansparencyApp.tsx) — caught by checking recent_chats
2. Instructing user to "find the current working artifact" — caught when recent_chats revealed Next.js migration was complete
Both corrected before any code was run.
