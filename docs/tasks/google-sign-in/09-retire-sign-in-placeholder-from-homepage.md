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
- [x] `e2e/homepage` passes with no test asserting "coming soon" (verified on dev: US-homepage-2.3, 9.1, 9.2 and 9.3 pass; the 13 unrelated wrangler-dev failures did not reproduce on dev, see [homepage task 13](../homepage/13-fix-e2e-homepage-failures-under-wrangler-dev.md))
- [x] Progress.md lists both features as `todo` or `in progress`

## Summary

**Built:** docs-only change. US-homepage-9 is marked superseded by google-sign-in in `docs/features/homepage.md`, and `docs/features/Progress.md` already lists google-sign-in as `in progress` and dashboard-home as `todo`. The unit test (`src/components/sign-in-page.test.tsx`) and the e2e assertions (US-homepage-2.3 and 9.x) were already moved to the login page in [#157](https://github.com/buitahau/sweetmemoriesv1/pull/157) and [#158](https://github.com/buitahau/sweetmemoriesv1/pull/158).

**Test evidence (re-run):** the earlier `wrangler dev` run served no CSS or JS (assets 404), so its visual results were not trusted. On `pnpm dev` (Node 24, assets served) `test_google_sign_in_task06_login_page_ui.py` (US-google-sign-in-1.1 to 1.7, including 1.5 mobile and 1.7 accessibility at 1440, 768 and 375 px) and the homepage US-homepage-2.3 and 9.x tests gave 15 passed. Screenshot `e2e/homepage/screenshots/us-homepage-9-1-sign-in.png` was viewed: styled Login page, heading, subtitle and "Continue with Google" button present. The 1.5 and 1.7 failures under `wrangler dev` were the missing built CSS (the button has `min-h-[60px]`), not a sizing bug; running them under `wrangler dev` stays tracked in [homepage task 13](../homepage/13-fix-e2e-homepage-failures-under-wrangler-dev.md).

**Test evidence (first run):** `pnpm test` 29 files / 337 passed, typecheck clean. `e2e/homepage` run locally against `pnpm start`: 77 passed, 13 failed, 1 skipped. The sign-in stories (2.3, 9.x) pass; the failures are unrelated (asset 404s, narrow-width header wrap, animation and layout checks).

**Dev test (PR [#162](https://github.com/buitahau/sweetmemoriesv1/pull/162), merge 7747927):** PASS. Headed Playwright against dev: google-sign-in + homepage e2e 138 passed, 0 failed, 8 blocked (no seeded session, no Neon branch URL, no Cloudflare or Google console access, homepage 5.4 needs Template storage). Two apparent failures (task02 T02_V1b, task03 T03_V3) came from a shell on Node 18 and pass on Node 24. Walkthrough at 1440, 768 and 375 px: header Sign in link goes to `/sign-in`, heading "Welcome! Come on in.", "Continue with Google" visible, no horizontal scroll, focus ring visible, no console errors. Evidence: `/tmp/claude-1000/-home-haukute-work-project-sweetmemoriesv1-sweetmemoriesv1/55189819-bf24-4890-9a44-bd96da5c6539/scratchpad/evidence/` (`dev-headed-run.log`, `dev-headed-junit.xml`, `walk09.json`, screenshots). Fix cycles: 0.

**Resolved (was open):** the 13 unrelated `e2e/homepage` failures are tracked in [homepage task 13](../homepage/13-fix-e2e-homepage-failures-under-wrangler-dev.md). Once its baseline confirms they predate this branch, tick the box above with "sign-in scenarios green; unrelated failures tracked in homepage task 13" and set Status to done.

**Coverage gap and owner:** within this ticket's scope (US-google-sign-in-1, 2, 4, 5 and the homepage stories) every scenario has a test. The rest has none yet: US-google-sign-in-3.3, 3.4, 6.1 and 6.2 have no `test_US_google_sign_in_*` test, and 3.1 and 3.2 are manual by design (ADR 0009). All of them belong to [google-sign-in task 10](10-e2e-google-sign-in.md) (status todo).
