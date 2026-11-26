# 02 Database access layer (ADR 0007)

**Status:** done
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
- [x] `pnpm db:migrate` runs cleanly against a developer Neon branch with no migrations (verified 2026-11-26 by task 03's `test_T03_V1c` on an empty Neon developer branch. Originally DEFERRED to [task 03](03-auth-schema-and-first-migration.md), which generates the first migration and must run `pnpm db:migrate` against a developer Neon branch; no Neon branch URL was available here. The PR description records this deferral)
- [x] Lint and typecheck pass

**Note for task 04:** `getDb()` uses the `neon-http` driver, which has no interactive transactions. Check the Better Auth adapter works without them, or move to `drizzle-orm/neon-serverless` with a per-request Pool. `drizzle-kit migrate` uses the WebSocket Pool driver, so migrations are unaffected.

## Summary

**Built:** a `getDb()` factory under `src/server/db/` (neon-http driver, reads `DATABASE_URL` per request, never echoes it), plus `drizzle.config.ts` and the `db:generate` and `db:migrate` scripts.

**PRs:** [#138](https://github.com/buitahau/sweetmemoriesv1/pull/138) (database access layer), [#139](https://github.com/buitahau/sweetmemoriesv1/pull/139) (browser-like User-Agent in the task 02 health e2e check).

**Test evidence (dev, attempt 2, PASS):** `pnpm test` 23 files / 237 tests, `pnpm typecheck` and `pnpm lint` clean. `/api/health` 200 on dev with no Set-Cookie. Task e2e (`e2e/google-sign-in`): 12 passed, 3 skipped (BLOCKED). Homepage and skeleton e2e 102 passed, 1 skipped; dev-deploy e2e 26 passed, 5 skipped. No visual regression in 26 screenshots. Logs and screenshots live in the tester's session scratchpad (`e2e-logs/google-sign-in.log`, `e2e-logs/homepage-skeleton.log`, `e2e-logs/dev-deploy.log`, `e2e-logs/probe.json`, `curl/`, `shots/`), not in the repo.

**Still open:** `pnpm db:migrate` against a Neon dev branch is deferred to task 03. `/api/auth/*` returns 404 on dev until task 04, so open-redirect protection is not yet checked. T01_V1c and T01_V5 need maintainer credentials.

**Fix cycles:** 1.
