# 10 E2E suite `e2e/google-sign-in` with a session-seeding helper (ADR 0009)

**Status:** in progress (seeded scenarios pass locally against a Neon developer branch; only the manual dev run of 3.1 and 3.2 is left)
**Side:** front-end
**Size:** M
**Dependencies:** [07](07-wire-google-button-and-states.md), [08](08-redirect-signed-in-users-from-sign-in.md), [dashboard-home 01](../dashboard-home/01-protected-dashboard-route-and-loader.md)
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [x] Add a helper in `e2e/helpers.py` that seeds a User, Account and Session in the local test database and sets the signed cookie; reuse the `E2E_BASE_URL` guard and refuse non-local databases
- [x] Write one test per US-google-sign-in scenario; scenarios 3.1 and 3.2 are skipped as BLOCKED or manual, and the redirect scenario stops at the `accounts.google.com` request using Playwright routing without loading Google
- [x] Update `e2e/README.md`

## Verification

- [x] `pytest e2e/google-sign-in -rs` passes locally against `pnpm start`, and only the documented scenarios are skipped
- [x] One test checks that the seeded cookie is accepted by `getSession` (guards the cookie-format coupling)
- [ ] A manual run on dev covers 3.1 and 3.2, recorded in the feature delivery notes. The product owner's Google account must be a test user on the consent screen, and the run uses their own signed-in Chrome (Claude in Chrome, or Playwright over CDP), not a headless browser; see [ADR 0009](../../adr/0009-e2e-signed-in-state-without-real-google.md)

**Local seeded run (2026-11-26):** `pnpm start` on a personal Neon branch with seeded sessions (ADR 0009), `pytest e2e/google-sign-in e2e/dashboard-home -rs`: 85 passed, 0 failed, 14 skipped (documented BLOCKED or manual scenarios, and the dashboard-home Sign out scenarios for tasks 02 and 03). US-google-sign-in-3.4 needed a test fix first ([#173](https://github.com/buitahau/sweetmemoriesv1/pull/173)): Playwright ignores a `Cookie` header override in `page.route`.
