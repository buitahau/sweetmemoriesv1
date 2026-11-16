# 03 Sign out

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** [02](02-minimal-dashboard-page.md), [google-sign-in 04](../google-sign-in/04-better-auth-server-and-api-route.md)
**Feature spec:** [dashboard-home](../../features/dashboard-home.md)
**Mockup:** none

## Checklist

- [ ] The "Sign out" button calls the Better Auth client `signOut()`, then navigates to `/` (Q-signout)
- [ ] A failure shows a short inline error and keeps the User on the page

## Verification

- [ ] Vitest with a mocked client: the call happens once, then navigation goes to `/`; a rejected call shows the error
- [ ] Manual: after sign-out the cookie is gone in DevTools and `/dashboard` redirects to `/sign-in`
