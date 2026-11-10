# Add wait-for-deploy script

- Status: done

## Goal

Create `scripts/wait-for-dev-deploy.sh <commit-sha>`, which waits until both dev apps report that commit (or a later `dev-v1` commit) and then exits 0, so agents never rely on fixed sleeps.

## Scope

Area: infra (one shell script). Behavior defined in [dev-deploy-verification](../../features/dev-deploy-verification.md#behavior) and [infra/dev-environment.md](../../infra/dev-environment.md#deployed-commit-markers).

File `scripts/wait-for-dev-deploy.sh`, executable (`git update-index --chmod=+x`), first line `#!/usr/bin/env bash`, then `set -euo pipefail`. Uses only `bash`, `curl`, `git`, `node`.

| Part | Exact behavior |
|---|---|
| Arguments | Exactly one: target SHA, must match `^[0-9a-f]{40}$`. Otherwise print `usage: wait-for-dev-deploy.sh <40-hex-commit-sha>` to stderr, exit 2. |
| Config | `DEV_API_URL` and `DEV_WEB_URL` required (non-empty). Missing: print `DEV_API_URL and DEV_WEB_URL must be set` to stderr, exit 2. `WAIT_TIMEOUT_SECONDS` optional, default `600`, must be a positive integer, else exit 2 with `WAIT_TIMEOUT_SECONDS must be a positive integer`. |
| Read a marker | Function `read_commit <url>`: `curl -fsS --max-time 10 "<url>"`, pipe to `node -e` that parses JSON from stdin and prints `.commit` if it is a 40-hex string, else prints `none`. Any curl or parse error prints `none` (never exits the script). |
| Markers | API: `$DEV_API_URL/api/version`; web: `$DEV_WEB_URL/version.json`. |
| "Is live" | Function `is_live <deployed>`: true if `<deployed>` equals the target; else, if `<deployed>` is not `none`, run `git fetch --quiet origin dev-v1` (ignore errors) and return the result of `git merge-base --is-ancestor <target> <deployed>` (false on any error, e.g. unknown commit). |
| Loop | Every 10 s until the timeout: read both markers; print `waiting: api=<value> web=<value>`; if both are live, print `deployed: api=<value> web=<value>` and exit 0. |
| Timeout | Print `timeout after <n>s: api=<value> web=<value> target=<sha>` to stderr, exit 1. |

Also: in [infra/dev-environment.md](../../infra/dev-environment.md) step 4 of "How an agent verifies", confirm the exit codes match; change nothing else.

Prerequisites:
- Tasks `done`: [add-version-endpoint](add-version-endpoint.md), [add-deploy-dev-workflow](../dev-deploy/add-deploy-dev-workflow.md) (items 4-6 and 9 need live dev with `GET /api/version` deployed; items 1-3, 7 and 8 need no network and can be coded and checked first).
- Same design gate as [add-ci-workflow](../ci-checks/add-ci-workflow.md).

Out of scope: calling the script from the workflow ([add-dev-smoke-script](add-dev-smoke-script.md)), `jq`, Windows support, checking GitHub run status (steps 2-3 of the agent procedure), retries on HTTP 5xx beyond the normal loop.

Security: the script prints only commit values or `none`, never raw response bodies, headers or env values (CLAUDE.md rule 5; writing-docs: no secrets).

## Verification checklist

The task is complete only when every item below passes. Tags name the [dev-deploy-verification](../../features/dev-deploy-verification.md) acceptance criterion (ACn).

- [x] 1. `scripts/wait-for-dev-deploy.sh` with no argument, with `abc`, and with two arguments exits 2 and prints the usage line. (AC3)
- [x] 2. With a valid SHA but `DEV_API_URL` unset, or `WAIT_TIMEOUT_SECONDS=0` or `=x`, it exits 2 with the matching message. (AC3)
- [x] 3. With `DEV_API_URL=http://127.0.0.1:9` and `DEV_WEB_URL=http://127.0.0.1:9` (closed port) and `WAIT_TIMEOUT_SECONDS=15`, it prints `waiting: api=none web=none` at least once and exits 1 within 30 s with the `timeout after` line. (AC3; network errors count as "not yet")
- [x] 4. Against dev, with the deployed SHA, it exits 0 within 15 s and prints `deployed:`. (AC3)
- [x] 5. Against dev, with the parent of the deployed SHA, it exits 0. (AC3: later commit accepted)
- [x] 6. Against dev, with `0000000000000000000000000000000000000000` and `WAIT_TIMEOUT_SECONDS=20`, it exits 1. (AC3)
- [x] 7. `git ls-files -s scripts/wait-for-dev-deploy.sh` shows mode `100755`; `bash -n scripts/wait-for-dev-deploy.sh` exits 0. (Scope)
- [x] 8. No output line contains anything other than the fixed messages, commit values and `none` (checked in the outputs of items 1-6). (Security)
- [x] 9. Dev serves the deployed commit: after the newest `Deploy dev` run on `dev-v1` ended `success`, `curl -s $DEV_API_URL/api/version` prints `{"commit":"<that run's headSha>"}`, and so does `curl -s $DEV_WEB_URL/version.json`. (AC1, AC2; moved here from [add-version-endpoint](add-version-endpoint.md) so that task can be verified locally)

## e2e-test-suites

Type: BE (script). Run from the repo root. `$DEV_API_URL`, `$DEV_WEB_URL` as in [dev-environment](../../infra/dev-environment.md); `X=$(curl -s "$DEV_API_URL/api/version" | node -pe 'JSON.parse(require("fs").readFileSync(0)).commit')`.

```
E2E-1 -> checklist items 1, 2, 8: argument and config errors
Preconditions: none (no network needed)
Request:
  S=scripts/wait-for-dev-deploy.sh; V=0123456789abcdef0123456789abcdef01234567
  $S; echo "e=$?"; $S abc; echo "e=$?"; $S $V $V; echo "e=$?"
  env -u DEV_API_URL DEV_WEB_URL=http://x $S $V; echo "e=$?"
  DEV_API_URL=http://x DEV_WEB_URL=http://x WAIT_TIMEOUT_SECONDS=0 $S $V; echo "e=$?"
  DEV_API_URL=http://x DEV_WEB_URL=http://x WAIT_TIMEOUT_SECONDS=x $S $V; echo "e=$?"
Expected: first three print the usage line and e=2; fourth prints "DEV_API_URL and DEV_WEB_URL must be set", e=2; last two print "WAIT_TIMEOUT_SECONDS must be a positive integer", e=2
```

```
E2E-2 -> checklist items 3, 8: unreachable dev counts as not yet
Preconditions: nothing listens on 127.0.0.1:9
Request:
  time (DEV_API_URL=http://127.0.0.1:9 DEV_WEB_URL=http://127.0.0.1:9 WAIT_TIMEOUT_SECONDS=15 scripts/wait-for-dev-deploy.sh 0123456789abcdef0123456789abcdef01234567; echo "e=$?")
Expected: at least one "waiting: api=none web=none"; a "timeout after 15s: api=none web=none target=0123..." line; e=1; real time under 30 s
```

```
E2E-3 -> checklist items 4, 5, 6: against live dev
Preconditions: dev deployed; X set as above; git fetch origin dev-v1 done
Request:
  scripts/wait-for-dev-deploy.sh "$X"; echo "live=$?"
  scripts/wait-for-dev-deploy.sh "$(git rev-parse "$X"~1)"; echo "parent=$?"
  WAIT_TIMEOUT_SECONDS=20 scripts/wait-for-dev-deploy.sh 0000000000000000000000000000000000000000; echo "none=$?"
Expected: live=0 with "deployed: api=<X> web=<X>"; parent=0; none=1
```

```
E2E-4 -> checklist item 7: file mode and syntax
Preconditions: committed
Request:
  git ls-files -s scripts/wait-for-dev-deploy.sh | cut -d' ' -f1
  bash -n scripts/wait-for-dev-deploy.sh; echo "syntax=$?"
Expected: 100755; syntax=0
```

```
E2E-5 -> checklist item 9: deployed value on dev
Preconditions: add-version-endpoint merged into dev-v1; no Deploy dev run in progress
Request:
  gh run list --workflow deploy-dev.yml --branch dev-v1 --limit 1 --json headSha,conclusion
  curl -s "$DEV_API_URL/api/version"; echo
  curl -s "$DEV_WEB_URL/version.json"; echo
Expected: conclusion "success"; both bodies exactly {"commit":"<headSha>"}
```

## Summary

- Built: `scripts/wait-for-dev-deploy.sh` (100755).
- PR: https://github.com/buitahau/sweetmemoriesv1/pull/44. Review: approve; timeout overrun fixed.
- Test: items 1-9 Pass (live=0, parent=0, unknown commit=1 after about 21 s, bad arg and missing URL=2).
- Cycles: 1. Leftovers: none.

## Links

- Feature: [dev-deploy-verification](../../features/dev-deploy-verification.md)
- ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- Infra: [dev-environment](../../infra/dev-environment.md)
- API: [version](../../api/version.md)
- Next: [add-dev-smoke-script](add-dev-smoke-script.md)
