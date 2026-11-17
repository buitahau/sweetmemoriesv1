# ADR 0008: Login session cookie scope and app origin

## Status

proposed

Open questions: [../decisions/google-sign-in-adr.md](../decisions/google-sign-in-adr.md)

## Context

Rule 1 ([RULES.md](../architecture/RULES.md)) says public Memory pages are served without login cookies. Memory pages and User home pages live on `<user>.sweetmemories.com`. The sign-in cookie set by the app must never be sent there. Better Auth can share cookies across subdomains (`crossSubDomainCookies`); that option must stay off.

Options:

1. **App on the main domain, host-only cookies.** No `Domain` attribute, `HttpOnly`, `Secure` (except on `http://localhost`), `SameSite=Lax`, `Path=/`, with Better Auth's `__Secure-` prefix. Browsers never send a host-only cookie for `sweetmemories.com` to `john.sweetmemories.com`. Cons: the admin, if on the same host, shares the cookie (acceptable: same audience surface with role checks).
2. **App on its own subdomain (`app.sweetmemories.com`), host-only cookies.** Clear separation. Cons: a reserved subdomain, an extra Workers route and DNS entry now, and homepage CTAs become cross-origin.
3. **Cookie with `Domain=.sweetmemories.com`.** Simplest sharing. Violates rule 1. Rejected.

## Decision

Option 1 (proposed). Better Auth is configured with `crossSubDomainCookies` disabled and no cookie `domain`. `trustedOrigins` is exactly `SITE_URL` ([ADR 0006](0006-per-environment-site-url-and-indexing.md)). The post-sign-in `callbackURL` must be a relative app path. Pages that do not need a session (`/`, `/sign-in` on GET, `/api/health`) never send `Set-Cookie`.

## Consequences

- Easier: rule 1 holds by browser design, with no extra infrastructure.
- Harder: the later cookie-free public origin ADR must keep user subdomains off the app host. `app`, `admin`, `www` and `api` should go on the reserved-subdomain list. If the app later moves to its own subdomain, this ADR is superseded.

Related: feature [google-sign-in](../features/google-sign-in.md), task [04](../tasks/google-sign-in/04-better-auth-server-and-api-route.md).
