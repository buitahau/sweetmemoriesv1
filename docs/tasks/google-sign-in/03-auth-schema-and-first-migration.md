# 03 Auth schema and first migration

**Status:** done
**Side:** backend
**Size:** S
**Dependencies:** [02](02-database-access-layer.md)
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [x] Generate the Better Auth Drizzle schema (`user`, `session`, `account`, `verification`) into `src/server/db/schema`, with the domain name User for the user table
- [x] Commit the first SQL migration under `drizzle/`

## Verification

- [ ] `pnpm db:migrate` creates the four tables on a fresh branch and is a no-op on a second run (NOT RUN against Neon: no developer branch URL available. Covered on PGlite by the first-migration test in PR #145: idempotent re-run, unique email, cascade. Run it live against a developer branch when a URL is available)
- [x] Migration SQL reviewed: unique index on `user.email`, foreign key from `session` and `account` to `user`
- [x] Vitest: the schema exports the four tables

**Note:** `better-auth` is not installed until task 04, so the schema in `src/server/db/schema/auth.ts` was written to match the Better Auth core Drizzle schema by hand. Task 04 must run `@better-auth/cli generate` and compare the result with this schema; any difference ships as a new migration (0001), never as an edit to 0000.

## Summary

**Built:** the Better Auth Drizzle schema (`user`, `session`, `account`, `verification`) in `src/server/db/schema/auth.ts` and the first SQL migration under `drizzle/` (0000), with a unique index on `user.email` and foreign keys from `session` and `account` to `user`.

**PRs:** [#141](https://github.com/buitahau/sweetmemoriesv1/pull/141) (auth schema and first migration), [#142](https://github.com/buitahau/sweetmemoriesv1/pull/142) (cascade, journal and no-secret checks), [#144](https://github.com/buitahau/sweetmemoriesv1/pull/144) (tighter schema checks), [#145](https://github.com/buitahau/sweetmemoriesv1/pull/145) (first migration run on PGlite).

**Test evidence (dev, attempt 2, PASS):** `pnpm test` 25 files / 250 tests, typecheck and lint clean. Dev current on commit 965e407 (deploy-dev run 44445741352). `/api/health` 200, `/` and `/sign-in` 200 with no Set-Cookie, `/api/auth/session` 404 as expected until task 04. e2e google-sign-in: 19 passed, 4 BLOCKED. Homepage 102 passed, 1 skipped; skeleton 12 passed. Logs and screenshots live in the tester's session scratchpad (`logs/google-sign-in.log`, `logs/skeleton-homepage.log`, `logs/skeleton.log`, `curl/`, `screens/`), not in the repo.

**Still open:** live `pnpm db:migrate` twice on a fresh Neon developer branch (BLOCKED, no `E2E_NEON_BRANCH_URL`); task 04 must compare this hand-written schema with `@better-auth/cli generate` output.

**Fix cycles:** 1.
