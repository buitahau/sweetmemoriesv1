# Add CI workflow

- Status: not-started

## Goal

Create `.github/workflows/ci.yml` so every PR into `dev-v1` or `main` runs one job, `verify`, that installs, type-checks, tests and builds the repository. (The same PR also points `$BASE_BRANCH` at `dev-v1`, see Scope "Base branch": a one-line doc follow-up of [Q004](../../questions/questions-2026-11-09-requirement-breakdown.md#q004-is-dev-v1-the-integration-and-deploy-branch) option A.)

## Scope

Area: infra. One new file plus one doc edit. Follow [infra/ci-cd.md](../../infra/ci-cd.md) and [ADR 0002](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md).

Base branch (doc edit, in this task's PR). In [docs/infra/local-development.md "Base branch"](../../infra/local-development.md#base-branch):
- Replace the line `export BASE_BRANCH=origin/main` with `export BASE_BRANCH=origin/dev-v1`.
- Replace the paragraph that starts with "`origin/main` is the default" with: "`origin/dev-v1` is the integration branch ([ADR 0002](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md), [Q004 of 2026-11-09](../questions/questions-2026-11-09-requirement-breakdown.md#q004-is-dev-v1-the-integration-and-deploy-branch)). Every implementation branch starts from `origin/dev-v1`. When it changes, update only this section."
- Why: after the first merge into `dev-v1`, a three-dot diff against `origin/main` would list files that other tickets already merged into `dev-v1`, so the "only these files changed" checks of later tasks would fail for the wrong reason.
- Do not edit `docs/questions/` answers: closing [Q007 of 2026-11-08](../../questions/questions-2026-11-08-requirement-breakdown.md#q007-which-branch-is-the-integration-base-for-diff-checks) is the product owner's job.

`.github/workflows/ci.yml`, exactly these settings:

| Key | Value |
|---|---|
| `name` | `CI` |
| `on` | `pull_request` with `branches: [dev-v1, main]` (no `paths` filter) |
| `permissions` | `contents: read` (nothing else) |
| `concurrency` | `group: ci-${{ github.ref }}`, `cancel-in-progress: true` |
| job id | `verify`, `name: verify`, `runs-on: ubuntu-latest`, `timeout-minutes: 15` |

Steps of `verify`, in this order, each with the given `name`:

1. `Checkout`: `uses: actions/checkout@v6`
2. `Setup Node`: `uses: actions/setup-node@v6` with `node-version-file: .nvmrc` and `cache: npm`
3. `Node version`: `run: node -v`
4. `Install`: `run: npm ci`
5. `Typecheck`: `run: npm run typecheck`
6. `Test`: `run: npm test`
7. `Build`: `run: npm run build`

Prerequisites:
- Design gate: [Q001 (2026-11-08)](../../questions/questions-2026-11-08-requirement-breakdown.md#q001-does-this-requirement-approve-writing-skeleton-code-during-the-design-phase) and [Q001 (2026-11-09)](../../questions/questions-2026-11-09-requirement-breakdown.md#q001-does-this-requirement-approve-writing-cicd-and-deploy-config-now) answered "Yes"; ADR 0001 and ADR 0002 `accepted`.
- Features `done`: [project-workspace](../../features/project-workspace.md), [api-skeleton](../../features/api-skeleton.md), [web-skeleton](../../features/web-skeleton.md) (root scripts `typecheck`, `test`, `build` exist).
- Tasks `done`: [create-dev-branch](create-dev-branch.md) (human; `dev-v1` exists on `origin`, [Q004](../../questions/questions-2026-11-09-requirement-breakdown.md)).

Out of scope: deploy steps, the later `Worker dry run` step ([add-worker-dry-run-check](../dev-deploy/add-worker-dry-run-check.md), step 8 of `verify`), secrets, caching beyond `cache: npm`, lint, matrix builds, branch protection ([protect-dev-branch](protect-dev-branch.md)), any change under `apps/` or `.claude/`.

Security: no `secrets.` reference; `permissions: contents: read` so a PR's code gets a read-only token. Never add `pull_request_target` (it would expose secrets to PR code).

## Verification checklist

The task is complete only when every item below passes. Tags name the [ci-checks](../../features/ci-checks.md) acceptance criterion (ACn).

- [ ] 1. `.github/workflows/ci.yml` exists, its `name` is `CI`, its only trigger is `pull_request` on `dev-v1` and `main`, with no `paths` or `paths-ignore`. (AC1)
- [ ] 2. The file has job `verify` with the seven steps of Scope in that order and those names. (AC2)
- [ ] 3. `grep -c 'secrets\.' .github/workflows/ci.yml` prints 0, `grep -c pull_request_target` prints 0, and `permissions` has only `contents: read`. (AC3)
- [ ] 4. The PR that adds this file shows check `verify` = `pass` in `gh pr checks`. (AC1, AC2)
- [ ] 5. In that run's log, step "Node version" prints `v` followed by the major in `.nvmrc`. (AC2)
- [ ] 6. A temporary second commit on the same PR with `expect(1).toBe(2)` in a new test file makes `verify` fail at step "Test"; the commit is then removed and `verify` passes again. (AC2)
- [ ] 7. Pushing a second commit while a run is in progress cancels the older run (shown as `cancelled`). (Behavior: concurrency)
- [ ] 8. The PR changes only `.github/workflows/ci.yml` and files under `docs/` (status lines, `Progress.md`, `docs/infra/local-development.md`): `git diff --name-only origin/dev-v1...HEAD`. (Out of scope)
- [ ] 9. `grep -c 'BASE_BRANCH=origin/dev-v1' docs/infra/local-development.md` prints 1 and `grep -c 'BASE_BRANCH=origin/main' docs/infra/local-development.md` prints 0. (Scope: Base branch; [Q004](../../questions/questions-2026-11-09-requirement-breakdown.md#q004-is-dev-v1-the-integration-and-deploy-branch) option A)

## e2e-test-suites

Type: BE (infra). `gh` signed in; `$PR` = the number of this task's PR. This task compares against `origin/dev-v1` directly (it is the task that switches `$BASE_BRANCH` to that value).

```
E2E-1 -> checklist items 1, 2, 3: workflow file content
Preconditions: task branch checked out
Request:
  node -e "const t=require('fs').readFileSync('.github/workflows/ci.yml','utf8');console.log(/name:\s*CI/.test(t), /pull_request:/.test(t), /paths/.test(t))"
  grep -n -E 'name: (Checkout|Setup Node|Node version|Install|Typecheck|Test|Build)$' .github/workflows/ci.yml
  grep -c 'secrets\.' .github/workflows/ci.yml; grep -c pull_request_target .github/workflows/ci.yml
  grep -A1 '^permissions:' .github/workflows/ci.yml
Expected: "true true false"; seven lines in the order Checkout, Setup Node, Node version, Install, Typecheck, Test, Build; 0; 0; "contents: read" only
```

```
E2E-2 -> checklist items 4, 5: verify passes on the PR
Preconditions: PR $PR open into dev-v1
Request:
  gh pr checks $PR --watch
  gh run view $(gh run list --workflow ci.yml --limit 1 --json databaseId -q '.[0].databaseId') --log | grep -A1 'Node version' | grep -o 'v[0-9]*' | head -1; cat .nvmrc
Expected: verify pass; printed major equals .nvmrc
```

```
E2E-3 -> checklist item 6: failing test fails verify
Preconditions: PR $PR open
Request:
  printf "import { it, expect } from 'vitest'\nit('fails on purpose', () => { expect(1).toBe(2) })\n" > apps/api/test/zz-fail.test.ts
  git add apps/api/test/zz-fail.test.ts && git commit -m "temp fail" && git push; gh pr checks $PR --watch; echo "checks=$?"
  git rm apps/api/test/zz-fail.test.ts && git commit -m "remove temp fail" && git push; gh pr checks $PR --watch; echo "checks=$?"
Expected: first checks non-zero, failed step "Test"; second checks=0
```

```
E2E-4 -> checklist item 7: older run cancelled
Preconditions: PR $PR open
Request:
  git commit --allow-empty -m "c1" && git push; sleep 5; git commit --allow-empty -m "c2" && git push; sleep 30
  gh run list --workflow ci.yml --limit 2 --json conclusion,status
Expected: one run "cancelled", the newer one in progress or success
```

```
E2E-5 -> checklist item 8: only the workflow file and docs changed
Preconditions: all work committed; git fetch origin
Request:
  git diff --name-only origin/dev-v1...HEAD | grep -v -E '^\.github/workflows/ci\.yml$|^docs/'; echo "other=$?"
Expected: other=1
```

```
E2E-6 -> checklist item 9: base branch switched to dev-v1
Preconditions: all work committed
Request:
  grep -c 'BASE_BRANCH=origin/dev-v1' docs/infra/local-development.md
  grep -c 'BASE_BRANCH=origin/main' docs/infra/local-development.md
Expected: 1; 0
```

## Links

- Feature: [ci-checks](../../features/ci-checks.md)
- ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- Infra: [ci-cd](../../infra/ci-cd.md)
- Previous: [create-dev-branch](create-dev-branch.md)
- Next: [protect-dev-branch](protect-dev-branch.md)
