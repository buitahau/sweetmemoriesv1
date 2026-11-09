# CI/CD

Status: proposed ([ADR 0002](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)). Becomes current once the [ci-checks](../features/ci-checks.md) and [dev-deploy](../features/dev-deploy.md) tasks are done.

## What

Two GitHub Actions workflows:

| Workflow | File | Trigger | Job | Does | Secrets |
|---|---|---|---|---|---|
| `CI` | `.github/workflows/ci.yml` | `pull_request` to `dev-v1` or `main` | `verify` | `npm ci`, `npm run typecheck`, `npm test`, `npm run build` | none |
| `Deploy dev` | `.github/workflows/deploy-dev.yml` | `push` to `dev-v1`; `workflow_dispatch` | `deploy` | same four steps, write web markers, deploy API and web Workers, wait for markers, smoke test | `dev` environment |

`Deploy dev` concurrency: `group: deploy-dev-${{ github.ref }}`, `cancel-in-progress: false`. Runs for `dev-v1` never overlap. GitHub keeps at most one pending run per group: when a third merge arrives while one run is in progress and one is pending, the pending run is replaced and shows `cancelled`; the newest commit always deploys. Keying the group on the ref keeps a `workflow_dispatch` from another branch (which fails at the `dev` environment rule) from replacing a pending `dev-v1` run.

Flow for one ticket:

```
agent branch --PR--> CI/verify (required) --squash merge--> dev-v1
  --push--> Deploy dev: verify, build, deploy api + web, wait-for-dev-deploy, smoke-dev
  --> tester agent runs the ticket's e2e-test-suites on the dev URLs
```

## Where it runs

GitHub-hosted runners `ubuntu-latest`, Node from `.nvmrc` (`actions/setup-node@v6` with `node-version-file: .nvmrc`, `cache: npm`), checkout with `actions/checkout@v6`. Deploys go to Cloudflare Workers (see [dev-environment](dev-environment.md)).

## Branch protection (`dev-v1`)

| Rule | Value |
|---|---|
| Require a pull request before merging | on (0 approvals required: the reviewer agent reviews, it cannot approve) |
| Require status checks to pass | on, check `verify` |
| Require branches to be up to date | off (the deploy workflow re-checks the merged commit) |
| Allow force pushes / deletions | off / off |
| Do not allow bypassing the above settings (include administrators) | on |
| Allowed merge method | squash (repository setting); "Automatically delete head branches" on |

## GitHub environment `dev`

| Setting | Value |
|---|---|
| Deployment branches | Selected branches: `dev-v1` only |
| Required reviewers | none (deploys are automatic) |
| Secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| Variables | `DEV_API_URL`, `DEV_WEB_URL` |

## Config / env vars (names only)

| Name | Kind | Where | Used by |
|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | secret | GitHub environment `dev` | `Deploy dev` (wrangler auth). Token template "Edit Cloudflare Workers", scoped to the one SweetMemories account. |
| `CLOUDFLARE_ACCOUNT_ID` | secret | GitHub environment `dev` | `Deploy dev` |
| `DEV_API_URL` | variable | GitHub environment `dev` | wait and smoke scripts |
| `DEV_WEB_URL` | variable | GitHub environment `dev` | wait and smoke scripts |
| `GIT_SHA` | Worker var | set at deploy with `--var GIT_SHA:$GITHUB_SHA` | `GET /api/version` |

Never print the token; never put it in a file in the repository.

## Test PRs (probe file)

Verification cases that need a harmless "docs-only" PR change only a probe file, never a real doc:

- File: `docs/.ci-probe`. When two or three probe PRs must be open at the same time, the second uses `docs/.ci-probe-b` and the third `docs/.ci-probe-c`, so they do not conflict.
- Content: one line, the UTC time, written with `date -u +%FT%TZ > <probe file>` (overwrite, never append).
- Branch names start with `ci-test/`; the branch is deleted after merge or close.

## How to change it

- Add a CI step: edit `ci.yml` and the matching step in `deploy-dev.yml`, then this doc. The two step lists are the same except that `deploy-dev.yml` has no `Node version` step.
- Rename the `verify` job: also update branch protection, or every PR is blocked.
- Re-run a deploy without a new commit: `gh workflow run deploy-dev.yml --ref dev-v1` (deploys the current `dev-v1` head).
- Never use "Re-run" on an older `Deploy dev` run and never dispatch with an older ref or SHA: it would deploy older code over newer code, and the markers would then show a commit that is not the `dev-v1` head.
- "Older" means: its `headSha` is not the current `dev-v1` head (`git rev-parse origin/dev-v1` after `git fetch origin dev-v1`). Re-running the run whose `headSha` *is* the head deploys the head again, so it does not overwrite newer code. Whether the verifying agent may do that after a transient Cloudflare or GitHub error is open: [Q013](../questions/questions-2026-11-09-requirement-breakdown.md#q013-may-the-verifying-agent-re-run-a-deploy-dev-run-that-failed-on-a-transient-error).
- Roll back dev: `cd apps/<app> && npx wrangler rollback` (pick the previous version), or revert the commit on `dev-v1`.
