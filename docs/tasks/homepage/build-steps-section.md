# Build steps section

- Status: not-started

## Goal

Add the "How it works" section (`#how`): heading and an ordered list of four white step cards with dashed colored borders and a round number badge that spins on hover.

## Scope

Area: UI. Mockup lines 166-178 (values), 19 and 46-48 (spin keyframes, step hover). Data from `content.ts` (`sectionText.how`, `steps`). Rules: [ui/homepage.md](../../ui/homepage.md).

| File | Change |
|---|---|
| `apps/web/src/home/StepsSection.tsx` (new) | `export function StepsSection()`. Markup: `section.section#how[aria-labelledby="how-title"]` > `h2#how-title.title` + `ol.list` > one `li.step` per `steps` item (key = `n`) with `style={{ borderColor: s.line }}` > `span.num[aria-hidden="true"]` with `style={{ background: s.bg }}` and text `s.n`, `h3.stepTitle`, `p.stepText`. |
| `apps/web/src/home/StepsSection.module.css` (new) | Values below. |
| `apps/web/src/home/StepsSection.test.tsx` (new) | Tests below. |
| `apps/web/src/home/HomePage.tsx` | Replace `{/* slot: steps */}` with `<StepsSection />`. |

| Class | Declarations (line) |
|---|---|
| `section` | `max-width: var(--page-max); margin: 0 auto; box-sizing: border-box; padding: 88px var(--gutter) 96px;` (167); `@media (max-width: 767px)`: `padding-top: 64px; padding-bottom: 64px;` |
| `title` | `margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 48px; line-height: 1.08; letter-spacing: -0.01em; max-width: 18ch;` (168); `@media (max-width: 767px)`: `font-size: 34px;` |
| `list` | `list-style: none; margin: 52px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 28px;` (169) |
| `step` | `position: relative; background: var(--color-white); border-radius: var(--radius-panel); padding: 64px 24px 28px; border-width: 2.5px; border-style: dashed; transition: transform .25s ease;` (46, 171); `.step:hover`: `transform: translateY(-6px);` (47) |
| `num` | `position: absolute; left: 24px; top: -26px; width: 64px; height: 64px; border-radius: 50%; border: 4px solid var(--color-page); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 700; font-size: 30px; color: var(--color-ink);` (172); `.step:hover .num`: `animation: spin .6s ease-in-out;` (48) |
| `stepTitle` | `margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 24px; line-height: 1.2;` (173) |
| `stepText` | `margin: 8px 0 0; font-size: 17px; color: var(--color-ink-body);` (174) |
| keyframes | `spin` copied from line 19 |

Note: `num` sets `border` with `var(--color-page)` and the inline style only sets `background`, so the step's `borderColor` inline style does not affect it.

Tests in `StepsSection.test.tsx`:
- `renders the how section`: `section#how` exists and is a region named by `sectionText.how.title`.
- `renders four ordered steps`: one `list` role element that is an `OL`; `getAllByRole('listitem')` length 4; level-3 headings `Sign in with Google`, `Choose a template`, `Add photos and words`, `Publish and share` in order; every number badge `span` has `aria-hidden="true"`.

Prerequisites (must be `done`): [add-home-content](add-home-content.md), [add-homepage-shell](add-homepage-shell.md).

Out of scope: links inside steps, real wizard or sign-in behavior.

Security: static text only.

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `npm test -w apps/web` passes `renders the how section` and `renders four ordered steps`. (AC1, AC5)
- [ ] 2. At 1440 x 900 the section matches mockup lines 166-178 as measured by the E2E-2 spec (every `Visual:` value holds: computed CSS exact, layout relations within ±4 px, [Q008](../../questions/questions-2026-11-10-requirement-breakdown.md#q008-visual-fidelity-tolerance-for-the-homepage) default; this replaces the mockup-box comparison of [ui/homepage.md, Checking fidelity](../../ui/homepage.md#checking-fidelity) step 4, which stays an optional reviewer check, [Q015](../../questions/questions-2026-11-10-requirement-breakdown.md#q015-do-the-measured-visual-assertions-replace-the-mockup-bounding-box-comparison) A): left-aligned heading, four white cards in one row, dashed borders in yellow, peach, mint, blue, number circles overlapping the top edge. (AC2)
- [ ] 3. Computed at 1440 px: first `li` border `2px dashed rgb(240, 213, 110)` (the CSS keeps the mockup's `2.5px`; Chromium floors border widths to whole device pixels, so at device scale factor 1 `getComputedStyle` reports `2px` and the mockup paints the same 2 px border), radius `28px`, padding top `64px`; its number circle 64 x 64, background `rgb(255, 201, 60)`, border `4px solid rgb(255, 247, 234)`, font size `30px`. (AC2)
- [ ] 4. Hovering a step lifts it 6 px (`matrix(1, 0, 0, 1, 0, -6)`) and starts one `spin` animation of 600 ms on its number circle (iteration count 1); with reduced motion the step's `transitionDuration` is `0s` and no animation runs. (AC6)
- [ ] 5. At 375 px the steps stack, `h2` is 34px, section padding top and bottom 64px; number circles are fully visible; at 320 px `scrollWidth <= innerWidth` and the clip check from [ui/homepage.md, Responsive rules](../../ui/homepage.md#responsive-rules) returns `0`. (AC7)
- [ ] 6. Opening `$BASE_URL/#how` scrolls the page so this section starts in the upper half of the viewport. (AC3)
- [ ] 7. `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0; no Console errors or warnings on load of `$BASE_URL/`. (AC11)
- [ ] 8. Under `apps/`, the PR changes only the four files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them, none under `apps/api/`). Changes under `docs/` are allowed. (AC10)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated. `Spec:`/`Testids:` per [ADR 0004](../../adr/0004-playwright-e2e-specs.md); when only some steps run in the browser, the brackets name the steps the spec covers and the other steps run as prose. Every case is `Auth: none` and `Data: none` (public, static page). `Visual:` values appear only on the mockup case (E2E-2); under [ADR 0005](../../adr/0005-e2e-signed-in-data-writing-and-visual-specs.md) (accepted) it is a spec in this ticket's spec file, asserted per [ui/homepage.md, Visual assertions](../../ui/homepage.md#visual-assertions) (`toHaveCSS`, bounding boxes, no screenshots); viewports per [ui/homepage.md, Test case fields](../../ui/homepage.md#test-case-fields). The fixed computed values at 1440 x 900 need no mockup, so they are a spec case of their own (E2E-6, `Visual: none`).

```
E2E-1 -> checklist items 1, 7: unit tests, build, console
Spec: prose (npm commands)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: npm install done; app running
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/StepsSection.test.tsx; echo "t=$?"
  2. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
  3. Open $BASE_URL/ with the DevTools Console open; reload.
Expected: both tests pass, t=0; b=0; step 3 the Console shows no error or warning entries
```

```
E2E-2 -> checklist item 2: mockup values, measured
Spec: e2e/specs/homepage/build-steps-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: at 1280 and 1440 wide: section padding 88px 40px 96px; h2 Fredoka 700 48px, left-aligned, max width 18ch; list margin-top 52px, 4 equal columns, gap 28px; each step background rgb(255, 255, 255), radius 28px, padding 64px 24px 28px, border computed 2px dashed (CSS 2.5px, floored by Chromium at device scale factor 1, same in the mockup) in order rgb(240, 213, 110), rgb(242, 190, 152), rgb(159, 216, 189), rgb(169, 212, 242); number circle 64 x 64 px at left 24px, top -26px, background in order rgb(255, 201, 60), rgb(255, 178, 122), rgb(154, 219, 187), rgb(156, 208, 245), border 4px solid rgb(255, 247, 234), Fredoka 700 30px; h3 Fredoka 600 24px; step text 17px rgb(74, 48, 64), margin-top 8px. At 390 wide: 1 column; h2 34px; section padding 64px 20px 64px
Preconditions: app running; reduced motion emulated (no mockup opened)
Steps:
  1. At 1440 x 900, then at 1280 x 900: assert every "at 1280 and 1440 wide" value of Visual on the element it names (inside section #how), per ui/homepage.md, Visual assertions.
  2. At 390 x 900: assert every "At 390 wide" value of Visual the same way.
Expected: every Visual value holds: computed CSS strings exactly as written (border 2px dashed, not 2.5px), sizes exact, h2 left-aligned and 4 equal columns (1 column at 390) within the ±4 px rules
```

```
E2E-6 -> checklist item 3: computed values
Spec: e2e/specs/homepage/build-steps-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running, 1440 x 900 (no mockup opened)
Steps:
  1. In the Console run: const li=document.querySelector('#how li'); const l=getComputedStyle(li); const n=getComputedStyle(li.querySelector('span')); [l.borderTopWidth, l.borderTopStyle, l.borderTopColor, l.borderRadius, l.paddingTop, n.width, n.height, n.backgroundColor, n.borderTopWidth, n.borderTopStyle, n.borderTopColor, n.fontSize, document.querySelectorAll('#how li').length]
Expected: ["2px","dashed","rgb(240, 213, 110)","28px","64px","64px","64px","rgb(255, 201, 60)","4px","solid","rgb(255, 247, 234)","30px",4]
```

```
E2E-3 -> checklist item 4: hover and reduced motion
Spec: e2e/specs/homepage/build-steps-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running
Steps:
  1. Hover the first step; within 0.3 s run: document.querySelector('#how li span').getAnimations().map(a => [/spin/.test(a.animationName), a.effect.getTiming().duration, a.effect.getTiming().iterations])
  2. Keep hovering; wait 0.3 s more; run: [getComputedStyle(document.querySelector('#how li')).transform]
  3. Emulate prefers-reduced-motion = reduce; reload; hover the first step; run: [getComputedStyle(document.querySelector('#how li')).transitionDuration, document.getAnimations().length]
Expected: step 1 [[true, 600, 1]] (CSS Modules may prefix the keyframe name, hence the regex); step 2 ["matrix(1, 0, 0, 1, 0, -6)"]; step 3 ["0s", 0]
```

```
E2E-4 -> checklist items 5, 6: narrow screen and anchor
Spec: e2e/specs/homepage/build-steps-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running
Steps:
  1. Set 375 x 812, reload; run: const s=document.getElementById('how'); [new Set([...s.querySelectorAll('li')].map(x=>x.getBoundingClientRect().left)).size, getComputedStyle(s.querySelector('h2')).fontSize, getComputedStyle(s).paddingTop, getComputedStyle(s).paddingBottom]
  2. Set 320 x 640, reload, wait 3 s; run: [document.documentElement.scrollWidth <= innerWidth, [...document.querySelectorAll('header *, main *, footer *')].filter(e => !e.closest('[aria-hidden="true"]') && e.getBoundingClientRect().width > 0 && (e.getBoundingClientRect().left < -0.5 || e.getBoundingClientRect().right > innerWidth + 0.5)).length]
  3. Set 1440 x 900, open $BASE_URL/#how in a new tab; run: const t=document.getElementById('how').getBoundingClientRect().top; [scrollY > 0, t >= -1, t < innerHeight / 2]
Expected: [1, "34px", "64px", "64px"]; [true, 0]; [true, true, true]
```

```
E2E-5 -> checklist item 8: PR scope
Spec: prose (git command)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: task branch checked out; git fetch origin done
Steps:
  1. Run: git diff --name-only origin/dev-v1...HEAD -- apps/
Expected: exactly apps/web/src/home/StepsSection.tsx, apps/web/src/home/StepsSection.module.css, apps/web/src/home/StepsSection.test.tsx, apps/web/src/home/HomePage.tsx
```

## unit-tests

Vitest + Testing Library, colocated in `apps/web/src/home/StepsSection.test.tsx` (the two tests named in Scope). Render only; no network.

Unit: `StepsSection` (`apps/web/src/home/StepsSection.tsx`).

| ID | Case: input -> expected | Checklist |
|---|---|---|
| U-1 | `renders the how section`: `render(<StepsSection />)` -> `section#how` exists and `getByRole('region', { name: sectionText.how.title })` finds it | 1, 6 |
| U-2 | `renders four ordered steps`: -> exactly one `list` whose `tagName` is `OL` (a `ul` fails); 4 `listitem`s; level-3 headings `Sign in with Google`, `Choose a template`, `Add photos and words`, `Publish and share` in that order; the number badges are `aria-hidden="true"` so they are not read twice | 1 |

Hover, spin and responsive values are browser checks (E2E-2 to E2E-4).

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#page-structure)
