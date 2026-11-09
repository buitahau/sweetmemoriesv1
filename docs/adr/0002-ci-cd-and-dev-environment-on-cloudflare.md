# 0002: CI/CD and dev environment on Cloudflare

- Status: proposed (awaiting product-owner confirmation, see [Q001-Q004](../questions/questions-2026-11-09-requirement-breakdown.md))
- Date: 2026-11-09

## Context

- Product-owner requirement (2026-11-09): "Deployment (CI/CD) of this project to the Cloudflare environment. Goal: automate as much as possible, so that after an agent completes an implementation ticket and its PR is auto-merged, another agent can go to the dev env and verify the result."
- This is the follow-up that [Q005 of 2026-11-08](../questions/questions-2026-11-08-requirement-breakdown.md#q005-are-ci-and-a-dev-deployment-part-of-initialize-project) recommended ("raise CI + dev hosting as the next requirement, with its own ADR").
- The agent flow already exists in `.claude/skills/`: `implement-ticket` branches from and merges into `dev-v1`, checks `gh pr checks` before `gh pr merge --squash`; `implement-and-test-ticket` then waits for "CI and the dev deploy" (`gh run list --branch dev-v1`), reads the dev base URL from `docs/infra`, and spawns the `tester` agent. Today none of this can run: no CI, no deploy, no `dev-v1` branch, no dev URL.
- What will be deployed (from [ADR 0001](0001-monorepo-skeleton-and-tooling.md), still `proposed`): `apps/api` (Node 24, Express 5, TypeScript, `GET /api/health`) and `apps/web` (React 19 SPA built by Vite into `apps/web/dist`). No database, S3 or auth yet.
- `CLAUDE.md` security rule 1: public Memory pages must later be served from a separate origin without login cookies. Hosting must keep apps on separate origins and must not add cookies.
- Facts checked 2026-11-09:
  - Cloudflare Workers runs Node HTTP servers, including Express, through `httpServerHandler` from `cloudflare:node` with the `nodejs_compat` flag and a compatibility date on or after 2025-09-01 ([docs](https://developers.cloudflare.com/workers/runtime-apis/nodejs/http/), [blog, 2025-09-08](https://blog.cloudflare.com/bringing-node-js-http-servers-to-cloudflare-workers/)). `listen(port)` opens no real port; trailers, 1xx and socket access are not supported; "some middleware may not behave as expected".
  - With `nodejs_compat` and a compatibility date on or after 2025-04-01, Worker variables appear in `process.env` ([docs](https://developers.cloudflare.com/workers/runtime-apis/nodejs/process/)).
  - Workers static assets serve an SPA with `assets.not_found_handling: "single-page-application"` ([docs](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)).
  - Wrangler latest is `4.158.0` (`https://registry.npmjs.org/wrangler/latest`), needs Node >= 22. CI auth needs `CLOUDFLARE_API_TOKEN` (template "Edit Cloudflare Workers", scoped to one account) and `CLOUDFLARE_ACCOUNT_ID` ([docs](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)).

## Decision

| Concern | Choice |
|---|---|
| CI system | GitHub Actions (the agents already use `gh`). |
| CI workflow | `.github/workflows/ci.yml`, name `CI`, one job `verify`: `npm ci`, `npm run typecheck`, `npm test`, `npm run build` on Node from `.nvmrc`. Runs on `pull_request` to `dev-v1` and `main`. No secrets. |
| Required check | Branch `dev-v1` is protected: PR required, status check `verify` required, no force-push, no deletion, rules apply to admins too (so an agent's token cannot bypass). "Branch must be up to date" is **not** required: the deploy workflow re-runs every check on the merged commit. |
| Integration / deploy branch | `dev-v1` (as in the `implement-ticket` skill), created from `main` by a human after the design docs are merged into `main` (task [create-dev-branch](../tasks/ci-checks/create-dev-branch.md), [Q004](../questions/questions-2026-11-09-requirement-breakdown.md)). |
| Deploy trigger | `.github/workflows/deploy-dev.yml`, name `Deploy dev`, on `push` to `dev-v1` and `workflow_dispatch`. Never on `pull_request` (untrusted PR code must never see the Cloudflare token). `concurrency: group: deploy-dev-${{ github.ref }}`, `cancel-in-progress: false`: `dev-v1` runs never overlap and the newest pending commit always deploys; GitHub keeps one pending run per group, so a replaced intermediate run shows `cancelled`. Keying on the ref stops a dispatch from another branch from replacing a pending `dev-v1` run, without any `if:` in the job. GitHub environment `dev` holds the secrets and allows deployments from branch `dev-v1` only (a `workflow_dispatch` on another branch fails). |
| Hosting | Cloudflare Workers, free plan. Two Workers, two origins: `sweetmemories-api-dev` (Express via `httpServerHandler`) and `sweetmemories-web-dev` (static assets only, no Worker script). |
| Dev URLs | `workers.dev` subdomains: `https://sweetmemories-api-dev.<account-subdomain>.workers.dev`, `https://sweetmemories-web-dev.<account-subdomain>.workers.dev`. Custom domain later ([Q003](../questions/questions-2026-11-09-requirement-breakdown.md)). Real URLs are recorded in [infra/dev-environment.md](../infra/dev-environment.md) and as GitHub environment variables `DEV_API_URL`, `DEV_WEB_URL`. |
| Deploy tool | `wrangler` `^4` as a dev dependency of each app (version locked by `package-lock.json`), run with `npm run deploy:dev -w <app>`. Not `cloudflare/wrangler-action`, so CI and local use the same locked version. |
| Wrangler config | `wrangler.jsonc` in each app, `compatibility_date: "2026-10-01"`, `compatibility_flags: ["nodejs_compat"]` (API only), `workers_dev: true`. Change the date only by editing this row. |
| API Worker entry | New file `apps/api/src/worker.ts` wraps `createApp()` with `httpServerHandler`. `src/server.ts` (local Node) is unchanged. |
| Local Workers runtime | New app scripts `dev:worker` (`wrangler dev`) and `deploy:dev` (`wrangler deploy`) in `apps/api` and `apps/web`. Local ports: API Worker `8787`, web Worker `8788`, in addition to ADR 0001's `3000`, `5173`, `4173` ([local-development](../infra/local-development.md)). |
| Deployed-commit marker | API: new `GET /api/version` returns `{"commit":"<40-hex sha>"}` from Worker var `GIT_SHA` (`--var GIT_SHA:<sha>` at deploy), `"unknown"` when unset. Web: deploy writes `apps/web/dist/version.json` = `{"commit":"<sha>"}`. Contract: [api/version.md](../api/version.md). `GET /api/health` stays unchanged. |
| Web response headers | Deploy writes `apps/web/dist/_headers`: `X-Robots-Tag: noindex` on every path, `Cache-Control: no-store` on `/version.json`. |
| Post-deploy check | The deploy workflow ends with `scripts/wait-for-dev-deploy.sh <sha>` (both markers show the commit) and `scripts/smoke-dev.sh` (health, home page, no cookies). The run fails if either fails, so `gh run list` shows the truth. |
| Agent verification contract | An agent verifying merge commit `MERGE_SHA`: (1) get `MERGE_SHA` from the PR; (2) `gh run watch --exit-status` the `Deploy dev` run whose `headSha` is `MERGE_SHA` (wait up to 5 minutes for it to appear); (3) that run decides: `success` -> go on; `cancelled` -> a later merge replaced it, so watch the newest `dev-v1` run and apply this step to it (if that newest run fails, report "blocked by later merge" until [Q012](../questions/questions-2026-11-09-requirement-breakdown.md#q012-how-is-a-failure-of-the-newest-run-reported-after-the-tickets-own-run-was-cancelled) decides); `failure` or any other conclusion -> report a failed test, even if a later run succeeded; (4) `scripts/wait-for-dev-deploy.sh "$MERGE_SHA"` exits 0; (5) the `tester` runs the ticket's `e2e-test-suites` with `BASE_URL=$DEV_API_URL` for BE suites or `BASE_URL=$DEV_WEB_URL` for FE suites (open it in the browser). Exact commands: [infra/dev-environment.md](../infra/dev-environment.md#how-an-agent-verifies-a-ticket-on-dev). |
| Data stores | Neon, S3 and Better Auth stay as chosen in `CLAUDE.md`; Cloudflare hosts compute only. Their dev setup (Neon branch, bucket, secrets) gets its own ADR when first needed ([Q007](../questions/questions-2026-11-09-requirement-breakdown.md)). |
| Production | Not in this ADR ([Q006](../questions/questions-2026-11-09-requirement-breakdown.md)). |
| Rollback | Manual: `npx wrangler rollback` in the app folder, or revert the commit on `dev-v1`. No automatic rollback ([Q008](../questions/questions-2026-11-09-requirement-breakdown.md)). |

Details: [infra/ci-cd.md](../infra/ci-cd.md), [infra/dev-environment.md](../infra/dev-environment.md), [architecture/repository-layout.md](../architecture/repository-layout.md).

## Consequences

- Every merge into `dev-v1` gets a `Deploy dev` run that ends within its 20-minute job timeout and proves itself: both markers must show the commit within 180 s after the deploy steps, then the smoke test runs. This is what `implement-and-test-ticket` step 3 waits for. (No end-to-end duration is promised; GitHub queue time is outside the project's control.)
- Residual supply-chain risk: the Cloudflare token is step-scoped to the two deploy steps, so `npm ci` and the tests never read its value, but they run earlier in the same job and workspace. A malicious install script or test could modify `node_modules` (for example `wrangler`) and capture the token when the deploy step runs. PRs need 0 approvals and agents auto-merge, so the only gates are the reviewer agent, the lockfile (`npm ci`) and the narrow token (Workers on one account). Whether to split the workflow into a `build` job without the `dev` environment and a `deploy` job that only deploys is open: [Q011](../questions/questions-2026-11-09-requirement-breakdown.md#q011-split-deploy-dev-into-build-and-deploy-jobs-to-isolate-the-cloudflare-token). Until answered, this risk is accepted for a dev environment with no user data.
- A failed CI check blocks `gh pr merge`; a failed deploy or smoke shows as a failed `Deploy dev` run on the merge commit.
- Two merges close together: the second deploy may overwrite the first before the agent checks. The wait script accepts a deployed commit that is the target or a descendant of it.
- Three or more merges close together: runs never overlap, but GitHub replaces the pending run, so an intermediate commit gets a `cancelled` `Deploy dev` run and is never deployed on its own. Its code is still tested, as part of the newer commit (agent contract step 3).
- Re-running an older `Deploy dev` run would deploy older code over newer code; this is forbidden in [infra/ci-cd.md](../infra/ci-cd.md#how-to-change-it).
- Workers-runtime compatibility of the API is checked only after merge unless [Q009](../questions/questions-2026-11-09-requirement-breakdown.md#q009-check-workers-runtime-compatibility-before-merge) adds a pre-merge check.
- The API runs on the Workers runtime in dev but on Node locally. A route that works locally may fail on Workers (unsupported Node API or middleware). `npm run dev:worker -w apps/api` runs the Workers runtime locally to catch this before merge.
- Separate `workers.dev` hostnames keep API and web on separate origins (groundwork for rule 1). When the web app first calls the API (auth), CORS or same-origin routing must be decided in that ADR.
- Commit SHAs become publicly readable on dev ([Q005](../questions/questions-2026-11-09-requirement-breakdown.md)). No user data is exposed (rule 5).
- Cost: Workers free plan (100,000 requests/day) and GitHub Actions free minutes are enough for dev; no paid service is needed.
- Humans must do the one-time setup (Cloudflare account, token, GitHub environment, `dev-v1` protection); agents cannot.
- The `implement-and-test-ticket` skill (in `.claude/`, outside `docs/`) should call `scripts/wait-for-dev-deploy.sh` in its step 3; a human updates the skill (tracked as [Q010](../questions/questions-2026-11-09-requirement-breakdown.md#q010-who-updates-the-implement-and-test-ticket-skill-and-when)).

## Alternatives

| Option | Why not chosen |
|---|---|
| Cloudflare Pages for the web app | Cloudflare now steers new projects to Workers static assets; one product (Workers) for both apps is simpler for juniors. |
| Cloudflare Containers for the API (real Node 24 in Docker) | Runs Express unchanged, but needs the Workers Paid plan, a Dockerfile and container registry; slower cold starts. Fallback if Express on Workers breaks. |
| Rewrite the API in Hono (Workers-native) | Changes ADR 0001's framework choice for hosting reasons; Express on Workers is supported. |
| One Worker serving web assets and `/api/*` | Same origin, no CORS later, but couples two apps from ADR 0001 into one deployable. Revisit in the auth ADR. |
| Cloudflare Workers Builds (Git integration, no Actions) | Deploys without GitHub Actions, but CI checks would still need Actions; two systems to watch instead of one. |
| `cloudflare/wrangler-action@v4` | Fine, but its Wrangler version can differ from the locked local one. |
| Deploy previews per PR | Lets an agent test before merge, but the requirement is "after merge, on dev". Later. |
| Custom domain `dev.sweetmemories.com` now | Needs the zone on Cloudflare DNS (unknown, [Q003](../questions/questions-2026-11-09-requirement-breakdown.md)). |
| Protect dev with Cloudflare Access | Hides dev from the public but the tester agent then needs a service token ([Q005](../questions/questions-2026-11-09-requirement-breakdown.md)). |

## Features

- [ci-checks](../features/ci-checks.md): the `dev-v1` branch, the `CI` workflow on every PR, and `dev-v1` protection.
- [dev-deploy](../features/dev-deploy.md): Cloudflare setup, API and web Worker configs, `Deploy dev` workflow.
- [dev-deploy-verification](../features/dev-deploy-verification.md): deployed-commit markers, wait script, smoke script, agent verification contract.
