# 10 Responsive layout, accessibility and reduced-motion pass

**Status:** done
**Side:** front-end
**Size:** M
**Dependencies:** 03 to 08
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (desktop only; mobile per Q-mobile)

## What to change

Make the page work at 375 px and 768 px and pass the accessibility checks.

## Checklist

- [x] Layouts for 375 px and 768 px: hero collage stacks under the text, cards go to one column, header follows the pinned mobile behavior
- [x] Check heading order and `aria-hidden` on all decorative art
- [x] Check contrast of pink text on pastel backgrounds and focus styles on buttons
- [x] Check that reduced motion disables every animation and that entrance animations never leave content hidden: the `h1`, "Start with Google" and every `h2` have opacity 1 under `prefers-reduced-motion: reduce`

## Verification

- [x] Manual at 375 px and 768 px: no horizontal scroll and no overlaps.
- [x] An axe DevTools run reports no serious or critical issues.
- [x] With reduced motion emulated, nothing moves and the `h1`, "Start with Google" and all section headings are visible (opacity 1).
- [x] Covers US-homepage-10 scenarios 1 to 6. Task 12 automates them.

## Evidence

Verified in a real browser on a dev server (review run):

- 375x812: scrollWidth equals clientWidth (375), no horizontal scroll; only "Sign in" in the nav. 768x1024: no overflow, all four nav items show.
- `prefers-reduced-motion: reduce`: `document.getAnimations()` reports 0 running animations (15 without); every `h1`/`h2` has computed opacity 1.
- axe-core at 1440, 375 and 768 px: 0 violations (only expected color-contrast "incomplete" items on gradients).
- Unit tests in `src/components/home-a11y.test.tsx` cover headings, aria-hidden, contrast, focus and reduced motion.
