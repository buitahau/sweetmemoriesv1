# 07 Moments worth keeping and Addresses sections

**Status:** done
**Side:** front-end
**Size:** S
**Dependencies:** 02
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (MOMENTS, ADDRESSES)

## What to change

Two sections, both plain text with no links.

## Checklist

- [x] Moments: an `h2`, the subtitle and 8 tilted chips as plain text
- [x] Addresses: an `h2`, the intro and a `ul` of 4 rows, each with an `aria-hidden` icon, the URL as plain text (pinned example subdomain) and a description
- [x] Hover tint on the address rows

## Verification

- [x] Vitest: 8 moment chips in order, 4 address rows with the exact pinned URLs, and no `<a>` in either section.
- [x] Vitest: "Bob's first day", "Nana's recipes", "Your family's home page." and "A memory page about Bob's first day." use the straight `'` exactly as pinned in the spec Copy subsection.
- [x] Covers US-homepage-6 and US-homepage-7.
