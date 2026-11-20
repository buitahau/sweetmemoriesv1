# 09 Retire the sign-in placeholder from homepage specs and tests

**Status:** in progress (e2e homepage suite has 13 unrelated failures)
**Side:** front-end
**Size:** S
**Dependencies:** [06](06-login-page-ui-from-mockup.md)
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [x] Mark US-homepage-9 as superseded by google-sign-in in `docs/features/homepage.md`
- [x] Update `src/components/sign-in-page.test.tsx` and the e2e tests in `e2e/homepage/test_homepage.py` (US-homepage-2.3 and 9.x) to assert the new page heading instead of the placeholder
- [x] Check `docs/features/Progress.md` lists google-sign-in and dashboard-home with current status

## Verification

- [x] `pnpm test` is green
- [ ] `e2e/homepage` passes with no test asserting "coming soon" (grep confirms no test asserts it; ran `e2e/homepage` locally: 77 passed, 13 failed, 1 skipped. All US-homepage-2.3 and 9.x tests pass; the 13 failures are unrelated to the placeholder: font/favicon assets 404 under `wrangler dev`, header Sign in wrapping at narrow widths (10.1), animation/transform checks and mobile nav/layout. tracked in [homepage task 13](../homepage/13-fix-e2e-homepage-failures-under-wrangler-dev.md), which also records the dev-v2 baseline. Tick this box once the sign-in scenarios are green and that task owns the rest)
- [x] Progress.md lists both features as `todo` or `in progress`

## Summary

**Built:** docs-only change. US-homepage-9 is marked superseded by google-sign-in in `docs/features/homepage.md`, and `docs/features/Progress.md` already lists google-sign-in as `in progress` and dashboard-home as `todo`. The unit test (`src/components/sign-in-page.test.tsx`) and the e2e assertions (US-homepage-2.3 and 9.x) were already moved to the login page in [#157](https://github.com/buitahau/sweetmemoriesv1/pull/157) and [#158](https://github.com/buitahau/sweetmemoriesv1/pull/158).

**Test evidence:** `pnpm test` 29 files / 337 passed, typecheck clean. `e2e/homepage` run locally against `pnpm start`: 77 passed, 13 failed, 1 skipped. The sign-in stories (2.3, 9.x) pass; the failures are unrelated (asset 404s, narrow-width header wrap, animation and layout checks).

**Still open:** the 13 unrelated `e2e/homepage` failures are tracked in [homepage task 13](../homepage/13-fix-e2e-homepage-failures-under-wrangler-dev.md). Once its baseline confirms they predate this branch, tick the box above with "sign-in scenarios green; unrelated failures tracked in homepage task 13" and set Status to done.
