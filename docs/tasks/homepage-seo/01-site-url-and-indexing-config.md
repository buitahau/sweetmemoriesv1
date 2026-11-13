# 01 `SITE_URL` and `SITE_INDEXABLE` per environment

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** ADR 0006 accepted
**Feature spec:** [homepage-seo](../../features/homepage-seo.md)
**Mockup:** none

## What to change

Implement [ADR 0006](../../adr/0006-per-environment-site-url-and-indexing.md). Read values through `process.env`, never `cloudflare:workers`.

## Checklist

- [ ] Declare both in `src/env.d.ts` (`ProcessEnv`) next to `DATABASE_URL`
- [ ] Add both to `.env.example` with comments (local: `SITE_URL=http://localhost:3000`, `SITE_INDEXABLE=false`)
- [ ] Add `SITE_URL` (the dev workers.dev URL) and `SITE_INDEXABLE="false"` under `env.dev.vars` in `wrangler.jsonc`; if `pnpm start` does not pick up `.env`, add top-level `vars` and confirm `pnpm build` still produces an accepted `.output/server/wrangler.json`
- [ ] Helper returning `{ siteUrl: string | null, indexable: boolean }`: `siteUrl` accepted only as an absolute `http(s)` origin with no path, query or fragment (trailing slash normalised away), else `null`; `indexable` is true only when `SITE_INDEXABLE === "true"` and `siteUrl` is not null; never reads `Host` or `X-Forwarded-Host`
- [ ] Document both vars in `docs/infra/local-development.md` and `docs/infra/dev-environment.md`

## Verification

- [ ] Vitest on the helper: unset or `"false"` gives `indexable=false`; `"true"` with a valid URL gives `true`; `not-a-url`, `https://x.com/path` and `ftp://x` give `siteUrl=null` and `indexable=false`; trailing slash normalised; the signature takes no request input.
- [ ] Manual: the head rendered in task 03 shows the local URL under both `pnpm dev` and `pnpm build && pnpm start`, and the dev URL after the dev deploy.
