# Add root scripts

- Status: done

## Goal

Add root `npm` scripts so one command at the repository root runs dev, build, test or type-check for both apps.

## Scope

Area: infra/config. Files: root `package.json`, `package-lock.json`, `apps/api/package.json` (only add `"version": "0.0.0"`, so npm prints `@sweetmemories/api` in workspace output; [scaffold-api-app](../api-skeleton/scaffold-api-app.md) left it out), and delete `apps/.gitkeep` (no longer needed once `apps/api` and `apps/web` exist).

1. Install `concurrently` as a root dev dependency: `npm install -D concurrently` (at the root, no `-w`).
2. Set root `package.json` `"scripts"` to exactly:

```json
{
  "dev": "concurrently -n api,web \"npm run dev -w apps/api\" \"npm run dev -w apps/web\"",
  "build": "npm run build --workspaces",
  "test": "npm test --workspaces",
  "typecheck": "npm run typecheck --workspaces"
}
```

3. Delete `apps/.gitkeep`.

Prerequisites:
- Design gate: [Q001](../../questions/questions-2026-11-08-requirement-breakdown.md#q001-does-this-requirement-approve-writing-skeleton-code-during-the-design-phase) answered "Yes", [ADR 0001](../../adr/0001-monorepo-skeleton-and-tooling.md) Status `accepted`, `CLAUDE.md` "Project state" updated by a human. Otherwise do not start.
- Tasks (must be `done`): [create-root-workspace](create-root-workspace.md), [scaffold-api-app](../api-skeleton/scaffold-api-app.md), [scaffold-web-app](../web-skeleton/scaffold-web-app.md). Those tasks give each app the `dev`, `build`, `test` and `typecheck` scripts this task calls.

Out of scope: changing scripts inside `apps/*`, README (see [document-commands](document-commands.md)), CI, lint.

Security: none touched (no public page, upload, slug or script content).

## Verification checklist

The task is complete only when every item below passes. Tags name the [project-workspace](../../features/project-workspace.md) acceptance criterion (ACn) or requirement each item proves.

- [x] 1. Root `package.json` `scripts` equals the JSON in Scope, character for character. (AC2, AC3)
- [x] 2. `concurrently` is listed in root `devDependencies` and not in any `apps/*/package.json`. (AC2)
- [x] 3. `npm run dev` at the root starts both apps: output has lines prefixed `[api]` and `[web]`, and `curl -s http://localhost:3000/api/health` and `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/` succeed (body `{"status":"ok"}` once the health task is done, otherwise any API response; web `200`). (AC2)
- [x] 4. Manual interactive check: in a foreground terminal, pressing Ctrl+C once in the `npm run dev` terminal stops both apps; afterwards `lsof -i :3000 -i :5173` prints nothing. (AC2; Behavior: stop with Ctrl+C)
- [x] 5. `npm run build`, `npm test` and `npm run typecheck` at the root each exit 0 and their output mentions both `@sweetmemories/api` and `@sweetmemories/web`. (AC3)
- [x] 6. If one app's test fails (temporarily break one assertion locally, then revert), `npm test` at the root exits non-zero. (AC3)
- [x] 7. If port 3000 is already taken, `npm run dev` prints a line starting `[api]` that contains `Port 3000 is already in use`, prints no `[api]` line containing `API listening`, and the web app still answers `200` on `http://localhost:5173/`. (Behavior: one app fails, its error stays visible)
- [x] 8. `apps/.gitkeep` no longer exists. (ADR 0001: apps live in `apps/<name>/`; placeholder no longer needed)

## e2e-test-suites

Type: BE (infra). Shell commands at the repo root, Node 24, after `npm install`.

Waiting for a server: instead of a fixed sleep, poll up to 30 s with `wait_for() { for i in $(seq 30); do curl -s -o /dev/null "$1" && return 0; sleep 1; done; return 1; }` (define it once in the shell; `curl -s -o /dev/null` succeeds on any HTTP answer and fails while the port is closed).

```
E2E-1 -> checklist items 1, 2: scripts and dependency
Preconditions: task branch checked out
Request:
  node -e "console.log(JSON.stringify(require('./package.json').scripts))"
  node -e "console.log(!!require('./package.json').devDependencies.concurrently)"
  grep -l concurrently apps/*/package.json; echo "inapps=$?"
Expected: the scripts JSON from Scope; "true"; inapps=1 (no app lists it)
```

```
E2E-2 -> checklist item 3: dev starts both apps
Preconditions: ports 3000 and 5173 free; wait_for defined
Request:
  npm run dev > /tmp/dev.log 2>&1 & DEV=$!
  wait_for http://localhost:3000/ && wait_for http://localhost:5173/; echo "up=$?"
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/health
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
  grep -c '^\[api\]' /tmp/dev.log; grep -c '^\[web\]' /tmp/dev.log
  kill -TERM $DEV; sleep 3; lsof -i :3000 -i :5173   # cleanup only, not the Ctrl+C check
Expected: up=0; an HTTP code (200 once the health task is done); 200; both grep counts >= 1
```

```
E2E-2b -> checklist item 4: Ctrl+C stops both apps (manual, interactive terminal)
Preconditions: ports 3000 and 5173 free; a normal foreground terminal (not a script: background jobs in scripts ignore SIGINT)
Request:
  1. Run npm run dev in the foreground and wait for both [api] and [web] start lines.
  2. Press Ctrl+C once and wait for the prompt to return.
  3. Run: lsof -i :3000 -i :5173; echo "lsof=$?"
Expected: prompt returns; lsof prints nothing and lsof=1
```

```
E2E-3 -> checklist item 5: build, test, typecheck from root
Preconditions: none
Request:
  npm run build; echo "b=$?"; npm test; echo "t=$?"; npm run typecheck; echo "tc=$?"
Expected: b=0, t=0, tc=0; each output contains "@sweetmemories/api" and "@sweetmemories/web"
```

```
E2E-4 -> checklist item 6: a failing app test fails the root command
Preconditions: local working copy only, change is reverted afterwards
Request:
  (edit one expect in apps/web/src/App.test.tsx to a wrong value) ; npm test; echo "t=$?" ; git checkout apps/web/src/App.test.tsx
Expected: t is non-zero
```

```
E2E-5 -> checklist item 7: one app fails to start, the other keeps running
Preconditions: ports 3000 and 5173 free; wait_for defined
Request:
  node -e "require('net').createServer().listen(3000)" & BLOCK=$!; sleep 1
  npm run dev > /tmp/dev-fail.log 2>&1 & DEV=$!
  wait_for http://localhost:5173/; for i in $(seq 30); do grep -q 'Port 3000 is already in use' /tmp/dev-fail.log && break; sleep 1; done
  grep -E '^\[api\].*Port 3000 is already in use' /tmp/dev-fail.log; echo "api=$?"
  grep -c -E '^\[api\].*API listening' /tmp/dev-fail.log
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
  kill -TERM $DEV $BLOCK
Expected: api=0 (the [api] error line is printed); "API listening" count 0; web curl prints 200
```

```
E2E-6 -> checklist item 8: placeholder removed
Preconditions: task branch checked out
Request:
  ls apps/.gitkeep; echo "gk=$?"
Expected: "No such file"; gk is non-zero
```

## Links

- Feature: [project-workspace](../../features/project-workspace.md)
- ADR: [0001-monorepo-skeleton-and-tooling](../../adr/0001-monorepo-skeleton-and-tooling.md)
- Infra: [local-development](../../infra/local-development.md)

## Summary

- Built: root scripts `dev`, `build`, `test`, `typecheck`, `concurrently` as a root devDependency, `apps/.gitkeep` removed. Also `"version": "0.0.0"` in `apps/api/package.json` so root output names `@sweetmemories/api` (checklist item 5).
- PR: https://github.com/buitahau/sweetmemoriesv1/pull/12 (merge commit `4b2678a`).
- Test: fresh clone, Node 24.14.1; items 1-8 all Pass. Item 4 (Ctrl+C) was run under a real pty, not a human terminal. No deploy for this ticket.
- Cycles: 1. Review: approve; Minor (scope note, now in Scope) and Nit.
- Leftovers: `kill -TERM` on the `npm run dev` PID leaves the apps running (spec E2E cleanup lines should kill the process group); Ctrl+C is unaffected.
