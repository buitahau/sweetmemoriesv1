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
