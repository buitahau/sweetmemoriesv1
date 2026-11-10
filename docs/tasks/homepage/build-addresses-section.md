# Build addresses section

- Status: not-started

## Goal

Add the addresses section: heading and text on the left explaining "subdomain first, then one page per Memory", and a white panel on the right listing four example addresses with round icons.

## Scope

Area: UI. Mockup lines 234-256 (values), 49-50 (row hover). Data from `content.ts` (`sectionText.addresses`, `addressRows`); `AddressIcon` from `illustrations.tsx`. Rules: [ui/homepage.md](../../ui/homepage.md).

| File | Change |
|---|---|
| `apps/web/src/home/AddressesSection.tsx` (new) | `export function AddressesSection()`. Markup: `section.section[aria-labelledby="addresses-title"]` > `div.text` (`h2#addresses-title.title`, `p.lead`) + `div.panel` > `ul.list` > one `li.row` per `addressRows` item (key = url) > `span.icon` with `style={{ background: a.bg }}` containing `<AddressIcon kind={a.icon} />`, then `span.textWrap` > `span.url` (`a.url`) + `span.desc` (`a.text`). Addresses are plain text, not links. |
| `apps/web/src/home/AddressesSection.module.css` (new) | Values below. |
| `apps/web/src/home/AddressesSection.test.tsx` (new) | Tests below. |
| `apps/web/src/home/HomePage.tsx` | Replace `{/* slot: addresses */}` with `<AddressesSection />`. |

| Class | Declarations (line) |
|---|---|
| `section` | `max-width: var(--page-max); margin: 0 auto; box-sizing: border-box; padding: 80px var(--gutter) 110px; display: flex; flex-wrap: wrap; gap: 56px; align-items: center;` (235); `@media (max-width: 767px)`: `padding-top: 64px; padding-bottom: 64px;` |
| `text` | `flex: 1 1 400px; min-width: 0;` (237) |
| `title` | `margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 46px; line-height: 1.08; letter-spacing: -0.01em;` (238); `@media (max-width: 767px)`: `font-size: 34px;` |
| `lead` | `margin: 20px 0 0; font-size: 19px; color: var(--color-ink-soft); max-width: 38ch;` (239) |
| `panel` | `flex: 1 1 460px; min-width: 0; border-radius: var(--radius-panel); overflow: hidden; background: var(--color-white); box-shadow: 0 8px 0 var(--color-address-shadow);` (242) |
| `list` | `list-style: none; margin: 0; padding: 0;` (243) |
| `row` | `display: flex; align-items: center; gap: 16px; padding: 18px 24px; flex-wrap: wrap; transition: background-color .2s;` (245, 49); `.row + .row`: `border-top: 1px solid var(--color-row-border);` (325-327; the first row has no border); `.row:hover`: `background-color: var(--color-row-hover);` (50) |
| `icon` | `flex: 0 0 44px; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center;` (246) |
| `textWrap` | `flex: 1 1 220px; min-width: 0;` (247) |
| `url` | `display: block; font-weight: 700; font-size: 18px; overflow-wrap: anywhere;` (248) |
| `desc` | `display: block; font-size: 15px; color: var(--color-ink-soft);` (249) |

Tests in `AddressesSection.test.tsx`:
- `renders the addresses section`: a region named `Your family name first, then a page for each memory.`.
- `lists four example addresses`: one `list` with 4 `listitem`s; texts `sam.sweetmemories.com`, `sam.sweetmemories.com/bob`, `sam.sweetmemories.com/first-day-of-bob`, `sam.sweetmemories.com/maple-street-party` in order; `queryAllByRole('link')` is empty.

Prerequisites (must be `done`): [add-home-content](add-home-content.md), [add-home-illustrations](add-home-illustrations.md), [add-homepage-shell](add-homepage-shell.md).

Out of scope: checking whether a subdomain is free, slug rules, links to the example addresses.

Security: the addresses are fictional examples shown as text; no slug validation happens here (that is CLAUDE.md rule 6, done later in the address step of the wizard); no real User data (rule 5).

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `npm test -w apps/web` passes `renders the addresses section` and `lists four example addresses`. (AC1, AC5)
- [ ] 2. At 1440 x 900 the section matches mockup lines 234-256 as measured by the E2E-2 spec (every `Visual:` value holds: computed CSS exact, layout relations within ±4 px, [Q008](../../questions/questions-2026-11-10-requirement-breakdown.md#q008-visual-fidelity-tolerance-for-the-homepage) default; this replaces the mockup-box comparison of [ui/homepage.md, Checking fidelity](../../ui/homepage.md#checking-fidelity) step 4, which stays an optional reviewer check, [Q015](../../questions/questions-2026-11-10-requirement-breakdown.md#q015-do-the-measured-visual-assertions-replace-the-mockup-bounding-box-comparison) A): text left, white panel right with a beige 8 px shadow, four rows with colored round icons, thin dividers between rows. (AC2)
- [ ] 3. Computed at 1440 px: `h2` 46px; panel radius `28px`, shadow `rgb(242, 217, 192) 0px 8px 0px 0px`; first row `border-top-width` `0px`, second row `1px` `rgb(241, 228, 212)`; icon 44 x 44 with background `rgb(255, 225, 204)`; url 18px. (AC2)
- [ ] 4. Hovering a row turns its background `rgb(255, 244, 247)`; with reduced motion its `transitionDuration` is `0s`. (AC6)
- [ ] 5. At 375 px the panel sits below the text, `h2` 34px, section padding top/bottom 64px, the long address wraps inside the panel; at 320 px `scrollWidth <= innerWidth` and the clip check from [ui/homepage.md, Responsive rules](../../ui/homepage.md#responsive-rules) returns `0`. (AC7)
- [ ] 6. No address is a link (`section a` count is 0). (Behavior)
- [ ] 7. `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0; no Console errors or warnings on load of `$BASE_URL/`. (AC11)
- [ ] 8. Under `apps/`, the PR changes only the four files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them, none under `apps/api/`). Changes under `docs/` are allowed. (AC10)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated. `Spec:`/`Testids:` per [ADR 0004](../../adr/0004-playwright-e2e-specs.md). Every case is `Auth: none` and `Data: none` (public, static page; the addresses are fictional text, no slug is created or checked). `Visual:` values appear only on the mockup case (E2E-2); under [ADR 0005](../../adr/0005-e2e-signed-in-data-writing-and-visual-specs.md) (accepted) it is a spec in this ticket's spec file, asserted per [ui/homepage.md, Visual assertions](../../ui/homepage.md#visual-assertions) (`toHaveCSS`, bounding boxes, no screenshots); viewports per [ui/homepage.md, Test case fields](../../ui/homepage.md#test-case-fields). The fixed computed values and the no-link check at 1440 x 900 need no mockup, so they are a spec case of their own (E2E-6, `Visual: none`).

```
E2E-1 -> checklist items 1, 7: unit tests, build, console
Spec: prose (npm commands)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: npm install done; app running
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/AddressesSection.test.tsx; echo "t=$?"
  2. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
  3. Open $BASE_URL/ with the DevTools Console open; reload.
Expected: both tests pass, t=0; b=0; step 3 the Console shows no error or warning entries
```

```
E2E-2 -> checklist item 2: mockup values, measured
Spec: e2e/specs/homepage/build-addresses-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: at 1280 and 1440 wide: section padding 80px 40px 110px; text column left and panel right on one row, gap 56px, vertically centered; h2 Fredoka 700 46px, line height 49.68px; lead 19px rgb(90, 60, 75), margin-top 20px, max width 38ch; panel background rgb(255, 255, 255), radius 28px, box shadow rgb(242, 217, 192) 0px 8px 0px 0px; rows padding 18px 24px, gap 16px; first row border-top 0px, rows 2-4 border-top 1px solid rgb(241, 228, 212); icon circles 44 x 44 px, backgrounds in order rgb(255, 225, 204), rgb(214, 241, 228), rgb(255, 240, 184), rgb(212, 233, 251); url 18px weight 700; description 15px rgb(90, 60, 75). At 390 wide: panel below the text; h2 34px; section padding 64px 20px 64px; the longest address wraps inside the panel
Preconditions: app running; reduced motion emulated (no mockup opened)
Steps:
  1. At 1440 x 900, then at 1280 x 900: assert every "at 1280 and 1440 wide" value of Visual on the element it names (the section whose h2 is "Your family name first, then a page for each memory."), per ui/homepage.md, Visual assertions.
  2. At 390 x 900: assert every "At 390 wide" value of Visual the same way.
Expected: every Visual value holds: computed CSS strings exactly as written, icon circles 44 x 44 px exact, text left and panel right on one row and vertically centered at 1280 and 1440, panel below the text and the longest address wrapping inside the panel at 390, per the ±4 px rules
```

```
E2E-6 -> checklist items 3, 6: computed values and no links
Spec: e2e/specs/homepage/build-addresses-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running, 1440 x 900 (no mockup opened)
Steps:
  1. In the Console run: const s=[...document.querySelectorAll('h2')].find(h=>h.textContent.startsWith('Your family name first')).closest('section'); const ul=s.querySelector('ul'); const p=getComputedStyle(ul.parentElement); const r=[...ul.children].map(li=>getComputedStyle(li)); const icon=getComputedStyle(ul.querySelector('li > span')); const url=getComputedStyle(ul.querySelector('li span span')); [getComputedStyle(s.querySelector('h2')).fontSize, p.borderRadius, p.boxShadow, r[0].borderTopWidth, r[1].borderTopWidth, r[1].borderTopColor, icon.width, icon.height, icon.backgroundColor, url.fontSize, s.querySelectorAll('a').length]
Expected: ["46px","28px","rgb(242, 217, 192) 0px 8px 0px 0px","0px","1px","rgb(241, 228, 212)","44px","44px","rgb(255, 225, 204)","18px",0]
```

```
E2E-3 -> checklist item 4: row hover
Spec: e2e/specs/homepage/build-addresses-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running
Steps:
  1. Hover the second address row; wait 0.3 s; run: getComputedStyle([...document.querySelectorAll('ul li')].find(li=>li.querySelector('span > span')?.textContent==='sam.sweetmemories.com/bob')).backgroundColor
  2. Emulate prefers-reduced-motion = reduce; reload; run: getComputedStyle([...document.querySelectorAll('ul li')].find(li=>li.textContent.includes('maple-street-party'))).transitionDuration
Expected: "rgb(255, 244, 247)"; "0s"
```

```
E2E-4 -> checklist item 5: narrow screen
Spec: e2e/specs/homepage/build-addresses-section.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running
Steps:
  1. Set 375 x 812, reload; run: const s=[...document.querySelectorAll('h2')].find(h=>h.textContent.startsWith('Your family name first')).closest('section'); const panel=s.querySelector('ul').parentElement; [panel.getBoundingClientRect().top > s.querySelector('h2').getBoundingClientRect().bottom, getComputedStyle(s.querySelector('h2')).fontSize, getComputedStyle(s).paddingTop, getComputedStyle(s).paddingBottom, panel.getBoundingClientRect().right <= innerWidth]
  2. Set 320 x 640, reload, wait 3 s; run: [document.documentElement.scrollWidth <= innerWidth, [...document.querySelectorAll('header *, main *, footer *')].filter(e => !e.closest('[aria-hidden="true"]') && e.getBoundingClientRect().width > 0 && (e.getBoundingClientRect().left < -0.5 || e.getBoundingClientRect().right > innerWidth + 0.5)).length]
Expected: [true,"34px","64px","64px",true]; [true, 0]
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
Expected: exactly apps/web/src/home/AddressesSection.tsx, apps/web/src/home/AddressesSection.module.css, apps/web/src/home/AddressesSection.test.tsx, apps/web/src/home/HomePage.tsx
```

## unit-tests

Vitest + Testing Library, colocated in `apps/web/src/home/AddressesSection.test.tsx` (the two tests named in Scope). Render only; no network.

Unit: `AddressesSection` (`apps/web/src/home/AddressesSection.tsx`).

| ID | Case: input -> expected | Checklist |
|---|---|---|
| U-1 | `renders the addresses section`: `render(<AddressesSection />)` -> region named `Your family name first, then a page for each memory.` | 1 |
| U-2 | `lists four example addresses`: -> one `list` with 4 `listitem`s; texts `sam.sweetmemories.com`, `sam.sweetmemories.com/bob`, `sam.sweetmemories.com/first-day-of-bob`, `sam.sweetmemories.com/maple-street-party` in that order; `queryAllByRole('link')` is empty (edge: an address rendered as a link fails) | 1, 6 |

CLAUDE.md rule 6 (slug validation) is not exercised: the addresses are fixed example text, no slug is accepted from input. Rule 5 (no User data) is covered by U-2's fixed fictional `sam` values.

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#page-structure)
