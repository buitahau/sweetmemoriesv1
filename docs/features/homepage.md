# Feature: homepage

**Status:** done
**Side:** front-end. The static page, its sections and the `/sign-in` placeholder route. No backend work: no data, no API, no session.
**Mockup:** [Landing2.dc.html](../ui/Homepage/light%20pink/Landing2.dc.html) (folder kept as-is; moving it to `docs/ui/homepage/` is optional and not part of this work)

Tasks: [../tasks/homepage/](../tasks/homepage/) (00 to 12). ADR: [0005](../adr/0005-self-host-web-fonts.md). Open questions: [../decisions/homepage-feature.md](../decisions/homepage-feature.md), [../decisions/homepage-adr.md](../decisions/homepage-adr.md). Related: [homepage-seo](homepage-seo.md).

## Goal

A visitor who lands on `/` understands what SweetMemories is, how it works and how to start, in the light pink design.

## Summary and assumptions

Replace the skeleton placeholder at `/` (today a single `<h1>` "SweetMemories home page" in `src/components/home-page.tsx`) with the marketing landing page from the mockup: header (logo, nav: Who it is for, How it works, Templates, Sign in), hero ("Every little moment deserves a home.", Start with Google CTA, decorative collage), Who it is for (3 cards), How it works (4 steps), Templates (3 cards plus Block chips), Moments worth keeping (8 chips), Addresses (4 example URLs), final CTA and footer.

This is the product home page on the main domain: `sweetmemories.com`, `localhost:3000` locally and `sweetmemories-dev.haubuitatmp.workers.dev` on dev. It is not a User's subdomain home page (`sam.sweetmemories.com`), which is a separate feature; [project-skeleton](project-skeleton.md) already says the two stay separate.

- All content is static marketing copy in the component. No database, no session lookup, no live Templates. Template cards and Block chips are illustrations, not real Templates.
- Server-rendered, no cookies, no third-party requests (same baseline as US-skeleton-2).
- Better Auth does not exist yet, so "Sign in" and "Start with Google" cannot start a real sign-in. Recommended: both link to `/sign-in`, which the auth feature takes over later (Q-cta).
- The mockup's inline `style` values are rebuilt as Tailwind v4 theme tokens and utilities in `src/styles.css`. The mockup runtime (`support.js`, `vendor/`) is not reused.
- E2E tests go in `e2e/homepage/`, following the `e2e-from-user-stories` convention.

## Conflicts found (need a decision)

1. **Collaboration copy vs domain model (Q-copy).** The copy promises shared editing ("everyone you love can open, share and add to", "Invite people in and let everyone add a piece", "Grandma just added a photo", "Grandma, Mum and 12 cousins added photos", "A page the whole street can add to"). A Memory is owned by one User and no contributor or invite feature exists.
2. **Block chips vs built-in Block types (Q-blocks).** The mockup lists Text, Carousel, Gallery, Timeline, "Curved timeline" and "Before and after". The built-in types are Text, Timeline, Gallery, Carousel and 3×3 Photo Grid.
3. **Template copy (Q-templates).** "An adventure" mentions "a video", but no video Block exists.
4. **Example subdomain `sam` (Q-example).** If a real User later claims `sam`, a link to `sam.sweetmemories.com` would send visitors to that person's real pages.
5. **Older specs, tests and docs assert the old heading "SweetMemories home page"** and break once the new page lands: `src/components/home-page.test.tsx`, `e2e/project-skeleton/test_project_skeleton.py` (`HEADING`, line 12), `e2e/dev-deploy/test_dev_deploy.py` (`HEADING`, line 34), `docs/features/project-skeleton.md`, `docs/features/dev-deploy.md` line 30, `docs/infra/local-development.md` line 36. Historical task files keep the old text on purpose. Handled by task [H11](../tasks/homepage/11-retire-skeleton-heading.md).
6. **Mobile layout (Q-mobile).** The mockup is a 1440 px desktop artboard only.
7. **Missing assets (Q-assets).** See [homepage-seo](homepage-seo.md).

All conflicts above are answered (see [homepage-feature](../decisions/homepage-feature.md)). The final strings are pinned in the scenarios and in the [Copy](#copy) subsection.

## Copy

Final strings, pinned from the answered questions in [homepage-feature](../decisions/homepage-feature.md). Tasks 03 to 08 implement from this list; everything not listed here is unchanged from the mockup.

**Apostrophe (typography).** Every apostrophe in rendered page text and in the strings below is the straight ASCII apostrophe `'` (U+0027), never the curly `’` (U+2019). This covers "Bob's first day" (hero collage and chip and the address description "A memory page about Bob's first day."), "Grandpa's garden", "Nana's recipes" and "Your family's home page." The mockup's curly `’` in "Grandpa’s garden" is replaced with `'` when ported. Unit and e2e tests match these exact strings without normalising. Static `<meta>` and image alt text follow the same rule. The page must not promise shared editing: no visitor can add to another User's Memory (Q-copy).

**Hero**
- Pill: "For families, little ones and whole neighborhoods"
- Sub-copy (owner-only): "Turn first steps, birthdays and street parties into tiny pages that everyone you love can open and share."
- Reassurance: "No password to make. It is free to look around."
- Faces caption (replaces the fake social proof "Grandma, Mum and 12 cousins added photos"): "Made for the people you love to share with"
- Floating note (replaces "Grandma just added a photo"): small line "Your page is live", handwritten line "Share this link"
- Example collage: title "Bob's first day", address "sam.sweetmemories.com/bobs-first-day" (plain text)
- Both "Start with Google" links and "Sign in" go to `/sign-in`.

**Who it is for**
- Intro (owner-only): "One page can be about one child, one summer or one street. Make it once and share it with everyone you love."
- Families: "Grandparents, parents and cousins in one place. Everyone can see the photos and the stories behind them." Example "Grandpa's garden".
- Little ones: "First steps, first days and every birthday from one to ten. A scrapbook that grows up with them." Example "Mia, one to ten".
- Neighborhoods and friends: "A street party, a class trip or a team season. Keep the day and share it with everyone who was there." Example "Maple Street party".

**Templates** (static illustrations, Q-templates)
- "One small moment" (3 blocks): "A title, a few words and one photo. The simplest way to keep something."
- "Growing up: ages 1 to 10" (4 blocks): "A year-by-year album. One page for each birthday, from one to ten."
- "An adventure" (8 blocks): "A trip or an outing told in moments, with a route and the best photos." (no video)
- Block chips under "Made from building blocks", in order: "Text", "Timeline", "Gallery", "Carousel", "3×3 Photo Grid".

**Addresses** (plain text, Q-example)
1. "sam.sweetmemories.com": "Your family's home page. It lists everything you publish."
2. "sam.sweetmemories.com/bob": "A memory page about Bob."
3. "sam.sweetmemories.com/first-day-of-bob": "A memory page about Bob's first day."
4. "sam.sweetmemories.com/maple-street-party": "A page the whole street can open." (replaces "A page the whole street can add to.")

**Final CTA**: "Start with the memory everyone keeps telling." and "It takes a template, a few photos and a few cozy minutes."

**Meta description** (also `og:description`, `twitter:description` and the JSON-LD description, see [homepage-seo](homepage-seo.md)): "Turn first steps, birthdays and street parties into tiny pages your family and friends can open and share. Free to start with Google."

**Mobile header** (Q-mobile): below 768 px only the logo and "Sign in" show.

The strings "add to", "Invite people", "just added a photo" and "12 cousins" must not appear anywhere in the rendered HTML, head included (US-homepage-8.4). The pinned strings above are checked as present by US-homepage-8.5.

## Scope

**In scope**
- `/` rebuilt from the mockup: header, hero, Who it is for, How it works, Templates, Moments worth keeping, Addresses, final CTA and footer.
- Design tokens, self-hosted fonts and animations with reduced-motion support (ADR 0005).
- Responsive layout for 375 px and 768 px, following the Q-mobile answer.
- The `/sign-in` placeholder route (if Q-cta is answered "placeholder").
- Updating older specs, tests and docs that assert the old heading (Conflict 5).
- E2E suite `e2e/homepage/`.

**Out of scope**
- Real Google sign-in and any Better Auth code, session or cookie.
- Live Template data, Template previews or a Template gallery.
- Contributor, invite or collaboration features of any kind.
- The User subdomain home page and Memory pages.
- The reserved-subdomain and slug lists (belong to the subdomain feature; only recommended here).
- A mobile mockup from design.
- SEO and metadata (see [homepage-seo](homepage-seo.md)).
- Production environment setup, analytics and a cookie banner.
- Moving the mockup folder.

## User stories

**US-homepage-1: Hero and primary call to action**
- **Story:** As a visitor, I want the first screen to tell me what SweetMemories is and how to start, so that I can decide in seconds whether to try it.
- **Scenarios:**
  1. *Happy path:* **Given** the app is running, **When** a visitor opens `/` at 1440×900 with no cookies, **Then** the status is `200`, the only `h1` reads "Every little moment deserves a home.", the text "Turn first steps, birthdays and street parties into tiny pages" is visible, and a link "Start with Google" and a link "See how it works" are visible without scrolling.
  2. *Reassurance line:* **Given** the visitor is on `/`, **When** the hero is shown, **Then** the text "No password to make." is visible below the buttons.
  3. *Example address*: **Given** the visitor is on `/`, **When** the hero collage is shown, **Then** it shows the title "Bob's first day" and the address text "sam.sweetmemories.com/bobs-first-day", and that address is not a link.
  4. *See how it works:* **Given** the visitor is on `/`, **When** they click "See how it works", **Then** the URL ends with `#how` and the heading "From a pile of photos to a page, in four easy steps." is in the viewport.
  5. *Start CTA*: **Given** the visitor is on `/`, **When** they click "Start with Google" in the hero, **Then** the browser navigates to `/sign-in`.
  6. *Server-rendered:* **Given** the app is running, **When** a client fetches `/` over plain HTTP (no JavaScript), **Then** the HTML, with tags stripped, contains "Every little moment deserves a home" and "Start with Google" (the hero wraps "home" in a highlight span).
  7. *Security, no cookies:* **Given** a fresh browser with no cookies, **When** the visitor opens `/` and scrolls to the bottom, **Then** no response has a `Set-Cookie` header and the browser holds no cookies for the site.
  8. *Security, no third parties:* **Given** a fresh browser, **When** the visitor opens `/` and the page finishes loading, **Then** every network request goes to the page's own origin. None goes to `fonts.googleapis.com`, `fonts.gstatic.com` or any other host.
  9. *Console clean:* **Given** the visitor opens `/`, **When** the page finishes loading, **Then** the browser console shows no errors and no hydration warnings.

**US-homepage-2: Header navigation**
- **Story:** As a visitor, I want a header with section links and Sign in, so that I can jump to what interests me or sign in.
- **Scenarios:**
  1. *Links present:* **Given** the visitor is on `/` at 1440 px wide, **When** the page loads, **Then** a navigation landmark named "Main" contains, in order, "Who it is for", "How it works", "Templates" and "Sign in".
  2. *Anchor links:* **Given** the visitor is on `/`, **When** they click "Who it is for", "How it works" or "Templates", **Then** the URL ends with `#who`, `#how` or `#templates` and the matching section heading is in the viewport.
  3. *Sign in*: **Given** the visitor is on `/`, **When** they click "Sign in", **Then** the browser navigates to `/sign-in`.
  4. *Logo:* **Given** the visitor is on `/#templates`, **When** they click the "SweetMemories" logo, **Then** the URL is `/` and the page is scrolled to the top.
  5. *Keyboard:* **Given** the visitor is on `/` using only the keyboard, **When** they press Tab from the top of the page, **Then** focus moves to the logo and then to each visible nav link in order, and every focused link shows a visible focus indicator.
  6. *Deep link:* **Given** a visitor opens `/#templates` directly, **When** the page loads, **Then** the heading "Start simple, or tell the whole story." is in the viewport.

**US-homepage-3: Who it is for**
- **Story:** As a visitor, I want to see who SweetMemories is for, so that I can tell whether it fits my family, child or neighborhood.
- **Scenarios:**
  1. *Happy path*: **Given** the visitor is on `/`, **When** they scroll to the section with `id="who"`, **Then** they see the heading "A little corner of the internet for everyone who loves each other." and exactly three cards, in order: "Families", "Little ones" and "Neighborhoods and friends".
  2. *Examples:* **Given** the section is visible, **When** the visitor reads the cards, **Then** each card shows its example label: "Grandpa's garden", "Mia, one to ten" and "Maple Street party".
  3. *Decorative faces hidden:* **Given** the section is visible, **When** a screen reader reads the cards, **Then** the face illustrations are not announced (they are `aria-hidden`).

**US-homepage-4: How it works**
- **Story:** As a visitor, I want to see the steps from sign-in to publish, so that I know what to expect.
- **Scenarios:**
  1. *Happy path:* **Given** the visitor is on `/`, **When** they view the section with `id="how"`, **Then** an ordered list shows four steps, in order: "Sign in with Google", "Choose a template", "Add photos and words", "Publish and share".
  2. *Matches product flow:* **Given** the steps are shown, **When** the visitor reads step 4, **Then** it says the Memory goes live at its own address and includes "Send the link to anyone.".
  3. *Semantics:* **Given** the section is rendered, **When** inspected with an accessibility tree, **Then** the steps are an `ol` with 4 `li` items, and the decorative step numbers are not read twice.

**US-homepage-5: Templates and Blocks**
- **Story:** As a visitor, I want to see example Templates and the Blocks they are built from, so that I understand how flexible a Memory page can be.
- **Scenarios:**
  1. *Happy path*: **Given** the visitor is on `/`, **When** they view the section with `id="templates"`, **Then** they see the heading "Start simple, or tell the whole story." and three Template cards: "One small moment" (3 blocks), "Growing up: ages 1 to 10" (4 blocks) and "An adventure" (8 blocks).
  2. *Block chips*: **Given** the section is visible, **When** the visitor reads "Made from building blocks", **Then** the chips list exactly "Text", "Timeline", "Gallery", "Carousel" and "3×3 Photo Grid", in that order. "Curved timeline" and "Before and after" do not appear.
  3. *Illustrative only:* **Given** the section is visible, **When** the visitor clicks a Template card, **Then** nothing navigates and no network request is made.
  4. *No unreviewed Templates (security):* **Given** the database contains a Template that is not approved, **When** the visitor opens `/`, **Then** that Template's name does not appear on the page.

**US-homepage-6: Moments worth keeping**
- **Story:** As a visitor, I want examples of Memories people make, so that I get ideas for my own.
- **Scenarios:**
  1. *Happy path:* **Given** the visitor is on `/`, **When** they view "Moments worth keeping", **Then** they see the subtitle "A few of the small pages you could make today." and eight chips: "Bob's first day", "Grandpa's garden", "Maple Street party", "Class of 3B", "Mia, one to ten", "The lake trip", "Nana's recipes" and "Our new puppy".
  2. *Not links:* **Given** the chips are visible, **When** the visitor clicks "Bob's first day", **Then** the URL does not change.

**US-homepage-7: Addresses**
- **Story:** As a visitor, I want to see what my addresses will look like, so that I understand the subdomain and Memory page URLs.
- **Scenarios:**
  1. *Happy path*: **Given** the visitor is on `/`, **When** they view the section "Your family name first, then a page for each memory.", **Then** a list shows four rows, in order: "sam.sweetmemories.com", "sam.sweetmemories.com/bob", "sam.sweetmemories.com/first-day-of-bob" and "sam.sweetmemories.com/maple-street-party", each with its description.
  2. *Example only:* **Given** the list is visible, **When** the visitor clicks the second address, **Then** the browser does not navigate. The addresses are plain text, not links.
  3. *Home page vs Memory page:* **Given** the list is visible, **When** the visitor reads the first row, **Then** its description says it is the family's home page listing everything published, and the other three rows describe Memory pages.

**US-homepage-8: Final CTA and footer**
- **Story:** As a visitor who scrolled to the end, I want a last invitation to start, so that I do not have to scroll back up.
- **Scenarios:**
  1. *Happy path*: **Given** the visitor scrolls to the bottom of `/`, **When** the final section is visible, **Then** they see "Start with the memory everyone keeps telling." and a "Start with Google" link that navigates to `/sign-in`.
  2. *Footer:* **Given** the visitor is at the bottom, **When** the footer is visible, **Then** it shows "SweetMemories" and "Small pages for the moments worth keeping." inside a `contentinfo` landmark.
  3. *No private data (rule 5):* **Given** the page is rendered, **When** the HTML of `/` is fetched and inspected, **Then** all of these hold: (a) no match for the email pattern `[\w.+-]+@[\w-]+\.[\w.-]+`; (b) the HTML contains none of the configured env values (`DATABASE_URL`, `NODE_ENV`, the secrets in `.env`), none of the variable names `DATABASE_URL` and `NODE_ENV`, no git SHA (the value of `git rev-parse HEAD` and its 7-character short form) and no `package.json` version string; `SITE_URL` may appear only as the origin inside the head tags specified by [homepage-seo](homepage-seo.md) (canonical, `og:url`, `og:image`, `twitter:image`, and the `url` of the one `script[type="application/ld+json"]`, which must equal `<SITE_URL>/`), never in the body; the test checks the `NODE_ENV` name only (its value is a common word) and the version only as `"x.y.z"` or `vx.y.z`; env values are checked when set in the runner env, `E2E_<NAME>` or `.env`; (c) capitalised-word allow-list: take the visible text of `<body>` (tags, `script` and `style` removed), split it into text nodes and into sentences (after `. `, `! `, `? `), and collect every word matching `\b[A-Z][a-z]+\b` (and the token `SweetMemories`) that is not the first word of its text node or sentence; every collected word must be in the pinned list: Sam, Bob, Mia, Grandpa, Nana, Grandma, Mum, SweetMemories, Google, Memory, Memories, Template, Templates, Block, Blocks, User, Photo, Grid, Street, Maple, Class, plus the words of the section titles and chip labels in the Copy subsection. The list is pinned here; a legitimate new word is added to this list in the same change that adds it to the page, so any other capitalised mid-sentence word (for example a real person's name) fails the test.
  4. *No unbuilt features promised:* **Given** the page is rendered, **When** the HTML of `/` is inspected, **Then** it contains none of "add to", "Invite people", "just added a photo" or "12 cousins", because visitors cannot yet add to another person's Memory.
  5. *Pinned copy present:* **Given** the page is rendered, **When** the visible text of `/` is read, **Then** each of these exact strings is present (straight apostrophes, no normalising), taken from the [Copy](#copy) subsection: (a) Hero: "For families, little ones and whole neighborhoods", "Made for the people you love to share with", "Your page is live" and "Share this link"; (b) Who it is for: "One page can be about one child, one summer or one street. Make it once and share it with everyone you love.", "Grandparents, parents and cousins in one place. Everyone can see the photos and the stories behind them.", "First steps, first days and every birthday from one to ten. A scrapbook that grows up with them." and "A street party, a class trip or a team season. Keep the day and share it with everyone who was there."; (c) Templates: the three Template descriptions ("A title, a few words and one photo. The simplest way to keep something.", "A year-by-year album. One page for each birthday, from one to ten.", "A trip or an outing told in moments, with a route and the best photos."); (d) Addresses: "Your family's home page. It lists everything you publish.", "A memory page about Bob.", "A memory page about Bob's first day." and "A page the whole street can open."; (e) Final CTA: "It takes a template, a few photos and a few cozy minutes.". This is the positive counterpart of scenario 4, so wording drift fails the suite whichever way it goes.

**US-homepage-9: Sign-in placeholder** (only if Q-cta is answered "placeholder")
- **Story:** As a visitor who clicks Sign in before Google sign-in exists, I want a clear message, so that I am not left on an error page.
- **Scenarios:**
  1. *Happy path:* **Given** auth is not built yet, **When** the visitor opens `/sign-in`, **Then** the status is `200`, the heading "Sign in" and the text "Google sign-in is coming soon." are shown, and a link "Back to home" returns to `/`.
  2. *No cookies:* **Given** a fresh browser, **When** the visitor opens `/sign-in`, **Then** no `Set-Cookie` header is sent and no request goes to `accounts.google.com`.
  3. *Not indexed:* **Given** any environment, **When** a client fetches `/sign-in`, **Then** the HTML has `<meta name="robots" content="noindex">`.

**US-homepage-10: Responsive, accessible and calm motion**
- **Story:** As a visitor on any device, or with motion sensitivity, I want the page to be readable and comfortable, so that I can use it without strain.
- **Scenarios:**
  1. *Mobile*: **Given** a 375×812 viewport, **When** the visitor opens `/`, **Then** there is no horizontal scrollbar, the `h1` and "Start with Google" are visible without scrolling, and the "Sign in" link is visible in the header. Below 768 px the three anchor links are hidden and the header shows only the logo and "Sign in"; at 768 px and wider all four nav items show.
  2. *Tablet:* **Given** a 768×1024 viewport, **When** the visitor scrolls the whole page, **Then** no text overlaps or is cut off, and all sections (hero to footer) are reachable.
  3. *Reduced motion:* **Given** the browser has `prefers-reduced-motion: reduce`, **When** the visitor opens `/`, **Then** no element has a running CSS animation or transition. For example, the hero sun does not spin and the cards do not float. Entrance animations must not leave content hidden: under reduced motion the `h1`, the "Start with Google" link and every section heading (`h2`) are visible, with computed `opacity` 1 and not `visibility: hidden`.
  4. *Headings:* **Given** the page is rendered, **When** headings are listed, **Then** there is exactly one `h1`, each section has one `h2`, and card titles are `h3`.
  5. *Decorative art:* **Given** the page is rendered, **When** it is read by a screen reader, **Then** decorative SVGs, blobs, sun, cloud, hearts and stars are not announced.
  6. *Accessibility audit:* **Given** the page is rendered, **When** checked with axe-core, **Then** there are no serious or critical violations, including colour contrast.

## Acceptance criteria

- `/` renders all sections of the mockup in order: header, hero, Who it is for, How it works, Templates, Moments worth keeping, Addresses, final CTA and footer. It is server-rendered and visually matches the mockup at 1440 px (colors, fonts, radii, shadows).
- There is exactly one `h1`, "Every little moment deserves a home.". The nav anchors `#who`, `#how` and `#templates` work. "Sign in" and both "Start with Google" links go to the Q-cta target (recommended `/sign-in`).
- Example addresses, Template cards, Block chips and moment chips are not links and load no data. No unapproved Template ever appears.
- `/` and `/sign-in` set no cookies and make no third-party requests. The console shows no errors and no hydration warnings.
- There is no horizontal scroll at 375 px. Reduced motion disables every animation. axe-core reports no serious or critical issues.
- Every scenario names its exact strings, taken from the Copy subsection, so e2e can be written without further questions.
- No spec, test or setup doc still requires the heading "SweetMemories home page" (project-skeleton, dev-deploy, local-development). The skeleton and dev-deploy cookie, 404, health and console checks still pass.

## Risks and security notes

- **Rule 1 (no cookies):** `/`, `/sign-in` and static assets set no cookies. When Better Auth arrives, its cookies must stay off the marketing page. Keep `/` free of session reads. E2E no-cookie checks protect this.
- **Third-party requests:** Google Fonts would leak visitor IPs and weaken a future CSP. ADR 0005 removes them; e2e asserts same-origin requests only.
- **Rule 4 (review queue):** the Templates section is static on purpose. If it is ever wired to live data, it must list only approved Templates (US-homepage-5.4).
- **Rule 5 (no private data):** only fictional examples (Sam, Bob, Mia). No User data, environment or version strings, or analytics IDs.
- **Rule 6 (slugs):** example subdomain and slugs (`bob`, `first-day-of-bob`, `maple-street-party`, `bobs-first-day`) are plain text, not links. Recommendation: reserve `sam` (or the Q-example pick) and app paths (`sign-in`, `api`, `admin`) in the reserved lists when the subdomain feature is built.
- **Misleading copy:** the collaboration wording and "12 cousins" describe features and usage that do not exist. Resolved by Q-copy: the page uses owner-only wording (see Copy).
- **Regression:** Task 02 (page shell) keeps the old "SweetMemories home page" `h1`. Task 03 (hero) removes it, so H11 (task 11) must land in the same PR as task 03, or CI and the dev smoke tests go red.
- Rules 2 and 3 are not touched: this page runs no admin-authored CSS or JS.

### Task 01 summary (design tokens, fonts, motion)

- **Built:** palette, radii and sticker shadow tokens in `src/styles.css`, self-hosted Fredoka 500/600/700, Caveat 500/700 and Figtree 400/500/600 (latin, ADR 0005), a Fredoka 700 font preload in the root head, `sm-*` keyframes and a global `prefers-reduced-motion: reduce` rule. PR: #97.
- **Test evidence (dev):** unit tests 118/118, lint, typecheck and build clean; `e2e/homepage` 9/9 and `e2e/project-skeleton` 12/12 on https://sweetmemories-dev.haubuitatmp.workers.dev. `/` returns 200 with no `Set-Cookie` and one preload link to the Fredoka 700 woff2 (200, `font/woff2`); no Google Fonts requests. Evidence: `e2e/homepage/test_homepage.py`.
- **Review note applied:** exact weights listed; the computed reduced-motion check on a real element moved to tasks 03 and 10.
- **Fix cycles:** 0.

### Task 02 summary (page shell)

- **Built:** `HomePage` composed of section components under `src/components/home/`: header with logo link and `nav aria-label="Main"` (`#who`, `#how`, `#templates`, Sign in to `/sign-in`), empty section placeholders with the right ids, footer with logo and tagline, mobile header hiding the anchor links and keeping Sign in. The old "SweetMemories home page" `h1` is kept until tasks 03 and 11. PR: #103.
- **Test evidence (dev):** unit tests 123/123, lint and typecheck clean; `e2e/homepage` 14 passed, 4 skipped (BLOCKED: US-2.2 x3 and 2.6 until tasks 04 to 06); `e2e/project-skeleton` 12/12; `e2e/dev-deploy` 22 passed, 9 skipped (gh 2.4.0 flag limits, live-only). `/` returns 200 with no `Set-Cookie`, all requests same origin. Mobile 375 has no horizontal scroll. Screenshots: `e2e/homepage/screenshots/US-homepage-2.1.png`, `US-homepage-2.5.png`, `US-homepage-8.2.png`; tester scratchpad `task02/mobile-375.png`, `task02/tablet-768.png`.
- **Open notes:** manual Tab-order check not done by hand (automated test covers it); at 768px "Who it is for", "How it works" and "Sign in" wrap to two lines, to review in task 10; `/sign-in` is 404 until task 09.
- **Fix cycles:** 0.

### Task 03 summary (hero)

- **Built:** hero section with eyebrow, single `h1` "Every little moment deserves a home" with the highlighted word, sub copy, "Start with Google" (`/sign-in`) and "See how it works" (`#how`) CTAs, reassurance line, faces row and caption, and the collage (decorative `aria-hidden` shapes, mini Memory page card with plain-text example address, floating note) with rise, pop and highlight animations. The skeleton heading was retired in the same change (task 11). PRs: #106, #107 (fix: hero layout on small screens, favicon, e2e guards).
- **Test evidence (dev):** unit tests 133/133 (Node 24), lint and typecheck clean; `e2e/homepage` 33 passed, 5 skipped (BLOCKED: US-2.2 x3, 2.6 deep-link heading, 1.4 heading check until tasks 04 to 06). `/` returns 200 with no `Set-Cookie`, one `h1`; reduced motion, 768 and 375 widths verified in a headed walkthrough. Evidence: `e2e/homepage/test_homepage.py`; tester scratchpad `evidence/homepage-e2e-dev-headed.log` and `walk/` screenshots (`s1-desktop-1440.png`, `mobile-375-fold.png`, `tablet-768-fold.png`, `rm-reduced-motion-1440.png`, `hl-*.png`).
- **Open notes:** side-by-side mockup check at 1440 not done (needs a human); the "Your page is live" collage card is clipped by 41 px at 320 px and leaves a 14 px right gutter at 375 px (suspected `min-w-[340px]` on the collage container), to fix in task 10; `/sign-in` is 404 until task 09; `e2e` 10.2 checks overlap only, not clipping or gutter.
- **Fix cycles:** 1.

### Task 04 summary (who it is for)

- **Built:** `section#who` with the `h2`, intro and three `article` cards (Families, Little ones, Neighborhoods and friends), each with an `h3`, text, an example label ("Grandpa's garden", "Mia, one to ten", "Maple Street party", straight apostrophe) and three decorative `aria-hidden` faces with a hover lift that is off under reduced motion. PRs: #109 (section), #110 (fix: disable card hover lift under reduced motion).
- **Test evidence (dev):** unit tests 140/140 (Node 24), lint and typecheck clean; US-homepage-3 e2e 4/4; `e2e/homepage` 38 passed, 4 skipped (BLOCKED: US-2.2 x2, 1.4, 2.6 until tasks 05 and 06). No horizontal scroll at 1440, 768 and 375; no console errors or failed requests. Evidence: `e2e/homepage/test_homepage.py`; tester scratchpad `walk/04-who-desktop.png`, `04-who-tablet.png`, `04-who-mobile.png`, `04-card-hover-desktop.png`, `walk/walk-result.json`.
- **Open notes:** at 768 px the cards lay out 2+1 with an empty slot beside the third card, to review in task 10.
- **Fix cycles:** 1.

### Task 05 summary (how it works)

- **Built:** `section#how` with the `h2` and an `ol` of four `li` steps (Sign in with Google, Choose a template, Add photos and words, Publish and share), each with a decorative `aria-hidden` number badge (#FFC93C, #FFB27A, #9ADBBB, #9CD0F5 from the mockup), an `h3` and text. The `#how` anchor works from the hero "See how it works" link and the header link. PR: #112.
- **Test evidence (dev):** unit tests 146/146 (Node 24), lint and typecheck clean; `e2e/homepage` 43 passed, 2 skipped (BLOCKED: US-2.2 templates anchor, 2.6 deep link, until task 06). No horizontal scroll at 1440, 768 and 375; no console errors or failed requests; badge colours exact. Evidence: `e2e/homepage/test_homepage.py`; tester scratchpad `walk/01-how-1440.png`, `walk/01b-how-section-1440.png`, `walk/04b-how-section-768.png`, `walk/05b-how-section-375.png`, `walk/results.json`, `homepage-run.log`.
- **Open notes:** US-homepage-5, 6, 7, 8.1, 8.3 and 9 have no e2e tests yet (later tasks). Tester used headed Playwright because Chrome tools were unavailable.
- **Fix cycles:** 0.

### Task 06 summary (templates)

- **Built:** `section#templates` with the `h2`, intro, three static illustrative Template cards (decorative mini-page art, `h3` name, description, "N blocks" with 3, 4 and 8) and the "Made from building blocks" chip row with the five pinned Block names. No anchors and no data loading in the section (rule 4). PR: #114.
- **Test evidence (dev):** unit tests 152/152 (Node 24), lint and typecheck clean; `e2e/homepage` 48 passed, 1 skipped (US-homepage-5.4, BLOCKED by construction: no Template storage yet); walkthrough 42/42 checks at 1440, 768 and 375 px, no horizontal scroll, no console errors or failed requests; regression `e2e/project-skeleton` 12 passed, `e2e/dev-deploy` 22 passed and 9 skipped (environment). Evidence: `e2e/homepage/screenshots/US-homepage-5_1_templates.png`, `e2e/homepage/screenshots/US-homepage-5_2_chips.png`; tester scratchpad `homepage-junit.xml`, `regression-junit2.xml`, `regression-run2.log`, `walkthrough/results.json`, `walkthrough/templates_1440.png`, `templates_768.png`, `templates_375.png`.
- **Open notes:** "Made from building blocks" is an `h3` in the section (spec does not forbid it). US-homepage-5.4 to be asserted once Templates exist. Tester used headed Playwright because Chrome tools were unavailable.
- **Fix cycles:** 0.

### Task 07 summary (moments and addresses)

- **Built:** `Moments worth keeping` section (`h2`, subtitle, 8 tilted plain-text chips) and `Addresses` section (`h2`, intro, `ul` of 4 rows with `aria-hidden` icons, plain-text pinned URLs and descriptions, hover tint). No anchors in either section. PR: #116.
- **Test evidence (dev):** unit tests 159/159 (Node 24), lint and typecheck clean; `e2e/homepage` 53 passed, 1 skipped (US-homepage-5.4, BLOCKED: no Template storage yet); regression `e2e/project-skeleton` 12/12. US-homepage-6 and 7 pass at 1440, 768 and 375 px; hover tint rgba(0,0,0,0) to rgb(255,244,247); no horizontal scroll, no console errors or failed requests. Evidence: `e2e/homepage/test_homepage.py`; tester scratchpad `t07/homepage-junit.xml`, `t07/skeleton-junit.xml`, `t07/walk/results.json`, `t07/walk/07-moments-{1440,768,375}.png`, `t07/walk/07-addresses-{1440,768,375}.png`, `t07/walk/07-addresses-hover-1440.png`, `t07/walk/07-full-{1440,768,375}.png`.
- **Open notes:** at 375 px long addresses wrap after the "/" (cosmetic, spec does not forbid it). `e2e/dev-deploy` and `e2e/dev-test-database` not re-run. Tester used a scripted headed Playwright walkthrough because Chrome tools were unavailable.
- **Fix cycles:** 0.

### Task 08 summary (final CTA)

- **Built:** final CTA band with the `h2` "Start with the memory everyone keeps telling.", the sub copy, a "Start with Google" link to `/sign-in` and `aria-hidden` decorative shapes, plus the footer with name and tagline. PR: #118.
- **Test evidence (dev):** unit tests 165/165 (Node 24), lint and typecheck clean; `e2e/homepage` 70 passed, 1 skipped (US-homepage-5.4, BLOCKED: no Template storage yet); walkthrough at 1440, 768 and 375 px with no horizontal scroll and a visible keyboard focus ring; curl on `/` shows no Set-Cookie, email pattern, env values or git SHA. Evidence: `e2e/homepage/screenshots/US-homepage-8.1.png`, `e2e/homepage/screenshots/US-homepage-8.2.png`; tester scratchpad `walk08/01-cta-desktop-1440.png`, `walk08/03-cta-focus-1440.png`, `walk08/04-footer-desktop-1440.png`, `walk08/06-cta-{768,375}.png`, `walk08/08-footer-{768,375}.png`, `walk08/results.json`, `evidence/homepage-e2e-dev-headed.log`.
- **Open notes:** `/sign-in` returns a bare 404 until task 09 builds the placeholder. CTA hover change not visible in the screenshot (shadow change unconfirmed). Full private-data scan (US-homepage-8.3) is automated in task 12. Tester used headed Playwright because Chrome tools were unavailable.
- **Fix cycles:** 0.

### Task 09 summary (`/sign-in` placeholder)

- **Built:** `/sign-in` placeholder route with the `h1` "Sign in", the text "Google sign-in is coming soon.", a "Back to home" link to `/` and a `noindex` robots meta. No auth code, no cookies. The header "Sign in" and the hero and final "Start with Google" links now land on it. PR: #120.
- **Test evidence (dev):** unit tests 170/170 (Node 24), lint and typecheck clean; `e2e/homepage` plus `e2e/project-skeleton` 85 passed, 1 skipped (US-homepage-5.4, BLOCKED: no Template storage yet); all US-homepage-9.x pass; `e2e/dev-deploy` 22 passed, 9 skipped (BLOCKED by environment). curl on dev: `GET /sign-in` 200, no Set-Cookie, `noindex`; `/sign-in/` 307 to `/sign-in`. Walkthrough 20/20 at 1440, 768 and 375 px, no horizontal scroll, no console errors or failed requests. Evidence: `e2e/homepage/screenshots/us-homepage-9-1-sign-in.png`; tester scratchpad `walk09/results.json`, `walk09/02-signin-1440.png`, `walk09/03-signin-focus-1440.png`, `walk09/07-signin-{375,768}.png`, `evidence/homepage-skeleton-junit.xml`, `evidence/dev-deploy-junit.xml`.
- **Open notes:** `POST /sign-in` returns 200 with the page (route accepts any method; harmless, revisit when auth lands). The page looks plain (cosmetic). Hero heading gap ("home .") and a wide gap in the faces caption row belong to tasks 03 and 04.
- **Fix cycles:** 0.

### Task 10 summary (responsive layout, accessibility and reduced motion)

- **Built:** responsive pass for the homepage at 375 px and 768 px (one header row, hero collage stacks under the text, cards in one column), layout fixes down to 305 px, heading order and `aria-hidden` on decorative art, contrast and focus styles, and reduced-motion handling so no animation runs and the `h1`, "Start with Google" and every `h2` stay at opacity 1. PRs: #122, #124 (fix: 305 px header and collage layout, e2e coverage).
- **Test evidence (dev, run 43672643316 on a851ea3):** unit tests 213/213 (Node 24), lint and typecheck clean; task 10 e2e (`e2e/homepage/test_homepage_responsive_a11y.py`, including axe at 3 widths) 8 passed; `e2e/homepage` 89 passed, 1 skipped (US-homepage-5.4, BLOCKED: no Template storage yet); `e2e/project-skeleton` 12 passed. curl on dev: `/` and `/sign-in` 200 with no Set-Cookie, `/api/health` 200. Walkthrough 28/28 at 1440, 768, 375 and 305 px plus 375 reduced motion: no horizontal scroll, no console errors or failed requests. Evidence (tester scratchpad): `walk10/results.json`, `walk10/home-{1440,768,375,305}-top.png`, `walk10/home-375-focus.png`, `walk10/home-375-reduced-motion.png`, `evidence/task10-junit.xml`, `evidence/homepage-feature-junit.xml`, `evidence/skeleton-junit.xml`.
- **Open notes:** reduced-motion full-page screenshot too downscaled to read, so it relies on computed-style checks. `e2e/dev-deploy` not run (infrastructure). Tester used headed Playwright because Chrome tools were unavailable.
- **Fix cycles:** 2.

### Task 11 summary (retire the old "SweetMemories home page" heading)

- **Built:** the old skeleton heading assertions now use the new hero heading ("Every little moment deserves a home."): `e2e/project-skeleton`, `e2e/dev-deploy`, `src/components/home-page.test.tsx` (kept as a negative assertion), and the heading references in `docs/features/project-skeleton.md`, `docs/features/dev-deploy.md` and `docs/infra/local-development.md`. PR: #126.
- **Test evidence (dev, deploy-dev run 43674166962 on 1f820b3):** unit tests 213/213 (Node 24), lint and typecheck clean; `e2e/project-skeleton` plus `e2e/homepage` 101 passed, 1 skipped (US-homepage-5.4, BLOCKED: no Template storage yet); `e2e/dev-deploy` 22 passed, 9 skipped (BLOCKED by environment). curl on dev: `/api/health` 200, `/` 200 with no Set-Cookie. Walkthrough 26/26 at 1440, 768 and 375 px plus 404: one `h1` with the new heading, old text absent, no horizontal scroll, no console errors or failed requests, 404 shows "Page not found". Evidence (tester scratchpad): `t11/walk/results.json`, `t11/walk/home-{1440,768,375}.png`, `t11/walk/404-1440.png`, `t11/skeleton-homepage-junit.xml`, `t11/dev-deploy-junit-node24.xml`.
- **Open notes:** at 768 px the header nav wraps onto a second row beside the logo (not a task 11 concern). Tester used headed Playwright because Chrome tools were unavailable.
- **Fix cycles:** 0.

### Task 12 summary (e2e suite for the homepage)

- **Built:** `e2e/homepage/test_homepage.py` with one test per scenario of US-homepage-1 to 10, including no-cookie, console-clean, viewport, reduced-motion, axe, the US-homepage-8.3 private-data scan (JSON-LD `url` accepted when it equals `SITE_URL + "/"`) and US-homepage-8.5 pinned copy. US-homepage-5.4 is skipped with a reason until Templates exist.
- **Test evidence (dev):** `e2e/homepage` 90 passed, 1 skipped (US-homepage-5.4, BLOCKED: no Template storage yet), as run by the reviewer against dev. The local `pnpm build && pnpm start` run is still pending.
- **Open notes:** the git SHA is read from the local checkout, so against dev it may differ from the deployed commit. Env-value checks need `E2E_SITE_URL`, `E2E_DATABASE_URL` or a local `.env` to bite.
- **Fix cycles:** 1.

### Task 12 summary (e2e suite for homepage)

- **Built:** `e2e/homepage/test_homepage.py`, one test per scenario of US-homepage-1 to US-homepage-10 named by story ID: no-cookie, same-origin and console-clean checks, viewports 375 and 768, reduced motion, axe, US-homepage-8.3 and 8.5 copy assertions, US-homepage-10.3 opacity. US-homepage-5.4 is skipped with a reason until Template storage exists. PR: #128.
- **Test evidence (dev, deploy-dev run 43676194002 on a83b358):** unit tests 213/213 (Node 24), lint and typecheck clean; `e2e/homepage` 90 passed, 1 skipped (US-homepage-5.4, no Template storage yet). Walkthrough 38/38 at 1440, 768, 375 and reduced motion: no console errors, no failed requests, only dev host requests. Evidence (tester scratchpad): `logs/homepage-pytest.log`, `logs/homepage-junit.xml`, `logs/walkthrough.log`, `walkthrough.json`, `shots/01` to `17`; suite screenshots in the gitignored `e2e/homepage/screenshots`.
- **Open notes:** the hero "home" highlight looks partly filled in screenshots taken mid-animation at 768 and 375, and covers the word once settled. `/sign-in` is a bare placeholder. The local `pnpm build && pnpm start` run of the suite was not done. Tester used headed Playwright because Chrome tools were unavailable; curl skipped (front-end only).
- **Fix cycles:** 0.
