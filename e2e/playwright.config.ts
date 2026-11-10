import { resolve } from 'node:path';
import { defineConfig } from '@playwright/test';

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error(
    'BASE_URL is required, e.g. BASE_URL=http://localhost:5173 or BASE_URL=$DEV_WEB_URL',
  );
}

// Optional signed-in session saved by `npm --prefix e2e run auth:save` (see README).
const storageState = process.env.STORAGE_STATE ? resolve(process.env.STORAGE_STATE) : undefined;

export default defineConfig({
  testDir: 'specs',
  retries: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/report.json' }]],
  use: {
    baseURL,
    ...(storageState ? { storageState } : {}),
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: 'on-first-retry',
  },
});
