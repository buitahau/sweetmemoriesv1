# Create root workspace

- Status: not-started

## Goal

Create the repository-root files that turn the repo into an empty npm workspace for Node 24, so the API and web apps can be added under `apps/`.

## Scope

Area: infra/config. Create these files at the repository root (follow [ADR 0001](../../adr/0001-monorepo-skeleton-and-tooling.md) and [repository-layout](../../architecture/repository-layout.md)):

| File | Exact content / rule |
|---|---|
| `package.json` | `{"name": "sweetmemories", "private": true, "type": "module", "workspaces": ["apps/*"], "engines": {"node": ">=24"}, "scripts": {}}` (root scripts come in [add-root-scripts](add-root-scripts.md)) |
| `.nvmrc` | one line: `24` |
| `.gitignore` | lines: `node_modules/`, `dist/`, `coverage/`, `.env`, `.env.*`, `!.env.example`, `.DS_Store`, `*.log` |
| `tsconfig.base.json` | `compilerOptions`: `"target": "ES2022"`, `"strict": true`, `"esModuleInterop": true`, `"skipLibCheck": true`, `"forceConsistentCasingInFileNames": true`, `"resolveJsonModule": true`, `"isolatedModules": true`. No `include`, no `module` (each app sets its own). |
| `apps/.gitkeep` | empty file so `apps/` exists |

Then run `npm install` at the root once to create `package-lock.json` and commit it.

Prerequisites:
- Design gate (applies to every task of ADR 0001): [Q001](../../questions/questions-2026-11-08-requirement-breakdown.md#q001-does-this-requirement-approve-writing-skeleton-code-during-the-design-phase) is answered "Yes" (option A), [ADR 0001](../../adr/0001-monorepo-skeleton-and-tooling.md) has Status `accepted`, and a human has updated `CLAUDE.md` "Project state" to allow the skeleton. If any of the three is not true, do not start; leave Status `not-started`.
- No other task (this is the first task).

Pattern: none exists yet; use the table above exactly.

Out of scope: any file inside `apps/api` or `apps/web`, root scripts, README, `CLAUDE.md`, the parked backend draft, CI, lint config.

Security: no secrets in any file; `.env` files must be ignored (writing-docs rule: never put secrets, tokens or real user data in the repository).

## Verification checklist

The task is complete only when every item below passes. Tags name the [project-workspace](../../features/project-workspace.md) acceptance criterion (ACn) or requirement each item proves.

- [ ] 1. Root `package.json` exists and `node -e "const p=require('./package.json');console.log(p.name,p.private,p.type,JSON.stringify(p.workspaces),p.engines.node)"` prints `sweetmemories true module ["apps/*"] >=24`. (AC1; Behavior: root package.json)
- [ ] 2. `cat .nvmrc` prints `24`. (AC1)
- [ ] 3. `tsconfig.base.json` is valid JSON and has `"strict": true` and `"target": "ES2022"`. (AC3: shared type-check settings)
- [ ] 4. `.gitignore` contains every line listed in Scope. (Behavior: .gitignore)
- [ ] 5. With Node 24, `npm install` at the root exits 0 and `package-lock.json` exists at the root. (AC1)
- [ ] 6. A test file `.env` created at the root does not appear in `git status --porcelain` (delete it afterwards). (Behavior: .gitignore; writing-docs rule: no secrets)
- [ ] 7. With all work committed, `git diff --name-only "$BASE_BRANCH"...HEAD` (merge-base form; `$BASE_BRANCH` as defined in [local-development](../../infra/local-development.md#base-branch)) lists, outside `docs/`, only: `package.json`, `package-lock.json`, `.nvmrc`, `.gitignore`, `tsconfig.base.json`, `apps/.gitkeep`. Any path under `docs/` is allowed (status lines of this task and its feature, `Progress.md` boards, `docs/questions/`). (AC5; Out of scope)

## e2e-test-suites

Type: BE (infra). No HTTP, so each case is a shell command run at the repo root with Node 24.

```
E2E-1 -> checklist items 1, 2, 3: root config values
Preconditions: task branch checked out
Request:
  node -e "const p=require('./package.json');console.log(p.name,p.private,p.type,JSON.stringify(p.workspaces),p.engines.node)"
  cat .nvmrc
  node -e "const t=JSON.parse(require('fs').readFileSync('tsconfig.base.json','utf8'));console.log(t.compilerOptions.strict,t.compilerOptions.target)"
Expected: "sweetmemories true module [\"apps/*\"] >=24"; "24"; "true ES2022"
```

```
E2E-2 -> checklist items 4, 6: ignore rules
Preconditions: task branch checked out
Request:
  for l in 'node_modules/' 'dist/' 'coverage/' '.env' '.env.*' '!.env.example' '.DS_Store' '*.log'; do grep -qxF "$l" .gitignore && echo ok || echo "missing $l"; done
  touch .env; git status --porcelain | grep -c '\.env'; rm .env
Expected: eight "ok" lines, no "missing"; grep count 0
```

```
E2E-3 -> checklist item 5: install
Preconditions: no node_modules at root
Request:
  npm install; echo "exit=$?"; ls package-lock.json
Expected: exit=0; package-lock.json listed
```

```
E2E-4 -> checklist item 7: only the expected files changed
Preconditions: task committed on its branch (no uncommitted changes); $BASE_BRANCH set as in docs/infra/local-development.md
Request:
  git diff --name-only "$BASE_BRANCH"...HEAD | grep -v -E '^docs/'
Expected: exactly package.json, package-lock.json, .nvmrc, .gitignore, tsconfig.base.json, apps/.gitkeep (six lines, nothing else)
```

## Links

- Feature: [project-workspace](../../features/project-workspace.md)
- ADR: [0001-monorepo-skeleton-and-tooling](../../adr/0001-monorepo-skeleton-and-tooling.md)
- Next: [scaffold-api-app](../api-skeleton/scaffold-api-app.md), [scaffold-web-app](../web-skeleton/scaffold-web-app.md)
