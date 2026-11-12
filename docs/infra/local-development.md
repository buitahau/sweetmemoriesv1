# Local development

How to run, build and test SweetMemories on your machine. Tool choices are in [ADR 0001](../adr/0001-single-tanstack-start-app.md).

## Prerequisites

- Node.js 24.x (developed on v24.14.1).
- pnpm 10.x (`npm i -g pnpm@10`; `package.json` does not pin it yet).
- `jq` (unit tests evaluate the branch protection predicate with it).
- For e2e tests only: Python 3 with `venv`.

No database, S3 or Google credentials are needed yet; the skeleton has none of them.

## Install

```
pnpm install
```

## Run

| Goal | Command | Notes |
| --- | --- | --- |
| Dev server | `pnpm dev` | http://localhost:3000, hot reload; runs the default Nitro dev server, not the Worker runtime |
| Production build | `pnpm build` | writes `.output/` |
| Run the build | `pnpm start` | `wrangler dev` on http://localhost:3000 (same Worker runtime as dev), run `pnpm build` first |

Check Worker-runtime behavior (`nodejs_compat`, bindings) with `pnpm build && pnpm start`, not `pnpm dev`.

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

Python Playwright + pytest, in `e2e/<feature>/`. Setup and the full command are in [e2e/README.md](../../e2e/README.md).

Run a single e2e test: append `-k "test_name"` to the pytest command. Set `E2E_BASE_URL` to target another local or dev URL. Never run against production.
