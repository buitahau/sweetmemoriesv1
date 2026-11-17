# 10 E2E suite `e2e/google-sign-in` with a session-seeding helper (ADR 0009)

**Status:** todo
**Side:** front-end
**Size:** M
**Dependencies:** [07](07-wire-google-button-and-states.md), [08](08-redirect-signed-in-users-from-sign-in.md), [dashboard-home 01](../dashboard-home/01-protected-dashboard-route-and-loader.md)
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [ ] Add a helper in `e2e/helpers.py` that seeds a User, Account and Session in the local test database and sets the signed cookie; reuse the `E2E_BASE_URL` guard and refuse non-local databases
- [ ] Write one test per US-google-sign-in scenario; scenarios 3.1 and 3.2 are skipped as BLOCKED or manual, and the redirect scenario stops at the `accounts.google.com` request using Playwright routing without loading Google
- [ ] Update `e2e/README.md`

## Verification

- [ ] `pytest e2e/google-sign-in -rs` passes locally against `pnpm start`, and only the documented scenarios are skipped
- [ ] One test checks that the seeded cookie is accepted by `getSession` (guards the cookie-format coupling)
- [ ] A manual run on dev covers 3.1 and 3.2, recorded in the feature delivery notes. The product owner's Google account must be a test user on the consent screen, and the run uses their own signed-in Chrome (Claude in Chrome, or Playwright over CDP), not a headless browser; see [ADR 0009](../../adr/0009-e2e-signed-in-state-without-real-google.md)
