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
- `renders the moments section`: a region named `Moments worth keeping` with the lead `A few of the small pages you could make today.`; the section has no `id` attribute.
- `renders eight moments`: the eight texts from `moments` appear in order, from `Bob’s first day` to `Our new puppy`; `queryAllByRole('link')` is empty.

Prerequisites (must be `done`): [add-home-content](add-home-content.md), [add-homepage-shell](add-homepage-shell.md).

Out of scope: links on chips (the moments are not real Memories), other sections.

Security: static, fictional examples (CLAUDE.md rule 5).

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `npm test -w apps/web` passes `renders the moments section` and `renders eight moments`. (AC1, AC5)
- [ ] 2. At 1440 x 900 the section matches mockup lines 223-232 as measured by the E2E-2 spec (every `Visual:` value holds: computed CSS exact, layout relations within ±4 px, [Q008](../../questions/questions-2026-11-10-requirement-breakdown.md#q008-visual-fidelity-tolerance-for-the-homepage) default; this replaces the mockup-box comparison of [ui/homepage.md, Checking fidelity](../../ui/homepage.md#checking-fidelity) step 4, which stays an optional reviewer check, [Q015](../../questions/questions-2026-11-10-requirement-breakdown.md#q015-do-the-measured-visual-assertions-replace-the-mockup-bounding-box-comparison) A): centered heading, lead, two rows of tilted chips in pastel colors with 5 px shadows. (AC2)
- [ ] 3. Computed at 1440 px: `h2` 44px; first chip background `rgb(255, 240, 184)`, shadow `rgb(240, 213, 110) 0px 5px 0px 0px`, radius `20px`, font 26px Caveat 700, transform not `none`. (AC2)
- [ ] 4. Hovering a chip makes it `matrix(1.08, 0, 0, 1.08, 0, 0)`; with reduced motion its `transitionDuration` is `0s`. (AC6)
- [ ] 5. At 375 px `h2` is 34px, section top padding 64px, chips wrap centered (chips container `justify-content: center`, every chip's box within `0..innerWidth`); at 320 px `scrollWidth <= innerWidth` and the clip check from [ui/homepage.md, Responsive rules](../../ui/homepage.md#responsive-rules) returns `0`. (AC7)
- [ ] 6. `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0; no Console errors or warnings on load of `$BASE_URL/`. (AC11)
- [ ] 7. Under `apps/`, the PR changes only the four files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them, none under `apps/api/`). Changes under `docs/` are allowed. (AC10)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated. `Spec:`/`Testids:` per [ADR 0004](../../adr/0004-playwright-e2e-specs.md). Every case is `Auth: none` and `Data: none` (public, static page). `Visual:` values appear only on the mockup case (E2E-2); under [ADR 0005](../../adr/0005-e2e-signed-in-data-writing-and-visual-specs.md) (accepted) it is a spec in this ticket's spec file, asserted per [ui/homepage.md, Visual assertions](../../ui/homepage.md#visual-assertions) (`toHaveCSS`, bounding boxes, no screenshots); viewports per [ui/homepage.md, Test case fields](../../ui/homepage.md#test-case-fields). The fixed computed values at 1440 x 900 need no mockup, so they are a spec case of their own (E2E-6, `Visual: none`).

```
E2E-1 -> checklist items 1, 6: unit tests, build, console
Spec: prose (npm commands)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: npm install done; app running
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/MomentsSection.test.tsx; echo "t=$?"
  2. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
  3. Open $BASE_URL/ with the DevTools Console open; reload.
Expected: both tests pass, t=0; b=0; step 3 the Console shows no error or warning entries
```

```
E2E-2 -> checklist item 2: mockup values, measured
Spec: e2e/specs/homepage/build-moments-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: at 1280 and 1440 wide: section padding 100px 40px 40px, text centered; h2 Fredoka 700 44px, line height 48.4px, max width 20ch; lead 19px rgb(90, 60, 75), margin-top 14px; chips margin-top 36px, gap 16px 18px, centered, two rows; chip min height 52px, padding 0px 24px, radius 20px, Caveat 700 26px; first chip background rgb(255, 240, 184), box shadow rgb(240, 213, 110) 0px 5px 0px 0px, rotated -3deg; last chip background rgb(214, 241, 228), rotated 2deg. At 390 wide: h2 34px; section padding 64px 20px 40px; chips wrap centered
Preconditions: app running; reduced motion emulated (no mockup opened)
Steps:
  1. At 1440 x 900, then at 1280 x 900: assert every "at 1280 and 1440 wide" value of Visual on the element it names (the section whose h2 is "Moments worth keeping"), per ui/homepage.md, Visual assertions.
  2. At 390 x 900: assert every "At 390 wide" value of Visual the same way.
Expected: every Visual value holds: computed CSS strings exactly as written, first chip rotated -3deg and last chip 2deg within ±0.5deg, chips centered in two rows at 1280 and 1440, chips wrap centered at 390, per the ±4 px rules
```

```
E2E-6 -> checklist item 3: computed values
Spec: e2e/specs/homepage/build-moments-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running, 1440 x 900 (no mockup opened)
Steps:
  1. In the Console run: const s=[...document.querySelectorAll('h2')].find(h=>h.textContent==='Moments worth keeping').closest('section'); const c=getComputedStyle([...s.querySelectorAll('span')].find(x=>x.textContent==='Bob’s first day')); [getComputedStyle(s.querySelector('h2')).fontSize, c.backgroundColor, c.boxShadow, c.borderRadius, c.fontSize, c.fontFamily.split(',')[0], c.fontWeight, c.transform !== 'none', s.querySelectorAll('span').length]
Expected: ["44px","rgb(255, 240, 184)","rgb(240, 213, 110) 0px 5px 0px 0px","20px","26px","Caveat" (quotes allowed),"700",true,8]
```

```
E2E-3 -> checklist item 4: hover and reduced motion
Spec: e2e/specs/homepage/build-moments-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
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
Auth: none
Data: none
Visual: none
Preconditions: app running
Steps:
  1. Set 375 x 812, reload; run: const s=[...document.querySelectorAll('h2')].find(h=>h.textContent==='Moments worth keeping').closest('section'); const chips=[...s.querySelectorAll('span')]; [getComputedStyle(s.querySelector('h2')).fontSize, getComputedStyle(s).paddingTop, getComputedStyle(chips[0].parentElement).justifyContent, chips.every(c => { const r=c.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth })]
  2. Set 320 x 640, reload, wait 3 s; run: [document.documentElement.scrollWidth <= innerWidth, [...document.querySelectorAll('header *, main *, footer *')].filter(e => !e.closest('[aria-hidden="true"]') && e.getBoundingClientRect().width > 0 && (e.getBoundingClientRect().left < -0.5 || e.getBoundingClientRect().right > innerWidth + 0.5)).length]
Expected: ["34px","64px","center",true]; [true, 0]
```

```
E2E-5 -> checklist item 7: PR scope
Spec: prose (git command)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: task branch checked out; git fetch origin done
Steps:
  1. Run: git diff --name-only origin/dev-v1...HEAD -- apps/
Expected: exactly apps/web/src/home/MomentsSection.tsx, apps/web/src/home/MomentsSection.module.css, apps/web/src/home/MomentsSection.test.tsx, apps/web/src/home/HomePage.tsx
```

## unit-tests

Vitest + Testing Library, colocated in `apps/web/src/home/MomentsSection.test.tsx` (the two tests named in Scope). Render only; no network.

Unit: `MomentsSection` (`apps/web/src/home/MomentsSection.tsx`).

| ID | Case: input -> expected | Checklist |
|---|---|---|
| U-1 | `renders the moments section`: `render(<MomentsSection />)` -> region named `Moments worth keeping` containing `A few of the small pages you could make today.`; edge: the section has no `id` (the mockup has none, so no nav link can target it) | 1 |
| U-2 | `renders eight moments`: -> the eight `moments` texts in order, first `Bob’s first day` (U+2019), last `Our new puppy`; edge: no link inside the section (the moments are not real Memories) | 1 |

Rotation, hover and responsive values are browser checks (E2E-2 to E2E-4).

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#page-structure)
