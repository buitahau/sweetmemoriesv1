# E2E tests

Python Playwright + pytest, one folder per feature (see the `e2e-from-user-stories` skill).

```
python3 -m venv .venv-e2e && .venv-e2e/bin/pip install playwright pytest pyyaml axe-playwright-python "psycopg[binary]"
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

`e2e/dev-test-database` reads the Neon dev branch (GET requests only) when `NEON_API_KEY` and `NEON_PROJECT_ID` are set (add `NEON_DEV_ROLE`, the role name, for the least-privilege check), and the Worker secret when `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set. Without them those scenarios skip as BLOCKED. A Neon API key can change the project even though this suite only reads, so use a project-scoped key and keep it out of the repo and CI logs. The ops steps themselves (task 01, task 02 secret) are done by a maintainer.

`e2e/google-sign-in` holds the checks per task (run with `.venv-e2e/bin/pytest e2e/google-sign-in -rs`):

- Task 01: workflow, `.env.example`, docs, env typing (static).
- Task 02: database access layer (static plus a `/api/health` request to `E2E_BASE_URL` or localhost:3000).
- Task 03: auth schema and first migration (static, plus the live check `test_T03_V1c`: runs `pnpm db:migrate` twice against an empty Neon developer branch; set `E2E_NEON_BRANCH_URL=<branch connection string>` and `E2E_ALLOW_MIGRATE=1`, never a production or shared database; skips as BLOCKED without the URL).
- Task 04: Better Auth route (static plus live `/api/auth/*`; live cases skip as BLOCKED without auth config; for the 503 path (`-k T04_V3`) run `pnpm start` without auth vars). Maintainer steps (Google Cloud, GitHub Environment, `wrangler secret list`) skip as BLOCKED.
- Task 06: `test_google_sign_in_task06_login_page_ui.py` (US-google-sign-in-1.1 to 1.7; needs `axe-playwright-python`; run with `with_server.py` as above).
- Task 07: `test_google_sign_in_task07_google_button_states.py` (US 2.1 to 2.4 and 4.1 to 4.4, plus the bfcache reset; needs a configured auth server, otherwise BLOCKED; set `E2E_SITE_URL` if the server's SITE_URL differs from `E2E_BASE_URL`).
- Task 08: `test_google_sign_in_task08_redirect_signed_in.py` (US 5.1 manual-cookie variant via `E2E_SESSION_COOKIE=name=value`, and 5.2).
- Task 10: `test_google_sign_in_task10_signed_in.py` (US 3.3, 3.4, 5.1, 6.1, 6.2 and the `getSession` cookie-format check; 3.1 and 3.2 are manual on dev, ADR 0009). `test_US_google_sign_in_3_3_dev_cookie_attributes` runs only with `E2E_BASE_URL` set to the https dev URL and checks the cookie attributes local http runs cannot see (`Secure`, `__Secure-` prefix) and `test_google_sign_in_task10_seed_helper.py` (unit checks of the helper, no server).

### Session seeding (task 10)

The seeded scenarios use `helpers.seed_signed_in_session`, which inserts a User, Account and Session and signs the cookie. Env vars (scenarios skip as BLOCKED without them):

- `E2E_SEED_DATABASE_URL`: your own Neon developer branch. The server talks Neon's SQL-over-HTTP protocol, so a plain local Postgres only works behind a local Neon HTTP proxy; a database on a local host such as localhost is accepted without the allow-list.
- `E2E_SEED_NEON_ENDPOINT`: that branch's `ep-...` endpoint id.
- `E2E_BETTER_AUTH_SECRET` (or `BETTER_AUTH_SECRET`): must equal the server's secret.

Run against `pnpm start` with the same `DATABASE_URL` and secret. The helper refuses a non-local `E2E_BASE_URL` and any non-local database that is not a Neon one with the allow-listed endpoint id (Neon hostnames never contain the branch name, so the allow-list is the only reliable guard against the dev or production database).

`e2e/dashboard-home` has one test per US-dashboard-home scenario (1.1 to 3.3) plus the task 01 check that the dashboard carries only the first name. Run it with `.venv-e2e/bin/pytest e2e/dashboard-home -rs` against `pnpm start`. Signed-in scenarios use the task 10 session seeding above and skip as BLOCKED without it. 3.3 adds a second Session through `helpers.add_seeded_session`. Until dashboard-home tasks 02 and 03 deliver the Sign out button, the Sign out check in 1.1 and scenarios 3.1 to 3.3 skip as BLOCKED. Set `SIGN_OUT_DELIVERED = True` in `test_dashboard_home.py` once they land.

`e2e/homepage-seo` holds the checks per task (run with `.venv-e2e/bin/pytest e2e/homepage-seo -rs` against `pnpm build && pnpm start`, or `E2E_BASE_URL=<dev URL>`):

- Task 01: `test_homepage_seo_task01_site_config.py` (`SITE_INDEXABLE` and `getSiteConfig`: static config and docs checks, a `wrangler deploy --dry-run` of the built Worker, the helper's Vitest suites, and live `/` checks; `test_T01_V3c` skips as BLOCKED until task 03 renders the robots and canonical tags). The per-scenario suite with `E2E_SEO_PROFILE` comes with task 04.
- Task 02: `test_homepage_seo_task02_static_assets.py` (US-homepage-seo-2.3 and 4.2 to 4.4: OG image, icons, manifest and `favicon.ico` are served with the right type, size and `Cache-Control` and no `Set-Cookie`; plus `T02_V3`, the cache values from `public/_headers`). Public, no cookies.
- Task 03: `test_homepage_seo_task03_home_head_tags.py` (one test per head-tag scenario: US-homepage-seo-1.1 to 1.3, 2.1, 2.2, 2.4, 2.5, 3.1 to 3.6, 4.1, 5.1, 5.2; raw HTML, except 3.6 which compares the hydrated DOM with the raw HTML). The server config is fixed per run, so declare it with `E2E_SEO_PROFILE`; scenarios of another profile skip with the reason:

  | Profile | Server config | Profile-only scenarios |
  | --- | --- | --- |
  | `dev` (default) | dev values, or local `SITE_URL=<E2E_BASE_URL>`, `SITE_INDEXABLE=false` | 2.4, 3.2 |
  | `prod-like` | `SITE_URL=https://sweetmemories.com`, `SITE_INDEXABLE=true` | 2.1, 2.2, 3.1, 3.5, 5.1 |
  | `unset-indexable` | `SITE_INDEXABLE` unset | 3.3 |
  | `bad-url` | `SITE_URL=not-a-url` | 3.4 |
  | `path-url` | `SITE_URL=https://sweetmemories.com/path`, `SITE_INDEXABLE=true` | 3.4 (reduced to origin) |

  The built Worker takes overrides with `--var` (it cannot unset a var, so run `unset-indexable` under `pnpm dev` without `SITE_INDEXABLE` in the environment or `.env`):

  ```
  pnpm build
  pnpm exec wrangler dev -c .output/server/wrangler.json --port 3100 \
    --var SITE_URL:https://sweetmemories.com --var SITE_INDEXABLE:true &
  E2E_BASE_URL=http://localhost:3100 E2E_SEO_PROFILE=prod-like .venv-e2e/bin/pytest e2e/homepage-seo -rs
  ```

  `with_server.py` may leave the `workerd` child of `wrangler dev` running; check the port is free before the next profile.
