# 08 Redirect signed-in Users from `/sign-in`

**Status:** done
**Side:** backend
**Size:** S
**Dependencies:** [04](04-better-auth-server-and-api-route.md), [dashboard-home 01](../dashboard-home/01-protected-dashboard-route-and-loader.md)
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [x] In the `/sign-in` route, run a server-side session check (`beforeLoad`) that redirects to `/dashboard` when a valid session exists
- [x] It must not create or refresh cookies for anonymous visitors

## Verification

- [x] Vitest: a valid session redirects to `/dashboard`; no session or an expired one renders the page
- [x] Manual: signed-in redirect to `/dashboard` with a seeded session (2026-11-26, local seeded run: US-google-sign-in-5.1 passed, both direct and via the homepage Sign in link)
- [x] Manual: `curl -i` on `/sign-in` without cookies returns 200 with no `Set-Cookie`

**Local seeded run (2026-11-26):** `pnpm start` on a personal Neon branch with seeded sessions (ADR 0009), `pytest e2e/google-sign-in e2e/dashboard-home -rs`: 85 passed, 0 failed, 14 skipped (documented BLOCKED or manual scenarios, and the dashboard-home Sign out scenarios for tasks 02 and 03). US-google-sign-in-3.4 needed a test fix first ([#173](https://github.com/buitahau/sweetmemoriesv1/pull/173)): Playwright ignores a `Cookie` header override in `page.route`.
