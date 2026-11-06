# Project workspace

- Status: not-started

## Summary

The repository root becomes an npm workspace that holds the API and web apps, with one set of commands to install, run, test, type-check and build everything. Commands are documented so the `tester` and `implementer` agents and new developers can find them. Decided in [ADR 0001](../adr/0001-monorepo-skeleton-and-tooling.md).

Order: this feature's first task comes before [api-skeleton](api-skeleton.md) and [web-skeleton](web-skeleton.md); its last two tasks need both of those features' tasks, so this feature is `done` last. No task starts before the design gate (Q001 answered "Yes", ADR 0001 `accepted`, `CLAUDE.md` "Project state" updated by a human).

## User story

As a developer joining SweetMemories, I want to clone the repository and run one install command and one dev command, so that I can see the API and the web app running locally without reading the source.

Acceptance criteria:
1. From a clean clone with Node 24, `npm install` at the root exits with code 0 and creates one root `package-lock.json`.
2. `npm run dev` at the root starts the API on port 3000 and the web app on port 5173 in one terminal.
3. `npm run build`, `npm test` and `npm run typecheck` at the root run in both apps and exit with code 0.
4. `README.md` "Repository layout" lists the apps and the root commands, matching [infra/local-development.md](../infra/local-development.md).
5. Nothing from the parked backend draft is copied, moved or edited.

## Behavior

- Root `package.json`: `"name": "sweetmemories"`, `"private": true`, `"type": "module"`, `"workspaces": ["apps/*"]`, `"engines": {"node": ">=24"}`.
- Root scripts, exactly:
  - `"dev": "concurrently -n api,web \"npm run dev -w apps/api\" \"npm run dev -w apps/web\""`
  - `"build": "npm run build --workspaces"`
  - `"test": "npm test --workspaces"`
  - `"typecheck": "npm run typecheck --workspaces"`
- If one app fails to start under `npm run dev`, `concurrently` keeps showing its error output with the `api` or `web` prefix; the developer stops everything with Ctrl+C.
- `.gitignore` excludes `node_modules/`, `dist/`, `coverage/`, `.env`, `.env.*` (except `.env.example`), `.DS_Store`, `*.log`.
- Diff checks use the merge-base form `git diff --name-only "$BASE_BRANCH"...HEAD` on committed work; `$BASE_BRANCH` and the rule that design docs are merged into it first are in [local-development](../infra/local-development.md#base-branch).

## Out of scope

- CI pipelines, deploys, Docker, hosting, DNS/subdomains ([Q005](../questions/questions-2026-11-08-requirement-breakdown.md)).
- Linting and formatting tools.
- Editing `CLAUDE.md` (a human does it after approval, [Q001](../questions/questions-2026-11-08-requirement-breakdown.md)).
- Neon, S3, Better Auth, any domain code (User, Memory, Template, Block, Photo).

## Verification checklist

The feature is complete only when every item below passes.

- [ ] 1. Every task in this feature has Status `done`. (all ACs)
- [ ] 2. On a clean clone with Node 24, `npm install` at the root exits 0; exactly one `package-lock.json` exists, at the root (`find . -name package-lock.json -not -path "*/node_modules/*"` prints only `./package-lock.json`). (AC1)
- [ ] 3. `cat .nvmrc` prints `24`; root `package.json` has `"private": true`, `"type": "module"`, `"workspaces": ["apps/*"]`, `"engines": {"node": ">=24"}`. (AC1)
- [ ] 4. `npm run dev` at the root prints lines prefixed `[api]` and `[web]`; while it runs, `curl -s http://localhost:3000/api/health` returns `{"status":"ok"}` and `curl -s http://localhost:5173/` returns HTML containing `<div id="root">`. (AC2)
- [ ] 5. `npm run build`, `npm test` and `npm run typecheck` at the root each exit 0, and the output shows both `@sweetmemories/api` and `@sweetmemories/web` ran. (AC3)
- [ ] 6. `npm run build` creates `apps/api/dist/server.js` and `apps/web/dist/index.html`. (AC3)
- [ ] 7. After `npm install` and `npm run build`, `git status --porcelain` lists no file under `node_modules/` or `dist/`. (Behavior: .gitignore)
- [ ] 8. `README.md` "Repository layout" section names `apps/api` and `apps/web` and lists `npm install`, `npm run dev`, `npm run build`, `npm test`, `npm run typecheck`; every command and port matches [infra/local-development.md](../infra/local-development.md). (AC4)
- [ ] 9. With all work committed, `git diff --name-only "$BASE_BRANCH"...HEAD` shows no change to `CLAUDE.md`, and every changed path is one of: `package.json`, `package-lock.json`, `.nvmrc`, `.gitignore`, `tsconfig.base.json`, `README.md`, or a path under `apps/` or `docs/`. (AC5, project state rule)
- [ ] 10. No `.env` file is committed (`git ls-files` lists none) and no file contains a secret or token. (writing-docs rule: no secrets)
- [ ] 11. If port 3000 is already taken, `npm run dev` prints a line starting `[api]` containing `Port 3000 is already in use`, prints no `[api]` line containing `API listening`, and the web app still answers `200` on port 5173. (Behavior: one app fails, its error stays visible)

## e2e-test-suites

Type: BE (infra). No HTTP endpoint of its own, so each case gives a shell command instead of a single curl, run from the repo root on a clean clone with Node 24. `$BASE_URL` is `http://localhost:3000`, `$WEB_URL` is `http://localhost:5173`.

Waiting for a server: instead of a fixed sleep, poll up to 30 s with `wait_for() { for i in $(seq 30); do curl -s -o /dev/null "$1" && return 0; sleep 1; done; return 1; }` (define it once in the shell; `curl -s -o /dev/null` succeeds on any HTTP answer and fails while the port is closed).

```
E2E-1 -> checklist items 2, 3: clean install
Preconditions: fresh clone, no node_modules, Node 24 active (node -v starts with v24)
Request:
  npm install; echo "exit=$?"
  find . -name package-lock.json -not -path "*/node_modules/*"
  cat .nvmrc
  node -e "const p=require('./package.json');console.log(p.private, p.type, JSON.stringify(p.workspaces), p.engines.node)"
Expected: exit=0; only ./package-lock.json; .nvmrc prints 24; last line prints: true module ["apps/*"] >=24
```

```
E2E-2 -> checklist item 4: one dev command starts both apps
Preconditions: E2E-1 passed; ports 3000 and 5173 free; wait_for defined
Request:
  npm run dev > /tmp/dev.log 2>&1 & DEV=$!
  wait_for "$BASE_URL/api/health" && wait_for "$WEB_URL/"; echo "up=$?"
  curl -s "$BASE_URL/api/health"
  curl -s "$WEB_URL/" | grep -c 'id="root"'
  grep -c '^\[api\]' /tmp/dev.log; grep -c '^\[web\]' /tmp/dev.log
  kill -TERM $DEV   # cleanup; the Ctrl+C check is a manual case in add-root-scripts (E2E-2b)
Expected: up=0; {"status":"ok"}; grep counts 1, >=1, >=1
```

```
E2E-3 -> checklist items 5, 6: build, test, typecheck from root
Preconditions: E2E-1 passed
Request:
  npm run build; echo "build=$?"
  npm test; echo "test=$?"
  npm run typecheck; echo "typecheck=$?"
  ls apps/api/dist/server.js apps/web/dist/index.html
Expected: build=0, test=0, typecheck=0; output of each mentions @sweetmemories/api and @sweetmemories/web; both files listed
```

```
E2E-4 -> checklist item 7: build output and installs are git-ignored
Preconditions: E2E-3 passed
Request:
  git status --porcelain | grep -E 'node_modules|dist/' ; echo "matches=$?"
Expected: no lines printed; matches=1 (grep found nothing)
```

```
E2E-5 -> checklist item 8: README matches infra doc
Preconditions: none
Request:
  sed -n '/^## Repository layout/,/^## /p' README.md > /tmp/layout.md
  for t in apps/api apps/web 'npm install' 'npm run dev' 'npm run build' 'npm test' 'npm run typecheck' 3000 5173; do grep -qF "$t" /tmp/layout.md && echo ok || echo "missing $t"; done
  grep -o -E 'localhost:[0-9]+' docs/infra/local-development.md | sort -u
Expected: nine "ok" lines, no "missing"; the infra doc ports are exactly localhost:3000, localhost:4173, localhost:5173
```

```
E2E-6 -> checklist items 9, 10: no out-of-scope or secret changes
Preconditions: implementation branch checked out, all work committed; $BASE_BRANCH set as in docs/infra/local-development.md
Request:
  git diff --name-only "$BASE_BRANCH"...HEAD | grep -v -E '^(package\.json|package-lock\.json|\.nvmrc|\.gitignore|tsconfig\.base\.json|README\.md)$|^apps/|^docs/' ; echo "other=$?"
  git diff --name-only "$BASE_BRANCH"...HEAD | grep -c '^CLAUDE\.md$'
  git ls-files | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example$' ; echo "envfiles=$?"
Expected: other=1 (no path outside the allowed list); count 0; envfiles=1 (no .env committed)
```

```
E2E-7 -> checklist item 11: one app fails to start, the other keeps running
Preconditions: E2E-1 passed; ports 3000 and 5173 free; wait_for defined
Request:
  node -e "require('net').createServer().listen(3000)" & BLOCK=$!; sleep 1
  npm run dev > /tmp/dev-fail.log 2>&1 & DEV=$!
  wait_for "$WEB_URL/"; for i in $(seq 30); do grep -q 'Port 3000 is already in use' /tmp/dev-fail.log && break; sleep 1; done
  grep -E '^\[api\].*Port 3000 is already in use' /tmp/dev-fail.log; echo "api=$?"
  grep -c -E '^\[api\].*API listening' /tmp/dev-fail.log
  curl -s -o /dev/null -w "%{http_code}\n" "$WEB_URL/"
  kill -TERM $DEV $BLOCK
Expected: api=0 (the [api] error line is printed); "API listening" count 0; web curl prints 200
```

## Related

- Parent ADR: [0001-monorepo-skeleton-and-tooling](../adr/0001-monorepo-skeleton-and-tooling.md)
- Infra: [local-development](../infra/local-development.md)
- Architecture: [repository-layout](../architecture/repository-layout.md)
- Sibling features: [api-skeleton](api-skeleton.md), [web-skeleton](web-skeleton.md)
- Tasks:
  1. [create-root-workspace](../tasks/project-workspace/create-root-workspace.md)
  2. [add-root-scripts](../tasks/project-workspace/add-root-scripts.md) (after api-skeleton and web-skeleton scaffolds)
  3. [document-commands](../tasks/project-workspace/document-commands.md)
