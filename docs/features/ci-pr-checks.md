# Feature: ci-pr-checks

**Status:** todo
**Side:** backend (GitHub Actions workflow, repo branch protection, infra docs; no app UI)

Tasks: [../tasks/ci-pr-checks/](../tasks/ci-pr-checks/) (01 to 03). ADR: [0003](../adr/0003-ci-cd-github-actions.md). Open questions: [../decisions/ci-cd-deploy-to-cloudflare-dev-adr.md](../decisions/ci-cd-deploy-to-cloudflare-dev-adr.md), [../decisions/ci-cd-deploy-to-cloudflare-dev-feature.md](../decisions/ci-cd-deploy-to-cloudflare-dev-feature.md). Mockups: none.

## Goal

No PR can be merged into `dev-v2` unless all unit tests (and the agreed checks) pass on it.

## Summary and assumptions

- "PR merged" means merged into `dev-v2` (per `RULES.md` and the `git-workflow` skill). Merges into `main` are out of scope.
- CI runs on GitHub Actions. The repo already uses `gh`.
- The required check covers `pnpm test`. The recommendation also includes lint, typecheck and build in the same check (open question).
- Build order: this is the first slice. It needs no Cloudflare account and does not depend on ADR 0002.

## Scope

In scope: the `ci` workflow, `packageManager` and `engines` pins, branch protection on `dev-v2`, `docs/infra/ci-cd.md`.
Out of scope: deploys (see [dev-deploy](dev-deploy.md)), e2e in CI, merge queues.

## User stories

**US-ci-1: Checks run on every PR**
- **Story:** As a developer, I want the unit tests to run automatically on my PR, so that I know my change is safe before it is merged.
- **Scenarios:**
  1. *Happy path:* **Given** a PR from branch `feat/example` into `dev-v2` whose unit tests all pass, **When** the PR is opened, **Then** a check named `ci` starts within 1 minute and finishes with status `success`, and the PR shows "All checks have passed".
  2. *New commit re-runs:* **Given** an open PR with a green `ci` check, **When** a new commit is pushed to the PR branch, **Then** `ci` runs again for the new commit and the earlier result no longer counts for the new head.
  3. *Lockfile drift:* **Given** a PR that changes `package.json` dependencies without updating `pnpm-lock.yaml`, **When** `ci` runs, **Then** it fails at the install step with a frozen-lockfile error.
  4. *Same toolchain:* **Given** any PR, **When** `ci` runs, **Then** its log shows Node 24.x and the pnpm version pinned in `package.json`.

**US-ci-2: A failing check blocks the merge**
- **Story:** As a maintainer, I want GitHub to refuse merging a PR whose unit tests fail, so that broken code never reaches `dev-v2` or the dev environment.
- **Scenarios:**
  1. *Failing unit test:* **Given** a PR that adds a Vitest test asserting `1 === 2`, **When** `ci` runs, **Then** the check ends `failure`, the log names the failing test, and the merge button is disabled with "Required statuses must pass before merging".
  2. *Failing lint/typecheck/build (if agreed as required):* **Given** a PR introducing a TypeScript type error, **When** `ci` runs, **Then** the check ends `failure` and the PR cannot be merged.
  3. *Pending check:* **Given** a PR whose `ci` check is still running, **When** a maintainer tries to merge, **Then** GitHub blocks the merge until the check finishes green.
  4. *No bypass:* **Given** a PR with a failing `ci` check, **When** a repo admin tries to merge it (including `gh pr merge --admin`), **Then** the merge is refused, because branch protection applies to admins.
  5. *Direct push blocked:* **Given** branch protection on `dev-v2`, **When** anyone runs `git push origin HEAD:dev-v2` directly, **Then** the push is rejected.
  6. *Out of date:* **Given** a PR whose branch is behind `dev-v2`, **When** a maintainer tries to merge, **Then** GitHub requires the branch to be updated and `ci` to pass again on the updated commit.

**US-ci-3: PR checks never expose secrets**
- **Story:** As a maintainer, I want PR checks to run without deploy credentials, so that a malicious or careless PR cannot steal the Cloudflare token or database URL.
- **Scenarios:**
  1. *No secrets in PR runs:* **Given** a PR whose code prints all environment variables in a unit test, **When** `ci` runs, **Then** the log contains no `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` or `DATABASE_URL` values.
  2. *Fork PR:* **Given** a PR opened from a fork, **When** `ci` runs, **Then** it runs with read-only permissions and no repository or environment secrets, and no deploy happens.
  3. *PR does not deploy:* **Given** an open PR with a green `ci` check, **When** the check finishes, **Then** the dev environment still serves the previous `dev-v2` commit (no deploy is triggered by a PR).

## Acceptance criteria

- A `ci` workflow runs on every PR to `dev-v2` and on each new commit to it, using Node 24 and the pinned pnpm with a frozen lockfile.
- `ci` runs `pnpm test` (all Vitest unit tests), plus lint, typecheck and build if agreed, and fails if any of them fails.
- Branch protection on `dev-v2` requires `ci` to pass, requires the branch to be up to date, blocks direct pushes, and applies to admins.
- PR runs have no access to deploy or database secrets and never deploy.
- `docs/infra/ci-cd.md` documents the checks, how to reproduce them locally, and how to read a failure.
