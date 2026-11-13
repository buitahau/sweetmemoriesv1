# 01 Design tokens, self-hosted fonts, font preload and motion base

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** ADR 0005 accepted
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (`<helmet><style>` block)

## What to change

Rebuild the mockup's inline styles as Tailwind v4 tokens in `src/styles.css` and self-host the fonts ([ADR 0005](../../adr/0005-self-host-web-fonts.md)).

## Checklist

- [ ] Add the mockup palette as `@theme` tokens in `src/styles.css`: pinks, ink `#3B2433`, link `#B0285A`/`#8C1F48` and the card pastels
- [ ] Add radii and the offset "sticker" shadows as tokens
- [ ] Add `@fontsource` Fredoka, Caveat and Figtree (latin subset, used weights only) as `font-display`, `font-hand` and `font-body` tokens
- [ ] Add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the Fredoka 700 latin file in the root head, importing the URL through Vite (`?url`)
- [ ] Add the `sm-*` keyframes as named animations
- [ ] Add a global `prefers-reduced-motion: reduce` rule that turns off animations and transitions

## Verification

- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm build` pass.
- [ ] Manual on `pnpm dev`: the network tab shows font files from the same origin only, no Google Fonts requests.
- [ ] `curl -s localhost:3000/` contains one font preload link, and its href returns `200` with `font/woff2`.
- [ ] With reduced motion emulated, the computed `animation-name` is `none` on an animated element.
