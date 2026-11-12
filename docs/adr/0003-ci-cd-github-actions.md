# ADR 0003: CI/CD on GitHub Actions with a required PR check and deploy-on-merge to dev

## Status

proposed

Open questions: [../decisions/ci-cd-deploy-to-cloudflare-dev-adr.md](../decisions/ci-cd-deploy-to-cloudflare-dev-adr.md)

## Context

The requirement has two parts. PRs must pass all unit tests before merge, and merges must deploy to dev automatically. The `git-workflow` skill already relies on `gh pr checks` and squash merges without admin bypass. The project has no CI.

Options:

1. **GitHub Actions for both.** A `ci` workflow runs on `pull_request` to `dev-v2`, with no secrets. Branch protection makes it a required status check. A `deploy-dev` workflow runs on `push` to `dev-v2`, re-runs the checks, and calls `wrangler deploy --env dev` with secrets from a GitHub Environment `dev`. Everything lives in the repo and is reviewable. Trade-off: managing a Cloudflare API token in GitHub.
2. **GitHub Actions for the PR gate plus Cloudflare Workers Builds (Git integration) for deploys.** No token in GitHub. Trade-offs: the pipeline is split across two systems, deploy config sits in the Cloudflare dashboard, and it is harder to gate the deploy on tests and add a post-deploy smoke check.
3. **Only Workers Builds (it can run commands before deploying).** Cloudflare cannot block a GitHub merge, so it does not meet the "must pass before merged" requirement.

## Decision

Option 1.

- The CI job runs `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` (the exact set is pending a question) on Node 24 with pnpm pinned through `packageManager`. All of this runs in one job named `ci`, which is the single required check.
- The deploy job uses a concurrency group `deploy-dev` that queues runs and does not cancel a deploy in progress. It deploys, then runs a smoke check on `GET /api/health`.
- Third-party actions are pinned to commit SHAs. PR workflows use `pull_request`, never `pull_request_target`.

## Consequences

- Easier: one place for the pipeline, a reviewable YAML file, and a deploy that only happens after tests pass on the merged commit.
- Harder: a scoped Cloudflare API token must be created and rotated. Branch protection is a repo setting that a repo admin applies outside the code. Merge queues or extra environments (staging, prod) will need more workflows later.

Related: [ADR 0002](0002-host-on-cloudflare-workers.md), features [ci-pr-checks](../features/ci-pr-checks.md) and [dev-deploy](../features/dev-deploy.md).
