# 00 Record the answers and pin the exact copy in the stories

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** answers to Q-cta, Q-copy, Q-blocks, Q-templates, Q-mobile, Q-pricing and Q-example, recorded in [homepage-feature](../../decisions/homepage-feature.md)
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** none

## What to change

Write every final string and behavior into the homepage and homepage-seo specs and remove the [blocked] markers. Also list the full final copy for each section in a "Copy" subsection of the homepage spec, so tasks 03 to 08 implement from one place.

## Checklist

- [ ] Block chip list pinned
- [ ] Template card descriptions pinned
- [ ] Collaboration-sensitive copy pinned (hero faces caption, Who it is for card text, meta description)
- [ ] Pricing lines pinned
- [ ] Example subdomain strings pinned
- [ ] Mobile header behavior pinned
- [ ] CTA target pinned
- [ ] "Copy" subsection added to `docs/features/homepage.md`
- [ ] Answered questions marked answered and recorded in the ADRs or specs; ADR 0005 and 0006 set to accepted

## Verification

- [ ] No `[blocked` marker remains in either spec.
- [ ] Every scenario names concrete strings.
- [ ] A reviewer can turn US-homepage-5.2, 10.1 and US-homepage-seo-1.1 into assertions without asking anything.
