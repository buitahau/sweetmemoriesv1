import { defineConfig } from '@playwright/test';

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error(
    'BASE_URL is required, e.g. BASE_URL=http://localhost:5173 or BASE_URL=$DEV_WEB_URL',
  );
}

// No global signed-in session: a spec that needs one opts in per role with
// `test.use({ storageState: sessionFile('user') })` from support/session.ts, so anonymous
// specs (homepage) always run signed out. API specs (*.api.spec.ts) use API_URL, not BASE_URL.

export default defineConfig({
  testDir: 'specs',
  retries: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/report.json' }]],
  use: {
    baseURL,
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: 'on-first-retry',
  },
});
