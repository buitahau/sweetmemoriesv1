# 04 Add the post-deploy smoke check

**Status:** in progress
**Side:** backend
**Size:** S
**Dependencies:** dev-deploy 03
**Feature spec:** [dev-deploy](../../features/dev-deploy.md)
**Mockup:** none

## What to change

After the deploy step in `deploy-dev`, poll `GET <dev URL>/api/health` for up to 60 seconds. Pass only on `200` with body exactly `{"status":"ok"}` and no `Set-Cookie`. Otherwise fail the run and print status and body. If auto-rollback is agreed, run `wrangler rollback --env dev` on failure.

## Checklist

- [x] Smoke step polls `/api/health` for up to 60 seconds
- [x] Fails on non-200, wrong body or `Set-Cookie`, and prints status and body
- [x] Auto-rollback on failure (if agreed)

## Verification

- [ ] A normal merge passes the smoke step.
- [ ] Pointing the smoke URL at `/api/does-not-exist` in a throwaway workflow run on a test branch with `workflow_dispatch` makes the step fail with the response in the log. Revert afterwards.
- [ ] With auto-rollback agreed, the failed run leaves the previous version active in the Cloudflare dashboard.
- [ ] Covers US-deploy-2.3 and US-deploy-4.4.
