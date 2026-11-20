# 09 Retire the sign-in placeholder from homepage specs and tests

**Status:** in progress (e2e run pending)
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
- [ ] `e2e/homepage` passes with no test asserting "coming soon" (grep confirms no test asserts it; the suite itself was not run by the developer agent)
- [x] Progress.md lists both features as `todo` or `in progress`

## Summary

**Built:** docs-only change. US-homepage-9 is marked superseded by google-sign-in in `docs/features/homepage.md`, and `docs/features/Progress.md` already lists google-sign-in as `in progress` and dashboard-home as `todo`. The unit test (`src/components/sign-in-page.test.tsx`) and the e2e assertions (US-homepage-2.3 and 9.x) were already moved to the login page in [#157](https://github.com/buitahau/sweetmemoriesv1/pull/157) and [#158](https://github.com/buitahau/sweetmemoriesv1/pull/158).

**Test evidence:** `pnpm test` 29 files / 337 passed, typecheck clean. The e2e suite `e2e/homepage` was NOT run.

**Still open:** run `e2e/homepage` against `pnpm dev` or the dev deploy, then tick the box above and set Status to done.
