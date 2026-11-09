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
- [ ] 2. At 1440 x 900 the section matches mockup lines 234-256 side by side: text left, white panel right with a beige 8 px shadow, four rows with colored round icons, thin dividers between rows. (AC2)
- [ ] 3. Computed at 1440 px: `h2` 46px; panel radius `28px`, shadow `rgb(242, 217, 192) 0px 8px 0px 0px`; first row `border-top-width` `0px`, second row `1px` `rgb(241, 228, 212)`; icon 44 x 44 with background `rgb(255, 225, 204)`; url 18px. (AC2)
- [ ] 4. Hovering a row turns its background `rgb(255, 244, 247)`; with reduced motion its `transitionDuration` is `0s`. (AC6)
- [ ] 5. At 375 px the panel sits below the text, `h2` 34px, section padding top/bottom 64px, the long address wraps inside the panel; at 320 px `scrollWidth <= innerWidth`. (AC7)
- [ ] 6. No address is a link (`section a` count is 0). (Behavior)
- [ ] 7. `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0; no Console errors. (AC11)
- [ ] 8. Under `apps/`, the PR changes only the four files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them, none under `apps/api/`). Changes under `docs/` are allowed. (AC10)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated.

```
E2E-1 -> checklist items 1, 7: unit tests, build
Preconditions: npm install done
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/AddressesSection.test.tsx; echo "t=$?"
  2. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
Expected: both tests pass, t=0; b=0
```

```
E2E-2 -> checklist items 2, 3, 6: look, values, no links
Preconditions: app running; mockup served at http://localhost:8000/Landing2.dc.html
Steps:
  1. Compare the addresses section side by side.
  2. In the app Console run: const s=[...document.querySelectorAll('h2')].find(h=>h.textContent.startsWith('Your family name first')).closest('section'); const ul=s.querySelector('ul'); const p=getComputedStyle(ul.parentElement); const r=[...ul.children].map(li=>getComputedStyle(li)); const icon=getComputedStyle(ul.querySelector('li > span')); [getComputedStyle(s.querySelector('h2')).fontSize, p.borderRadius, p.boxShadow, r[0].borderTopWidth, r[1].borderTopWidth, r[1].borderTopColor, icon.width, icon.height, icon.backgroundColor, s.querySelectorAll('a').length]
Expected: step 1 same; step 2 ["46px","28px","rgb(242, 217, 192) 0px 8px 0px 0px","0px","1px","rgb(241, 228, 212)","44px","44px","rgb(255, 225, 204)",0]
```

```
E2E-3 -> checklist item 4: row hover
Preconditions: app running
Steps:
  1. Hover the second address row; wait 0.3 s; run: getComputedStyle([...document.querySelectorAll('ul li')].find(li=>li.querySelector('span > span')?.textContent==='sam.sweetmemories.com/bob')).backgroundColor
  2. Emulate prefers-reduced-motion = reduce; reload; run: getComputedStyle([...document.querySelectorAll('ul li')].find(li=>li.textContent.includes('maple-street-party'))).transitionDuration
Expected: "rgb(255, 244, 247)"; "0s"
```

```
E2E-4 -> checklist item 5: narrow screen
Preconditions: app running
Steps:
  1. Set 375 x 812, reload; run: const s=[...document.querySelectorAll('h2')].find(h=>h.textContent.startsWith('Your family name first')).closest('section'); const panel=s.querySelector('ul').parentElement; [panel.getBoundingClientRect().top > s.querySelector('h2').getBoundingClientRect().bottom, getComputedStyle(s.querySelector('h2')).fontSize, getComputedStyle(s).paddingTop, getComputedStyle(s).paddingBottom, panel.getBoundingClientRect().right <= innerWidth]
  2. Set 320 x 640, reload; run: document.documentElement.scrollWidth <= innerWidth
Expected: [true,"34px","64px","64px",true]; true
```

```
E2E-5 -> checklist item 8: PR scope
Preconditions: task branch checked out; git fetch origin done
Steps:
  1. Run: git diff --name-only origin/dev-v1...HEAD -- apps/
Expected: exactly apps/web/src/home/AddressesSection.tsx, apps/web/src/home/AddressesSection.module.css, apps/web/src/home/AddressesSection.test.tsx, apps/web/src/home/HomePage.tsx
```

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#page-structure)
