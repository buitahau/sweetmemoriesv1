# 01 Build the app as a Cloudflare Worker

**Status:** done
**Side:** backend
**Size:** M
**Dependencies:** ADR 0002 accepted
**Feature spec:** [dev-deploy](../../features/dev-deploy.md)
**Mockup:** none

## What to change

Set the Nitro preset to `cloudflare-module`. Add `wrangler` as a dev dependency and a `wrangler.jsonc` with top-level config plus an `env.dev` (Worker name `sweetmemories-dev`, `compatibility_flags: ["nodejs_compat"]`, a pinned `compatibility_date`, `workers_dev: true`). Change `pnpm start` to run the built Worker with `wrangler dev --port 3000` (per the ADR 0002 decision). Gitignore `.wrangler/`. No secrets in the config.

## Checklist

- [ ] Nitro preset `cloudflare-module`
- [ ] `wrangler` dev dependency and `wrangler.jsonc` with `env.dev`
- [ ] `pnpm start` runs `wrangler dev --port 3000`
- [ ] `.wrangler/` gitignored

## Verification

- [ ] `pnpm build` succeeds and produces the Worker output.
- [ ] `pnpm start` serves http://localhost:3000. `curl -i /api/health` returns `200` `{"status":"ok"}` with `Cache-Control: no-store` and no `Set-Cookie`. `POST` returns `405`.
- [ ] `pnpm test`, `pnpm lint` and `pnpm typecheck` pass.
- [ ] The e2e command in `e2e/README.md` (`with_server.py --server "pnpm start"`) passes all of `e2e/project-skeleton`.
- [ ] `pnpm dev` still works with hot reload.
