# ADR 0006: Per-environment site URL and search indexing

## Status

accepted

Open questions: [../decisions/homepage-adr.md](../decisions/homepage-adr.md)

## Context

Canonical, `og:url`, `og:image`, `twitter:image` and the JSON-LD `url` must be absolute URLs. The same build runs locally (`pnpm dev` on Vite, `pnpm start` on `wrangler dev`), on dev (`*.workers.dev`, which is public) and later in production (`sweetmemories.com`). Hard-coding the production URL makes dev pages claim to be production. Leaving dev indexable lets search engines index a test site full of synthetic data.

Options:

1. **Hard-code `https://sweetmemories.com`.** Simplest. Cons: dev and local emit production URLs, dev stays indexable, and OG previews on dev point at production images that may not exist yet.
2. **`SITE_URL` and `SITE_INDEXABLE` values per environment, read on the server through `process.env`.** Explicit and testable per environment, and dev gets `noindex, nofollow`. Cons: two values to keep right for each environment.
3. **Derive the origin from the request `Host` header.** No config. Cons: an attacker-controlled Host could be reflected into canonical and OG tags (a cache poisoning risk), and indexing still needs a separate flag.

## Decision

Option 2, following the `src/env.d.ts` convention: the server reads `process.env.SITE_URL` and `process.env.SITE_INDEXABLE` (nodejs_compat) and declares both there.

- Local (`pnpm dev` and `pnpm start`): set in `.env`, documented in `.env.example`.
- dev: plain `vars` under `env.dev` in `wrangler.jsonc`. These values are not secrets. Do not add top-level `vars` unless local `pnpm start` cannot read `.env` (see the `wrangler.jsonc` note that Nitro merges the file into `.output/server/wrangler.json`).
- Production: set when that environment is created.
- `SITE_INDEXABLE` is `"true"` only in production.
- Fail safe: if `SITE_INDEXABLE` is anything other than `"true"`, robots is `noindex, nofollow`. If `SITE_URL` is missing or invalid, the page still renders, omits canonical and every absolute URL tag, and is `noindex, nofollow`.

## Consequences

- Canonical and OG URLs are correct everywhere, and dev is never indexed.
- Future public pages (the User home page, Memory pages) reuse the same values.
- The production environment must set both values when it is created.
- Misconfiguration degrades to "not indexed", never to "wrong host".

Feature: [homepage-seo](../features/homepage-seo.md)
