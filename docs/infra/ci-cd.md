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

Status: partly applied. `dev-v2` already has a rule with administrators included and force pushes blocked; it still needs the required status check `ci` with "Require branches to be up to date". `main` is not protected yet: it has no rule at all, so it needs every setting listed above. Both need a repo admin, after the first PR run of `ci`. Verify with `gh api repos/{owner}/{repo}/branches/dev-v2/protection` (see task 02).

To check or apply these settings, run `scripts/ci-branch-protection.sh check` (read-only, exits non-zero while protection is incomplete) or `scripts/ci-branch-protection.sh apply` (repo admin only; sets `ci` required, strict, admins enforced, force pushes off on both branches). Squash-only merge is a separate repo setting.
