# 01 Add the CI workflow for PRs

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** none
**Feature spec:** [ci-pr-checks](../../features/ci-pr-checks.md)
**Mockup:** none

## What to change

Add `.github/workflows/ci.yml`. It triggers on `pull_request` to `dev-v2` and has one job named `ci`. Permissions: `contents: read`. Steps: checkout; pnpm setup; Node 24 with pnpm cache; `pnpm install --frozen-lockfile`; `pnpm lint`; `pnpm typecheck`; `pnpm test`; `pnpm build` (final list per the open questions). Pin actions to commit SHAs. Add a `packageManager` field to `package.json` pinning pnpm 10.x. Add `engines.node` `>=24 <25`. Use a concurrency group per PR that cancels superseded runs.

## Checklist

- [ ] `.github/workflows/ci.yml` with job `ci`
- [ ] Actions pinned to commit SHAs, `permissions: contents: read`
- [ ] `packageManager` (pnpm 10.x) and `engines.node` in `package.json`
- [ ] Per-PR concurrency group that cancels superseded runs

## Verification

- [ ] A PR containing only this change shows a green `ci` check, and the log shows Node 24.x and the pinned pnpm.
- [ ] In a throwaway PR, a Vitest test asserting `1 === 2` turns `ci` red and names the test. A type error also turns it red (if typecheck is required). Close the throwaway PR without merging.
- [ ] In a throwaway PR, a `package.json` dependency change without a lockfile update fails at install.
- [ ] The workflow file uses `pull_request` (not `pull_request_target`), `permissions: contents: read`, and SHA-pinned actions.
- [ ] `pnpm install && pnpm test` still passes locally with the pinned pnpm.
- [ ] Covers US-ci-1.1 to 1.4, US-ci-2.1 to 2.2, and US-ci-3.1 to 3.3.
