# 03 Home route head tags

**Status:** done
**Side:** front-end
**Size:** S
**Dependencies:** homepage task 00 (pinned copy); homepage-seo tasks 01 and 02
**Feature spec:** [homepage-seo](../../features/homepage-seo.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (`<helmet>`)

## What to change

Build the head of the `/` route with a pure head builder taking `{ siteUrl, indexable }`. The `/` route `loader` gets these from the task 01 server function, and `head()` builds the tags from `loaderData`. Never read `process.env` in `head()`: it also runs on the client, where the values are undefined, and would rewrite production to `noindex` with no canonical after hydration.

## Checklist

- [x] `/` loader calls the task 01 server function; `head({ loaderData })` calls the head builder
- [x] Title and the pinned description (Copy section of the spec)
- [x] Canonical `${siteUrl}/` with no query string
- [x] Robots `index, follow` or `noindex, nofollow`
- [x] Full OG and Twitter set, with `og:image:alt` and `twitter:image:alt` set to the pinned alt text
- [x] theme-color, and icon and manifest links (root-relative); `/favicon.svg` stays in the root head and is not duplicated
- [x] One WebSite JSON-LD, serialised with `<` escaped as `<`
- [x] When `siteUrl` is null: omit canonical, every absolute-URL tag and the JSON-LD `url`
- [x] Root route's default `<title>` does not duplicate on `/`
- [x] Tags kept off the 404 page

## Verification

- [x] Vitest on the head builder: `siteUrl=https://sweetmemories.com` with `indexable=true` produces exactly the tags in US-homepage-seo-2.1, 3.1 and 5.1; `indexable=false` gives `noindex, nofollow`; `siteUrl=null` gives no canonical and no `og:url`; JSON-LD contains no `</script` and no raw `<`; the builder takes no request input.
- [x] Manual: `curl -s localhost:3000/ | grep -c '<title>'` prints 1. In a browser, after the page is idle, the canonical and robots in the DOM equal the raw HTML. A link preview tool on the dev URL shows the card. (Title count and DOM-vs-raw-HTML checked on dev; the link preview tool check was not run.)

## Summary

**Built:** a pure head builder `buildHomeHead({ siteUrl, indexable })` in `src/lib/home-head.ts`: title, pinned description, robots (`index, follow` or `noindex, nofollow`), canonical `${siteUrl}/`, full OG and Twitter set with `og:image:alt` and `twitter:image:alt`, theme-color `#FFB6C8`, root-relative icon, apple-touch-icon and manifest links, and one WebSite JSON-LD (`serializeJsonLd` escapes `<`, `>`, `&`, U+2028, U+2029). A null `siteUrl` drops canonical, `og:url`, the image URLs and the JSON-LD `url`. The `/` loader calls `fetchSiteConfig()` (task 01) and `head()` builds from `loaderData`, so server render and hydration agree. One `<title>` on `/`; none of these tags on the 404 page. Unit tests: `src/lib/home-head.test.ts`, `src/routes/-index.wiring.test.tsx`. E2E: `e2e/homepage-seo/test_homepage_seo_task03_home_head_tags.py`, per `E2E_SEO_PROFILE`.

**PRs:** [#184](https://github.com/buitahau/sweetmemoriesv1/pull/184) (home page head tags).

**Test evidence (dev, attempt 1, PASS on the dev-verifiable scope):** deploy-dev run 45938604958 on merge commit 97edac7. `pnpm test` 38 files / 444 passed, typecheck and lint clean. Curl on dev `/` (200, text/html): one title, the pinned description, canonical `https://sweetmemories-dev.haubuitatmp.workers.dev/`, `noindex, nofollow`, full OG and Twitter set, theme-color, root-relative icon and manifest links, one WebSite JSON-LD, no Host echo. `e2e/homepage-seo` (dev profile, headed Chromium): 26 passed, 7 skipped (profile-only), covering tasks 01, 02 and 03 as feature regression. Headed walkthrough at 1280, 768 and 375 px: 10/10 steps, no horizontal scroll, visible focus outline, 404 has no canonical or `og:url`, no console or page errors, no failed requests, hydrated DOM equals raw HTML (3.6). Evidence lives in the tester's session scratchpad (`curl/home.html`, `evidence/homepage-seo-dev.xml`, `walk/walkthrough.json`, `walk/*.png`, `evidence/pytest-screenshots/US-3.6_dev_hydrated_home.png`) plus `e2e/homepage-seo/screenshots/US-3.6_dev_hydrated_home.png`.

**Still open:** the prod-like, unset and bad-url profile scenarios (US-homepage-seo-2.1, 2.2, 3.1, 3.3, 3.4, 3.5, 5.1) cannot run on dev and are BLOCKED there (they pass locally against the built Worker); the link preview tool check was not run. Both belong with [task 04](04-e2e-homepage-seo.md). Tester observation outside this task: the 404 page is unstyled plain text.

**Fix cycles:** 0.
