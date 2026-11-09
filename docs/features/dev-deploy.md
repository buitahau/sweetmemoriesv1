# Dev deploy

- Status: done

## Summary

Every push to `dev-v1` (in practice: every merged PR) re-checks the commit and deploys `apps/api` and `apps/web` to Cloudflare Workers, so the latest `dev-v1` is always live at two fixed dev URLs. Decided in [ADR 0002](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md); details in [infra/ci-cd.md](../infra/ci-cd.md) and [infra/dev-environment.md](../infra/dev-environment.md).

Order: [provision-cloudflare-dev](../tasks/dev-deploy/provision-cloudflare-dev.md) (steps 1-3 any time; step 4 after [create-dev-branch](../tasks/ci-checks/create-dev-branch.md); step 5 after [add-ci-workflow](../tasks/ci-checks/add-ci-workflow.md)), [add-api-worker](../tasks/dev-deploy/add-api-worker.md) and [add-web-worker](../tasks/dev-deploy/add-web-worker.md) (both after [add-ci-workflow](../tasks/ci-checks/add-ci-workflow.md), which switches `$BASE_BRANCH` to `origin/dev-v1`) can run in parallel; [add-worker-dry-run-check](../tasks/dev-deploy/add-worker-dry-run-check.md) needs both Worker tasks; [add-deploy-dev-workflow](../tasks/dev-deploy/add-deploy-dev-workflow.md) needs all three plus [add-ci-workflow](../tasks/ci-checks/add-ci-workflow.md) and [protect-dev-branch](../tasks/ci-checks/protect-dev-branch.md). Same design gate as [ci-checks](ci-checks.md).

## User story

As the agent that verifies a ticket, I want each merge into `dev-v1` deployed automatically to a known dev URL, so that I can test the merged result without any manual step.

Acceptance criteria:
1. A push to `dev-v1` starts workflow `Deploy dev`; it can also be started with `gh workflow run deploy-dev.yml --ref dev-v1`.
2. The workflow runs `npm ci`, `npm run typecheck`, `npm test`, `npm run build` in job `build` before the `deploy` job (`needs: build`) and deploys nothing if any of them fails.
3. On success, `GET $DEV_API_URL/api/health` returns `200 {"status":"ok"}` and `GET $DEV_WEB_URL/` returns the built web app, both served by Cloudflare.
4. The Cloudflare token is used only in the `dev` GitHub environment, only by the `deploy` job of `Deploy dev` (never by the job that runs install scripts and tests), and never on `pull_request` events; it never appears in logs or the repository.
5. `Deploy dev` runs for `dev-v1` never overlap; the newest pending commit always deploys; an intermediate run replaced by a newer merge shows `cancelled`; a dispatch from another branch cannot replace a pending `dev-v1` run.
6. Unknown web paths (e.g. `/anything`) return the web app (SPA fallback), and `$DEV_API_URL/api/nope` returns `404 {"error":"not_found"}`.
7. Neither Worker sets a cookie; web responses carry `X-Robots-Tag: noindex`.
8. The API also runs locally on the Workers runtime with `npm run dev:worker -w apps/api`, and the web build with `npm run dev:worker -w apps/web`.

## Behavior

- API Worker `sweetmemories-api-dev`: entry `apps/api/src/worker.ts`, `createApp()` wrapped by `httpServerHandler({ port: 3000 })`; `GIT_SHA` passed with `--var`.
- Web Worker `sweetmemories-web-dev`: assets only from `apps/web/dist`, `not_found_handling: "single-page-application"`; the workflow writes `dist/version.json` and `dist/_headers` after the build.
- `Deploy dev` has two jobs: `build` (checks, markers, uploads `apps/web/dist`; no secrets, no environment) and `deploy` (fresh runner, `npm ci --ignore-scripts`, deploys; the only job with the token) ([Q011](../questions/questions-2026-11-09-requirement-breakdown.md#q011-split-deploy-dev-into-build-and-deploy-jobs-to-isolate-the-cloudflare-token)).
- `ci.yml` also runs `wrangler deploy --dry-run` for both apps before merge ([Q009](../questions/questions-2026-11-09-requirement-breakdown.md#q009-check-workers-runtime-compatibility-before-merge), task [add-worker-dry-run-check](../tasks/dev-deploy/add-worker-dry-run-check.md)); it catches bundling errors, not runtime errors.
- If the API deploy fails, the web deploy does not run (steps run in order, API first) and the run is `failure`.
- If the web deploy fails after the API deployed, the run is `failure`; the API and web markers then show different commits until the next successful run.
- Concurrency group `deploy-dev-${{ github.ref }}`, `cancel-in-progress: false` (see [infra/ci-cd.md](../infra/ci-cd.md)).
- Free plan only; no custom domain, no routes, no secrets inside the Workers.

## Out of scope

- Production deploy, staging, preview deploys per PR ([Q006](../questions/questions-2026-11-09-requirement-breakdown.md)).
- Custom domains or DNS ([Q003](../questions/questions-2026-11-09-requirement-breakdown.md)).
- Neon, S3, Better Auth, Worker secrets ([Q007](../questions/questions-2026-11-09-requirement-breakdown.md)).
- The public Memory page server (`apps/public`) and user subdomains.
- Automatic rollback ([Q008](../questions/questions-2026-11-09-requirement-breakdown.md)).
- `GET /api/version`, wait and smoke scripts (see [dev-deploy-verification](dev-deploy-verification.md)).
- A `wrangler dev` runtime probe in CI (only the bundling dry run is in scope, [Q009](../questions/questions-2026-11-09-requirement-breakdown.md#q009-check-workers-runtime-compatibility-before-merge)).

## Verification checklist

The feature is complete only when every item below passes.

- [x] 1. All five tasks of this feature have Status `done`. (all ACs)
- [x] 2. Merging a PR into `dev-v1` registers a `Deploy dev` run (any status) for the merge commit within 5 minutes (`gh run list --workflow deploy-dev.yml --branch dev-v1 --commit <sha>`); `gh workflow run deploy-dev.yml --ref dev-v1` starts another. The limit covers GitHub queue delay. (AC1)
- [x] 3. In `deploy-dev.yml` the steps `npm ci`, `npm run typecheck`, `npm test`, `npm run build` (job `build`) come before both `deploy:dev` steps (job `deploy`, `needs: build`), and no step has `continue-on-error` or an `if:` condition, so a failing check skips every deploy step. (AC2; a failing commit cannot reach `dev-v1` because of [ci-checks](ci-checks.md), so this is checked in the file)
- [x] 4. `gh workflow run deploy-dev.yml --ref <any branch other than dev-v1>` produces a run that has job `deploy` refused before any of its steps (environment `dev` only allows `dev-v1`), so no deploy step runs and the run ends `failure`; job `build` may run. (AC4: unreviewed code is never deployed)
- [x] 5. After a successful run, `curl -i $DEV_API_URL/api/health` returns 200, body `{"status":"ok"}`; `curl -s $DEV_WEB_URL/` contains `<title>SweetMemories</title>` and `<div id="root">`; opening `$DEV_WEB_URL/` in a browser shows "SweetMemories home page". (AC3)
- [x] 6. `deploy-dev.yml` has no `pull_request` trigger, uses `environment: dev`, and the run log shows no token value (GitHub masks it as `***`); `git grep -n -i 'cloudflare_api_token' -- ':!docs' ':!.github'` finds nothing. (AC4; writing-docs: no secrets)
- [x] 7. `deploy-dev.yml` has `concurrency` with `group: deploy-dev-${{ github.ref }}` and `cancel-in-progress: false`; two probe merges 10 s apart produce two `success` runs where the second starts only after the first ends. (AC5)
- [x] 8. Three probe merges about 10 s apart: the first and the newest run end `success`, the middle one ends `success` or `cancelled` (never overlapping the others), and afterwards `curl -s $DEV_WEB_URL/version.json` shows the third merge commit. (AC5)
- [x] 9. `curl -s -o /dev/null -w "%{http_code}" $DEV_WEB_URL/anything` prints 200 with the same HTML as `/`; `curl -i $DEV_API_URL/api/nope` returns 404 `{"error":"not_found"}`. (AC6)
- [x] 10. `curl -i -H "Cookie: session=fake-value"` on `$DEV_API_URL/api/health` and `$DEV_WEB_URL/` shows no `Set-Cookie`; the web response has `X-Robots-Tag: noindex`. (AC7; CLAUDE.md security rule 1 groundwork, rule 5)
- [x] 11. `npm run dev:worker -w apps/api` serves `http://localhost:8787/api/health` = `{"status":"ok"}`; `npm run build -w apps/web && npm run dev:worker -w apps/web` serves `http://localhost:8788/` with the app. (AC8)
- [x] 12. `docs/infra/dev-environment.md` contains the real URLs (no `<account-subdomain>` placeholder left) and they equal `gh variable list --env dev`. (AC3)

## e2e-test-suites

Type: BE (infra). `$DEV_API_URL`, `$DEV_WEB_URL` from [dev-environment](../infra/dev-environment.md). `gh` signed in with repository write access. "Probe PR" = a PR into `dev-v1` from a `ci-test/` branch that only rewrites the probe file, as in [ci-cd "Test PRs"](../infra/ci-cd.md#test-prs-probe-file): `git checkout -b ci-test/<name> origin/dev-v1 && date -u +%FT%TZ > docs/.ci-probe && git add docs/.ci-probe && git commit -m "ci probe" && git push -u origin ci-test/<name> && gh pr create --base dev-v1 --title "ci probe" --body "test"`. When several probe PRs are open at once, each uses its own file (`docs/.ci-probe`, `docs/.ci-probe-b`, `docs/.ci-probe-c`) so they do not conflict.

```
E2E-1 -> checklist items 2, 5: merge deploys
Preconditions: all tasks done; one probe PR <pr> with verify = pass
Request:
  gh pr merge <pr> --squash --delete-branch
  MERGE_SHA=$(gh pr view <pr> --json mergeCommit -q .mergeCommit.oid)
  for i in $(seq 30); do RUN_ID=$(gh run list --workflow deploy-dev.yml --branch dev-v1 --commit "$MERGE_SHA" --json databaseId -q '.[0].databaseId'); [ -n "$RUN_ID" ] && break; sleep 10; done; echo "seen_after=$((i*10))s"
  gh run watch "$RUN_ID" --exit-status; echo "run=$?"
  curl -i "$DEV_API_URL/api/health"
  curl -s "$DEV_WEB_URL/" | grep -c -E '<title>SweetMemories</title>|<div id="root">'
Expected: seen_after <= 300s; run=0 (conclusion success); health 200 {"status":"ok"}; grep count 2
```

```
E2E-2 -> checklist item 2: manual trigger
Preconditions: as E2E-1
Request:
  gh workflow run deploy-dev.yml --ref dev-v1; sleep 15
  gh run list --workflow deploy-dev.yml --limit 1 --json event,status
Expected: newest run has event "workflow_dispatch"
```

```
E2E-3 -> checklist item 3: checks run before deploy, nothing can skip them
Preconditions: none
Request:
  grep -n -E 'npm (ci|run typecheck|test|run build)|deploy:dev' .github/workflows/deploy-dev.yml
  grep -c -E 'continue-on-error|^\s+if:' .github/workflows/deploy-dev.yml
Expected: the four check lines have lower line numbers than both deploy:dev lines; count 0
```

```
E2E-4 -> checklist item 4: dispatch from another branch is refused
Preconditions: a pushed scratch branch ci-test/dispatch that contains deploy-dev.yml
Request:
  BEFORE=$(curl -s "$DEV_WEB_URL/version.json")
  gh workflow run deploy-dev.yml --ref ci-test/dispatch; sleep 20
  gh run list --workflow deploy-dev.yml --branch ci-test/dispatch --limit 1 --json conclusion
  test "$(curl -s "$DEV_WEB_URL/version.json")" = "$BEFORE"; echo "unchanged=$?"
Expected: conclusion "failure" with an annotation that the branch is not allowed to deploy to environment dev; unchanged=0
Cleanup: git push origin --delete ci-test/dispatch
```

```
E2E-5 -> checklist items 6, 7: trigger, environment, concurrency
Preconditions: none
Request:
  grep -n -E 'pull_request|environment: dev|group: deploy-dev-\$\{\{ github\.ref \}\}|cancel-in-progress: false' .github/workflows/deploy-dev.yml
  git grep -n -i 'cloudflare_api_token' -- ':!docs' ':!.github'; echo "grep=$?"
Expected: no pull_request line; the other three lines present; grep=1
```

```
E2E-6 -> checklist item 7: two deploys run in order
Preconditions: two probe PRs A (docs/.ci-probe) and B (docs/.ci-probe-b), both verify = pass
Request:
  gh pr merge A --squash --delete-branch; sleep 10; gh pr merge B --squash --delete-branch
  sleep 300; gh run list --workflow deploy-dev.yml --branch dev-v1 --limit 2 --json headSha,startedAt,updatedAt,conclusion
Expected: two runs, both "success"; the run for B has startedAt later than the updatedAt (end) of the run for A
```

```
E2E-7 -> checklist item 8: three quick merges, newest wins
Preconditions: three probe PRs A, B, C (files docs/.ci-probe, docs/.ci-probe-b, docs/.ci-probe-c), all verify = pass
Request:
  gh pr merge A --squash --delete-branch; sleep 10; gh pr merge B --squash --delete-branch; sleep 10; gh pr merge C --squash --delete-branch
  C_SHA=$(gh pr view C --json mergeCommit -q .mergeCommit.oid)
  sleep 420; gh run list --workflow deploy-dev.yml --branch dev-v1 --limit 3 --json headSha,startedAt,updatedAt,conclusion
  curl -s "$DEV_WEB_URL/version.json"
Expected: run for A "success"; run for B "success" or "cancelled"; run for C "success"; no run starts before the previous one's updatedAt; version.json shows {"commit":"<C_SHA>"}
```

```
E2E-8 -> checklist items 9, 10: fallback, 404, cookies, noindex
Preconditions: a successful deploy
Request:
  curl -s -o /dev/null -w "%{http_code}\n" "$DEV_WEB_URL/anything"
  diff <(curl -s "$DEV_WEB_URL/") <(curl -s "$DEV_WEB_URL/anything"); echo "same=$?"
  curl -i "$DEV_API_URL/api/nope"
  curl -s -D - -o /dev/null -H "Cookie: session=fake-value" "$DEV_API_URL/api/health" | grep -i -c '^set-cookie'
  curl -s -D - -o /dev/null -H "Cookie: session=fake-value" "$DEV_WEB_URL/" | grep -i -E '^(set-cookie|x-robots-tag)'
Expected: 200; same=0; 404 {"error":"not_found"}; 0; only "x-robots-tag: noindex" printed (CLAUDE.md rule 1 groundwork)
```

```
E2E-9 -> checklist item 11: Workers runtime locally
Preconditions: npm install done; ports 8787, 8788 free
Request:
  npm run dev:worker -w apps/api > /tmp/api-worker.log 2>&1 & A=$!; sleep 15; curl -s http://localhost:8787/api/health; kill $A
  npm run build -w apps/web && (npm run dev:worker -w apps/web > /tmp/web-worker.log 2>&1 & echo $! > /tmp/w.pid); sleep 15; curl -s http://localhost:8788/ | grep -c 'id="root"'; kill $(cat /tmp/w.pid)
Expected: {"status":"ok"}; 1
```

```
E2E-10 -> checklist item 12: URLs recorded
Preconditions: provision task done
Request:
  grep -c '<account-subdomain>' docs/infra/dev-environment.md
  gh variable list --env dev
Expected: 0; DEV_API_URL and DEV_WEB_URL values equal the URLs in the doc table
```

## Summary

- Built: API and web Workers, `ci.yml` Worker dry run, `Deploy dev` workflow; dev is live at the two `workers.dev` URLs ([dev-environment](../infra/dev-environment.md)).
- Test (tester, 2026-11-09): items 2-12 Pass, with the browser parts checked by curl only. Dispatch from another branch refused at the `deploy` job; three probe merges gave `success`, `cancelled`, `success` and `version.json` showed the third commit.
- Human-only checks (token scope, no secrets in docs, no unmasked values in the log) confirmed by the owner on 2026-11-09; all five tasks are `done`.
- Spec follow-ups: dry-run item 3 should use `// @ts-ignore`; feature E2E-6 should compare job `startedAt`/`completedAt`, not run `startedAt`.

## Related

- Parent ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- Infra: [ci-cd](../infra/ci-cd.md), [dev-environment](../infra/dev-environment.md)
- Architecture: [repository-layout](../architecture/repository-layout.md)
- Sibling features: [ci-checks](ci-checks.md), [dev-deploy-verification](dev-deploy-verification.md)
- Tasks:
  1. [provision-cloudflare-dev](../tasks/dev-deploy/provision-cloudflare-dev.md) (human)
  2. [add-api-worker](../tasks/dev-deploy/add-api-worker.md)
  3. [add-web-worker](../tasks/dev-deploy/add-web-worker.md)
  4. [add-worker-dry-run-check](../tasks/dev-deploy/add-worker-dry-run-check.md)
  5. [add-deploy-dev-workflow](../tasks/dev-deploy/add-deploy-dev-workflow.md)
- Open questions: [Q002, Q003, Q006, Q007](../questions/questions-2026-11-09-requirement-breakdown.md)
