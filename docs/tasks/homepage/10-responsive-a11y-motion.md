# 10 Responsive layout, accessibility and reduced-motion pass

**Status:** todo
**Side:** front-end
**Size:** M
**Dependencies:** 03 to 08
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (desktop only; mobile per Q-mobile)

## What to change

Make the page work at 375 px and 768 px and pass the accessibility checks.

## Checklist

- [ ] Layouts for 375 px and 768 px: hero collage stacks under the text, cards go to one column, header follows the pinned mobile behavior
- [ ] Check heading order and `aria-hidden` on all decorative art
- [ ] Check contrast of pink text on pastel backgrounds and focus styles on buttons
- [ ] Check that reduced motion disables every animation and that entrance animations never leave content hidden: the `h1`, "Start with Google" and every `h2` have opacity 1 under `prefers-reduced-motion: reduce`

## Verification

- [ ] Manual at 375 px and 768 px: no horizontal scroll and no overlaps.
- [ ] An axe DevTools run reports no serious or critical issues.
- [ ] With reduced motion emulated, nothing moves and the `h1`, "Start with Google" and all section headings are visible (opacity 1).
- [ ] Covers US-homepage-10 scenarios 1 to 6. Task 12 automates them.
