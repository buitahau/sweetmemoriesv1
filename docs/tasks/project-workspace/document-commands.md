# Document commands

- Status: done

## Goal

Replace the "Repository layout" section of `README.md` with the real layout and root commands, so developers and the `tester` agent can find how to install, run, test and build; and mark the layout and local-development docs as describing the built state.

## Scope

Area: docs. Files: `README.md` (sections "Status" and "Repository layout" only), [docs/infra/local-development.md](../../infra/local-development.md) and [docs/architecture/repository-layout.md](../../architecture/repository-layout.md).

- If anything changed during implementation, update `local-development.md` so it matches the README and the real `package.json` scripts.
- Set the status line of `local-development.md` to `Status: current.` and of `repository-layout.md` to `Status: current (built).` Make the `repository-layout.md` tree match the files that exist (`git ls-files apps` plus root config files).
- `docs/api/health.md` is set to current by [add-health-endpoint](../api-skeleton/add-health-endpoint.md), not here. ADR 0001 status is changed by a human (Q001), not here.

Replace the text `Not yet established. ...` in `README.md` "Repository layout" with:

1. A short tree: `apps/api` (Node, Express 5, `GET /api/health`), `apps/web` (React, Vite, home page), `docs/`.
2. Prerequisite: Node 24 (`.nvmrc`).
3. A table of root commands copied from [local-development](../../infra/local-development.md) "Commands": `npm install`, `npm run dev`, `npm run build`, `npm test`, `npm run typecheck`, `npm start -w apps/api`.
4. Local URLs: API `http://localhost:3000`, web `http://localhost:5173`, web preview `http://localhost:4173`.
5. A link to `docs/infra/local-development.md`.

Also change the README "Status" paragraph sentence "No application code is part of this repository yet." to "The repository contains a skeleton only: an API with a health check and a web app with a placeholder home page."

Prerequisites:
- Design gate: [Q001](../../questions/questions-2026-11-08-requirement-breakdown.md#q001-does-this-requirement-approve-writing-skeleton-code-during-the-design-phase) answered "Yes", [ADR 0001](../../adr/0001-monorepo-skeleton-and-tooling.md) Status `accepted`, `CLAUDE.md` "Project state" updated by a human. Otherwise do not start.
- Tasks (must be `done`): [add-root-scripts](add-root-scripts.md), [add-health-endpoint](../api-skeleton/add-health-endpoint.md), [add-home-page](../web-skeleton/add-home-page.md).

Out of scope: `CLAUDE.md` (a human updates its "Project state" and "Commands" after approval, see [Q001](../../questions/questions-2026-11-08-requirement-breakdown.md)); any other README section; code changes.

Security: do not put secrets, tokens or real user data in the README.

## Verification checklist

The task is complete only when every item below passes. Tags name the [project-workspace](../../features/project-workspace.md) acceptance criterion (ACn) or requirement each item proves.

- [x] 1. README "Repository layout" no longer contains "Not yet established". (AC4)
- [x] 2. The section names `apps/api` and `apps/web` and lists all six commands from Scope item 3. (AC4)
- [x] 3. The section lists ports 3000, 5173 and 4173, and they equal the ports in `docs/infra/local-development.md`. (AC4)
- [x] 4. The section links to `docs/infra/local-development.md` and the link resolves to an existing file. (AC4)
- [x] 5. Following the README commands on a clean clone (Node 24) works: `npm install`, `npm run dev` (both URLs answer), `npm run build`, `npm test`, `npm run typecheck` all succeed. (AC1, AC2, AC3)
- [x] 6. The README "Status" paragraph has the new sentence from Scope; no other README section changed (with all work committed, `git diff "$BASE_BRANCH"...HEAD -- README.md` shows changes only in "Status" and "Repository layout"; `$BASE_BRANCH` and the merge-base rule as defined in [local-development](../../infra/local-development.md#base-branch)). (AC4)
- [x] 7. `CLAUDE.md` is unchanged (`git diff --name-only "$BASE_BRANCH"...HEAD` does not list it). (Out of scope: a human edits `CLAUDE.md`)
- [x] 8. `docs/infra/local-development.md` starts its status line with `Status: current` and `docs/architecture/repository-layout.md` with `Status: current`; every file path in the `repository-layout.md` tree exists in the repository. (writing-docs rule: docs describe the current truth)

## e2e-test-suites

Type: BE (docs/infra). Shell commands at the repo root.

Waiting for a server: instead of a fixed sleep, poll up to 30 s with `wait_for() { for i in $(seq 30); do curl -s -o /dev/null "$1" && return 0; sleep 1; done; return 1; }` (define it once in the shell).

```
E2E-1 -> checklist items 1, 2, 3, 4: README content
Preconditions: task branch checked out
Request:
  sed -n '/^## Repository layout/,/^## /p' README.md > /tmp/layout.md
  grep -c 'Not yet established' /tmp/layout.md
  for t in apps/api apps/web 'npm install' 'npm run dev' 'npm run build' 'npm test' 'npm run typecheck' 'npm start -w apps/api' 3000 5173 4173 docs/infra/local-development.md; do grep -qF "$t" /tmp/layout.md && echo ok || echo "missing $t"; done
  ls docs/infra/local-development.md
Expected: count 0; twelve "ok" lines; file listed
```

```
E2E-2 -> checklist item 5: README commands work on a clean clone
Preconditions: fresh clone in a temp folder, Node 24, ports free; wait_for defined
Request:
  npm install && npm run build && npm test && npm run typecheck; echo "exit=$?"
  npm run dev > /tmp/dev.log 2>&1 & DEV=$!
  wait_for http://localhost:3000/api/health && wait_for http://localhost:5173/; echo "up=$?"
  curl -s http://localhost:3000/api/health; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/; kill -TERM $DEV
Expected: exit=0; up=0; {"status":"ok"}; 200
```

```
E2E-3 -> checklist items 6, 7: only intended changes
Preconditions: task committed on its branch (no uncommitted changes); $BASE_BRANCH set as in docs/infra/local-development.md
Request:
  git diff "$BASE_BRANCH"...HEAD -- README.md | grep '^@@'
  git diff --name-only "$BASE_BRANCH"...HEAD | grep -c '^CLAUDE.md$'
Expected: hunks only inside the "Status" and "Repository layout" sections; count 0
```

```
E2E-4 -> checklist item 8: design docs marked current and accurate
Preconditions: task branch checked out
Request:
  grep -n '^Status: current' docs/infra/local-development.md docs/architecture/repository-layout.md
  (manual) for each path in the repository-layout.md tree, run ls <path>
Expected: one match per file; every ls succeeds
```

## Links

- Feature: [project-workspace](../../features/project-workspace.md)
- ADR: [0001-monorepo-skeleton-and-tooling](../../adr/0001-monorepo-skeleton-and-tooling.md)
- Infra: [local-development](../../infra/local-development.md)

## Summary

- Built: README "Status" sentence and "Repository layout" (tree, Node 24, six commands, ports, link); `local-development.md` marked `Status: current.`; `repository-layout.md` marked `Status: current (built).` with the tree matching `git ls-files`.
- PR: https://github.com/buitahau/sweetmemoriesv1/pull/14 (merge commit `e4bbce3`).
- Test: fresh clone, Node 24.14.1, README commands followed literally; items 1-8 all Pass.
- Cycles: 1 implement-and-test cycle; review took 2 rounds (round 1: Major status line not at line start, fixed).
- Leftovers: `local-development.md` "Base branch" section still names `origin/main`; owned by add-ci-workflow.
