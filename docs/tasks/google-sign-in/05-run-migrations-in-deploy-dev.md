# 05 Run migrations in deploy-dev (ADR 0007)

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** [03](03-auth-schema-and-first-migration.md), Q-migrate (see [open questions](../../decisions/google-sign-in-adr.md)). Must land before the first deploy that needs the tables
**Feature spec:** [google-sign-in](../../features/google-sign-in.md)
**Mockup:** none

## Checklist

- [ ] Add a migrate step to the `deploy-dev` workflow, before the Worker deploy, using a masked GitHub environment secret `DATABASE_URL`
- [ ] Update `docs/infra/ci-cd.md` and `docs/infra/dev-environment.md`

## Verification

- [ ] Extend `src/ci/deploy-dev.test.ts`: the migrate step exists, runs before deploy, and uses the secret without echoing it
- [ ] A dev deploy run shows the step passing and the tables present on the dev branch
- [ ] The log has no connection string
