# 05 Run migrations in deploy-dev (ADR 0007)

**Status:** done
**Side:** backend
**Size:** S
**Dependencies:** [03](03-auth-schema-and-first-migration.md), Q-migrate (see [open questions](../../decisions/google-sign-in-adr.md)). Must land before the first deploy that needs the tables
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [x] Add a migrate step to the `deploy-dev` workflow, before the Worker deploy, using a masked GitHub environment secret `DATABASE_MIGRATE_URL` (owner role; the Worker keeps the non-owner `DATABASE_URL`)
- [x] Update `docs/infra/ci-cd.md` and `docs/infra/dev-environment.md`

## Verification

- [x] Extend `src/ci/deploy-dev.test.ts`: the migrate step exists, runs before deploy, and uses the secret without echoing it
- [x] A dev deploy run shows the step passing and the tables present on the dev branch (run 44463630526 on 2026-11-20: Migrate dev database, Deploy to dev and the sign-in smoke check all succeeded; `user`, `session`, `account`, `verification` exist on Neon `devv2`)
- [x] The log has no connection string (the secret is masked as `***` in the run log)
