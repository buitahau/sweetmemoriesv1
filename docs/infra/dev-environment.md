# Dev environment

Decision: [ADR 0002](../adr/0002-host-on-cloudflare-workers.md), [ADR 0003](../adr/0003-ci-cd-github-actions.md). Feature: [dev-deploy](../features/dev-deploy.md).

## Dev URL

The Worker `sweetmemories-dev` on Cloudflare `workers.dev`: `https://sweetmemories-dev.<account-subdomain>.workers.dev` (the exact URL is in the `deploy-dev` run summary). It is public and holds synthetic test data only.

## How deploys happen

Workflow `.github/workflows/deploy-dev.yml` runs on every push to `dev-v2` (a squash-merged PR) and on `workflow_dispatch` (only from `dev-v2`). It runs install, lint, typecheck, test and build (kept identical to `ci` by `src/ci/deploy-dev.test.ts`), then `wrangler deploy --env dev`, then polls `GET /api/health` for 60 seconds. Runs queue one at a time. Secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) live only in the GitHub Environment `dev`, limited to `dev-v2`.

If any check or the deploy fails, the previous version stays live. If the smoke check fails, the workflow runs `wrangler rollback --env dev` automatically.

## Which commit is live

Open the latest `deploy-dev` run on `dev-v2` in GitHub Actions. The summary shows the commit SHA, dev URL and Cloudflare version ID. The Cloudflare dashboard (Workers, `sweetmemories-dev`, Deployments) shows the same SHA as the version tag.

## Manual rollback

Either re-run `deploy-dev` on a good commit (Actions, Run workflow on `dev-v2`), or roll back directly:

```bash
pnpm exec wrangler rollback -c wrangler.jsonc --env dev --message "reason"
```

or use Deployments in the Cloudflare dashboard. Then check `curl -i <dev URL>/api/health` returns `200` `{"status":"ok"}`.

## Run e2e against dev

```bash
E2E_BASE_URL=<dev URL> .venv-e2e/bin/pytest e2e/project-skeleton
```

Setup of `.venv-e2e` is in [../../e2e/README.md](../../e2e/README.md). Scenario US-skeleton-1.6 ("server stopped") only applies locally and is expected to fail or be skipped against dev.

## Cloudflare token (task 02, ops)

Token scope: Workers Scripts Edit on the SweetMemories account only. Token owner: TBD. Rotation date: TBD. Record owner and date here, never the values.

## Local

`pnpm build && pnpm start` runs the same Worker build locally on port 3000. `wrangler.jsonc` is passed with `-c` because Nitro's generated config cannot contain environments.
