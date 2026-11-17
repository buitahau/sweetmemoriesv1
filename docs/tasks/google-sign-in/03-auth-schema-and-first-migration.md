# 03 Auth schema and first migration

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** [02](02-database-access-layer.md)
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [ ] Generate the Better Auth Drizzle schema (`user`, `session`, `account`, `verification`) into `src/server/db/schema`, with the domain name User for the user table
- [ ] Commit the first SQL migration under `drizzle/`

## Verification

- [ ] `pnpm db:migrate` creates the four tables on a fresh branch and is a no-op on a second run
- [ ] Migration SQL reviewed: unique index on `user.email`, foreign key from `session` and `account` to `user`
- [ ] Vitest: the schema exports the four tables
