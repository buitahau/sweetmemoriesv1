# 01 Google OAuth client and auth secrets

**Status:** in progress (code and docs done; maintainer steps pending)
**Side:** backend
**Size:** S
**Dependencies:** Q-consent (see [open questions](../../decisions/google-sign-in-feature.md))
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [ ] A maintainer creates the Google Cloud OAuth client and consent screen (scopes `openid email profile`, mode per Q-consent)
- [ ] Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://sweetmemories-dev.<account>.workers.dev/api/auth/callback/google`
- [x] Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `BETTER_AUTH_SECRET` to `.env.example` (empty) and `src/env.d.ts`
- [ ] A maintainer adds the three secrets to the GitHub Environment `dev` (Settings, Environments, `dev`, Environment secrets), before the workflow change below merges
- [x] In `.github/workflows/deploy-dev.yml`, add the three names to the wrangler-action `secrets:` list and the step `env:` block (next to `DATABASE_URL`), plus a "Require ..." check for each so a missing secret fails early; update `src/ci/deploy-dev.test.ts` if it asserts the list
- [x] Local run: document that a local `.env` holds the same keys (own `DATABASE_URL`, a separate `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:3000`), and which file `wrangler dev` reads (`.dev.vars` or `.env`; verify and document)
- [x] Document setup and rotation in `docs/infra/local-development.md` and `docs/infra/dev-environment.md`: rotate by updating the GitHub Environment secret and re-running `deploy-dev`; rotating `BETTER_AUTH_SECRET` signs everyone out

## Verification

- [ ] After a `deploy-dev` run, `wrangler secret list -c wrangler.jsonc --env dev` shows the three names, and `deploy-dev` fails early when one is missing
- [ ] `.env.example` has the keys with empty values, and `git grep` finds no real values
- [ ] The infra docs list the steps
- [ ] Vitest (extend the existing env typing test or add one) confirms the keys are declared
