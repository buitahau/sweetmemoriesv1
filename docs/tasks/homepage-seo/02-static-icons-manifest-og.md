# 02 Static icons, manifest and OG image in `public/`

**Status:** in progress
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
- [ ] Covers US-homepage-seo-4 scenarios 2 to 4 and US-homepage-seo-2 scenario 3.

## Notes

- **Asset 404s:** not reproducible on this branch (cut from `dev-v2` at `bbcf39d`). After `pnpm build && pnpm start`, every `href`/`src` in the HTML of `/` (CSS, JS, Fredoka woff2, `favicon.svg`) answers `200`. `assets.directory` resolves to `.output/public` with `-c wrangler.jsonc`. The remaining items of homepage task 13 (layout and animation checks) are untouched.
- **`favicon.svg`:** it was the orange hero heart. Replaced with the mockup `<helmet>` icon (white heart on a `#FF8FAB` rounded square, as the header logo). The PNG and ICO icons are rendered from it; `apple-touch-icon.png` is full-bleed (iOS rounds corners). Root head link unchanged.
- **`_headers`:** Nitro's `cloudflare-module` preset does not overwrite it: it prepends our file and appends its own `/assets/*` (`max-age=31536000, immutable`) rule, unless the file has a `/* ` rule (the unit test forbids one). Icons and `og/` cache for a week (`public, max-age=604800`): names are not hashed and the files are placeholders (Q-assets). `site.webmanifest` caches for an hour. No `Content-Type` override: the default is already `application/manifest+json`; `favicon.ico` is `image/vnd.microsoft.icon`.
- **Unit tests:** `src/public-assets.test.ts`.
