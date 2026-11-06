# Scaffold API app

- Status: not-started

## Goal

Create the `apps/api` workspace: an Express 5 TypeScript app that starts on `PORT`, returns JSON 404 and 500 errors, and has working `dev`, `build`, `start`, `test` and `typecheck` scripts. No endpoints yet.

## Scope

Area: API. Follow [ADR 0001](../../adr/0001-monorepo-skeleton-and-tooling.md), [repository-layout](../../architecture/repository-layout.md) and the error table in [api/health.md](../../api/health.md#errors-whole-api).

Install (from the repo root):
- `npm install express@^5 -w apps/api`
- `npm install -D typescript tsx vitest supertest @types/express @types/supertest @types/node -w apps/api`

Files to create:

| File | Content |
|---|---|
| `apps/api/package.json` | `"name": "@sweetmemories/api"`, `"private": true`, `"type": "module"`, scripts: `"dev": "tsx watch src/server.ts"`, `"build": "tsc -p tsconfig.json"`, `"start": "node dist/server.js"`, `"test": "vitest run"`, `"typecheck": "tsc -p tsconfig.test.json"` |
| `apps/api/tsconfig.json` | Used by `build`. `"extends": "../../tsconfig.base.json"`; `compilerOptions`: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`, `"rootDir": "src"`, `"outDir": "dist"`, `"types": ["node"]`; `"include": ["src"]` |
| `apps/api/tsconfig.test.json` | Used by `typecheck`, so test files are type-checked too. `"extends": "./tsconfig.json"`; `compilerOptions`: `"noEmit": true`, `"rootDir": "."`; `"include": ["src", "test"]` |
| `apps/api/src/config.ts` | `export function parsePort(value: string \| undefined): number`. `undefined` or `""` -> `3000`. A string of digits only whose number is 1-65535 -> that number. Anything else -> `throw new Error(\`Invalid PORT: ${value}\`)`. |
| `apps/api/src/app.ts` | `export function createApp(options: { testRoutes?: (app: Express) => void } = {}): Express`. In this order: `app.disable('x-powered-by')`; (later tasks register routes here); `options.testRoutes?.(app)`; 404 handler `app.use((req, res) => res.status(404).json({ error: 'not_found' }))`; error handler with 4 arguments that `console.error`s the error and returns `res.status(500).json({ error: 'internal_error' })`. |
| `apps/api/src/server.ts` | Calls `parsePort(process.env.PORT)` inside try/catch: on error, `console.error(error.message)` and `process.exit(1)`. Then `const server = createApp().listen(port)` with **no callback argument**. `server.on('listening', () => console.log(\`API listening on http://localhost:${port}\`))`. `server.on('error', (err) => ...)`: if `err.code === 'EADDRINUSE'` `console.error(\`Port ${port} is already in use\`)`, otherwise `console.error(err.message)`; then `process.exit(1)`. Why no callback: Express 5 `app.listen(port, cb)` also registers `cb` as a one-time `'error'` listener, so a callback that only logs would print a false `API listening` line when the port is busy. |
| `apps/api/test/config.test.ts` | Vitest tests for `parsePort` (cases in checklist item 3). |
| `apps/api/test/app.test.ts` | Vitest + supertest: 404 case, and a test named exactly `returns 500 internal_error when a route throws` that calls `createApp({ testRoutes: (app) => app.get('/__throw', () => { throw new Error('boom') }) })`. |

Relative imports in `src/` and `test/` end in `.js` (e.g. `import { createApp } from './app.js'`, `import { createApp } from '../src/app.js'`), required by `NodeNext`. Test files import `describe`, `it` and `expect` from `'vitest'` explicitly (Vitest globals are off).

Prerequisites:
- Design gate: [Q001](../../questions/questions-2026-11-08-requirement-breakdown.md#q001-does-this-requirement-approve-writing-skeleton-code-during-the-design-phase) answered "Yes", [ADR 0001](../../adr/0001-monorepo-skeleton-and-tooling.md) Status `accepted`, `CLAUDE.md` "Project state" updated by a human. Otherwise do not start.
- Tasks (must be `done`): [create-root-workspace](../project-workspace/create-root-workspace.md).

Out of scope: `GET /api/health` (next task [add-health-endpoint](add-health-endpoint.md)), root scripts, CORS, cookies or sessions, Neon, S3, Better Auth, logging libraries, Docker, the parked backend draft.

Security: the API must not set cookies (groundwork for CLAUDE.md security rule 1); error responses must not leak stack traces or file paths (rule 5: no private data in output).

## Verification checklist

The task is complete only when every item below passes. Tags name the [api-skeleton](../../features/api-skeleton.md) acceptance criterion (ACn) or requirement each item proves.

- [ ] 1. `apps/api/package.json` has name `@sweetmemories/api`, `"type": "module"` and the five scripts exactly as in Scope; `express` major version is 5. (AC6)
- [ ] 2. `npm run build -w apps/api` exits 0 and creates `apps/api/dist/server.js`, `dist/app.js`, `dist/config.js` (and no `dist/test/` folder); `npm run typecheck -w apps/api` exits 0. (AC6)
- [ ] 3. `apps/api/test/config.test.ts` covers and passes: `undefined` -> 3000, `""` -> 3000, `"4000"` -> 4000, `"1"` -> 1, `"65535"` -> 65535, and throws `Invalid PORT: <value>` for `"0"`, `"65536"`, `"abc"`, `"-1"`, `"3000.5"`, `" 3000"`. (AC5)
- [ ] 4. `apps/api/test/app.test.ts` passes: `GET /anything` -> 404 body `{"error":"not_found"}`; `GET /__throw` (test route) -> 500 body `{"error":"internal_error"}` with no `boom` and no stack trace text in the body. (AC3, AC4)
- [ ] 5. `npm test -w apps/api` exits 0. (AC6)
- [ ] 6. `npm start -w apps/api` prints `API listening on http://localhost:3000`; `curl -i http://localhost:3000/anything` returns 404, body `{"error":"not_found"}`, no `X-Powered-By`, no `Set-Cookie`. (AC2, AC3, AC5)
- [ ] 7. `PORT=4000 npm start -w apps/api` listens on 4000; `PORT=abc node apps/api/dist/server.js` prints `Invalid PORT: abc` and exits with code 1. (AC5)
- [ ] 8. Running `node apps/api/dist/server.js` while an API already runs on 3000 prints `Port 3000 is already in use`, prints no line containing `API listening`, and exits with code 1. (AC5)
- [ ] 9. `npm run dev -w apps/api` starts the API and restarts it after a change to `src/app.ts` is saved. (AC6)
- [ ] 10. `apps/api/package.json` has no `pg`, `@neondatabase/*`, `@aws-sdk/*`, `better-auth` or `cors` dependency. (Out of scope)
- [ ] 11. A type error in a test file fails type-checking: temporarily add `const x: number = 'a'` to `apps/api/test/config.test.ts`, run `npm run typecheck -w apps/api`, expect a non-zero exit; then revert the line. (AC6)
- [ ] 12. `apps/api/src/server.ts` calls `listen(port)` with one argument only and logs `API listening` from a `'listening'` event handler. (AC5)

## e2e-test-suites

Type: BE. `$BASE_URL` = `http://localhost:3000`. Build first: `npm run build -w apps/api`.

```
E2E-1 -> checklist items 1, 2, 10: package and build
Preconditions: npm install done
Request:
  node -e "const p=require('./apps/api/package.json');console.log(p.name,p.type,JSON.stringify(p.scripts),p.dependencies.express)"
  npm run build -w apps/api; ls apps/api/dist/server.js apps/api/dist/app.js apps/api/dist/config.js
  npm run typecheck -w apps/api; echo "tc=$?"
  grep -E '"(pg|@neondatabase/[^"]*|@aws-sdk/[^"]*|better-auth|cors)"' apps/api/package.json; echo "deps=$?"
Expected: "@sweetmemories/api module {...five scripts...} ^5.x"; three files listed; tc=0; deps=1
```

```
E2E-2 -> checklist items 3, 4, 5: unit tests
Preconditions: npm install done
Request:
  npm test -w apps/api -- --reporter=verbose; echo "t=$?"
Expected: t=0; output lists parsePort cases and "returns 500 internal_error when a route throws" as passed
```

```
E2E-3 -> checklist item 6: unknown path, no cookies, no banner
Preconditions: npm start -w apps/api running
Request:
  curl -i -X GET "$BASE_URL/anything" -H "Cookie: session=fake-value"
Expected: 404; body exactly {"error":"not_found"}; no X-Powered-By; no Set-Cookie (CLAUDE.md security rule 1 groundwork)
```

```
E2E-4 -> checklist item 7: PORT values
Preconditions: API built; ports 3000 and 4000 free
Request:
  PORT=4000 npm start -w apps/api & sleep 3; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:4000/anything"; kill %1
  PORT=abc node apps/api/dist/server.js; echo "exit=$?"
Expected: 404 printed (server reachable on 4000); "Invalid PORT: abc" printed and exit=1
```

```
E2E-5 -> checklist items 8, 12: port in use, no false start line
Preconditions: API built; port 3000 free
Request:
  node apps/api/dist/server.js & sleep 3
  node apps/api/dist/server.js > /tmp/api-busy.log 2>&1; echo "exit=$?"; kill %1
  cat /tmp/api-busy.log; grep -c 'API listening' /tmp/api-busy.log
  grep -n 'listen(' apps/api/src/server.ts; grep -c "'listening'" apps/api/src/server.ts
Expected: exit=1; log contains "Port 3000 is already in use"; grep count for "API listening" is 0; the listen call is listen(port) with no callback; 'listening' count >= 1
```

```
E2E-6 -> checklist item 9: dev watch reload
Preconditions: port 3000 free
Request:
  npm run dev -w apps/api > /tmp/api-dev.log 2>&1 & sleep 5
  touch apps/api/src/app.ts; sleep 3
  grep -c 'API listening on http://localhost:3000' /tmp/api-dev.log; kill %1
Expected: count >= 2 (started, then restarted)
```

```
E2E-7 -> checklist item 11: tests are type-checked
Preconditions: npm install done; `npm run build -w apps/api` done; local working copy only, reverted afterwards
Request:
  echo "const x: number = 'a'" >> apps/api/test/config.test.ts
  npm run typecheck -w apps/api; echo "tc=$?"
  git checkout apps/api/test/config.test.ts
  ls apps/api/dist/test; echo "disttest=$?"
Expected: tc non-zero with an error pointing at test/config.test.ts; disttest non-zero (build output has no test folder, checklist item 2)
```

## Links

- Feature: [api-skeleton](../../features/api-skeleton.md)
- ADR: [0001-monorepo-skeleton-and-tooling](../../adr/0001-monorepo-skeleton-and-tooling.md)
- API: [health](../../api/health.md)
- Next: [add-health-endpoint](add-health-endpoint.md)
