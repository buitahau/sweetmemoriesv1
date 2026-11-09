# Add web Worker

- Status: done

## Goal

Make the built `apps/web/dist` deployable as the static-assets-only Cloudflare Worker `sweetmemories-web-dev`, with SPA fallback, and add the scripts `dev:worker` and `deploy:dev`.

## Scope

Area: web (deploy config). Follow [ADR 0002](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md). Do not change any file under `apps/web/src` or `apps/web/index.html`.

Install (repo root): `npm install -D wrangler@^4 -w apps/web` (same major as [add-api-worker](add-api-worker.md); if both tasks are done, `npm ls wrangler` must show one version).

| File | Content |
|---|---|
| `apps/web/wrangler.jsonc` | `{ "$schema": "../../node_modules/wrangler/config-schema.json", "name": "sweetmemories-web-dev", "compatibility_date": "2026-10-01", "workers_dev": true, "preview_urls": false, "assets": { "directory": "./dist", "not_found_handling": "single-page-application" } }` (no `main`: no Worker script, assets only) |
| `apps/web/package.json` | Add scripts: `"dev:worker": "wrangler dev --port 8788"`, `"deploy:dev": "wrangler deploy"`. Both need `npm run build` first; do not chain the build into them (the workflow builds once). Keep existing scripts unchanged. |
| `.gitignore` (root) | Ensure the line `.wrangler/` exists (added by [add-api-worker](add-api-worker.md); add it if this task is done first). |
| `docs/infra/local-development.md` | Set the `dev:worker` row for web from "planned" to current. |

Prerequisites:
- Features `done`: [web-skeleton](../../features/web-skeleton.md).
- Tasks `done`: [add-ci-workflow](../ci-checks/add-ci-workflow.md) (`dev-v1` exists, this task's PR into it is checked by `verify`, and `$BASE_BRANCH` is `origin/dev-v1`, so item 2 compares only this task's own changes).
- Same design gate as [add-ci-workflow](../ci-checks/add-ci-workflow.md).
- No Cloudflare account is needed for this task.

Out of scope: `version.json` and `_headers` (written by [add-deploy-dev-workflow](add-deploy-dev-workflow.md)), a Worker script, API proxying, custom domains, the deploy workflow, real deploys.

Security: no Worker script means no cookies can be set by our code (groundwork for CLAUDE.md rule 1); `preview_urls: false`; no account ID in the config.

## Verification checklist

The task is complete only when every item below passes. Tags name the [dev-deploy](../../features/dev-deploy.md) acceptance criterion (ACn).

- [x] 1. `apps/web/wrangler.jsonc` matches Scope exactly: no `main`, no `account_id`, `not_found_handling` is `single-page-application`. (AC3, AC4, AC6)
- [x] 2. `git diff --name-only "$BASE_BRANCH"...HEAD` lists nothing under `apps/web/src` and not `apps/web/index.html`. (Scope)
- [x] 3. After `npm run build -w apps/web`, with `npm run dev:worker -w apps/web` running, `curl -s http://localhost:8788/` contains `<title>SweetMemories</title>` and `<div id="root">`, and a browser at that URL shows "SweetMemories home page". (AC3, AC8) Superseded (2026-11-10): after [homepage](../../features/homepage.md) is merged the browser shows the Homepage instead; the `curl` part still holds.
- [x] 4. `curl -s -o /dev/null -w "%{http_code}" http://localhost:8788/anything` prints 200 and the body equals that of `/`. (AC6)
- [x] 5. Responses from `http://localhost:8788/` have no `Set-Cookie`. (AC7)
- [x] 6. `npm test -w apps/web`, `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0. (AC2)
- [x] 7. `npm ls wrangler` shows a single wrangler version for the whole repo (if [add-api-worker](add-api-worker.md) is already done). (Scope)

## e2e-test-suites

Type: FE (static web served by the Workers runtime). Start: `npm run build -w apps/web && npm run dev:worker -w apps/web`, wait for `Ready on`. `$WEB_WORKER_URL` = `http://localhost:8788`.

```
E2E-1 -> checklist items 1, 2: config and unchanged sources
Preconditions: task branch, all work committed, $BASE_BRANCH set
Steps:
  1. Run: node -e "const s=require('fs').readFileSync('apps/web/wrangler.jsonc','utf8');console.log(/\"main\"/.test(s), /account_id/.test(s), /single-page-application/.test(s), /sweetmemories-web-dev/.test(s))"
  2. Run: git diff --name-only "$BASE_BRANCH"...HEAD | grep -E '^apps/web/(src/|index\.html$)'; echo "src=$?"
Expected: step 1 prints "false false true true"; step 2 prints src=1
```

```
E2E-2 -> checklist items 3, 5: home page under the Workers runtime
Preconditions: worker dev server running; fresh browser profile; DevTools open
Steps:
  1. Open $WEB_WORKER_URL/.
  2. Read the page text and tab title.
  3. Check DevTools Application > Cookies for http://localhost:8788.
  4. Run: curl -s -D - -o /dev/null $WEB_WORKER_URL/ | grep -i -c '^set-cookie'
Expected: page shows "SweetMemories home page"; title "SweetMemories"; cookie list empty; curl count 0 (CLAUDE.md rule 1 groundwork)
```

```
E2E-3 -> checklist item 4: SPA fallback
Preconditions: worker dev server running
Steps:
  1. Open $WEB_WORKER_URL/anything in the browser.
  2. Run: diff <(curl -s $WEB_WORKER_URL/) <(curl -s $WEB_WORKER_URL/anything); echo "same=$?"
Expected: page shows "SweetMemories home page"; same=0
```

```
E2E-4 -> checklist items 6, 7: scripts and single wrangler version
Preconditions: npm install done
Steps:
  1. Run: npm test -w apps/web && npm run typecheck -w apps/web && npm run build -w apps/web; echo "exit=$?"
  2. Run: npm ls wrangler --all | grep -o 'wrangler@[0-9.]*' | sort -u
Expected: exit=0; exactly one wrangler@4.x.y line
```

## Summary

- Built: `apps/web/wrangler.jsonc` (assets only, SPA fallback), `dev:worker` and `deploy:dev` scripts.
- PR: https://github.com/buitahau/sweetmemoriesv1/pull/30. Review: approve, 1 Nit (status, done here).
- Test: items 1-7 Pass. Item 3 checked with curl only (no browser available): title and root div present, visible text "SweetMemories home page" not seen in a browser.
- Cycles: 1. Leftovers: none.

## Links

- Feature: [dev-deploy](../../features/dev-deploy.md)
- ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- Infra: [local-development](../../infra/local-development.md), [dev-environment](../../infra/dev-environment.md)
