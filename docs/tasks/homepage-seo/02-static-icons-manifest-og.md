# 02 Static icons, manifest and OG image in `public/`

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** Q-assets answered
**Feature spec:** [homepage-seo](../../features/homepage-seo.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (logo SVG and `<helmet>` asset references)

## What to change

Mostly build configuration, no Worker code. Vite and Nitro copy `public/` into `.output/public`, which the Worker serves through the existing `assets` binding. Static assets never set cookies.

## Checklist

- [ ] Create `public/` at the repo root
- [ ] `favicon.svg` (the heart logo from the mockup)
- [ ] `favicon.ico`
- [ ] `favicon-32.png`
- [ ] `apple-touch-icon.png` (180×180)
- [ ] `site.webmanifest` (`name`, `short_name`, `theme_color` `#FFB6C8`, `background_color`, `icons`)
- [ ] `og/home.png` (1200×630)
- [ ] `public/_headers` with long-lived `Cache-Control` for icons and `og/`, a shorter one for `site.webmanifest`, and a `Content-Type: application/manifest+json` override only if the default type is wrong

## Verification

- [ ] Vitest: `public/site.webmanifest` parses as JSON with the expected `name`, `theme_color` and a 180 px icon entry.
- [ ] Manual: after `pnpm build` the files are in `.output/public`. Under `pnpm start`, `curl -I` on each asset returns `200`, the right content type, the `_headers` cache value and no `Set-Cookie`.
- [ ] The OG image opens at 1200×630.
- [ ] Covers US-homepage-seo-4 scenarios 2 to 4 and US-homepage-seo-2 scenario 3.
