# 02 Minimal dashboard page

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** [01](01-protected-dashboard-route-and-loader.md)
**Feature spec:** [dashboard-home](../../features/dashboard-home.md)
**Mockup:** none

## Checklist

- [ ] Render the `h1` "Hi, <first name>" (fallback "Hi there") and the Sign out button, in the existing visual style (cream background, display font), following Q-dashboard

## Verification

- [ ] Vitest: renders "Hi, Sam" for "Sam", "Hi there" for null, and a "Sign out" button
- [ ] Manual: readable at 375 px, focus visible, axe clean
