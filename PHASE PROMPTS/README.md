# PHASE PROMPTS/

Phase prompt files for Claude Code. Written in Cowork, run in VS Code.

**How to run one:** open a *fresh* Claude Code conversation in VS Code (the Claude Code panel, not Copilot) and type:

    Read "PHASE PROMPTS/PHASE-NN-name.md" and execute STEP 1 only.

**After it runs:**
1. Check Vercel → project `plansparency` → Deployments: the newest deployment is **Ready** and shows the commit message from the prompt.
2. Check the live behavior the prompt's "Done when" section describes.
3. Tell Cowork. Cowork re-reads the repo, marks the prompt Done, and updates the .md files.

**Structure:** one file per phase (`PHASE-NN-name.md`), split into numbered STEPS. **One step per fresh conversation.**

**Rules:** run in number order; never edit a prompt mid-run (write a new one instead); Claude Code never changes files the prompt doesn't name.
