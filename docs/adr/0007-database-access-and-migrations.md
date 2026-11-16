# ADR 0007: Database access and migrations on Workers

## Status

proposed

Open questions: [../decisions/google-sign-in-adr.md](../decisions/google-sign-in-adr.md)

## Context

Better Auth needs tables (`user`, `session`, `account`, `verification`) and a database adapter. This is the first code that reads `DATABASE_URL`. [ADR 0004](0004-neon-dev-branch-test-database.md) picked `@neondatabase/serverless` and left migrations as a follow-up "with the first DB feature". Every dependency must run on workerd ([ADR 0002](0002-host-on-cloudflare-workers.md)).

Options:

1. **Drizzle ORM on `@neondatabase/serverless`, migrations from `drizzle-kit`.** Better Auth has a first-party Drizzle adapter and its CLI can generate the Drizzle schema. Typed queries are reusable for Memory and Template later, and SQL migration files are committed and reviewable. Cons: two new dependencies; adapter transaction support depends on driver mode (HTTP has no interactive transactions, WebSocket `Pool` does), which must be checked.
2. **Kysely with a Neon dialect (Better Auth's native query builder), migrations from the Better Auth CLI.** Fewest moving parts for auth. Cons: Better Auth's migration runner is weak for app tables later, so a second migration tool would probably follow.
3. **Raw SQL with a hand-written adapter.** No ORM. Cons: reimplements what Better Auth ships and is error-prone.

## Decision

Option 1 (proposed). One `getDb()` factory reads `process.env.DATABASE_URL` per request (no module-level connection on Workers). The schema lives under `src/server/db/` and migrations under `drizzle/`. `pnpm db:generate` and `pnpm db:migrate` scripts are added. Migrations run against the dev Neon branch in `deploy-dev` before the Worker deploys (to be confirmed, see the open questions).

## Consequences

- Easier: one typed data layer for all later features, plus reviewable migrations.
- Harder: `deploy-dev` needs `DATABASE_URL` as a GitHub environment secret for the migrate step, and it must never be echoed. A failed migration blocks the deploy. Developers must run `pnpm db:migrate` against their own branch.

Related: feature [google-sign-in](../features/google-sign-in.md), tasks [02](../tasks/google-sign-in/02-database-access-layer.md), [03](../tasks/google-sign-in/03-auth-schema-and-first-migration.md), [05](../tasks/google-sign-in/05-run-migrations-in-deploy-dev.md).
