# 05 Document the dev environment for testers

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** dev-deploy 03, 04
**Feature spec:** [dev-deploy](../../features/dev-deploy.md)
**Mockup:** none

## What to change

Create `docs/infra/dev-environment.md` (load `docs-placement`): the dev URL, what triggers a deploy, how to find which commit is live, manual rollback (`wrangler rollback` or the dashboard), and how to run e2e against dev (`E2E_BASE_URL=<dev URL> .venv-e2e/bin/pytest e2e/<feature>`, noting that US-skeleton-1.6 is local-only). Update `e2e/README.md` and `docs/infra/local-development.md` for the new `pnpm start`. Update the CLAUDE.md Status line. Update Progress.md.

## Checklist

- [ ] `docs/infra/dev-environment.md` written
- [ ] `e2e/README.md` and `docs/infra/local-development.md` updated for `pnpm start`
- [ ] CLAUDE.md Status line and `Progress.md` updated

## Verification

- [ ] A tester who has not seen the pipeline can follow the doc alone to run `e2e/project-skeleton` against the dev URL, and all scenarios pass except US-skeleton-1.6.
- [ ] Following the rollback steps on dev restores the previous version, and `/api/health` returns `200`.
- [ ] Progress.md is updated, and links to ADRs 0002 and 0003 resolve.
- [ ] Covers US-deploy-1.4, US-deploy-2.4 and US-deploy-4.5.
