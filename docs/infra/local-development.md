# Local development

How to run, build and test SweetMemories on your machine. Tool choices are in [ADR 0001](../adr/0001-single-tanstack-start-app.md).

## Prerequisites

- Node.js 24 (developed on v24.14.1; use the current LTS or newer).
- pnpm 10 (`corepack enable` or `npm i -g pnpm`).
- For e2e tests only: Python 3 with `venv`.

No database, S3 or Google credentials are needed yet; the skeleton has none of them.

## Install

```
pnpm install
```

## Run

| Goal | Command | Notes |
| --- | --- | --- |
| Dev server | `pnpm dev` | http://localhost:3000, hot reload |
| Production build | `pnpm build` | writes `.output/` |
| Run the build | `pnpm start` | http://localhost:3000, run `pnpm build` first |

## Check it works

- `http://localhost:3000/` shows the heading "SweetMemories home page".
- `http://localhost:3000/api/health` returns `{"status":"ok"}`:

```
curl -i http://localhost:3000/api/health
```

## Quality checks

| Goal | Command |
| --- | --- |
| Lint | `pnpm lint` |
| Type-check | `pnpm typecheck` |
| Format | `pnpm format` |
| Unit tests (Vitest) | `pnpm test` |

### Run a single test

```
pnpm test src/server/health.test.ts            # one file
pnpm test -t "name of the test"                # by test name
pnpm test src/server/health.test.ts -t "name"  # both
```

## E2E tests

Python Playwright + pytest, in `e2e/<feature>/`. Full steps in [e2e/README.md](../../e2e/README.md). Summary:

```
python3 -m venv .venv-e2e && .venv-e2e/bin/pip install playwright pytest
.venv-e2e/bin/playwright install chromium
pnpm build
python .claude/skills/webapp-testing/scripts/with_server.py --server "pnpm start" --port 3000 -- \
  .venv-e2e/bin/pytest e2e/project-skeleton
```

Run a single e2e test: append `-k "test_name"` to the pytest command. Set `E2E_BASE_URL` to target another local or dev URL. Never run against production.
