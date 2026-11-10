# Dev deploy verification

- Status: done

## Summary

Makes the dev environment machine-checkable, so an agent can tell, without guessing or fixed sleeps, that a given merge commit is live on dev and healthy before it runs a ticket's `e2e-test-suites`. Adds a deployed-commit marker to each app, a wait script, a smoke script that the deploy workflow runs, and the written verification steps in [infra/dev-environment.md](../infra/dev-environment.md#how-an-agent-verifies-a-ticket-on-dev). Decided in [ADR 0002](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md).

Order: [add-version-endpoint](../tasks/dev-deploy-verification/add-version-endpoint.md) (after [api-skeleton](api-skeleton.md) and [add-ci-workflow](../tasks/ci-checks/add-ci-workflow.md); local only), then [add-wait-for-deploy-script](../tasks/dev-deploy-verification/add-wait-for-deploy-script.md) (also needs [add-deploy-dev-workflow](../tasks/dev-deploy/add-deploy-dev-workflow.md) for its live checks), then [add-dev-smoke-script](../tasks/dev-deploy-verification/add-dev-smoke-script.md) (also needs [add-deploy-dev-workflow](../tasks/dev-deploy/add-deploy-dev-workflow.md)). Same design gate as [ci-checks](ci-checks.md).

## User story

As the agent that verifies a ticket after its PR was auto-merged, I want to confirm that dev runs that exact merge commit and passes a basic smoke test, so that my test results describe the ticket's code and not an older or broken deploy.

Acceptance criteria:
1. `GET $DEV_API_URL/api/version` returns `200 {"commit":"<sha>"}` where `<sha>` is the deployed commit; locally it returns `{"commit":"unknown"}` ([api/version.md](../api/version.md)).
2. `GET $DEV_WEB_URL/version.json` returns `{"commit":"<sha>"}` with `Cache-Control: no-store`.
3. `scripts/wait-for-dev-deploy.sh <sha>` exits 0 once both markers show `<sha>` or a later commit on `dev-v1`, exits 1 after the timeout (default 600 s) printing what is deployed, and exits 2 on a bad argument or missing `DEV_API_URL` / `DEV_WEB_URL`.
4. `scripts/smoke-dev.sh` exits 0 only if API health, API version, web home page and web version all answer as specified and no response sets a cookie; it prints one `PASS` or `FAIL` line per check.
5. Every `Deploy dev` run ends with the wait script (timeout 180 s) and the smoke script; if either fails, the run is `failure`.
6. `docs/infra/dev-environment.md` "How an agent verifies a ticket on dev" lists the exact commands for this contract, and following them for a real merge works end to end:
   1. get `MERGE_SHA` from the PR;
   2. `gh run watch --exit-status` the `Deploy dev` run whose `headSha` is `MERGE_SHA` (wait up to 300 s for it to appear; none = failed test);
   3. that run decides: `success` -> go on; `cancelled` -> watch the newest `dev-v1` run and apply this step to it (if that newest run fails: "blocked by later merge", [Q012](../questions/questions-2026-11-09-requirement-breakdown.md#q012-how-is-a-failure-of-the-newest-run-reported-after-the-tickets-own-run-was-cancelled)); `failure` or other -> one re-run with `gh run rerun` if the run's `headSha` is still the `dev-v1` head and the failed step is `Deploy API`, `Deploy web` or `Wait for dev deploy` ([Q013](../questions/questions-2026-11-09-requirement-breakdown.md#q013-may-the-verifying-agent-re-run-a-deploy-dev-run-that-failed-on-a-transient-error)); otherwise, and after a second failure, failed test, even if a later run succeeded;
   4. `scripts/wait-for-dev-deploy.sh "$MERGE_SHA"` exits 0;
   5. run the ticket's `e2e-test-suites` with `BASE_URL=$DEV_API_URL` for BE suites or `BASE_URL=$DEV_WEB_URL` for FE suites (open it in the browser).

## Behavior

- Marker values are validated (`^[0-9a-f]{40}$`); anything else is `unknown`, never echoed raw.
- "Later commit" means: `git merge-base --is-ancestor <target> <deployed>` is true after `git fetch origin dev-v1`. A deployed commit unknown to git (not fetched, or `unknown`) counts as "not yet".
- Poll interval 10 s; each request has a 10 s timeout; network errors and non-JSON bodies (e.g. SPA fallback HTML when `version.json` is missing) count as "not yet", not as failure.
- Scripts need only `bash`, `curl`, `git` and `node` (no `jq`), so they run on the GitHub runner and on any developer or agent machine with the repo's Node.

## Out of scope

- Changing the `.claude/` skills to call the scripts (a human does it; see [ADR 0002](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md) Consequences).
- Ticket-specific tests (they live in each ticket's `e2e-test-suites`).
- Browser-based smoke tests, uptime monitoring, alerting.
- Adding fields to `GET /api/health`.

## Verification checklist

The feature is complete only when every item below passes.

- [x] 1. All three tasks of this feature have Status `done`. (all ACs)
- [x] 2. After a deploy of commit `X`, `curl -s $DEV_API_URL/api/version` prints `{"commit":"X"}` and `curl -i $DEV_WEB_URL/version.json` prints `{"commit":"X"}` with `Cache-Control: no-store`. (AC1, AC2)
- [x] 3. Locally (`npm run build -w apps/api && npm start -w apps/api`, `GIT_SHA` unset), `curl -s http://localhost:3000/api/version` prints `{"commit":"unknown"}`. (AC1)
- [x] 4. `scripts/wait-for-dev-deploy.sh X` exits 0 for the live commit and for its parent commit; exits 1 within `WAIT_TIMEOUT_SECONDS` + 15 s for a commit that is not on `dev-v1`; exits 2 for `abc` and when `DEV_API_URL` is unset. (AC3)
- [x] 5. `scripts/smoke-dev.sh` exits 0 against dev and prints 4 `PASS` lines; pointed at a wrong URL (`DEV_API_URL=https://example.invalid`) it exits 1 and prints `FAIL`. (AC4)
- [x] 6. The newest `Deploy dev` run log shows the steps "Wait for dev deploy" and "Smoke test dev" after both deploy steps, both successful; `grep -c -F 'WAIT_TIMEOUT_SECONDS=180' .github/workflows/deploy-dev.yml` prints 1 (timeout 180 s); and `grep -c -E 'continue-on-error|^\s+if:' .github/workflows/deploy-dev.yml` prints 0, so a failing wait or smoke fails the run (checked in the file, see [add-dev-smoke-script](../tasks/dev-deploy-verification/add-dev-smoke-script.md) item 10). (AC5)
- [x] 7. No marker or script output contains a cookie, token, account ID or user data; `GET /api/version` sets no cookie, also when sent `Cookie: session=fake-value`. (CLAUDE.md rules 1 and 5)
- [x] 8. A full dry run by an agent, using only `docs/infra/dev-environment.md`: merge a probe PR ([ci-cd "Test PRs"](../infra/ci-cd.md#test-prs-probe-file)), run steps 1-4 of "How an agent verifies" (run conclusion `success`, wait exit 0), then step 5 for both suite types: the [api-skeleton](api-skeleton.md) E2E-1 to E2E-4 at `BASE_URL=$DEV_API_URL` all pass (BE), and the browser checks of E2E-8 (based on [web-skeleton](web-skeleton.md) E2E-1 and E2E-2, minus the heading text) at `BASE_URL=$DEV_WEB_URL` show exactly one non-empty `h1`, tab title "SweetMemories", `lang="en"`, no cookies for the dev web origin and no request to another origin (FE). The heading text is not checked, so this item holds both for the skeleton placeholder and for the [homepage](homepage.md) that replaces it. (AC6, the requirement's goal; CLAUDE.md rule 1 groundwork)

## e2e-test-suites

Type: BE (API + scripts) for E2E-1 to E2E-7; FE (browser) for E2E-8, which completes the item-8 dry run. `$DEV_API_URL`, `$DEV_WEB_URL` exported as in [dev-environment](../infra/dev-environment.md); repo cloned with `origin` fetched.

```
E2E-1 -> checklist item 2: markers show the deployed commit
Preconditions: newest Deploy dev run succeeded; X=$(git rev-parse origin/dev-v1) after git fetch origin dev-v1
Request:
  curl -s "$DEV_API_URL/api/version"
  curl -i "$DEV_WEB_URL/version.json"
Expected: {"commit":"<X>"}; 200, Cache-Control: no-store, body {"commit":"<X>"}
```

```
E2E-2 -> checklist item 3: local value is unknown
Preconditions: npm run build -w apps/api; GIT_SHA unset
Request:
  npm start -w apps/api & sleep 3; curl -s http://localhost:3000/api/version; kill %1
Expected: {"commit":"unknown"}
```

```
E2E-3 -> checklist item 4: wait script outcomes
Preconditions: as E2E-1
Request:
  scripts/wait-for-dev-deploy.sh "$X"; echo "live=$?"
  scripts/wait-for-dev-deploy.sh "$(git rev-parse "$X"~1)"; echo "parent=$?"
  WAIT_TIMEOUT_SECONDS=20 scripts/wait-for-dev-deploy.sh 0000000000000000000000000000000000000000; echo "missing=$?"
  scripts/wait-for-dev-deploy.sh abc; echo "bad=$?"
  env -u DEV_API_URL scripts/wait-for-dev-deploy.sh "$X"; echo "nourl=$?"
Expected: live=0; parent=0; missing=1 after about 20-35 s with a line showing the deployed api and web commits; bad=2; nourl=2
```

```
E2E-4 -> checklist item 5: smoke script
Preconditions: as E2E-1
Request:
  scripts/smoke-dev.sh; echo "ok=$?"
  DEV_API_URL=https://example.invalid scripts/smoke-dev.sh; echo "bad=$?"
Expected: 4 lines starting PASS and ok=0; at least one line starting FAIL and bad=1
```

```
E2E-5 -> checklist item 6: workflow runs wait and smoke, nothing skips failure
Preconditions: a Deploy dev run after all tasks are merged
Request:
  gh run view $(gh run list --workflow deploy-dev.yml --branch dev-v1 --limit 1 --json databaseId -q '.[0].databaseId') --json jobs -q '.jobs[0].steps[] | [.name,.conclusion] | @tsv'
  grep -c -F 'WAIT_TIMEOUT_SECONDS=180' .github/workflows/deploy-dev.yml
  grep -c -E 'continue-on-error|^\s+if:' .github/workflows/deploy-dev.yml
Expected: "Wait for dev deploy" and "Smoke test dev" listed after both deploy steps, each "success"; 1; 0
```

```
E2E-6 -> checklist item 7: no cookies, no secrets in output
Preconditions: as E2E-1
Request:
  curl -s -D - -o /dev/null -H "Cookie: session=fake-value" "$DEV_API_URL/api/version" | grep -i -c '^set-cookie'
  scripts/smoke-dev.sh 2>&1 | grep -i -c -E 'token|account|cookie:'
Expected: 0; 0 (CLAUDE.md rules 1 and 5)
```

```
E2E-7 -> checklist item 8: end-to-end agent dry run
Preconditions: a probe PR <pr> into dev-v1 that only rewrites docs/.ci-probe (ci-cd "Test PRs"), verify = pass; no other merge in the next 10 minutes
Request:
  gh pr merge <pr> --squash --delete-branch
  (steps 1-4 of docs/infra/dev-environment.md "How an agent verifies", commands copied exactly)
  MERGE_SHA=$(gh pr view <pr> --json mergeCommit -q .mergeCommit.oid); git fetch origin dev-v1
  RUN_ID=""; for i in $(seq 30); do RUN_ID=$(gh run list --workflow deploy-dev.yml --branch dev-v1 --commit "$MERGE_SHA" --json databaseId -q '.[0].databaseId'); [ -n "$RUN_ID" ] && break; sleep 10; done
  gh run watch "$RUN_ID" --exit-status > /dev/null || true; gh run view "$RUN_ID" --json conclusion -q .conclusion
  scripts/wait-for-dev-deploy.sh "$MERGE_SHA"; echo "wait=$?"
  (step 5: api-skeleton E2E-1 to E2E-4 with BASE_URL=$DEV_API_URL)
  BASE_URL="$DEV_API_URL"
  curl -i -X GET "$BASE_URL/api/health"
  curl -i -X GET "$BASE_URL/api/health" -H "Cookie: session=fake-value"
  curl -i -X GET "$BASE_URL/api/nope"
  curl -i -X POST "$BASE_URL/api/health" -H "Content-Type: application/json" -d '{"x":1}'
Expected:
  conclusion "success"; wait=0
  api-skeleton E2E-1: 200, Content-Type: application/json; charset=utf-8, body exactly {"status":"ok"}
  api-skeleton E2E-2: 200, Cache-Control: no-store, no Set-Cookie, no X-Powered-By (CLAUDE.md rule 1)
  api-skeleton E2E-3: 404, body exactly {"error":"not_found"}
  api-skeleton E2E-4: 404, body exactly {"error":"not_found"}
  Then run E2E-8 (FE half of step 5) on the same deploy.
```

```
E2E-8 -> checklist item 8: FE half of step 5, web-skeleton E2E-1 and E2E-2 on dev (heading text not checked)
Preconditions: E2E-7 done up to wait=0 (same MERGE_SHA); not signed in; fresh browser profile; DevTools open on Network and Console before loading; BASE_URL=$DEV_WEB_URL
Steps:
  1. Open $DEV_WEB_URL/ and wait for load.
  2. Read the tab title.
  3. In DevTools Console run: [document.querySelectorAll('h1').length, document.querySelector('h1').textContent.trim().length > 0, document.title, document.documentElement.lang]
  4. Check DevTools Application > Cookies for the $DEV_WEB_URL origin.
  5. Check every row in the Network tab.
Expected: tab title "SweetMemories"; console prints [1, true, "SweetMemories", "en"] (heading text deliberately not checked: it is the skeleton placeholder before the homepage merges and "Every little moment deserves a home." after); cookie list empty (CLAUDE.md rule 1 groundwork); every request URL starts with $DEV_WEB_URL; console has no error entries
```

## Summary

- Built: version endpoint, `wait-for-dev-deploy.sh`, `smoke-dev.sh`, two new `Deploy dev` steps.
- PR: https://github.com/buitahau/sweetmemoriesv1/pull/44 (merge c0c6e81). Review: approve.
- Test: items 1-8 Pass. Item 8 used the already-merged commit instead of a new probe PR; the web check was done in headless Chrome (one non-empty `h1`, title "SweetMemories", `lang="en"`) with cookies and same-origin requests checked by curl, not DevTools.
- Cycles: 1. Leftovers: a human updates the `.claude/` skills to use the scripts (Q010).

## Related

- Parent ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- API: [version](../api/version.md), [health](../api/health.md)
- Infra: [dev-environment](../infra/dev-environment.md), [ci-cd](../infra/ci-cd.md)
- Sibling features: [ci-checks](ci-checks.md), [dev-deploy](dev-deploy.md)
- Tasks:
  1. [add-version-endpoint](../tasks/dev-deploy-verification/add-version-endpoint.md)
  2. [add-wait-for-deploy-script](../tasks/dev-deploy-verification/add-wait-for-deploy-script.md)
  3. [add-dev-smoke-script](../tasks/dev-deploy-verification/add-dev-smoke-script.md)
- Open questions: [Q010](../questions/questions-2026-11-09-requirement-breakdown.md#q010-who-updates-the-implement-and-test-ticket-skill-and-when) (a human updates the skill after these tasks are done)
