# Build top bar

- Status: not-started

## Goal

Add the top bar inside the hero band: logo link on the left, main navigation (three in-page links and a white "Sign in" pill) on the right.

## Scope

Area: UI. Mockup lines 63-74 (values), [ui/homepage.md](../../ui/homepage.md) (Links table, typography, responsive rules). Text and links from `content.ts` (`brand.name`, `navLinks`, `signInLabel`, `SIGN_IN_HREF`); logo from `illustrations.tsx` (`LogoMark variant="header"`).

| File | Change |
|---|---|
| `apps/web/src/home/TopBar.tsx` (new) | `export function TopBar()`. Markup: `div.bar` > `a.logo[href="/"]` (contains `<LogoMark variant="header" />` and `span.logoText` with `brand.name`) + `nav.nav[aria-label="Main"]` (one `a.navLink` per `navLinks` item, then `a.signIn[href={SIGN_IN_HREF}]` with `signInLabel`). |
| `apps/web/src/home/TopBar.module.css` (new) | Values below. |
| `apps/web/src/home/TopBar.test.tsx` (new) | Tests below. |
| `apps/web/src/home/HomePage.tsx` | Replace `{/* slot: top-bar */}` with `<TopBar />`. No other change. |

| Class | Declarations (line) |
|---|---|
| `bar` | `position: relative; max-width: var(--page-max); margin: 0 auto; box-sizing: border-box; padding: 22px var(--gutter); display: flex; align-items: center; gap: 24px; flex-wrap: wrap;` (63) |
| `logo` | `display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--color-ink);` (64) |
| `logoText` | `font-family: var(--font-display); font-weight: 600; font-size: 24px; letter-spacing: -0.01em;` (66) |
| `nav` | `flex: 1 1 auto; display: flex; justify-content: flex-end; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 16px;` (68) |
| `navLink` | `display: inline-flex; align-items: center; min-height: 44px; padding: 0 14px; font-weight: 600; color: var(--color-ink); text-decoration: none;` (69-71) |
| `signIn` | `display: inline-flex; align-items: center; min-height: 46px; padding: 0 22px; border-radius: var(--radius-pill); background: var(--color-white); font-weight: 700; color: var(--color-ink); text-decoration: none; box-shadow: 0 4px 0 var(--color-signin-shadow);` (72) |
| hover | `.logo:hover, .navLink:hover, .signIn:hover { color: var(--color-ink); }`: in the mockup the inline color wins over the global `a:hover`, so these links do not change color on hover. |

Tests in `TopBar.test.tsx` (Vitest + Testing Library, imports from `'vitest'`):
- `links the logo home`: `getByRole('link', { name: 'SweetMemories' })` has `href` `/`.
- `shows the main navigation`: `getByRole('navigation', { name: 'Main' })` contains links "Who it is for" (`#who`), "How it works" (`#how`), "Templates" (`#templates`), "Sign in" (`/sign-in`), in that order, and no other link.

Prerequisites (must be `done`): [add-home-content](add-home-content.md), [add-home-illustrations](add-home-illustrations.md), [add-homepage-shell](add-homepage-shell.md).

Out of scope: sign-in behavior, a mobile menu or hamburger, sticky header, active-link highlighting, smooth scrolling.

Security: links are static; "Sign in" goes to the placeholder `SIGN_IN_HREF` only, no auth code and no cookies (CLAUDE.md rule 1 groundwork; "Project state": no auth code).

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `npm test -w apps/web` passes `links the logo home` and `shows the main navigation`. (AC3, AC4)
- [ ] 2. At 1440 x 900 the top bar matches mockup lines 63-74 side by side per [ui/homepage.md, Checking fidelity](../../ui/homepage.md#checking-fidelity) (±4 px boxes, exact colors and fonts; [Q008](../../questions/questions-2026-11-10-requirement-breakdown.md#q008-visual-fidelity-tolerance-for-the-homepage) default) (logo 38 px tile, "SweetMemories" Fredoka 600 24px, links right-aligned, white Sign in pill with yellow 4 px shadow). (AC2)
- [ ] 3. Computed at 1440 px: bar padding `22px 40px`; nav links `font-size: 16px`, `font-weight: 600`, `min-height: 44px`; Sign in `background-color: rgb(255, 255, 255)`, `box-shadow: rgb(233, 200, 106) 0px 4px 0px 0px`, `border-radius: 999px`. (AC2)
- [ ] 4. Hovering "Who it is for" keeps its color `rgb(59, 36, 51)`. (AC2)
- [ ] 5. Clicking "How it works" sets `location.hash` to `#how` (the target exists once [build-steps-section](build-steps-section.md) is done; before that only the hash is checked). (AC3)
- [ ] 6. At 320 px the nav wraps below the logo, every link is visible, and `document.documentElement.scrollWidth <= window.innerWidth`. (AC7)
- [ ] 7. Tab from the address bar focuses the logo, then the four nav links in order, each with a visible focus outline. (AC8)
- [ ] 8. `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0; no Console errors or warnings on load of `$BASE_URL/`. (AC11)
- [ ] 9. Under `apps/`, the PR changes only the four files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them, none under `apps/api/`). Changes under `docs/` are allowed. (AC10)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated. `Spec:`/`Testids:` per [ADR 0004](../../adr/0004-playwright-e2e-specs.md); when only some steps run in the browser, the brackets name the steps the spec covers and the other steps run as prose.

```
E2E-1 -> checklist items 1, 8: unit tests, build, console
Spec: prose (npm commands)
Testids: none
Preconditions: npm install done; app running
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/TopBar.test.tsx; echo "t=$?"
  2. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
  3. Open $BASE_URL/ with the DevTools Console open; reload.
Expected: both test names pass, t=0; b=0; step 3 the Console shows no error or warning entries
```

```
E2E-2 -> checklist items 2, 3: look and values
Spec: prose (visual comparison with the mockup)
Testids: none
Preconditions: app running; mockup served at http://localhost:8000/Landing2.dc.html
Steps:
  1. Compare the top 100 px of both pages side by side.
  2. In the app Console run: const nav=document.querySelector('nav[aria-label="Main"]'); const links=[...nav.querySelectorAll('a')]; const si=getComputedStyle(links.at(-1)); const l0=getComputedStyle(links[0]); [getComputedStyle(nav.parentElement).padding, l0.fontSize, l0.fontWeight, l0.minHeight, si.backgroundColor, si.boxShadow, si.borderRadius, links.map(a=>a.textContent)]
Expected: step 1 same logo, sizes, spacing, colors; step 2 ["22px 40px","16px","600","44px","rgb(255, 255, 255)","rgb(233, 200, 106) 0px 4px 0px 0px","999px",["Who it is for","How it works","Templates","Sign in"]]
```

```
E2E-3 -> checklist items 4, 5: hover color and anchor
Spec: e2e/specs/homepage/build-top-bar.spec.ts
Testids: none
Preconditions: app running
Steps:
  1. Hover "Who it is for"; run: getComputedStyle(document.querySelector('nav a')).color
  2. Click "How it works"; run: location.hash
Expected: "rgb(59, 36, 51)"; "#how"
```

```
E2E-4 -> checklist item 6: narrow screen
Spec: e2e/specs/homepage/build-top-bar.spec.ts
Testids: none
Preconditions: app running
Steps:
  1. Set 320 x 640, reload.
  2. Run: [document.documentElement.scrollWidth <= window.innerWidth, [...document.querySelectorAll('nav a')].every(a => { const r=a.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth }), document.querySelector('nav').getBoundingClientRect().top >= document.querySelector('header a').getBoundingClientRect().bottom]
Expected: [true, true, true] (the nav starts below the logo, every link is inside the viewport)
```

```
E2E-5 -> checklist item 7: keyboard
Spec: e2e/specs/homepage/build-top-bar.spec.ts (focus order only; the visible outline is judged by eye as prose)
Testids: none
Preconditions: app running, page freshly loaded
Steps:
  1. Click the address bar, press Tab five times, noting document.activeElement text and the focus outline each time.
Expected: "SweetMemories", "Who it is for", "How it works", "Templates", "Sign in"; each shows a visible focus outline
```

```
E2E-6 -> checklist item 9: PR scope
Spec: prose (git command)
Testids: none
Preconditions: task branch checked out; git fetch origin done
Steps:
  1. Run: git diff --name-only origin/dev-v1...HEAD -- apps/
Expected: exactly apps/web/src/home/TopBar.tsx, apps/web/src/home/TopBar.module.css, apps/web/src/home/TopBar.test.tsx, apps/web/src/home/HomePage.tsx
```

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#links)
