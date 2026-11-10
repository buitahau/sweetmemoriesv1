# Build hero intro

- Status: not-started

## Goal

Add the hero's left column: badge, the page `h1` with the highlighted word "home", lead text, the "Start with Google" and "See how it works" links, the note line and the row of five faces with its caption.

## Scope

Area: UI. Mockup lines 78-99 (markup values), 27-29 and 32-39 (keyframes, entrance and button rules). Text from `content.ts` (`hero`, `SIGN_IN_HREF`); graphics `Heart` (size 22) and `Face` (size 46) from `illustrations.tsx`. Rules: [ui/homepage.md](../../ui/homepage.md) (Typography, Responsive rules, Motion).

| File | Change |
|---|---|
| `apps/web/src/home/HeroIntro.tsx` (new) | `export function HeroIntro()`. Markup in order: `div.intro` > `div.badge` (Heart + `hero.badge`), `h1.title` (`hero.titleBefore`, `span.highlight` with `hero.titleHighlight`, `hero.titleAfter`), `p.lead`, `div.ctaRow` (`a.primary[href={SIGN_IN_HREF}]` with `hero.primaryCta`, `a.secondary[href="#how"]` with `hero.secondaryCta`), `p.note`, `div.facesRow` > `div.faces` (one `<Face className={styles.face} bg={c} size={46} />` per `hero.faceColors`, key = index) + `span.caption` with `hero.facesCaption`. Entrance classes: badge `rise`, h1 `rise d1`, lead `rise d2`, ctaRow `rise d3`. |
| `apps/web/src/home/HeroIntro.module.css` (new) | Values below. |
| `apps/web/src/home/HeroIntro.test.tsx` (new) | Tests below. |
| `apps/web/src/home/HomePage.tsx` | Replace `{/* slot: hero-intro */}` with `<HeroIntro />`. |

| Class | Declarations (line) |
|---|---|
| `intro` | `flex: 1 1 480px; min-width: 0;` (78) |
| `badge` | `display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px 6px 10px; border-radius: var(--radius-pill); background: var(--color-white); font-weight: 600; font-size: 15px;` (79) |
| `title` | `margin: 22px 0 0; font-family: var(--font-display); font-weight: 700; font-size: 76px; line-height: 1.0; letter-spacing: -0.02em;` (83); `@media (max-width: 767px)`: `font-size: 48px;` |
| `highlight` | `border-radius: 18px; padding: 0 12px; background-image: linear-gradient(var(--color-highlight), var(--color-highlight)); background-repeat: no-repeat; background-size: 100% 100%; animation: hl .9s .6s ease-out both;` (36, 83) |
| `lead` | `margin: 24px 0 0; font-size: 22px; line-height: 1.5; color: var(--color-ink-soft); max-width: 34ch;` (84); `@media (max-width: 767px)`: `font-size: 19px;` |
| `ctaRow` | `margin-top: 34px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;` (85) |
| `primary` | `display: inline-flex; align-items: center; gap: 10px; min-height: 60px; padding: 0 32px; border-radius: var(--radius-pill); background: var(--color-button); color: var(--color-ink); font-size: 19px; font-weight: 700; text-decoration: none; box-shadow: 0 6px 0 var(--color-button-shadow); transition: transform .2s ease, box-shadow .2s ease;` (37, 86). `:hover, :focus-visible`: `transform: translateY(-3px); box-shadow: 0 9px 0 var(--color-button-shadow); color: var(--color-ink);` `:active`: `transform: translateY(3px); box-shadow: 0 2px 0 var(--color-button-shadow);` (38-39) |
| `secondary` | `display: inline-flex; align-items: center; min-height: 44px; font-weight: 700; color: var(--color-ink);` (87; keeps the default underline). `:hover`: `color: var(--color-ink);` |
| `note` | `margin: 18px 0 0; font-size: 15px; color: var(--color-ink-muted);` (89) |
| `facesRow` | `margin-top: 30px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;` (91) |
| `faces` | `display: flex;` (92) |
| `face` | `margin-left: -10px; border-radius: 50%; border: 3px solid var(--color-hero); background: var(--color-hero); animation: pop .6s cubic-bezier(.3,1.4,.5,1) both;` and `.face:nth-child(1..5)` delays `.7s .8s .9s 1s 1.1s` (34-35, 94) |
| `caption` | `font-size: 15px; font-weight: 600; color: var(--color-ink-soft);` (97) |
| `rise`, `d1`, `d2`, `d3` | `animation: rise .8s cubic-bezier(.2,.8,.2,1) both;` delays `.1s`, `.25s`, `.4s` (32-33) |
| keyframes | `rise`, `pop`, `hl` copied by value from lines 27, 28, 29 |

Tests in `HeroIntro.test.tsx`:
- `shows the page title`: `getByRole('heading', { level: 1 })` has text content `Every little moment deserves a home.`.
- `links to sign-in and to how it works`: link "Start with Google" has `href` `/sign-in`; link "See how it works" has `href` `#how`.
- `shows five faces`: the component's `svg` count is 6 (1 heart + 5 faces), all with `aria-hidden="true"`.

Prerequisites (must be `done`): [add-home-content](add-home-content.md), [add-home-illustrations](add-home-illustrations.md), [add-homepage-shell](add-homepage-shell.md).

Out of scope: the collage (right column), sign-in behavior, avatar photos (faces are drawings), changing copy.

Security: text rendered as React text (no `dangerouslySetInnerHTML`); the faces caption is fictional, no User data (CLAUDE.md rule 5).

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `npm test -w apps/web` passes the three tests named in Scope. (AC1, AC4)
- [ ] 2. At 1440 x 900, after 3 s, the left hero column matches mockup lines 78-99 side by side per [ui/homepage.md, Checking fidelity](../../ui/homepage.md#checking-fidelity) (±4 px boxes, exact colors and fonts; [Q008](../../questions/questions-2026-11-10-requirement-breakdown.md#q008-visual-fidelity-tolerance-for-the-homepage) default) (badge, two-line `h1` with pink "home" block, lead, pink 3D button, underlined link, note, overlapping faces with caption). (AC2)
- [ ] 3. Computed at 1440 px: `h1` 76px, weight 700, line height 76px, family Fredoka; lead 22px, color `rgb(90, 60, 75)`; primary link background `rgb(255, 165, 186)`, min height 60px, box shadow `rgb(229, 126, 152) 0px 6px 0px 0px`. (AC2)
- [ ] 4. Hovering the primary link gives `transform` `matrix(1, 0, 0, 1, 0, -3)` and shadow `rgb(229, 126, 152) 0px 9px 0px 0px`; focusing it with Tab gives the same lift. (AC6, AC8)
- [ ] 5. On load the badge, `h1`, lead and CTA row fade up in that order and the faces pop in one by one; with reduced motion emulated nothing animates (`document.getAnimations().length === 0`). (AC6)
- [ ] 6. At 375 px: `h1` 48px, lead 19px, no horizontal scrollbar; at 320 px `scrollWidth <= innerWidth`. (AC7)
- [ ] 7. "Start with Google" has `href` `/sign-in` and "See how it works" `#how`. (AC3, AC4)
- [ ] 8. `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0; no Console errors or warnings on load of `$BASE_URL/`. (AC11)
- [ ] 9. Under `apps/`, the PR changes only the four files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them, none under `apps/api/`). Changes under `docs/` are allowed. (AC10)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated; wait 3 s after load. `Spec:`/`Testids:` per [ADR 0004](../../adr/0004-playwright-e2e-specs.md); when only some steps run in the browser, the brackets name the steps the spec covers and the other steps run as prose.

```
E2E-1 -> checklist items 1, 8: unit tests, build, console
Spec: prose (npm commands)
Testids: none
Preconditions: npm install done; app running
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/HeroIntro.test.tsx; echo "t=$?"
  2. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
  3. Open $BASE_URL/ with the DevTools Console open; reload.
Expected: three tests pass, t=0; b=0; step 3 the Console shows no error or warning entries
```

```
E2E-2 -> checklist items 2, 3, 7: look, values, links
Spec: prose (visual comparison with the mockup)
Testids: none
Preconditions: app running; mockup served at http://localhost:8000/Landing2.dc.html
Steps:
  1. Compare the left hero column of both pages side by side.
  2. In the app Console run: const h=getComputedStyle(document.querySelector('h1')); const lead=getComputedStyle(document.querySelector('h1').nextElementSibling); const p=[...document.querySelectorAll('a')].find(a=>a.textContent==='Start with Google'); const ps=getComputedStyle(p); [h.fontSize,h.fontWeight,h.lineHeight,h.fontFamily.split(',')[0],lead.fontSize,lead.color,ps.backgroundColor,ps.minHeight,ps.boxShadow,p.getAttribute('href'),[...document.querySelectorAll('a')].find(a=>a.textContent==='See how it works').getAttribute('href')]
Expected: step 1 same layout, sizes and colors; step 2 ["76px","700","76px","Fredoka" (quotes allowed),"22px","rgb(90, 60, 75)","rgb(255, 165, 186)","60px","rgb(229, 126, 152) 0px 6px 0px 0px","/sign-in","#how"]
```

```
E2E-3 -> checklist item 4: hover and focus lift
Spec: e2e/specs/homepage/build-hero-intro.spec.ts
Testids: none
Preconditions: app running
Steps:
  1. Hover "Start with Google" (hero) and wait 0.3 s; run: const s=getComputedStyle([...document.querySelectorAll('a')].find(a=>a.textContent==='Start with Google')); [s.transform, s.boxShadow]
  2. Move the mouse away; press Tab until "Start with Google" is focused; wait 0.3 s; run the same command.
Expected: both ["matrix(1, 0, 0, 1, 0, -3)", "rgb(229, 126, 152) 0px 9px 0px 0px"]
```

```
E2E-4 -> checklist item 5: entrance motion and reduced motion
Spec: e2e/specs/homepage/build-hero-intro.spec.ts (step 2; the entrance order in step 1 is watched by eye as prose)
Testids: none
Preconditions: app running
Steps:
  1. Reload and watch the hero for 2 s.
  2. DevTools Rendering: prefers-reduced-motion = reduce; reload; run: document.getAnimations().length
Expected: badge, title, lead, buttons rise in order, then five faces pop in left to right; step 2 prints 0 and all content is visible
```

```
E2E-5 -> checklist item 6: narrow screens
Spec: e2e/specs/homepage/build-hero-intro.spec.ts
Testids: none
Preconditions: app running
Steps:
  1. Set 375 x 812, reload; run: [getComputedStyle(document.querySelector('h1')).fontSize, getComputedStyle(document.querySelector('h1').nextElementSibling).fontSize, document.documentElement.scrollWidth <= innerWidth]
  2. Set 320 x 640, reload; run: document.documentElement.scrollWidth <= innerWidth
Expected: ["48px","19px",true]; true
```

```
E2E-6 -> checklist item 9: PR scope
Spec: prose (git command)
Testids: none
Preconditions: task branch checked out; git fetch origin done
Steps:
  1. Run: git diff --name-only origin/dev-v1...HEAD -- apps/
Expected: exactly apps/web/src/home/HeroIntro.tsx, apps/web/src/home/HeroIntro.module.css, apps/web/src/home/HeroIntro.test.tsx, apps/web/src/home/HomePage.tsx
```

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#motion-and-interaction)
