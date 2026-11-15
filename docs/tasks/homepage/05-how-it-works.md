# 05 How it works section

**Status:** in progress
**Side:** front-end
**Size:** S
**Dependencies:** 02
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (HOW IT WORKS)

## What to change

`section#how` with an `h2` and an `ol` of four steps.

## Checklist

- [x] Each step has a decorative number badge (`aria-hidden`, coloured as in the mockup), an `h3` title and text

## Verification

- [x] Vitest: the `ol` has 4 `li` with titles in the order of US-homepage-4 scenario 1.
- [x] The `#how` anchor scroll lands on the heading: automated by e2e `test_US_homepage_1_4_see_how_it_works` (hero CTA) and `test_US_homepage_2_2_anchor_links[how]` (header link).
- [x] Covers US-homepage-4.
