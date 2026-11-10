# Add version endpoint

- Status: done

## Goal

Add `GET /api/version` to `apps/api`, returning `200 {"commit":"<sha>"}` from `process.env.GIT_SHA`, exactly as specified in [api/version.md](../../api/version.md).

## Scope

Area: API. Follow the pattern of [add-health-endpoint](../api-skeleton/add-health-endpoint.md) (`src/routes/health.ts`).

| File | Content |
|---|---|
| `apps/api/src/routes/version.ts` | `export function commitFrom(value: string \| undefined): string` returns `value` if it matches `/^[0-9a-f]{40}$/`, otherwise `'unknown'`. `export const versionRouter = Router()`; `versionRouter.get('/version', (req, res) => { res.set('Cache-Control', 'no-store'); res.status(200).json({ commit: commitFrom(process.env.GIT_SHA) }) })`. Read `process.env.GIT_SHA` inside the handler (not at import time). Imports only `express`. |
| `apps/api/src/app.ts` | Register `app.use('/api', versionRouter)` directly after the existing `app.use('/api', healthRouter)` line. Import from `./routes/version.js`. |
| `apps/api/test/version.test.ts` | Vitest + supertest tests for checklist items 1-6. Set and restore `process.env.GIT_SHA` per test (`vi.stubEnv('GIT_SHA', ...)` and `vi.unstubAllEnvs()` in `afterEach`). |
| `docs/api/version.md` | Change the status line to `Status: current ([ADR 0002](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)). Implemented by [add-version-endpoint](../tasks/dev-deploy-verification/add-version-endpoint.md).` |

Prerequisites:
- Features `done`: [api-skeleton](../../features/api-skeleton.md).
- Tasks `done`: [add-ci-workflow](../ci-checks/add-ci-workflow.md) (`dev-v1` exists, this task's PR into it is checked by `verify`, and `$BASE_BRANCH` is `origin/dev-v1`).
- Same design gate as [add-ci-workflow](../ci-checks/add-ci-workflow.md).
- Not required: Cloudflare or the deploy workflow. This task is verified fully locally. The check that dev serves the deployed commit is item 9 of [add-wait-for-deploy-script](add-wait-for-deploy-script.md).

Out of scope: changing `GET /api/health`, adding build time, version number, uptime or environment name, reading git at runtime, the web `version.json` (written by the deploy workflow).

Security: public endpoint, no auth, no cookies (CLAUDE.md rule 1 groundwork). Only a validated 40-hex value or `unknown` is returned, never the raw variable (rule 5: no private data in output).

## Verification checklist

The task is complete only when every item below passes. Tags name the [dev-deploy-verification](../../features/dev-deploy-verification.md) acceptance criterion (ACn).

- [x] 1. Test: with `GIT_SHA` = a 40-char lowercase hex string, `GET /api/version` -> 200, `Content-Type` `application/json`, body exactly `{"commit":"<that string>"}`. (AC1)
- [x] 2. Test: `GIT_SHA` unset, `""`, `abc`, a 40-char string with uppercase `A`, a 41-char hex string, and `<script>` each give body `{"commit":"unknown"}`. (AC1; validation)
- [x] 3. Test: response has `cache-control: no-store`, no `set-cookie`, no `x-powered-by`, also when the request sends `Cookie: session=fake-value`. (AC1; CLAUDE.md rule 1)
- [x] 4. Test: `HEAD /api/version` -> 200, empty body; `GET /api/version/` and `GET /api/version?x=1` -> 200 same body. (AC1)
- [x] 5. Test: `POST /api/version` -> 404 `{"error":"not_found"}`. (AC1; whole-API rule)
- [x] 6. Test: `GET /api/health` still returns body exactly `{"status":"ok"}`. (Out of scope: health unchanged)
- [x] 7. `npm test -w apps/api` and `npm run typecheck -w apps/api` exit 0; `npm run build -w apps/api && npm start -w apps/api` (with `GIT_SHA` unset), then `curl -s localhost:3000/api/version` prints `{"commit":"unknown"}`. (AC1)
- [x] 8. `docs/api/version.md` status line starts with `Status: current`; `apps/api/src/routes/version.ts` imports only from `express`. (writing-docs: docs describe the current truth)

## e2e-test-suites

Type: BE. Local only: `$BASE_URL` = `http://localhost:3000` (start with `npm run build -w apps/api && GIT_SHA=$SHA npm start -w apps/api`). `$SHA` = `0123456789abcdef0123456789abcdef01234567`.

```
E2E-1 -> checklist items 1, 3: valid commit, headers
Preconditions: API running with GIT_SHA=$SHA
Request:
  curl -i -X GET "$BASE_URL/api/version" -H "Cookie: session=fake-value"
Expected: 200; Content-Type: application/json; charset=utf-8; Cache-Control: no-store; no Set-Cookie; no X-Powered-By; body exactly {"commit":"0123456789abcdef0123456789abcdef01234567"} (CLAUDE.md rule 1)
```

```
E2E-2 -> checklist items 2, 7: invalid or missing value
Preconditions: API built; port 3000 free
Request:
  for v in "" abc "0123456789ABCDEF0123456789abcdef01234567" "0123456789abcdef0123456789abcdef012345678" "<script>"; do GIT_SHA="$v" npm start -w apps/api >/dev/null 2>&1 & sleep 3; curl -s "$BASE_URL/api/version"; echo; kill %1; sleep 1; done
  npm start -w apps/api >/dev/null 2>&1 & sleep 3; curl -s "$BASE_URL/api/version"; kill %1
Expected: six lines, each exactly {"commit":"unknown"}
```

```
E2E-3 -> checklist item 4: HEAD, trailing slash, query
Preconditions: API running with GIT_SHA=$SHA
Request:
  curl -I "$BASE_URL/api/version"
  curl -s "$BASE_URL/api/version/"; echo; curl -s "$BASE_URL/api/version?x=1"
Expected: HTTP 200 with no body; both print {"commit":"0123456789abcdef0123456789abcdef01234567"}
```

```
E2E-4 -> checklist items 5, 6: wrong method, health unchanged
Preconditions: API running
Request:
  curl -i -X POST "$BASE_URL/api/version" -H "Content-Type: application/json" -d '{"commit":"x"}'
  curl -s "$BASE_URL/api/health"
Expected: 404 {"error":"not_found"}; {"status":"ok"}
```

```
E2E-5 -> checklist items 7, 8: tests, types, doc, imports
Preconditions: npm install done
Request:
  npm test -w apps/api -- --reporter=verbose; echo "t=$?"
  npm run typecheck -w apps/api; echo "tc=$?"
  grep -c '^Status: current' docs/api/version.md
  grep -E '^import' apps/api/src/routes/version.ts
Expected: t=0 with version tests passed; tc=0; 1; only an import from 'express'
```

## Summary

- Built: `apps/api/src/routes/version.ts`, registration in `app.ts`, `test/version.test.ts`, `docs/api/version.md` now current.
- PR: https://github.com/buitahau/sweetmemoriesv1/pull/44. Review: approve; Nit/Minor fixed.
- Test: items 1-8 Pass (24 API tests, typecheck, live `/api/version` on dev shows the merge commit, no cookie).
- Cycles: 1. Leftovers: none.

## Links

- Feature: [dev-deploy-verification](../../features/dev-deploy-verification.md)
- ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- API: [version](../../api/version.md), [health](../../api/health.md)
