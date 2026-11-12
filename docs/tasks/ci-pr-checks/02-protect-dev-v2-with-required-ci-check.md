# 02 Protect `dev-v2` with the required `ci` check

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** 01 (the `ci` check must have run once so it can be selected)
**Feature spec:** [ci-pr-checks](../../features/ci-pr-checks.md)
**Mockup:** none

> Note: pending a repo admin, who must run `scripts/ci-branch-protection.sh apply` (or set the rule by hand), re-run `check` until it prints OK, paste the protection JSON below, then run the throwaway-PR negative cases. This task stays `todo` until then. As of the last review, `dev-v2` has `contexts: []`, `strict: false` and `main` is unprotected.

## What to change

Repo setting (branch protection rule or ruleset) on `dev-v2`: require the `ci` status check, require branches to be up to date, block direct pushes and force pushes, apply to admins, and allow squash merge only (matches `git-workflow`). Apply the same to `main` (decided, see [decision](../../decisions/ci-pr-checks.md)). Record the settings in `docs/infra/ci-cd.md`.

## Checklist

- [ ] `ci` required, strict (up to date) mode on
- [ ] Direct and force pushes blocked, applies to admins
- [ ] Squash merge only (repo setting; `check` verifies it, `apply` does not set it)
- [ ] `main` protected the same way (decided: yes)
- [ ] Settings recorded in `docs/infra/ci-cd.md`

## Verification

- [ ] `gh api repos/{owner}/{repo}/branches/dev-v2/protection` (or the ruleset API) shows the `ci` check required, strict mode on, and admin enforcement on.
- [ ] The throwaway PR with the failing test cannot be merged, including with `gh pr merge --admin`.
- [ ] `git push origin HEAD:dev-v2` from a local branch is rejected.
- [ ] A PR behind `dev-v2` asks for an update before merge.
- [ ] Covers US-ci-2.3 to 2.6.
