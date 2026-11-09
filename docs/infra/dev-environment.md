# Dev environment

Status: proposed ([ADR 0002](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)). URLs are filled in by [provision-cloudflare-dev](../tasks/dev-deploy/provision-cloudflare-dev.md); becomes current once the [dev-deploy-verification](../features/dev-deploy-verification.md) tasks are done.

## What

A shared, always-on copy of the latest `dev-v1` commit, used by agents and humans to verify tickets after merge. Contains no real user data.

## Where it runs

Cloudflare Workers, free plan, `workers.dev` subdomain `<account-subdomain>` (to be filled in).

| App | Worker name | URL | Config |
|---|---|---|---|
| API | `sweetmemories-api-dev` | `https://sweetmemories-api-dev.<account-subdomain>.workers.dev` (to be filled in) | `apps/api/wrangler.jsonc` |
| Web | `sweetmemories-web-dev` | `https://sweetmemories-web-dev.<account-subdomain>.workers.dev` (to be filled in) | `apps/web/wrangler.jsonc` |

Shell setup for agents (values from the table, or `gh variable list --env dev`):

```sh
export DEV_API_URL="https://sweetmemories-api-dev.<account-subdomain>.workers.dev"
export DEV_WEB_URL="https://sweetmemories-web-dev.<account-subdomain>.workers.dev"
```

URLs have no trailing slash.

## Deployed-commit markers

| App | Request | Response |
|---|---|---|
| API | `GET $DEV_API_URL/api/version` | `{"commit":"<40-hex sha>"}` ([api/version.md](../api/version.md)) |
| Web | `GET $DEV_WEB_URL/version.json` | `{"commit":"<40-hex sha>"}`, `Cache-Control: no-store` |

## How an agent verifies a ticket on dev

Run the steps in this order. The wait and smoke checks also run inside every `Deploy dev` run; step 4 repeats the wait so the agent never trusts a fixed sleep.

1. Get the merge commit and fetch:
   ```sh
   MERGE_SHA=$(gh pr view <pr> --json mergeCommit -q .mergeCommit.oid)
   git fetch origin dev-v1
   ```
2. Find and watch the deploy run for that commit (it may be `queued` or `in_progress`; wait up to 300 s for it to appear):
   ```sh
   RUN_ID=""; for i in $(seq 30); do RUN_ID=$(gh run list --workflow deploy-dev.yml --branch dev-v1 --commit "$MERGE_SHA" --json databaseId -q '.[0].databaseId'); [ -n "$RUN_ID" ] && break; sleep 10; done
   gh run watch "$RUN_ID" --exit-status > /dev/null || true
   gh run view "$RUN_ID" --json conclusion -q .conclusion
   ```
   No run after 300 s: report a failed test ("no Deploy dev run for MERGE_SHA") and stop.
3. That run's `conclusion` decides:
   - `success`: go to step 4.
   - `cancelled`: a later merge replaced this run (normal with 3+ quick merges). Take the newest run, `RUN_ID=$(gh run list --workflow deploy-dev.yml --branch dev-v1 --limit 1 --json databaseId -q '.[0].databaseId')`, watch it as in step 2, and apply step 3 to it. Its commit contains `MERGE_SHA`, because `dev-v1` only moves forward. If that newest run then ends `failure`, it also contains later merges, so who is to blame is open ([Q012](../questions/questions-2026-11-09-requirement-breakdown.md#q012-how-is-a-failure-of-the-newest-run-reported-after-the-tickets-own-run-was-cancelled)). Until it is answered, report "blocked by later merge `<newest headSha>`" with `gh run view "$RUN_ID" --log-failed`, not a failure of this ticket.
   - `failure` or anything else: report a failed test with `gh run view "$RUN_ID" --log-failed` and stop. Do this even if a later run succeeded: the ticket's own merge broke the deploy. Do not re-run the failed run, also not after an error that looks transient, until [Q013](../questions/questions-2026-11-09-requirement-breakdown.md#q013-may-the-verifying-agent-re-run-a-deploy-dev-run-that-failed-on-a-transient-error) is answered.
4. Run `scripts/wait-for-dev-deploy.sh "$MERGE_SHA"`. Exit 0 = both apps run that commit or a later one. Exit 1 = timeout (prints what is deployed): report a failed test. Exit 2 = usage or config error: fix the shell setup and rerun.
5. Run the ticket's `e2e-test-suites` with `BASE_URL=$DEV_API_URL` for BE suites or `BASE_URL=$DEV_WEB_URL` for FE suites (open it in the browser). Cases that need a local process (exit codes, `PORT`, file checks) stay local; mark them "local only" in the report.
6. Never write real user data to dev. Never send a `Cookie` header except the fake values the suites use.

## Rules

- Public on the internet, not indexed (`X-Robots-Tag: noindex` on web pages). Treat everything on dev as public (`CLAUDE.md` rule 5).
- No cookies are set by either Worker (groundwork for `CLAUDE.md` rule 1). Assumption: Cloudflare adds no cookie of its own (such as `__cf_bm`) on `workers.dev` without Bot Fight Mode. If a smoke or E2E check ever finds one, raise a question in the session questions file; never weaken the check.
- Free plan limits apply: 100,000 requests per day per account; heavy load tests are not allowed on dev.

## Config / env vars

See [ci-cd.md](ci-cd.md#config--env-vars-names-only). No secrets live in the Workers yet.

## How to change it

- Worker name or URL: edit `wrangler.jsonc`, this doc, the GitHub environment variables `DEV_API_URL` / `DEV_WEB_URL` and [ADR 0002](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md) in one change.
- Moving to a custom domain: new ADR (see [Q003](../questions/questions-2026-11-09-requirement-breakdown.md)).
