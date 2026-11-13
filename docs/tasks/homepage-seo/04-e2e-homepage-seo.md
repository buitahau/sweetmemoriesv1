# 04 E2E suite for homepage-seo

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** 03
**Feature spec:** [homepage-seo](../../features/homepage-seo.md)
**Mockup:** none

## What to change

`e2e/homepage-seo/` with one test per scenario of US-homepage-seo-1 to US-homepage-seo-5, parsing raw HTML (no JavaScript).

## Checklist

- [ ] Production-only assertions (`index, follow`, `sweetmemories.com` URLs) run only when `E2E_EXPECT_INDEXABLE=true`, otherwise skipped with a reason; noindex and `SITE_URL` behaviour asserted against the target's own origin
- [ ] US-homepage-seo-3.4 (missing `SITE_URL`) covered by task 03 unit tests and marked skip in e2e, because it needs a different config

## Verification

- [ ] `pytest e2e/homepage-seo` passes locally and against dev.
- [ ] Each scenario ID appears in a test name.
