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
- [ ] Manual: the `#how` anchor scroll lands on the heading (not yet run; check with `pnpm dev`, open `/#how` and click the header "How it works" link).
- [x] Covers US-homepage-4.
