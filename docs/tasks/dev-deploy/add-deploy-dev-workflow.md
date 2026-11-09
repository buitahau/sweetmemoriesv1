# Add deploy-dev workflow

- Status: done

## Goal

Create `.github/workflows/deploy-dev.yml` so every push to `dev-v1` re-checks the commit in a `build` job without secrets, then a `deploy` job on a fresh runner (the only place the Cloudflare token exists) deploys the API and web Workers in order ([Q011](../../questions/questions-2026-11-09-requirement-breakdown.md#q011-split-deploy-dev-into-build-and-deploy-jobs-to-isolate-the-cloudflare-token), answered A).

## Scope

Area: infra. One new file. Follow [infra/ci-cd.md](../../infra/ci-cd.md) and [ADR 0002](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md). Copy the `ci.yml` steps `Checkout`, `Setup Node`, `Install`, `Typecheck`, `Test` and `Build` from `.github/workflows/ci.yml` ([add-ci-workflow](../ci-checks/add-ci-workflow.md)) unchanged into `build`; leave out the `Node version` and `Worker dry run` steps ([add-worker-dry-run-check](add-worker-dry-run-check.md) edits `ci.yml` only).

Workflow keys:

| Key | Value |
|---|---|
| `name` | `Deploy dev` |
| `on` | `push` with `branches: [dev-v1]`; `workflow_dispatch` (no inputs). No `pull_request`, no `pull_request_target`. |
| `permissions` | `contents: read` |
| `concurrency` | `group: deploy-dev-${{ github.ref }}`, `cancel-in-progress: false` (why: [infra/ci-cd.md](../../infra/ci-cd.md)) |

Jobs:

| Job id and `name` | Settings |
|---|---|
| `build` | `runs-on: ubuntu-latest`, `timeout-minutes: 20`. No `environment`, no `secrets.`. |
| `deploy` | `needs: build`, `runs-on: ubuntu-latest`, `timeout-minutes: 20`, `environment: dev`. |

Steps of `build`, in this order, each with the given `name`, none with `if:` or `continue-on-error`:

1. `Checkout`: `uses: actions/checkout@v6`
2. `Setup Node`: `uses: actions/setup-node@v6`, `node-version-file: .nvmrc`, `cache: npm`
3. `Install`: `run: npm ci`
4. `Typecheck`: `run: npm run typecheck`
5. `Test`: `run: npm test`
6. `Build`: `run: npm run build`
7. `Write web markers`:
   ```
   run: |
     node -e "require('fs').writeFileSync('apps/web/dist/version.json', JSON.stringify({ commit: process.env.GITHUB_SHA }))"
     printf '/*\n  X-Robots-Tag: noindex\n/version.json\n  Cache-Control: no-store\n' > apps/web/dist/_headers
   ```
8. `Upload web build`: `uses: actions/upload-artifact` at its current major version (look it up on GitHub and write it in the PR), `with: name: web-dist`, `path: apps/web/dist`, `if-no-files-found: error`, `retention-days: 1`

Steps of `deploy`, in this order, same rules:

1. `Checkout`: `uses: actions/checkout@v6`
2. `Setup Node`: `uses: actions/setup-node@v6`, `node-version-file: .nvmrc`, `cache: npm`
3. `Install`: `run: npm ci --ignore-scripts` (no install script of any dependency runs on the runner that holds the token)
4. `Download web build`: `uses: actions/download-artifact` at the same major version as the upload, `with: name: web-dist`, `path: apps/web/dist`
5. `Deploy API`: `run: npm run deploy:dev -w apps/api -- --var GIT_SHA:${{ github.sha }}`, with step-level `env: CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}` and `CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}`
6. `Deploy web`: `run: npm run deploy:dev -w apps/web`, same step-level `env`

Steps "Wait for dev deploy" and "Smoke test dev" are added later to `deploy` by [add-dev-smoke-script](../dev-deploy-verification/add-dev-smoke-script.md); leave a comment `# post-deploy checks: see add-dev-smoke-script` after `Deploy web`.

Prerequisites:
- Tasks `done`: [add-ci-workflow](../ci-checks/add-ci-workflow.md), [protect-dev-branch](../ci-checks/protect-dev-branch.md), [provision-cloudflare-dev](provision-cloudflare-dev.md), [add-api-worker](add-api-worker.md), [add-web-worker](add-web-worker.md).
- Same design gate as [add-ci-workflow](../ci-checks/add-ci-workflow.md).

Out of scope: wait and smoke steps, `GET /api/version` code ([add-version-endpoint](../dev-deploy-verification/add-version-endpoint.md); until it is merged, `GIT_SHA` is set but unused), production, preview deploys, rollback automation, `cloudflare/wrangler-action`, Slack or e-mail notifications.

Security:
- The token appears only as step-level `env` on `Deploy API` and `Deploy web` in the `deploy` job, never at job or workflow level and never in `build`. Install scripts and tests run only in `build`, which has no `environment` and so cannot read the `dev` secrets. `deploy` installs with `--ignore-scripts` and runs only the locked `wrangler`. Residual risk (a compromised package in the locked tree): [ADR 0002](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md) Consequences.
- If `wrangler` does not work with `--ignore-scripts` (for example `workerd` or `esbuild` needs its install script), do not drop the flag: append a question to the session's questions file and set this task to `blocked`.
- Never `echo` a secret; never add `pull_request` triggers (PR code must not run with the token).
- Environment `dev` allows only `dev-v1`, so on a manual dispatch from another branch `build` runs but `deploy` is refused before any step.
- `X-Robots-Tag: noindex` keeps dev out of search engines; no cookies are added (CLAUDE.md rule 1 groundwork).

## Verification checklist

The task is complete only when every item below passes. Tags name the [dev-deploy](../../features/dev-deploy.md) acceptance criterion (ACn).

- [x] 1. `deploy-dev.yml` has the keys of the Workflow keys table exactly; triggers are only `push` on `dev-v1` and `workflow_dispatch`. (AC1, AC4)
- [x] 2. Job `build` has the eight steps and job `deploy` the six steps above, in that order with those names; `grep -c -E 'continue-on-error|^\s+if:'` prints 0; `grep -c 'needs: build'` prints 1. (AC2)
- [x] 3. `secrets.` appears only inside the `env` of the steps `Deploy API` and `Deploy web` (4 occurrences in total), all after the line `deploy:`; `environment: dev` appears once, in `deploy`, and not in `build`. (AC4)
- [x] 4. `build` runs `npm ci`; `deploy` runs `npm ci --ignore-scripts`. (AC4)
- [x] 5. After merging this task's PR, the `Deploy dev` run for the merge commit ends `success` with both jobs `success`. (AC1, AC3)
- [x] 6. After that run: `curl -s $DEV_API_URL/api/health` prints `{"status":"ok"}`; `curl -s $DEV_WEB_URL/` contains `<title>SweetMemories</title>`; `curl -s $DEV_WEB_URL/version.json` prints `{"commit":"<merge sha>"}`. (AC3)
- [x] 7. `curl -I $DEV_WEB_URL/` shows `X-Robots-Tag: noindex` and no `Set-Cookie`; `curl -I $DEV_WEB_URL/version.json` shows `Cache-Control: no-store`; `curl -s $DEV_WEB_URL/_headers` does not print the text `X-Robots-Tag`. (AC7)
- [x] 8. No secret can reach the log: `grep -c -E 'echo|printenv|set -x' .github/workflows/deploy-dev.yml` prints 0; and the human who holds the values downloads the log of the item-5 run and checks locally that neither the account ID nor the token value occurs in it (E2E-4; values never echoed or shared). (AC4)
- [x] 9. `gh workflow run deploy-dev.yml --ref dev-v1` starts a run with event `workflow_dispatch` that ends `success`. (AC1)

## e2e-test-suites

Type: BE (infra). `$DEV_API_URL`, `$DEV_WEB_URL` from [dev-environment](../../infra/dev-environment.md). `gh` signed in.

```
E2E-1 -> checklist items 1, 2, 3, 4: workflow file content
Preconditions: task branch checked out
Request:
  grep -n -E '^on:|push:|workflow_dispatch|pull_request|branches:' .github/workflows/deploy-dev.yml
  grep -n -E '^  (build|deploy):|name: (Checkout|Setup Node|Install|Typecheck|Test|Build|Write web markers|Upload web build|Download web build|Deploy API|Deploy web)$' .github/workflows/deploy-dev.yml
  grep -n -E 'npm ci' .github/workflows/deploy-dev.yml
  grep -c -E 'continue-on-error|^\s+if:' .github/workflows/deploy-dev.yml
  grep -c 'needs: build' .github/workflows/deploy-dev.yml
  grep -n 'secrets\.' .github/workflows/deploy-dev.yml
  grep -n -E 'environment: dev|^  deploy:' .github/workflows/deploy-dev.yml
  grep -n -E 'group: deploy-dev-\$\{\{ github\.ref \}\}|cancel-in-progress: false|contents: read' .github/workflows/deploy-dev.yml
Expected: push on [dev-v1] and workflow_dispatch only, no pull_request line; `build:` then its eight names, `deploy:` then its six names in order; two `npm ci` lines, the first plain and the second with `--ignore-scripts`; 0; 1; four secrets lines, all after the `deploy:` line and after "name: Deploy API" starts; one `environment: dev` line, after the `deploy:` line; the three settings present
```

```
E2E-2 -> checklist items 5, 6: first deploy succeeds
Preconditions: this task's PR merged into dev-v1; MERGE_SHA = its merge commit
Request:
  gh run watch $(gh run list --workflow deploy-dev.yml --branch dev-v1 --limit 1 --json databaseId -q '.[0].databaseId'); gh run list --workflow deploy-dev.yml --limit 1 --json headSha,conclusion; gh run view $(gh run list --workflow deploy-dev.yml --branch dev-v1 --limit 1 --json databaseId -q '.[0].databaseId') --json jobs -q '.jobs[] | [.name,.conclusion] | @tsv'
  curl -s "$DEV_API_URL/api/health"; echo
  curl -s "$DEV_WEB_URL/" | grep -c '<title>SweetMemories</title>'
  curl -s "$DEV_WEB_URL/version.json"
Expected: headSha = MERGE_SHA, conclusion "success"; jobs build and deploy both "success"; {"status":"ok"}; 1; {"commit":"<MERGE_SHA>"}
```

```
E2E-3 -> checklist item 7: headers and hidden config file
Preconditions: as E2E-2
Request:
  curl -s -I "$DEV_WEB_URL/" | grep -i -E '^(x-robots-tag|set-cookie)'
  curl -s -I "$DEV_WEB_URL/version.json" | grep -i '^cache-control'
  curl -s "$DEV_WEB_URL/_headers" | grep -c 'X-Robots-Tag'
Expected: only "x-robots-tag: noindex"; "cache-control: no-store"; 0 (CLAUDE.md rule 1 groundwork)
```

```
E2E-4 -> checklist item 8: no secret in logs
Preconditions: as E2E-2; run by the human who holds the values, locally; CF_ACCOUNT_ID and CF_TOKEN set in the shell with `read -rs` (never echoed, never pasted in a report)
Request:
  grep -c -E 'echo|printenv|set -x' .github/workflows/deploy-dev.yml
  gh run view <run id> --log > /tmp/deploy.log
  grep -c -F "$CF_ACCOUNT_ID" /tmp/deploy.log; grep -c -F "$CF_TOKEN" /tmp/deploy.log
  rm /tmp/deploy.log; unset CF_ACCOUNT_ID CF_TOKEN
Expected: 0; 0; 0 (GitHub masks secret values as ***, so neither raw value occurs)
```

```
E2E-5 -> checklist item 9: manual dispatch
Preconditions: as E2E-2
Request:
  gh workflow run deploy-dev.yml --ref dev-v1; sleep 15
  gh run watch $(gh run list --workflow deploy-dev.yml --limit 1 --json databaseId -q '.[0].databaseId')
  gh run list --workflow deploy-dev.yml --limit 1 --json event,conclusion
Expected: event "workflow_dispatch", conclusion "success"
```

## Summary

- Built: `.github/workflows/deploy-dev.yml` (secret-free `build` job, `deploy` job in environment `dev` with the token only as step-level env of the two deploy steps, `npm ci --ignore-scripts`). Artifact actions: `upload-artifact@v7` (latest major) and `download-artifact@v8` (released with upload v7; v8 fails on a hash mismatch where v7 only warns), on the reviewer's advice, instead of the task's "same major".
- PR: https://github.com/buitahau/sweetmemoriesv1/pull/32 (merge commit `499edfd`). Review: approve, 1 Minor (download v8, fixed), 1 Nit (`persist-credentials: false` on the deploy checkout, follow-up).
- Test: items 1-7 and 9 Pass; first deploy `success`; probe merges showed ordered runs and one `cancelled` middle run. Item 8: the raw-value check was done by the human holding the values.
- Human confirmation (2026-11-09): item 8, no unmasked token or account ID in the `Deploy dev` log. Done.
- Cycles: 1.

## Links

- Feature: [dev-deploy](../../features/dev-deploy.md)
- ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- Infra: [ci-cd](../../infra/ci-cd.md), [dev-environment](../../infra/dev-environment.md)
- Next: [add-dev-smoke-script](../dev-deploy-verification/add-dev-smoke-script.md)
