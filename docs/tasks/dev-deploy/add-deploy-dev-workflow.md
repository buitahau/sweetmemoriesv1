# Add deploy-dev workflow

- Status: not-started

## Goal

Create `.github/workflows/deploy-dev.yml` so every push to `dev-v1` re-checks the commit, writes the web markers, and deploys the API and web Workers to Cloudflare in order.

## Scope

Area: infra. One new file. Follow [infra/ci-cd.md](../../infra/ci-cd.md) and [ADR 0002](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md). Copy the `ci.yml` steps `Checkout`, `Setup Node`, `Install`, `Typecheck`, `Test` and `Build` from `.github/workflows/ci.yml` ([add-ci-workflow](../ci-checks/add-ci-workflow.md)) unchanged; leave out the `Node version` step. They become steps 1-6 below.

| Key | Value |
|---|---|
| `name` | `Deploy dev` |
| `on` | `push` with `branches: [dev-v1]`; `workflow_dispatch` (no inputs). No `pull_request`, no `pull_request_target`. |
| `permissions` | `contents: read` |
| `concurrency` | `group: deploy-dev-${{ github.ref }}`, `cancel-in-progress: false` (why: [infra/ci-cd.md](../../infra/ci-cd.md)) |
| job id | `deploy`, `name: deploy`, `runs-on: ubuntu-latest`, `timeout-minutes: 20`, `environment: dev` |

Steps, in this order, each with the given `name`, none with `if:` or `continue-on-error`:

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
8. `Deploy API`: `run: npm run deploy:dev -w apps/api -- --var GIT_SHA:${{ github.sha }}`, with step-level `env: CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}` and `CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}`
9. `Deploy web`: `run: npm run deploy:dev -w apps/web`, same step-level `env`

Steps "Wait for dev deploy" and "Smoke test dev" are added later by [add-dev-smoke-script](../dev-deploy-verification/add-dev-smoke-script.md); leave a comment `# post-deploy checks: see add-dev-smoke-script` after step 9.

Prerequisites:
- Tasks `done`: [add-ci-workflow](../ci-checks/add-ci-workflow.md), [protect-dev-branch](../ci-checks/protect-dev-branch.md), [provision-cloudflare-dev](provision-cloudflare-dev.md), [add-api-worker](add-api-worker.md), [add-web-worker](add-web-worker.md).
- Same design gate as [add-ci-workflow](../ci-checks/add-ci-workflow.md).

Out of scope: wait and smoke steps, `GET /api/version` code ([add-version-endpoint](../dev-deploy-verification/add-version-endpoint.md); until it is merged, `GIT_SHA` is set but unused), production, preview deploys, rollback automation, `cloudflare/wrangler-action`, Slack or e-mail notifications.

Security:
- Secrets appear only as step-level `env` on steps 8 and 9, never at job level, so `npm ci` install scripts and tests never read the token value. They still run earlier in the same job and workspace, so they could tamper with `node_modules` before step 8; this residual risk is stated in [ADR 0002](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md) Consequences and open as [Q011](../../questions/questions-2026-11-09-requirement-breakdown.md#q011-split-deploy-dev-into-build-and-deploy-jobs-to-isolate-the-cloudflare-token). Build this task as one job, as specified; do not split it unless Q011 is answered "split".
- Never `echo` a secret; never add `pull_request` triggers (PR code must not run with the token).
- Environment `dev` allows only `dev-v1`, so a manual dispatch on another branch fails.
- `X-Robots-Tag: noindex` keeps dev out of search engines; no cookies are added (CLAUDE.md rule 1 groundwork).

## Verification checklist

The task is complete only when every item below passes. Tags name the [dev-deploy](../../features/dev-deploy.md) acceptance criterion (ACn).

- [ ] 1. `deploy-dev.yml` has the keys of the Scope table exactly; triggers are only `push` on `dev-v1` and `workflow_dispatch`. (AC1, AC4)
- [ ] 2. The nine steps exist in Scope order with those names; `grep -c -E 'continue-on-error|^\s+if:'` prints 0. (AC2)
- [ ] 3. `secrets.` appears only inside the `env` of steps "Deploy API" and "Deploy web" (4 occurrences in total), never under the job. (AC4)
- [ ] 4. After merging this task's PR, the `Deploy dev` run for the merge commit ends `success`. (AC1, AC3)
- [ ] 5. After that run: `curl -s $DEV_API_URL/api/health` prints `{"status":"ok"}`; `curl -s $DEV_WEB_URL/` contains `<title>SweetMemories</title>`; `curl -s $DEV_WEB_URL/version.json` prints `{"commit":"<merge sha>"}`. (AC3)
- [ ] 6. `curl -I $DEV_WEB_URL/` shows `X-Robots-Tag: noindex` and no `Set-Cookie`; `curl -I $DEV_WEB_URL/version.json` shows `Cache-Control: no-store`; `curl -s $DEV_WEB_URL/_headers` does not print the text `X-Robots-Tag`. (AC7)
- [ ] 7. No secret can reach the log: `grep -c -E 'echo|printenv|set -x' .github/workflows/deploy-dev.yml` prints 0; and the human who holds the values downloads the log of the item-4 run and checks locally that neither the account ID nor the token value occurs in it (E2E-4; values never echoed or shared). (AC4)
- [ ] 8. `gh workflow run deploy-dev.yml --ref dev-v1` starts a run with event `workflow_dispatch` that ends `success`. (AC1)

## e2e-test-suites

Type: BE (infra). `$DEV_API_URL`, `$DEV_WEB_URL` from [dev-environment](../../infra/dev-environment.md). `gh` signed in.

```
E2E-1 -> checklist items 1, 2, 3: workflow file content
Preconditions: task branch checked out
Request:
  grep -n -E '^on:|push:|workflow_dispatch|pull_request|branches:' .github/workflows/deploy-dev.yml
  grep -n -E 'name: (Checkout|Setup Node|Install|Typecheck|Test|Build|Write web markers|Deploy API|Deploy web)$' .github/workflows/deploy-dev.yml
  grep -c -E 'continue-on-error|^\s+if:' .github/workflows/deploy-dev.yml
  grep -n 'secrets\.' .github/workflows/deploy-dev.yml
  grep -n -E 'group: deploy-dev-\$\{\{ github\.ref \}\}|cancel-in-progress: false|environment: dev|contents: read' .github/workflows/deploy-dev.yml
Expected: push on [dev-v1] and workflow_dispatch only, no pull_request line; nine names in Scope order; 0; four secrets lines, all with line numbers after "name: Deploy API"; all four settings present
```

```
E2E-2 -> checklist items 4, 5: first deploy succeeds
Preconditions: this task's PR merged into dev-v1; MERGE_SHA = its merge commit
Request:
  gh run watch $(gh run list --workflow deploy-dev.yml --branch dev-v1 --limit 1 --json databaseId -q '.[0].databaseId'); gh run list --workflow deploy-dev.yml --limit 1 --json headSha,conclusion
  curl -s "$DEV_API_URL/api/health"; echo
  curl -s "$DEV_WEB_URL/" | grep -c '<title>SweetMemories</title>'
  curl -s "$DEV_WEB_URL/version.json"
Expected: headSha = MERGE_SHA, conclusion "success"; {"status":"ok"}; 1; {"commit":"<MERGE_SHA>"}
```

```
E2E-3 -> checklist item 6: headers and hidden config file
Preconditions: as E2E-2
Request:
  curl -s -I "$DEV_WEB_URL/" | grep -i -E '^(x-robots-tag|set-cookie)'
  curl -s -I "$DEV_WEB_URL/version.json" | grep -i '^cache-control'
  curl -s "$DEV_WEB_URL/_headers" | grep -c 'X-Robots-Tag'
Expected: only "x-robots-tag: noindex"; "cache-control: no-store"; 0 (CLAUDE.md rule 1 groundwork)
```

```
E2E-4 -> checklist item 7: no secret in logs
Preconditions: as E2E-2; run by the human who holds the values, locally; CF_ACCOUNT_ID and CF_TOKEN set in the shell with `read -rs` (never echoed, never pasted in a report)
Request:
  grep -c -E 'echo|printenv|set -x' .github/workflows/deploy-dev.yml
  gh run view <run id> --log > /tmp/deploy.log
  grep -c -F "$CF_ACCOUNT_ID" /tmp/deploy.log; grep -c -F "$CF_TOKEN" /tmp/deploy.log
  rm /tmp/deploy.log; unset CF_ACCOUNT_ID CF_TOKEN
Expected: 0; 0; 0 (GitHub masks secret values as ***, so neither raw value occurs)
```

```
E2E-5 -> checklist item 8: manual dispatch
Preconditions: as E2E-2
Request:
  gh workflow run deploy-dev.yml --ref dev-v1; sleep 15
  gh run watch $(gh run list --workflow deploy-dev.yml --limit 1 --json databaseId -q '.[0].databaseId')
  gh run list --workflow deploy-dev.yml --limit 1 --json event,conclusion
Expected: event "workflow_dispatch", conclusion "success"
```

## Links

- Feature: [dev-deploy](../../features/dev-deploy.md)
- ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- Infra: [ci-cd](../../infra/ci-cd.md), [dev-environment](../../infra/dev-environment.md)
- Next: [add-dev-smoke-script](../dev-deploy-verification/add-dev-smoke-script.md)
