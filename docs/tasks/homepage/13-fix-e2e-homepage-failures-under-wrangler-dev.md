# 13 Triage the 13 failing `e2e/homepage` tests under `wrangler dev`

**Status:** todo
**Side:** front-end
**Size:** M
**Dependencies:** [12](12-e2e-homepage.md)
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** none

## What to change

Found while closing [google-sign-in task 09](../google-sign-in/09-retire-sign-in-placeholder-from-homepage.md): a local run of `e2e/homepage` against `pnpm build && pnpm start` gave 77 passed, 13 failed, 1 skipped. The branch of task 09 changes no app code (docs, one docstring and one test name only), so the failures are expected to exist already on `dev-v2`. Step 1 confirms that.

## Checklist

- [ ] Run `pytest e2e/homepage` on a fresh `dev-v2` (and against the dev deploy) to record the baseline; note which of the 13 fail in each
- [ ] Font and favicon asset 404s under `wrangler dev`: fix or document as local-only
- [ ] US-homepage-10.1: header "Sign in" wraps at narrow widths
- [ ] Animation and transform checks (US-homepage-10)
- [ ] Mobile nav and layout checks (US-homepage-10)
- [ ] Also under `wrangler dev` (asset 404s, no CSS): `e2e/google-sign-in/test_google_sign_in_task06_login_page_ui.py::test_US_google_sign_in_1_5_mobile` and `test_US_google_sign_in_1_7_accessibility` at 1440, 768 and 375 px fail; they pass on `pnpm dev` where assets load. Re-run them with the rest of this task
- [ ] Decide whether the `homepage` row in `docs/features/Progress.md` stays `done` or moves to `in progress` until these pass

## Verification

- [ ] `pytest e2e/homepage` and the task06 scenarios 1.5 and 1.7 pass locally and against dev, or each remaining failure is documented with a reason
- [ ] `pnpm test` is green
