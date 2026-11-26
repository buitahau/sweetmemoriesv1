# Feature: google-sign-in

**Status:** todo
**Side:** both
- backend: Neon schema and migrations, Better Auth with the Google provider at `/api/auth/*`, session helpers, cookie scope, redirect rules, error mapping, env and secrets.
- front-end: the `/sign-in` page from the mockup, the button's loading and error states, and updates to homepage tests and specs.

**Mockup:** [Login.dc.html](../ui/Login/Login.dc.html) (kept in `docs/ui/Login/`)

Tasks: [../tasks/google-sign-in/](../tasks/google-sign-in/) (01 to 10). ADRs: [0007](../adr/0007-database-access-and-migrations.md), [0008](../adr/0008-login-session-cookie-scope-and-app-origin.md), [0009](../adr/0009-e2e-signed-in-state-without-real-google.md). Open questions: [../decisions/google-sign-in-feature.md](../decisions/google-sign-in-feature.md), [../decisions/google-sign-in-adr.md](../decisions/google-sign-in-adr.md). Related: [homepage](homepage.md), [dashboard-home](dashboard-home.md).

## Goal

A visitor opens the Login page from the homepage, continues with Google, and ends up signed in on the dashboard.

## Summary

When a visitor clicks **Sign in** (or **Start with Google**) on the homepage, they land on `/sign-in`. This page replaces today's placeholder with the design in the mockup. It has one **Continue with Google** button. A successful Google sign-in creates the User on first use, or finds the existing User, starts a session and redirects to the signed-in dashboard home page (`/dashboard`, see [dashboard-home](dashboard-home.md)).

This is the project's first feature that needs auth and a database (Better Auth, first Neon schema and migrations, Google OAuth credentials, first login cookie). The stack already names these; nothing contradicts `CLAUDE.md`.

Existing state: `src/routes/sign-in.tsx` and `src/components/sign-in-page.tsx` hold a placeholder from homepage task 09 (US-homepage-9). Header, hero and final CTA already link to `/sign-in`. `DATABASE_URL` is declared but unread. There is no dashboard mockup; the Login mockup links to a `Dashboard.dc.html` that is not in the repo.

## Assumptions

- A1. The route stays `/sign-in` (Q-route).
- A2. The app, including `/sign-in` and `/dashboard`, lives on the main domain (`sweetmemories.com`, `localhost:3000`, the dev workers.dev host). User subdomains and Memory pages are out of scope.
- A3. Google scopes are `openid email profile` only, matching the mockup promise "We only use your name, email and profile photo."
- A4. First sign-in creates the User. Choosing a subdomain is a separate, later feature; after sign-in the User goes straight to `/dashboard`.
- A5. The dashboard is a minimal landing page until a mockup exists (Q-dashboard).
- A6. Better Auth's default session lifetime applies (7 days, refreshed daily). Admin roles are out of scope.
- A7. Mockup inline styles are rebuilt with existing Tailwind tokens and self-hosted fonts ([ADR 0005](../adr/0005-self-host-web-fonts.md)). The mockup's Google Fonts link and runtime are not used.
- A8. Better Auth's `baseURL` is the existing `SITE_URL` ([ADR 0006](../adr/0006-per-environment-site-url-and-indexing.md)).

## Conflicts found

1. Mockup copy vs scope: "You can hide any page from search engines." (no such feature), "Then you pick your address, like sam.sweetmemories.com." (not built), "Terms" and "Privacy policy" links (pages do not exist). See Q-copy-search, Q-copy-address, Q-legal.
2. The mockup's "Continue to your dashboard (mockup)" is a design-tool shortcut and is not built.
3. US-homepage-9 and the e2e test US-homepage-2.3 become false and must be retired or updated (task 09).
4. Cookie baseline: today no route sets a cookie. After this feature the app origin sets a login cookie; rule 1 requires it never reaches user subdomains or Memory pages ([ADR 0008](../adr/0008-login-session-cookie-scope-and-app-origin.md)).

## Scope

**In scope**
- `/sign-in` page per the mockup, with loading and error states.
- Better Auth with Google, Neon schema and first migration, session helpers, secrets.
- Redirect of signed-in Users from `/sign-in`.
- Homepage spec and test updates, e2e suite `e2e/google-sign-in/`.

**Out of scope**
- Choosing a subdomain, Memory pages, admin roles, other sign-in providers.
- Terms and Privacy pages.

## User stories

**US-google-sign-in-1: Login page displays**
- **Story:** As a visitor on the homepage, I want to reach a clear Login page, so that I know how to sign in.
- **Scenarios:**
  1. *From homepage:* Given a fresh browser on `/`, When the visitor clicks "Sign in" in the header, Then the URL path is `/sign-in`, the status is `200`, the `h1` is "Welcome! Come on in." and a button "Continue with Google" is visible. The same holds for the hero and final-CTA "Start with Google" links.
  2. *Content:* Given `/sign-in`, When it loads, Then the page shows the subtitle "Sign in to make a page for the moments your family keeps talking about.", the "New here?" divider, the SweetMemories logo link to `/`, and a "Back to home" link to `/`. The text "Google sign-in is coming soon." does not appear.
  3. *No cookies, no third parties:* Given a fresh browser, When the visitor opens `/sign-in` and does not click anything, Then no response sets a cookie, the browser holds no cookies, and no request goes to `accounts.google.com`, `fonts.googleapis.com` or `fonts.gstatic.com`.
  4. *Not indexed:* Given any environment, When a client fetches `/sign-in`, Then the HTML has a robots meta containing `noindex`.
  5. *Mobile:* Given a 375x812 viewport, When `/sign-in` loads, Then there is no horizontal scrollbar and the "Continue with Google" button is visible and at least 44 px tall.
  6. *Reduced motion:* Given `prefers-reduced-motion: reduce`, When `/sign-in` loads, Then no element has a running animation, and the `h1` and the button have computed opacity 1.
  7. *Accessibility:* Given `/sign-in`, When axe runs at 1440, 768 and 375 px, Then there are no serious or critical violations. The illustration is hidden from assistive technology, and the button can be reached with Tab and shows a visible focus outline.

**US-google-sign-in-2: Start Google sign-in**
- **Story:** As a visitor, I want one click to take me to Google, so that I can sign in without a new password.
- **Scenarios:**
  1. *Redirect:* Given `/sign-in`, When the visitor clicks "Continue with Google", Then the browser navigates to `https://accounts.google.com/...`. The URL has `client_id` set, `redirect_uri` equal to `<SITE_URL>/api/auth/callback/google`, `scope` containing `openid`, `email` and `profile` and nothing else, and a non-empty `state`.
  2. *Loading state:* Given the click happened and Google has not loaded yet, Then the button shows "Opening Google…", has `aria-busy="true"`, is disabled, and the status region reads "Taking you to Google to choose your account."
  3. *Double click:* Given `/sign-in`, When the visitor clicks the button twice quickly, Then only one request to `/api/auth/sign-in/social` is sent.
  4. *Open-redirect blocked:* Given a direct `POST /api/auth/sign-in/social` with `callbackURL` = `https://evil.example/`, When it is sent, Then the response is a 4xx error and no Google URL is returned.

**US-google-sign-in-3: Successful sign-in lands on the dashboard**
- **Story:** As a visitor with a Google account, I want to land on my dashboard after signing in, so that I can start making Memories.
- **Scenarios:**
  1. *First sign-in (manual on dev, ADR 0009):* Given a Google test account `sam.tester@gmail.com` that has never signed in, When they finish Google consent, Then the browser ends on `/dashboard` showing "Hi, Sam", and exactly one User with that email exists.
  2. *Returning User (manual on dev):* Given that User signed in before and signed out, When they sign in again with the same Google account, Then they land on `/dashboard` and no second User is created.
  3. *Cookie scope:* Given a signed-in browser (seeded session, ADR 0009), When the cookies are inspected, Then the session cookie is `HttpOnly`, has `SameSite=Lax`, has no `Domain` attribute (host-only, domain equals the app host exactly with no leading dot), and is `Secure` on any `https` environment.
  4. *Not sent to subdomains:* Given a signed-in browser on `localhost:3000`, When it requests `http://sam.localhost:3000/`, Then the request carries no session cookie.

**US-google-sign-in-4: Sign-in fails or is cancelled**
- **Story:** As a visitor whose sign-in did not finish, I want a clear message on the Login page, so that I can try again.
- **Scenarios:**
  1. *Cancelled at Google:* Given the visitor pressed Cancel on Google's consent screen, When Google redirects back with `error=access_denied`, Then the visitor is on `/sign-in`, the status region reads "Sign-in was cancelled. You can try again.", the button is enabled, and no session cookie exists.
  2. *Tampered callback:* Given a request to `/api/auth/callback/google` with an invalid or reused `state`, When it is processed, Then the visitor ends on `/sign-in` with "Something went wrong signing you in. Please try again." and no session is created.
  3. *Unknown error code:* Given `/sign-in?error=<anything else>`, When it loads, Then the generic message above is shown, and the raw query value is not rendered (for example `?error=<script>` shows no script text).
  4. *Auth misconfigured:* Given the server has no Google client ID configured, When the visitor clicks the button, Then the button returns to idle and the generic message is shown. No stack trace or secret appears in the page or the response.

**US-google-sign-in-5: Signed-in Users skip the Login page**
- **Story:** As a signed-in User, I want Sign in to take me to my dashboard, so that I do not sign in twice.
- **Scenarios:**
  1. Given a signed-in browser, When the User opens `/sign-in` (directly or from the homepage "Sign in" link), Then they are redirected to `/dashboard`.
  2. Given a browser with an expired or invalid session cookie, When it opens `/sign-in`, Then the Login page shows normally.

**US-google-sign-in-6: Public pages stay cookie-free**
- **Story:** As the product owner, I want pages that do not need a session to never set cookies, so that the security baseline from the homepage holds.
- **Scenarios:**
  1. Given a fresh client, When it fetches `/`, `/sign-in` and `/api/health`, Then no response has a `Set-Cookie` header.
  2. Given a signed-in browser, When it loads `/`, Then the HTML contains neither the User's email nor their name (the homepage stays static).

## Acceptance criteria

- `/sign-in` matches the mockup at 1440 px and adapts at 768 and 375 px, with reduced-motion support, self-hosted fonts and no third-party requests before the click.
- Clicking "Continue with Google" shows the loading state and redirects to Google with only `openid email profile` and the correct `redirect_uri`.
- A successful callback creates or reuses one User and lands on `/dashboard`.
- The session cookie is host-only, `HttpOnly`, `SameSite=Lax`, and `Secure` on https. It is never sent to user subdomains.
- Cancel and other failures return to `/sign-in` with a fixed, non-reflected message and no session.
- Signed-in Users opening `/sign-in` go to `/dashboard`.
- `/`, `/sign-in` (GET) and `/api/health` never set cookies. `callbackURL` accepts relative app paths only.
- US-homepage-9 is retired and homepage tests are updated so they pass.

## Risks and security notes

- Rule 1: the session cookie must be host-only ([ADR 0008](../adr/0008-login-session-cookie-scope-and-app-origin.md)). Any later `crossSubDomainCookies` or cookie `Domain` breaks rule 1 and must be refused in review. `app`, `admin`, `api` and `www` go on the reserved-subdomain list when that feature lands.
- Rule 5: email, name and Google tokens live in `user` and `account` tables and never appear on `/`, Memory pages or logs. Better Auth stores Google tokens in `account`; consider a follow-up to not persist or to encrypt them.
- Open redirect: `callbackURL` and `errorCallbackURL` are relative paths only; `trustedOrigins` is exactly `SITE_URL`.
- Reflected input: `?error=` maps to fixed messages and is never rendered.
- Secrets: `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET` and `DATABASE_URL` are Worker or GitHub environment secrets only, never printed or returned. Rotating `BETTER_AUTH_SECRET` signs everyone out.
- Caching: `/api/auth/*` responses are `no-store`.
- Workers runtime: verify Better Auth and the Neon driver on workerd (`pnpm start`). The default in-memory rate limit is per isolate; revisit before production.
- Google consent screen: in Testing mode only listed test users can sign in; publishing needs a privacy policy URL (Q-legal).
- Rules 2, 3, 4 and 6 are not touched.

## Delivery notes

- Manual dev run of US-google-sign-in-3.1 and 3.2 (ADR 0009): **NOT YET DONE**. It needs the product owner's Google test account in their own signed-in Chrome. Until it is recorded here, "creates or reuses one User and lands on `/dashboard`" has no evidence.
- Seeded e2e scenarios (task 10) have not yet run against a real Neon developer branch: run `pytest e2e/google-sign-in -rs` against `pnpm start` with `E2E_SEED_DATABASE_URL`, `E2E_SEED_NEON_ENDPOINT` and `E2E_BETTER_AUTH_SECRET` set, and record the result here.
- Manual dev run of 3.1 must also check the 3.3 cookie attribute that seeding cannot cover (seeding is local-only, ADR 0009): after the real sign-in on an https dev URL, inspect the `__Secure-better-auth.session_token` cookie in DevTools and confirm it is `Secure`, `HttpOnly` and `SameSite=Lax`. Record the result here.
  - **Done 2026-11-27** (product owner, real Google sign-in on `https://sweetmemories-dev.haubuitatmp.workers.dev`, DevTools): `__Secure-better-auth.session_token` is `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, host-only (no `Domain`). Now also automated: `test_US_google_sign_in_3_3_dev_cookie_attributes` (task 10 file) checks the same attributes on the server-issued `__Secure-better-auth.state` cookie on dev, which Better Auth builds from the same cookie options.
