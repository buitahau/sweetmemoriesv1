# Homepage (public landing page)

Overview: the public landing page of SweetMemories at `/` of the web app. Static, frontend-only marketing page, light pink design. Built by feature [homepage](../features/homepage.md) on the foundation from [web-design-foundation](../features/web-design-foundation.md); decisions in [ADR 0003](../adr/0003-frontend-styling-and-self-hosted-fonts.md).

Design source (reference only, do not copy markup): [Homepage/Landing2.dc.html](Homepage/Landing2.dc.html), see [Homepage/README.md](Homepage/README.md). View it with `cd docs/ui/Homepage && python3 -m http.server 8000`, then open `http://localhost:8000/Landing2.dc.html` (the mockup itself loads Google Fonts; that is fine for viewing, never for the app). Line numbers below refer to that file. Placement exception: the mockup folder was supplied at `docs/ui/Homepage/` (capitalised, outside `docs/ui/mockup/`); it stays there until [Q006](../questions/questions-2026-11-10-requirement-breakdown.md#q006-move-the-mockup-folder-to-docsuimockuphomepage) is answered.

## Page structure

Top to bottom. "Lines" = markup in the mockup; "Data" = the item list in the mockup's `renderVals()`.

| # | Section | Element / id | Lines | Data | Built by task |
|---|---|---|---|---|---|
| 0 | Page wrapper | `div` root (bg, font, overflow hidden) | 55 | - | [add-homepage-shell](../tasks/homepage/add-homepage-shell.md) |
| 1 | Hero band (yellow, rounded bottom, 2 blobs) = page `<header>` (banner landmark) | `header` (mockup `div`) | 58-61, 142 | - | [add-homepage-shell](../tasks/homepage/add-homepage-shell.md) |
| 1a | Top bar: logo + main nav + Sign in | `div` (mockup `header`) | 63-74 | - | [build-top-bar](../tasks/homepage/build-top-bar.md) |
| 1b | Hero row (two columns), contains 1c and 1d | `div` (mockup `section`) | 76, 141 | - | [add-homepage-shell](../tasks/homepage/add-homepage-shell.md) |
| 1c | Hero intro: badge, `h1`, lead, CTAs, note, faces row | `div` (left column) | 78-99 | 288 | [build-hero-intro](../tasks/homepage/build-hero-intro.md) |
| 1d | Hero collage: sample Memory card, sun, cloud, heart, star, note card | `div` (right column) | 101-140 | - | [build-hero-collage](../tasks/homepage/build-hero-collage.md) |
| - | `<main>` wraps sections 2-7 | `main` | - | - | [add-homepage-shell](../tasks/homepage/add-homepage-shell.md) |
| 2 | Who it is for: 3 audience cards | `section#who` | 144-164 | 290-293 | [build-audiences-section](../tasks/homepage/build-audiences-section.md) |
| 3 | How it works: 4 numbered steps | `section#how` | 166-178 | 294-299 | [build-steps-section](../tasks/homepage/build-steps-section.md) |
| 4 | Templates: 3 template cards + block chips (white band) | `section#templates` | 180-221 | 300-312 | [build-templates-section](../tasks/homepage/build-templates-section.md) |
| 5 | Moments worth keeping: 8 chips | `section` | 223-232 | 313-322 | [build-moments-section](../tasks/homepage/build-moments-section.md) |
| 6 | Addresses: text + 4 address rows | `section` | 234-256 | 323-328 | [build-addresses-section](../tasks/homepage/build-addresses-section.md) |
| 7 | Closing CTA band (pink, rounded top, 2 blobs) | `section` | 258-269 | - | [build-page-closing](../tasks/homepage/build-page-closing.md) |
| 8 | Footer | `footer` | 271-279 | - | [build-page-closing](../tasks/homepage/build-page-closing.md) |

Landmarks: the yellow hero band is the page `<header>` (banner: top bar, nav and the `h1`), sections 2-7 are inside the single `<main>`, the footer is `<footer>` (contentinfo). Why the band is the banner: the mockup draws the top bar and the hero on one background, so they must share one wrapper, and a `<main>` cannot start inside it.

Heading outline: exactly one `h1` (hero). One `h2` per section 2-7 (six `h2` in total). `h3` for each audience card, step, and template card. The "Made from building blocks" label (line 212) stays a `div`, as in the mockup.

## Design tokens

Defined in `apps/web/src/styles/tokens.css` on `:root` (task [add-design-tokens](../tasks/web-design-foundation/add-design-tokens.md)). Colors that have no token go in one of two places, never both: colors of repeated data items (audience and template cards, steps, block chips, moments, address rows: backgrounds, shadows, accents) stay in `content.ts`; one-off colors of a single illustration (hero collage, closing-band blobs) are raw hex in that component's `.module.css`, as listed in its task. SVG `fill`/`stroke` colors follow [SVG-only colors](#svg-only-colors-not-tokens). A color that has a token is always `var(--token)`.

| Token | Value | Used for (mockup line) |
|---|---|---|
| `--color-page` | `#FFF7EA` | page background (55), step number border (172), hero blob (61) |
| `--color-ink` | `#3B2433` | main text, face eyes (55) |
| `--color-ink-soft` | `#5A3C4B` | lead paragraphs (84, 148, 186, 226, 239, 249) |
| `--color-ink-muted` | `#6B4A5A` | small notes (89, 119, 136) |
| `--color-ink-body` | `#4A3040` | card body text (159, 174, 204) |
| `--color-link` | `#B0285A` | links (16), "Share this link" (137) |
| `--color-link-hover` | `#8C1F48` | link hover (16), audience example text (160) |
| `--color-white` | `#FFFFFF` | cards, Sign in button, templates band |
| `--color-hero` | `#FFE9A8` | hero band (58), hero face ring (94) |
| `--color-hero-blob` | `#FFD2B8` | hero blob (60) |
| `--color-highlight` | `#FFB6C8` | "home" highlight (36) |
| `--color-button` | `#FFA5BA` | hero "Start with Google" (86) |
| `--color-button-shadow` | `#E57E98` | its 3D shadow and hover/active shadow (37-39, 86) |
| `--color-signin-shadow` | `#E9C86A` | Sign in shadow (72) |
| `--color-cta` | `#FFC2D1` | closing band and footer (259, 271) |
| `--color-cta-button-shadow` | `#E89AAE` | closing "Start with Google" shadow (267) |
| `--color-row-hover` | `#FFF4F7` | address row hover (50) |
| `--color-row-border` | `#F1E4D4` | address row divider (325-327) |
| `--color-address-shadow` | `#F2D9C0` | address panel shadow (242) |
| `--font-display` | `'Fredoka', sans-serif` | headings, logo, step numbers |
| `--font-hand` | `'Caveat', cursive` | handwritten labels |
| `--font-body` | `'Figtree', system-ui, sans-serif` | body (55) |
| `--text-base` | `18px` | body size (55) |
| `--leading-base` | `1.55` | body line height (55) |
| `--radius-pill` | `999px` | buttons, chips, badge |
| `--radius-band` | `64px` (`40px` at 767 px and narrower) | hero bottom, templates band, closing band top (58, 181, 259) |
| `--radius-card` | `32px` | audience and template cards (152, 191) |
| `--radius-panel` | `28px` | steps, address panel, sample Memory card (116, 171, 242) |
| `--page-max` | `1200px` | content width (63 and every section) |
| `--gutter` | `40px` (`20px` at 767 px and narrower) | left/right section padding |

The table has 30 rows; `tokens.css` defines exactly these 30 custom properties.

### SVG-only colors (not tokens)

These mockup colors appear only in `fill`/`stroke` attributes of the SVGs in `illustrations.tsx`, where [ADR 0003](../adr/0003-frontend-styling-and-self-hosted-fonts.md) requires raw hex values. They are listed for reference and are **not** defined in `tokens.css`. If a later task needs one of them in CSS, add a token row above first (doc change).

| Color | Used for (mockup line) |
|---|---|
| `#FF8A4C` | hearts (80, 132) |
| `#FF8FAB` | logo tile (65), footer heart (274) |
| `#FF8FA3` | face cheeks (94, 155) |
| `#FFC93C` | sun, star fill (108, 133) |
| `#FFB020` | sun rays, star stroke (107, 133) |

## Fonts

Self-hosted ([ADR 0003](../adr/0003-frontend-styling-and-self-hosted-fonts.md)), task [add-self-hosted-fonts](../tasks/web-design-foundation/add-self-hosted-fonts.md).

| Family | Weights | Package |
|---|---|---|
| Fredoka | 500, 600, 700 | `@fontsource/fredoka` |
| Caveat | 500, 700 | `@fontsource/caveat` |
| Figtree | 400, 500, 600 | `@fontsource/figtree` |

The mockup sets `font-weight: 700` on some Figtree text (buttons, nav Sign in, address URLs) but loads Figtree only up to 600, so it renders those at 600. Load the same weights and keep `700` in CSS: the result matches the mockup.

## Typography scale (desktop)

| Element | Font | Weight | Size / line height | Letter spacing | Line |
|---|---|---|---|---|---|
| Body | body | 400 | 18px / 1.55 | - | 55 |
| Logo word | display | 600 | 24px | -0.01em | 66 |
| Nav links | body | 600 | 16px | - | 68-71 |
| Hero `h1` | display | 700 | 76px / 1.0 | -0.02em | 83 |
| Hero lead | body | 400 | 22px / 1.5 | - | 84 |
| `h2` who / how / templates | display | 700 | 48px / 1.08 | -0.01em | 147, 168, 185 |
| `h2` moments | display | 700 | 44px / 1.1 | - | 225 |
| `h2` addresses | display | 700 | 46px / 1.08 | -0.01em | 238 |
| `h2` closing | display | 700 | 54px / 1.05 | -0.01em | 264 |
| `h3` audience | display | 600 | 28px / 1.15 | - | 158 |
| `h3` step | display | 600 | 24px / 1.2 | - | 173 |
| `h3` template | display | 600 | 25px / 1.2 | - | 203 |
| Handwritten labels | hand | 500 or 700 | as in lines 124, 126-127, 137, 160, 229 | - | |

## Responsive rules

The mockup is drawn at 1440 px only (`$preview.width: 1440`). Rules below are the **default until [Q004](../questions/questions-2026-11-10-requirement-breakdown.md#q004-mobile-layout-for-the-homepage) is answered**. At 1440 px the page matches the mockup ([Checking fidelity](#checking-fidelity)). Between 768 and 1439 px the mockup's own `flex-wrap`/grid behavior applies unchanged and there is no horizontal scrollbar. The rules below apply at every width:

| Viewport width | Rule |
|---|---|
| any | Keep the mockup's `flex-wrap` behavior: hero columns, addresses columns and closing band stack when they do not fit. |
| any | Grids use `repeat(auto-fit, minmax(min(<N>px, 100%), 1fr))` with the mockup's `<N>` (300, 240, 320), so a single column never overflows. |
| any | Do not copy the artboard's `min-height: 3500px` (line 55); page height follows content. Keep `overflow: hidden` on the page wrapper. |
| any | Long address text keeps `overflow-wrap: anywhere` (lines 120, 248). |
| <= 767 px | `--gutter` is `20px` (every `40px` left/right section padding uses `var(--gutter)`). |
| <= 767 px | Hero `h1` `48px`; every `h2` `34px`; hero lead `19px`. Line heights and letter spacing unchanged. |
| <= 767 px | Every section's top and bottom padding is capped at `64px` (`min(<desktop value>, 64px)`); the who-section top padding `104px` becomes `64px`. |
| <= 767 px | `--radius-band` corners become `40px`. |
| <= 559 px | Hero collage (1d) is not shown (`display: none`); the hero intro fills the width. |
| 320 px | No horizontal scrollbar: `document.documentElement.scrollWidth <= window.innerWidth`. |
| 320-1024 px | No visible content cut off at the sides. Because the page wrapper has `overflow: hidden`, overflow does not reach `scrollWidth`, so every responsive check also runs the **clip check** below and expects `0`. Decorative elements (`aria-hidden="true"`: blobs, collage, preview drawings, faces) are excluded. |

Clip check (run in the Console or a Playwright `page.evaluate`):

```js
[...document.querySelectorAll('header *, main *, footer *')].filter(e => !e.closest('[aria-hidden="true"]') && e.getBoundingClientRect().width > 0 && (e.getBoundingClientRect().left < -0.5 || e.getBoundingClientRect().right > innerWidth + 0.5)).length
```

## Motion and interaction

Copy keyframes and hover rules by value from lines 17-50 into the module CSS of the component that uses them.

| Rule | Mockup | Applies to |
|---|---|---|
| Entrance `sm-rise` 0.8s; delays: badge 0s, `h1` 0.1s, lead 0.25s, CTA row 0.4s (the mockup's `sm-d4` 0.55s is unused) | 27, 32-33, 79-85 | hero badge, `h1`, lead, CTA row |
| Faces `sm-pop`, delays 0.7-1.1s | 28, 34-35 | hero faces row |
| Highlight sweep `sm-hl` | 29, 36 | "home" in `h1` |
| Primary buttons lift: hover and `:focus-visible` `translateY(-3px)`, shadow `0 9px 0 #E57E98`; `:active` `translateY(3px)`, shadow `0 2px 0 #E57E98` | 37-39 | both "Start with Google" links |
| Cards lift `translateY(-8px) rotate(-1deg)`, faces bob | 40-43 | audience and template cards |
| Chips straighten `rotate(0) scale(1.08)` | 44-45 | block chips and moment chips |
| Steps lift `translateY(-6px)`, number spins | 46-48 | step items |
| Address row hover background | 49-50 | address rows |
| Endless decor: blob, float, spin, drift, beat, twinkle, sway, wiggle | 17-31, 60, 106-135, 260-261 | hero and closing decor |
| `prefers-reduced-motion: reduce` turns off every animation and transition (hover changes then apply instantly) | 51 | whole page (global rule in `index.css`) |
| Link colors on hover: every link that has its own color in the mockup (logo, nav, Sign in, both "Start with Google", "See how it works") keeps that color on hover, because inline styles beat the global `a:hover` rule. In CSS Modules, repeat the color in the link's `:hover` rule. | 16, 64-87, 267 | those links |

## Links

| Link text | Where | `href` |
|---|---|---|
| Logo "SweetMemories" | header | `/` (mockup `#`) |
| Who it is for / How it works / Templates | header nav | `#who` / `#how` / `#templates` |
| Sign in | header nav | `SIGN_IN_HREF` (mockup `Dashboard.dc.html`) |
| Start with Google | hero and closing band | `SIGN_IN_HREF` |
| See how it works | hero | `#how` |

`SIGN_IN_HREF` is one constant in `content.ts`; default `/sign-in` until [Q002](../questions/questions-2026-11-10-requirement-breakdown.md#q002-where-do-sign-in-and-start-with-google-go-before-auth-exists) is answered (that path shows the Homepage again through the SPA fallback).

## Accessibility

- Every decorative SVG, blob and illustration block has `aria-hidden="true"` (as in the mockup); the sample Memory card in the collage is decorative too.
- Do not remove the browser's focus outline. Tap targets keep the mockup's `min-height` (44-64 px).
- Copy uses typographic apostrophes (`’`) exactly as in the mockup data.
- Lists stay lists: steps are an `ol`, address rows a `ul`.

## Deviations from the mockup (intended)

| Mockup | App | Why |
|---|---|---|
| Google Fonts `<link>` (line 13) | self-hosted Fontsource | privacy, no third-party requests ([ADR 0003](../adr/0003-frontend-styling-and-self-hosted-fonts.md)) |
| `min-height: 3500px` (55) | none | artboard size, not design |
| Links to `Dashboard.dc.html` | `SIGN_IN_HREF` | no dashboard yet |
| Logo `href="#"` | `/` | real home link |
| hero band `div` (58), top bar `header` (63), hero `section` (76) | band `header`, top bar `div`, hero row `div`; sections 2-7 in `main` | correct landmarks (see Page structure); no visual change |
| no mobile design | rules above | [Q004](../questions/questions-2026-11-10-requirement-breakdown.md#q004-mobile-layout-for-the-homepage) |
| closing text column `flex: 1 1 420px` (263) | adds `min-width: 0` | prevents overflow at 320 px; no visual change at 1440 px ([build-page-closing](../tasks/homepage/build-page-closing.md)) |

## Checking fidelity

1. Serve the mockup (see top) and the app (`npm run dev -w apps/web`).
2. Open both in Chrome at a 1440 x 900 viewport (DevTools device toolbar, "Responsive", 1440 x 900), reduced motion off, wait 3 s for entrance animations.
3. Scroll both to the same section and compare. Positions, sizes, colors, radii and shadows must match; text wrapping may differ by at most one word per line (font rendering). Any other difference is a defect unless listed under Deviations.
4. Tolerance (default until [Q008](../questions/questions-2026-11-10-requirement-breakdown.md#q008-visual-fidelity-tolerance-for-the-homepage) is answered; optional reviewer check, see step 5): for section headings, cards, panels and buttons, `getBoundingClientRect()` `x`, `y` (relative to the section's own top), `width` and `height` are each within ±4 px of the same element in the mockup (read with DevTools Inspect or the Console in both tabs). Colors, radii, shadows, font family, size and weight are exact (the task's computed-value checks). Decorative positions inside illustrations (collage, blobs) are compared by eye only.
5. Automated part: each ticket's mockup case (E2E-2) is a Playwright spec that asserts the case's `Visual:` values as [Visual assertions](#visual-assertions) says ([ADR 0005](../adr/0005-e2e-signed-in-data-writing-and-visual-specs.md)). Decided ([Q015](../questions/questions-2026-11-10-requirement-breakdown.md#q015-do-the-measured-visual-assertions-replace-the-mockup-bounding-box-comparison), option A): the measured `Visual:` values replace the ±4 px mockup-box comparison of step 4 (positions follow from the asserted padding, margins, gaps and sizes), so a passing E2E-2 spec is what the fidelity checklist item requires. Steps 3 and 4 stay an optional reviewer check, not a pass condition; only decorative positions remain a by-eye prose step of E2E-2.

## Test case fields

How the Homepage's `e2e-test-suites` fill the case fields of [ADR 0004](../adr/0004-playwright-e2e-specs.md) and [ADR 0005](../adr/0005-e2e-signed-in-data-writing-and-visual-specs.md) (both `accepted`):

| Field | Homepage rule |
|---|---|
| `Auth` | always `none`: the page is public and has no sign-in. |
| `Data` | always `none`: the page is static and writes nothing. |
| `Visual` | measured mockup values, only on the mockup case (E2E-2) of the feature and of each section task. That case is a spec in the ticket's own spec file (`e2e/specs/homepage/<feature-or-task-slug>.spec.ts`), asserted as [Visual assertions](#visual-assertions) says; a by-eye prose step remains only for decorative positions. Cases that assert fixed computed values at the Playwright config viewport (1440 x 900) without mockup values use `Visual: none`. |

Viewports for `Visual:` values (decided, [Q013](../questions/questions-2026-11-10-requirement-breakdown.md#q013-viewports-for-homepage-visual-values) option A): CSS values are valid at 1280 and 1440 wide, mobile values at 390 wide, and the optional bounding-box comparison with the mockup is at 1440. Why: ADR 0005 names 390 and 1280 wide; the mockup is drawn at 1440. Between 768 and 1439 px no responsive rule applies, so every computed CSS value (colors, font sizes, radii, shadows, padding, column counts) is the same at 1280 and 1440; only `x` positions shift by 80 px. `Visual:` lines therefore give one set of values "at 1280 and 1440" and one "at 390" (the [Responsive rules](#responsive-rules) for <= 767 px and <= 559 px apply). The bounding-box comparison with the mockup (Checking fidelity step 4, optional per [Q015](../questions/questions-2026-11-10-requirement-breakdown.md#q015-do-the-measured-visual-assertions-replace-the-mockup-bounding-box-comparison)) stays at 1440.

### Visual assertions

How the `tester` turns a `Visual:` line into Playwright assertions ([ADR 0005](../adr/0005-e2e-signed-in-data-writing-and-visual-specs.md), Visual fidelity). The values in `Visual:` are the expected values; the spec does not open the mockup. No `toHaveScreenshot`, no baselines ([ADR 0003](../adr/0003-frontend-styling-and-self-hosted-fonts.md)). The tester writes the spec code; docs do not hold it.

| `Visual:` wording | Assertion |
|---|---|
| Setup | Run the "at 1280 and 1440 wide" set at viewport 1440 x 900 and again at 1280 x 900 (same expected values); run the "At 390 wide" set at 390 x 900 (height changes no listed value). Emulate `reducedMotion: 'reduce'` so entrance and decorative motion are off and transforms are static, then wait for `document.fonts.ready`. Not signed in, no hover. |
| Element | Located as ADR 0004 "Selectors" says: role and visible text first (headings, links, lists), then the ticket's `Testids`, then the element path from the task's Scope markup (tag and child order under the nearest section id, `header`, `footer` or test id). Naming the element in `Visual:` counts as the case naming that path. Never class names. |
| CSS value: color, background, font size, weight, line height, letter spacing, padding, margin, gap, radius, border, box shadow, opacity, overflow, display, min height, `left`/`top`/`right`/`bottom` | `toHaveCSS(<property>, '<value>')` with the exact string in `Visual:` (already in Chrome's computed form: `rgb(...)`, px). "top radii" and "bottom radii" check both corners; "border-top 1px solid ..." checks `border-top`. |
| Font: "Fredoka 700 48px" | first family of computed `font-family`, quotes removed, equals the name; weight and size with `toHaveCSS`. |
| Size: "W x H px", "Npx wide", "height Npx" | `toHaveCSS('width' / 'height')` exact. A size the case calls "bounding box" uses `boundingBox()` within ±4 px ([Q008](../questions/questions-2026-11-10-requirement-breakdown.md#q008-visual-fidelity-tolerance-for-the-homepage) default). |
| "circle" | `border-radius` is `50%`. |
| "max width Nch" | computed `max-width` is `Nch`, or in px equals N × the element's `1ch` (append a temporary `span` with `display: inline-block; width: 1ch` to the element, read its width, remove it) within ±1 px. |
| "rotated Ndeg" | computed `transform` `matrix(a, b, c, d, e, f)`: `atan2(b, a)` in degrees equals N within ±0.5. |
| "N columns", "N equal columns", "1 column" | among the items (cards, `li`, `article`), those whose box top is within ±4 px of the first item's top number N; "equal": their box widths are within ±1 px of each other; "1 column": every item's box `x` is within ±4 px of the first item's. "two columns" of a row: its two children share one row by the same rule. |
| "two rows", "two lines" | rows: the item box tops form 2 groups (±4 px); lines: box height / computed line height rounds to 2. |
| "on one row", "vertically centered" | box vertical centers within ±4 px. |
| "A left and B right", "right of A" | A's box right <= B's box left + 0.5. |
| "below" | the lower box top >= the upper box bottom − 0.5. |
| "left", "left-aligned", "right", "right-aligned", "bottom-aligned with X" | the box left (or right, or bottom) edge is within ±4 px of the parent's content-box edge (or of X's edge). |
| "centered" (an element), "text centered" | element: its box center `x` is within ±4 px of the parent's content-box center; text: `toHaveCSS('text-align', 'center')`. "chips wrap centered": the chip container has `justify-content: center` and every chip box lies within `0..innerWidth`. |
| "wraps inside the panel" | the element's box height >= 2 × its line height − 1 and its box right <= the panel's box right. |
| Decorative positions not listed in `Visual:` (shapes inside the collage, template previews, audience faces, blobs) | not asserted; the case's last step compares them by eye with the mockup at 1440 x 900 and runs as prose. Shapes themselves are checked in [add-home-illustrations](../tasks/homepage/add-home-illustrations.md). |
