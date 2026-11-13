# Feature: dev-test-database

**Status:** in progress
**Side:** backend (Neon branch provisioning, Worker secret binding, env documentation; no app UI and no DB code)

Tasks: [../tasks/dev-test-database/](../tasks/dev-test-database/) (01 to 03). ADR: [0004](../adr/0004-neon-dev-branch-test-database.md). Open questions: [../decisions/ci-cd-deploy-to-cloudflare-dev-adr.md](../decisions/ci-cd-deploy-to-cloudflare-dev-adr.md), [../decisions/ci-cd-deploy-to-cloudflare-dev-feature.md](../decisions/ci-cd-deploy-to-cloudflare-dev-feature.md). Mockups: none.

## Goal

The dev environment is connected to a dedicated test database (a Neon dev branch), isolated from local and future production databases, ready for the first DB feature.

## Summary and assumptions

- The app has no database code yet. This feature provisions the database and wires the connection secret into the dev Worker. No ORM, schema or migrations are added.
- Depends on [dev-deploy](dev-deploy.md) (secret binding) and ADR 0004 being accepted.
- The dev environment holds synthetic test data only, never real user data.

## Scope

In scope: Neon `dev` branch and non-owner role, `DATABASE_URL` Worker secret, `.env.example`, docs, reset steps (if a reset policy is agreed).
Out of scope: DB code, schema, migrations, seed scripts.

## User stories

**US-devdb-1: Dev has its own test database**
- **Story:** As a tester, I want the dev environment to use a shared test database, so that what I test on dev does not depend on any developer's local data and never touches production data.
- **Scenarios:**
  1. *Branch exists:* **Given** the Neon project for SweetMemories, **When** a maintainer lists its branches, **Then** a branch named `dev` exists, separate from the project's main (future production) branch.
  2. *Bound to dev Worker:* **Given** the dev Worker `sweetmemories-dev`, **When** a maintainer runs `wrangler secret list --env dev` after a deploy, **Then** `DATABASE_URL` is listed, and its value points to the Neon `dev` branch host (checked in the Neon dashboard, not printed in CI).
  3. *Not local:* **Given** a developer's local `.env`, **When** it is compared with the dev Worker secret, **Then** they point to different databases, and `.env.example` documents `DATABASE_URL` with no real value.
  4. *Survives deploys:* **Given** `DATABASE_URL` is set on the dev Worker, **When** a new merge deploys to dev, **Then** the secret is still present afterwards (the deploy re-applies it from the GitHub Environment `dev` secret).

**US-devdb-2: Database credentials are never exposed**
- **Story:** As a maintainer, I want the test database credentials kept out of the repo, logs and responses, so that nobody can reach the database from public output.
- **Scenarios:**
  1. *Not in repo:* **Given** the repository at the head of `dev-v2`, **When** anyone searches it for `neon.tech` connection strings or passwords, **Then** none are found.
  2. *Not in logs:* **Given** any `ci` or `deploy-dev` run, **When** its log is read, **Then** no `DATABASE_URL` value appears.
  3. *Not in responses:* **Given** the app is deployed to dev, **When** a client fetches `/` and `/api/health`, **Then** neither response contains the database host, user or password.
  4. *Least privilege:* **Given** the Neon role used in the dev `DATABASE_URL`, **When** it is inspected, **Then** it has access only to the dev branch database and is not the Neon project owner role.

**US-devdb-3: Testers can reset the test database (only if a reset policy is agreed)**
- **Story:** As a tester, I want a documented way to reset the test database, so that I can start a test session from a known state.
- **Scenarios:**
  1. *Reset:* **Given** the Neon `dev` branch contains test data, **When** a maintainer follows the reset steps in `docs/infra/dev-environment.md`, **Then** the `dev` branch is restored from its parent and the dev Worker keeps working without a redeploy (`/api/health` returns `200`).
  2. *Production untouched:* **Given** a reset of the `dev` branch, **When** it completes, **Then** the parent (production) branch is unchanged.

## Acceptance criteria

- A Neon `dev` branch exists and is used only by the dev Worker, through the Worker secret `DATABASE_URL`, with a non-owner role.
- No connection string is in the repo, CI logs or HTTP responses. `.env.example` lists `DATABASE_URL` with no value.
- The secret survives deploys.
- `docs/infra/dev-environment.md` documents which database dev uses, who can access it, and (if agreed) how to reset it.
- No ORM, schema, migration or DB-reading code is added. The first DB feature adds those against this branch.
