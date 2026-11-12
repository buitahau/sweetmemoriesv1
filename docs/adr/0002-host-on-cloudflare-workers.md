# ADR 0002: Host the app on Cloudflare Workers

## Status

accepted

Approved ('Approve Cloudflare Workers') in [../decisions/ci-cd-deploy-to-cloudflare-dev-adr.md](../decisions/ci-cd-deploy-to-cloudflare-dev-adr.md)

## Context

The requirement asks for a dev environment on Cloudflare Workers. ADR 0001 picked a single TanStack Start app but no hosting target. The current build uses Nitro's default Node preset (`pnpm start` = `node .output/server/index.mjs`). Workers runs workerd, which has only partial Node API support (`nodejs_compat`). That limits which Postgres and S3 clients work. It also affects how per-user subdomains and the cookie-free public origin are routed later (Workers custom domains or wildcard routes).

The stack table in `CLAUDE.md` and `ARCHITECTURE.md` names no hosting platform. Cloudflare Workers does not contradict the listed stack (TanStack Start, Neon and S3 all stay), but it is an architecture change and needs approval.

Options:

1. **Cloudflare Workers via Nitro's `cloudflare-module` preset, deployed with Wrangler (`wrangler.jsonc`, `nodejs_compat`).** Matches the request, has first-class TanStack Start/Nitro support, supports wildcard custom domains for subdomains later, and has atomic deploys with version rollback. Trade-offs: a non-Node runtime, plus bundle size and CPU limits per request. Local `pnpm start` must either use `wrangler dev` or keep a separate Node build that differs from dev.
2. **Cloudflare Pages (Functions).** Similar runtime. Cloudflare now steers full-stack apps to Workers, and Pages handles wildcard subdomain routing less well. No gain over option 1.
3. **A Node host (for example Fly.io or Render).** No runtime constraints. Trade-off: it does not meet the stated requirement.

## Decision

Option 1. Build target is `cloudflare-module`. Use one `wrangler.jsonc` with a `dev` environment (Worker name `sweetmemories-dev`). Local `pnpm start` runs the same Worker build via `wrangler dev` on port 3000, so local, CI and dev share one runtime. `pnpm dev` (Vite) stays the fast inner loop.

## Consequences

- Easier: free tier, fast global deploys, atomic versions and `wrangler rollback`, and a clear path to wildcard subdomains.
- Harder: every future dependency must run on workerd. That rules out Node-only Postgres drivers and native modules, and the S3 SDK must be checked against `nodejs_compat`. Local `pnpm start` now needs Wrangler. The cookie-free public origin ADR (still to be written) must be designed around Workers routes and custom domains.
- Cloudflare Workers is listed as Hosting in the stack in `CLAUDE.md` and `ARCHITECTURE.md`.

Related: [ADR 0003](0003-ci-cd-github-actions.md), [ADR 0004](0004-neon-dev-branch-test-database.md), feature [dev-deploy](../features/dev-deploy.md).
