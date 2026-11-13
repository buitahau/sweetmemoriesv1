# 02 Page shell: header, nav, section anchors and footer

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** 00, 01
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** [Landing2.dc.html](../../ui/Homepage/light%20pink/Landing2.dc.html) (header, footer)

## What to change

Rewrite `HomePage` as a composition of section components, one file per section under `src/components/home/`.

## Checklist

- [ ] Header with the logo (link to `/`) and `nav aria-label="Main"`: anchors `#who`, `#how`, `#templates`, plus a Sign in link to the Q-cta target
- [ ] Footer with the logo and tagline
- [ ] Empty section placeholders with the right ids
- [ ] Mobile header per the Q-mobile answer

## Verification

- [ ] Vitest (`renderToStaticMarkup`): a nav named "Main" contains the four links with hrefs `#who`, `#how`, `#templates` and `/sign-in`, and the footer text is present.
- [ ] Manual: Tab order runs from the logo through the nav links, with visible focus.
- [ ] Covers US-homepage-2 scenarios 1 to 5 and US-homepage-8 scenario 2.
