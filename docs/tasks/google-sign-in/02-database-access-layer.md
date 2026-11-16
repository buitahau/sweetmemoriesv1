# 02 Database access layer (ADR 0007)

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** [ADR 0007](../../adr/0007-database-access-and-migrations.md) accepted
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [ ] Add `drizzle-orm`, `drizzle-kit` and `@neondatabase/serverless`
- [ ] Create a `getDb()` factory under `src/server/db/` that reads `process.env.DATABASE_URL` per request
- [ ] Add `drizzle.config.ts` and the `db:generate` and `db:migrate` scripts

## Verification

- [ ] Vitest: `getDb()` throws a clear error naming `DATABASE_URL` (not its value) when it is missing
- [ ] `pnpm build` and `pnpm start` still serve `/api/health` 200
- [ ] `pnpm db:migrate` runs cleanly against a developer Neon branch with no migrations
- [ ] Lint and typecheck pass
