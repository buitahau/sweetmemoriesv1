# API skeleton

- Status: done

## Summary

A minimal Node backend (`apps/api`, Express 5, TypeScript) that starts locally and answers one endpoint, `GET /api/health`, with `{"status":"ok"}`. It proves the backend toolchain (dev, build, start, test) works before any real feature is built. Decided in [ADR 0001](../adr/0001-monorepo-skeleton-and-tooling.md); contract in [api/health.md](../api/health.md).

## User story

As a developer or deploy script, I want to call a health endpoint on the API, so that I know the API process is running and answering requests.

Acceptance criteria:
1. `GET /api/health` returns 200 with body exactly `{"status":"ok"}` and `Content-Type: application/json`.
2. The response has `Cache-Control: no-store`, no `Set-Cookie` and no `X-Powered-By` header.
3. Unknown paths and wrong methods return 404 with body `{"error":"not_found"}`.
4. Unexpected errors return 500 with body `{"error":"internal_error"}` and no stack trace.
5. The API listens on `PORT` (default 3000); an invalid `PORT` or a port already in use makes the process exit with code 1 and a clear message.
6. `dev`, `build`, `start`, `test` and `typecheck` scripts work inside `apps/api`.

## Behavior

- `apps/api/src/app.ts` exports `createApp()` returning the Express app (no `listen`), so tests can use `supertest(createApp())`.
- `apps/api/src/server.ts` validates `PORT`, calls `createApp().listen(port)` without a callback, and logs `API listening on http://localhost:<port>` only from the server's `'listening'` event (Express 5 also passes a `listen` callback to the `'error'` event, which would print a false start line on a busy port).
- `PORT` rule: unset or empty -> 3000; integer 1-65535 -> used; anything else -> log `Invalid PORT: <value>` to stderr and exit 1.
- Port already in use -> log `Port <port> is already in use` to stderr and exit 1.
- No database, S3 or auth calls. No cookies are read or set.

## Out of scope

- Database (Neon) connection or readiness check ([Q004](../questions/questions-2026-11-08-requirement-breakdown.md)).
- Better Auth, sessions, CORS, rate limiting, logging library, Docker, deploy.
- Any domain endpoint (User, Memory, Template, Block, Photo).
- Reusing the parked backend draft ([Q003](../questions/questions-2026-11-08-requirement-breakdown.md)).

## Verification checklist

The feature is complete only when every item below passes.

- [x] 1. Both tasks of this feature have Status `done`. (all ACs)
- [x] 2. `curl -i $BASE_URL/api/health` returns `HTTP/1.1 200`, `Content-Type: application/json; charset=utf-8` and body exactly `{"status":"ok"}`. (AC1)
- [x] 3. The same response has `Cache-Control: no-store` and no `Set-Cookie` or `X-Powered-By` header, also when the request sends a `Cookie` header. (AC2; supports CLAUDE.md security rule 1: no cookies on public responses)
- [x] 4. `GET $BASE_URL/api/nope` and `POST $BASE_URL/api/health` return 404 with body `{"error":"not_found"}`. (AC3)
- [x] 5. An automated test proves a thrown error returns 500 with body `{"error":"internal_error"}` and the body does not contain the word `Error:` or a file path. (AC4)
- [x] 6. `PORT=4000 npm start -w apps/api` serves on port 4000; `PORT=abc node apps/api/dist/server.js` and `PORT=70000 node apps/api/dist/server.js` exit with code 1 and print `Invalid PORT: <value>`; a second `node apps/api/dist/server.js` on a busy port exits with code 1, prints `Port <port> is already in use` and prints no `API listening` line. (Exit codes are checked on `node` directly because `npm` wraps the child's exit code.) (AC5)
- [x] 7. In `apps/api`: `npm run dev`, `npm run build` (creates `dist/server.js`), `npm start`, `npm test` and `npm run typecheck` (covers `src` and `test`) all work and exit 0 where they terminate. (AC6)
- [x] 8. `apps/api` has no dependency on a database, S3, auth or CORS package (`grep -E '"(pg|@neondatabase/[^"]*|@aws-sdk/[^"]*|better-auth|cors)"' apps/api/package.json` finds nothing). (Out of scope)

## e2e-test-suites

Type: BE. `$BASE_URL` = `http://localhost:3000` unless the case sets `PORT`. Start the API with `npm run build -w apps/api && npm start -w apps/api` unless stated.

```
E2E-1 -> checklist item 2: health returns ok
Preconditions: API running; no sign-in, no cookies
Request:
  curl -i -X GET "$BASE_URL/api/health"
Expected: 200; header Content-Type: application/json; charset=utf-8; body exactly {"status":"ok"}
```

```
E2E-2 -> checklist item 3: no cookies, no caching, no framework banner
Preconditions: API running
Request:
  curl -i -X GET "$BASE_URL/api/health" -H "Cookie: session=fake-value"
Expected: 200; Cache-Control: no-store present; no Set-Cookie header; no X-Powered-By header (CLAUDE.md security rule 1)
```

```
E2E-3 -> checklist item 4: unknown path
Preconditions: API running
Request:
  curl -i -X GET "$BASE_URL/api/nope"
Expected: 404; body exactly {"error":"not_found"}
```

```
E2E-4 -> checklist item 4: wrong method
Preconditions: API running
Request:
  curl -i -X POST "$BASE_URL/api/health" -H "Content-Type: application/json" -d '{"x":1}'
Expected: 404; body exactly {"error":"not_found"}
```

```
E2E-5 -> checklist item 5: unexpected error hides details
Preconditions: none (automated test)
Request:
  npm test -w apps/api -- --reporter=verbose
Expected: exit 0; output lists a test named "returns 500 internal_error when a route throws" as passed
```

```
E2E-6 -> checklist item 6: PORT handling
Preconditions: API built (npm run build -w apps/api); port 4000 free
Request:
  PORT=4000 npm start -w apps/api & sleep 3; curl -s "http://localhost:4000/api/health"; kill %1
  PORT=abc node apps/api/dist/server.js; echo "exit=$?"
  PORT=70000 node apps/api/dist/server.js; echo "exit=$?"
  node apps/api/dist/server.js & sleep 3; node apps/api/dist/server.js > /tmp/api-busy.log 2>&1; echo "exit=$?"; kill %1; cat /tmp/api-busy.log
Expected: first prints {"status":"ok"}; second and third print "Invalid PORT: abc" / "Invalid PORT: 70000" and exit=1; fourth: exit=1, /tmp/api-busy.log contains "Port 3000 is already in use" and no "API listening"
```

```
E2E-7 -> checklist items 7, 8: scripts and dependencies
Preconditions: npm install done
Request:
  npm run build -w apps/api && ls apps/api/dist/server.js
  npm test -w apps/api; echo "test=$?"
  npm run typecheck -w apps/api; echo "tc=$?"
  grep -E '"(pg|@neondatabase/[^"]*|@aws-sdk/[^"]*|better-auth|cors)"' apps/api/package.json; echo "deps=$?"
Expected: dist/server.js listed; test=0; tc=0; deps=1 (no match)
```

## Related

- Parent ADR: [0001-monorepo-skeleton-and-tooling](../adr/0001-monorepo-skeleton-and-tooling.md)
- API: [health](../api/health.md)
- Infra: [local-development](../infra/local-development.md)
- Tasks:
  1. [scaffold-api-app](../tasks/api-skeleton/scaffold-api-app.md)
  2. [add-health-endpoint](../tasks/api-skeleton/add-health-endpoint.md)
