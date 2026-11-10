# Scaffold e2e project

- Status: done

## Goal

Record the repo-root `e2e/` Playwright project shipped in PR #46 (commit b849ca3), so the ADR 0004 setup work is traceable. No new work.

## Scope

Area: infra (test tooling). Decision: [ADR 0004](../../adr/0004-playwright-e2e-specs.md), rows Location, Browser, Spec files, Base URL.

| File | What it holds (as merged) |
|---|---|
| `e2e/package.json` | `private`, `type: module`; scripts `test`, `list`, `auth:save`; devDependencies `@playwright/test` pinned exactly, `@types/node`. |
| `e2e/package-lock.json` | Lockfile of the e2e project only. |
| `e2e/playwright.config.ts` | `BASE_URL` required (throws `BASE_URL is required ...`), optional `STORAGE_STATE`, `channel: 'chrome'`, headless, 1440 x 900, list + JSON reporter to `test-results/report.json`, 1 retry. |
| `e2e/tsconfig.json`, `e2e/README.md`, `e2e/auth/save-session.mjs` | TypeScript settings, usage notes, manual session save. |
| `e2e/specs/homepage/homepage.spec.ts` | First specs: [homepage](../../features/homepage.md) E2E-1, E2E-3, E2E-4, E2E-8. |
| `.gitignore` | `e2e/.auth/`, `e2e/test-results/`, `e2e/playwright-report/`. |

Prerequisites: none. Out of scope: running in CI, per-ticket specs of other tickets, the README title rule fix ([align-e2e-readme-title-rule](align-e2e-readme-title-rule.md)).

Security: `e2e/.auth/user.json` holds live session cookies of a dedicated test account; it is git-ignored and never read by the `tester` (ADR 0004, Consequences). No secrets in the repo.

## Verification checklist

The task is complete only when every item below passes. Tags name the [e2e-specs](../../features/e2e-specs.md) acceptance criterion (ACn). Checked by reading the merged files on 2026-11-10.

- [x] 1. `e2e/package.json` pins `@playwright/test` without `^` or `~`; `e2e/package-lock.json` exists; root `package.json` `workspaces` is `["apps/*"]`. (AC1)
- [x] 2. `e2e/playwright.config.ts` throws when `BASE_URL` is unset and sets `channel: 'chrome'`, `headless: true`, viewport width 1440, `report.json` output. (AC2)
- [x] 3. Every `test()` title in `e2e/specs/homepage/homepage.spec.ts` starts with `homepage E2E-<n>`. (AC3)
- [x] 4. `.gitignore` lists `e2e/.auth/`, `e2e/test-results/`, `e2e/playwright-report/`. (AC5)
- [x] 5. Neither `.github/workflows/ci.yml` nor `.github/workflows/deploy-dev.yml` mentions `e2e`. (AC6)

## e2e-test-suites

Type: BE (tooling, verified by shell commands). Run from the repo root.

```
E2E-1 -> checklist items 1, 4, 5: pinned, outside workspaces, ignored, not in CI
Preconditions: repository at or after commit b849ca3
Request:
  node -p "require('./e2e/package.json').devDependencies['@playwright/test']"; ls e2e/package-lock.json
  node -p "JSON.stringify(require('./package.json').workspaces)"
  grep -c -E '^e2e/(\.auth|test-results|playwright-report)/$' .gitignore
  grep -c 'e2e' .github/workflows/ci.yml .github/workflows/deploy-dev.yml
Expected: an exact version (no ^ or ~) and e2e/package-lock.json; ["apps/*"]; 3; both files ":0"
```

```
E2E-2 -> checklist items 2, 3: config and spec titles
Preconditions: as E2E-1
Request:
  grep -c -E "BASE_URL is required|channel: 'chrome'|headless: true|width: 1440|report.json" e2e/playwright.config.ts
  grep -o -E "test\('[^']*" e2e/specs/homepage/homepage.spec.ts | grep -v "^test('homepage E2E-[0-9]* "; echo "bad=$?"
Expected: 5; only "bad=1"
```

## Links

- Feature: [e2e-specs](../../features/e2e-specs.md)
- ADR: [0004-playwright-e2e-specs](../../adr/0004-playwright-e2e-specs.md)
- PR: #46 (commit b849ca3)
