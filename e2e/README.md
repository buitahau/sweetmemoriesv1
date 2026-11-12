# E2E tests

Python Playwright + pytest, one folder per feature (see the `e2e-from-user-stories` skill).

```
python3 -m venv .venv-e2e && .venv-e2e/bin/pip install playwright pytest pyyaml
.venv-e2e/bin/playwright install chromium
pnpm build
python3 .claude/skills/webapp-testing/scripts/with_server.py --server "pnpm start" --port 3000 -- \
  .venv-e2e/bin/pytest e2e/project-skeleton
```

`pnpm start` runs the built Cloudflare Worker with `wrangler dev` on port 3000. Set `E2E_BASE_URL` to target another local or dev URL (`e2e/dev-deploy` requires it, see below) (see [dev-environment](../docs/infra/dev-environment.md)). Never run against production.

`e2e/ci-pr-checks` has no browser: it checks the workflow file, reproduces failing inputs locally and reads branch protection with `gh api` (needs `gh` signed in). Run it with `.venv-e2e/bin/pytest e2e/ci-pr-checks`.

`e2e/dev-deploy` checks the deploy workflow, the real smoke script (against a throwaway local server), the deployed app at `E2E_BASE_URL` and, read-only, past `deploy-dev` runs via `gh`. Scenarios that need a real merge, a broken deploy or the Cloudflare dashboard are skipped as BLOCKED. Run it with `E2E_BASE_URL=<dev URL> .venv-e2e/bin/pytest e2e/dev-deploy -rs` (the dev URL is `sweetmemories-dev.<account>.workers.dev`, see [dev-environment](../docs/infra/dev-environment.md)). The deployed-app scenarios skip as BLOCKED when `E2E_BASE_URL` is unset or points at a local address, so local passes are not mistaken for dev evidence; set `E2E_ALLOW_LOCAL=1` to opt in to running them against a local `pnpm start`. Any other host that is not a `*.workers.dev` URL containing `sweetmemories-dev` fails the run (never production).

`e2e/dev-test-database` checks the repo, docs, deployed app and past run logs for the test database feature (no `DATABASE_URL` leak, `.env.example`, reset docs). Scenarios needing the Neon dashboard or Cloudflare credentials skip as BLOCKED. Run it with `E2E_BASE_URL=<dev URL> .venv-e2e/bin/pytest e2e/dev-test-database -rs` (same dev URL rules as `e2e/dev-deploy`).

## dev-test-database: optional ops checks

`e2e/dev-test-database` verifies the Neon dev branch read-only when `NEON_API_KEY` and `NEON_PROJECT_ID` are set (add `NEON_DEV_ROLE`, the role name, for the least-privilege check), and the Worker secret when `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set. Without them those scenarios skip as BLOCKED. The ops steps themselves (task 01, task 02 secret) are done by a maintainer.
