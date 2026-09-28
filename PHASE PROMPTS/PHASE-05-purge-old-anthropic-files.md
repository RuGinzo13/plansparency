# PHASE 05 — One-time cleanup: delete old uploaded PDFs from Anthropic
**Created:** Sept 28, 2026 in Cowork
**Run:** after PHASE-04. `Read "PHASE PROMPTS/PHASE-05-purge-old-anthropic-files.md" and execute all steps in order.`
**⚠️ Irreversible:** this deletes files. Cowork announced this in chat before writing it.
**Status:** Ready (needs Ross's 2-minute setup below first)

## Why
Before PHASE-04, every uploaded PDF (test docs and the two firm plans removed from Supabase on Sept 28) stayed in Anthropic's Files API with no expiry. This deletes them. Only files this app created are touched: the app always uploads with the filename `upload.pdf`.

## Ross's setup (before running; do NOT paste the key into any chat)
1. Anthropic console → API Keys → create a key named `temp-file-cleanup`.
2. In VS Code, open `plansparency-nextjs/.env.local` and add one line: `ANTHROPIC_CLEANUP_KEY=<the key>`. Save. (`.env.local` is git-ignored.)
3. Run the phase. Afterwards: delete that line from `.env.local` and delete the `temp-file-cleanup` key in the Anthropic console.

## Rules for Claude Code
- Never print, log, echo, or commit the key. Read it only from `.env.local` inside the script.
- Nothing in this phase is committed to git except the doc status update. The script lives in `/tmp` and is deleted at the end.
- If the key is missing, STOP and tell Ross to do the setup.

## STEP 1 — Dry run (list only)
1. Write `/tmp/purge-files.mjs` (Node 18+, no dependencies): load `ANTHROPIC_CLEANUP_KEY` by reading `.env.local` directly; call `GET https://api.anthropic.com/v1/files?limit=1000` with headers `x-api-key`, `anthropic-version: 2023-06-01`, `anthropic-beta: files-api-2025-04-14`; follow the `next_page` cursor via the `page` param until done.
2. Print ONLY counts: total files; how many have `filename === "upload.pdf"`; how many are anything else (print those other filenames, since they may belong to another project and must NOT be deleted).
3. Run it with `node /tmp/purge-files.mjs --dry-run`.

## STEP 2 — Delete (only `upload.pdf` files)
1. Run `node /tmp/purge-files.mjs --delete`, which calls `DELETE https://api.anthropic.com/v1/files/{file_id}` (same headers) for every file named `upload.pdf`, pausing ~100 ms between calls. Never delete other filenames.
2. Run the dry run again. Expect 0 `upload.pdf` files remaining (a few may appear if someone uploaded during the run; that's fine, they now expire in 6 hours).
3. `rm /tmp/purge-files.mjs`.
4. Set this file's Status line to `Done YYYY-MM-DD: deleted N files`, then `git add "PHASE PROMPTS/PHASE-05-purge-old-anthropic-files.md"` → commit `chore(privacy): record one-time Anthropic Files cleanup` → push.

## Report back
Counts from both dry runs, number deleted, and the list of non-`upload.pdf` filenames (if any). Then remind Ross to remove the key line and delete the temp key.
