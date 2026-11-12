# 03 Document the CI pipeline

**Status:** in progress
**Side:** backend
**Size:** S
**Dependencies:** 01, 02
**Feature spec:** [ci-pr-checks](../../features/ci-pr-checks.md)
**Mockup:** none

## What to change

Create `docs/infra/ci-cd.md` (load the `docs-placement` skill): what `ci` runs, how to reproduce it locally, how to read failures, branch protection settings, and why secrets are not available on PRs. Link ADR 0003. Update the CLAUDE.md "Status" line and the `git-workflow` note if needed. Update `docs/features/Progress.md`.

## Checklist

- [x] `docs/infra/ci-cd.md` written and linked to ADR 0003
- [x] CLAUDE.md Status line and `git-workflow` note updated if needed
- [x] `Progress.md` updated

## Verification

- [ ] Following the doc from a clean clone reproduces the `ci` steps locally with the same results.
- [ ] Progress.md lists ci-pr-checks with its spec and task links.
- [x] Links to ADR 0003 and the feature spec resolve.
