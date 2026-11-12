# Decisions: ci-pr-checks

Feature: [ci-pr-checks](../features/ci-pr-checks.md). Tasks: [02](../tasks/ci-pr-checks/02-protect-dev-v2-with-required-ci-check.md).

## Q1. Is `main` protected like `dev-v2`?

- **Options:** (a) protect both the same way; (b) protect only `dev-v2`.
- **Recommendation:** (a). The workflow already runs on PRs to both, and `main` receives merges.
- **Answer:** (a), both branches. The feature spec, task 02 and `scripts/ci-branch-protection.sh` agree. For a temporary dev-v2-only check, run `BRANCHES=dev-v2 scripts/ci-branch-protection.sh check`.

## Hand-off (not a code defect)

Live protection is not applied yet (`dev-v2`: no required contexts, `strict: false`; `main`: unprotected). A repo admin must run `scripts/ci-branch-protection.sh apply`, then `check`, then the throwaway-PR negative cases. Also confirm the `pnpm build` step appears and succeeds in a `ci` run log. Task 02 stays `todo`; the feature is not done.
