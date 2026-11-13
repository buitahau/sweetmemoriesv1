# 12 E2E suite for homepage

**Status:** todo
**Side:** front-end
**Size:** M
**Dependencies:** 00, 02 to 11
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** none

## What to change

`e2e/homepage/` with one test per scenario of US-homepage-1 to US-homepage-10, each named by its story ID (see the `e2e-from-user-stories` skill).

## Checklist

- [ ] No-cookie, same-origin-requests-only and console-clean (no errors, no hydration warnings) checks
- [ ] Viewport checks (375 and 768) and reduced-motion check (`page.emulate_media(reduced_motion="reduce")`)
- [ ] axe check
- [ ] US-homepage-5.4 marked skip, with a reason, until Templates exist

## Verification

- [ ] `pytest e2e/homepage` passes locally (`pnpm build && pnpm start`) and against dev through `E2E_BASE_URL`.
- [ ] Every scenario ID appears in a test name.
