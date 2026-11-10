# e2e

Playwright specs for frontend tickets and API (`*.api.spec.ts`) tickets ([ADR 0004](../docs/adr/0004-playwright-e2e-specs.md), amended by [ADR 0005](../docs/adr/0005-e2e-signed-in-data-writing-and-visual-specs.md)). Not an npm workspace: root `npm ci`, `npm test` and CI do not touch it. Uses the system Chrome (`channel: 'chrome'`); no browser download.

```
npm ci --prefix e2e                                  # once
cd e2e
BASE_URL=http://localhost:5173 npx playwright test --grep build-top-bar   # one ticket, local app (npm run dev at the repo root)
BASE_URL=$DEV_WEB_URL npx playwright test --grep "homepage E2E-"          # whole Homepage, feature spec only, dev
npm --prefix e2e run list                           # needs BASE_URL set
```

## Running: one ticket or one feature spec

Task specs assert the page as it is right after their task, so they can fail once later tasks merge ([ADR 0004](../docs/adr/0004-playwright-e2e-specs.md), Spec isolation row):

- Each task spec wraps all its tests in `test.describe('<task-slug>', ...)`.
- One ticket: `npx playwright test --grep <task-slug>`.
- Whole project: only the feature spec, `npx playwright test --grep "<feature-slug> E2E-"` (Homepage: `--grep "homepage E2E-"`). A bare `--grep homepage` also matches every task spec, because Playwright tests `--grep` against the file path too.
- Plain `npx playwright test` with no filter is not a supported check.

- Specs: `specs/<feature-slug>/<task-or-feature>.spec.ts` (API: `.api.spec.ts`). Every `test()` title starts with the ticket slug and case ID (`homepage E2E-8 ...`).
- API specs use `API_URL` (dev: `$DEV_API_URL`), web specs use `BASE_URL` (dev: `$DEV_WEB_URL`).
- Report: `test-results/report.json` (git-ignored).
- Authors: the `tester` agent, from the ticket only.

## Signed-in specs (manual sign-in, saved once)

Google sign-in with 2FA cannot be automated. Sign in by hand once and reuse the session:

```
npm --prefix e2e run auth:save -- "$DEV_WEB_URL/" --role user --until /dashboard   # or omit --until and press Enter; --role admin for an admin session
BASE_URL=$DEV_WEB_URL npm --prefix e2e test -- --grep <ticket-slug>
```

- A visible Chrome opens; you sign in (approve 2FA on your phone). The browser state is saved to `e2e/.auth/<role>.json` (git-ignored, mode 600, live session cookies: use a dedicated test account, never commit or share it).
- There is no global session: a spec opts in with `test.use({ storageState: sessionFile('user') })` (`support/session.ts`), so anonymous specs stay signed out. When a session expires, run `auth:save` again.
- If Google shows "This browser may not be secure", see ADR 0004 (alternatives); a test-only sign-in on dev is the permanent fix.
