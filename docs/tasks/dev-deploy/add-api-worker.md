# Add API Worker

- Status: not-started

## Goal

Make `apps/api` deployable as the Cloudflare Worker `sweetmemories-api-dev`: add a Worker entry that wraps the existing Express app, a Wrangler config, and the scripts `dev:worker` and `deploy:dev`.

## Scope

Area: API (deploy config). Follow [ADR 0002](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md) and [repository-layout](../../architecture/repository-layout.md). Do not change `src/app.ts`, `src/server.ts` or any route.

Install (repo root): `npm install -D wrangler@^4 -w apps/api` (4.158.0 was latest on 2026-11-09; the lockfile pins the exact version).

| File | Content |
|---|---|
| `apps/api/src/cloudflare-node.d.ts` | Type declaration only, so `tsc` accepts the Workers-only import: `declare module 'cloudflare:node' { export function httpServerHandler(options: { port: number }): { fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> } }` |
| `apps/api/src/worker.ts` | Exactly: `import { httpServerHandler } from 'cloudflare:node'`; `import { createApp } from './app.js'`; `createApp().listen(3000)`; `export default httpServerHandler({ port: 3000 })`. Add a top comment: "Cloudflare Workers entry. Port 3000 is a routing key, not a real port. Local Node entry is server.ts." |
| `apps/api/wrangler.jsonc` | `{ "$schema": "../../node_modules/wrangler/config-schema.json", "name": "sweetmemories-api-dev", "main": "src/worker.ts", "compatibility_date": "2026-10-01", "compatibility_flags": ["nodejs_compat"], "workers_dev": true, "preview_urls": false, "observability": { "enabled": true } }` |
| `apps/api/package.json` | Add scripts: `"dev:worker": "wrangler dev --port 8787"`, `"deploy:dev": "wrangler deploy"`. Keep the five existing scripts unchanged. |
| `.gitignore` (root) | Add one line: `.wrangler/` |
| `docs/infra/local-development.md` | Set the `dev:worker` row for the API from "planned" to current (it already lists the command and port). |

Side effect: `npm run build` (`tsc`) now also emits `dist/worker.js`; that is expected and unused by `npm start`. Wrangler bundles `src/worker.ts` itself and does not use `dist/`.

Prerequisites:
- Features `done`: [api-skeleton](../../features/api-skeleton.md).
- Tasks `done`: [add-ci-workflow](../ci-checks/add-ci-workflow.md) (`dev-v1` exists, this task's PR into it is checked by `verify`, and `$BASE_BRANCH` is `origin/dev-v1`, so item 2 compares only this task's own changes).
- Same design gate as [add-ci-workflow](../ci-checks/add-ci-workflow.md).
- No Cloudflare account is needed for this task (`wrangler dev` runs locally).

Out of scope: `GET /api/version` ([add-version-endpoint](../dev-deploy-verification/add-version-endpoint.md)), the deploy workflow, real deploys, routes or custom domains, Worker secrets, bindings (KV, D1, R2, Hyperdrive), changing Express code to make it run on Workers (if a skeleton test fails under `wrangler dev`, stop and report it as a question; do not rewrite the app).

Security: no cookies (groundwork for CLAUDE.md rule 1); `preview_urls: false` so no extra public URLs exist; no account ID or token in `wrangler.jsonc` (Wrangler reads `CLOUDFLARE_ACCOUNT_ID` from the environment at deploy).

## Verification checklist

The task is complete only when every item below passes. Tags name the [dev-deploy](../../features/dev-deploy.md) acceptance criterion (ACn).

- [ ] 1. `apps/api/wrangler.jsonc` matches Scope exactly and contains no `account_id`. (AC3, AC4)
- [ ] 2. `apps/api/src/worker.ts` matches Scope; `git diff "$BASE_BRANCH"...HEAD -- apps/api/src/app.ts apps/api/src/server.ts apps/api/src/routes` is empty. (Scope)
- [ ] 3. `npm run typecheck -w apps/api`, `npm test -w apps/api` and `npm run build -w apps/api` exit 0. (AC2)
- [ ] 4. With `npm run dev:worker -w apps/api` running, `curl -i http://localhost:8787/api/health` returns 200, body `{"status":"ok"}`, `Cache-Control: no-store`, no `Set-Cookie`, no `X-Powered-By`. (AC3, AC7, AC8)
- [ ] 5. Under `wrangler dev`: `GET /api/nope` and `POST /api/health` return 404 `{"error":"not_found"}`; `HEAD /api/health` returns 200. (AC6)
- [ ] 6. `npx wrangler deploy --dry-run --outdir /tmp/api-bundle` in `apps/api` exits 0 and prints a total upload size under 3 MiB gzip (free-plan limit). (AC3)
- [ ] 7. `npm run build -w apps/api && npm start -w apps/api` still serves `http://localhost:3000/api/health` as before. (Scope: local Node path unchanged)
- [ ] 8. `git status --porcelain` after running `dev:worker` lists nothing under `.wrangler/`. (Scope: .gitignore)

## e2e-test-suites

Type: BE. `$WORKER_URL` = `http://localhost:8787`. Start with `npm run dev:worker -w apps/api` and wait until it prints `Ready on`.

```
E2E-1 -> checklist items 1, 2, 3: config and unchanged app
Preconditions: task branch, all work committed, $BASE_BRANCH set
Request:
  node -e "const s=require('fs').readFileSync('apps/api/wrangler.jsonc','utf8');console.log(/sweetmemories-api-dev/.test(s), /nodejs_compat/.test(s), /2026-10-01/.test(s), /account_id/.test(s))"
  git diff --stat "$BASE_BRANCH"...HEAD -- apps/api/src/app.ts apps/api/src/server.ts apps/api/src/routes
  npm run typecheck -w apps/api && npm test -w apps/api && npm run build -w apps/api; echo "exit=$?"
Expected: "true true true false"; empty diff; exit=0
```

```
E2E-2 -> checklist item 4: health on Workers runtime
Preconditions: dev:worker running
Request:
  curl -i -X GET "$WORKER_URL/api/health" -H "Cookie: session=fake-value"
Expected: 200; body {"status":"ok"}; Cache-Control: no-store; no Set-Cookie; no X-Powered-By (CLAUDE.md rule 1 groundwork)
```

```
E2E-3 -> checklist item 5: errors and HEAD
Preconditions: dev:worker running
Request:
  curl -i "$WORKER_URL/api/nope"
  curl -i -X POST "$WORKER_URL/api/health" -H "Content-Type: application/json" -d '{"x":1}'
  curl -I "$WORKER_URL/api/health"
Expected: 404 {"error":"not_found"}; 404 {"error":"not_found"}; 200 with no body
```

```
E2E-4 -> checklist item 6: bundle fits the free plan
Preconditions: npm install done
Request:
  cd apps/api && npx wrangler deploy --dry-run --outdir /tmp/api-bundle 2>&1 | grep -i 'Total Upload'; echo "exit=${PIPESTATUS[0]}"
Expected: exit=0; gzip size under 3 MiB
```

```
E2E-5 -> checklist items 7, 8: Node path unchanged, no wrangler state committed
Preconditions: dev:worker was run at least once; port 3000 free
Request:
  npm run build -w apps/api && { npm start -w apps/api & sleep 3; curl -s http://localhost:3000/api/health; kill %1; }
  git status --porcelain | grep -c '\.wrangler/'
Expected: {"status":"ok"}; 0
```

## Links

- Feature: [dev-deploy](../../features/dev-deploy.md)
- ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- API: [health](../../api/health.md)
- Infra: [local-development](../../infra/local-development.md), [dev-environment](../../infra/dev-environment.md)
