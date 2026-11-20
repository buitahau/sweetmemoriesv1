# 04 Better Auth server and `/api/auth/*` route

**Status:** done
**Side:** backend
**Size:** M
**Dependencies:** [01](01-google-oauth-client-and-auth-secrets.md), [03](03-auth-schema-and-first-migration.md), [ADR 0008](../../adr/0008-login-session-cookie-scope-and-app-origin.md)
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [x] Configure Better Auth (Drizzle adapter, `baseURL` = `SITE_URL`, secret, Google provider with `openid email profile`)
- [x] Keep `crossSubDomainCookies` off with no cookie domain (ADR 0008); set `trustedOrigins` to `[SITE_URL]`
- [x] Mount the handler at `/api/auth/$` as a TanStack Start server route
- [x] Add `getSession(request)` and `requireSession()` server helpers
- [x] Restrict `callbackURL` and `errorCallbackURL` to relative paths
- [x] If config is missing, return 503 with a generic body
- [x] Responses under `/api/auth/*` are `no-store`

## Verification

- [x] Vitest: config has no cookie domain and cross-subdomain cookies are off
- [x] Vitest: `POST /api/auth/sign-in/social` with an absolute foreign `callbackURL` is rejected
- [x] Vitest: missing `GOOGLE_CLIENT_ID` returns 503 with no secret in the body
- [x] Vitest: `getSession` returns null for a missing or forged cookie
- [x] Manual on `pnpm start`: `POST /api/auth/sign-in/social` returns a Google URL with the correct `redirect_uri`, and `/api/health` still sends no `Set-Cookie`
- [x] Verified on workerd (`pnpm start`), not only `pnpm dev`

## Notes

- Built in `src/server/auth/` (`config.ts`, `auth.ts`, `handler.ts`, `redirects.ts`, `session.ts`) and `src/routes/api/auth/$.ts`. `SITE_URL` is the base URL, with `BETTER_AUTH_URL` only as a local fallback. `scopes` in a sign-in body is refused so Google scopes stay `openid email profile`.
- Verified on workerd (`pnpm start`) with fake secrets: `/api/health` 200 with no `Set-Cookie`, foreign `callbackURL` gives 400, `get-session` gives `null`, all `no-store`. Not run: the full Google URL (needs a real `DATABASE_URL` and Google client).
- Not done: comparing the hand-written schema with `@better-auth/cli generate` output (see task 03 note).
- Review follow-ups: missing `DATABASE_URL` now gives 503 (`isDbConfigured` in `src/server/db/index.ts`); handler and `getSession` log error name and message via `console.error`; the sign-in guard also covers `POST /api/auth/link-social`. Still open: real Neon round trip on workerd (manual item above). For task 08: add `tanstackStartCookies()` once `auth.api` is called from loaders or server functions, otherwise session refresh and sign-out cookies are lost. Per-isolate caching of the auth instance is deferred.
- Dev fix (attempt 2): `/api/auth/*` answered 503 on dev because nothing set `SITE_URL` on the Worker. Now `env.dev.vars.SITE_URL` in `wrangler.jsonc` (ADR 0006), and the deploy-dev smoke check requires `get-session` to answer 200 so a repeat rolls back. Root cause (near certain from the code): `readAuthConfig` returns null when neither `SITE_URL` nor `BETTER_AUTH_URL` is set, and deploy-dev never set either on the dev Worker, which explains the 503 on every `/api/auth/*` route including get-session. Confirm on dev: the next tester should check the dev URL matches `SITE_URL`, that the four secrets exist, and re-run T04_V2, V2b, V2c and V4 against dev.
- Dev fix (attempt 3): `POST /api/auth/sign-in/social` answered an empty 500 on dev. Suspected root cause (not yet confirmed on dev): the dev Neon database had no tables (the migration was never applied; the Worker role is non-owner and deploy-dev did not migrate), or the app role lacks grants on them, so Better Auth's insert into `verification` failed and Better Auth returns a bare 500 for DB errors (reproduced locally with missing tables: 500 with no body). Confirm with `\dt` and `\dp verification` as the app role, or `wrangler tail --env dev` during a sign-in POST. Fix: deploy-dev now runs `pnpm db:migrate` with the new Environment secret `DATABASE_MIGRATE_URL` (owner role) before deploying; `drizzle.config.ts` prefers it. Maintainer must add that secret and run the one-time grants (docs/infra/dev-environment.md) before the next deploy, then re-run T04_V2c and V3.
- Final checks (2026-11-20): tester attempt 6 on dev passed (310 unit tests, curl and browser checks, e2e 25 passed with remaining skips BLOCKED for maintainer steps). `pnpm start` (workerd) run locally with the repo's `.dev.vars` mechanism: with no auth secrets `/api/auth/*` answers 503; with secrets, `POST /api/auth/sign-in/social` returns a Google URL with `redirect_uri` `http://localhost:3000/api/auth/callback/google` and scope `openid email profile`, `/api/health` sends no `Set-Cookie`, and a foreign `callbackURL`, `scopes` and `scope` in the body all give 400. The singular `scope` key was found accepted (ignored) on dev and is now refused too (`isSafeSignInBody`).
- Dev fix (attempt 3, resolved 2026-11-20): the empty 500 on `POST /api/auth/sign-in/social` was caused by missing tables on dev. The `DATABASE_MIGRATE_URL` secret was added, the old v1 tables on Neon `devv2` were cleared, and deploy-dev run 44463630526 now passes. On dev, `POST /api/auth/sign-in/social` with `callbackURL` `/` returns 200 with a Google OAuth URL. Tester attempt 6 then passed.

