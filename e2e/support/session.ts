import { resolve } from 'node:path';

export type Role = 'user' | 'admin';

// Saved browser state per role, created by `npm --prefix e2e run auth:save -- <url> --role <role>`
// (manual) or by the test sign-in setup (ADR 0005). Tests run from e2e/, so paths resolve there.
export const sessionFile = (role: Role): string => resolve(process.cwd(), '.auth', `${role}.json`);

// Base URL of the API for *.api.spec.ts (BASE_URL is the web app). Dev: $DEV_API_URL.
export function apiURL(): string {
  const url = process.env.API_URL;
  if (!url) {
    throw new Error('API_URL is required for API specs, e.g. API_URL=http://localhost:3000 or API_URL=$DEV_API_URL');
  }
  return url;
}
