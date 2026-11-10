# E2E specs

- Status: in-progress

## Summary

The repo-root `e2e/` Playwright project that turns the spec-eligible cases of FE tickets' `e2e-test-suites` into re-runnable specs. Decided in [ADR 0004](../adr/0004-playwright-e2e-specs.md). The project itself was shipped in PR #46 (commit b849ca3) before this feature doc existed; [scaffold-e2e-project](../tasks/e2e-specs/scaffold-e2e-project.md) records it as `done`. Per-ticket spec files are not part of this feature: each FE ticket owns its own spec (`Spec:` field), written by the `tester`.

## User story

As the `tester` agent, I want one small Playwright project outside the npm workspaces, so that I can write and re-run a ticket's spec-eligible cases against local or dev without slowing or breaking `npm ci`, `npm test`, `npm run build`, `npm run typecheck` or CI.

Acceptance criteria:
1. `e2e/` has its own `package.json` with `@playwright/test` pinned to an exact version and its own `package-lock.json`; it is not listed in the root `workspaces`.
2. `e2e/playwright.config.ts` reads `BASE_URL`, throws a clear error when it is unset, uses system Chrome (`channel: 'chrome'`, headless), viewport 1440 x 900, and writes `test-results/report.json`.
3. Specs live in `e2e/specs/<feature-slug>/<feature-or-task-slug>.spec.ts`; every `test()` title starts with the ticket slug and case ID (`homepage E2E-1 ...`).
4. `e2e/README.md` states the same title rule as ADR 0004 and the install and run commands.
5. Saved sign-in state (`e2e/.auth/`) and run output (`e2e/test-results/`, `e2e/playwright-report/`) are git-ignored.
6. Neither CI workflow installs or runs `e2e/`.

## Behavior

- Install: `npm ci --prefix e2e`. Run: `cd e2e && BASE_URL=<url> npx playwright test [specs/<feature-slug>/]`.
- Optional `STORAGE_STATE` points specs at a session saved with `npm --prefix e2e run auth:save` ([ADR 0004](../adr/0004-playwright-e2e-specs.md), Consequences).
- Spec-eligibility, `Spec:` and `Testids:` fields: [writing-docs skill, Playwright specs](../../.claude/skills/writing-docs/SKILL.md).

## Out of scope

- Running specs in CI (ADR 0004, CI row).
- Screenshot-diff tooling (ADR 0003).
- Test-only sign-in, dev database seed/reset (deferred by ADR 0004).
- Per-ticket spec files (owned by each FE ticket).

## Verification checklist

The feature is complete only when every item below passes.

- [ ] 1. Both tasks of this feature have Status `done`. (all ACs)
- [x] 2. `node -p "require('./e2e/package.json').devDependencies['@playwright/test']"` prints a version with no `^` or `~`; `e2e/package-lock.json` exists; `node -p "JSON.stringify(require('./package.json').workspaces)"` prints `["apps/*"]`. (AC1)
- [ ] 3. `cd e2e && npx playwright test --list` with `BASE_URL` unset exits non-zero and prints `BASE_URL is required`; `grep -c -E "channel: 'chrome'|headless: true|width: 1440|report.json" e2e/playwright.config.ts` prints 4. (AC2)
- [x] 4. `grep -h -o -E "test\('[a-z0-9-]+ E2E-[0-9]+" e2e/specs/*/*.spec.ts` prints only lines of the form `test('<slug> E2E-<n>`. (AC3)
- [ ] 5. `grep -c 'starts with the ticket slug and the case ID' e2e/README.md` prints 1 and `grep -c 'starts with its case ID' e2e/README.md` prints 0. (AC4)
- [x] 6. `grep -c -E '^e2e/(\.auth|test-results|playwright-report)/$' .gitignore` prints 3. (AC5)
- [x] 7. `grep -c 'e2e' .github/workflows/ci.yml .github/workflows/deploy-dev.yml` prints 0 for both files. (AC6)

## e2e-test-suites

Type: BE (tooling, verified by shell commands; no API, no browser UI). Run from the repo root with Node 24.

```
E2E-1 -> checklist items 2, 6, 7: pinned, outside workspaces, ignored, not in CI
Preconditions: repository checked out
Request:
  node -p "require('./e2e/package.json').devDependencies['@playwright/test']"
  ls e2e/package-lock.json
  node -p "JSON.stringify(require('./package.json').workspaces)"
  grep -c -E '^e2e/(\.auth|test-results|playwright-report)/$' .gitignore
  grep -c 'e2e' .github/workflows/ci.yml .github/workflows/deploy-dev.yml
Expected: an exact version such as 1.65.0 (no ^ or ~); e2e/package-lock.json; ["apps/*"]; 3; both files ":0"
```

```
E2E-2 -> checklist item 3: config fails clearly without BASE_URL
Preconditions: npm ci --prefix e2e done; BASE_URL not exported
Request:
  (cd e2e && env -u BASE_URL npx playwright test --list); echo "e=$?"
  grep -c -E "channel: 'chrome'|headless: true|width: 1440|report.json" e2e/playwright.config.ts
Expected: output contains "BASE_URL is required" and e is not 0; 4
```

```
E2E-3 -> checklist items 4, 5: title rule in specs and README
Preconditions: repository checked out
Request:
  grep -h -o -E "test\('[^']*" e2e/specs/*/*.spec.ts | grep -v -E "^test\('[a-z0-9-]+ E2E-[0-9]+ "; echo "bad=$?"
  grep -c 'starts with the ticket slug and the case ID' e2e/README.md; grep -c 'starts with its case ID' e2e/README.md
Expected: only "bad=1" (every title matches); 1 then 0
```

```
E2E-4 -> checklist item 1: tasks done
Preconditions: repository checked out
Request:
  grep -h '^- Status:' docs/tasks/e2e-specs/*.md
Expected: two lines, each "- Status: done"
```

## Related

- Parent ADR: [0004-playwright-e2e-specs](../adr/0004-playwright-e2e-specs.md)
- Used by: every FE ticket's `e2e-test-suites` (`Spec:` fields), e.g. [homepage](homepage.md), [web-design-foundation](web-design-foundation.md); those features belong to [ADR 0003](../adr/0003-frontend-styling-and-self-hosted-fonts.md).
- Questions: [Q010](../questions/questions-2026-11-10-requirement-breakdown.md#q010-record-adr-0003-and-adr-0004-approval-in-claudemd) (open; record ADR 0004 approval in `CLAUDE.md`).
- Tasks:
  1. [scaffold-e2e-project](../tasks/e2e-specs/scaffold-e2e-project.md) (done, PR #46)
  2. [align-e2e-readme-title-rule](../tasks/e2e-specs/align-e2e-readme-title-rule.md)
