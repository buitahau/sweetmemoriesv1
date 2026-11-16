# 01 Google OAuth client and auth secrets

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** Q-consent (see [open questions](../../decisions/google-sign-in-feature.md))
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [ ] A maintainer creates the Google Cloud OAuth client and consent screen (scopes `openid email profile`, mode per Q-consent)
- [ ] Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://sweetmemories-dev.<account>.workers.dev/api/auth/callback/google`
- [ ] Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `BETTER_AUTH_SECRET` to `.env.example` (empty) and `src/env.d.ts`
- [ ] Set them as Worker secrets for `env.dev` with `wrangler secret put`
- [ ] Document setup and rotation in `docs/infra/local-development.md` and `docs/infra/dev-environment.md` (rotating `BETTER_AUTH_SECRET` signs everyone out)

## Verification

- [ ] `wrangler secret list --env dev` shows the three names
- [ ] `.env.example` has the keys with empty values, and `git grep` finds no real values
- [ ] The infra docs list the steps
- [ ] Vitest (extend the existing env typing test or add one) confirms the keys are declared
