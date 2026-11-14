# 12 E2E suite for homepage

**Status:** todo
**Side:** front-end
**Size:** M
**Dependencies:** 00, 02 to 11
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** none

## What to change

`e2e/homepage/test_homepage.py` (single feature file; US-homepage-8.4 already lives there, do not duplicate) with one test per scenario of US-homepage-1 to US-homepage-10, each named by its story ID (see the `e2e-from-user-stories` skill).

## Checklist

- [ ] No-cookie, same-origin-requests-only and console-clean (no errors, no hydration warnings) checks
- [ ] Viewport checks (375 and 768) and reduced-motion check (`page.emulate_media(reduced_motion="reduce")`)
- [ ] axe check
- [ ] US-homepage-8.3 assertions: email regex, env values and names, git SHA, package version, `SITE_URL` only in head URL tags, name allow-list
- [ ] US-homepage-10.3: under reduced motion, `h1`, "Start with Google" and every `h2` have computed opacity 1
- [ ] US-homepage-5.4 marked skip, with a reason, until Templates exist

## Verification

- [ ] `pytest e2e/homepage` passes locally (`pnpm build && pnpm start`) and against dev through `E2E_BASE_URL`.
- [ ] Every scenario ID appears in a test name.
