# 01 `SITE_INDEXABLE` per environment, and the shared site config

**Status:** done
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

## Summary

**Built:** `SITE_INDEXABLE` declared in `src/env.d.ts`, `.env.example` (`false`) and `wrangler.jsonc` `env.dev.vars` (`"false"`), plus `getSiteConfig()` returning `{ siteUrl, indexable }` (`siteUrl` from the auth `normalizeSiteUrl`, `indexable` only when `SITE_INDEXABLE === "true"` and the URL is valid; no request input) exposed through a `createServerFn` GET for the `/` loader in task 03. `docs/infra/local-development.md` and `docs/infra/dev-environment.md` document the variable and note that `SITE_URL` drives both auth and SEO.

**PRs:** [#180](https://github.com/buitahau/sweetmemoriesv1/pull/180) (SITE_INDEXABLE and shared site config).

**Test evidence (dev, attempt 1, PASS):** deploy-dev run 45936288156 on merge commit 7b7c34f. `pnpm test` 35 files / 408 passed, typecheck and lint clean (Node v26 warning only). Curl on dev: `/api/health` 200 JSON with `no-store`, `/api/auth/get-session` 200 with no Set-Cookie, `/` 200 HTML, `/does-not-exist` 404; spoofed `X-Forwarded-Host` and `Forwarded` headers did not leak into `/`. e2e `e2e/homepage-seo/test_homepage_seo_task01_site_config.py` against dev (headed Chromium): 11 passed, 1 skipped (T01_V3c BLOCKED until task 03 renders the robots and canonical head). Home screenshot viewed. Evidence lives in the tester's session scratchpad (`e2e-out/homepage-seo/T01-V3a_home.png`, `curl/h_api_health.txt`, `curl/h_api_auth_get-session.txt`, `curl/b_.txt`, `curl/xfh.html`, `plugins/force_headed.py`), not in the repo.

**Still open:** the manual Verification box above (robots and canonical head under `pnpm dev`, `pnpm start` and on dev) and e2e T01_V3c wait for [task 03](03-home-head-tags.md). Dev `/robots.txt` returns 200 `text/plain` (a Cloudflare content-signals file) while the feature spec expects 404; check it in [task 04](04-e2e-homepage-seo.md).

**Fix cycles:** 0.
