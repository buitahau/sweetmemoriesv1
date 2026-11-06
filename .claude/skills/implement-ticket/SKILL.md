---
name: implement-ticket
description: Implement one ticket (ADR, feature or task under docs/) and merge it into dev-v1. Branches from dev-v1, has the implementer agent build it, the reviewer agent review it, the implementer fix the feedback, then opens and merges a PR into dev-v1. Use when the user asks to implement, build or ship a ticket by path or slug. No deploy or test step; use implement-and-test-ticket for that.
---

# Implement ticket

Input: the ticket as a path or slug (`docs/tasks/<feature-slug>/<task>.md`, `docs/features/<slug>`, `docs/adr/<slug>`). Ask if none is given. On a retry from `implement-and-test-ticket`, also receive the gap/failure evidence to fix.

Invoking this skill is approval to push branches and open/merge PRs into `dev-v1` for this ticket only. It does not extend to any other branch.

## Before starting

1. Read the ticket, its linked feature/ADR, and any `docs/questions/questions-*.md`. Stop and ask if it has no checklist or has blocking open questions.
2. Check `CLAUDE.md`: if the design is not approved and the ticket changes application code, stop and ask.
3. Check `git fetch origin`, that `origin/dev-v1` exists, and `gh auth status`. If `dev-v1` or `gh` is missing, stop and say so; never use another base branch.
4. Check `git status`; if there are unrelated uncommitted changes, stop and ask.

## Step 1: Branch

```
git fetch origin
git checkout -b <type>/<slug> origin/dev-v1
```

`type` is `feat`, `fix`, `task` or `docs`. If the branch exists (retry), check it out and update it from `origin/dev-v1`. For fix cycles use `<type>/<slug>-fix-<n>`.

## Step 2: Implement

Spawn the `implementer` agent with the ticket path/slug, the branch name, and any feedback/gap evidence. It reads the ticket's description, goal and checklist (and mockups under `docs/ui` if linked), implements with minimal changes, checks itself against the checklist, and reports modified files. Tell it not to commit; you commit. If it reports `blocked` or open questions, stop and relay them.

## Step 3: Review

Commit the work, then spawn the `reviewer` agent with the ticket path and the diff against `origin/dev-v1`. It is read-only. Collect findings (severity, `file:line`, fix) and verdict.

## Step 4: Fix feedback

If the verdict is `request changes` or any Blocker/Major exists, spawn the `implementer` again with the full findings to fix them minimally. Commit and re-review. At most 3 review rounds; if Blockers/Majors remain, stop and report, do not merge. Have the implementer fix cheap Minor/Nit items; list the rest in the PR.

## Step 5: PR and merge

1. `git push -u origin <branch>`
2. `gh pr create --base dev-v1 --head <branch>`. Title: ticket title. Body: summary, ticket link, checklist status, review findings and resolution, open items. End with the attribution line from the system reminder, if any.
3. Check `gh pr checks`; if a required check fails, go back to step 4 with the failure. Do not merge.
4. `gh pr merge <pr> --squash --delete-branch`. Never force-merge or bypass branch protection; if blocked, report why.

## Done

```
ticket: <slug>
branch / PR: <name> / <link>
review: <rounds, fixed, left>
checklist: <status>
open items: <list or none>
```

## Rules

- Base and merge target is only `dev-v1`; never touch `main` or others.
- Never skip review or CI; no `--no-verify`, force-push, or branch-protection bypass.
- Implementer changes code, reviewer only reviews. They do not share your context; pass everything in prompts.
- Report only what you actually saw happen.
