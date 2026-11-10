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

## Q012: Accept ADR 0005 for the Homepage visual cases?

- Feature: homepage
- Status: answered
- Asked: 2026-11-10
- Blocks: nothing (answered). It used to keep the side-by-side mockup cases E2E-2 of [homepage](../features/homepage.md) and of 9 section tasks at `Spec: prose`.

**Question**: Homepage recheck (2026-11-10): each Homepage ticket has one side-by-side mockup comparison case. It now carries a `Visual:` line with measured values (colors, font sizes, padding, radii, column counts at 1280/1440 and at 390 wide). [ADR 0005](../adr/0005-e2e-signed-in-data-writing-and-visual-specs.md) would let the tester automate these as measured Playwright assertions (`toHaveCSS`, bounding boxes, no screenshots), but it is still `proposed`. The Homepage needs nothing else from ADR 0005: every case is `Auth: none`, `Data: none`, so the test sign-in and seed/reset endpoints in that ADR are not needed here. Accepting ADR 0005 also approves those two endpoints for later work, so the decision is wider than the Homepage.

**Options**
1. A: Accept ADR 0005 as written. The 10 Homepage side-by-side cases become specs from their `Visual:` values; the by-eye comparison stays prose for decorative positions only. (recommended: less manual checking per ticket, no new tool)
2. B: Accept only the visual-fidelity row now; decide the sign-in and seed/reset rows later (needs an ADR 0005 edit that splits it).
3. C: Keep ADR 0005 `proposed`; the side-by-side cases stay manual prose with screenshots.

**Default if unanswered**: C. Nothing changes until the product owner decides: the cases stay `Spec: prose` with "missing: ADR 0005 accepted, Q012" noted. Accepting an ADR is the product owner's decision.

**Answer**: Option A, approved by the product owner 2026-11-10 ("more automatic verification, less manual eye-to-eye checking"). Applied: [ADR 0005](../adr/0005-e2e-signed-in-data-writing-and-visual-specs.md) is `accepted` and [ADR 0004](../adr/0004-playwright-e2e-specs.md) is amended (Eligibility, Deferred, Visual fidelity, BE tickets, sign-in note in Consequences). The 10 Homepage mockup cases (E2E-2 of [homepage](../features/homepage.md) and of the 9 section tasks) now have `Spec: e2e/specs/homepage/<feature-or-task-slug>.spec.ts` and are asserted from their `Visual:` values per [ui/homepage.md, Visual assertions](../ui/homepage.md#visual-assertions); only decorative positions stay prose, by eye. The tester authors the spec code. Follow-up [Q015](#q015-do-the-measured-visual-assertions-replace-the-mockup-bounding-box-comparison) is answered (A).

---

## Q013: Viewports for Homepage Visual values

- Feature: homepage
- Status: answered
- Asked: 2026-11-10
- Blocks: nothing (answered)

**Question**: ADR 0005 and the business-analyst rules ask for `Visual:` values at 390 and 1280 wide. The mockup is drawn at 1440 only, [Checking fidelity](../ui/homepage.md#checking-fidelity) compares bounding boxes at 1440, and `e2e/playwright.config.ts` uses 1440 x 900. No responsive rule applies between 768 and 1439 px, so every computed CSS value is the same at 1280 and 1440; only `x` positions move by 80 px. [ui/homepage.md, Test case fields](../ui/homepage.md#test-case-fields) now uses one value set "at 1280 and 1440" plus one "at 390".

**Options**
1. A: Keep this: CSS values valid at 1280 and 1440, mobile values at 390, bounding-box comparison with the mockup at 1440. (recommended: meets ADR 0005 without changing the mockup width or the config)
2. B: Use 1280 and 390 only and move the bounding-box comparison to 1280 (the mockup then has to be viewed at 1280, where it was not drawn).
3. C: Measure at 390, 1280 and 1440 as three separate value sets (more checks, same values twice).

**Default if unanswered**: Option A.

**Answer**: Option A (the default), chosen by the product owner 2026-11-10. Applied: [ui/homepage.md, Test case fields](../ui/homepage.md#test-case-fields) states the rule as decided (CSS values valid at 1280 and 1440, mobile values at 390, bounding-box comparison with the mockup at 1440); the [homepage](../features/homepage.md) feature and the 9 section tasks already use "at 1280 and 1440 wide" and "At 390 wide" `Visual:` sets, so no case changed.

---

## Q014: Keep task-level Homepage specs from failing a full Playwright run

- Feature: homepage
- Status: answered
- Asked: 2026-11-10
- Blocks: nothing (answered)

**Question**: Some task-level specs assert the page as it is right after that task. For example, [add-homepage-shell](../tasks/homepage/add-homepage-shell.md) E2E-2 expects `document.querySelector('main').children.length === 0`, and that stops being true once the first section task merges. [ADR 0004](../adr/0004-playwright-e2e-specs.md) says the tester runs only the current ticket's spec file and CI does not run specs, but nothing stops anyone from running `npx playwright test` for the whole `e2e/` project. That run would then report failures even though the page is correct. Should these specs be isolated, and how?

**Options**
1. A: Each task spec wraps its tests in `test.describe('<task-slug>', ...)`. The e2e README tells people to run one ticket with `npx playwright test --grep <task-slug>`, and to run the whole project with only the feature spec (`--grep homepage`). The rule is recorded as an amendment to ADR 0004 or in the [e2e-specs](../features/e2e-specs.md) feature. (recommended: no code skips, the intent is written down, cheap)
2. B: The tester deletes or rewrites a task's spec once a later task changes the state it asserts (no stale specs, but more churn, and the red-first history is lost).
3. C: Keep as is and rely on the convention (zero work, but a full run fails after the second Homepage task merges).

**Default if unanswered**: Option A. Until it is recorded, the tester keeps running one spec file per ticket, as ADR 0004 says.

**Answer**: Option A (the default), chosen by the product owner 2026-11-10. Applied: recorded as the "Spec isolation" row amending [ADR 0004](../adr/0004-playwright-e2e-specs.md), in [e2e-specs](../features/e2e-specs.md) (Behavior), in the [homepage](../features/homepage.md) `e2e-test-suites` intro and in `e2e/README.md`. One wording correction, same intent: Playwright tests the `--grep` pattern against the file path plus the describe and test titles, so a bare `--grep homepage` would also select every task spec under `specs/homepage/`. The feature-only run is therefore written as `--grep "homepage E2E-"` (matches only titles that start with the feature slug); the one-ticket run stays `--grep <task-slug>`.

---

## Q015: Do the measured Visual assertions replace the mockup bounding-box comparison?

- Feature: homepage
- Status: answered
- Asked: 2026-11-10
- Blocks: nothing (answered)

**Question**: After Q012 (A), each Homepage mockup case (E2E-2) is a spec that asserts its `Visual:` values: computed CSS exact, sizes and layout relations (one row, N columns, below) from bounding boxes within ±4 px ([ui/homepage.md, Visual assertions](../ui/homepage.md#visual-assertions)). [Checking fidelity](../ui/homepage.md#checking-fidelity) step 4 also asks for each heading, card, panel and button box (`x`, `y` from the section top, `width`, `height`) to be within ±4 px of the same box in the live mockup. Those mockup box numbers are not written in any ticket, so a spec written from the ticket only ([ADR 0004](../adr/0004-playwright-e2e-specs.md), "Who writes specs") cannot assert them; keeping step 4 as a manual check keeps eye-to-eye work the product owner asked to cut.

**Options**
1. A: The measured `Visual:` values replace step 4 for the e2e run: positions follow from the asserted padding, margins, gaps and sizes. Step 4 stays in Checking fidelity as an optional reviewer check. Only decorative positions stay prose, by eye. (recommended: no new tool, no mockup server in test runs)
2. B: Measure the mockup boxes once (business-analyst, at 1440 x 900) and add them to each `Visual:` line, so the spec also asserts `x`, `y`, `width`, `height` within ±4 px (strictest; one more doc pass, values to keep in sync with the mockup).
3. C: Let the spec open the mockup itself (a `MOCKUP_URL` variable) and compare boxes live (needs the mockup served during every run, so not on dev; an ADR 0004 amendment).

**Default if unanswered**: Option A, as written in [ui/homepage.md, Checking fidelity](../ui/homepage.md#checking-fidelity) and the 10 E2E-2 cases.

**Answer**: Option A (the default), chosen by the product owner 2026-11-10. Applied: [ui/homepage.md, Checking fidelity](../ui/homepage.md#checking-fidelity) step 5 states the decision; checklist item 4 of [homepage](../features/homepage.md) and checklist item 2 of the 9 section tasks with a mockup case (build-top-bar, build-hero-intro, build-hero-collage, build-audiences-section, build-steps-section, build-templates-section, build-moments-section, build-addresses-section, build-page-closing) now pass when the E2E-2 spec passes; the ±4 px mockup-box comparison (steps 3-4) is an optional reviewer check, and only decorative positions stay prose, by eye.

---
