# 0004: Playwright e2e specs for frontend tickets

- Status: accepted (Q009, option A, approved by the product owner 2026-11-10).
- Date: 2026-11-10

## Context

- Every feature and task has an `e2e-test-suites` section ([business-analyst](../../.claude/agents/business-analyst.md)). For FE tickets the cases are prose steps with Console snippets; the `tester` agent re-types them each run, so results vary between runs and nothing is kept in the repo.
- `tools/browser-check/check-page.mjs` (Playwright + system Chrome; added by this change, with `playwright-core` pinned to the exact installed version and its own lockfile) checks one page quickly (title, `lang`, `h1`, cookies, requests, console errors). It is not a place for per-ticket assertions.
- Root scripts (`npm test`, `npm run build`, `npm run typecheck`) run in every workspace ([ADR 0001](0001-monorepo-skeleton-and-tooling.md)); CI runs `npm ci` and those scripts ([ci-cd](../infra/ci-cd.md)). A browser test project must not slow or break them.
- The tester must stay independent of the code: if it reads the diff, a spec can be written to pass the implementation instead of the requirement.
- [ADR 0003](0003-frontend-styling-and-self-hosted-fonts.md) decides that no screenshot-diff tool is added.
- Today there is no sign-in, no dev database with seed and reset, and domain design is not approved (`CLAUDE.md`), so signed-in or data-writing flows cannot be tested repeatably.

## Decision

| Concern | Choice |
|---|---|
| Deliverable | Playwright specs are a code deliverable of each frontend ticket. No new skill and no new agent: the existing `tester` agent writes and runs them. |
| Location | Test project at repo-root `e2e/` with its own `package.json` and `@playwright/test` (pinned). It is **not** an npm workspace and not in root `workspaces`, so `npm ci`, `npm test`, `npm run build`, `npm run typecheck` and CI never see it. Install: `npm ci --prefix e2e`. |
| Browser | System Chrome through `channel: 'chrome'`, headless. No `playwright install`, no browser download. |
| Spec files | One file per ticket: `e2e/specs/<feature-slug>/<feature-or-task-slug>.spec.ts`. |
| Case IDs | Case IDs repeat across tickets, so every `test()` title starts with the ticket slug and the case ID, e.g. `homepage E2E-1 structure` or `build-hero-collage E2E-4 ...`, so a report maps back to one ticket's checklist items. |
| Base URL | `baseURL` comes from the `BASE_URL` env var (`DEV_WEB_URL` for FE on dev, `http://localhost:5173` locally). The config fails with a clear error if it is unset. |
| Selectors | Prefer role and visible text. Fall back to `data-testid` values listed in the ticket (`Testids:` field, kebab-case). No class names (CSS Modules hash them) and no structure-only CSS paths unless the case itself names them. |
| Who writes specs | The `tester` in author mode, from the ticket only (feature, task, mockup docs): it never reads the diff or the implementation for spec authoring. Assertions are copied from the case's Expected line. The tester never weakens or removes an assertion to make a spec pass; a spec that cannot run is reported as a test problem, not a code defect. In test mode the tester only runs specs and never edits `e2e/`; fixes go through a fresh author-mode run and a small PR. |
| Implementer | Only adds the `data-testid` values listed in the ticket and never edits `e2e/`. |
| Eligibility | An FE case with no authentication and no data writes becomes a spec (`Spec: <path>`). Every other case stays prose (`Spec: prose`). |
| Deferred | Authenticated or data-writing flows stay prose and are reported Blocked until a test-sign-in ADR, a dev database with seed/reset, and approval of the domain design all exist. |
| Visual fidelity | Cases that compare against a mockup stay prose, with screenshots as evidence. No screenshot-diff tool (ADR 0003). |
| BE tickets | Keep their `curl` suites. Unchanged. |
| CI | Specs are not run in CI for now. Running the current ticket's spec file against dev is the tester's step in `implement-and-test-ticket`. |
| Quick check | `tools/browser-check/check-page.mjs` stays for one-off page checks. |

## Consequences

- Test cases are written once, versioned, and re-runnable; `report.json` gives per-case Pass/Fail for the tester's report.
- A new directory with its own lockfile and dependency to keep up to date, outside the root install.
- Spec authoring happens before the implementation exists, so specs fail first ("red") and prove the case is not vacuous. The ordering is set in [implement-and-test-ticket](../../.claude/skills/implement-and-test-ticket/SKILL.md).
- Tickets must list their `data-testid` values; a missing testid is a ticket defect, found when the spec fails.
- Not running in CI means a spec can rot between ticket runs; revisit once a dev deploy gate exists.
- Chrome must be installed where the tester runs.
- Authenticated cases get no automation until the prerequisites in the table exist. Until the test-only sign-in exists, the user may sign in once by hand with `npm --prefix e2e run auth:save` (visible Chrome, Google 2FA on the user's phone); the saved session (`e2e/.auth/user.json`, git-ignored, live cookies, dedicated test account) is passed to specs through `STORAGE_STATE`. The tester never signs in to Google itself and never reads that file.

## Alternatives

| Option | Why not chosen |
|---|---|
| `apps/e2e` npm workspace | Root `build`, `test` and `typecheck` run every workspace and CI runs them, so a browser project would run (or fail) there. |
| New skill for writing specs | The tester already owns testing and the ticket owns the cases; a skill adds a second place for the same rules. |
| Implementer writes specs | Specs would follow the code, not the ticket. |
| Tester reads the diff when authoring | Same coupling; specs would pass by construction. |
| Keep prose cases plus Console snippets only | Not repeatable; results depend on who types them. |
| Run specs in CI now | Needs a deployed target and Chrome in CI; out of scope for the current pipelines. |
| Screenshot-diff tool (Percy, Playwright snapshots) | Rejected by [ADR 0003](0003-frontend-styling-and-self-hosted-fonts.md); fonts render differently across machines. |
| Automate Google sign-in and 2FA | Google blocks automated logins and 2FA needs the user's device; a manual one-time sign-in is reused instead. |
| Extend `tools/browser-check` | One-page checker by design; no test runner, reporter or case IDs. |

## Features

- [e2e-specs](../features/e2e-specs.md): the `e2e/` project (scaffolded in PR #46) and its upkeep.

## Applies to

Not child features (their parent is [ADR 0003](0003-frontend-styling-and-self-hosted-fonts.md)); they follow this ADR through the `Spec:` and `Testids:` fields of their `e2e-test-suites`:

- [web-design-foundation](../features/web-design-foundation.md)
- [homepage](../features/homepage.md): first specs (`e2e/specs/homepage/homepage.spec.ts`).
