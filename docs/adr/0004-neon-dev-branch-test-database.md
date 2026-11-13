# ADR 0004: Test database for dev is a dedicated Neon branch

## Status

accepted

Open questions: [../decisions/ci-cd-deploy-to-cloudflare-dev-adr.md](../decisions/ci-cd-deploy-to-cloudflare-dev-adr.md)

## Context

Testers must test on dev with a test database, not a local one. Neon is the chosen database. The app has no DB code yet, but the database and how the Worker reaches it must be decided before the first DB feature. Workers cannot open raw TCP Postgres connections the way Node drivers expect without extra setup.

Options:

1. **A Neon branch `dev` (child of the project's main branch). The dev Worker gets its connection string as the Worker secret `DATABASE_URL`. The app uses `@neondatabase/serverless` (HTTP/WebSocket) when DB code arrives.** Cheap, can be reset from the parent at any time, isolated from future production data, and works on Workers. Trade-off: the serverless driver has a slightly different API from `pg`.
2. **A Neon dev branch fronted by Cloudflare Hyperdrive (pooled TCP, standard `pg`/`postgres` drivers).** Lower latency and a familiar driver. Trade-offs: one more Cloudflare resource and binding, and more setup than dev needs right now.
3. **A separate Neon project for dev.** Strongest isolation. Trade-off: no branching or reset from production schema, and a second project to manage.

## Decision

Option 1. Production and dev never share a branch or credentials. Each developer uses their own Neon branch or a local Postgres, configured in `.env` (never committed). The connection string is never printed in CI logs or returned by any endpoint.

## Consequences

- Easier: testers can rely on a stable shared test database that can be reset in one step, and it works on Workers without extra infrastructure.
- Harder: migrations (added with the first DB feature) must run against the dev branch as part of deploy-dev. That is a follow-up, not this scope. Switching to Hyperdrive later needs a superseding ADR.

Related: [ADR 0002](0002-host-on-cloudflare-workers.md), feature [dev-test-database](../features/dev-test-database.md).
