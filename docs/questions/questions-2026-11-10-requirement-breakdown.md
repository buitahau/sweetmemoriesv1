# Questions: requirement-breakdown

Session 2026-11-10. Requirement: "Implement the Homepage page (public landing page of SweetMemories)" from the mockup in [docs/ui/Homepage/](../ui/Homepage/README.md). Design: [ADR 0003](../adr/0003-frontend-styling-and-self-hosted-fonts.md), features [web-design-foundation](../features/web-design-foundation.md) and [homepage](../features/homepage.md), UI spec [ui/homepage.md](../ui/homepage.md).

## Q001: Accept ADR 0003 (styling and self-hosted fonts)?

- Feature: web-design-foundation
- Status: answered
- Asked: 2026-11-10
- Blocks: nothing (answered). It used to block [add-self-hosted-fonts](../tasks/web-design-foundation/add-self-hosted-fonts.md), [add-design-tokens](../tasks/web-design-foundation/add-design-tokens.md) and [add-homepage-shell](../tasks/homepage/add-homepage-shell.md) and, through their prerequisites, homepage tasks 4-12; all are now `not-started`.

**Question**: The Homepage needs a styling approach and fonts, which no ADR covers yet. [ADR 0003](../adr/0003-frontend-styling-and-self-hosted-fonts.md) proposes plain CSS Modules with CSS custom-property tokens, and self-hosting the mockup's fonts (Fredoka, Caveat, Figtree) from npm (`@fontsource/*`, OFL-1.1) instead of the mockup's Google Fonts link. Google Fonts would send every visitor's IP address to Google and break the skeleton's "no request to another origin" guarantee. It adds three runtime dependencies to `apps/web` but does not change the stack in `CLAUDE.md`. All work stays frontend-only and adds no domain code.

**Options**
1. A: Accept ADR 0003 as written. (recommended)
2. B: Accept, but use Tailwind CSS instead of CSS Modules (new tool; values in the mockup are one-off and map poorly to a scale).
3. C: Use Google Fonts as in the mockup (simpler; third-party requests and privacy cost).

**Default if unanswered**: none for the gated tasks: like ADR 0001, accepting an architecture decision is the product owner's call, so the three tasks above stay `blocked` until ADR 0003 is `accepted`. Only add-home-content and add-home-illustrations (no styling choice) may start. If the answer is B or C, the foundation tasks and add-homepage-shell are rewritten before they are unblocked.

**Answer**: Option A, approved by the product owner 2026-11-10. Applied: [ADR 0003](../adr/0003-frontend-styling-and-self-hosted-fonts.md) is `accepted`; the design-gate notes in [web-design-foundation](../features/web-design-foundation.md), [homepage](../features/homepage.md), add-self-hosted-fonts, add-design-tokens and add-homepage-shell now read "Design gate: met"; those three tasks and the web-design-foundation feature changed from `blocked` to `not-started` (docs and both `Progress.md` boards). No task was rewritten (the B/C rewrites do not apply).

---

## Q002: Where do "Sign in" and "Start with Google" go before auth exists?

- Feature: homepage
- Status: open
- Asked: 2026-11-10
- Blocks: nothing, using default below

**Question**: The mockup links "Sign in" and both "Start with Google" buttons to `Dashboard.dc.html`. Sign-in (Better Auth, Google) and the dashboard are domain code and wait for design approval, so nothing exists to link to. On the public dev URL a visitor who clicks will see something.

**Options**
1. A: Link to `/sign-in` (one constant `SIGN_IN_HREF`); today that path shows the Homepage again through the SPA fallback; the auth work changes the constant. (recommended: real link, one-line change later)
2. B: Keep the buttons but show "Coming soon" text on click (needs a small dialog or toast, more UI not in the mockup).
3. C: Hide the three sign-in links until auth exists (page looks unlike the mockup).

**Default if unanswered**: Option A (`SIGN_IN_HREF = '/sign-in'`).

**Answer**: _(human fills in)_

---

## Q003: Homepage copy promises features that are not designed

- Feature: homepage
- Status: open
- Asked: 2026-11-10
- Blocks: nothing, using default below

**Question**: Several mockup texts describe features that the domain model in `CLAUDE.md`/`README.md` does not have: other people adding to a Memory ("pages that everyone you love can open, share and add to", "Invite people in and let everyone add a piece", "Grandma, Mum and 12 cousins added photos", "Grandma just added a photo", "A page the whole street can add to"); a video ("An adventure ... with a video"); block chips "Curved timeline" and "Before and after" (custom blocks, not built-in) while the built-in "3×3 Photo Grid" is missing. Only the owning User edits a Memory today. Shipping this copy may set wrong expectations once the page is public.

**Options**
1. A: Ship the mockup copy verbatim now (it is on the noindex dev site only), and review copy before production. (recommended for speed; all copy is in one file, `content.ts`)
2. B: Rewrite the collaborative and video lines now to match the current domain model (product owner supplies the new text).
3. C: Treat the copy as a requirement: collaboration (contributors) and a video block get added to the product backlog.

**Default if unanswered**: Option A; copy stays exactly as in the mockup.

**Answer**: _(human fills in)_

---

## Q004: Mobile layout for the Homepage

- Feature: homepage
- Status: open
- Asked: 2026-11-10
- Blocks: nothing, using default below

**Question**: The mockup is drawn at 1440 px only. Copied as-is, it overflows on phones (76 px heading, 340 px minimum collage, 300-320 px grid columns, 40 px gutters). [ui/homepage.md, Responsive rules](../ui/homepage.md#responsive-rules) sets default rules: at 767 px and narrower, 20 px gutters, `h1` 48 px, `h2` 34 px, section padding capped at 64 px, 40 px band corners; at 559 px and narrower the hero collage is hidden.

**Options**
1. A: Accept the default rules now; a designer may supply a mobile mockup later. (recommended)
2. B: Wait for a mobile mockup before building (blocks the feature).
3. C: Accept the rules but scale the collage down on phones instead of hiding it (more CSS work, keeps the visual).

**Default if unanswered**: Option A.

**Answer**: _(human fills in)_

---

## Q005: SEO, sharing tags and favicon for the Homepage

- Feature: homepage
- Status: open
- Asked: 2026-11-10
- Blocks: nothing, using default below

**Question**: The mockup defines no meta description, Open Graph/sharing image or favicon, and `index.html` keeps the skeleton's empty favicon. The dev site is `noindex` ([ADR 0002](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)), so SEO does not matter yet, but a shared link will show no preview.

**Options**
1. A: Leave out for now; add with the production requirement. (recommended)
2. B: Add a meta description and the logo as favicon now (product owner supplies the description text).

**Default if unanswered**: Option A.

**Answer**: _(human fills in)_

---

## Q006: Move the mockup folder to docs/ui/mockup/homepage/?

- Feature: homepage
- Status: open
- Asked: 2026-11-10
- Blocks: nothing, using default below

**Question**: The writing-docs skill places mockup exports under `docs/ui/mockup/` with kebab-case names. The Homepage mockup was supplied at `docs/ui/Homepage/` (capitalised, outside `mockup/`), and ADR 0003, the homepage feature, ui/homepage.md and several tasks link to files in it (`Landing2.dc.html`, `README.md`). Moving it is a pure doc change but touches every one of those links; leaving it records an exception to the convention.

**Options**
1. A: Keep `docs/ui/Homepage/` as supplied; the exception is noted in [ui/homepage.md](../ui/homepage.md). (recommended: no churn, path is user-supplied)
2. B: Move to `docs/ui/mockup/homepage/` and update every link in one doc-only change before implementation starts.

**Default if unanswered**: Option A.

**Answer**: _(human fills in)_

---

## Q007: Performance and weight budget for the Homepage

- Feature: homepage
- Status: open
- Asked: 2026-11-10
- Blocks: nothing, using default below

**Question**: No requirement states a performance or page-weight budget. The Homepage adds three self-hosted font families (8 weights, several unicode subsets each), 15 keyframe animations and inline SVGs. Without a budget, nothing stops the page from getting slow on phones, and no checklist item measures it.

**Options**
1. A: No budget for the dev site now; set one with the production requirement. (recommended: dev is `noindex`, and adding gates now would add checklist items for a value nobody chose)
2. B: Add a budget now, e.g. Lighthouse Performance >= 90 on `$DEV_WEB_URL/` at mobile settings and total `woff2` transferred on first load <= 200 KB, as new homepage checklist items.

**Default if unanswered**: Option A; no performance checklist item is added.

**Answer**: _(human fills in)_

---

## Q008: Visual fidelity tolerance for the Homepage

- Feature: homepage
- Status: open
- Asked: 2026-11-10
- Blocks: nothing, using default below

**Question**: Homepage AC2 and every section task's "matches the mockup side by side" item require positions and sizes to match the mockup at 1440 x 900, but no tolerance was stated (only line wraps had one). Without a number, two reviewers can pass and fail the same build. [ui/homepage.md, Checking fidelity](../ui/homepage.md#checking-fidelity) now uses a default: bounding boxes of headings, cards, panels and buttons within ±4 px; colors, radii, shadows and fonts exact; decorative illustration positions by eye. How strict should pixel fidelity be?

**Options**
1. A: ±4 px for layout boxes, colors and fonts exact. (recommended: absorbs font-rendering and sub-pixel differences, still catches wrong spacing values)
2. B: Exact (±0-1 px): strictest, but self-hosted fonts render slightly differently from the mockup's Google Fonts, so many false failures.
3. C: Looser (±8 px or "by eye"): fewer failures, but wrong spacing tokens can slip through.

**Default if unanswered**: Option A (±4 px, colors and fonts exact).

**Answer**: _(human fills in)_

---

## Q009: Accept ADR 0004 (Playwright e2e specs)?

- Feature: homepage
- Status: answered
- Asked: 2026-11-10
- Blocks: nothing

**Question**: [ADR 0004](../adr/0004-playwright-e2e-specs.md) proposes making Playwright specs a code deliverable of each frontend ticket: a separate `e2e/` project (not an npm workspace, so root scripts and CI are unaffected), authored by the `tester` from the ticket only, run against dev, not in CI. Authenticated and data-writing flows stay prose and Blocked until a test-sign-in ADR, a dev database with seed/reset and domain design approval exist. It adds one dev-only dependency (`@playwright/test`) outside the root install and does not change the application stack.

**Options**
1. A: Accept ADR 0004 as written. (recommended)
2. B: Accept, but also run the specs in CI against the dev deploy (needs Chrome in CI and a post-deploy job; changes the pipelines).
3. C: Reject; keep prose cases and `tools/browser-check` only.

**Default if unanswered**: Option A is used for the tester workflow, with the ADR still marked `proposed`; no pipeline changes.

**Answer**: A (recommended), approved by the product owner 2026-11-10. Applied in ADR 0004 (accepted).

---

## Q010: Record ADR 0003 and ADR 0004 approval in CLAUDE.md

- Feature: web-design-foundation (also gates [homepage](../features/homepage.md) and [e2e-specs](../features/e2e-specs.md))
- Status: open
- Asked: 2026-11-10
- Blocks: nothing, using default below

**Question**: `CLAUDE.md` "Project state" names only ADR 0001 and ADR 0002 as approved. ADR 0003 (styling, fonts, Homepage) and ADR 0004 (e2e specs) are both `accepted` (Q001 and Q009 answered A). The `implementer` agent confirms design approval before it starts; one that reads only `CLAUDE.md` may stop and report the Homepage tasks as blocked, although they are not domain code. `CLAUDE.md` is human-owned, so agents do not edit it.

**Options**
1. A: The product owner adds one sentence to "Project state", e.g. "Styling, fonts and Homepage approved ([ADR 0003](docs/adr/0003-frontend-styling-and-self-hosted-fonts.md)); Playwright e2e specs approved ([ADR 0004](docs/adr/0004-playwright-e2e-specs.md))." before [add-self-hosted-fonts](../tasks/web-design-foundation/add-self-hosted-fonts.md) starts. (recommended)
2. B: Leave `CLAUDE.md` as is; the caller states the approval each time it starts implement-ticket for these tasks.

**Default if unanswered**: B until the edit is made: the caller states "ADR 0003 and ADR 0004 are accepted" when it starts a task of web-design-foundation, homepage or e2e-specs.

**Answer**: _(human fills in)_

---

## Q011: Delete the fully answered 2026-11-08 and 2026-11-09 questions files?

- Feature: none (docs housekeeping; files of earlier sessions for project-workspace, api-skeleton, web-skeleton, ci-checks, dev-deploy, dev-deploy-verification)
- Status: open
- Asked: 2026-11-10
- Blocks: nothing, using default below

**Question**: Every question in `questions-2026-11-08-requirement-breakdown.md` and `questions-2026-11-09-requirement-breakdown.md` is `answered`. The writing-docs skill ("When resuming", step 3) says to delete such a file. But 27 docs link to anchors in them (73 links, including ADR 0001 and ADR 0002 Status lines, done features and tasks, infra and API docs), and some answers (for example Q010 of 2026-11-09, "a human updates the skill") record follow-ups. Deleting them breaks those links and removes the recorded rationale.

**Options**
1. A: In one doc-only change, move each lasting answer into the owning ADR or doc, repoint every link to it, then delete both files. (recommended: follows the skill)
2. B: Keep both files and add an exception to the skill: answered files whose anchors are cited by ADRs stay as an archive.

**Default if unanswered**: neither file is deleted and no link changes until the product owner chooses; this correction does not touch them.

**Answer**: _(human fills in)_

---
