# 02 Bind `DATABASE_URL` to the dev Worker

**Status:** in progress
**Side:** backend
**Size:** S
**Dependencies:** dev-deploy 03, dev-test-database 01
**Feature spec:** [dev-test-database](../../features/dev-test-database.md)
**Mockup:** none

## What to change

Store `DATABASE_URL` as a secret of the GitHub Environment `dev`; `deploy-dev` pushes it to the dev Worker as a secret on each deploy (wrangler-action `secrets` input, value never printed). Add `DATABASE_URL=` with a comment to `.env.example`. Declare the binding type in the Worker env typings, if typings exist, so the first DB feature can read it. Add no code that reads it.

## Checklist

- [x] Secret `DATABASE_URL` added to the GitHub Environment `dev`
- [x] `deploy-dev` pushes it to the dev Worker and fails early if it is missing
- [ ] Secret `DATABASE_URL` set on the dev Worker (confirm after the deploy)
- [x] `.env.example` lists `DATABASE_URL` with no value
- [x] Binding type declared (`src/env.d.ts`) in Worker env typings (if they exist)

## Verification

- [ ] `wrangler secret list --env dev` shows `DATABASE_URL`.
- [ ] After a later merge deploys, the secret is still listed.
- [x] A repo search finds no connection string (enforced by `src/ci/test-database.test.ts`).
- [ ] The dev `/` and `/api/health` responses contain no DB host.
- [x] `pnpm test` and `pnpm typecheck` pass.
- [ ] Covers US-devdb-1.2 to 1.4 and US-devdb-2.1 to 2.3.
