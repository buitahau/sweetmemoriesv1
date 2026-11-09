# Protect dev branch

- Status: blocked

## Goal

Configure GitHub so `dev-v1` only accepts squash-merged PRs whose `verify` check passed, for everyone including admins and agents.

## Scope

Area: infra (GitHub settings, no files in the repository). **Done by a human with admin rights on the repository**; an agent may only run the read-only checks below. Settings exactly as in [infra/ci-cd.md "Branch protection"](../../infra/ci-cd.md#branch-protection-dev-v1).

Steps (GitHub web UI):
1. Settings > General > Pull Requests: allow squash merging; turn off merge commits and rebase merging; turn on "Automatically delete head branches".
2. Settings > Branches > Add branch protection rule, pattern `dev-v1`:
   - Require a pull request before merging: on; required approvals: 0.
   - Require status checks to pass before merging: on; add `verify` (it is listed only after [add-ci-workflow](add-ci-workflow.md) has run once); "Require branches to be up to date": off.
   - Do not allow bypassing the above settings: on.
   - Allow force pushes: off. Allow deletions: off.
3. Set this task's Status to `done` and update [Progress](../Progress.md).

Prerequisites:
- Tasks `done`: [create-dev-branch](create-dev-branch.md) (`dev-v1` exists), [add-ci-workflow](add-ci-workflow.md) (its PR ran `verify` at least once).
- Same design gate as [add-ci-workflow](add-ci-workflow.md).

Out of scope: protection for `main`, CODEOWNERS, required reviewers, rulesets for other branches, GitHub environment `dev` (see [provision-cloudflare-dev](../dev-deploy/provision-cloudflare-dev.md)).

Security: "Do not allow bypassing" must be on, otherwise an agent using an admin token could merge a failing PR (`implement-ticket` rule: never bypass branch protection).

## Verification checklist

The task is complete only when every item below passes. Tags name the [ci-checks](../../features/ci-checks.md) acceptance criterion (ACn).

- [ ] 1. `gh api repos/$REPO/branches/dev-v1/protection` shows `required_status_checks.contexts` (or `checks[].context`) containing `verify` and `strict: false`. (AC4)
- [x] 2. The same response shows `enforce_admins.enabled: true`, `allow_force_pushes.enabled: false`, `allow_deletions.enabled: false`, and `required_pull_request_reviews.required_approving_review_count: 0`. (AC4, AC5)
- [x] 3. `gh api repos/$REPO` shows `allow_squash_merge: true`, `allow_merge_commit: false`, `allow_rebase_merge: false`, `delete_branch_on_merge: true`. (AC6)
- [x] 4. A direct push of an empty commit to `dev-v1` is rejected. (AC5)
- [x] 5. `gh pr merge --squash` on a PR whose `verify` failed is refused, run by an admin. (AC4)
- [x] 6. `gh pr merge --squash` on a PR whose `verify` is still `pending` (run right after opening the PR) is refused, run by an admin, and the PR stays `OPEN`. (AC4: "still running")

## e2e-test-suites

Type: BE (infra). `$REPO` = `<owner>/<repo>`; `gh` signed in as a repository admin.

```
E2E-1 -> checklist items 1, 2: protection settings
Preconditions: rule saved
Request:
  gh api repos/$REPO/branches/dev-v1/protection --jq '{checks: .required_status_checks.contexts, strict: .required_status_checks.strict, admins: .enforce_admins.enabled, force: .allow_force_pushes.enabled, del: .allow_deletions.enabled, approvals: .required_pull_request_reviews.required_approving_review_count}'
Expected: {"checks":["verify"],"strict":false,"admins":true,"force":false,"del":false,"approvals":0}
```

```
E2E-2 -> checklist item 3: merge settings
Preconditions: none
Request:
  gh api repos/$REPO --jq '{s: .allow_squash_merge, m: .allow_merge_commit, r: .allow_rebase_merge, d: .delete_branch_on_merge}'
Expected: {"s":true,"m":false,"r":false,"d":true}
```

```
E2E-3 -> checklist item 4: direct push rejected
Preconditions: clean clone
Request:
  git checkout -b ci-test/direct origin/dev-v1 && git commit --allow-empty -m "direct" && git push origin HEAD:dev-v1; echo "push=$?"
Expected: push non-zero; message mentions protected branch
```

```
E2E-4 -> checklist item 5: failing PR cannot be merged
Preconditions: a PR into dev-v1 with verify = fail (ci-checks feature E2E-2)
Request:
  gh pr merge <pr> --squash; echo "merge=$?"
Expected: merge non-zero; message says required status check "verify" is failing; PR stays open
Cleanup: gh pr close <pr> --delete-branch
```

```
E2E-5 -> checklist item 6: pending PR cannot be merged (AC4)
Preconditions: rule saved; gh signed in as admin
Request:
  git checkout -b ci-test/pending origin/dev-v1 && date -u +%FT%TZ > docs/.ci-probe && git add docs/.ci-probe && git commit -m "ci probe pending" && git push -u origin ci-test/pending
  gh pr create --base dev-v1 --head ci-test/pending --title "ci test pending" --body "test"
  gh pr checks ci-test/pending; echo "checks=$?"
  gh pr merge ci-test/pending --squash; echo "merge=$?"
  gh pr view ci-test/pending --json state -q .state
Expected: checks non-zero (verify pending or not yet listed; if checks=0 the run already passed, so repeat with a new probe commit); merge non-zero; state "OPEN"
Cleanup: gh pr close ci-test/pending --delete-branch
```

## Summary

- Result: blocked on one human setting. Item 1 fails: `required_status_checks.strict` is `true`, the task expects `false` ("Require branches to be up to date" off). Turn that setting off (or change the task and [ci-cd](../../infra/ci-cd.md) to accept `true` and say so), then re-run item 1. Items 2-6 pass.
- Test (tester, 2026-11-09, throwaway PRs #20-#22 closed, probe PR #23 merged): `verify` is required; merge refused on a failing and on a pending PR (`gh pr merge --squash` exit 1, PR stays `OPEN`); direct push rejected (`GH006`); squash merge of a passing PR works and deletes its branch.
- Not run: the force-push command (denied by the permission system); `allow_force_pushes: false` was read from the API only. The refusal text says "base branch policy prohibits the merge" and does not name `verify`.
- Leftovers: the `strict` setting; feature items 1 and 7 (force-push) stay open until then.

## Links

- Feature: [ci-checks](../../features/ci-checks.md)
- ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- Infra: [ci-cd](../../infra/ci-cd.md)
