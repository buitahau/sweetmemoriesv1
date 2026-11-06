# Add health endpoint

- Status: not-started

## Goal

Add `GET /api/health` to `apps/api`, returning `200 {"status":"ok"}` exactly as specified in [api/health.md](../../api/health.md).

## Scope

Area: API. Files:

| File | Content |
|---|---|
| `apps/api/src/routes/health.ts` | `export const healthRouter = Router()` (from `express`). `healthRouter.get('/health', (req, res) => { res.set('Cache-Control', 'no-store'); res.status(200).json({ status: 'ok' }) })`. No database, S3 or auth calls. |
| `apps/api/src/app.ts` | Register `app.use('/api', healthRouter)` at the "later tasks register routes here" spot: after `app.disable('x-powered-by')` and before `options.testRoutes`, the 404 handler and the error handler. Import with `./routes/health.js`. |
| `apps/api/test/health.test.ts` | Vitest + supertest tests for every case in the checklist items 1-5. |

Response contract (from [api/health.md](../../api/health.md)): status 200, `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store`, no `Set-Cookie`, no `X-Powered-By`, body exactly `{"status":"ok"}`. `POST /api/health` returns the existing 404 `{"error":"not_found"}`.

Also: in [docs/api/health.md](../../api/health.md) change the status line to `Status: current ([ADR 0001](../adr/0001-monorepo-skeleton-and-tooling.md)). Implemented by [add-health-endpoint](../tasks/api-skeleton/add-health-endpoint.md).` (writing-docs: docs describe the current truth, updated in the same change as the code).

Prerequisites:
- Design gate: [Q001](../../questions/questions-2026-11-08-requirement-breakdown.md#q001-does-this-requirement-approve-writing-skeleton-code-during-the-design-phase) answered "Yes", [ADR 0001](../../adr/0001-monorepo-skeleton-and-tooling.md) Status `accepted`, `CLAUDE.md` "Project state" updated by a human. Otherwise do not start.
- Tasks (must be `done`): [scaffold-api-app](scaffold-api-app.md).

Out of scope: database or other readiness checks ([Q004](../../questions/questions-2026-11-08-requirement-breakdown.md)), version or uptime fields, 405 handling, CORS, calling the endpoint from the web app.

Security: public endpoint, no auth. It must not read or set cookies (groundwork for CLAUDE.md security rule 1) and must return no private data (rule 5).

## Verification checklist

The task is complete only when every item below passes. Tags name the [api-skeleton](../../features/api-skeleton.md) acceptance criterion (ACn) or requirement each item proves.

- [ ] 1. Test: `GET /api/health` -> 200, `Content-Type` matches `application/json`, body deep-equals `{ status: 'ok' }` and raw text equals `{"status":"ok"}`. (AC1)
- [ ] 2. Test: the response has `cache-control: no-store` and no `set-cookie` or `x-powered-by` header, also when the request sends `Cookie: session=fake-value`. (AC2)
- [ ] 3. Test: `HEAD /api/health` -> 200 with empty body. (AC1; [api/health.md](../../api/health.md) contract)
- [ ] 4. Test: `GET /api/health/` and `GET /api/health?probe=1` -> 200 `{"status":"ok"}`. (AC1)
- [ ] 5. Test: `POST /api/health` -> 404 `{"error":"not_found"}`. (AC3)
- [ ] 6. `npm test -w apps/api` exits 0 (including the scaffold tests) and `npm run typecheck -w apps/api` exits 0. (AC6)
- [ ] 7. With `npm start -w apps/api` running, `curl -s http://localhost:3000/api/health` prints `{"status":"ok"}` and answers in under 0.5 s (`curl -w "%{time_total}"`). (AC1)
- [ ] 8. `apps/api/src/routes/health.ts` imports nothing except `express`. (Behavior: no database, S3 or auth calls)
- [ ] 9. `docs/api/health.md` status line starts with `Status: current`. (writing-docs rule: docs describe the current truth)

## e2e-test-suites

Type: BE. `$BASE_URL` = `http://localhost:3000`; start with `npm run build -w apps/api && npm start -w apps/api`. No sign-in, no `$SESSION`.

```
E2E-1 -> checklist items 1, 7: health ok
Preconditions: API running
Request:
  curl -i -X GET "$BASE_URL/api/health" -w "\ntime=%{time_total}\n"
Expected: 200; Content-Type: application/json; charset=utf-8; body exactly {"status":"ok"}; time < 0.5
```

```
E2E-2 -> checklist item 2: headers, cookie sent
Preconditions: API running
Request:
  curl -i -X GET "$BASE_URL/api/health" -H "Cookie: session=fake-value"
Expected: 200; Cache-Control: no-store; no Set-Cookie; no X-Powered-By (CLAUDE.md security rule 1)
```

```
E2E-3 -> checklist item 3: HEAD
Preconditions: API running
Request:
  curl -I "$BASE_URL/api/health"
Expected: HTTP 200; Content-Type application/json; no body
```

```
E2E-4 -> checklist item 4: trailing slash and query string
Preconditions: API running
Request:
  curl -s "$BASE_URL/api/health/"; echo; curl -s "$BASE_URL/api/health?probe=1"
Expected: both print {"status":"ok"}
```

```
E2E-5 -> checklist item 5: wrong method
Preconditions: API running
Request:
  curl -i -X POST "$BASE_URL/api/health" -H "Content-Type: application/json" -d '{"status":"down"}'
Expected: 404; body exactly {"error":"not_found"}
```

```
E2E-6 -> checklist items 6, 8, 9: tests, types, imports, API doc status
Preconditions: npm install done
Request:
  npm test -w apps/api -- --reporter=verbose; echo "t=$?"
  npm run typecheck -w apps/api; echo "tc=$?"
  grep -E "^import" apps/api/src/routes/health.ts
  grep -c '^Status: current' docs/api/health.md
Expected: t=0 with health tests listed as passed; tc=0; only an import from 'express'; count 1
```

## Links

- Feature: [api-skeleton](../../features/api-skeleton.md)
- ADR: [0001-monorepo-skeleton-and-tooling](../../adr/0001-monorepo-skeleton-and-tooling.md)
- API: [health](../../api/health.md)
