# 02 Minimal dashboard page

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** [01](01-protected-dashboard-route-and-loader.md)
**Feature spec:** [dashboard-home](../../features/dashboard-home.md)
**Mockup:** none

## Already in place (from task 01)

`src/components/dashboard-page.tsx` already renders the `h1` "Hi, <first name>" with the "Hi there" fallback, and `src/components/dashboard-page.test.tsx` already covers "Hi, Sam", "Hi there" for null and empty names, escaping, and that private fields (email, id, image, token) never reach the markup. `src/routes/-dashboard.wiring.test.tsx` covers the route wiring. Extend these files for the Sign out button and the visual style instead of starting new ones.

## Checklist

- [ ] Render the `h1` "Hi, <first name>" (fallback "Hi there") and the Sign out button, in the existing visual style (cream background, display font), following Q-dashboard

## Verification

- [ ] Vitest: renders "Hi, Sam" for "Sam", "Hi there" for null, and a "Sign out" button
- [ ] Manual: readable at 375 px, focus visible, axe clean
