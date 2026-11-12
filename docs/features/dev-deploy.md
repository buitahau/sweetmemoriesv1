# Feature: dev-deploy

**Status:** in progress
**Side:** backend (Worker build target, Wrangler config, deploy workflow, smoke check, Cloudflare account setup, infra docs; no app UI)

Tasks: [../tasks/dev-deploy/](../tasks/dev-deploy/) (01 to 05). ADRs: [0002](../adr/0002-host-on-cloudflare-workers.md), [0003](../adr/0003-ci-cd-github-actions.md). Open questions: [../decisions/ci-cd-deploy-to-cloudflare-dev-adr.md](../decisions/ci-cd-deploy-to-cloudflare-dev-adr.md), [../decisions/ci-cd-deploy-to-cloudflare-dev-feature.md](../decisions/ci-cd-deploy-to-cloudflare-dev-feature.md). Mockups: none.

## Goal

Every merge into `dev-v2` is deployed automatically to the dev Worker on Cloudflare, and testers can test the result at a stable dev URL.

## Summary and assumptions

- The dev environment starts on the Worker's `workers.dev` URL. Per-user subdomains and the cookie-free public origin are separate later features.
- Depends on ADR 0002 being accepted and on the [ci-pr-checks](ci-pr-checks.md) workflow.
- The dev environment holds synthetic test data only.
- The existing e2e suite supports `E2E_BASE_URL`, so testers can run it against dev.

## Scope

In scope: Worker build, `wrangler.jsonc`, `deploy-dev` workflow, post-deploy smoke check, Cloudflare token and GitHub Environment `dev`, docs.
Out of scope: production environment, custom domains, database code, automatic e2e runs against dev (open question).

## User stories

**US-deploy-1: Merge deploys to dev automatically**
- **Story:** As a tester, I want every merged PR to appear on the dev environment automatically, so that I can test the latest `dev-v2` without running it locally.
- **Scenarios:**
  1. *Happy path:* **Given** a PR with a green `ci` check, **When** it is squash-merged into `dev-v2`, **Then** a `deploy-dev` run starts for the merge commit and finishes `success` within 10 minutes.
  2. *Live on dev:* **Given** the `deploy-dev` run succeeded, **When** a tester opens the dev URL `/` in a browser with no cookies, **Then** the page returns `200` and shows the heading "SweetMemories home page".
  3. *Health on dev:* **Given** the `deploy-dev` run succeeded, **When** a client sends `GET <dev URL>/api/health`, **Then** the response is `200`, `application/json`, body exactly `{"status":"ok"}`, `Cache-Control` containing `no-store`, and no `Set-Cookie`.
  4. *Existing e2e on dev:* **Given** the `deploy-dev` run succeeded, **When** the tester runs `e2e/project-skeleton` with `E2E_BASE_URL=<dev URL>`, **Then** every US-skeleton-1 and US-skeleton-2 scenario passes, except US-skeleton-1.6 ("server stopped"), which only applies locally.
  5. *Traceable version:* **Given** a successful deploy, **When** a tester opens the `deploy-dev` run summary, **Then** it shows the deployed commit SHA, the dev URL and the Cloudflare version ID.
  6. *Unknown path on dev:* **Given** the app is deployed to dev, **When** a visitor opens `<dev URL>/does-not-exist`, **Then** the response is `404` with a "Page not found" message.

**US-deploy-2: Failed builds or tests never reach dev**
- **Story:** As a tester, I want the dev environment to keep the last good version when a deploy fails, so that my test session is not broken by a bad merge.
- **Scenarios:**
  1. *Tests fail after merge:* **Given** `dev-v2` at commit A is live on dev, **When** a merge creates commit B whose unit tests fail in `deploy-dev` (for example, after a semantic merge conflict), **Then** the run fails before the deploy step, and dev still serves commit A.
  2. *Deploy step fails:* **Given** commit A is live, **When** `wrangler deploy` for commit B fails (for example, an invalid token), **Then** the run is marked `failure`, the repo shows a red status on commit B, and dev still serves commit A.
  3. *Smoke check fails:* **Given** commit B deploys but `GET <dev URL>/api/health` does not return `200` `{"status":"ok"}` within 60 seconds, **When** the smoke step runs, **Then** the `deploy-dev` run is marked `failure` with the failing response in the log. Rollback follows the agreed policy (open question).
  4. *Manual rollback:* **Given** a bad version is live on dev, **When** a maintainer follows the rollback steps in `docs/infra/dev-environment.md`, **Then** dev serves the previous version and `/api/health` returns `200`.

**US-deploy-3: Merges in quick succession deploy in order**
- **Story:** As a tester, I want dev to always end on the newest `dev-v2` commit, so that I test what was actually merged last.
- **Scenarios:**
  1. *Two quick merges:* **Given** PR 1 and PR 2 are merged 30 seconds apart, **When** both `deploy-dev` runs finish, **Then** the runs did not deploy at the same time and dev serves PR 2's merge commit.
  2. *Manual re-run:* **Given** a `deploy-dev` run failed for an infra reason, **When** a maintainer re-runs it (or triggers `workflow_dispatch` on `dev-v2`), **Then** it deploys the current head of `dev-v2`.

**US-deploy-4: Deploy credentials and dev stay safe**
- **Story:** As a maintainer, I want deploy credentials scoped and hidden, and dev to contain no private data, so that the pipeline does not become a security hole.
- **Scenarios:**
  1. *Secrets masked:* **Given** a `deploy-dev` run, **When** anyone reads its full log, **Then** no Cloudflare API token, account secret or `DATABASE_URL` value appears.
  2. *Only `dev-v2` deploys:* **Given** a push to any branch other than `dev-v2` (for example `feat/x` or `main`), **When** the push lands, **Then** no `deploy-dev` run deploys.
  3. *Scoped token:* **Given** the Cloudflare API token used by CI, **When** it is inspected in the Cloudflare dashboard, **Then** its permissions are limited to editing Workers scripts on the SweetMemories account (no DNS, billing or other accounts).
  4. *No cookies on dev:* **Given** the app is deployed to dev, **When** a visitor opens `/` and `/api/health` on the dev URL, **Then** no cookies are set (same baseline as US-skeleton-1.3 and US-skeleton-2.4).
  5. *No internal data:* **Given** the app is deployed to dev, **When** a client fetches `/api/health`, **Then** the body has no environment names, secrets, hostnames or versions, only `status`.

## Acceptance criteria

- The app builds as a Cloudflare Worker (`cloudflare-module` preset) and runs locally with the same runtime via `pnpm start` (`wrangler dev`, port 3000). All existing unit and e2e tests pass on that build.
- `wrangler.jsonc` defines a `dev` environment (Worker `sweetmemories-dev`, `nodejs_compat`, pinned `compatibility_date`). No secrets are in the repo.
- A `deploy-dev` workflow runs on push to `dev-v2` (and on `workflow_dispatch`). It re-runs the checks, deploys with `wrangler deploy --env dev`, serialises runs, and fails if `GET /api/health` on the dev URL is not `200` `{"status":"ok"}`.
- The run summary shows the commit SHA, dev URL and Cloudflare version ID.
- A failed test, deploy or smoke step leaves the previous version live, or follows the agreed rollback policy.
- Secrets live only in the GitHub Environment `dev` and in Cloudflare. The token is scoped to Workers on one account.
- `docs/infra/dev-environment.md` covers the dev URL, how deploys happen, rollback, and how testers run e2e with `E2E_BASE_URL`. `e2e/README.md` and `docs/infra/local-development.md` reflect the new `pnpm start`.
