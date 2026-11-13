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
- [ ] Collaboration-sensitive copy pinned, in owner-only wording, for every string named in spec Conflict 1 and found in the mockup:
  - hero sub-copy ("...tiny pages that everyone you love can open, share and add to.", mockup line 108)
  - Who-it-is-for intro ("Invite people in and let everyone add a piece.", line 172) and card text
  - hero floating note ("Grandma just added a photo", line 160)
  - faces caption ("Grandma, Mum and 12 cousins added photos", line 121)
  - fourth Addresses row description ("A page the whole street can add to.", line 351, used in US-homepage-7.1)
  - meta description
- [ ] Pricing lines pinned
- [ ] Example subdomain strings pinned
- [ ] Mobile header behavior pinned
- [ ] CTA target pinned
- [ ] "Copy" subsection added to `docs/features/homepage.md`
- [ ] Answered questions marked answered and recorded in the ADRs or specs

## Verification

- [ ] No `[blocked` marker remains in either spec.
- [ ] Every scenario names concrete strings.
- [ ] The Copy subsection contains owner-only wording for each of the collaboration-sensitive strings above.
- [ ] US-homepage-8.4 (No unbuilt features promised) exists in the spec: the rendered HTML of `/` contains none of "add to", "Invite people", "just added a photo" or "12 cousins".
- [ ] A reviewer can turn US-homepage-5.2, 10.1 and US-homepage-seo-1.1 into assertions without asking anything.
