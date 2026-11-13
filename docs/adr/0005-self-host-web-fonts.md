# ADR 0005: Self-host the web fonts

## Status

accepted

Open questions: [../decisions/homepage-adr.md](../decisions/homepage-adr.md)

## Context

The homepage mockup loads Fredoka (500/600/700), Caveat (500/700) and Figtree (400/500/600) from `fonts.googleapis.com`. Each visitor would then make a third-party request: their IP address goes to Google, there is an extra DNS/TLS round trip, and the page depends on something outside our control. Rule 1 and the planned cookie-free public origin push the project toward pages with no third-party dependencies. Memory pages and Templates will likely reuse the same fonts.

Options:

1. **Google Fonts CDN, as in the mockup.** Zero setup. Cons: a third-party request on every page, privacy and GDPR exposure, render-blocking CSS from another origin, and a harder strict CSP later.
2. **Self-host through `@fontsource/*` packages, bundled by Vite and served from the Worker's static assets.** Same origin, versioned in the lockfile, CSP-friendly, and works offline in dev. Cons: a slightly larger build, and we have to choose subsets and weights (latin only, listed weights only).
3. **System font stack only.** No downloads. Cons: loses the design's look (Fredoka headings, Caveat handwriting).

## Decision

Option 2. Self-host the latin subsets of only the weights the mockup uses, with `font-display: swap`. Preload the hero heading font file (Fredoka 700 latin, woff2). Task [H1](../tasks/homepage/01-design-tokens-fonts-motion.md) covers the preload.

## Consequences

- `/` makes no external requests, and e2e can assert that.
- The fonts are ready for Memory pages on the cookie-free origin.
- Adding a weight or family means adding a package.
- Font files count toward Worker asset size, which stays small.

Feature: [homepage](../features/homepage.md)
