# 01 Build the app as a Cloudflare Worker

**Status:** in progress
**Side:** backend
**Size:** M
**Dependencies:** ADR 0002 accepted
**Feature spec:** [dev-deploy](../../features/dev-deploy.md)
**Mockup:** none

## What to change

Set the Nitro preset to `cloudflare-module`. Add `wrangler` as a dev dependency and a `wrangler.jsonc` with top-level config plus an `env.dev` (Worker name `sweetmemories-dev`, `compatibility_flags: ["nodejs_compat"]`, a pinned `compatibility_date`, `workers_dev: true`). Change `pnpm start` to run the built Worker with `wrangler dev --port 3000` (per the ADR 0002 decision). Gitignore `.wrangler/`. No secrets in the config.

## Checklist

- [x] Nitro preset `cloudflare-module`
- [x] `wrangler` dev dependency and `wrangler.jsonc` with `env.dev`
- [x] `pnpm start` runs `wrangler dev --port 3000`
- [x] `.wrangler/` gitignored

## Verification

- [x] `pnpm build` succeeds and produces the Worker output.
- [x] `pnpm start` serves http://localhost:3000. `curl -i /api/health` returns `200` `{"status":"ok"}` with `Cache-Control: no-store` and no `Set-Cookie`. `POST` returns `405`.
- [x] `pnpm test`, `pnpm lint` and `pnpm typecheck` pass.
- [x] The e2e command in `e2e/README.md` (`with_server.py --server "pnpm start"`) passes all of `e2e/project-skeleton`.
- [ ] `pnpm dev` still works with hot reload (not yet checked: only `/` and `/api/health` were requested under `pnpm dev`).
