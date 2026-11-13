# 09 `/sign-in` placeholder route

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** 01. Only if Q-cta is answered "placeholder"
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** none

## What to change

A new route `/sign-in`. No auth code, no cookies. The Better Auth feature replaces it later.

## Checklist

- [ ] `h1` "Sign in"
- [ ] Text "Google sign-in is coming soon."
- [ ] "Back to home" link to `/`
- [ ] `noindex` robots meta

## Verification

- [ ] Vitest: renders the heading, the text and a link to `/`.
- [ ] Manual: `curl -i localhost:3000/sign-in` returns `200`, no `Set-Cookie`, and HTML that contains `noindex`.
- [ ] Covers US-homepage-9.
