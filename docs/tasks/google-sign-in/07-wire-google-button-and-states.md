# 07 Wire the Google button, loading and error states

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** [04](04-better-auth-server-and-api-route.md), [06](06-login-page-ui-from-mockup.md)
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** [Login.dc.html](../../ui/Login/Login.dc.html) (loading state in its logic class)

## Checklist

- [ ] Add the Better Auth React client
- [ ] On click call `signIn.social({ provider: 'google', callbackURL: '/dashboard', errorCallbackURL: '/sign-in' })` and switch to the loading state ("Opening Google…", `aria-busy`, disabled, status text); ignore repeat clicks
- [ ] Map the `?error=` code to two fixed messages (Q-error-copy); never render the raw value
- [ ] On a request failure, return to idle with the generic message

## Verification

- [ ] Vitest with a mocked client: one call per double click; loading attributes set; `?error=access_denied` shows the cancel message; `?error=<script>` shows the generic message with no reflected text; a rejected call restores idle
- [ ] Manual on `pnpm start`: the click reaches the Google account chooser
