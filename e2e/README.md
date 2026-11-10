# e2e

Playwright specs for frontend tickets ([ADR 0004](../docs/adr/0004-playwright-e2e-specs.md)). Not an npm workspace: root `npm ci`, `npm test` and CI do not touch it. Uses the system Chrome (`channel: 'chrome'`); no browser download.

```
npm ci --prefix e2e                                  # once
cd e2e
BASE_URL=http://localhost:5173 npx playwright test   # local app (npm run dev at the repo root)
BASE_URL=$DEV_WEB_URL npx playwright test specs/homepage/ --reporter=json   # dev
npm --prefix e2e run list                           # needs BASE_URL set
```

- Specs: `specs/<feature-slug>/<task-or-feature>.spec.ts`. Every `test()` title starts with its case ID (`E2E-8 ...`).
- Report: `test-results/report.json` (git-ignored).
- Authors: the `tester` agent, from the ticket only.

## Signed-in specs (manual sign-in, saved once)

Google sign-in with 2FA cannot be automated. Sign in by hand once and reuse the session:

```
npm --prefix e2e run auth:save -- "$DEV_WEB_URL/" --until /dashboard   # or omit --until and press Enter
STORAGE_STATE=e2e/.auth/user.json BASE_URL=$DEV_WEB_URL npm --prefix e2e test
```

- A visible Chrome opens; you sign in (approve 2FA on your phone). The browser state is saved to `e2e/.auth/user.json` (git-ignored, mode 600, live session cookies: use a dedicated test account, never commit or share it).
- Specs then start already signed in. When the session expires, run `auth:save` again.
- If Google shows "This browser may not be secure", see ADR 0004 (alternatives); a test-only sign-in on dev is the permanent fix.
