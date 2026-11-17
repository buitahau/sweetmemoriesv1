# 01 Protected `/dashboard` route and loader

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** [google-sign-in 04](../google-sign-in/04-better-auth-server-and-api-route.md)
**Feature spec:** [dashboard-home](../../features/dashboard-home.md)
**Mockup:** none

## Checklist

- [ ] Add the `/dashboard` route; `beforeLoad` calls `requireSession()` and redirects to `/sign-in` when there is no session
- [ ] The loader returns `{ firstName }` (and `image` only if Q-dashboard asks for it)
- [ ] Set response header `Cache-Control: no-store` and robots `noindex`

## Verification

- [ ] Vitest: no session or a forged session redirects to `/sign-in`; a valid session returns only the allowed fields (no email, no tokens)
- [ ] Vitest: first name from "Sam Tester" is "Sam"; an empty name gives null
- [ ] Manual: `curl -i /dashboard` without a cookie returns a redirect whose body has no dashboard markup
