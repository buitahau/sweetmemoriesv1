# 08 Redirect signed-in Users from `/sign-in`

**Status:** in progress
**Side:** backend
**Size:** S
**Dependencies:** [04](04-better-auth-server-and-api-route.md), [dashboard-home 01](../dashboard-home/01-protected-dashboard-route-and-loader.md)
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

> Note: code and unit tests are done, but a signed-in User is sent to a 404 until [dashboard-home 01](../dashboard-home/01-protected-dashboard-route-and-loader.md) lands. Mark done after checking the redirect manually with a seeded session (ADR 0009).

## Checklist

- [x] In the `/sign-in` route, run a server-side session check (`beforeLoad`) that redirects to `/dashboard` when a valid session exists
- [x] It must not create or refresh cookies for anonymous visitors

## Verification

- [x] Vitest: a valid session redirects to `/dashboard`; no session or an expired one renders the page
- [ ] Manual: signed-in redirect to `/dashboard` with a seeded session (blocked on dashboard-home 01)
- [x] Manual: `curl -i` on `/sign-in` without cookies returns 200 with no `Set-Cookie`
