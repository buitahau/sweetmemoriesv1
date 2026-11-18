# 02 Database access layer (ADR 0007)

**Status:** in progress
**Side:** backend
**Size:** S
**Dependencies:** [ADR 0007](../../adr/0007-database-access-and-migrations.md) accepted (work went ahead on the proposed decision; the ADR must be accepted in a docs PR before or alongside this merge)
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [x] Add `drizzle-orm`, `drizzle-kit` and `@neondatabase/serverless`
- [x] Create a `getDb()` factory under `src/server/db/` that reads `process.env.DATABASE_URL` per request
- [x] Add `drizzle.config.ts` and the `db:generate` and `db:migrate` scripts

## Verification

- [x] Vitest: `getDb()` throws a clear error naming `DATABASE_URL` (not its value) when it is missing
- [x] `pnpm build` and `pnpm start` still serve `/api/health` 200 (re-verified with a fresh build on port 3055 using the same wrangler args as `pnpm start`; port 3000 was held by an older dev server)
- [ ] `pnpm db:migrate` runs cleanly against a developer Neon branch with no migrations (DEFERRED to [task 03](03-auth-schema-and-first-migration.md), which generates the first migration and must run `pnpm db:migrate` against a developer Neon branch; no Neon branch URL was available here. The PR description records this deferral)
- [x] Lint and typecheck pass

**Note for task 04:** `getDb()` uses the `neon-http` driver, which has no interactive transactions. Check the Better Auth adapter works without them, or move to `drizzle-orm/neon-serverless` with a per-request Pool. `drizzle-kit migrate` uses the WebSocket Pool driver, so migrations are unaffected.
