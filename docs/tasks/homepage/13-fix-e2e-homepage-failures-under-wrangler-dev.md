# 13 Triage the 13 failing `e2e/homepage` tests under `wrangler dev`

**Status:** in progress
**Side:** front-end
**Size:** M
**Dependencies:** [12](12-e2e-homepage.md)
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** none

## What to change

Found while closing [google-sign-in task 09](../google-sign-in/09-retire-sign-in-placeholder-from-homepage.md): a local run of `e2e/homepage` against `pnpm build && pnpm start` gave 77 passed, 13 failed, 1 skipped. The branch of task 09 changes no app code (docs, one docstring and one test name only), so the failures are expected to exist already on `dev-v2`. Step 1 confirms that.

## Checklist

- [x] Run `pytest e2e/homepage` on a fresh `dev-v2` (and against the dev deploy) to record the baseline; note which of the 13 fail in each (see Baseline below)
- [x] Font and favicon asset 404s under `wrangler dev`: not an app defect; they came from a leftover server (see Baseline). A fresh build serves them
- [x] US-homepage-10.1: header "Sign in" wraps at narrow widths: passes on a fresh build (305 to 414 px)
- [x] Animation and transform checks (US-homepage-10): pass on a fresh build
- [x] Mobile nav and layout checks (US-homepage-10): pass on a fresh build
- [x] Also under `wrangler dev`: `test_US_google_sign_in_1_5_mobile` and `test_US_google_sign_in_1_7_accessibility` at 1440, 768 and 375 px pass on a fresh build
- [x] Fix `test_US_homepage_8_3_no_private_data` against dev: it compared dev's HTML with the local `.env` `SITE_URL` (`http://localhost:3000`). Against a non-local `E2E_BASE_URL` it now uses only `E2E_<NAME>` values
- [x] Stop leftover servers: `with_server.py` now refuses an occupied port and stops the whole process group (`e2e/README.md`)
- [ ] Decide what to do about `SITE_URL` in the `<body>` (see Open finding), then fix the app or the spec
- [ ] Decide whether the `homepage` row in `docs/features/Progress.md` stays `in progress` until the open finding is resolved

## Verification

- [x] `pytest e2e/homepage` and the task06 scenarios 1.5 and 1.7 pass locally and against dev, or each remaining failure is documented with a reason
- [x] `pnpm test` is green: 444 tests, lint and typecheck clean

## Baseline (2026-11-27, `dev-v2` at `cfefbfb`, dev deployed from the same commit)

Suite: `e2e/homepage` (91 tests) plus `e2e/google-sign-in/test_google_sign_in_task06_login_page_ui.py` (11 tests).

| Target | Before the test fix | After the test fix |
| --- | --- | --- |
| Fresh `pnpm build`, `wrangler dev` on port 3100 | 101 passed, 0 failed, 1 skipped | 101 passed, 0 failed, 1 skipped |
| Dev (`E2E_BASE_URL` = dev URL) | 100 passed, 1 failed (US-homepage-8.3), 1 skipped | 101 passed, 0 failed, 1 skipped |
| Leftover `wrangler dev` already on port 3000 | 84 passed, 17 failed, 1 skipped | not rerun |

The skip is US-homepage-5.4 (BLOCKED: no Template storage yet).

**Cause of the 13 failures:** a `wrangler dev` left running on port 3000 from an earlier run (under Node 26, not 24). It returns 404 for `/favicon.ico` and the font files, so pages render without their CSS. Testing against it reproduces the list in this task: 1.8 font preload, 1.9 console and favicon, 10.1 header row at 305 to 414 px and mobile 375, 10.3 reduced motion and hover lift, 7.1 address rows, and google-sign-in 1.5 and 1.7 at three widths. The old `with_server.py` stopped only the `pnpm` wrapper, so `workerd` kept the port, and its readiness check passed at once against the old server. No app defect was found.

## Open finding: `SITE_URL` appears in the body

With the deployed value supplied (`E2E_SITE_URL=<dev URL>`), US-homepage-8.3 fails: the TanStack Router hydration script at the end of `<body>` carries the home route's loader data `{siteUrl: "<dev URL>", indexable: false}` (from [homepage-seo task 03](../homepage-seo/03-home-head-tags.md)). Spec 8.3 says `SITE_URL` may appear only in the listed head tags, "never in the body". The value is the public site origin, not private data, so this is a spec-versus-app mismatch rather than a leak. Options: keep `siteUrl` out of the client payload (for example, build the head on the server only), or allow the router's hydration payload in spec 8.3. Without `E2E_SITE_URL` the test does not see this: locally it compares against `.env` (`http://localhost:3000`), but the built Worker uses `SITE_URL` from `wrangler.jsonc` (the dev URL), so the local value check does not catch it either.
