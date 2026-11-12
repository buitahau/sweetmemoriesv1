# Dev environment

Decision: [ADR 0002](../adr/0002-host-on-cloudflare-workers.md), [ADR 0003](../adr/0003-ci-cd-github-actions.md). Feature: [dev-deploy](../features/dev-deploy.md).

## Dev URL

The Worker `sweetmemories-dev` on Cloudflare `workers.dev`: `https://sweetmemories-dev.<account-subdomain>.workers.dev` (the exact URL is in the `deploy-dev` run summary). It is public and holds synthetic test data only.

## How deploys happen

Workflow `.github/workflows/deploy-dev.yml` runs on every push to `dev-v2` (a squash-merged PR) and on `workflow_dispatch` (only from `dev-v2`). It runs install, lint, typecheck, test and build (kept identical to `ci` by `src/ci/deploy-dev.test.ts`), then `wrangler deploy --env dev`, then polls `GET /api/health` for 60 seconds. Runs queue one at a time. Secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) live only in the GitHub Environment `dev`, limited to `dev-v2`.

A re-run of an older run is refused with "stale run, use workflow_dispatch" when `dev-v2` has moved on, so dev never ends on an older commit. If `wrangler-action` gives no URL, the smoke check uses the Environment variable `DEV_URL`.

If any check or the deploy fails, the previous version stays live. If the smoke check fails, the workflow runs `wrangler rollback --env dev` automatically.

## Before the first deploy (ops)

The GitHub Environment `dev` must allow only the branch `dev-v2` (Settings, Environments, dev, Deployment branches). If it lists another branch (for example `dev-v1`), the run fails within seconds with no steps and the annotation `Branch "dev-v2" is not allowed to deploy to dev due to environment protection rules.` Fix it in the Environment settings, then start `deploy-dev` with Run workflow on `dev-v2`. **Blocker:** until ops allows only `dev-v2` (removing `dev-v1`) and a `workflow_dispatch` run on `dev-v2` succeeds, there is no live dev Worker and Task 02 is not done. Check the policy with `gh api repos/<owner>/<repo>/environments/dev/deployment-branch-policies`.

The Worker is only live after the first successful run. Record the printed dev URL here and set the Environment variable `DEV_URL` to it (the smoke check falls back to it).

## Which commit is live

Open the latest `deploy-dev` run on `dev-v2` in GitHub Actions. The summary shows the outcome (including whether the deploy was rolled back), commit SHA, dev URL and Cloudflare version ID. The Cloudflare dashboard (Workers, `sweetmemories-dev`, Deployments) shows the same SHA as the version tag.

## Manual rollback

Either start `deploy-dev` on a good commit (Actions, Run workflow on `dev-v2`; do not use the re-run button, a re-run of an old run fails with "stale run" if `dev-v2` has moved on), or roll back directly:

```bash
pnpm exec wrangler rollback -c wrangler.jsonc --env dev --message "reason"
```

or use Deployments in the Cloudflare dashboard. Then check `curl -i <dev URL>/api/health` returns `200` `{"status":"ok"}`.

## Run e2e against dev

```bash
E2E_BASE_URL=<dev URL> .venv-e2e/bin/pytest e2e/project-skeleton
```

Setup of `.venv-e2e` is in [../../e2e/README.md](../../e2e/README.md). Scenario US-skeleton-1.6 ("server stopped") only applies locally and passes against dev but does not test it (it only probes a local port).

## Cloudflare token (task 02, ops)

Token scope: Workers Scripts Edit on the SweetMemories account only. Token owner: TBD. Rotation date: TBD. Record owner and date here, never the values.

## Local

`pnpm build && pnpm start` runs the same Worker build locally on port 3000. `wrangler.jsonc` is passed with `-c` because Nitro's generated config cannot contain environments.
