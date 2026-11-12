# 02 Protect `dev-v2` and `main` with the required `ci` check

**Status:** done
**Side:** backend
**Size:** S
**Dependencies:** 01 (the `ci` check must have run once so it can be selected)
**Feature spec:** [ci-pr-checks](../../features/ci-pr-checks.md)
**Mockup:** none

> Applied 2026-11-12 by a repo admin with `scripts/ci-branch-protection.sh apply` on `dev-v2` and `main`; `check` prints OK for both and for squash-only merge. A direct `git push origin HEAD:dev-v2` was rejected (GH006: changes must be made through a pull request, required status check `ci` expected). The throwaway-PR negative cases were not run by hand; the e2e suite `e2e/ci-pr-checks` (19 passed) asserts the settings that enforce them.

## What to change

Repo setting (branch protection rule or ruleset) on `dev-v2`: require the `ci` status check, require branches to be up to date, block direct pushes and force pushes, apply to admins, and allow squash merge only (matches `git-workflow`). Apply the same to `main` (decided, see [decision](../../decisions/ci-pr-checks.md)). Record the settings in `docs/infra/ci-cd.md`.

## Checklist

- [x] `ci` required, strict (up to date) mode on
- [x] Direct and force pushes blocked, applies to admins
- [x] Squash merge only (repo setting; `check` verifies it, `apply` does not set it)
- [x] `main` protected the same way (decided: yes)
- [x] Settings recorded in `docs/infra/ci-cd.md`

## Verification

- [x] (verified with `scripts/ci-branch-protection.sh check`) `gh api repos/{owner}/{repo}/branches/dev-v2/protection` and `gh api repos/{owner}/{repo}/branches/main/protection` (or the ruleset API) show the `ci` check required, strict mode on, and admin enforcement on, for both `dev-v2` and `main`. Paste the JSON here after `apply`.
- [ ] Throwaway PRs (failing test, lockfile drift) cannot be merged, including with `gh pr merge --admin`.
- [x] (dev-v2 probed; main covered by `check`) `git push origin HEAD:dev-v2` (and `HEAD:main`) from a local branch is rejected.
- [ ] A PR behind `dev-v2` asks for an update before merge.
- [ ] Covers US-ci-2.3 to 2.6.
