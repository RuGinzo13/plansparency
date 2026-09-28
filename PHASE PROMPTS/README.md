# PHASE PROMPTS/

Phase prompt files for Claude Code. Written in Cowork, run in VS Code.

**How to run one:** open a *fresh* Claude Code conversation in VS Code (the Claude Code panel, not Copilot) and type:

    Read "PHASE PROMPTS/PHASE-NN-name.md" and execute STEP 1 only.

**After it runs:**
1. Check Vercel → project `plansparency` → Deployments: the newest deployment is **Ready** and shows the commit message from the prompt.
2. Check the live behavior the prompt's "Done when" section describes.
3. Tell Cowork. Cowork re-reads the repo, marks the prompt Done, and updates the .md files.

**Structure:** one file per phase (`PHASE-NN-name.md`), split into numbered STEPS. Each step = one commit.

**One-time setup for zero-click runs**
1. In VS Code: File → Open Folder → `plansparency-nextjs` (the repo itself, not the `Plansparency` folder above it).
2. In the Claude Code panel, set the permission mode to the one that accepts edits automatically (not Manual, not Auto). The repo's `.claude/settings.json` then pre-approves every command the phases use and blocks the dangerous ones.

**How to run any phase** (one fresh Claude Code conversation, no babysitting):

    Read "PHASE PROMPTS/PHASE-NN-name.md" and execute all steps in order.

- Every step ends with its own commit + push. The exact files to stage and the commit message are written in the step.
- Claude Code stops only if a check fails (ground check, type check, build, automated live check) and reports why.
- The last step commits any Cowork doc edits, so the repo is always clean when a phase ends.
- `🛑 CHECKPOINT` appears only before something that can't be undone (deleting production data, database schema change, rotating a live secret). Cowork will warn in chat before writing one.
- Ross's live checks happen once, at the end ("Ross checks" section).

**Rules:** run in number order; never edit a prompt mid-run (write a new one instead); Claude Code never changes files the prompt doesn't name.
