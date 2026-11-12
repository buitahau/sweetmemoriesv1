# Open questions: CI/CD to Cloudflare dev (features)

Feature specs: [dev-deploy](../features/dev-deploy.md), [dev-test-database](../features/dev-test-database.md), [ci-pr-checks](../features/ci-pr-checks.md)

## Topic: dev-deploy

### Which URL should testers use for the dev environment?

Options:
- The Worker's workers.dev URL (sweetmemories-dev.<account>.workers.dev)
- A custom domain such as dev.sweetmemories.com
- Both

Recommended answer: workers.dev URL for now: no DNS work is needed; move to a custom domain when subdomain routing is designed.

Answer:

### Should the dev environment be public or restricted to the team?

Options:
- Public (anyone with the URL)
- Behind Cloudflare Access (team logins + a service token for e2e)

Recommended answer: Public for now: it holds no real data and no auth yet; revisit with Cloudflare Access when sign-in or real-looking test data arrives.

Answer:

### What should happen when the post-deploy smoke check on /api/health fails?

Options:
- Fail the workflow only; roll back manually
- Fail the workflow and automatically roll back to the previous version

Recommended answer: Fail the workflow and roll back automatically: testers keep a working dev environment without waiting for a maintainer.

Answer:

### Should the e2e suite run automatically against dev after each deploy?

Options:
- No, only the health smoke check; testers run e2e manually
- Yes, run all e2e suites against dev after every deploy

Recommended answer: No, only the smoke check for now: the requirement has testers testing on dev, and the e2e suite is still tiny; automate it later.

Answer:

## Topic: dev-test-database

### Should testers be able to reset the test database, and how often?

Options:
- No reset policy yet
- Manual reset on request, documented in the dev environment guide
- Automatic reset on every deploy

Recommended answer: Manual reset on request, documented: it keeps tester data between deploys but gives a known starting point when needed.

Answer:
