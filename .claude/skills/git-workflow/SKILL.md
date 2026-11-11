---
name: git-workflow
description: Branch-per-task git workflow. Use before starting ANY change to the repo (code, docs, config, skills) to sync dev-v2 and cut a new branch, and again when the work is complete to open a PR, verify CI passes and merge it.
---

# Git workflow

Every change happens on its own branch cut from a fresh `dev-v2`, and lands through a PR into `dev-v2`. Never commit directly to `dev-v2` or `main`.

## 1. Before doing anything: sync and branch

1. Check the working tree: `git status --short`. If there are uncommitted changes you did not make for this task, stop and ask the user (stash, commit or discard).
2. Update the base branch:
   ```bash
   git fetch origin
   git checkout dev-v2
   git pull --rebase origin dev-v2
   ```
   If the rebase conflicts, stop and report. Do not guess at resolutions.
3. Create the task branch from `dev-v2`:
   ```bash
   git checkout -b <type>/<short-kebab-description>
   ```
   `<type>` is one of `feat`, `fix`, `docs`, `chore`, `refactor`, `test`. Example: `feat/google-sign-in`.

If already on a task branch for the current task, skip step 3 and only rebase it on `origin/dev-v2`.

## 2. During the work

- Keep changes small and focused (see CLAUDE.md). One task per branch.
- Commit in logical steps with clear messages. Only commit when the work is in a state you would show a reviewer.

## 3. When the work is complete

1. Run the project's lint/test/build commands (see CLAUDE.md) and fix failures locally first.
2. Commit any remaining changes, then push:
   ```bash
   git push -u origin HEAD
   ```
3. Open the PR against `dev-v2`. Load the `mattpocock-skills:pr` skill for the body:
   ```bash
   gh pr create --base dev-v2 --title "<title>" --body "<body>"
   ```
4. Verify CI. Wait for checks to finish; do not merge on a guess:
   ```bash
   gh pr checks --watch --fail-fast
   ```
   - All required checks green: continue.
   - Any check failing: read the logs (`gh run view --log-failed`), fix on the same branch, push, and watch again. Never bypass, skip or weaken a check to get green.
   - No checks configured at all: tell the user and ask before merging.
5. Merge only after CI passed. The repo allows squash merges only:
   ```bash
   gh pr merge --squash --delete-branch
   ```
   Do not use `--admin` or otherwise bypass branch protection or required reviews. If merging is blocked (required review, conflicts), report it to the user instead.
6. Return to a clean base:
   ```bash
   git checkout dev-v2
   git pull --rebase origin dev-v2
   ```

## Report

End with: branch name, PR URL, CI result (which checks passed) and merge status. If any step was skipped or failed, say so plainly.
