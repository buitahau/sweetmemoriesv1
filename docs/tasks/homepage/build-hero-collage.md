# Build hero collage

- Status: not-started

## Goal

Add the hero's right column: the decorative collage (sample Memory card with address bar and three polaroids, sun, cloud, heart, star and "Share this link" note card), with its gentle endless motion, hidden at 559 px and narrower.

## Scope

Area: UI. Mockup lines 101-140 (values), 17-26 (keyframes). Text from `content.ts` (`collage`); `Sun`, `Cloud`, `Heart` (size 64), `Star`, `LockIcon` from `illustrations.tsx`. Rules: [ui/homepage.md](../../ui/homepage.md) (Responsive rules, Motion, Accessibility). The whole collage is decorative: one `aria-hidden="true"` on its root.

| File | Change |
|---|---|
| `apps/web/src/home/HeroCollage.tsx` (new) | `export function HeroCollage()`. Root `div.collage` with `aria-hidden="true"` and `data-testid="hero-collage"`. Children in mockup order: `div.halo` (104), `<Sun className={styles.sun} raysClassName={styles.rays} />` (106), `<Cloud className={styles.cloud} />` (114), `div.card` (116-130), `<Heart className={styles.heart} size={64} />` (132), `<Star className={styles.star} />` (133), `div.note` (135-138). A local helper component for the three polaroids is allowed (same file, not exported). |
| `apps/web/src/home/HeroCollage.module.css` (new) | Values below. |
| `apps/web/src/home/HeroCollage.test.tsx` (new) | Tests below. |
| `apps/web/src/home/HomePage.tsx` | Replace `{/* slot: hero-collage */}` with `<HeroCollage />`. |

| Class | Declarations (line) |
|---|---|
| `collage` | `flex: 1 1 480px; min-width: 340px; position: relative; height: 560px;` (102); `@media (max-width: 559px)`: `display: none;` |
| `halo` | `position: absolute; left: 30px; top: 40px; width: 440px; height: 440px; border-radius: 50%; background: var(--color-white); opacity: 0.55;` (104) |
| `sun` | `position: absolute; right: 10px; top: 0; animation: float 5s ease-in-out infinite;` (106) |
| `rays` | `transform-origin: 45px 45px; animation: spin 18s linear infinite;` (107) |
| `cloud` | `position: absolute; left: 0; top: 110px; animation: drift 8s ease-in-out infinite;` (114) |
| `card` | `position: absolute; left: 60px; top: 70px; width: 380px; background: var(--color-white); border-radius: var(--radius-panel); overflow: hidden; box-shadow: 0 24px 0 -8px rgba(214,50,90,0.14), 0 26px 48px rgba(110,40,60,0.2); transform: rotate(-2deg); animation: floatTilt 6s ease-in-out infinite;` (116) |
| `cardBar` | `padding: 12px 16px; background: #FFE1CC;` (117) |
| `urlPill` | `display: flex; align-items: center; gap: 8px; background: var(--color-white); border-radius: var(--radius-pill); padding: 8px 16px; font-size: 15px; font-weight: 600;` (118); inner text `span` gets `overflow-wrap: anywhere;` (120) and shows `collage.address` after `<LockIcon />` |
| `cardBody` | `position: relative; height: 380px; background: #CDEFE0; padding: 26px 28px;` (123) |
| `cardTitle` | `font-family: var(--font-hand); font-weight: 700; font-size: 60px; line-height: 0.95; color: #1F4A38;` (124), text `collage.title` |
| `cardSub` | `margin-top: 4px; font-size: 15px; color: #2C5E49;` (125), text `collage.subtitle` |
| polaroid A | `position: absolute; left: 26px; bottom: 26px; width: 140px; background: var(--color-white); padding: 8px 8px 28px; border-radius: 6px; box-shadow: 0 10px 20px rgba(31,74,56,0.2); transform: rotate(-6deg); transform-origin: 50% 0; animation: swayA 4.5s ease-in-out infinite;` photo `height: 106px; border-radius: 4px; background: #FFC1D0;` caption `collage.photoCaptions[0]` (126) |
| polaroid B | as A but `left: 160px; bottom: 54px; transform: rotate(4deg); animation: swayB 5s ease-in-out infinite .4s;` photo `#BFE1FA`; caption `collage.photoCaptions[1]` (127) |
| polaroid C | `position: absolute; right: 22px; top: 100px; width: 120px; padding: 7px 7px 24px;` same background, radius, shadow; `transform: rotate(7deg); transform-origin: 50% 0; animation: swayC 4s ease-in-out infinite .8s;` photo `height: 88px; background: #FFE08A`; tape `position: absolute; top: -12px; left: 34px; width: 54px; height: 20px; background: #FFB27A; opacity: 0.85; transform: rotate(-3deg); border-radius: 3px;`; no caption (128) |
| polaroid caption | `position: absolute; bottom: 4px; left: 12px; font-family: var(--font-hand); font-weight: 500; font-size: 22px;` (126-127) |
| `heart` | `position: absolute; left: 6px; bottom: 90px; transform: rotate(-12deg); animation: beat 1.8s ease-in-out infinite;` (132) |
| `star` | `position: absolute; right: 24px; bottom: 150px; transform: rotate(14deg); animation: twinkle 2.6s ease-in-out infinite;` (133) |
| `note` | `position: absolute; right: 0; bottom: 14px; width: 224px; background: var(--color-white); border-radius: 22px; padding: 14px 18px; box-shadow: 0 16px 32px rgba(110,40,60,0.2); transform: rotate(3deg); animation: wiggle 3s ease-in-out infinite;` (135); first line `font-size: 13px; color: var(--color-ink-muted);` (`collage.noteLine`), second `margin-top: 2px; font-family: var(--font-hand); font-weight: 700; font-size: 28px; line-height: 1; color: var(--color-link);` (`collage.noteTitle`) (136-137) |
| keyframes | `float`, `floatTilt`, `spin`, `drift`, `beat`, `twinkle`, `swayA`, `swayB`, `swayC`, `wiggle`: copy lines 17-26 by value, renamed without the `sm-` prefix (`sm-float-tilt` -> `floatTilt`, `sm-sway-a` -> `swayA`, ...) |

Hex values above without a token are one-off colors of this illustration; write them as given.

Tests in `HeroCollage.test.tsx`:
- `is decorative`: the root (`getByTestId('hero-collage')`) has `aria-hidden="true"`; `queryAllByRole('img')` and `queryAllByRole('heading')` are empty.
- `shows the sample address`: the root's text contains `sam.sweetmemories.com/bobs-first-day`, `Bob's first day` and `Share this link`.

Prerequisites (must be `done`): [add-home-content](add-home-content.md), [add-home-illustrations](add-home-illustrations.md), [add-homepage-shell](add-homepage-shell.md).

Out of scope: real Photos, a real Memory preview, links on the collage, scaling the collage for small screens (hidden instead, [Q004](../../questions/questions-2026-11-10-requirement-breakdown.md#q004-mobile-layout-for-the-homepage)).

Security: decorative and static; the sample address is fictional (`sam`), not a real User subdomain (CLAUDE.md rule 5); no image or font from another origin.

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `npm test -w apps/web` passes `is decorative` and `shows the sample address`. (AC8)
- [ ] 2. At 1440 x 900 the collage matches mockup lines 101-140 side by side: positions of halo, sun, cloud, tilted card, three polaroids (one with tape), heart, star, note card; colors and shadows equal. (AC2)
- [ ] 3. Computed at 1440 px: collage height `560px`; card width `380px`, border radius `28px`, `overflow: hidden`; card title font size `60px`, family Caveat; note card width `224px`, radius `22px`. (AC2)
- [ ] 4. Sun, rays, cloud, card, polaroids, heart, star and note move continuously; with reduced motion emulated `document.getAnimations().length === 0`. (AC6)
- [ ] 5. At 559 px the collage has `display: none` and the page has no horizontal scrollbar; at 560 px it is shown and `scrollWidth <= innerWidth`. (AC7)
- [ ] 6. The collage root has `aria-hidden="true"`, so screen readers skip all its text. (AC8)
- [ ] 7. `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0; no Console errors. (AC11)
- [ ] 8. Under `apps/`, the PR changes only the four files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them, none under `apps/api/`). Changes under `docs/` are allowed. (AC10)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated.

```
E2E-1 -> checklist items 1, 7: unit tests, build
Preconditions: npm install done
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/HeroCollage.test.tsx; echo "t=$?"
  2. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
Expected: both tests pass, t=0; b=0
```

```
E2E-2 -> checklist items 2, 3, 6: look and values
Preconditions: app running; mockup served at http://localhost:8000/Landing2.dc.html; DevTools Rendering prefers-reduced-motion = reduce in both tabs (freezes motion for comparison)
Steps:
  1. Compare the hero right column side by side.
  2. In the app Console run: const c=document.querySelector('[data-testid="hero-collage"]'); const card=[...c.querySelectorAll('div')].find(d=>getComputedStyle(d).width==='380px'); const cs=getComputedStyle(card); const title=[...c.querySelectorAll('div')].find(d=>d.textContent==="Bob's first day"); const note=[...c.querySelectorAll('div')].find(d=>getComputedStyle(d).width==='224px'); [getComputedStyle(c).height, cs.borderRadius, cs.overflow, getComputedStyle(title).fontSize, getComputedStyle(title).fontFamily.split(',')[0], getComputedStyle(note).borderRadius, c.getAttribute('aria-hidden')]
Expected: step 1 same shapes, positions, colors, shadows; step 2 ["560px","28px","hidden","60px","Caveat" (quotes allowed),"22px","true"]
```

```
E2E-3 -> checklist item 4: motion
Preconditions: app running, reduced motion not emulated
Steps:
  1. Watch the collage for 6 s.
  2. Run: document.querySelector('[data-testid="hero-collage"]').getAnimations({ subtree: true }).length
  3. Emulate prefers-reduced-motion = reduce, reload, run: document.getAnimations().length
Expected: sun bobs and its rays spin, cloud drifts, card floats, polaroids sway, heart beats, star twinkles, note wiggles; step 2 >= 10; step 3 0
```

```
E2E-4 -> checklist item 5: hidden on small screens
Preconditions: app running
Steps:
  1. Set 559 x 800, reload; run: [getComputedStyle(document.querySelector('[data-testid="hero-collage"]')).display, document.documentElement.scrollWidth <= innerWidth]
  2. Set 560 x 800, reload; run the same.
Expected: ["none", true]; ["block", true]
```

```
E2E-5 -> checklist item 8: PR scope
Preconditions: task branch checked out; git fetch origin done
Steps:
  1. Run: git diff --name-only origin/dev-v1...HEAD -- apps/
Expected: exactly apps/web/src/home/HeroCollage.tsx, apps/web/src/home/HeroCollage.module.css, apps/web/src/home/HeroCollage.test.tsx, apps/web/src/home/HomePage.tsx
```

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#responsive-rules)
