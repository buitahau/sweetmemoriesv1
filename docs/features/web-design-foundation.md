# Web design foundation

- Status: blocked (design gate: [ADR 0003](../adr/0003-frontend-styling-and-self-hosted-fonts.md) must be `accepted`, [Q001](../questions/questions-2026-11-10-requirement-breakdown.md#q001-accept-adr-0003-styling-and-self-hosted-fonts))

## Summary

Gives `apps/web` the shared look every screen builds on: the three brand fonts served from the app's own origin, design tokens as CSS custom properties, and global base styles (page background, text color, link colors, reduced motion). Decided in [ADR 0003](../adr/0003-frontend-styling-and-self-hosted-fonts.md); values from [ui/homepage.md](../ui/homepage.md#design-tokens). No visible layout yet: the placeholder page only changes font and colors.

## User story

As a frontend developer, I want fonts, colors, radii and base styles defined once, so that every Homepage section (and later screen) uses the same values without copying hex codes or loading fonts from Google.

Acceptance criteria:
1. Fredoka 500/600/700, Caveat 500/700 and Figtree 400/500/600 are available to the page and are loaded only from the app's own origin.
2. Every token in [ui/homepage.md, Design tokens](../ui/homepage.md#design-tokens) is defined on `:root` with the listed value.
3. The body uses `--font-body`, `--text-base`, `--leading-base`, `--color-ink` on `--color-page`, with `margin: 0`; links use `--color-link`, and `--color-link-hover` on hover.
4. With `prefers-reduced-motion: reduce`, no CSS animation or transition runs anywhere.
5. The page still sets no cookies, makes no request to another origin, and keeps `<title>SweetMemories</title>` and `lang="en"`.
6. `npm test`, `npm run typecheck` and `npm run build` pass in `apps/web`.

## Behavior

- Fonts are npm packages (`@fontsource/*`, `^5`); Vite copies the `woff2` files into `dist/assets/`.
- `src/main.tsx` imports, in order: `./styles/fonts.ts`, `./styles/tokens.css`, `./index.css`.
- At 768 px and wider `--gutter` is `40px`; at 767 px and narrower it is `20px` (media query in `tokens.css`). `--radius-band` is `64px`, and `40px` at 767 px and narrower.
- No component styles here; sections add their own CSS Modules.

## Out of scope

- Any Homepage section or component ([homepage](homepage.md)).
- Dark mode, theming, a component library, icons.
- Changing `index.html` (title, favicon, meta tags).
- Fonts or styles for public Memory pages (rule 1 origin) or admin screens.

## Verification checklist

The feature is complete only when every item below passes.

- [ ] 1. Both tasks of this feature have Status `done`. (all ACs)
- [ ] 2. On `$BASE_URL/`, for each of the 8 faces (Fredoka 500/600/700, Caveat 500/700, Figtree 400/500/600), `(await document.fonts.load('<weight> 20px <Family>')).length >= 1`. (`document.fonts.check` alone is not enough: it also returns `true` when no face is registered.) (AC1)
- [ ] 3. The Network tab after load shows at least one `.woff2` request, and every request (including every `.woff2`) is on the `$BASE_URL` origin; no request to `fonts.googleapis.com`, `fonts.gstatic.com` or any other host. (AC1, AC5; CLAUDE.md rule 1 groundwork, rule 5)
- [ ] 4. `apps/web/package.json` `dependencies` list `@fontsource/fredoka`, `@fontsource/caveat`, `@fontsource/figtree` with range `^5`; `apps/web/dist/assets/` contains `.woff2` files after `npm run build -w apps/web`. (AC1)
- [ ] 5. For every token in the ui/homepage.md table, `getComputedStyle(document.documentElement).getPropertyValue('<token>').trim()` equals the listed value at 1440 px width. (AC2)
- [ ] 6. At 1440 px `--gutter` is `40px` and `--radius-band` is `64px`; at 375 px they are `20px` and `40px`. (Behavior)
- [ ] 7. `getComputedStyle(document.body)` gives `background-color: rgb(255, 247, 234)`, `color: rgb(59, 36, 51)`, `font-size: 18px`, `line-height: 27.9px`, `margin: 0px`, and `fontFamily` starting with `Figtree`; a test link added to `body` has color `rgb(176, 40, 90)`; `apps/web/src/index.css` has an `a:hover` rule using `var(--color-link-hover)`. (AC3)
- [ ] 8. With DevTools Rendering "Emulate CSS media feature prefers-reduced-motion: reduce", a test element with `animation: x 1s infinite` reports `getComputedStyle(el).animationName === 'none'`. (AC4)
- [ ] 9. DevTools Application > Cookies for `$BASE_URL` is empty; `document.title` is `SweetMemories`; `document.documentElement.lang` is `en`. (AC5)
- [ ] 10. `npm test -w apps/web`, `npm run typecheck -w apps/web`, `npm run build -w apps/web` exit 0. (AC6)
- [ ] 11. No task PR of this feature changes a file under `apps/api` (for each merged task PR `<n>`, `gh pr diff <n> --name-only | grep '^apps/api/'` prints nothing); no file in `apps/web/src` defines types named User, Memory, Template, Block or Photo (`grep -rn -E '(type|interface) (User|Memory|Template|Block|Photo)\b' apps/web/src` prints nothing); `apps/web/package.json` `dependencies` are exactly `react`, `react-dom`, `@fontsource/fredoka`, `@fontsource/caveat`, `@fontsource/figtree` (no router, auth or data library). (CLAUDE.md "Project state")

## e2e-test-suites

Type: FE. `$BASE_URL` is `http://localhost:5173` locally or `$DEV_WEB_URL` on dev ([dev-environment](../infra/dev-environment.md)). Fresh browser profile, not signed in, viewport 1440 x 900 unless stated.

```
E2E-1 -> checklist items 2, 3: fonts load from own origin only
Preconditions: app running; DevTools Network open, "Disable cache" on
Steps:
  1. Open $BASE_URL/.
  2. In Console run: (await Promise.all(['500 20px Fredoka','600 20px Fredoka','700 20px Fredoka','500 20px Caveat','700 20px Caveat','400 20px Figtree','500 20px Figtree','600 20px Figtree'].map(f => document.fonts.load(f)))).map(l => l.length)
  3. In Console run: [...new Set(performance.getEntriesByType('resource').map(e => new URL(e.name).origin))]
  4. Filter the Network tab by "woff2".
Expected: step 2 prints eight numbers, each >= 1; step 3 prints only the $BASE_URL origin; step 4 shows at least one row and every row starts with $BASE_URL; no fonts.googleapis.com or fonts.gstatic.com row anywhere
```

```
E2E-2 -> checklist item 4: dependencies and bundled font files
Preconditions: repository checked out, npm install done
Steps:
  1. Run: node -p "JSON.stringify(require('./apps/web/package.json').dependencies)"
  2. Run: npm run build -w apps/web && ls apps/web/dist/assets | grep -c '\.woff2$'
Expected: step 1 shows "@fontsource/caveat":"^5...", "@fontsource/figtree":"^5...", "@fontsource/fredoka":"^5..."; step 2 exits 0 and prints a number >= 8
```

```
E2E-3 -> checklist items 5, 6: tokens
Preconditions: app running; viewport 1440 x 900
Steps:
  1. In Console run: const s = getComputedStyle(document.documentElement); ['--color-page','--color-ink','--color-link','--color-hero','--color-cta','--font-display','--radius-pill','--radius-card','--page-max','--gutter','--radius-band'].map(t => s.getPropertyValue(t).trim())
  2. Switch device toolbar to 375 x 812, reload, run the same command.
Expected: step 1 prints ["#FFF7EA","#3B2433","#B0285A","#FFE9A8","#FFC2D1","'Fredoka', sans-serif","999px","32px","1200px","40px","64px"] (hex case as written in tokens.css); step 2 prints the same except "--gutter" "20px" and "--radius-band" "40px"; then spot-check every remaining token of ui/homepage.md the same way: each equals its listed value
```

```
E2E-4 -> checklist item 7: body and link base styles
Preconditions: app running; repository checked out
Steps:
  1. In Console run: const b = getComputedStyle(document.body); [b.backgroundColor, b.color, b.fontSize, b.margin, b.lineHeight, b.fontFamily]
  2. In Console run: const a = document.createElement('a'); a.href = '#x'; a.textContent = 'x'; document.body.append(a); getComputedStyle(a).color
  3. Run: grep -n 'a:hover' apps/web/src/index.css
Expected: step 1 ["rgb(255, 247, 234)", "rgb(59, 36, 51)", "18px", "0px", "27.9px", a string starting with "Figtree"]; step 2 "rgb(176, 40, 90)"; step 3 one line containing var(--color-link-hover)
```

```
E2E-5 -> checklist item 8: reduced motion
Preconditions: app running; DevTools > Rendering > "Emulate CSS media feature prefers-reduced-motion" = reduce
Steps:
  1. In Console run: const d = document.createElement('div'); d.style.animation = 'x 1s infinite'; d.style.transition = 'opacity 1s'; document.body.append(d); [getComputedStyle(d).animationName, getComputedStyle(d).transitionDuration]
  2. Set the emulation to "No emulation", reload, run step 1 again.
Expected: step 1 prints ["none", "0s"]; step 2 prints ["x", "1s"]
```

```
E2E-6 -> checklist items 9, 10, 11: no cookies, head unchanged, builds pass, no domain code
Preconditions: app running; repository checked out
Steps:
  1. Check DevTools Application > Cookies > $BASE_URL; in Console run: [document.title, document.documentElement.lang]
  2. Run: npm test -w apps/web && npm run typecheck -w apps/web && npm run build -w apps/web; echo "e=$?"
  3. For each merged task PR <n> of this feature run: gh pr diff <n> --name-only | grep '^apps/api/'; echo "g=$?"
  4. Run: grep -rn -E '(type|interface) (User|Memory|Template|Block|Photo)\b' apps/web/src; echo "d=$?"
  5. Run: node -p "Object.keys(require('./apps/web/package.json').dependencies).sort().join(' ')"
Expected: no cookies; ["SweetMemories","en"]; e=0; step 3 prints only "g=1" for every PR; step 4 prints only "d=1"; step 5 prints "@fontsource/caveat @fontsource/figtree @fontsource/fredoka react react-dom"
```

## Related

- Parent ADR: [0003-frontend-styling-and-self-hosted-fonts](../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../ui/homepage.md)
- Next feature: [homepage](homepage.md)
- Design gate: both tasks are `blocked` until ADR 0003 is `accepted` ([Q001](../questions/questions-2026-11-10-requirement-breakdown.md#q001-accept-adr-0003-styling-and-self-hosted-fonts)).
- Tasks:
  1. [add-self-hosted-fonts](../tasks/web-design-foundation/add-self-hosted-fonts.md)
  2. [add-design-tokens](../tasks/web-design-foundation/add-design-tokens.md)
