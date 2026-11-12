# 02 Bind `DATABASE_URL` to the dev Worker

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** dev-deploy 03, dev-test-database 01
**Feature spec:** [dev-test-database](../../features/dev-test-database.md)
**Mockup:** none

## What to change

Set the Worker secret with `wrangler secret put DATABASE_URL --env dev`, done by a maintainer and not from CI logs. Add `DATABASE_URL=` with a comment to `.env.example`. Declare the binding type in the Worker env typings, if typings exist, so the first DB feature can read it. Add no code that reads it.

## Checklist

- [ ] Secret `DATABASE_URL` set on the dev Worker
- [ ] `.env.example` lists `DATABASE_URL` with no value
- [ ] Binding type declared in Worker env typings (if they exist)

## Verification

- [ ] `wrangler secret list --env dev` shows `DATABASE_URL`.
- [ ] After a later merge deploys, the secret is still listed.
- [ ] A repo search finds no connection string.
- [ ] The dev `/` and `/api/health` responses contain no DB host.
- [ ] `pnpm test` and `pnpm typecheck` pass.
- [ ] Covers US-devdb-1.2 to 1.4 and US-devdb-2.1 to 2.3.
