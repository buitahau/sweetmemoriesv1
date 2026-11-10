# Build page closing

- Status: not-started

## Goal

Add the pink end of the page: the closing call-to-action band (last section inside `main`, with heading, line of text, white "Start with Google" button and two moving blobs) and the site footer below it on the same pink background.

## Scope

Area: UI. Mockup lines 258-279 (values), 31 and 37-39 (blob keyframes, button lift). Data from `content.ts` (`sectionText.closing`, `closingCta`, `SIGN_IN_HREF`, `brand`); `LogoMark variant="footer"` from `illustrations.tsx`. Rules: [ui/homepage.md](../../ui/homepage.md).

| File | Change |
|---|---|
| `apps/web/src/home/ClosingSection.tsx` (new) | `export function ClosingSection()`. Markup: `section.closing[aria-labelledby="closing-title"]` > `div.blobA[aria-hidden="true"]`, `div.blobB[aria-hidden="true"]`, `div.inner` > `div.textCol` (`h2#closing-title.title`, `p.lead`) + `a.cta[href={SIGN_IN_HREF}]` with `closingCta`. |
| `apps/web/src/home/ClosingSection.module.css` (new) | Values below. |
| `apps/web/src/home/SiteFooter.tsx` (new) | `export function SiteFooter()`. Markup: `footer.footer` > `div.inner` > `span.brand` (`<LogoMark variant="footer" />` + `brand.name`) + `span` with `brand.tagline`. |
| `apps/web/src/home/SiteFooter.module.css` (new) | Values below. |
| `apps/web/src/home/PageClosing.test.tsx` (new) | Tests below. |
| `apps/web/src/home/HomePage.tsx` | Replace `{/* slot: closing */}` with `<ClosingSection />` and `{/* slot: footer */}` with `<SiteFooter />`. |
| `README.md` (root) | In "Status", replace "a web app with a placeholder home page" with "a web app with the static public Homepage (no sign-in yet)". In "Repository layout", change `apps/web   React, Vite, home page` to `apps/web   React, Vite, static Homepage`. Nothing else. (Docs describe the current truth; Prerequisites make this the last Homepage task, so the page is complete when it merges.) |

`ClosingSection.module.css`:

| Class | Declarations (line) |
|---|---|
| `closing` | `position: relative; background: var(--color-cta); color: var(--color-ink); border-top-left-radius: var(--radius-band); border-top-right-radius: var(--radius-band); overflow: hidden;` (259) |
| `blobA` | `position: absolute; right: -90px; top: -90px; width: 300px; height: 300px; border-radius: 50%; background: #FFD6E0; animation: blob 10s ease-in-out infinite;` (260) |
| `blobB` | `position: absolute; left: -70px; bottom: -110px; width: 260px; height: 260px; border-radius: 50%; background: #FFADC0; animation: blob 12s ease-in-out infinite reverse;` (261) |
| `inner` | `position: relative; max-width: var(--page-max); margin: 0 auto; box-sizing: border-box; padding: 88px var(--gutter) 92px; display: flex; flex-wrap: wrap; gap: 32px; align-items: center; justify-content: space-between;` (262); `@media (max-width: 767px)`: `padding-top: 64px; padding-bottom: 64px;` |
| `textCol` | `flex: 1 1 420px; min-width: 0;` (263; `min-width: 0` added so it never overflows at 320 px) |
| `title` | `margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 54px; line-height: 1.05; letter-spacing: -0.01em;` (264); `@media (max-width: 767px)`: `font-size: 34px;` |
| `lead` | `margin: 14px 0 0; font-size: 21px; max-width: 40ch;` (265) |
| `cta` | `display: inline-flex; align-items: center; min-height: 64px; padding: 0 36px; border-radius: var(--radius-pill); background: var(--color-white); color: var(--color-ink); font-size: 20px; font-weight: 700; text-decoration: none; box-shadow: 0 6px 0 var(--color-cta-button-shadow); transition: transform .2s ease, box-shadow .2s ease;` (267, 37). `:hover, :focus-visible`: `transform: translateY(-3px); box-shadow: 0 9px 0 var(--color-button-shadow); color: var(--color-ink);` `:active`: `transform: translateY(3px); box-shadow: 0 2px 0 var(--color-button-shadow);` (38-39: the mockup's hover shadow is `#E57E98`, not the resting `#E89AAE`) |
| keyframes | `blob` copied from line 31 |

`SiteFooter.module.css`:

| Class | Declarations (line) |
|---|---|
| `footer` | `background: var(--color-cta); color: var(--color-ink);` (271) |
| `inner` | `max-width: var(--page-max); margin: 0 auto; box-sizing: border-box; padding: 0 var(--gutter) 44px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-size: 15px;` (272) |
| `brand` | `display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 600; font-size: 20px;` (273) |

Tests in `PageClosing.test.tsx` (render each component on its own):
- `renders the closing call to action`: region named `Start with the memory everyone keeps telling.`; link `Start with Google` with `href` `/sign-in`.
- `renders the footer`: `getByRole('contentinfo')` contains `SweetMemories` and `Small pages for the moments worth keeping.`; it contains no link.

Prerequisites (must be `done`): [add-home-content](add-home-content.md), [add-home-illustrations](add-home-illustrations.md), [add-homepage-shell](add-homepage-shell.md), and every other section task: [build-top-bar](build-top-bar.md), [build-hero-intro](build-hero-intro.md), [build-hero-collage](build-hero-collage.md), [build-audiences-section](build-audiences-section.md), [build-steps-section](build-steps-section.md), [build-templates-section](build-templates-section.md), [build-moments-section](build-moments-section.md), [build-addresses-section](build-addresses-section.md). This task is last because its `README.md` edit says the Homepage is complete (docs describe the current truth).

Out of scope: footer links (legal, contact, social), cookie banner (no cookies are set), newsletter forms.

Security: the CTA only links to the placeholder `SIGN_IN_HREF`; no auth code, no cookies (CLAUDE.md rule 1 groundwork, "Project state").

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `npm test -w apps/web` passes `renders the closing call to action` and `renders the footer`. (AC1, AC4)
- [ ] 2. At 1440 x 900 the end of the page matches mockup lines 258-279 side by side per [ui/homepage.md, Checking fidelity](../../ui/homepage.md#checking-fidelity) (±4 px boxes, exact colors and fonts; [Q008](../../questions/questions-2026-11-10-requirement-breakdown.md#q008-visual-fidelity-tolerance-for-the-homepage) default): pink band with 64 px top corners and two soft blobs, heading and text left, white 3D button right, footer row with logo and tagline. (AC2)
- [ ] 3. Computed at 1440 px: closing section background `rgb(255, 194, 209)`, top radii `64px`; `h2` 54px; CTA background `rgb(255, 255, 255)`, min height `64px`, shadow `rgb(232, 154, 174) 0px 6px 0px 0px`; footer background `rgb(255, 194, 209)`, font size 15px; footer brand 20px Fredoka 600. (AC2)
- [ ] 4. The closing section is the last child of `main`; the `footer` is the next sibling of `main`. (AC1)
- [ ] 5. Hovering or focusing the CTA gives `matrix(1, 0, 0, 1, 0, -3)` and shadow `rgb(229, 126, 152) 0px 9px 0px 0px`; with reduced motion the blobs do not animate (`document.getAnimations().length === 0`). (AC6, AC8)
- [ ] 6. At 375 px the button wraps below the text, `h2` 34px, inner padding top/bottom 64px; at 320 px `scrollWidth <= innerWidth`. (AC7)
- [ ] 7. The CTA `href` is `/sign-in`. (AC4)
- [ ] 8. `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0; no Console errors or warnings on load of `$BASE_URL/`. (AC11)
- [ ] 9. `README.md` no longer says "placeholder home page" and contains "static public Homepage" (`grep -c 'placeholder home page' README.md` prints 0; `grep -c 'static public Homepage' README.md` prints 1). (Summary: Homepage replaces the placeholder)
- [ ] 10. Before this PR merges, the Status of all eight other section tasks listed in Prerequisites is `done` (the README must not claim a finished Homepage while sections are missing). (AC1)
- [ ] 11. Under `apps/`, the PR changes only the six `apps/` files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them, none under `apps/api/`); outside `apps/` only `README.md` and `docs/` change. (AC10)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated. `Spec:`/`Testids:` per [ADR 0004](../../adr/0004-playwright-e2e-specs.md).

```
E2E-1 -> checklist items 1, 8, 9: unit tests, build, console, README
Spec: prose (npm and grep commands)
Testids: none
Preconditions: npm install done; app running
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/PageClosing.test.tsx; echo "t=$?"
  2. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
  3. Run: grep -c 'placeholder home page' README.md; grep -c 'static public Homepage' README.md
  4. Open $BASE_URL/ with the DevTools Console open; reload.
Expected: both tests pass, t=0; b=0; 0 then 1; step 4 the Console shows no error or warning entries
```

```
E2E-2 -> checklist items 2, 3, 4, 7: look, values, structure, link
Spec: prose (visual comparison with the mockup)
Testids: none
Preconditions: app running; mockup served at http://localhost:8000/Landing2.dc.html
Steps:
  1. Scroll both pages to the bottom and compare side by side.
  2. In the app Console run: const sec=document.querySelector('main').lastElementChild; const s=getComputedStyle(sec); const a=sec.querySelector('a'); const c=getComputedStyle(a); const f=document.querySelector('footer'); const fi=getComputedStyle(f.firstElementChild); const fb=getComputedStyle(f.firstElementChild.firstElementChild); [s.backgroundColor, s.borderTopLeftRadius, s.borderTopRightRadius, getComputedStyle(sec.querySelector('h2')).fontSize, c.backgroundColor, c.minHeight, c.boxShadow, a.getAttribute('href'), getComputedStyle(f).backgroundColor, fi.fontSize, fb.fontSize, fb.fontFamily.split(',')[0], fb.fontWeight, document.querySelector('main').nextElementSibling === f]
Expected: step 1 same; step 2 ["rgb(255, 194, 209)","64px","64px","54px","rgb(255, 255, 255)","64px","rgb(232, 154, 174) 0px 6px 0px 0px","/sign-in","rgb(255, 194, 209)","15px","20px","Fredoka" (quotes allowed),"600",true]
```

```
E2E-3 -> checklist item 5: button lift and reduced motion
Spec: e2e/specs/homepage/build-page-closing.spec.ts
Testids: none
Preconditions: app running
Steps:
  1. Hover the closing "Start with Google"; wait 0.3 s; run: const s=getComputedStyle(document.querySelector('main').lastElementChild.querySelector('a')); [s.transform, s.boxShadow]
  2. Move the mouse away; Tab until that link is focused; wait 0.3 s; run the same.
  3. Emulate prefers-reduced-motion = reduce; reload; run: document.getAnimations().length
Expected: steps 1 and 2 ["matrix(1, 0, 0, 1, 0, -3)","rgb(229, 126, 152) 0px 9px 0px 0px"]; step 3 0
```

```
E2E-4 -> checklist item 6: narrow screen
Spec: e2e/specs/homepage/build-page-closing.spec.ts
Testids: none
Preconditions: app running
Steps:
  1. Set 375 x 812, reload; run: const sec=document.querySelector('main').lastElementChild; const inner=sec.lastElementChild; [sec.querySelector('a').getBoundingClientRect().top > sec.querySelector('p').getBoundingClientRect().bottom, getComputedStyle(sec.querySelector('h2')).fontSize, getComputedStyle(inner).paddingTop, getComputedStyle(inner).paddingBottom]
  2. Set 320 x 640, reload; run: document.documentElement.scrollWidth <= innerWidth
Expected: [true,"34px","64px","64px"]; true
```

```
E2E-5 -> checklist items 10, 11: merge order and PR scope
Spec: prose (grep and git commands)
Testids: none
Preconditions: task branch checked out; git fetch origin done
Steps:
  1. Run: grep -h '^- Status:' docs/tasks/homepage/build-{top-bar,hero-intro,hero-collage,audiences-section,steps-section,templates-section,moments-section,addresses-section}.md
  2. Run: git diff --name-only origin/dev-v1...HEAD -- apps/
  3. Run: git diff --name-only origin/dev-v1...HEAD | grep -v -E '^(apps/web/src/home/|docs/|README\.md$)'; echo "o=$?"
Expected: step 1 eight lines, each "- Status: done"; step 2 exactly apps/web/src/home/ClosingSection.tsx, ClosingSection.module.css, SiteFooter.tsx, SiteFooter.module.css, PageClosing.test.tsx, HomePage.tsx (all under apps/web/src/home/); step 3 only "o=1"
```

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#page-structure)
