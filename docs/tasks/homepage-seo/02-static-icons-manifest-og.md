# 02 Static icons, manifest and OG image in `public/`

**Status:** done
**Side:** backend
**Size:** S
**Dependencies:** Q-assets answered; [homepage task 13](../homepage/13-fix-e2e-homepage-failures-under-wrangler-dev.md) (asset 404s under `wrangler dev`) fixed, or its root cause fixed here
**Feature spec:** [homepage-seo](../../features/homepage-seo.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (logo SVG and `<helmet>` asset references)

## What to change

Mostly static files, no Worker code. `public/` already exists with `favicon.svg`, linked from the root route head (`src/routes/__root.tsx`). Vite and Nitro copy `public/` into `.output/public`, which the Worker serves through the existing `assets` binding. Static assets never set cookies. Assets are placeholders exported from the mockup (Q-assets).

Under `pnpm build && pnpm start` the font and favicon already 404 (homepage task 13). Unless task 13 has fixed it, find the cause first: check that `assets.directory` (`.output/public`) resolves when wrangler runs with `-c wrangler.jsonc`, and that Nitro's output holds the files.

## Checklist

- [x] Confirm the asset 404s under `pnpm start` are fixed (homepage task 13, or here)
- [x] Check the existing `public/favicon.svg` is the heart logo from the mockup; keep its link in the root head (it serves every page), and add the other icon links only on `/` (task 03)
- [x] `favicon.ico`
- [x] `favicon-32.png` (32×32)
- [x] `apple-touch-icon.png` (180×180)
- [x] `site.webmanifest` (`name`, `short_name`, `theme_color` `#FFB6C8`, `background_color`, `icons`)
- [x] `og/home.png` (1200×630), showing what the agreed alt text says: a SweetMemories page called Bob's first day, with photos and a smiling sun
- [x] `public/_headers` with long-lived `Cache-Control` for icons and `og/`, a shorter one for `site.webmanifest`, and a `Content-Type: application/manifest+json` override only if the default type is wrong
- [x] Check Nitro's `cloudflare-module` output does not ship or overwrite its own `_headers` in `.output/public`

## Verification

- [x] Vitest: `public/site.webmanifest` parses as JSON with the expected `name`, `theme_color` and a 180 px icon entry.
- [x] Vitest: read the PNG header (IHDR) dimensions: `og/home.png` is 1200×630, `favicon-32.png` is 32×32, `apple-touch-icon.png` is 180×180.
- [x] Manual: after `pnpm build` the files and our `_headers` are in `.output/public`. Under `pnpm start`, `curl -I` on each asset returns `200`, the right content type (`image/x-icon` or `image/vnd.microsoft.icon` for `favicon.ico`), the `_headers` cache value and no `Set-Cookie`.
- [x] Covers US-homepage-seo-4 scenarios 2 to 4 and US-homepage-seo-2 scenario 3.

## Notes

- **Asset 404s:** not reproducible on this branch (cut from `dev-v2` at `bbcf39d`). After `pnpm build && pnpm start`, every `href`/`src` in the HTML of `/` (CSS, JS, Fredoka woff2, `favicon.svg`) answers `200`. `assets.directory` resolves to `.output/public` with `-c wrangler.jsonc`. The remaining items of homepage task 13 (layout and animation checks) are untouched.
- **`favicon.svg`:** it was the orange hero heart. Replaced with the mockup `<helmet>` icon (white heart on a `#FF8FAB` rounded square, as the header logo). The PNG and ICO icons are rendered from it; `apple-touch-icon.png` is full-bleed (iOS rounds corners). Root head link unchanged.
- **`_headers`:** Nitro's `cloudflare-module` preset does not overwrite it: it prepends our file and appends its own `/assets/*` (`max-age=31536000, immutable`) rule, unless the file has a `/* ` rule (the unit test forbids one). Icons and `og/` cache for a week (`public, max-age=604800`): names are not hashed and the files are placeholders (Q-assets). `site.webmanifest` caches for an hour. No `Content-Type` override: the default is already `application/manifest+json`; `favicon.ico` is `image/vnd.microsoft.icon`.
- **Unit tests:** `src/public-assets.test.ts`.
- **E2E tests:** `e2e/homepage-seo/test_homepage_seo_task02_static_assets.py`, one test per scenario (US-homepage-seo-2.3, 4.2, 4.3, 4.4) plus `T02_V3` (each asset's `Cache-Control` equals `public/_headers`). The icon links on `/` come with task 03, so 4.2 fetches the asset paths the spec names.

## Summary

**Built:** placeholder static assets in `public/` exported from the mockup: `favicon.svg` (replaced with the mockup header logo: white heart on a `#FF8FAB` rounded square), `favicon.ico`, `favicon-32.png` (32×32), `apple-touch-icon.png` (180×180, full-bleed), `site.webmanifest` (`name` SweetMemories, `theme_color` `#FFB6C8`, 180 px icon) and `og/home.png` (1200×630). `public/_headers` sets `public, max-age=604800` for icons and `og/`, and `max-age=3600` for `site.webmanifest`; Nitro keeps it and appends its own `/assets/*` rule. No Worker code changes. Unit tests in `src/public-assets.test.ts` (manifest fields, PNG IHDR sizes, `_headers` rules). The asset 404s from homepage task 13 were not reproducible.

**PRs:** [#182](https://github.com/buitahau/sweetmemoriesv1/pull/182) (static icons, manifest, OG image and `_headers`).

**Test evidence (dev, attempt 1, PASS):** deploy-dev run 45937309318 on merge commit f7b582c. `pnpm test` 36 files / 427 passed, typecheck and lint clean. Curl on dev: `/favicon.svg`, `/favicon-32.png`, `/apple-touch-icon.png`, `/og/home.png` 200 with the right type and `public, max-age=604800`; `/site.webmanifest` 200 `application/manifest+json`, `max-age=3600`; `/favicon.ico` 200 `image/vnd.microsoft.icon`; `/_headers` 404 (build-time file, expected); no Set-Cookie on any asset; `/api/health` 200. e2e `e2e/homepage-seo/test_homepage_seo_task02_static_assets.py` against dev (headed Chromium): 5/5 passed. Feature regression `e2e/homepage-seo`: 16 passed, 1 skipped (T01_V3c BLOCKED until task 03). Evidence lives in the tester's session scratchpad (`task02-pytest.log`, `homepage-seo-feature-pytest.log`, `evidence/US-homepage-seo-2.3-og-image.png`, `evidence/T01-V3a_home.png`), not in the repo.

**Still open:** the icon links on `/` come with [task 03](03-home-head-tags.md). Tester observation outside this task: the "home" word highlight on the home page at 1280 px looks slightly offset (homepage feature).

**Fix cycles:** 0.
