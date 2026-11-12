# 03 Document test database usage and reset

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** dev-test-database 01, 02
**Feature spec:** [dev-test-database](../../features/dev-test-database.md)
**Mockup:** none

## What to change

Extend `docs/infra/dev-environment.md` with which database dev uses, who can access it, the rule of synthetic data only, and (if agreed) the steps to reset the `dev` branch from its parent. Document the local DB setup (own Neon branch or local Postgres) in `docs/infra/local-development.md`. Update Progress.md.

## Checklist

- [ ] Dev database usage, access and synthetic-data rule documented
- [ ] Reset steps documented (if agreed)
- [ ] Local DB setup in `docs/infra/local-development.md`
- [ ] `Progress.md` updated

## Verification

- [ ] A maintainer follows the reset steps, the dev branch is restored, the parent branch is unchanged, and dev `/api/health` still returns `200` without a redeploy.
- [ ] Progress.md is updated, and the link to ADR 0004 resolves.
- [ ] Covers US-devdb-3.1 and 3.2 (if a reset policy is agreed).
