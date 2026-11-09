# Create dev branch

- Status: done

## Goal

Create the integration and deploy branch `dev-v1` on `origin` from `main`, so that [add-ci-workflow](add-ci-workflow.md) has a branch to open its PR against.

## Scope

Area: infra (one git push, no file changes). **Done by a human with push rights on the repository**; an agent may only run the read-only checks below. Decided in [ADR 0002](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md) ("Integration / deploy branch").

Steps:
1. Confirm the design docs are merged into `main` ([Q004](../../questions/questions-2026-11-09-requirement-breakdown.md#q004-is-dev-v1-the-integration-and-deploy-branch) answered; default: Option A).
2. `git fetch origin && git ls-remote --heads origin dev-v1`. If it prints a line, the branch already exists: skip step 3 and only run the checklist.
3. `git push origin origin/main:refs/heads/dev-v1`.
4. Set this task's Status to `done` and update [Progress](../Progress.md).

Prerequisites:
- [Q004](../../questions/questions-2026-11-09-requirement-breakdown.md#q004-is-dev-v1-the-integration-and-deploy-branch) answered (or its default accepted).
- Same design gate as [add-ci-workflow](add-ci-workflow.md).

Out of scope: branch protection ([protect-dev-branch](protect-dev-branch.md)), workflow files, changing `.claude/` skills, deleting or renaming the existing `devv1` or `mainv1` branches.

Security: never force-push; the branch starts exactly at `origin/main`, so no unreviewed commit enters `dev-v1`.

## Verification checklist

The task is complete only when every item below passes. Tags name the [ci-checks](../../features/ci-checks.md) acceptance criterion (ACn).

- [x] 1. `git ls-remote --heads origin dev-v1` prints exactly one line. (AC4, AC5: the branch to protect exists)
- [ ] 2. Right after creation, `git rev-parse origin/dev-v1` equals `git rev-parse origin/main` (after `git fetch origin`). (Scope: starts at `main`)
- [ ] 3. `git ls-remote --heads origin main devv1 mainv1` shows the same SHAs as before step 3 (no other branch changed). (Out of scope)

## e2e-test-suites

Type: BE (infra). Run from a clone with `origin` reachable.

```
E2E-1 -> checklist items 1, 2: branch exists at main
Preconditions: step 3 done, no merge into dev-v1 yet
Request:
  git fetch origin
  git ls-remote --heads origin dev-v1 | wc -l
  test "$(git rev-parse origin/dev-v1)" = "$(git rev-parse origin/main)"; echo "same=$?"
Expected: 1; same=0
```

```
E2E-2 -> checklist item 3: other branches untouched
Preconditions: before step 3, save: git ls-remote --heads origin main devv1 mainv1 > /tmp/heads-before.txt
Request:
  git ls-remote --heads origin main devv1 mainv1 | diff /tmp/heads-before.txt -; echo "diff=$?"
Expected: diff=0
```

## Summary

- Result: done by the owner's decision (2026-11-09) on static evidence. `dev-v1` exists on `origin` (item 1 pass); `main` is its ancestor ("Initial commit"), consistent with a branch cut from `main`.
- Not re-run: items 2 and 3 (`dev-v1` equals `main` right after creation; other branches unchanged). They only apply at creation time and `dev-v1` has moved on, so they stay unticked.
- Leftovers: none.

## Links

- Feature: [ci-checks](../../features/ci-checks.md)
- ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- Infra: [ci-cd](../../infra/ci-cd.md)
- Next: [add-ci-workflow](add-ci-workflow.md)
