# E2E tests

Python Playwright + pytest, one folder per feature (see the `e2e-from-user-stories` skill).

```
python3 -m venv .venv-e2e && .venv-e2e/bin/pip install playwright pytest pyyaml
.venv-e2e/bin/playwright install chromium
pnpm build
python3 .claude/skills/webapp-testing/scripts/with_server.py --server "pnpm start" --port 3000 -- \
  .venv-e2e/bin/pytest e2e/project-skeleton
```

Set `E2E_BASE_URL` to target another local or dev URL. Never run against production.

`e2e/ci-pr-checks` has no browser: it checks the workflow file, reproduces failing inputs locally and reads branch protection with `gh api` (needs `gh` signed in). Run it with `.venv-e2e/bin/pytest e2e/ci-pr-checks`.
