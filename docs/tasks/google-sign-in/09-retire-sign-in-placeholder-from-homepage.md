# 09 Retire the sign-in placeholder from homepage specs and tests

**Status:** done
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
- [x] `e2e/homepage` passes with no test asserting "coming soon"
- [x] Progress.md lists both features as `todo` or `in progress`
