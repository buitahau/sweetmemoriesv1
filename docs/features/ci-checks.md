# CI checks

- Status: in-progress

## Summary

Every pull request into `dev-v1` (or `main`) runs one GitHub Actions job, `verify`, that installs, type-checks, tests and builds the whole repository. `dev-v1` is protected so a PR can only be merged, by a human or an agent, when `verify` passes. Decided in [ADR 0002](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md); details in [infra/ci-cd.md](../infra/ci-cd.md).

Order: after the [project-workspace](project-workspace.md), [api-skeleton](api-skeleton.md) and [web-skeleton](web-skeleton.md) features are `done` (the root scripts must exist). Design gate for every task: [Q001 (2026-11-08)](../questions/questions-2026-11-08-requirement-breakdown.md#q001-does-this-requirement-approve-writing-skeleton-code-during-the-design-phase) and [Q001 (2026-11-09)](../questions/questions-2026-11-09-requirement-breakdown.md#q001-does-this-requirement-approve-writing-cicd-and-deploy-config-now) answered "Yes", ADR 0001 and ADR 0002 `accepted`.

## User story

As the agent that implements a ticket, I want my PR checked automatically and merging blocked when checks fail, so that broken code never reaches `dev-v1` and the dev environment.

Acceptance criteria:
1. Opening or updating a PR into `dev-v1` or `main` registers workflow `CI`, check `verify` (state `queued`, `pending` or later) on the PR within 5 minutes. The limit covers GitHub event and queue delay, which the project does not control.
2. `verify` runs `npm ci`, `npm run typecheck`, `npm test`, `npm run build` in that order on the Node version in `.nvmrc`, and fails if any step fails.
3. `verify` uses no repository or environment secrets and has `permissions: contents: read`.
4. On `dev-v1`, a PR whose `verify` failed or is still running cannot be merged, also not by an admin or `gh pr merge`.
5. Direct pushes and force-pushes to `dev-v1` are rejected; `dev-v1` cannot be deleted.
6. A PR whose `verify` passed can be squash-merged with `gh pr merge <pr> --squash --delete-branch`.

## Behavior

- Workflow file `.github/workflows/ci.yml`, workflow name `CI`, job id and name `verify`.
- `concurrency: ci-${{ github.ref }}`, `cancel-in-progress: true` (a new push to the same PR cancels the old run).
- Timeout 15 minutes.
- PRs that change only `docs/**` still run `verify` (no path filter), so the required check always reports.

## Out of scope

- Deploying (see [dev-deploy](dev-deploy.md)), preview deploys per PR.
- Linting, coverage gates, dependency scanning, CodeQL.
- Protection rules for `main`.
- Changes to the `.claude/` skills.

## Verification checklist

The feature is complete only when every item below passes.

- [ ] 1. All three tasks of this feature have Status `done`. (all ACs)
- [ ] 2. A test PR into `dev-v1` lists check `verify` in any state (`queued`, `pending`, `pass` or `fail`) in `gh pr checks <pr>` within 5 minutes of opening. (AC1)
- [ ] 3. The `verify` log shows the steps `npm ci`, `npm run typecheck`, `npm test`, `npm run build` in that order and `node -v` equal to `v` + the `.nvmrc` major. (AC2)
- [ ] 4. A PR that adds a failing test gets `verify` = `fail`; a PR with a type error gets `verify` = `fail`. (AC2)
- [ ] 5. `ci.yml` contains no `secrets.` reference and declares `permissions:` with only `contents: read`. (AC3)
- [ ] 6. `gh pr merge <pr> --squash` on a PR with failing `verify` is refused by GitHub, run with an admin token. (AC4)
- [ ] 7. `git push origin HEAD:dev-v1` and `git push --force origin HEAD:dev-v1` from a local commit are rejected. (AC5)
- [ ] 8. A PR with passing `verify` merges with `gh pr merge <pr> --squash --delete-branch` and its branch is deleted. (AC6)
- [ ] 9. A docs-only PR still reports `verify` (no path filter). (Behavior)
- [ ] 10. `gh pr merge <pr> --squash`, run with an admin token right after the PR is opened, while `gh pr checks <pr>` shows `verify` as `pending` (or not yet listed), exits non-zero and the PR stays `OPEN`. (AC4: the "still running" race of an auto-merging agent)

## e2e-test-suites

Type: BE (infra). Run from a clone with `gh` signed in as a repository admin. `$REPO` = `<owner>/<repo>`. Test branches start with `ci-test/` and are deleted afterwards; test PRs are closed, not merged, unless the case says so. Docs-only test PRs change only the probe file `docs/.ci-probe` ([ci-cd "Test PRs"](../infra/ci-cd.md#test-prs-probe-file)), never a real doc.

```
E2E-1 -> checklist items 2, 3, 9: docs-only PR runs verify
Preconditions: dev-v1 exists and contains ci.yml
Request:
  git checkout -b ci-test/docs origin/dev-v1 && date -u +%FT%TZ > docs/.ci-probe && git add docs/.ci-probe && git commit -m "ci probe" && git push -u origin ci-test/docs
  gh pr create --base dev-v1 --head ci-test/docs --title "ci test docs" --body "test"
  for i in $(seq 30); do gh pr checks ci-test/docs 2>/dev/null | grep -q verify && break; sleep 10; done; echo "seen_after=$((i*10))s"
  gh pr checks ci-test/docs --watch
  gh run view $(gh run list --workflow ci.yml --branch ci-test/docs --limit 1 --json databaseId -q '.[0].databaseId') --log | grep -E 'npm ci|npm run typecheck|npm test|npm run build|v[0-9]+\.'
Expected: verify listed within 300 s (seen_after <= 300s), then pass; log lines appear in the order npm ci, typecheck, test, build; node version major equals cat .nvmrc
```

```
E2E-2 -> checklist items 4, 6: failing test blocks merge
Preconditions: as E2E-1
Request:
  git checkout -b ci-test/fail origin/dev-v1
  printf "import { it, expect } from 'vitest'\nit('fails on purpose', () => { expect(1).toBe(2) })\n" > apps/api/test/zz-fail.test.ts
  git add . && git commit -m "ci test fail" && git push -u origin ci-test/fail
  gh pr create --base dev-v1 --head ci-test/fail --title "ci test fail" --body "test"
  gh pr checks ci-test/fail --watch; gh pr merge ci-test/fail --squash; echo "merge=$?"
Expected: verify = fail; merge non-zero with a message that required status checks have not passed; PR stays open
```

```
E2E-3 -> checklist item 4: type error fails verify
Preconditions: as E2E-1
Request:
  git checkout -b ci-test/type origin/dev-v1 && echo "const x: number = 'a'" >> apps/api/src/config.ts && git commit -am "type error" && git push -u origin ci-test/type
  gh pr create --base dev-v1 --head ci-test/type --title "ci test type" --body "test"; gh pr checks ci-test/type --watch
Expected: verify = fail; failed step is "npm run typecheck"
```

```
E2E-4 -> checklist item 5: no secrets, read-only token
Preconditions: none
Request:
  grep -c 'secrets\.' .github/workflows/ci.yml
  grep -A2 '^permissions:' .github/workflows/ci.yml
Expected: 0; permissions block contains only "contents: read"
```

```
E2E-5 -> checklist item 7: direct and force pushes rejected
Preconditions: local commit on top of origin/dev-v1
Request:
  git checkout -b ci-test/push origin/dev-v1 && git commit --allow-empty -m "direct" && git push origin HEAD:dev-v1; echo "push=$?"
  git push --force origin HEAD:dev-v1; echo "force=$?"
Expected: push and force both non-zero; remote message mentions protected branch
```

```
E2E-6 -> checklist item 8: passing PR merges
Preconditions: the E2E-1 probe PR (changes only docs/.ci-probe) with verify = pass
Request:
  gh pr merge ci-test/docs --squash --delete-branch; echo "merge=$?"
  git ls-remote --heads origin ci-test/docs | wc -l
Expected: merge=0; 0 (branch deleted)
Cleanup: close the other ci-test PRs with gh pr close <pr> --delete-branch
```

```
E2E-7 -> checklist item 10: merge refused while verify is still running (AC4)
Preconditions: as E2E-1; protect-dev-branch done; no other ci-test/pending branch
Request:
  git checkout -b ci-test/pending origin/dev-v1 && date -u +%FT%TZ > docs/.ci-probe && git add docs/.ci-probe && git commit -m "ci probe pending" && git push -u origin ci-test/pending
  gh pr create --base dev-v1 --head ci-test/pending --title "ci test pending" --body "test"
  gh pr checks ci-test/pending; echo "checks=$?"
  gh pr merge ci-test/pending --squash; echo "merge=$?"
  gh pr view ci-test/pending --json state -q .state
Expected: gh pr checks shows verify "pending" or no checks yet (checks=8 or 1, never 0, which would mean the run already passed: then repeat with a new probe commit); merge non-zero with a message that required status checks are expected or not yet passed; state "OPEN"
Cleanup: gh pr close ci-test/pending --delete-branch
```

## Related

- Parent ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- Infra: [ci-cd](../infra/ci-cd.md)
- Sibling features: [dev-deploy](dev-deploy.md), [dev-deploy-verification](dev-deploy-verification.md)
- Tasks:
  1. [create-dev-branch](../tasks/ci-checks/create-dev-branch.md) (human)
  2. [add-ci-workflow](../tasks/ci-checks/add-ci-workflow.md) (after task 1)
  3. [protect-dev-branch](../tasks/ci-checks/protect-dev-branch.md) (human, after task 2 has run once)
- Open questions: [Q001, Q004](../questions/questions-2026-11-09-requirement-breakdown.md)
