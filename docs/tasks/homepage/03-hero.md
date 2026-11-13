# 03 Hero section with collage

**Status:** todo
**Side:** front-end
**Size:** M
**Dependencies:** 02
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (HERO)

## What to change

Build the hero. Must land in the same PR as [11](11-retire-skeleton-heading.md).

## Checklist

- [ ] Eyebrow and an `h1` with "home" highlighted, then the sub copy
- [ ] "Start with Google" (to the Q-cta target) and "See how it works" (to `#how`), with the reassurance line below
- [ ] Faces row and its caption (pinned copy)
- [ ] Collage: decorative blobs, sun, cloud, heart and star (all `aria-hidden`), the mini Memory page card with the plain-text example address, and the floating note
- [ ] Rise, pop and highlight entrance animations

## Verification

- [ ] Vitest: exactly one `h1` with "Every little moment deserves a home.", the CTA href is `/sign-in`, the "See how it works" href is `#how`, and the address text is not inside an `<a>`.
- [ ] Manual: side by side with the mockup at 1440 px, layout and colours match.
- [ ] Covers US-homepage-1 scenarios 1 to 6.
