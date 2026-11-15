# 04 Who it is for section

**Status:** in review
**Side:** front-end
**Size:** S
**Dependencies:** 02
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (WHO IT IS FOR)

## What to change

`section#who` with an `h2`, the intro and three `article` cards, using the pinned copy.

## Checklist

- [x] Each card has an `h3` title, text, an example label and decorative faces (`aria-hidden`) with a hover bob

## Verification

- [x] Vitest: three `h3` titles in order with their example labels, and the face SVGs carry `aria-hidden="true"`.
- [ ] Manual: the card hover lift works and is off under reduced motion.
- [x] Vitest: "Grandpa's garden" uses the straight `'` exactly as pinned in the spec Copy subsection.
- [x] Covers US-homepage-3.
