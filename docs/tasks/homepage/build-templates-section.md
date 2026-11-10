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
- `renders the block chips`: text `Made from building blocks` and the six chip names `Text`, `Carousel`, `Gallery`, `Timeline`, `Curved timeline`, `Before and after`; `queryAllByRole('link')` and `queryAllByRole('button')` are empty.

Prerequisites (must be `done`): [add-home-content](add-home-content.md), [add-homepage-shell](add-homepage-shell.md).

Out of scope: real Templates from the database, "Use this template" buttons, links on cards or chips, admin-authored CSS or scripts.

Security: the cards are static drawings from `content.ts`; no Template wrapper, Block CSS or script is rendered, so CLAUDE.md rules 2-4 (scoped CSS, checked scripts, review queue) are not touched and must not be worked around by loading real Template data here.

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `npm test -w apps/web` passes the three tests named in Scope. (AC1, AC5)
- [ ] 2. At 1440 x 900 the section matches mockup lines 180-221 as measured by the E2E-2 spec (every `Visual:` value holds: computed CSS exact, layout relations within ±4 px, [Q008](../../questions/questions-2026-11-10-requirement-breakdown.md#q008-visual-fidelity-tolerance-for-the-homepage) default; this replaces the mockup-box comparison of [ui/homepage.md, Checking fidelity](../../ui/homepage.md#checking-fidelity) step 4, which stays an optional reviewer check, [Q015](../../questions/questions-2026-11-10-requirement-breakdown.md#q015-do-the-measured-visual-assertions-replace-the-mockup-bounding-box-comparison) A): white band with 64 px corners and 16 px side margins, heading left and text right, three cards with drawn previews, tilted chips centered below. (AC2)
- [ ] 3. Computed at 1440 px: band background `rgb(255, 255, 255)`, radius `64px`, margin left/right `16px`; first card background `rgb(255, 225, 204)`, shadow `rgb(242, 190, 152) 0px 8px 0px 0px`; card `h3` 25px; first chip background `rgb(255, 225, 204)`, `min-height: 44px`, transform not `none` (rotated). (AC2)
- [ ] 4. Hovering a card lifts and tilts it (`translateY(-8px) rotate(-1deg)`: computed `transform` matches `/^matrix\(0\.9998\d*, -0\.01745\d*, 0\.01745\d*, 0\.9998\d*, 0, -8\)$/`); hovering a chip straightens and enlarges it (`matrix(1.08, 0, 0, 1.08, 0, 0)`); with reduced motion both have `transitionDuration` `0s`. (AC6)
- [ ] 5. At 375 px: cards stack, `h2` 34px, band radius `40px`, section padding top/bottom 64px; at 320 px `scrollWidth <= innerWidth` and the clip check from [ui/homepage.md, Responsive rules](../../ui/homepage.md#responsive-rules) returns `0`. (AC7)
- [ ] 6. Opening `$BASE_URL/#templates` scrolls the page so this section starts in the upper half of the viewport. (AC3)
- [ ] 7. No `fetch` or API import in `TemplatesSection.tsx` (`grep -n -E 'fetch|/api/' apps/web/src/home/TemplatesSection.tsx` prints nothing). (AC9, AC10)
- [ ] 8. `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0; no Console errors or warnings on load of `$BASE_URL/`. (AC11)
- [ ] 9. No visible copy is hard-coded in the component: `grep -n -E "'blocks'|\} blocks|>blocks" apps/web/src/home/TemplatesSection.tsx` prints nothing and the file uses `blockCountSuffix`. (AC5)
- [ ] 10. Under `apps/`, the PR changes only the four files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them, none under `apps/api/`). Changes under `docs/` are allowed. (AC10)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated. `Spec:`/`Testids:` per [ADR 0004](../../adr/0004-playwright-e2e-specs.md). Every case is `Auth: none` and `Data: none` (public, static page; the cards are illustrations, not real Templates). `Visual:` values appear only on the mockup case (E2E-2); under [ADR 0005](../../adr/0005-e2e-signed-in-data-writing-and-visual-specs.md) (accepted) it is a spec in this ticket's spec file, asserted per [ui/homepage.md, Visual assertions](../../ui/homepage.md#visual-assertions) (`toHaveCSS`, bounding boxes, no screenshots), with one by-eye prose step for decorative positions not listed in `Visual:`; viewports per [ui/homepage.md, Test case fields](../../ui/homepage.md#test-case-fields). The fixed computed values at 1440 x 900 need no mockup, so they are a spec case of their own (E2E-6, `Visual: none`).

```
E2E-1 -> checklist items 1, 7, 8, 9: unit tests, no API, build, console, copy from content.ts
Spec: prose (npm and grep commands)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: npm install done; app running
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/TemplatesSection.test.tsx; echo "t=$?"
  2. Run: grep -n -E 'fetch|/api/' apps/web/src/home/TemplatesSection.tsx; echo "g=$?"
  3. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
  4. Run: grep -n -E "'blocks'|\} blocks|>blocks" apps/web/src/home/TemplatesSection.tsx; echo "h=$?"; grep -c 'blockCountSuffix' apps/web/src/home/TemplatesSection.tsx
  5. Open $BASE_URL/ with the DevTools Console open; reload.
Expected: three tests pass, t=0; only "g=1"; b=0; only "h=1" then a number >= 2 (import and use); step 5 the Console shows no error or warning entries
```

```
E2E-2 -> checklist item 2: mockup values, measured
Spec: e2e/specs/homepage/build-templates-section.spec.ts (steps 1-2, the Visual values; step 3, decorative positions by eye, runs as prose)
Testids: none
Auth: none
Data: none
Visual: at 1280 and 1440 wide: band background rgb(255, 255, 255), radius 64px, margin 0px 16px; section padding 96px 40px 100px; h2 Fredoka 700 48px, max width 16ch, left; lead 18px rgb(90, 60, 75), max width 40ch, right, bottom-aligned with the h2; grid margin-top 48px, 3 equal columns, gap 28px; card radius 32px, backgrounds in order rgb(255, 225, 204), rgb(214, 241, 228), rgb(212, 233, 251), box shadows rgb(242, 190, 152) 0px 8px 0px 0px, rgb(159, 216, 189) 0px 8px 0px 0px, rgb(169, 212, 242) 0px 8px 0px 0px; preview height 230px; card body background rgb(255, 255, 255), radius 24px, margin 0px 10px 10px, padding 22px 22px 24px; h3 Fredoka 600 25px; card text 16px rgb(74, 48, 64); count pill 14px weight 600, radius 999px; "Made from building blocks" Fredoka 600 22px, margin-top 52px; chips min height 44px, padding 0px 20px, 16px weight 600, radius 999px, gap 10px, first chip background rgb(255, 225, 204) rotated -2deg. At 390 wide: 1 column; h2 34px; band radius 40px; section padding 64px 20px 64px
Preconditions: app running; reduced motion emulated; for step 3 only, mockup served at http://localhost:8000/Landing2.dc.html in a second tab at 1440 x 900
Steps:
  1. At 1440 x 900, then at 1280 x 900: assert every "at 1280 and 1440 wide" value of Visual on the element it names (the band is the parent of section #templates), per ui/homepage.md, Visual assertions.
  2. At 390 x 900: assert every "At 390 wide" value of Visual the same way.
  3. (prose) At 1440 x 900, compare by eye with the mockup only the drawings inside the three 230px card previews.
Expected: steps 1-2 every Visual value holds: computed CSS strings exactly as written, sizes exact, first chip rotated -2deg within ±0.5deg, h2 left, lead right and bottom-aligned with the h2, 3 equal columns (1 column at 390) within the ±4 px rules; step 3 same drawings and positions as the mockup
```

```
E2E-6 -> checklist item 3: computed values
Spec: e2e/specs/homepage/build-templates-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running, 1440 x 900 (no mockup opened)
Steps:
  1. In the Console run: const sec=document.getElementById('templates'); const b=getComputedStyle(sec.parentElement); const a=getComputedStyle(sec.querySelector('article')); const chip=[...sec.querySelectorAll('span')].find(s=>s.textContent==='Text'); const c=getComputedStyle(chip); [b.backgroundColor,b.borderTopLeftRadius,b.marginLeft,b.marginRight,a.backgroundColor,a.boxShadow,getComputedStyle(sec.querySelector('h3')).fontSize,c.backgroundColor,c.minHeight,c.transform !== 'none']
Expected: ["rgb(255, 255, 255)","64px","16px","16px","rgb(255, 225, 204)","rgb(242, 190, 152) 0px 8px 0px 0px","25px","rgb(255, 225, 204)","44px",true]
```

```
E2E-3 -> checklist item 4: hover and reduced motion
Spec: e2e/specs/homepage/build-templates-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running
Steps:
  1. Hover the first template card; wait 0.3 s; run: getComputedStyle(document.querySelector('#templates article')).transform
  2. Hover chip "Text"; wait 0.3 s; run: getComputedStyle([...document.querySelectorAll('#templates span')].find(s=>s.textContent==='Text')).transform
  3. Emulate prefers-reduced-motion = reduce; reload; run: [getComputedStyle(document.querySelector('#templates article')).transitionDuration, getComputedStyle([...document.querySelectorAll('#templates span')].find(s=>s.textContent==='Text')).transitionDuration]
Expected: step 1 matches /^matrix\(0\.9998\d*, -0\.01745\d*, 0\.01745\d*, 0\.9998\d*, 0, -8\)$/ (Chrome prints "matrix(0.999848, -0.0174524, 0.0174524, 0.999848, 0, -8)"); step 2 "matrix(1.08, 0, 0, 1.08, 0, 0)"; step 3 ["0s","0s"]
```

```
E2E-4 -> checklist items 5, 6: narrow screen and anchor
Spec: e2e/specs/homepage/build-templates-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running
Steps:
  1. Set 375 x 812, reload; run: const s=document.getElementById('templates'); [new Set([...s.querySelectorAll('article')].map(x=>x.getBoundingClientRect().left)).size, getComputedStyle(s.querySelector('h2')).fontSize, getComputedStyle(s.parentElement).borderTopLeftRadius, getComputedStyle(s).paddingTop, getComputedStyle(s).paddingBottom]
  2. Set 320 x 640, reload, wait 3 s; run: [document.documentElement.scrollWidth <= innerWidth, [...document.querySelectorAll('header *, main *, footer *')].filter(e => !e.closest('[aria-hidden="true"]') && e.getBoundingClientRect().width > 0 && (e.getBoundingClientRect().left < -0.5 || e.getBoundingClientRect().right > innerWidth + 0.5)).length]
  3. Set 1440 x 900, open $BASE_URL/#templates in a new tab; run: const t=document.getElementById('templates').getBoundingClientRect().top; [scrollY > 0, t >= -1, t < innerHeight / 2]
Expected: [1,"34px","40px","64px","64px"]; [true, 0]; [true,true,true]
```

```
E2E-5 -> checklist item 10: PR scope
Spec: prose (git command)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: task branch checked out; git fetch origin done
Steps:
  1. Run: git diff --name-only origin/dev-v1...HEAD -- apps/
Expected: exactly apps/web/src/home/TemplatesSection.tsx, apps/web/src/home/TemplatesSection.module.css, apps/web/src/home/TemplatesSection.test.tsx, apps/web/src/home/HomePage.tsx
```

## unit-tests

Vitest + Testing Library, colocated in `apps/web/src/home/TemplatesSection.test.tsx` (the three tests named in Scope). Render only; no network, no `fetch` mock (the component must not call one).

Unit: `TemplatesSection` (`apps/web/src/home/TemplatesSection.tsx`).

| ID | Case: input -> expected | Checklist |
|---|---|---|
| U-1 | `renders the templates section`: `render(<TemplatesSection />)` -> `section#templates` is a region named `sectionText.templates.title`; its parent element is the band `div` (not `main` directly) | 1, 6 |
| U-2 | `renders three template examples`: -> 3 `article`s; level-3 headings `One small moment`, `Growing up: ages 1 to 10`, `An adventure`; texts `3 blocks`, `4 blocks`, `8 blocks` (built from `count` + `blockCountSuffix`, so changing the suffix in `content.ts` changes all three) | 1, 9 |
| U-3 | `renders the block chips`: -> text `Made from building blocks` and exactly six chips `Text`, `Carousel`, `Gallery`, `Timeline`, `Curved timeline`, `Before and after`; edge: no link and no button in the section | 1 |

CLAUDE.md rules 2-4 (scoped CSS, checked scripts, review queue) are not triggered because nothing admin-authored is rendered; checklist item 7 (grep for `fetch` and `/api/`) guards that, not a unit test.

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#page-structure)
