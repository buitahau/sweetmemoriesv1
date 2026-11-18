# Local development

How to run, build and test SweetMemories on your machine. Tool choices are in [ADR 0001](../adr/0001-single-tanstack-start-app.md).

## Prerequisites

- Node.js 24.x (developed on v24.14.1).
- pnpm 10.x (`npm i -g pnpm@10`; `package.json` does not pin it yet).
- `jq` (unit tests evaluate the branch protection predicate with it).
- For e2e tests only: Python 3 with `venv`.

No database, S3 or Google credentials are needed yet; the skeleton has none of them.

## Local database (for the first DB feature)

Nothing reads `DATABASE_URL` yet. When DB code arrives, point your `.env` `DATABASE_URL` (see `.env.example`) at your own Neon branch or a local Postgres. Never use the dev Worker's database locally: dev uses the shared Neon branch `dev` (see [dev-environment.md](dev-environment.md)).

## Google sign-in settings (for the auth features)

Nothing reads these yet either. Copy `.env.example` to `.env` and fill in:

| Key | Local value |
| --- | --- |
| `DATABASE_URL` | your own database (see above) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | a Google Cloud OAuth client whose authorized redirect URI is `http://localhost:3000/api/auth/callback/google` (scopes `openid email profile`) |
| `BETTER_AUTH_SECRET` | a separate random value, not the dev one (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | `http://localhost:3000` |

`.env` is gitignored; never commit real values. `pnpm dev` loads `.env` through Vite. `wrangler dev` (`pnpm start`) takes local secrets from `.dev.vars` and, when no `.dev.vars` file exists, from `.env` (Cloudflare documents this; with `--env dev` it first looks for `.dev.vars.dev` / `.env.dev`). Keep a single `.env` and do not create a `.dev.vars`, so both commands see the same keys. Not yet verified against a running `wrangler dev`: check it when the first auth code reads these values.

## Install

```
pnpm install
```

## Run

| Goal | Command | Notes |
| --- | --- | --- |
| Dev server | `pnpm dev` | http://localhost:3000, hot reload; runs the default Nitro dev server, not the Worker runtime |
| Production build | `pnpm build` | writes `.output/` |
| Run the build | `pnpm start` | `wrangler dev` on http://localhost:3000 (same Worker runtime as the Cloudflare dev environment), run `pnpm build` first |

Check Worker-runtime behavior (`nodejs_compat`, bindings) with `pnpm build && pnpm start`, not `pnpm dev`.

## Check it works

- `http://localhost:3000/` shows the heading "Every little moment deserves a home.".
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
