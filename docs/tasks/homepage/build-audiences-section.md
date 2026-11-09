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
- `renders three audience cards`: `getAllByRole('article')` length 3; level-3 headings are `Families`, `Little ones`, `Neighborhoods and friends`; the examples `Grandpa’s garden`, `Mia, one to ten`, `Maple Street party` are shown.

Prerequisites (must be `done`): [add-home-content](add-home-content.md), [add-home-illustrations](add-home-illustrations.md), [add-homepage-shell](add-homepage-shell.md).

Out of scope: links on cards (the examples are not links), other sections.

Security: static text; fictional examples only (CLAUDE.md rule 5).

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `npm test -w apps/web` passes `renders the who section` and `renders three audience cards`. (AC1, AC5)
- [ ] 2. At 1440 x 900 the section matches mockup lines 144-164 side by side: centered heading and lead, three equal cards in one row with peach, yellow and mint backgrounds and hard 8 px shadows. (AC2)
- [ ] 3. Computed at 1440 px: `h2` 48px Fredoka 700; first card background `rgb(255, 225, 204)`, box shadow `rgb(242, 190, 152) 0px 8px 0px 0px`, border radius `32px`; card `h3` 28px; example 24px Caveat `rgb(140, 31, 72)`. (AC2)
- [ ] 4. Hovering a card lifts and tilts it (`transform` not `none`) and its faces bob; with reduced motion emulated the card's `transitionDuration` is `0s` and the faces do not animate. (AC6)
- [ ] 5. At 375 px the cards stack in one column, `h2` is 34px, section top padding is 64px, and at 320 px `scrollWidth <= innerWidth`. (AC7)
- [ ] 6. Opening `$BASE_URL/#who` scrolls the page so this section starts in the upper half of the viewport (the nav link uses this anchor). (AC3)
- [ ] 7. `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0; no Console errors. (AC11)
- [ ] 8. Under `apps/`, the PR changes only the four files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them, none under `apps/api/`). Changes under `docs/` are allowed. (AC10)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated.

```
E2E-1 -> checklist items 1, 7: unit tests, build
Preconditions: npm install done
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/AudiencesSection.test.tsx; echo "t=$?"
  2. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
Expected: both tests pass, t=0; b=0
```

```
E2E-2 -> checklist items 2, 3: look and values
Preconditions: app running; mockup served at http://localhost:8000/Landing2.dc.html
Steps:
  1. Compare the "Who it is for" section side by side.
  2. In the app Console run: const s=document.getElementById('who'); const a=getComputedStyle(s.querySelector('article')); const ex=s.querySelector('article > div:last-child'); [getComputedStyle(s.querySelector('h2')).fontSize, a.backgroundColor, a.boxShadow, a.borderRadius, getComputedStyle(s.querySelector('h3')).fontSize, getComputedStyle(ex).fontSize, getComputedStyle(ex).fontFamily.split(',')[0], getComputedStyle(ex).color, s.querySelectorAll('article').length]
Expected: step 1 same layout, colors, sizes; step 2 ["48px","rgb(255, 225, 204)","rgb(242, 190, 152) 0px 8px 0px 0px","32px","28px","24px","Caveat" (quotes allowed),"rgb(140, 31, 72)",3]
```

```
E2E-3 -> checklist item 4: hover and reduced motion
Preconditions: app running
Steps:
  1. Hover the first card; wait 0.3 s; run: [getComputedStyle(document.querySelector('#who article')).transform, document.querySelector('#who article').getAnimations({subtree:true}).length]
  2. Emulate prefers-reduced-motion = reduce; reload; hover the first card; run the same command plus getComputedStyle(document.querySelector('#who article')).transitionDuration
Expected: step 1 [a matrix value, 3]; step 2 [a matrix value, 0] and "0s"
```

```
E2E-4 -> checklist items 5, 6: narrow screen and anchor
Preconditions: app running
Steps:
  1. Set 375 x 812, reload; run: const s=document.getElementById('who'); [new Set([...s.querySelectorAll('article')].map(a=>a.getBoundingClientRect().left)).size, getComputedStyle(s.querySelector('h2')).fontSize, getComputedStyle(s).paddingTop]
  2. Set 320 x 640, reload; run: document.documentElement.scrollWidth <= innerWidth
  3. Set 1440 x 900, open $BASE_URL/#who in a new tab; run: [scrollY > 0, document.getElementById('who').getBoundingClientRect().top >= -1, document.getElementById('who').getBoundingClientRect().top < innerHeight / 2]
Expected: [1, "34px", "64px"]; true; [true, true, true]
```

```
E2E-5 -> checklist item 8: PR scope
Preconditions: task branch checked out; git fetch origin done
Steps:
  1. Run: git diff --name-only origin/dev-v1...HEAD -- apps/
Expected: exactly apps/web/src/home/AudiencesSection.tsx, apps/web/src/home/AudiencesSection.module.css, apps/web/src/home/AudiencesSection.test.tsx, apps/web/src/home/HomePage.tsx
```

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#page-structure)
