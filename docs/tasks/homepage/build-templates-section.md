# Build templates section

- Status: not-started

## Goal

Add the "Templates" section (`#templates`) on its white rounded band: heading with side text, three example template cards (drawn preview, name, description, block count) and the tilted "Made from building blocks" chips.

## Scope

Area: UI. Mockup lines 180-221 (values), 40-41 and 44-45 (card and chip hover). Data from `content.ts` (`sectionText.templates`, `templateExamples`, `blockCountSuffix`, `blocksLabel`, `blockChips`). Rules: [ui/homepage.md](../../ui/homepage.md). The cards are illustrations, not real Templates ([homepage](../../features/homepage.md) Behavior).

| File | Change |
|---|---|
| `apps/web/src/home/TemplatesSection.tsx` (new) | `export function TemplatesSection()`. Markup: `div.band` > `section.section#templates[aria-labelledby="templates-title"]` > `div.head` (`h2#templates-title.title`, `p.lead`) + `div.grid` (one `article.card` per `templateExamples` item, key = name, `style={{ background: t.paper, boxShadow: \`0 8px 0 ${t.shadow}\` }}` > `div.preview[aria-hidden="true"]` + `div.body` (`h3.cardTitle`, `p.cardText`, `div.count` with `style={{ background: t.paper }}` and text `` `${t.count} ${blockCountSuffix}` ``, never a hard-coded word)) + `div.blocks` (`div.blocksLabel` with `blocksLabel`, `div.chips` with one `span.chip` per `blockChips` item, `style={{ background: b.bg, '--rot': b.rot } as CSSProperties}`, with `import type { CSSProperties } from 'react'`). |
| `apps/web/src/home/TemplatesSection.module.css` (new) | Values below. |
| `apps/web/src/home/TemplatesSection.test.tsx` (new) | Tests below. |
| `apps/web/src/home/HomePage.tsx` | Replace `{/* slot: templates */}` with `<TemplatesSection />`. |

`div.preview` content (lines 193-200), accent = `t.accent` via inline `style` on the shapes that use it: `div.bar1`, `div.bar2`, `div.photo` (inner `div.photoFill` with accent background), `div.tiles` with three `div.tile` (each: `div.tileAccent` with accent background, `div.tileLine`).

| Class | Declarations (line) |
|---|---|
| `band` | `background: var(--color-white); border-radius: var(--radius-band); margin: 0 16px;` (181) |
| `section` | `max-width: var(--page-max); margin: 0 auto; box-sizing: border-box; padding: 96px var(--gutter) 100px;` (182); `@media (max-width: 767px)`: `padding-top: 64px; padding-bottom: 64px;` |
| `head` | `display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap;` (184) |
| `title` | `margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 48px; line-height: 1.08; letter-spacing: -0.01em; max-width: 16ch;` (185); `@media (max-width: 767px)`: `font-size: 34px;` |
| `lead` | `margin: 0; font-size: 18px; color: var(--color-ink-soft); max-width: 40ch;` (186) |
| `grid` | `margin-top: 48px; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr)); gap: 28px;` (189) |
| `card` | `border-radius: var(--radius-card); overflow: hidden; display: flex; flex-direction: column; transition: transform .25s cubic-bezier(.3,1.4,.5,1);` (191, 40); `.card:hover`: `transform: translateY(-8px) rotate(-1deg);` (41) |
| `preview` | `position: relative; height: 230px; padding: 26px; overflow: hidden;` (192) |
| `bar1` / `bar2` | `width: 46%; height: 22px; border-radius: 11px; background: var(--color-ink); opacity: 0.85;` / `width: 30%; height: 11px; margin-top: 10px; border-radius: 6px; background: var(--color-ink); opacity: 0.3;` (193-194) |
| `photo` / `photoFill` | `position: absolute; right: 26px; top: 22px; width: 96px; height: 120px; background: var(--color-white); padding: 7px 7px 22px; box-sizing: border-box; border-radius: 6px; box-shadow: 0 8px 16px rgba(59,36,51,0.16); transform: rotate(5deg);` / `height: 100%; border-radius: 4px; opacity: 0.5;` (195) |
| `tiles` / `tile` | `position: absolute; left: 26px; right: 26px; bottom: 24px; display: flex; gap: 10px;` / `flex: 1 1 0; height: 60px; background: var(--color-white); border-radius: 14px; padding: 12px; box-sizing: border-box;` (196-197) |
| `tileAccent` / `tileLine` | `height: 7px; border-radius: 4px;` / `height: 6px; margin-top: 8px; border-radius: 3px; background: var(--color-ink); opacity: 0.2;` (197) |
| `body` | `background: var(--color-white); margin: 0 10px 10px; border-radius: 24px; padding: 22px 22px 24px; flex: 1 1 auto;` (202) |
| `cardTitle` | `margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 25px; line-height: 1.2;` (203) |
| `cardText` | `margin: 8px 0 0; font-size: 16px; color: var(--color-ink-body);` (204) |
| `count` | `margin-top: 12px; display: inline-block; padding: 2px 12px; border-radius: var(--radius-pill); font-size: 14px; font-weight: 600;` (205) |
| `blocks` | `margin-top: 52px; text-align: center;` (211) |
| `blocksLabel` | `font-family: var(--font-display); font-weight: 600; font-size: 22px;` (212) |
| `chips` | `margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;` (213) |
| `chip` | `display: inline-flex; align-items: center; min-height: 44px; padding: 0 20px; border-radius: var(--radius-pill); color: var(--color-ink); font-weight: 600; font-size: 16px; transform: rotate(var(--rot)); transition: transform .2s cubic-bezier(.3,1.4,.5,1);` (215, 44); `.chip:hover`: `transform: rotate(0deg) scale(1.08);` (45) |

The `--rot` custom property replaces the mockup's inline `transform` so the hover rule can override it without `!important`.

Tests in `TemplatesSection.test.tsx`:
- `renders the templates section`: `section#templates` is a region named by `sectionText.templates.title`; its parent element is the band `div`.
- `renders three template examples`: 3 `article`s; level-3 headings `One small moment`, `Growing up: ages 1 to 10`, `An adventure`; texts `3 blocks`, `4 blocks`, `8 blocks`.
- `renders the block chips`: text `Made from building blocks` and the six chip names `Text`, `Carousel`, `Gallery`, `Timeline`, `Curved timeline`, `Before and after`.

Prerequisites (must be `done`): [add-home-content](add-home-content.md), [add-homepage-shell](add-homepage-shell.md).

Out of scope: real Templates from the database, "Use this template" buttons, links on cards or chips, admin-authored CSS or scripts.

Security: the cards are static drawings from `content.ts`; no Template wrapper, Block CSS or script is rendered, so CLAUDE.md rules 2-4 (scoped CSS, checked scripts, review queue) are not touched and must not be worked around by loading real Template data here.

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `npm test -w apps/web` passes the three tests named in Scope. (AC1, AC5)
- [ ] 2. At 1440 x 900 the section matches mockup lines 180-221 side by side: white band with 64 px corners and 16 px side margins, heading left and text right, three cards with drawn previews, tilted chips centered below. (AC2)
- [ ] 3. Computed at 1440 px: band background `rgb(255, 255, 255)`, radius `64px`, margin left/right `16px`; first card background `rgb(255, 225, 204)`, shadow `rgb(242, 190, 152) 0px 8px 0px 0px`; card `h3` 25px; first chip background `rgb(255, 225, 204)`, `min-height: 44px`, transform not `none` (rotated). (AC2)
- [ ] 4. Hovering a card lifts and tilts it; hovering a chip straightens and enlarges it (`matrix(1.08, 0, 0, 1.08, 0, 0)`); with reduced motion both have `transitionDuration` `0s`. (AC6)
- [ ] 5. At 375 px: cards stack, `h2` 34px, band radius `40px`, section padding top/bottom 64px; at 320 px `scrollWidth <= innerWidth`. (AC7)
- [ ] 6. Opening `$BASE_URL/#templates` scrolls the page so this section starts in the upper half of the viewport. (AC3)
- [ ] 7. No `fetch` or API import in `TemplatesSection.tsx` (`grep -n -E 'fetch|/api/' apps/web/src/home/TemplatesSection.tsx` prints nothing). (AC9, AC10)
- [ ] 8. `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0; no Console errors. (AC11)
- [ ] 9. No visible copy is hard-coded in the component: `grep -n -E "'blocks'|\} blocks|>blocks" apps/web/src/home/TemplatesSection.tsx` prints nothing and the file uses `blockCountSuffix`. (AC5)
- [ ] 10. Under `apps/`, the PR changes only the four files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them, none under `apps/api/`). Changes under `docs/` are allowed. (AC10)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated.

```
E2E-1 -> checklist items 1, 7, 8, 9: unit tests, no API, build, copy from content.ts
Preconditions: npm install done
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/TemplatesSection.test.tsx; echo "t=$?"
  2. Run: grep -n -E 'fetch|/api/' apps/web/src/home/TemplatesSection.tsx; echo "g=$?"
  3. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
  4. Run: grep -n -E "'blocks'|\} blocks|>blocks" apps/web/src/home/TemplatesSection.tsx; echo "h=$?"; grep -c 'blockCountSuffix' apps/web/src/home/TemplatesSection.tsx
Expected: three tests pass, t=0; only "g=1"; b=0; only "h=1" then a number >= 2 (import and use)
```

```
E2E-2 -> checklist items 2, 3: look and values
Preconditions: app running; mockup served at http://localhost:8000/Landing2.dc.html
Steps:
  1. Compare the Templates band side by side.
  2. In the app Console run: const sec=document.getElementById('templates'); const b=getComputedStyle(sec.parentElement); const a=getComputedStyle(sec.querySelector('article')); const chip=[...sec.querySelectorAll('span')].find(s=>s.textContent==='Text'); const c=getComputedStyle(chip); [b.backgroundColor,b.borderTopLeftRadius,b.marginLeft,b.marginRight,a.backgroundColor,a.boxShadow,getComputedStyle(sec.querySelector('h3')).fontSize,c.backgroundColor,c.minHeight,c.transform !== 'none']
Expected: step 1 same; step 2 ["rgb(255, 255, 255)","64px","16px","16px","rgb(255, 225, 204)","rgb(242, 190, 152) 0px 8px 0px 0px","25px","rgb(255, 225, 204)","44px",true]
```

```
E2E-3 -> checklist item 4: hover and reduced motion
Preconditions: app running
Steps:
  1. Hover the first template card; wait 0.3 s; run: getComputedStyle(document.querySelector('#templates article')).transform
  2. Hover chip "Text"; wait 0.3 s; run: getComputedStyle([...document.querySelectorAll('#templates span')].find(s=>s.textContent==='Text')).transform
  3. Emulate prefers-reduced-motion = reduce; reload; run: [getComputedStyle(document.querySelector('#templates article')).transitionDuration, getComputedStyle([...document.querySelectorAll('#templates span')].find(s=>s.textContent==='Text')).transitionDuration]
Expected: step 1 a matrix value (lifted and tilted); step 2 "matrix(1.08, 0, 0, 1.08, 0, 0)"; step 3 ["0s","0s"]
```

```
E2E-4 -> checklist items 5, 6: narrow screen and anchor
Preconditions: app running
Steps:
  1. Set 375 x 812, reload; run: const s=document.getElementById('templates'); [new Set([...s.querySelectorAll('article')].map(x=>x.getBoundingClientRect().left)).size, getComputedStyle(s.querySelector('h2')).fontSize, getComputedStyle(s.parentElement).borderTopLeftRadius, getComputedStyle(s).paddingTop, getComputedStyle(s).paddingBottom]
  2. Set 320 x 640, reload; run: document.documentElement.scrollWidth <= innerWidth
  3. Set 1440 x 900, open $BASE_URL/#templates in a new tab; run: const t=document.getElementById('templates').getBoundingClientRect().top; [scrollY > 0, t >= -1, t < innerHeight / 2]
Expected: [1,"34px","40px","64px","64px"]; true; [true,true,true]
```

```
E2E-5 -> checklist item 10: PR scope
Preconditions: task branch checked out; git fetch origin done
Steps:
  1. Run: git diff --name-only origin/dev-v1...HEAD -- apps/
Expected: exactly apps/web/src/home/TemplatesSection.tsx, apps/web/src/home/TemplatesSection.module.css, apps/web/src/home/TemplatesSection.test.tsx, apps/web/src/home/HomePage.tsx
```

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#page-structure)
