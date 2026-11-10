# 0003: Frontend styling and self-hosted fonts

- Status: accepted ([Q001](../questions/questions-2026-11-10-requirement-breakdown.md#q001-accept-adr-0003-styling-and-self-hosted-fonts), option A, approved by the product owner 2026-11-10). The design gate is met: every task that depends on this decision (fonts, tokens, the Homepage shell and every section task after it) may start once its own Prerequisites are `done`.
- Date: 2026-11-10

## Context

- Product-owner requirement (2026-11-10): implement the public Homepage from the mockup in [docs/ui/Homepage/](../ui/Homepage/README.md) (`Landing2.dc.html`, "Homepage, light pink"). Replicate its colors, font sizes, spacing, radii, shadows and layout in the React app; do not copy the markup wholesale.
- `apps/web` today ([web-skeleton](../features/web-skeleton.md)): React 19 + Vite, one `<h1>`, `src/index.css` with two rules, no styling system, no fonts, no router ([ADR 0001](0001-monorepo-skeleton-and-tooling.md)).
- The mockup uses three web fonts (Fredoka 500/600/700, Caveat 500/700, Figtree 400/500/600) loaded from `fonts.googleapis.com`, about 130 inline styles, 15 keyframe animations, hover classes and a `prefers-reduced-motion` rule. It is drawn for a 1440 px wide screen only.
- The web skeleton guarantees "no network request to another origin" and "no cookies" ([web-skeleton](../features/web-skeleton.md) AC3; groundwork for `CLAUDE.md` security rules 1 and 5). Loading Google Fonts would send every visitor's IP address and page URL to Google and break that guarantee.
- The dev deploy smoke check needs `<title>SweetMemories</title>` and `<div id="root">` in `/` ([add-dev-smoke-script](../tasks/dev-deploy-verification/add-dev-smoke-script.md), check 3).
- `CLAUDE.md`: domain code (users, memories, templates, blocks, photos, auth, database) waits for design approval. The Homepage is marketing content only.
- No styling choice exists, so without this ADR every junior task would have to pick one. Facts checked 2026-11-10: `@fontsource/fredoka`, `@fontsource/caveat`, `@fontsource/figtree` are on npm at version `5.3.0`, licence OFL-1.1 (`https://registry.npmjs.org/@fontsource/<name>/latest`).

## Decision

| Concern | Choice |
|---|---|
| Styling system | Plain CSS. One CSS Module (`<Component>.module.css`, built into Vite) per component. No CSS framework, no CSS-in-JS, no Tailwind, no inline `style` props except for per-item colors and rotations that come from data (e.g. a card's `background`). |
| Design tokens | CSS custom properties in `apps/web/src/styles/tokens.css`, imported once in `src/main.tsx`. Token names and values: [ui/homepage.md, Design tokens](../ui/homepage.md#design-tokens). Component CSS uses `var(--token)`, never a raw hex value that has a token. Exception: `fill`/`stroke` attributes inside the SVGs of `illustrations.tsx` use the mockup's hex values directly (SVG attributes do not reliably accept `var()`); colors used only there get no token ([ui/homepage.md, SVG-only colors](../ui/homepage.md#svg-only-colors-not-tokens)). Colors without a token: per-item colors of repeated data items (cards, chips, rows) live in `content.ts`; one-off colors of a single illustration (hero collage, closing-band blobs) are raw hex in that component's module CSS ([ui/homepage.md, Design tokens](../ui/homepage.md#design-tokens)). |
| Global base styles | `apps/web/src/index.css`: body font, color, background, link colors, the global reduced-motion rule. Nothing component-specific. |
| Fonts | Self-hosted from npm: `@fontsource/fredoka`, `@fontsource/caveat`, `@fontsource/figtree`, `^5`, as `dependencies` of `apps/web`. Exactly the mockup's weights: Fredoka 500/600/700, Caveat 500/700, Figtree 400/500/600, imported per weight (`@fontsource/<name>/<weight>.css`) in `apps/web/src/styles/fonts.ts`. Vite bundles the `woff2` files into `dist/assets`, so they are served from the app's own origin. Never load fonts (or any asset) from a third-party origin. |
| Static content | All Homepage copy and per-item data (colors, rotations, sizes) live as typed constants in `apps/web/src/home/content.ts`. No `fetch`, no API call, no domain types (User, Memory, Template, Block, Photo) in code. Template cards and block chips on the Homepage are illustrations, not real Templates. |
| Graphics | Decorative shapes are inline SVG React components in `apps/web/src/home/illustrations.tsx`, always `aria-hidden="true"`. No image files. |
| Component location | Homepage components in `apps/web/src/home/` (one component + one `.module.css` + one `.test.tsx` per section). Move a component to `src/components/` only when a second page needs it. |
| Motion | Keyframes copied by value from the mockup into the module CSS that uses them. A global `@media (prefers-reduced-motion: reduce)` rule in `index.css` turns off all animations and transitions. |
| Routing | None added. The Homepage renders at every path (Vite and Workers SPA fallback, unchanged). A router comes with the first second screen, in its own ADR. |
| Sign-in links | Point to one constant `SIGN_IN_HREF` in `content.ts` (value decided in [Q002](../questions/questions-2026-11-10-requirement-breakdown.md#q002-where-do-sign-in-and-start-with-google-go-before-auth-exists)). No auth code. |
| Testing | Vitest + Testing Library check structure, text, roles and links. Visual values are checked in a browser with `getComputedStyle` and a side-by-side comparison against the mockup at 1440 px ([ui/homepage.md, Checking fidelity](../ui/homepage.md#checking-fidelity)). No screenshot-diff tool is added. |
| Page `<head>` | Unchanged from the skeleton: `<title>SweetMemories</title>`, `lang="en"`, `<link rel="icon" href="data:,">`. |

## Consequences

- No third-party requests and no cookies on the Homepage: the skeleton guarantee holds, and the same setup can later serve cookie-less public Memory pages (rule 1) without privacy leaks.
- Three new runtime dependencies (font CSS + font files, OFL-1.1). The build holds one `woff2` (and one `woff` fallback) per weight and unicode subset (latin, latin-ext and others the family ships), so 20 or more font files (assumption from Fontsource v5 packaging, not counted offline); the browser downloads only the subsets the page's text uses.
- CSS Modules need no new tooling (Vite and Vitest support them). Class names are hashed, so tests select by role and text, not by class.
- Copy changes are one-file edits in `content.ts`, which matters while [Q003](../questions/questions-2026-11-10-requirement-breakdown.md#q003-homepage-copy-promises-features-that-are-not-designed) is open.
- The mockup has no mobile design; responsive rules in [ui/homepage.md](../ui/homepage.md#responsive-rules) are a default until [Q004](../questions/questions-2026-11-10-requirement-breakdown.md#q004-mobile-layout-for-the-homepage) is answered.
- The placeholder heading "SweetMemories home page" and its two tests are replaced; [web-skeleton](../features/web-skeleton.md) stays `done` as history.
- Smoke check 3 (title and root div) keeps passing because `index.html` is not changed.

## Alternatives

| Option | Why not chosen |
|---|---|
| Google Fonts `<link>` as in the mockup | Third-party request on every visit (privacy, IP address to Google); breaks the skeleton's no-third-party guarantee. |
| Copy `woff2` files into `public/fonts/` by hand | Same result as Fontsource but manual updates and licence tracking; `public/` was removed in the skeleton. |
| Tailwind CSS | New tool and build plugin to learn; the mockup's values are one-off (e.g. 76 px, 22 px 40 px) and map poorly to a utility scale. |
| CSS-in-JS (styled-components, Emotion) | Runtime cost, extra dependency; CSS Modules do the job with zero config. |
| Copy the mockup's inline styles into JSX `style` props | Fast, but no hover/keyframes/media queries in inline styles; unreadable and impossible to make responsive. |
| Render `Landing2.dc.html` as-is | The requirement forbids copying the markup; it needs its own runtime (`support.js`). |

## Features

- [web-design-foundation](../features/web-design-foundation.md): self-hosted fonts, design tokens and global base styles for `apps/web`.
- [homepage](../features/homepage.md): the public Homepage built from the mockup, static and frontend-only.
