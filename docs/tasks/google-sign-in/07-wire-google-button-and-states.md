# 07 Wire the Google button, loading and error states

**Status:** done
**Side:** front-end
**Size:** S
**Dependencies:** [04](04-better-auth-server-and-api-route.md), [06](06-login-page-ui-from-mockup.md)
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** [Login.dc.html](../../ui/Login/Login.dc.html) (loading state in its logic class)

## Checklist

- [x] Add the Better Auth React client
- [x] On click call `signIn.social({ provider: 'google', callbackURL: '/dashboard', errorCallbackURL: '/sign-in' })` and switch to the loading state ("Opening Google…", `aria-busy`, disabled, status text); ignore repeat clicks
- [x] Map the `?error=` code to two fixed messages (Q-error-copy); never render the raw value
- [x] On a request failure, return to idle with the generic message

## Verification

- [x] Vitest with a mocked client: one call per double click; loading attributes set; `?error=access_denied` shows the cancel message; `?error=<script>` shows the generic message with no reflected text; a rejected call restores idle
- [x] Manual: the click reaches the Google account chooser (headed Playwright walkthrough against dev, 2026-11-20: browser landed on accounts.google.com with the right client_id, redirect_uri, scope `openid email profile` and state; no credentials typed)
- [x] Back/forward cache restore resets the button to idle (`pageshow` with `persisted`, `controller.reset()`)

## Summary

**Built:** the Better Auth React client and the wired "Continue with Google" button on `/sign-in`: one `signIn.social` call per click, loading state ("Opening Google…", `aria-busy`, disabled, status text), `?error=` mapped to two fixed messages (never reflecting the raw value), idle restore on request failure and on bfcache restore.

**PRs:** [#157](https://github.com/buitahau/sweetmemoriesv1/pull/157) (wire Google sign-in button with loading and error states), [#158](https://github.com/buitahau/sweetmemoriesv1/pull/158) (homepage e2e assertions updated to the login page UI).

**Test evidence (dev, attempt 2, PASS):** deploy-dev run 44721111855 on faf5ac9. `pnpm test` (Node 24) 27 files / 332 passed, typecheck and lint clean. e2e `e2e/google-sign-in/test_google_sign_in_task07_google_button_states.py` 9 passed; task 06 file 11 passed; whole google-sign-in and homepage suites 133 passed, 0 failed, 6 skipped (BLOCKED: Cloudflare/Google Cloud maintainer steps, no Neon developer branch URL, no unconfigured server, no Template storage). Headed Playwright walkthrough at 1440, 768 and 375 widths: 11 checks, 0 failures, no console or network errors. Curl checks on `/api/auth/sign-in/social` passed (hostile callbackURL 400, valid 200 with Google URL, state cookie HttpOnly/Secure/SameSite=Lax). Logs live in the tester's session scratchpad (`walk/walkthrough.py`, `walk/results.json`, `walk/*.png`, `e2e_task06_07.log`, `e2e_feature_regression.log`, `curl/`); 19 e2e screenshots are in `e2e/google-sign-in/screenshots` (git-ignored). Not in the repo.

**Still open (not ticket 07 code):**
- Deviation in the auth server config (task 04 area): `POST /api/auth/sign-in/social` with a foreign `Origin` and no cookie returns 200 with a Google URL; with a cookie it returns 403. The spec (google-sign-in Risks) and `src/server/auth/auth.ts` (`trustedOrigins: [config.baseURL]`) say only the site origin is trusted, so a cross-site page can start a sign-in flow (login CSRF surface). Redirects and callbacks stay relative and safe. Needs follow-up by the task 04 owner.
- Minor: at 375 px the `h1` and card copy sit about 8 px from the right edge; the contract asks for a 16 px gutter.
- The bfcache e2e test approximates a real bfcache restore.

**Fix cycles:** 1.
