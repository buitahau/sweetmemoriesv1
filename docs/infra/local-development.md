# Local development

Status: current.

Decided in [ADR 0001](../adr/0001-monorepo-skeleton-and-tooling.md).

## What

How to install, run, test and build the skeleton (`apps/api`, `apps/web`) on a developer machine.

## Where it runs

Local machine only. No CI, cloud deploy, Neon, S3 or Better Auth yet ([Q005](../questions/questions-2026-11-08-requirement-breakdown.md)).

| App | URL | Command (from repo root) |
|---|---|---|
| API | `http://localhost:3000` | `npm run dev -w apps/api` |
| Web (dev) | `http://localhost:5173` | `npm run dev -w apps/web` |
| Web (preview of build) | `http://localhost:4173` | `npm run preview -w apps/web` |
| Both | as above | `npm run dev` |
| API on the Workers runtime | `http://localhost:8787` | `npm run dev:worker -w apps/api` |
| Web build on the Workers runtime (planned, [add-web-worker](../tasks/dev-deploy/add-web-worker.md)) | `http://localhost:8788` | `npm run build -w apps/web && npm run dev:worker -w apps/web` |

The deployed dev environment is described in [dev-environment](dev-environment.md); pipelines in [ci-cd](ci-cd.md).

## Prerequisites

- Node 24 (`.nvmrc`); npm that ships with it.

## Commands (repo root)

| Command | Does |
|---|---|
| `npm install` | Installs all workspaces. |
| `npm run dev` | Starts API and web together (`concurrently`, prefixes `api` and `web`). |
| `npm run build` | Builds every workspace (`apps/api/dist`, `apps/web/dist`). |
| `npm test` | Runs Vitest once in every workspace. |
| `npm run typecheck` | Type-checks every workspace, including test files (api: `tsc -p tsconfig.test.json`; web: `tsc -b`). |
| `npm start -w apps/api` | Runs the built API (`node dist/server.js`). |

## Config / env vars

| Name | App | Default | Rule |
|---|---|---|---|
| `PORT` | api | `3000` | Integer 1-65535. Anything else: log `Invalid PORT: <value>` and exit with code 1. |

No secrets are needed for the skeleton. `.env` files are git-ignored.

## Base branch

Checks that say "only these files changed" compare against `$BASE_BRANCH`:

```sh
export BASE_BRANCH=origin/dev-v1
git fetch origin
git diff --name-only "$BASE_BRANCH"...HEAD          # list changed files
git diff "$BASE_BRANCH"...HEAD -- README.md         # diff of one file
```

Rules:
- Always use the three-dot (merge-base) form `"$BASE_BRANCH"...HEAD`. It shows only what the task branch changed since it split off, even if the base branch moved on. The two-dot form `git diff "$BASE_BRANCH"` would also list files changed on the base branch.
- The three-dot form compares commits, so commit all work before running a check; uncommitted changes are not listed.
- The design docs (ADR 0001, its features, tasks and `docs/questions/`) must already be merged into `$BASE_BRANCH` before the first implementation branch is created. Otherwise every design doc shows up as "changed". Today they exist only on `mainv1`.

`origin/dev-v1` is the integration branch ([ADR 0002](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md), [Q004 of 2026-11-09](../questions/questions-2026-11-09-requirement-breakdown.md#q004-is-dev-v1-the-integration-and-deploy-branch)). Every implementation branch starts from `origin/dev-v1`. When it changes, update only this section.

## How to change it

- Port or Node version: edit this doc and ADR 0001 in the same change as the code.
