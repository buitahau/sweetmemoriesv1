# 02 Set up the Cloudflare account and GitHub Environment `dev`

**Status:** todo
**Side:** backend
**Size:** S
**Dependencies:** ADR 0002 accepted
**Feature spec:** [dev-deploy](../../features/dev-deploy.md)
**Mockup:** none

## What to change

Ops setup, no code. Create a Cloudflare API token scoped to "Workers Scripts: Edit" on the SweetMemories account only. Create the GitHub Environment `dev`, limited to the `dev-v2` branch, with the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Note the token owner and rotation date in `docs/infra/dev-environment.md`. Do not record the values.

## Checklist

- [ ] Scoped Cloudflare API token created
- [ ] GitHub Environment `dev` with both secrets and a `dev-v2` deployment-branch rule
- [ ] Token owner and rotation date noted in `docs/infra/dev-environment.md` (no values)

## Verification

- [ ] The token's permissions in the Cloudflare dashboard list only Workers Scripts Edit for one account.
- [ ] GitHub shows the Environment `dev` with both secrets and a deployment-branch rule of `dev-v2` only.
- [ ] Running `wrangler deploy --env dev --dry-run` locally with that token succeeds, and the token is then removed from the shell.
- [ ] Covers US-deploy-4.3.
