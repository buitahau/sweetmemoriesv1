# 02 Page shell: header, nav, section anchors and footer

**Status:** done, verification partial (manual Tab-order check pending; e2e 2.2 and 2.6 BLOCKED until section tasks, 2.4 scroll check only when the page scrolls)
**Side:** front-end
**Size:** S
**Dependencies:** 00, 01
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (header, footer)

## What to change

Rewrite `HomePage` as a composition of section components, one file per section under `src/components/home/`.

## Checklist

- [x] Header with the logo (link to `/`) and `nav aria-label="Main"`: anchors `#who`, `#how`, `#templates`, plus a Sign in link to the Q-cta target
- [x] Footer with the logo and tagline
- [x] Empty section placeholders with the right ids
- [x] Keep the old "SweetMemories home page" `h1` unchanged: [03](03-hero.md) replaces it together with [11](11-retire-skeleton-heading.md) in one PR
- [x] Mobile header per the Q-mobile answer

## Verification

- [x] Vitest (`renderToStaticMarkup`): a nav named "Main" contains the four links with hrefs `#who`, `#how`, `#templates` and `/sign-in`, and the footer text is present.
- [ ] Manual: Tab order runs from the logo through the nav links, with visible focus. Pending: not yet run by hand; DOM order and focus ring are covered by `test_US_homepage_2_5_keyboard_tab_order_and_focus_ring` (screenshot `e2e/homepage/screenshots/US-homepage-2.5.png`).
- [x] Covers US-homepage-2 scenarios 1 to 5 and US-homepage-8 scenario 2. Scenario 2.2 and the scroll check of 2.4 are BLOCKED in e2e until the section tasks add content.
