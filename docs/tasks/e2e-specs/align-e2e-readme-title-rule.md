# Align e2e README title rule

- Status: not-started

## Goal

Make `e2e/README.md` state the same `test()` title rule as ADR 0004 (ticket slug, then case ID), so spec authors do not follow the stale "case ID first" wording.

## Scope

Area: infra (one docs line in the e2e project). Decision: [ADR 0004](../../adr/0004-playwright-e2e-specs.md), Case IDs row.

| File | Change |
|---|---|
| `e2e/README.md` | Replace the line ``- Specs: `specs/<feature-slug>/<task-or-feature>.spec.ts`. Every `test()` title starts with its case ID (`E2E-8 ...`).`` with ``- Specs: `specs/<feature-slug>/<feature-or-task-slug>.spec.ts`. Every `test()` title starts with the ticket slug and the case ID (`homepage E2E-8 ...`), see ADR 0004.`` Nothing else changes. |

Prerequisites: [scaffold-e2e-project](scaffold-e2e-project.md) (done). Out of scope: changing any spec, the config, or ADR 0004.

Security: none touched (no app code, no cookies, no public pages).

## Verification checklist

The task is complete only when every item below passes. Tags name the [e2e-specs](../../features/e2e-specs.md) acceptance criterion (ACn).

- [ ] 1. `grep -c 'starts with the ticket slug and the case ID' e2e/README.md` prints 1. (AC4)
- [ ] 2. `grep -c 'starts with its case ID' e2e/README.md` prints 0. (AC4)
- [ ] 3. `git diff --name-only origin/dev-v1...HEAD` lists only `e2e/README.md` and files under `docs/` (this task's Status, `docs/tasks/Progress.md`, `docs/features/Progress.md`). (Scope)

## e2e-test-suites

Type: BE (tooling, verified by shell commands). Run from the repo root on the task branch.

```
E2E-1 -> checklist items 1, 2: README states the ADR 0004 title rule
Preconditions: task branch checked out
Request:
  grep -c 'starts with the ticket slug and the case ID' e2e/README.md
  grep -c 'starts with its case ID' e2e/README.md
Expected: 1; 0
```

```
E2E-2 -> checklist item 3: PR scope
Preconditions: task branch checked out; git fetch origin done
Request:
  git diff --name-only origin/dev-v1...HEAD | grep -v -E '^(e2e/README\.md|docs/)'; echo "o=$?"
Expected: only "o=1"
```

## Links

- Feature: [e2e-specs](../../features/e2e-specs.md)
- ADR: [0004-playwright-e2e-specs](../../adr/0004-playwright-e2e-specs.md)
