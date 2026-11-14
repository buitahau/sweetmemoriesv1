# 03 Hero section with collage

**Status:** done
**Side:** front-end
**Size:** M
**Dependencies:** 02
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (HERO)

## What to change

Build the hero. Must land in the same PR as [11](11-retire-skeleton-heading.md).

## Checklist

- [x] Eyebrow and an `h1` with "home" highlighted, then the sub copy
- [x] "Start with Google" (to the Q-cta target) and "See how it works" (to `#how`), with the reassurance line below
- [x] Faces row and its caption (pinned copy)
- [x] Collage: decorative blobs, sun, cloud, heart and star (all `aria-hidden`), the mini Memory page card with the plain-text example address, and the floating note
- [x] Rise, pop and highlight entrance animations

## Verification

- [x] Vitest: exactly one `h1` with "Every little moment deserves a home.", the CTA href is `/sign-in`, the "See how it works" href is `#how`, and the address text is not inside an `<a>`.
- [ ] Manual: side by side with the mockup at 1440 px, layout and colours match. Not performed yet (needs a human visual check).
- [x] Vitest: apostrophe strings ("Bob's first day") use the straight `'` exactly as pinned in the spec Copy subsection.
- [x] Covers US-homepage-1 scenarios 1 to 6. Scenario 1.4 is only partly verified (the `#how` hash is checked; the heading check is BLOCKED until task 05 ships it). US-homepage-1 has no failure-path scenario.
