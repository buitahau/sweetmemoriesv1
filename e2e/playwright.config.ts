import { defineConfig } from '@playwright/test';

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error(
    'BASE_URL is required, e.g. BASE_URL=http://localhost:5173 or BASE_URL=$DEV_WEB_URL',
  );
}

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
