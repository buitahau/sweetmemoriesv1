# Provision Cloudflare dev

- Status: done

## Goal

Set up the Cloudflare account access and the GitHub environment `dev` that the `Deploy dev` workflow needs, and record the two dev URLs in the docs.

## Scope

Area: infra (Cloudflare and GitHub settings) plus one doc. **Done by a human** who owns the Cloudflare account and is a repository admin ([Q002](../../questions/questions-2026-11-09-requirement-breakdown.md)). Settings as in [infra/ci-cd.md](../../infra/ci-cd.md) and [infra/dev-environment.md](../../infra/dev-environment.md).

Steps:
1. Cloudflare dashboard: use (or create) the SweetMemories account, free plan. Workers & Pages > set the `workers.dev` subdomain if not set; note it as `<account-subdomain>`.
2. Note the Account ID (Workers & Pages overview, right side).
3. My Profile > API Tokens > Create Token > template "Edit Cloudflare Workers". Account Resources: include only the SweetMemories account. Zone Resources: none needed (no zones). TTL: none, or note the expiry date in your own password manager.
4. GitHub repository > Settings > Environments > New environment `dev`:
   - Deployment branches and tags: "Selected branches and tags", add `dev-v1` only.
   - Required reviewers: none.
   - Environment secrets: `CLOUDFLARE_API_TOKEN` (step 3), `CLOUDFLARE_ACCOUNT_ID` (step 2).
   - Environment variables: `DEV_API_URL` = `https://sweetmemories-api-dev.<account-subdomain>.workers.dev`, `DEV_WEB_URL` = `https://sweetmemories-web-dev.<account-subdomain>.workers.dev` (no trailing slash).
5. In [infra/dev-environment.md](../../infra/dev-environment.md): replace every `<account-subdomain>` with the real value and remove the words "(to be filled in)". Commit this doc change through a PR into `dev-v1`.

Prerequisites:
- [Q002](../../questions/questions-2026-11-09-requirement-breakdown.md) and [Q003](../../questions/questions-2026-11-09-requirement-breakdown.md) answered (account owner; `workers.dev` vs custom domain).
- Steps 1-3 (Cloudflare only) can be done at any time.
- Step 4 needs [create-dev-branch](../ci-checks/create-dev-branch.md) `done` (`dev-v1` must exist to add it as a deployment branch).
- Step 5 needs [add-ci-workflow](../ci-checks/add-ci-workflow.md) `done` (the doc PR into `dev-v1` is then checked by `verify`).
- Same design gate as [add-ci-workflow](../ci-checks/add-ci-workflow.md).

Out of scope: custom domains, DNS, Cloudflare Access, Worker secrets, Neon or S3 accounts, production environment.

Security: the token and account ID go only into GitHub environment secrets. Never paste them in a doc, commit, PR, issue, chat or log (writing-docs rule: no secrets). The token is limited to Workers on one account.

## Verification checklist

The task is complete only when every item below passes. Tags name the [dev-deploy](../../features/dev-deploy.md) acceptance criterion (ACn).

- [x] 1. `gh secret list --env dev` lists exactly `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. (AC4)
- [x] 2. `gh variable list --env dev` lists `DEV_API_URL` and `DEV_WEB_URL`, both `https://...workers.dev` with no trailing slash. (AC3)
- [x] 3. `gh api repos/$REPO/environments/dev` shows `deployment_branch_policy.custom_branch_policies: true`, and `gh api repos/$REPO/environments/dev/deployment-branch-policies` lists only `dev-v1`. (AC4)
- [x] 4. The token works and is narrow: `curl -s -H "Authorization: Bearer <token>" https://api.cloudflare.com/client/v4/user/tokens/verify` (run once by the human, locally, output not shared) shows `"status":"active"`; the token's permission list in the dashboard shows only Workers-related permissions on one account. (AC4)
- [x] 5. `docs/infra/dev-environment.md` contains no `<account-subdomain>` and no "(to be filled in)", and its URLs equal the two variables. (AC3)
- [x] 6. Run locally by the human who holds the values: `git grep -c -F` with the real account ID, and again with the real token, over `docs` finds nothing (exit 1 both times). The values are never echoed or shared. (writing-docs: no secrets)

## e2e-test-suites

Type: BE (infra). `$REPO` = `<owner>/<repo>`; `gh` signed in with admin rights. Item 4 is checked only by the human who holds the token.

```
E2E-1 -> checklist items 1, 2: secrets and variables present
Preconditions: environment dev saved
Request:
  gh secret list --env dev --json name -q '.[].name' | sort
  gh variable list --env dev --json name,value -q '.[] | "\(.name)=\(.value)"'
Expected: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (nothing else); DEV_API_URL=https://sweetmemories-api-dev.<sub>.workers.dev and DEV_WEB_URL=https://sweetmemories-web-dev.<sub>.workers.dev, no trailing "/"
```

```
E2E-2 -> checklist item 3: only dev-v1 may deploy
Preconditions: as E2E-1
Request:
  gh api repos/$REPO/environments/dev --jq '.deployment_branch_policy'
  gh api repos/$REPO/environments/dev/deployment-branch-policies --jq '.branch_policies[].name'
Expected: {"custom_branch_policies":true,"protected_branches":false}; only "dev-v1"
```

```
E2E-3 -> checklist item 4: token active (human only, local)
Preconditions: token in a local shell variable CF_TOKEN, never echoed
Request:
  curl -s -H "Authorization: Bearer $CF_TOKEN" https://api.cloudflare.com/client/v4/user/tokens/verify | grep -o '"status":"[a-z]*"'
Expected: "status":"active"
```

```
E2E-4 -> checklist item 5: doc filled in
Preconditions: doc PR merged
Request:
  grep -c -E '<account-subdomain>|to be filled in' docs/infra/dev-environment.md
  grep -o -E 'https://sweetmemories-(api|web)-dev\.[a-z0-9-]+\.workers\.dev' docs/infra/dev-environment.md | sort -u
Expected: 0; the two URLs equal the variables from E2E-1
```

```
E2E-5 -> checklist item 6: no secret values in docs (human only, local)
Preconditions: doc PR merged and pulled; values read into the shell without echo: read -rs CF_ACCOUNT_ID; read -rs CF_TOKEN
Request:
  git grep -c -F "$CF_ACCOUNT_ID" -- docs > /dev/null; echo "id=$?"
  git grep -c -F "$CF_TOKEN" -- docs > /dev/null; echo "token=$?"
  unset CF_ACCOUNT_ID CF_TOKEN
Expected: id=1; token=1 (no match). Example SHAs in docs are not secrets and do not affect this check.
```

## Summary

- Done by the human (environment `dev`, secrets, variables, branch policy, doc URLs).
- Test (tester): items 1, 2, 3, 5 Pass (secret names only; no values seen). Items 4 and 6 need the token and account ID values, so only the human can confirm them.
- Human confirmation (2026-11-09): item 4 (token active, Workers-only on one account) and item 6 (`git grep -F` for the account ID and the token under `docs` both exit 1). Done.

## Links

- Feature: [dev-deploy](../../features/dev-deploy.md)
- ADR: [0002-ci-cd-and-dev-environment-on-cloudflare](../../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)
- Infra: [ci-cd](../../infra/ci-cd.md), [dev-environment](../../infra/dev-environment.md)
