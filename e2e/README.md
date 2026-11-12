# E2E tests

Python Playwright + pytest, one folder per feature (see the `e2e-from-user-stories` skill).

```
python3 -m venv .venv-e2e && .venv-e2e/bin/pip install playwright pytest pyyaml
.venv-e2e/bin/playwright install chromium
pnpm build
python3 .claude/skills/webapp-testing/scripts/with_server.py --server "pnpm start" --port 3000 -- \
  .venv-e2e/bin/pytest e2e/project-skeleton
```

`pnpm start` runs the built Cloudflare Worker with `wrangler dev` on port 3000. Set `E2E_BASE_URL` to target another local or dev URL (see [dev-environment](../docs/infra/dev-environment.md)). Never run against production.

`e2e/ci-pr-checks` has no browser: it checks the workflow file, reproduces failing inputs locally and reads branch protection with `gh api` (needs `gh` signed in). Run it with `.venv-e2e/bin/pytest e2e/ci-pr-checks`.

`e2e/dev-deploy` checks the deploy workflow, the real smoke script (against a throwaway local server), the deployed app at `E2E_BASE_URL` and, read-only, past `deploy-dev` runs via `gh`. Scenarios that need a real merge, a broken deploy or the Cloudflare dashboard are skipped as BLOCKED. Run it like the skeleton suite: `.venv-e2e/bin/pytest e2e/dev-deploy -rs`.
