# Add Worker dry-run check

- Status: not-started

## Goal

Make CI fail before merge when the API or web Worker cannot be bundled, by adding a `Worker dry run` step to the `verify` job of `.github/workflows/ci.yml` ([Q009](../../questions/questions-2026-11-09-requirement-breakdown.md#q009-check-workers-runtime-compatibility-before-merge), answered A). Today such an error is found only after merge, when `Deploy dev` fails for every agent.

## Scope

Area: infra. One edited file, `.github/workflows/ci.yml`. Follow [infra/ci-cd.md](../../infra/ci-cd.md) and [ADR 0002](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md).

Add one step to job `verify`, after `Build` (the dry run of the web Worker needs `apps/web/dist`):

8. `Worker dry run`:
   ```
   run: |
     npm run deploy:dev -w apps/api -- --dry-run
     npm run deploy:dev -w apps/web -- --dry-run
   ```
   No `env`, no `secrets.`, no `if:`, no `continue-on-error`. `wrangler deploy --dry-run` bundles the Worker and checks the config without a Cloudflare account or token.

What it catches: bundling and import errors (a missing module, a Node API that `nodejs_compat` does not provide, an invalid `wrangler.jsonc`, a missing `apps/web/dist`). What it does not catch: runtime errors on the Workers runtime (the post-deploy smoke test does); no `wrangler dev` probe runs in CI.

Prerequisites:
- Tasks `done`: [add-ci-workflow](../ci-checks/add-ci-workflow.md), [add-api-worker](add-api-worker.md), [add-web-worker](add-web-worker.md) (both `deploy:dev` scripts exist).
- Same design gate as [add-ci-workflow](../ci-checks/add-ci-workflow.md).
- Does not depend on [provision-cloudflare-dev](provision-cloudflare-dev.md): no Cloudflare account is needed.

Out of scope: any change to `deploy-dev.yml` (its real deploy already bundles the Worker), `wrangler dev` runtime probe, new npm scripts, changes under `apps/`.

Security: the step uses no secret and the workflow keeps `permissions: contents: read`, so PR code gains nothing. If `--dry-run` ever asks for a login or account ID, do not add a token to `ci.yml`: append a question to the session's questions file and set this task to `blocked`.

## Verification checklist

The task is complete only when every item below passes. Tags name the [dev-deploy](../../features/dev-deploy.md) acceptance criterion (ACn).

- [ ] 1. `ci.yml` has step `Worker dry run` directly after `Build` in job `verify`, running both `--dry-run` commands; `grep -c 'secrets\.' .github/workflows/ci.yml` prints 0 and `grep -c -E 'continue-on-error|^\s+if:' .github/workflows/ci.yml` prints 0. (AC2)
- [ ] 2. The PR that adds the step shows check `verify` = `pass`, and the step's log shows both bundles and no login prompt. (AC2)
- [ ] 3. A temporary commit on the same PR that adds `import "does-not-exist";` as the first line of `apps/api/src/worker.ts` makes `verify` fail at step `Worker dry run`; the commit is then removed and `verify` passes again. (AC2)
- [ ] 4. The PR changes only `.github/workflows/ci.yml` and files under `docs/` (status lines, `Progress.md`): `git diff --name-only "$BASE_BRANCH"...HEAD`. (Out of scope)
- [ ] 5. After the merge, a `Deploy dev` run for the merge commit ends `success` (the step does not touch `deploy-dev.yml`). (AC1)

## e2e-test-suites

Type: BE (infra). `gh` signed in; `$PR` = the number of this task's PR. `$BASE_BRANCH` = `origin/dev-v1`.

```
E2E-1 -> checklist item 1: step position and safety
Preconditions: task branch checked out
Request:
  grep -n -E 'name: (Build|Worker dry run)$|--dry-run' .github/workflows/ci.yml
  grep -c 'secrets\.' .github/workflows/ci.yml
  grep -c -E 'continue-on-error|^\s+if:' .github/workflows/ci.yml
Expected: "Build" then "Worker dry run" then two --dry-run lines (api, web) in that order; 0; 0
```

```
E2E-2 -> checklist item 2: step passes in CI
Preconditions: PR open, all work pushed
Request:
  gh pr checks $PR --watch
  gh run view $(gh run list --workflow ci.yml --branch "$(gh pr view $PR --json headRefName -q .headRefName)" --limit 1 --json databaseId -q '.[0].databaseId') --json jobs -q '.jobs[0].steps[] | [.name,.conclusion] | @tsv'
Expected: verify "pass"; step "Worker dry run" "success"
```

```
E2E-3 -> checklist item 3: a broken import fails the step
Preconditions: PR open and passing
Request:
  sed -i '1i import "does-not-exist";' apps/api/src/worker.ts
  git commit -am "temp: break worker import" && git push
  gh pr checks $PR --watch; gh run view $(gh run list --workflow ci.yml --branch "$(gh pr view $PR --json headRefName -q .headRefName)" --limit 1 --json databaseId -q '.[0].databaseId') --json jobs -q '.jobs[0].steps[] | select(.conclusion=="failure") | .name'
  git revert --no-edit HEAD && git push
  gh pr checks $PR --watch
Expected: first watch shows verify "fail"; failed step "Worker dry run" (not "Test", not "Build"); after the revert verify "pass"
```

```
E2E-4 -> checklist item 4: only expected files changed
Preconditions: all work committed
Request:
  git fetch origin dev-v1; git diff --name-only "$BASE_BRANCH"...HEAD | grep -v -E '^(\.github/workflows/ci\.yml|docs/)'; echo "other=$?"
Expected: no file listed; other=1
```

```
E2E-5 -> checklist item 5: deploy still works
Preconditions: PR merged; MERGE_SHA = its merge commit
Request:
  RUN_ID=$(gh run list --workflow deploy-dev.yml --branch dev-v1 --commit "$MERGE_SHA" --json databaseId -q '.[0].databaseId'); gh run watch "$RUN_ID" --exit-status; echo "run=$?"
Expected: run=0
```

## Links

- Feature: [dev-deploy](../../features/dev-deploy.md)
- ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- Infra: [ci-cd](../../infra/ci-cd.md)
- Needs: [add-api-worker](add-api-worker.md), [add-web-worker](add-web-worker.md), [add-ci-workflow](../ci-checks/add-ci-workflow.md)
