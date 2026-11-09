# Add dev smoke script

- Status: not-started

## Goal

Create `scripts/smoke-dev.sh`, which checks that the deployed dev API and web answer correctly and set no cookies, and run it plus the wait script at the end of every `Deploy dev` run.

## Scope

Area: infra (one shell script, two workflow steps). Follow [dev-deploy-verification](../../features/dev-deploy-verification.md) and the style of [add-wait-for-deploy-script](add-wait-for-deploy-script.md) (`#!/usr/bin/env bash`, `set -euo pipefail`, only `bash`, `curl`, `node`, executable bit set).

`scripts/smoke-dev.sh` (no arguments; `DEV_API_URL` and `DEV_WEB_URL` required, missing -> stderr `DEV_API_URL and DEV_WEB_URL must be set`, exit 2). Every request uses `curl -sS --max-time 10` with header `Cookie: session=fake-value`. Four checks, run in this order, all of them even if one fails:

| # | Name printed | Request | Passes when |
|---|---|---|---|
| 1 | `api health` | `GET $DEV_API_URL/api/health` | status 200, body exactly `{"status":"ok"}`, no `set-cookie` header |
| 2 | `api version` | `GET $DEV_API_URL/api/version` | status 200, body `.commit` is 40-hex, no `set-cookie` |
| 3 | `web home` | `GET $DEV_WEB_URL/` | status 200, body contains `<title>SweetMemories</title>` and `<div id="root">`, header `x-robots-tag: noindex` (case-insensitive), no `set-cookie` |
| 4 | `web version` | `GET $DEV_WEB_URL/version.json` | status 200, body `.commit` is 40-hex and equals check 2's commit, no `set-cookie` |

Output: one line per check, `PASS <name>` or `FAIL <name>: <reason>`, where `<reason>` is one of `status <code>`, `unexpected body`, `set-cookie present`, `missing noindex`, `commit mismatch`, `request failed`. Never print bodies or headers. Exit 0 if all four pass, else 1.

`.github/workflows/deploy-dev.yml`: replace the comment `# post-deploy checks: see add-dev-smoke-script` with two steps (no `if:`, no `continue-on-error`), step-level `env: DEV_API_URL: ${{ vars.DEV_API_URL }}` and `DEV_WEB_URL: ${{ vars.DEV_WEB_URL }}`:

10. `Wait for dev deploy`: `run: WAIT_TIMEOUT_SECONDS=180 scripts/wait-for-dev-deploy.sh "$GITHUB_SHA"`
11. `Smoke test dev`: `run: scripts/smoke-dev.sh`

Prerequisites:
- Tasks `done`: [add-wait-for-deploy-script](add-wait-for-deploy-script.md), [add-deploy-dev-workflow](../dev-deploy/add-deploy-dev-workflow.md).
- Same design gate as [add-ci-workflow](../ci-checks/add-ci-workflow.md).

Out of scope: browser or JavaScript-rendered checks, ticket-specific tests, retries, notifications, automatic rollback ([Q008](../../questions/questions-2026-11-09-requirement-breakdown.md)), changing the `.claude/` skills.

Security: the script must not print bodies, headers or env values (writing-docs: no secrets; CLAUDE.md rule 5). Check "no `set-cookie`" proves CLAUDE.md rule 1 groundwork on every deploy. Steps 10 and 11 get no secrets.

## Verification checklist

The task is complete only when every item below passes. Tags name the [dev-deploy-verification](../../features/dev-deploy-verification.md) acceptance criterion (ACn).

- [ ] 1. Against live dev, `scripts/smoke-dev.sh` prints exactly `PASS api health`, `PASS api version`, `PASS web home`, `PASS web version` and exits 0. (AC4)
- [ ] 2. With `DEV_API_URL=https://example.invalid`, it prints `FAIL api health: request failed` and `FAIL api version: request failed`, still runs checks 3 and 4, and exits 1. (AC4)
- [ ] 3. With `DEV_WEB_URL` pointing at `$DEV_API_URL` (wrong app), check 3 prints `FAIL web home: ...` and the script exits 1. (AC4)
- [ ] 4. With `DEV_API_URL` unset it exits 2 with the message from Scope. (AC4)
- [ ] 5. Locally, with no dev environment: run the API on `localhost:3000` with `GIT_SHA` set and point both URLs at it; checks 1 and 2 pass, checks 3 and 4 print `FAIL ...: status 404`, exit 1. (AC4; testable without network)
- [ ] 6. `deploy-dev.yml` has steps 10 and 11 after "Deploy web", with only `vars.` (no `secrets.`) in their `env`; `grep -c -F 'WAIT_TIMEOUT_SECONDS=180 scripts/wait-for-dev-deploy.sh "$GITHUB_SHA"' .github/workflows/deploy-dev.yml` prints 1. (AC5: timeout 180 s)
- [ ] 7. The `Deploy dev` run for this task's merge commit ends `success`, and its log shows both new steps succeeding. (AC5)
- [ ] 8. No output line of items 1-5 contains a body, header value or env value (only the fixed `PASS`/`FAIL` formats). (Security)
- [ ] 9. `git ls-files -s scripts/smoke-dev.sh` shows `100755`; `bash -n scripts/smoke-dev.sh` exits 0. (Scope)
- [ ] 10. After steps 10 and 11 are added, `grep -c -E 'continue-on-error|^\s+if:' .github/workflows/deploy-dev.yml` prints 0 and neither step sets `shell:`. With the default `run` shell (`bash -e`), a non-zero exit of either script (proven by items 2-5) fails the step and the run, so this is checked in the file, as in [dev-deploy](../../features/dev-deploy.md) checklist item 3. No live negative run is required: it would mean pointing the shared `dev` environment variables at a wrong URL. (AC5)

## e2e-test-suites

Type: BE (script + workflow). `$DEV_API_URL`, `$DEV_WEB_URL` as in [dev-environment](../../infra/dev-environment.md). Run from the repo root.

```
E2E-1 -> checklist items 1, 8: all checks pass on dev
Preconditions: a successful deploy of a commit that contains add-version-endpoint
Request:
  scripts/smoke-dev.sh; echo "e=$?"
Expected: exactly the four PASS lines in order; e=0; no other output
```

```
E2E-2 -> checklist items 2, 8: API unreachable
Preconditions: as E2E-1
Request:
  DEV_API_URL=https://example.invalid scripts/smoke-dev.sh; echo "e=$?"
Expected: "FAIL api health: request failed", "FAIL api version: request failed", then a line for "web home" and a "FAIL web version: ..." line (commit cannot match); e=1
```

```
E2E-3 -> checklist item 3: wrong app behind the web URL
Preconditions: as E2E-1
Request:
  DEV_WEB_URL="$DEV_API_URL" scripts/smoke-dev.sh; echo "e=$?"
Expected: PASS api health, PASS api version, "FAIL web home: status 404" (or "unexpected body"), a FAIL web version line; e=1
```

```
E2E-4 -> checklist item 4: missing config
Preconditions: none
Request:
  env -u DEV_API_URL DEV_WEB_URL=http://x scripts/smoke-dev.sh; echo "e=$?"
Expected: "DEV_API_URL and DEV_WEB_URL must be set" on stderr; e=2
```

```
E2E-5 -> checklist item 5: local, no network
Preconditions: npm run build -w apps/api; port 3000 free
Request:
  GIT_SHA=0123456789abcdef0123456789abcdef01234567 npm start -w apps/api >/dev/null 2>&1 & sleep 3
  DEV_API_URL=http://localhost:3000 DEV_WEB_URL=http://localhost:3000 scripts/smoke-dev.sh; echo "e=$?"; kill %1
Expected: PASS api health; PASS api version; "FAIL web home: status 404"; "FAIL web version: status 404"; e=1
```

```
E2E-6 -> checklist items 6, 7: workflow steps
Preconditions: this task's PR merged; its Deploy dev run finished
Request:
  grep -n -E 'name: (Deploy web|Wait for dev deploy|Smoke test dev)$|vars\.DEV_|secrets\.' .github/workflows/deploy-dev.yml
  grep -c -F 'WAIT_TIMEOUT_SECONDS=180 scripts/wait-for-dev-deploy.sh "$GITHUB_SHA"' .github/workflows/deploy-dev.yml
  gh run view $(gh run list --workflow deploy-dev.yml --branch dev-v1 --limit 1 --json databaseId -q '.[0].databaseId') --json conclusion,jobs -q '.conclusion, (.jobs[0].steps[] | [.name,.conclusion] | @tsv)'
Expected: Wait and Smoke names after Deploy web; vars.DEV_ lines only after them; all secrets. lines before "Wait for dev deploy"; 1 (timeout line present exactly once); conclusion success; both new steps "success"
```

```
E2E-7 -> checklist item 9: file mode and syntax
Preconditions: committed
Request:
  git ls-files -s scripts/smoke-dev.sh | cut -d' ' -f1; bash -n scripts/smoke-dev.sh; echo "syntax=$?"
Expected: 100755; syntax=0
```

```
E2E-8 -> checklist item 10: nothing can let a failing check pass the run
Preconditions: steps 10 and 11 committed
Request:
  grep -c -E 'continue-on-error|^\s+if:' .github/workflows/deploy-dev.yml
  grep -A4 -E 'name: (Wait for dev deploy|Smoke test dev)$' .github/workflows/deploy-dev.yml | grep -c 'shell:'
Expected: 0; 0
```

## Links

- Feature: [dev-deploy-verification](../../features/dev-deploy-verification.md)
- ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- Infra: [dev-environment](../../infra/dev-environment.md), [ci-cd](../../infra/ci-cd.md)
- Workflow task: [add-deploy-dev-workflow](../dev-deploy/add-deploy-dev-workflow.md)
