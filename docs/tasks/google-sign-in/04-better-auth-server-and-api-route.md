# 04 Better Auth server and `/api/auth/*` route

**Status:** todo
**Side:** backend
**Size:** M
**Dependencies:** [01](01-google-oauth-client-and-auth-secrets.md), [03](03-auth-schema-and-first-migration.md), [ADR 0008](../../adr/0008-login-session-cookie-scope-and-app-origin.md)
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [ ] Configure Better Auth (Drizzle adapter, `baseURL` = `SITE_URL`, secret, Google provider with `openid email profile`)
- [ ] Keep `crossSubDomainCookies` off with no cookie domain (ADR 0008); set `trustedOrigins` to `[SITE_URL]`
- [ ] Mount the handler at `/api/auth/$` as a TanStack Start server route
- [ ] Add `getSession(request)` and `requireSession()` server helpers
- [ ] Restrict `callbackURL` and `errorCallbackURL` to relative paths
- [ ] If config is missing, return 503 with a generic body
- [ ] Responses under `/api/auth/*` are `no-store`

## Verification

- [ ] Vitest: config has no cookie domain and cross-subdomain cookies are off
- [ ] Vitest: `POST /api/auth/sign-in/social` with an absolute foreign `callbackURL` is rejected
- [ ] Vitest: missing `GOOGLE_CLIENT_ID` returns 503 with no secret in the body
- [ ] Vitest: `getSession` returns null for a missing or forged cookie
- [ ] Manual on `pnpm start`: `POST /api/auth/sign-in/social` returns a Google URL with the correct `redirect_uri`, and `/api/health` still sends no `Set-Cookie`
- [ ] Verified on workerd (`pnpm start`), not only `pnpm dev`
