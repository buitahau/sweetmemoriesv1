# Add design tokens

- Status: blocked (design gate below)

## Goal

Define every design token from the Homepage design as CSS custom properties and set the global base styles (body, links, reduced motion).

## Scope

Area: UI (two CSS files, one import). Decision: [ADR 0003](../../adr/0003-frontend-styling-and-self-hosted-fonts.md), rows Design tokens, Global base styles, Motion. Values: [ui/homepage.md, Design tokens](../../ui/homepage.md#design-tokens).

| File | Change |
|---|---|
| `apps/web/src/styles/tokens.css` (new) | First line comment `/* Design tokens, see docs/ui/homepage.md#design-tokens */`. One `:root { ... }` block with every token from the ui/homepage.md table, in table order, hex values written exactly as in the table (uppercase). Then `@media (max-width: 767px) { :root { --gutter: 20px; --radius-band: 40px; } }`. No other rules. |
| `apps/web/src/index.css` | Replace the whole file with: (1) `body { margin: 0; background: var(--color-page); color: var(--color-ink); font-family: var(--font-body); font-size: var(--text-base); line-height: var(--leading-base); }` (2) `a { color: var(--color-link); }` and `a:hover { color: var(--color-link-hover); }` (mockup line 16) (3) `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }` (mockup line 51). Remove the old `main { padding: 1rem; }` rule. |
| `apps/web/src/main.tsx` | Add `import './styles/tokens.css'` directly after `import './styles/fonts.ts'` and before `import './index.css'`. |

Prerequisites (must be `done`): [add-self-hosted-fonts](add-self-hosted-fonts.md). Design gate: [ADR 0003](../../adr/0003-frontend-styling-and-self-hosted-fonts.md) Status is `accepted` ([Q001](../../questions/questions-2026-11-10-requirement-breakdown.md#q001-accept-adr-0003-styling-and-self-hosted-fonts) answered A); until then this task stays `blocked`.

Do not define the five SVG-only colors ([ui/homepage.md, SVG-only colors](../../ui/homepage.md#svg-only-colors-not-tokens)); they are not tokens.

Out of scope: any component or section style, `index.html`, dark mode, tokens not in the ui/homepage.md table (add them to that table first, in a doc change, if a later task needs one).

Security: CSS only; no external `@import` or `url()` to another origin (CLAUDE.md rule 1 groundwork).

## Verification checklist

The task is complete only when every item below passes. Tags name the [web-design-foundation](../../features/web-design-foundation.md) acceptance criterion (ACn).

- [ ] 1. `tokens.css` defines every token of the ui/homepage.md table: for each name in the table, `grep -c -- '<name>:' apps/web/src/styles/tokens.css` prints at least 1; total custom properties in the first `:root` block equals the number of table rows (30), and none of `--color-heart`, `--color-logo`, `--color-cheek`, `--color-sun`, `--color-sun-ray` is defined. (AC2)
- [ ] 2. In the browser at 1440 px, each token's `getComputedStyle(document.documentElement).getPropertyValue(name).trim()` equals the table value. (AC2)
- [ ] 3. At 375 px, `--gutter` is `20px` and `--radius-band` is `40px`; at 768 px they are `40px` and `64px`. (Behavior)
- [ ] 4. Body computed styles: background `rgb(255, 247, 234)`, color `rgb(59, 36, 51)`, font size `18px`, line height `27.9px`, margin `0px`, font family starting with `Figtree`. (AC3)
- [ ] 5. A link added in the console has color `rgb(176, 40, 90)`; the `a:hover` rule with `var(--color-link-hover)` exists in `index.css`. (AC3)
- [ ] 6. With reduced motion emulated, an element with `animation: x 1s infinite` has `animationName` `none` and `transitionDuration` `0s`; without emulation, `x` and its declared transition. (AC4)
- [ ] 7. `grep -n 'url(\|@import' apps/web/src/styles/tokens.css apps/web/src/index.css` prints nothing. (Security)
- [ ] 8. `npm test -w apps/web`, `npm run typecheck -w apps/web`, `npm run build -w apps/web` exit 0; `document.title` is still `SweetMemories`. (AC5, AC6)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated.

```
E2E-1 -> checklist item 1: every token present in the file
Preconditions: branch checked out
Steps:
  1. Run: for t in --color-page --color-ink --color-ink-soft --color-ink-muted --color-ink-body --color-link --color-link-hover --color-white --color-hero --color-hero-blob --color-highlight --color-button --color-button-shadow --color-signin-shadow --color-cta --color-cta-button-shadow --color-row-hover --color-row-border --color-address-shadow --font-display --font-hand --font-body --text-base --leading-base --radius-pill --radius-band --radius-card --radius-panel --page-max --gutter; do grep -q -- "$t:" apps/web/src/styles/tokens.css || echo "missing $t"; done; echo done
  2. Run: awk '/^:root/{f=1} f{print} f&&/^}/{exit}' apps/web/src/styles/tokens.css | grep -c -- '--[a-z-]*:'
  3. Run: grep -c -E -- '--color-(heart|logo|cheek|sun|sun-ray):' apps/web/src/styles/tokens.css
Expected: step 1 prints only "done"; step 2 prints 30; step 3 prints 0
```

```
E2E-2 -> checklist items 2, 3: computed token values and breakpoint
Preconditions: app running at $BASE_URL
Steps:
  1. Open $BASE_URL/ at 1440 x 900. In Console run: const s=getComputedStyle(document.documentElement); ['--color-page','--color-ink-soft','--color-button','--color-button-shadow','--font-hand','--text-base','--leading-base','--radius-panel','--page-max','--gutter','--radius-band'].map(t=>s.getPropertyValue(t).trim())
  2. Set viewport 375 x 812, reload, run: const r=getComputedStyle(document.documentElement); [r.getPropertyValue('--gutter').trim(), r.getPropertyValue('--radius-band').trim()]
  3. Set viewport 768 x 1024, reload, run the step 2 command.
Expected: step 1 ["#FFF7EA","#5A3C4B","#FFA5BA","#E57E98","'Caveat', cursive","18px","1.55","28px","1200px","40px","64px"]; step 2 ["20px","40px"]; step 3 ["40px","64px"]
```

```
E2E-3 -> checklist items 4, 5: body and link styles
Preconditions: app running, 1440 x 900
Steps:
  1. In Console run: const b=getComputedStyle(document.body); [b.backgroundColor,b.color,b.fontSize,b.lineHeight,b.margin,b.fontFamily.split(',')[0]]
  2. Run: const a=document.createElement('a'); a.href='#x'; a.textContent='x'; document.body.append(a); getComputedStyle(a).color
  3. Run: grep -n 'a:hover' apps/web/src/index.css
Expected: step 1 ["rgb(255, 247, 234)","rgb(59, 36, 51)","18px","27.9px","0px", "Figtree" (with or without quotes)]; step 2 "rgb(176, 40, 90)"; step 3 shows one line containing var(--color-link-hover)
```

```
E2E-4 -> checklist item 6: reduced motion
Preconditions: app running; DevTools > Rendering > prefers-reduced-motion = reduce
Steps:
  1. In Console run: const d=document.createElement('div'); d.style.animation='x 1s infinite'; d.style.transition='opacity 1s'; document.body.append(d); [getComputedStyle(d).animationName, getComputedStyle(d).transitionDuration]
  2. Set emulation to "No emulation", reload, repeat step 1.
Expected: step 1 ["none","0s"]; step 2 ["x","1s"]
```

```
E2E-5 -> checklist items 7, 8: no external CSS, builds pass
Preconditions: npm install done
Steps:
  1. Run: grep -n 'url(\|@import' apps/web/src/styles/tokens.css apps/web/src/index.css; echo "g=$?"
  2. Run: npm test -w apps/web && npm run typecheck -w apps/web && npm run build -w apps/web; echo "e=$?"
  3. In the browser Console run: document.title
Expected: step 1 prints only "g=1"; e=0; "SweetMemories"
```

## Links

- Feature: [web-design-foundation](../../features/web-design-foundation.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#design-tokens)
