# Dev environment

Decision: [ADR 0002](../adr/0002-host-on-cloudflare-workers.md), [ADR 0003](../adr/0003-ci-cd-github-actions.md). Feature: [dev-deploy](../features/dev-deploy.md).

## Dev URL

The Worker `sweetmemories-dev` on Cloudflare `workers.dev`: `https://sweetmemories-dev.<account-subdomain>.workers.dev` (the exact URL is in the `deploy-dev` run summary). It is public and holds synthetic test data only.

## How deploys happen

Workflow `.github/workflows/deploy-dev.yml` runs on every push to `dev-v2` (a squash-merged PR) and on `workflow_dispatch` (only from `dev-v2`). It runs install, lint, typecheck, test and build (kept identical to `ci` by `src/ci/deploy-dev.test.ts`), then `wrangler deploy --env dev`, then polls `GET /api/health` for 60 seconds. Runs queue one at a time. Secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) live only in the GitHub Environment `dev`, limited to `dev-v2`.

A re-run of an older run is refused with "stale run, use workflow_dispatch" when `dev-v2` has moved on, so dev never ends on an older commit. If `wrangler-action` gives no URL, the smoke check uses the Environment variable `DEV_URL`.

If any check or the deploy fails, the previous version stays live. If the smoke check fails, the workflow runs `wrangler rollback --env dev` automatically.

## Before the first deploy (ops)

Blocker: until steps 1 to 5 are done there is no live dev Worker and Task 02 is not done. These need a repo admin; they cannot be fixed from a code branch.

1. Set the GitHub Environment `dev` deployment branch policy to `dev-v2` only (Settings, Environments, dev, Deployment branches) and remove any other branch such as `dev-v1`. With a wrong policy the run fails within seconds with no steps and the annotation `Branch "dev-v2" is not allowed to deploy to dev due to environment protection rules.` Check it with `gh api repos/<owner>/<repo>/environments/dev/deployment-branch-policies`.
2. Confirm the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exist in that Environment.
3. Start `deploy-dev` on `dev-v2` with Run workflow (`workflow_dispatch`) to bring the Worker live.
4. Get a successful **push** run on `dev-v2`: merge a new commit into `dev-v2`. Do not re-run an old failed run. The e2e check US-deploy-1.1b only counts runs with event `push` and requires `updatedAt - createdAt` within 10 minutes, and a re-run keeps the original `createdAt`, so a late re-run fails the check even when the deploy succeeds. The `Refuse stale run` guard in `deploy-dev.yml` also blocks a re-run once `dev-v2` has moved on.
5. Set the Environment variable `DEV_URL` to the printed dev URL and record it below.

The Worker is only live after the first successful run. Dev URL: `https://sweetmemories-dev.haubuitatmp.workers.dev` (the smoke check falls back to `DEV_URL`).

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
E2E_BASE_URL=<dev URL> .venv-e2e/bin/pytest e2e/dev-deploy -rs
```

The `e2e/dev-deploy` scenarios that hit the deployed app skip as `BLOCKED` when `E2E_BASE_URL` is unset or points at localhost, so local passes are never read as dev evidence. Set `E2E_ALLOW_LOCAL=1` to run them against a local `pnpm start` on purpose.

Do not use the repo variables `DEV_API_URL` and `DEV_WEB_URL` as `E2E_BASE_URL`: they point at the v1 workers.

Setup of `.venv-e2e` is in [../../e2e/README.md](../../e2e/README.md). Scenario US-skeleton-1.6 ("server stopped") only applies locally and passes against dev but does not test it (it only probes a local port).

## Test database (Neon dev branch)

Decision: [ADR 0004](../adr/0004-neon-dev-branch-test-database.md). Feature: [dev-test-database](../features/dev-test-database.md).

- Dev uses the Neon branch `dev` (child of the project's main branch) through the Worker secret `DATABASE_URL`, with a non-owner role scoped to that branch database. Production never shares a branch or credentials with dev.
- The dev database holds synthetic test data only, never real user data.
- Access: maintainers with access to the Neon project. Testers use the app on dev, not the database directly.
- No DB code exists yet; the secret is only typed in `src/env.d.ts`. The first DB feature reads it and uses `@neondatabase/serverless`.
- Never print the value in CI logs, commit it, or return it from an endpoint.

Ops (maintainer, not done from a code branch). Neon names to record here once created: project `TBD`, branch `dev`, role `TBD` (names only, never secrets).

1. In Neon, create the branch `dev` off main and a non-owner role scoped to the dev branch database.
2. Set the secret: `pnpm exec wrangler secret put DATABASE_URL -c wrangler.jsonc --env dev` (paste the dev branch connection string at the prompt).
3. Check: `pnpm exec wrangler secret list -c wrangler.jsonc --env dev` lists `DATABASE_URL`. Deploys do not remove it, because `deploy-dev` does not touch secrets.

### Reset the dev branch (proposed policy, pending agreement)

1. In Neon, reset the branch `dev` to its parent (Neon console: Branches, `dev`, Reset from parent; or `neonctl branches reset dev --parent`).
2. The connection string host stays the same, so the dev Worker needs no redeploy. If the role is recreated, set `DATABASE_URL` again (step 2 above).
3. Check `curl -i <dev URL>/api/health` returns `200`, and that the parent branch was not changed.

## Cloudflare token (task 02, ops)

Token scope: Workers Scripts Edit on the SweetMemories account only. Token owner: TBD. Rotation date: TBD. Record owner and date here, never the values.

## Local

`pnpm build && pnpm start` runs the same Worker build locally on port 3000. `wrangler.jsonc` is passed with `-c` because Nitro's generated config cannot contain environments.
