# Build audiences section

- Status: not-started

## Goal

Add the "Who it is for" section (`#who`): centered heading and lead, then three colored audience cards (faces, title, text, handwritten example) that lift on hover.

## Scope

Area: UI. Mockup lines 144-164 (values), 30 and 40-43 (bob keyframes, card hover). Data from `content.ts` (`sectionText.who`, `audiences`); `Face` from `illustrations.tsx`. Rules: [ui/homepage.md](../../ui/homepage.md) (Typography, Responsive rules, Motion).

| File | Change |
|---|---|
| `apps/web/src/home/AudiencesSection.tsx` (new) | `export function AudiencesSection()`. Markup: `section.section#who[aria-labelledby="who-title"]` > `div.head` (`h2#who-title.title`, `p.lead`) + `div.grid` > one `article.card` per `audiences` item (key = title) with `style={{ background: a.bg, boxShadow: \`0 8px 0 ${a.shadow}\` }}` > `div.faces[aria-hidden="true"]` (one `<Face bg size />` per `a.faces`), `h3.cardTitle`, `p.cardText`, `div.example`. |
| `apps/web/src/home/AudiencesSection.module.css` (new) | Values below. |
| `apps/web/src/home/AudiencesSection.test.tsx` (new) | Tests below. |
| `apps/web/src/home/HomePage.tsx` | Replace `{/* slot: audiences */}` with `<AudiencesSection />`. |

| Class | Declarations (line) |
|---|---|
| `section` | `max-width: var(--page-max); margin: 0 auto; box-sizing: border-box; padding: 104px var(--gutter) 40px;` (145); `@media (max-width: 767px)`: `padding-top: 64px;` |
| `head` | `text-align: center;` (146) |
| `title` | `margin: 0 auto; font-family: var(--font-display); font-weight: 700; font-size: 48px; line-height: 1.08; letter-spacing: -0.01em; max-width: 20ch;` (147); `@media (max-width: 767px)`: `font-size: 34px;` |
| `lead` | `margin: 18px auto 0; font-size: 20px; color: var(--color-ink-soft); max-width: 46ch;` (148) |
| `grid` | `margin-top: 52px; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 28px;` (150) |
| `card` | `border-radius: var(--radius-card); padding: 28px 28px 32px; display: flex; flex-direction: column; gap: 14px; transition: transform .25s cubic-bezier(.3,1.4,.5,1);` (40, 152); `.card:hover`: `transform: translateY(-8px) rotate(-1deg);` (41) |
| `faces` | `display: flex; align-items: flex-end; gap: 6px; height: 96px;` (153); `.card:hover .faces svg`: `animation: bob .6s ease-in-out infinite;` with `.faces svg:nth-child(2)` delay `.1s`, `:nth-child(3)` delay `.2s` (42-43) |
| `cardTitle` | `margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 28px; line-height: 1.15;` (158) |
| `cardText` | `margin: 0; font-size: 17px; color: var(--color-ink-body);` (159) |
| `example` | `margin-top: auto; padding-top: 6px; font-family: var(--font-hand); font-weight: 700; font-size: 24px; color: var(--color-link-hover);` (160) |
| keyframes | `bob` copied from line 30 |

Tests in `AudiencesSection.test.tsx`:
- `renders the who section`: `container.querySelector('section#who')` exists; `getByRole('heading', { level: 2 })` has the `sectionText.who.title` text; the section is labelled by it (`getByRole('region', { name: sectionText.who.title })`).
- `renders three audience cards`: `getAllByRole('article')` length 3; level-3 headings are `Families`, `Little ones`, `Neighborhoods and friends`; the examples `Grandpa’s garden`, `Mia, one to ten`, `Maple Street party` are shown; `queryAllByRole('link')` is empty.

Prerequisites (must be `done`): [add-home-content](add-home-content.md), [add-home-illustrations](add-home-illustrations.md), [add-homepage-shell](add-homepage-shell.md).

Out of scope: links on cards (the examples are not links), other sections.

Security: static text; fictional examples only (CLAUDE.md rule 5).

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `npm test -w apps/web` passes `renders the who section` and `renders three audience cards`. (AC1, AC5)
- [ ] 2. At 1440 x 900 the section matches mockup lines 144-164 as measured by the E2E-2 spec (every `Visual:` value holds: computed CSS exact, layout relations within ±4 px, [Q008](../../questions/questions-2026-11-10-requirement-breakdown.md#q008-visual-fidelity-tolerance-for-the-homepage) default; this replaces the mockup-box comparison of [ui/homepage.md, Checking fidelity](../../ui/homepage.md#checking-fidelity) step 4, which stays an optional reviewer check, [Q015](../../questions/questions-2026-11-10-requirement-breakdown.md#q015-do-the-measured-visual-assertions-replace-the-mockup-bounding-box-comparison) A): centered heading and lead, three equal cards in one row with peach, yellow and mint backgrounds and hard 8 px shadows. (AC2)
- [ ] 3. Computed at 1440 px: `h2` 48px Fredoka 700; first card background `rgb(255, 225, 204)`, box shadow `rgb(242, 190, 152) 0px 8px 0px 0px`, border radius `32px`; card `h3` 28px; example 24px Caveat `rgb(140, 31, 72)`. (AC2)
- [ ] 4. Hovering a card lifts and tilts it (`translateY(-8px) rotate(-1deg)`: computed `transform` matches `/^matrix\(0\.9998\d*, -0\.01745\d*, 0\.01745\d*, 0\.9998\d*, 0, -8\)$/`) and its faces bob; with reduced motion emulated the card's `transitionDuration` is `0s` and the faces do not animate. (AC6)
- [ ] 5. At 375 px the cards stack in one column, `h2` is 34px, section top padding is 64px, and at 320 px `scrollWidth <= innerWidth` and the clip check from [ui/homepage.md, Responsive rules](../../ui/homepage.md#responsive-rules) returns `0`. (AC7)
- [ ] 6. Opening `$BASE_URL/#who` scrolls the page so this section starts in the upper half of the viewport (the nav link uses this anchor). (AC3)
- [ ] 7. `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0; no Console errors or warnings on load of `$BASE_URL/`. (AC11)
- [ ] 8. Under `apps/`, the PR changes only the four files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them, none under `apps/api/`). Changes under `docs/` are allowed. (AC10)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated. `Spec:`/`Testids:` per [ADR 0004](../../adr/0004-playwright-e2e-specs.md). Every case is `Auth: none` and `Data: none` (public, static page). `Visual:` values appear only on the mockup case (E2E-2); under [ADR 0005](../../adr/0005-e2e-signed-in-data-writing-and-visual-specs.md) (accepted) it is a spec in this ticket's spec file, asserted per [ui/homepage.md, Visual assertions](../../ui/homepage.md#visual-assertions) (`toHaveCSS`, bounding boxes, no screenshots), with one by-eye prose step for decorative positions not listed in `Visual:`; viewports per [ui/homepage.md, Test case fields](../../ui/homepage.md#test-case-fields). The fixed computed values at 1440 x 900 need no mockup, so they are a spec case of their own (E2E-6, `Visual: none`).

```
E2E-1 -> checklist items 1, 7: unit tests, build, console
Spec: prose (npm commands)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: npm install done; app running
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/AudiencesSection.test.tsx; echo "t=$?"
  2. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
  3. Open $BASE_URL/ with the DevTools Console open; reload.
Expected: both tests pass, t=0; b=0; step 3 the Console shows no error or warning entries
```

```
E2E-2 -> checklist item 2: mockup values, measured
Spec: e2e/specs/homepage/build-audiences-section.spec.ts (steps 1-2, the Visual values; step 3, decorative positions by eye, runs as prose)
Testids: none
Auth: none
Data: none
Visual: at 1280 and 1440 wide: section padding 104px 40px 40px; h2 Fredoka 700 48px, line height 51.84px, centered, max width 20ch; lead 20px rgb(90, 60, 75), margin-top 18px; grid margin-top 52px, 3 equal columns, gap 28px; card radius 32px, padding 28px 28px 32px; card backgrounds in order rgb(255, 225, 204), rgb(255, 240, 184), rgb(214, 241, 228); box shadows rgb(242, 190, 152) 0px 8px 0px 0px, rgb(240, 213, 110) 0px 8px 0px 0px, rgb(159, 216, 189) 0px 8px 0px 0px; faces row height 96px, first card faces 92px, 70px, 52px; h3 Fredoka 600 28px; card text 17px rgb(74, 48, 64); example Caveat 700 24px rgb(140, 31, 72). At 390 wide: 1 column; h2 34px; section padding 64px 20px 40px
Preconditions: app running; reduced motion emulated; for step 3 only, mockup served at http://localhost:8000/Landing2.dc.html in a second tab at 1440 x 900
Steps:
  1. At 1440 x 900, then at 1280 x 900: assert every "at 1280 and 1440 wide" value of Visual on the element it names (inside section #who), per ui/homepage.md, Visual assertions.
  2. At 390 x 900: assert every "At 390 wide" value of Visual the same way.
  3. (prose) At 1440 x 900, compare by eye with the mockup only the arrangement of the faces inside each card's faces row.
Expected: steps 1-2 every Visual value holds: computed CSS strings exactly as written, sizes exact, h2 centered and 3 equal columns (1 column at 390) within the ±4 px rules; step 3 same arrangement as the mockup
```

```
E2E-6 -> checklist item 3: computed values
Spec: e2e/specs/homepage/build-audiences-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running, 1440 x 900 (no mockup opened)
Steps:
  1. In the Console run: const s=document.getElementById('who'); const a=getComputedStyle(s.querySelector('article')); const ex=s.querySelector('article > div:last-child'); [getComputedStyle(s.querySelector('h2')).fontSize, getComputedStyle(s.querySelector('h2')).fontFamily.split(',')[0], getComputedStyle(s.querySelector('h2')).fontWeight, a.backgroundColor, a.boxShadow, a.borderRadius, getComputedStyle(s.querySelector('h3')).fontSize, getComputedStyle(ex).fontSize, getComputedStyle(ex).fontFamily.split(',')[0], getComputedStyle(ex).color, s.querySelectorAll('article').length]
Expected: ["48px","Fredoka" (quotes allowed),"700","rgb(255, 225, 204)","rgb(242, 190, 152) 0px 8px 0px 0px","32px","28px","24px","Caveat" (quotes allowed),"rgb(140, 31, 72)",3]
```

```
E2E-3 -> checklist item 4: hover and reduced motion
Spec: e2e/specs/homepage/build-audiences-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running
Steps:
  1. Hover the first card; wait 0.3 s; run: [getComputedStyle(document.querySelector('#who article')).transform, document.querySelector('#who article').getAnimations({subtree:true}).length]
  2. Emulate prefers-reduced-motion = reduce; reload; hover the first card; run the same command plus getComputedStyle(document.querySelector('#who article')).transitionDuration
Expected: step 1 [transform matching /^matrix\(0\.9998\d*, -0\.01745\d*, 0\.01745\d*, 0\.9998\d*, 0, -8\)$/ (Chrome prints "matrix(0.999848, -0.0174524, 0.0174524, 0.999848, 0, -8)"), 3]; step 2 [transform matching the same pattern (the hover applies instantly), 0] and "0s"
```

```
E2E-4 -> checklist items 5, 6: narrow screen and anchor
Spec: e2e/specs/homepage/build-audiences-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running
Steps:
  1. Set 375 x 812, reload; run: const s=document.getElementById('who'); [new Set([...s.querySelectorAll('article')].map(a=>a.getBoundingClientRect().left)).size, getComputedStyle(s.querySelector('h2')).fontSize, getComputedStyle(s).paddingTop]
  2. Set 320 x 640, reload, wait 3 s; run: [document.documentElement.scrollWidth <= innerWidth, [...document.querySelectorAll('header *, main *, footer *')].filter(e => !e.closest('[aria-hidden="true"]') && e.getBoundingClientRect().width > 0 && (e.getBoundingClientRect().left < -0.5 || e.getBoundingClientRect().right > innerWidth + 0.5)).length]
  3. Set 1440 x 900, open $BASE_URL/#who in a new tab; run: [scrollY > 0, document.getElementById('who').getBoundingClientRect().top >= -1, document.getElementById('who').getBoundingClientRect().top < innerHeight / 2]
Expected: [1, "34px", "64px"]; [true, 0]; [true, true, true]
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
Expected: exactly apps/web/src/home/AudiencesSection.tsx, apps/web/src/home/AudiencesSection.module.css, apps/web/src/home/AudiencesSection.test.tsx, apps/web/src/home/HomePage.tsx
```

## unit-tests

Vitest + Testing Library, colocated in `apps/web/src/home/AudiencesSection.test.tsx` (the two tests named in Scope). Render only; no network.

Unit: `AudiencesSection` (`apps/web/src/home/AudiencesSection.tsx`).

| ID | Case: input -> expected | Checklist |
|---|---|---|
| U-1 | `renders the who section`: `render(<AudiencesSection />)` -> `section#who` exists; the only level-2 heading has `sectionText.who.title`; `getByRole('region', { name: sectionText.who.title })` finds the section (edge: a missing `aria-labelledby` makes it not a region and fails) | 1, 6 |
| U-2 | `renders three audience cards`: -> 3 `article`s; level-3 headings `Families`, `Little ones`, `Neighborhoods and friends` in order; examples `Grandpa’s garden` (U+2019), `Mia, one to ten`, `Maple Street party`; edge: no link inside the section | 1 |

Card colors, hover and responsive values are browser checks (E2E-2 to E2E-4).

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#page-structure)
