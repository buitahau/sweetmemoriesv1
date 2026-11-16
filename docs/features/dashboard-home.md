# Feature: dashboard-home

**Status:** todo
**Side:** both
- backend: the session guard on `/dashboard`, the loader that returns only the fields the page shows, no-store and noindex headers, and sign-out through Better Auth.
- front-end: the minimal dashboard page and the Sign out button.

**Mockup:** none. No dashboard mockup exists; the Login mockup's link to `Dashboard.dc.html` has no file behind it (Q-dashboard).

Tasks: [../tasks/dashboard-home/](../tasks/dashboard-home/) (01 to 04). Depends on [google-sign-in](google-sign-in.md) (session and auth server). Open questions: [../decisions/google-sign-in-feature.md](../decisions/google-sign-in-feature.md) (Q-dashboard, Q-signout).

## Goal

Give the signed-in User a protected landing page after sign-in, with a way to sign out.

## Scope

**In scope:** protected `/dashboard`, greeting, Sign out, e2e suite `e2e/dashboard-home/`.
**Out of scope:** Memory lists, templates, subdomain choice, any dashboard design beyond the minimal page.

## User stories

**US-dashboard-home-1: Signed-in User sees their dashboard**
- **Story:** As a signed-in User, I want a dashboard home page, so that I know I am signed in and where to start.
- **Scenarios:**
  1. Given a signed-in User named "Sam Tester", When they open `/dashboard`, Then the status is `200`, the `h1` reads "Hi, Sam" and a "Sign out" button is visible.
  2. Given the same page, When the response headers are read, Then `Cache-Control` contains `no-store`, and the HTML has a robots meta containing `noindex`.
  3. Given two Users, Sam and Alex, When Sam opens `/dashboard`, Then nothing about Alex appears.
  4. Given a User whose Google profile has no name, When they open `/dashboard`, Then the `h1` reads "Hi there".

**US-dashboard-home-2: Anonymous visitors are sent to the Login page**
- **Story:** As the product owner, I want the dashboard to require sign-in, so that nobody sees it without an account.
- **Scenarios:**
  1. Given a fresh browser, When it opens `/dashboard`, Then it is redirected to `/sign-in`, and the server-rendered response contains no dashboard content.
  2. Given a browser with a forged or expired session cookie, When it opens `/dashboard`, Then it is redirected to `/sign-in`.

**US-dashboard-home-3: Sign out**
- **Story:** As a signed-in User, I want to sign out, so that the next person on this device cannot use my account.
- **Scenarios:**
  1. Given a signed-in User on `/dashboard`, When they click "Sign out", Then they land on `/`, the session cookie is removed, and the session no longer exists on the server.
  2. Given they just signed out, When they press Back or open `/dashboard`, Then they are redirected to `/sign-in`.
  3. Given a User signed in on two browsers, When they sign out in one, Then the other is still signed in (only the current session ends).

## Acceptance criteria

- `/dashboard` is server-guarded: no session means a redirect to `/sign-in` before any content renders.
- The page shows a greeting using the Google first name (fallback "Hi there") and a Sign out button. It is `no-store` and `noindex`.
- The loader returns only the fields the page shows (name, and image if Q-dashboard asks for one).
- Sign out ends the current session, clears the cookie and lands on `/`.
