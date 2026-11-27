# 01 `SITE_INDEXABLE` per environment, and the shared site config

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** ADR 0006 accepted
**Feature spec:** [homepage-seo](../../features/homepage-seo.md)
**Mockup:** none

## What to change

Implement [ADR 0006](../../adr/0006-per-environment-site-url-and-indexing.md). `SITE_URL` already exists (declared in `src/env.d.ts`, in `.env.example`, `docs/infra/local-development.md` and `wrangler.jsonc` `env.dev.vars`) and is Better Auth's base URL and trusted origin ([ADR 0008](../../adr/0008-login-session-cookie-scope-and-app-origin.md)). Only `SITE_INDEXABLE` is new. Read values through `process.env` on the server, never `cloudflare:workers`, and never in a route's `head()` (the client has no `process.env`).

`pnpm start` runs `wrangler dev --env dev`, which uses `env.dev.vars` and ignores top-level `vars`. Do not add top-level `vars`; locally, `.env` or `.dev.vars` overrides the dev values.

## Checklist

- [x] Declare `SITE_INDEXABLE` in `src/env.d.ts` (`ProcessEnv`) next to `SITE_URL`
- [x] Add `SITE_INDEXABLE=false` to `.env.example` with a comment (`"true"` only in production; `pnpm start` gets `"false"` from `env.dev.vars` unless `.env` overrides it)
- [x] Add `"SITE_INDEXABLE": "false"` next to the existing `SITE_URL` under `env.dev.vars` in `wrangler.jsonc`; confirm `pnpm build` still produces an accepted `.output/server/wrangler.json`
- [x] Helper `getSiteConfig()` returning `{ siteUrl: string | null, indexable: boolean }`: `siteUrl` comes from the existing `normalizeSiteUrl` in `src/server/auth/config.ts` (absolute `http(s)` URL reduced to its origin, else `null`), so SEO and auth always agree; `indexable` is true only when `SITE_INDEXABLE === "true"` and `siteUrl` is not null; it takes no request input and never reads `Host`, `X-Forwarded-Host` or `Forwarded`
- [x] Expose it to routes through a `createServerFn` GET (same pattern as `src/server/auth/dashboard.fn.ts`), used by the `/` loader in task 03
- [x] Document `SITE_INDEXABLE` in `docs/infra/local-development.md` and `docs/infra/dev-environment.md`, and note there that `SITE_URL` drives both auth and SEO

## Verification

- [x] Vitest on the helper: unset or `"false"` gives `indexable=false`; `"true"` with a valid URL gives `true`; `"true"` with `not-a-url` or `ftp://x` gives `siteUrl=null` and `indexable=false`; `https://x.com/path` and a trailing slash give the origin `https://x.com`; the signature takes no request input.
- [x] Existing auth tests for `normalizeSiteUrl` still pass unchanged.
- [ ] Manual: the head rendered in task 03 shows the local URL and `noindex` under both `pnpm dev` and `pnpm build && pnpm start` (with `SITE_URL=http://localhost:3000` in `.env`), and the dev URL after the dev deploy.
