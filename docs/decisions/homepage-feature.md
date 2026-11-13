# Open questions: homepage and homepage-seo

Feature specs: [homepage](../features/homepage.md), [homepage-seo](../features/homepage-seo.md)

Once answered, task [H0](../tasks/homepage/00-pin-copy-from-decisions.md) pins the exact strings in the specs.

## Topic: homepage

### Q-cta: Auth does not exist yet. Where should "Sign in" and both "Start with Google" buttons go for now?

Options:
- A /sign-in placeholder page saying Google sign-in is coming soon
- Hide the buttons until Better Auth ships
- Point them at #how for now

Recommended answer: A /sign-in placeholder: the page matches the design today, and the auth feature only has to replace one route.

Answer: Agreed with the recommended answer (2026-11-14). Status: answered.

### Q-copy: The copy promises shared editing ("everyone you love can ... add to", "Invite people in and let everyone add a piece", "Grandma just added a photo", "Grandma, Mum and 12 cousins added photos", "A page the whole street can add to"), but a Memory has a single owner and no contributor feature exists. What should we do?

Options:
- Rewrite to owner-only wording (open and share, not add to)
- Keep the copy as a roadmap promise
- Remove only the collaboration lines and the fake social proof

Recommended answer: Rewrite to owner-only wording: the page must not promise a feature that does not exist. Restore the copy when contributors are built.

Answer: Agreed with the recommended answer (2026-11-14). Status: answered.

### Q-blocks: The "Made from building blocks" chips list Curved timeline and Before and after, and leave out 3x3 Photo Grid. Which Block names should be shown?

Options:
- Built-in types only: Text, Timeline, Gallery, Carousel, 3x3 Photo Grid
- Keep the mockup list as is
- Built-in types plus a "Custom blocks" chip

Recommended answer: Built-in types only: they match the domain model and what users can actually pick.

Answer: Agreed with the recommended answer (2026-11-14). Status: answered.

### Q-templates: The Template card "An adventure" mentions a video, but there is no video Block. Should the Template cards be static illustrations, and how should the wording change?

Options:
- Static illustrative cards, drop "a video" from the wording
- Static cards, keep the mockup wording
- Load real approved Templates from the database later

Recommended answer: Static illustrative cards without "a video": no Templates exist yet, static cards cannot leak unreviewed Templates, and the copy stays truthful.

Answer: Agreed with the recommended answer (2026-11-14). Status: answered.

### Q-mobile: The mockup is desktop only (1440 px). How should the header and sections behave on mobile?

Options:
- Stack sections; on mobile the header shows only the logo and Sign in (anchor links hidden)
- Add a hamburger menu with all nav links
- Wait for a mobile mockup from design

Recommended answer: Stack sections and show only logo and Sign in on mobile: the simplest layout that keeps the main action reachable, with no extra menu component.

Answer: Agreed with the recommended answer (2026-11-14). Status: answered.

### Q-pricing: Should we keep the pricing hints "It is free to look around" and "Free to start with Google" (in the meta description)?

Options:
- Keep both
- Keep "Free to start" only
- Remove all pricing wording

Recommended answer: Keep both: no paid plan exists, so the claims are accurate today. Revisit when pricing is defined.

Answer: Agreed with the recommended answer (2026-11-14). Status: answered.

### Q-example: The hero and Addresses section use the example subdomain "sam". Which example should the page use, and should it be reserved?

Options:
- Keep sam and reserve it (plus app paths like sign-in, api, admin) when the subdomain feature is built
- Keep sam without reserving it (examples are plain text)
- Switch to an obviously fake example such as example.sweetmemories.com

Recommended answer: Keep sam and reserve it with the app paths: the copy stays friendly as designed, and one list entry prevents a real User from appearing to own the marketing example.

Answer: Agreed with the recommended answer (2026-11-14). Status: answered.

## Topic: homepage-seo

### Q-assets: Who provides the OG image (1200x630) and the PNG/ICO icons (32 px, 180 px, favicon.ico) the mockup references?

Options:
- Design provides final assets
- We export them from the mockup (hero collage screenshot, heart logo) as placeholders now
- Ship without an OG image for now

Recommended answer: Export placeholders from the mockup now and swap in design assets later: the share preview works immediately and nothing blocks S2.

Answer: Agreed with the recommended answer (2026-11-14). Status: answered.
