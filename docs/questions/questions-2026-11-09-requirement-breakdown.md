# Questions: requirement-breakdown

Session 2026-11-09. Requirement: "Deployment (CI/CD) of this project to the Cloudflare environment. Goal: automate as much as possible, so that after an agent completes an implementation ticket and its PR is auto-merged, another agent can go to the dev env and verify the result." Design: [ADR 0002](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md).

## Q001: Does this requirement approve writing CI/CD and deploy config now?

- Feature: ci-checks
- Status: open
- Asked: 2026-11-09
- Blocks: every task of ci-checks, dev-deploy and dev-deploy-verification

**Question**: `CLAUDE.md` "Project state" still says no application code until the design is approved, and the skeleton itself waits on [Q001 of 2026-11-08](questions-2026-11-08-requirement-breakdown.md#q001-does-this-requirement-approve-writing-skeleton-code-during-the-design-phase). This requirement adds workflow files, Wrangler configs, two shell scripts, a Worker entry and one small endpoint (`GET /api/version`). Is that approved once the skeleton is approved, and does ADR 0002 become `accepted`?

**Options**
1. A: Yes, approved together with the skeleton; a human updates `CLAUDE.md` "Project state" to mention ADR 0002. (recommended)
2. B: Approve CI only (ci-checks), deploy later.
3. C: Wait for full design approval.

**Default if unanswered**: Do not start; all tasks stay `not-started`.

**Answer**: A

---

## Q002: Confirm Cloudflare Workers for both apps, and who owns the Cloudflare account

- Feature: dev-deploy
- Status: open
- Asked: 2026-11-09
- Blocks: provision-cloudflare-dev

**Question**: ADR 0002 picks Cloudflare Workers (free plan) for both apps: the API runs Express through `httpServerHandler` (supported since 2025-09), the web app as static assets. The alternative for the API is Cloudflare Containers (real Node in Docker, Workers Paid plan, about USD 5/month plus usage). Does a SweetMemories Cloudflare account exist, who owns it, and is the free plan acceptable?

**Options**
1. A: Workers free plan for both; the product owner creates or owns the account and does the one-time setup task. (recommended: zero cost, no Docker)
2. B: Workers for web, Containers for the API (closest to local Node; paid plan).
3. C: Someone else owns the account (name them).

**Default if unanswered**: Option A; provision-cloudflare-dev waits for a named account owner.

**Answer**: _(human fills in)_

---

## Q003: Dev URLs on workers.dev, or a custom domain?

- Feature: dev-deploy
- Status: open
- Asked: 2026-11-09
- Blocks: nothing, using default below

**Question**: Custom dev hostnames (e.g. `api.dev.sweetmemories.com`) need `sweetmemories.com` as a zone on Cloudflare DNS. It is unknown whether the domain is owned and where its DNS is. User subdomains (`john.sweetmemories.com`) and the cookie-less Memory origin (rule 1) will need the zone later anyway.

**Options**
1. A: `workers.dev` now (`sweetmemories-api-dev.<sub>.workers.dev`, `sweetmemories-web-dev.<sub>.workers.dev`); custom domains in the ADR that adds the public Memory server. (recommended)
2. B: Custom domain now (needs the zone moved to Cloudflare first).

**Default if unanswered**: Option A.

**Answer**: _(human fills in)_

---

## Q004: Is `dev-v1` the integration and deploy branch?

- Feature: ci-checks
- Status: open
- Asked: 2026-11-09
- Blocks: create-dev-branch (and so every later ci-checks and dev-deploy task)

**Question**: The `implement-ticket` skill merges into `dev-v1`, but that branch does not exist (the repo has `main`, `mainv1`, `devv1`; this session runs on `devv1`). [Q007 of 2026-11-08](questions-2026-11-08-requirement-breakdown.md#q007-which-branch-is-the-integration-base-for-diff-checks) is still open. Which branch should deploy to dev, and from which commit should it be created?

**Options**
1. A: Create `dev-v1` from `main` after the design docs are merged into `main`; deploy on push to `dev-v1`; set `BASE_BRANCH=origin/dev-v1` in `local-development.md`. (recommended: matches the skills)
2. B: Use the existing `devv1` branch and update the skills (human edit in `.claude/`).
3. C: Another branch (name it).

**Default if unanswered**: Option A.

**Answer**: _(human fills in)_

---

## Q005: Should dev be public, and may it show the commit SHA?

- Feature: dev-deploy-verification
- Status: open
- Asked: 2026-11-09
- Blocks: nothing, using default below

**Question**: On `workers.dev` the dev apps are reachable by anyone who knows the URL. `GET /api/version` and `/version.json` expose the deployed commit SHA. Protecting dev with Cloudflare Access would hide it but the tester agent would then need a service token (more secrets, more setup).

**Options**
1. A: Public, `noindex`, no real data; SHA visible. (recommended for a skeleton with no user data)
2. B: Cloudflare Access in front of dev, service token for agents.

**Default if unanswered**: Option A. Revisit before real User data or Photos reach dev.

**Answer**: _(human fills in)_

---

## Q006: When is production in scope?

- Feature: dev-deploy
- Status: open
- Asked: 2026-11-09
- Blocks: nothing, using default below

**Question**: The requirement names only the dev environment. Production needs its own trigger (merge to `main`? manual approval?), domain, and data stores.

**Options**
1. A: Later, as its own requirement and ADR. (recommended)
2. B: Now: deploy `main` to production Workers with a required reviewer on a `production` environment.

**Default if unanswered**: Option A.

**Answer**: _(human fills in)_

---

## Q007: Does "the Cloudflare environment" also mean Cloudflare data services (D1, R2) instead of Neon and S3?

- Feature: dev-deploy
- Status: open
- Asked: 2026-11-09
- Blocks: nothing, using default below

**Question**: `CLAUDE.md` fixes Neon (Postgres) and S3. Cloudflare offers R2 (S3-compatible, no egress fees) and Hyperdrive (pooled Postgres access to Neon). Changing stores would contradict the chosen stack, so ADR 0002 keeps them and hosts only compute on Cloudflare.

**Options**
1. A: Keep Neon and S3; decide Hyperdrive and the dev database/bucket in the ADR that adds them. (recommended: no stack change)
2. B: Evaluate R2 instead of S3 when Photo upload is designed (stack change, needs its own ADR).

**Default if unanswered**: Option A.

**Answer**: _(human fills in)_

---

## Q008: Roll back automatically when the post-deploy smoke test fails?

- Feature: dev-deploy-verification
- Status: open
- Asked: 2026-11-09
- Blocks: nothing, using default below

**Question**: If smoke fails, dev keeps the broken version until the next fix is merged. Automatic `wrangler rollback` would restore the previous version but hides the failure from the verifying agent, which then tests old code.

**Options**
1. A: No automatic rollback; the run fails, the agent reports the failure and the fix loop starts. (recommended for dev)
2. B: Roll back automatically, then fail the run.

**Default if unanswered**: Option A.

**Answer**: _(human fills in)_

---

## Q009: Check Workers-runtime compatibility before merge?

- Feature: dev-deploy
- Status: open
- Asked: 2026-11-09
- Blocks: nothing, using default below

**Question**: ADR 0002 accepts that Express code that works on Node may fail on the Workers runtime. Today that is found only after merge, when `Deploy dev` fails, and dev stays broken for every agent until a fix is merged. `npx wrangler deploy --dry-run` bundles the Worker without secrets or an account, so it could run in the CI `verify` job on every PR. A `wrangler dev` health probe in CI would catch runtime errors too, but adds about a minute per PR and a background process.

**Options**
1. A: Add `npx wrangler deploy --dry-run` for `apps/api` and `apps/web` to `verify` (no secrets), as a new task in dev-deploy after add-api-worker and add-web-worker; no runtime probe yet. (recommended: cheap, catches bundling and import errors)
2. B: A plus a `wrangler dev` probe of `/api/health` in CI (catches runtime errors; slower, more moving parts).
3. C: Nothing before merge; rely on `npm run dev:worker` locally and the post-deploy smoke test.

**Default if unanswered**: Option C for now (current design); no task is created until the answer is A or B.

**Answer**: _(human fills in)_

---

## Q010: Who updates the implement-and-test-ticket skill, and when?

- Feature: dev-deploy-verification
- Status: open
- Asked: 2026-11-09
- Blocks: nothing, using default below

**Question**: ADR 0002 says `.claude/skills/implement-and-test-ticket` should follow the agent contract in [infra/dev-environment.md](../infra/dev-environment.md#how-an-agent-verifies-a-ticket-on-dev) (watch the run for the merge commit, treat `cancelled` as "use the newest run", then call `scripts/wait-for-dev-deploy.sh`). Agents may not edit `.claude/`, and no task tracks the change, so it can be forgotten; until it is done the skill still uses `gh run list --branch dev-v1` alone.

**Options**
1. A: The product owner (or a named human) edits the skill once all dev-deploy-verification tasks are `done`, and answers this question when done. (recommended)
2. B: Allow an agent to edit the skill in a separate PR reviewed by a human.

**Default if unanswered**: Option A; agents follow the steps in infra/dev-environment.md by hand meanwhile.

**Answer**: _(human fills in)_

---

## Q011: Split `Deploy dev` into build and deploy jobs to isolate the Cloudflare token?

- Feature: dev-deploy
- Status: open
- Asked: 2026-11-09
- Blocks: nothing, using default below

**Question**: In [add-deploy-dev-workflow](../tasks/dev-deploy/add-deploy-dev-workflow.md) the token is only in the `env` of the two deploy steps, so install scripts and tests never read its value. But `npm ci` and the tests run earlier in the same job and workspace, so a malicious dependency or test could modify `node_modules/wrangler` and capture the token at the deploy step. PRs need 0 approvals and agents auto-merge. The token can deploy any Worker on the SweetMemories account. Is that residual risk acceptable for dev?

**Options**
1. A: Split into two jobs: `build` (no environment: install, typecheck, test, build, write markers, upload `apps/*/dist` as an artifact) and `deploy` (`environment: dev`, fresh runner, `npm ci --ignore-scripts` limited to the locked `wrangler`, download the artifact, deploy). Pros: untrusted test and install code never shares a runner with the token. Cons: about 1 minute slower; must confirm `wrangler` works without install scripts; one more task and doc changes. (recommended before any real secret or User data reaches dev)
2. B: Keep one job; accept the risk, documented in ADR 0002 Consequences; mitigations are the lockfile, `npm ci`, the reviewer agent and the narrow token. Pros: simplest; no change. Cons: residual risk stays.

**Default if unanswered**: Option B for now (current design, risk stated in ADR 0002); revisit before Neon, S3 or auth secrets are added to the `dev` environment.

**Answer**: _(human fills in)_

---

## Q012: How is a failure of the newest run reported after the ticket's own run was cancelled?

- Feature: dev-deploy-verification
- Status: open
- Asked: 2026-11-09
- Blocks: nothing, using default below

**Question**: Agent contract step 3 ([infra/dev-environment.md](../infra/dev-environment.md#how-an-agent-verifies-a-ticket-on-dev)): when the `Deploy dev` run for `MERGE_SHA` is `cancelled` (a later merge replaced it), the agent follows the newest run. That run also contains later tickets. If it fails, the failure may come from a later ticket, and reporting it as this ticket's failure sends the fix loop to the wrong ticket.

**Options**
1. A: Report "blocked by later merge `<newest headSha>`" with the failed log, not as this ticket's failure; the ticket is re-verified after the next successful run. (recommended)
2. B: Report as this ticket's failed test (simplest, but may blame the wrong ticket).

**Default if unanswered**: Option A (already written into infra/dev-environment.md step 3 as the interim rule).

**Answer**: _(human fills in)_

---

## Q013: May the verifying agent re-run a `Deploy dev` run that failed on a transient error?

- Feature: dev-deploy-verification
- Status: open
- Asked: 2026-11-09
- Blocks: nothing, using default below

**Question**: A `Deploy dev` run can fail for reasons outside the ticket (Cloudflare API error, GitHub runner or network error). [infra/ci-cd.md](../infra/ci-cd.md#how-to-change-it) forbids re-running *older* runs; re-running the run whose `headSha` is still the `dev-v1` head is safe (it deploys the head again). The agent contract currently reports every `failure` as the ticket's failed test, so an infrastructure flake starts a needless fix loop.

**Options**
1. A: Allow one re-run (`gh run rerun <id>`), only if the run's `headSha` is still `git rev-parse origin/dev-v1` and the failed step is "Deploy API", "Deploy web" or "Wait for dev deploy"; a second failure is reported as a failed test. (recommended)
2. B: No re-run by agents; report the failure; a human decides whether to re-run.

**Default if unanswered**: Option B (current contract: report, do not re-run).

**Answer**: _(human fills in)_

---
