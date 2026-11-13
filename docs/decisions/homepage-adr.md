# Open questions: homepage ADRs

ADRs: [0005 self-host web fonts](../adr/0005-self-host-web-fonts.md), [0006 per-environment site URL and indexing](../adr/0006-per-environment-site-url-and-indexing.md)

## Topic: ADR 0005: Self-host the web fonts

### How should the Fredoka, Caveat and Figtree fonts be loaded?

Options:
- Self-host via @fontsource packages (same origin), preload the hero font
- Google Fonts CDN as in the mockup
- System font stack only

Recommended answer: Self-host via @fontsource: no third-party requests or IP leaks, CSP-friendly, and reusable on the future cookie-free Memory pages.

Answer: Agreed with the recommended answer (2026-11-14). Status: answered.

## Topic: ADR 0006: Per-environment site URL and search indexing

### How should canonical/OG absolute URLs and robots indexing be set per environment?

Options:
- SITE_URL + SITE_INDEXABLE read via process.env (.env locally, env.dev vars on dev); noindex unless production
- Hard-code https://sweetmemories.com everywhere
- Derive origin from the request Host header

Recommended answer: SITE_URL + SITE_INDEXABLE via process.env: correct URLs on dev and prod, dev never indexed, immune to Host header injection, and consistent with env.d.ts.

Answer: Agreed with the recommended answer (2026-11-14). Status: answered.
