# 04 Better Auth server and `/api/auth/*` route

**Status:** in review
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
- [ ] Manual on `pnpm start`: `POST /api/auth/sign-in/social` returns a Google URL with the correct `redirect_uri`, and `/api/health` still sends no `Set-Cookie`
- [ ] Verified on workerd (`pnpm start`), not only `pnpm dev`

## Notes

- Built in `src/server/auth/` (`config.ts`, `auth.ts`, `handler.ts`, `redirects.ts`, `session.ts`) and `src/routes/api/auth/$.ts`. `SITE_URL` is the base URL, with `BETTER_AUTH_URL` only as a local fallback. `scopes` in a sign-in body is refused so Google scopes stay `openid email profile`.
- Verified on workerd (`pnpm start`) with fake secrets: `/api/health` 200 with no `Set-Cookie`, foreign `callbackURL` gives 400, `get-session` gives `null`, all `no-store`. Not run: the full Google URL (needs a real `DATABASE_URL` and Google client).
- Not done: comparing the hand-written schema with `@better-auth/cli generate` output (see task 03 note).
- Review follow-ups: missing `DATABASE_URL` now gives 503 (`isDbConfigured` in `src/server/db/index.ts`); handler and `getSession` log error name and message via `console.error`; the sign-in guard also covers `POST /api/auth/link-social`. Still open: real Neon round trip on workerd (manual item above). For task 08: add `tanstackStartCookies()` once `auth.api` is called from loaders or server functions, otherwise session refresh and sign-out cookies are lost. Per-isolate caching of the auth instance is deferred.
