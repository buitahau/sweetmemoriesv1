# ADR 0009: Reaching the signed-in state in e2e tests without real Google

## Status

proposed

Open questions: [../decisions/google-sign-in-adr.md](../decisions/google-sign-in-adr.md)

## Context

Every user story after the Google redirect needs a signed-in browser. Google sign-in cannot be automated reliably: bot detection, 2FA and real accounts in CI are all problems.

Options:

1. **Seed the session in the test database.** The e2e helper inserts a User, Account and Session into the local or test Neon branch, then sets the session cookie in the Playwright context, signed with the test `BETTER_AUTH_SECRET` the way Better Auth signs it. No app code changes. Cons: depends on Better Auth's cookie signing format (pin the version and cover it with one test); needs `DATABASE_URL` and the secret, so it runs locally only, not against dev.
2. **Mock OAuth server.** Point the Google provider at a local OIDC mock in test runs. Exercises the full callback path. Cons: an env-switched provider endpoint in app code, plus a mock server to maintain.
3. **Test-only sign-in endpoint behind an env flag.** Simplest. Cons: a backdoor that could ship to dev or production by misconfiguration. Rejected under the security rules.

## Decision

Option 1 (proposed). The real Google round-trip is covered by one manual check per release on dev, recorded as BLOCKED or manual in the e2e suite. The redirect to `accounts.google.com` (URL and parameters) is asserted automatically without completing it.

**Real-account check on dev.** The product owner runs it in their own Chrome, where they are already signed in to Google, because a headless browser has no Google session and Google blocks sign-in in automated browsers. Either drive that Chrome through the Claude in Chrome extension, or attach Playwright to it with `connect_over_cdp` (Chrome started with `--remote-debugging-port` on a dedicated profile signed in by hand). This is on demand, never in CI. The Google OAuth consent screen on dev stays in Testing mode, with the product owner's account listed as a test user.

## Consequences

- Easier: fast, deterministic signed-in tests and no secrets in CI beyond the existing ones.
- Harder: the callback handler itself is covered by unit tests and the manual check, not by e2e. The helper must never target dev or production (reuse the `E2E_BASE_URL` guard, refuse non-local databases).

Related: feature [google-sign-in](../features/google-sign-in.md), task [10](../tasks/google-sign-in/10-e2e-google-sign-in.md).
