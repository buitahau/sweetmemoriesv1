# 03 Auth schema and first migration

**Status:** in progress
**Side:** backend
**Size:** S
**Dependencies:** [02](02-database-access-layer.md)
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [x] Generate the Better Auth Drizzle schema (`user`, `session`, `account`, `verification`) into `src/server/db/schema`, with the domain name User for the user table
- [x] Commit the first SQL migration under `drizzle/`

## Verification

- [ ] `pnpm db:migrate` creates the four tables on a fresh branch and is a no-op on a second run (NOT RUN: no Neon branch or Postgres available here; run it against a developer branch)
- [x] Migration SQL reviewed: unique index on `user.email`, foreign key from `session` and `account` to `user`
- [x] Vitest: the schema exports the four tables

**Note:** `better-auth` is not installed until task 04, so the schema in `src/server/db/schema/auth.ts` was written to match the Better Auth core Drizzle schema by hand. Re-run the Better Auth CLI diff in task 04 to confirm.
