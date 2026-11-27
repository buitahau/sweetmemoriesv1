# 04 E2E suite for homepage-seo

**Status:** done
**Side:** front-end
**Size:** S
**Dependencies:** 03
**Feature spec:** [homepage-seo](../../features/homepage-seo.md)
**Mockup:** none

## What to change

`e2e/homepage-seo/` with one test per scenario of US-homepage-seo-1 to US-homepage-seo-5. Scenarios parse raw HTML (no JavaScript), except US-homepage-seo-3.6, which loads `/` in Playwright with JavaScript and compares the live DOM to the raw HTML.

There is no production environment, so production and misconfigured behaviour is checked locally with `.env` overrides under `pnpm dev` (`/` does not depend on auth config). Each run declares what it expects through `E2E_SEO_PROFILE`:

| Profile | Server config | Command |
| --- | --- | --- |
| `dev` (default) | dev values, or local `SITE_URL=http://localhost:3000`, `SITE_INDEXABLE=false` | `pytest e2e/homepage-seo -rs` against `pnpm start`, or with `E2E_BASE_URL=<dev URL>` |
| `prod-like` | `SITE_URL=https://sweetmemories.com SITE_INDEXABLE=true pnpm dev` | `E2E_SEO_PROFILE=prod-like pytest e2e/homepage-seo -rs` |
| `unset-indexable` | `SITE_INDEXABLE` unset | `E2E_SEO_PROFILE=unset-indexable pytest e2e/homepage-seo -rs` |
| `bad-url` | `SITE_URL=not-a-url` | `E2E_SEO_PROFILE=bad-url pytest e2e/homepage-seo -rs` |

## Checklist

- [x] Profile-specific scenarios skip with a reason when the profile does not match: `prod-like` runs US-2.1, 2.2, 3.1, 3.5 and 5.1; `dev` runs 2.4 and 3.2; `unset-indexable` runs 3.3; `bad-url` runs 3.4; all other scenarios run in every profile and assert against the target's own origin
- [x] US-homepage-seo-2.5: against dev send only `X-Forwarded-Host` and `Forwarded` (Cloudflare rejects a foreign `Host` before the Worker); locally also send `Host: evil.example`
- [x] US-homepage-seo-3.6 runs in every profile
- [x] Document the profiles and commands in `e2e/README.md`

## Verification

- [x] `pytest e2e/homepage-seo -rs` passes locally in each of the four profiles and against dev (`dev` profile). (Local profiles run by the developer in PR #186; the tester re-ran the `dev` profile against dev only.)
- [x] The skip list of each run matches the table above, and every scenario passes in at least one profile.
- [x] Each scenario ID appears in a test name.

## Summary

**Built:** the `e2e/homepage-seo` suite now covers every scenario of US-homepage-seo-1.1 to 5.2, with the scenario ID in each test name, and passes in every `E2E_SEO_PROFILE`. `e2e/homepage-seo/seo_profile.py` holds the shared profile handling: an unknown profile fails the run, and profile-only scenarios skip with a reason. `test_homepage_seo_task04_suite.py` (17 tests, no server) checks one test per scenario ID, the per-profile skip lists against the table above, that 3.6 runs in every profile, and the README section. `test_T01_V3c` now runs in the `dev` profile only. The Cache-Control checks (US-homepage-seo-4.2, `T02_V3`) skip as BLOCKED under Vite dev, which ignores `public/_headers`. `e2e/README.md` documents the profiles (plus an extra `path-url` profile), commands, the US-2.5 header rules and the `with_server` caveat.

**PRs:** [#186](https://github.com/buitahau/sweetmemoriesv1/pull/186) (homepage-seo suite across all profiles).

**Test evidence (dev, attempt 1, PASS):** deploy-dev run 45940602701 on merge commit a2f0197; `/api/health` 200. `pnpm test` 38 files / 444 passed, typecheck and lint clean. `e2e/homepage-seo` against dev (`dev` profile, headed Chromium): 43 passed, 7 skipped (2.1, 2.2, 3.1, 3.3, 3.4, 3.5, 5.1, each profile-only, matching the table). Curl on dev: `/` 200 with the pinned title and description, `noindex,nofollow`, dev canonical, one JSON-LD, no `Set-Cookie`; `/does-not-exist` 404 with no canonical or `og:url`; `X-Forwarded-Host` and `Forwarded` do not reach the HTML; `/og/home.png` image/png 1200x630 with no cookie; `favicon.ico`, `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` and `site.webmanifest` served with the right types. Headed walkthrough at 1280, 768 and 390 px: head tags, H1 and hero render, no horizontal scroll, no console errors or failed requests, first Tab on phone focuses the logo link, hydrated canonical equals raw HTML. Local profile runs from PR #186: `dev` on Worker 43 passed / 7 skipped, `prod-like` on Worker 45 / 5, `unset-indexable`, `bad-url` and `path-url` on Vite dev 39 / 11. Evidence lives in the tester's session scratchpad (`e2e-out/homepage-seo-dev.log`, `e2e-out/homepage-seo-dev.xml`, `walk/walkthrough.json`, `walk/*.png`) plus `e2e/homepage-seo/screenshots/US-3.6_dev_hydrated_home.png`, `US-homepage-seo-2.3-og-image.png` and `T01-V3a_home.png` (gitignored).

**Caveats:** the tester did not re-run the local profiles (tester rules forbid localhost), so the prod-like and misconfigured scenarios rest on the developer's runs in PR #186. The walkthrough used headed Playwright, not a live-browser tool. The link preview tool check carried over from task 03 was not run.

**Fix cycles:** 0.
