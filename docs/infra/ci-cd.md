# CI: PR checks

Decision: [ADR 0003](../adr/0003-ci-cd-github-actions.md). Feature: [ci-pr-checks](../features/ci-pr-checks.md).

## What `ci` runs

Workflow `.github/workflows/ci.yml`, one job named `ci`, on every `pull_request` to `dev-v2` and `main` and each new commit. Node 24, pnpm pinned by `packageManager` in `package.json`. Steps, in order:

1. `pnpm install --frozen-lockfile` (fails if `pnpm-lock.yaml` is out of date)
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`

A newer push to the same PR cancels the earlier run.

## Reproduce locally

```bash
pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Read a failure

Open the PR, click Details on `ci`, and expand the red step. Install failures mean the lockfile is stale (run `pnpm install` and commit it). Test failures name the failing test.

## Secrets

The workflow uses `pull_request` (never `pull_request_target`), `permissions: contents: read`, and references no secrets, so PR code (including forks) cannot read the Cloudflare token or `DATABASE_URL`. PRs never deploy. Actions are pinned to commit SHAs.

## Branch protection on `dev-v2` and `main` (repo admin applies once)

Apply the same settings to both `dev-v2` and `main`, in GitHub settings after `ci` has run once so it can be selected (the workflow runs on PRs to both):

- Require status check `ci`, with "Require branches to be up to date" on.
- Block direct pushes and force pushes; include administrators.
- Allow squash merge only.

Status: applied on both `dev-v2` and `main` (2026-11-12). Verify with `scripts/ci-branch-protection.sh check` or `gh api repos/{owner}/{repo}/branches/dev-v2/protection` (see task 02).

To check or apply these settings, run `scripts/ci-branch-protection.sh check` (read-only, exits non-zero while protection is incomplete) or `scripts/ci-branch-protection.sh apply` (repo admin only; sets `ci` (GitHub Actions) required, strict, a pull request required with 0 approvals, admins enforced, force pushes and deletions off on both branches). `apply` replaces the whole rule, so it prints the current rule and asks for confirmation first; settings not in its payload (linear history, conversation resolution, lock branch) are reset. Requires `gh` (signed in) and `jq`; exit 2 means a tool or API error, not a misconfiguration. The check predicate is `scripts/branch-protection.jq`, tested by `src/ci/branch-protection.test.ts`. Squash-only merge is a separate repo setting. Set `BRANCHES="dev-v2"` (space separated, names limited to letters, digits, `.`, `_`, `/`, `-`; an empty value is rejected, unset means the default; names git refuses, such as a trailing `/` or `.lock`, are rejected) to limit a run to some branches; the script then prints a NOTE and exit 0 is not full compliance.
