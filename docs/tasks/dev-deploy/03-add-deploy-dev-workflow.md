# 03 Add the deploy-dev workflow

**Status:** in progress
**Side:** backend
**Size:** M
**Dependencies:** ci-pr-checks 01, dev-deploy 01, dev-deploy 02
**Feature spec:** [dev-deploy](../../features/dev-deploy.md)
**Mockup:** none

## What to change

Add `.github/workflows/deploy-dev.yml`, triggered on `push` to `dev-v2` and on `workflow_dispatch`, with `environment: dev` and `concurrency: { group: deploy-dev, cancel-in-progress: false }`. Steps: same install and checks as `ci` (reuse through a reusable workflow or composite action, to avoid drift); `pnpm build`; `wrangler deploy --env dev` via the SHA-pinned `cloudflare/wrangler-action`. Write the commit SHA, dev URL and version ID to the job summary.

## Checklist

- [ ] `deploy-dev.yml` with push and `workflow_dispatch` triggers, `environment: dev`, queued concurrency
- [ ] Checks shared with `ci` (no drift)
- [ ] Deploy with SHA-pinned `cloudflare/wrangler-action`
- [ ] Job summary with SHA, URL and version ID

## Verification

- [ ] Merging a trivial PR (for example, a docs change) starts `deploy-dev`, which succeeds within 10 minutes, and the summary shows the SHA, URL and version ID.
- [ ] The dev URL serves `/` with the heading "SweetMemories home page" and `/api/health` with `{"status":"ok"}`.
- [ ] The Cloudflare dashboard shows a new version whose message or tag contains the commit SHA.
- [ ] Two merges about 30 seconds apart produce queued, not parallel, runs, and dev ends on the second commit.
- [ ] A push to a `feat/*` branch triggers no deploy.
- [ ] The full run log contains no token value (GitHub masks it).
- [ ] Covers US-deploy-1.1, 1.2, 1.3, 1.5, 1.6, US-deploy-2.1, 2.2, US-deploy-3.1, 3.2, and US-deploy-4.1, 4.2.
