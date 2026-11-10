# Build moments section

- Status: not-started

## Goal

Add the "Moments worth keeping" section: centered heading and lead, then eight tilted handwritten chips with colored 3D shadows that straighten on hover.

## Scope

Area: UI. Mockup lines 223-232 (values), 44-45 (chip hover). Data from `content.ts` (`sectionText.moments`, `moments`). Rules: [ui/homepage.md](../../ui/homepage.md).

| File | Change |
|---|---|
| `apps/web/src/home/MomentsSection.tsx` (new) | `export function MomentsSection()`. Markup: `section.section[aria-labelledby="moments-title"]` > `h2#moments-title.title`, `p.lead`, `div.chips` > one `span.chip` per `moments` item (key = text), `style={{ background: m.bg, boxShadow: \`0 5px 0 ${m.shadow}\`, '--rot': m.rot } as CSSProperties}` (with `import type { CSSProperties } from 'react'`). No `id` on the section (the mockup has none). |
| `apps/web/src/home/MomentsSection.module.css` (new) | Values below. |
| `apps/web/src/home/MomentsSection.test.tsx` (new) | Tests below. |
| `apps/web/src/home/HomePage.tsx` | Replace `{/* slot: moments */}` with `<MomentsSection />`. |

| Class | Declarations (line) |
|---|---|
| `section` | `max-width: var(--page-max); margin: 0 auto; box-sizing: border-box; padding: 100px var(--gutter) 40px; text-align: center;` (224); `@media (max-width: 767px)`: `padding-top: 64px;` |
| `title` | `margin: 0 auto; font-family: var(--font-display); font-weight: 700; font-size: 44px; line-height: 1.1; max-width: 20ch;` (225); `@media (max-width: 767px)`: `font-size: 34px;` |
| `lead` | `margin: 14px auto 0; font-size: 19px; color: var(--color-ink-soft); max-width: 44ch;` (226) |
| `chips` | `margin-top: 36px; display: flex; flex-wrap: wrap; gap: 16px 18px; justify-content: center;` (227) |
| `chip` | `display: inline-flex; align-items: center; min-height: 52px; padding: 0 24px; border-radius: 20px; font-family: var(--font-hand); font-weight: 700; font-size: 26px; transform: rotate(var(--rot)); transition: transform .2s cubic-bezier(.3,1.4,.5,1);` (229, 44); `.chip:hover`: `transform: rotate(0deg) scale(1.08);` (45) |

Tests in `MomentsSection.test.tsx`:
- `renders the moments section`: a region named `Moments worth keeping` with the lead `A few of the small pages you could make today.`.
- `renders eight moments`: the eight texts from `moments` appear in order, from `Bob’s first day` to `Our new puppy`.

Prerequisites (must be `done`): [add-home-content](add-home-content.md), [add-homepage-shell](add-homepage-shell.md).

Out of scope: links on chips (the moments are not real Memories), other sections.

Security: static, fictional examples (CLAUDE.md rule 5).

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `npm test -w apps/web` passes `renders the moments section` and `renders eight moments`. (AC1, AC5)
- [ ] 2. At 1440 x 900 the section matches mockup lines 223-232 side by side per [ui/homepage.md, Checking fidelity](../../ui/homepage.md#checking-fidelity) (±4 px boxes, exact colors and fonts; [Q008](../../questions/questions-2026-11-10-requirement-breakdown.md#q008-visual-fidelity-tolerance-for-the-homepage) default): centered heading, lead, two rows of tilted chips in pastel colors with 5 px shadows. (AC2)
- [ ] 3. Computed at 1440 px: `h2` 44px; first chip background `rgb(255, 240, 184)`, shadow `rgb(240, 213, 110) 0px 5px 0px 0px`, radius `20px`, font 26px Caveat 700, transform not `none`. (AC2)
- [ ] 4. Hovering a chip makes it `matrix(1.08, 0, 0, 1.08, 0, 0)`; with reduced motion its `transitionDuration` is `0s`. (AC6)
- [ ] 5. At 375 px `h2` is 34px, section top padding 64px, chips wrap centered; at 320 px `scrollWidth <= innerWidth`. (AC7)
- [ ] 6. `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0; no Console errors or warnings on load of `$BASE_URL/`. (AC11)
- [ ] 7. Under `apps/`, the PR changes only the four files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them, none under `apps/api/`). Changes under `docs/` are allowed. (AC10)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated. `Spec:`/`Testids:` per [ADR 0004](../../adr/0004-playwright-e2e-specs.md).

```
E2E-1 -> checklist items 1, 6: unit tests, build, console
Spec: prose (npm commands)
Testids: none
Preconditions: npm install done; app running
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/MomentsSection.test.tsx; echo "t=$?"
  2. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
  3. Open $BASE_URL/ with the DevTools Console open; reload.
Expected: both tests pass, t=0; b=0; step 3 the Console shows no error or warning entries
```

```
E2E-2 -> checklist items 2, 3: look and values
Spec: prose (visual comparison with the mockup)
Testids: none
Preconditions: app running; mockup served at http://localhost:8000/Landing2.dc.html
Steps:
  1. Compare the "Moments worth keeping" section side by side.
  2. In the app Console run: const s=[...document.querySelectorAll('h2')].find(h=>h.textContent==='Moments worth keeping').closest('section'); const c=getComputedStyle([...s.querySelectorAll('span')].find(x=>x.textContent==='Bob’s first day')); [getComputedStyle(s.querySelector('h2')).fontSize, c.backgroundColor, c.boxShadow, c.borderRadius, c.fontSize, c.fontFamily.split(',')[0], c.fontWeight, c.transform !== 'none', s.querySelectorAll('span').length]
Expected: step 1 same; step 2 ["44px","rgb(255, 240, 184)","rgb(240, 213, 110) 0px 5px 0px 0px","20px","26px","Caveat" (quotes allowed),"700",true,8]
```

```
E2E-3 -> checklist item 4: hover and reduced motion
Spec: e2e/specs/homepage/build-moments-section.spec.ts
Testids: none
Preconditions: app running
Steps:
  1. Hover chip "The lake trip"; wait 0.3 s; run: getComputedStyle([...document.querySelectorAll('span')].find(x=>x.textContent==='The lake trip')).transform
  2. Emulate prefers-reduced-motion = reduce; reload; run: getComputedStyle([...document.querySelectorAll('span')].find(x=>x.textContent==='The lake trip')).transitionDuration
Expected: "matrix(1.08, 0, 0, 1.08, 0, 0)"; "0s"
```

```
E2E-4 -> checklist item 5: narrow screen
Spec: e2e/specs/homepage/build-moments-section.spec.ts
Testids: none
Preconditions: app running
Steps:
  1. Set 375 x 812, reload; run: const s=[...document.querySelectorAll('h2')].find(h=>h.textContent==='Moments worth keeping').closest('section'); [getComputedStyle(s.querySelector('h2')).fontSize, getComputedStyle(s).paddingTop]
  2. Set 320 x 640, reload; run: document.documentElement.scrollWidth <= innerWidth
Expected: ["34px","64px"]; true
```

```
E2E-5 -> checklist item 7: PR scope
Spec: prose (git command)
Testids: none
Preconditions: task branch checked out; git fetch origin done
Steps:
  1. Run: git diff --name-only origin/dev-v1...HEAD -- apps/
Expected: exactly apps/web/src/home/MomentsSection.tsx, apps/web/src/home/MomentsSection.module.css, apps/web/src/home/MomentsSection.test.tsx, apps/web/src/home/HomePage.tsx
```

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#page-structure)
