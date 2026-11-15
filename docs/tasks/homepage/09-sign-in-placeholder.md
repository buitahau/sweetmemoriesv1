# 09 `/sign-in` placeholder route

**Status:** done
**Side:** front-end
**Size:** S
**Dependencies:** 01. Only if Q-cta is answered "placeholder"
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** none

## What to change

A new route `/sign-in`. No auth code, no cookies. The Better Auth feature replaces it later.

## Checklist

- [x] `h1` "Sign in"
- [x] Text "Google sign-in is coming soon."
- [x] "Back to home" link to `/`
- [x] `noindex` robots meta

## Verification

- [x] Vitest: renders the heading, the text and a link to `/`.
- [x] Manual: `curl -i localhost:3000/sign-in` returns `200`, no `Set-Cookie`, and HTML that contains `noindex`.
- [x] Covers US-homepage-9.
