# 06 Templates section with Block chips

**Status:** done
**Side:** front-end
**Size:** S
**Dependencies:** 02
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (TEMPLATES)

## What to change

`section#templates` with an `h2`, the intro, three static illustrative Template cards and the "Made from building blocks" chip row with the pinned Block names. Nothing in the section is a link and it loads no data (rule 4).

## Checklist

- [x] Each card has decorative mini-page art, an `h3` name, the pinned description and "N blocks"
- [x] Chip row with the pinned Block names

## Verification

- [x] Vitest: the three card names and counts (3, 4, 8) render, the chip list equals the pinned Block names, and the section contains no `<a>` elements.
- [x] Covers US-homepage-5 scenarios 1 to 3. Scenario 4 holds by construction (no data source); e2e asserts it once Templates exist.
