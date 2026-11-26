# 01 Protected `/dashboard` route and loader

**Status:** in progress
**Side:** backend
**Size:** S
**Dependencies:** [google-sign-in 04](../google-sign-in/04-better-auth-server-and-api-route.md)
**Feature spec:** [dashboard-home](../../features/dashboard-home.md)
**Mockup:** none

## Checklist

- [x] Add the `/dashboard` route; `beforeLoad` calls `requireSession()` and redirects to `/sign-in` when there is no session
- [x] The loader returns `{ firstName }` (and `image` only if Q-dashboard asks for it)
- [x] Set response header `Cache-Control: no-store` and robots `noindex`

## Verification

- [x] Vitest: no session or a forged session redirects to `/sign-in`; a valid session returns only the allowed fields (no email, no tokens)
- [x] Vitest: first name from "Sam Tester" is "Sam"; an empty name gives null
- [x] Manual: `curl -i /dashboard` without a cookie returns a redirect whose body has no dashboard markup
- [ ] Signed-in check on a local server with a seeded session (`e2e/dashboard-home`, US-dashboard-home-1.1 to 1.4 and `T01_V1`): 200, h1 "Hi, Sam", `no-store` and `noindex` on the 200, first name only

## Summary

**Built:** `/dashboard` route (`src/routes/dashboard.tsx`) guarded in `beforeLoad` by `getDashboard` (`src/server/auth/dashboard.fn.ts`, `dashboard.ts`), loader returns `{ firstName }` only, `Cache-Control: no-store` and `X-Robots-Tag: noindex` on every response plus the robots meta tag. The page markup lives in `src/components/dashboard-page.tsx` (unit tested in `dashboard-page.test.tsx`).

**Dev test (attempt 2, head bb32c47):** anonymous and forged-cookie redirects pass (curl and headed Playwright at 1440, 768 and 375 px; 307 to `/sign-in`, `no-store`, `noindex`, empty body). Signed-in scenarios are BLOCKED on dev by design: session seeding only targets a local server ([ADR 0009](../../adr/0009-e2e-signed-in-state-without-real-google.md)). No app defect was found. The signed-in behavior is covered by unit tests; the last box above stays open until the seeded e2e run passes locally.
