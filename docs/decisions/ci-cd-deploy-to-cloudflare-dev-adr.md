# Open questions: CI/CD to Cloudflare dev (ADRs)

ADRs: [0002](../adr/0002-host-on-cloudflare-workers.md), [0003](../adr/0003-ci-cd-github-actions.md), [0004](../adr/0004-neon-dev-branch-test-database.md)

## Topic: ADR 0002: Host the app on Cloudflare Workers

### Do you approve adding Cloudflare Workers as the hosting platform to the stack? It changes the runtime from Node to workerd, which constrains future Postgres, S3 and auth libraries.

Options:
- Approve Cloudflare Workers (Nitro cloudflare-module preset + Wrangler)
- Use Cloudflare Pages instead
- Use a Node host (Fly.io, Render) instead

Recommended answer: Approve Cloudflare Workers: it is what the requirement asks for, has first-class TanStack Start/Nitro support, and supports wildcard subdomains later.

Answer:

### What should local `pnpm start` run once the build targets Workers?

Options:
- `wrangler dev` on the Worker build (same runtime as dev)
- Keep a separate Node build for local `pnpm start`; build for Workers only in CI
- Drop `pnpm start`; use only `pnpm dev` locally

Recommended answer: `wrangler dev` on the Worker build: local e2e then runs on the same runtime as dev, so Workers incompatibilities show up before merge.

Answer:

## Topic: ADR 0003: CI/CD on GitHub Actions

### Which checks must pass before a PR can be merged?

Options:
- Unit tests only (pnpm test)
- Unit tests + lint + typecheck + build
- Unit tests + lint + typecheck + build + e2e against a local Worker build

Recommended answer: Unit tests + lint + typecheck + build: cheap, and it stops a merge that would fail to build and deploy. Add e2e later when the suite grows.

Answer:

### Which branches get branch protection with the required check?

Options:
- dev-v2 only
- dev-v2 and main
- dev-v2, main and master

Recommended answer: dev-v2 and main: feature PRs target dev-v2 and main is the future production branch; both must never get untested code.

Answer:

### Should merging into dev-v2 be the deploy trigger for dev (with main reserved for a future production deploy)?

Options:
- Yes, deploy dev on every push to dev-v2
- Deploy dev on every push to main instead
- Deploy dev on both dev-v2 and main

Recommended answer: Yes, deploy dev on every push to dev-v2: that is where PRs are merged per the git-workflow skill, and main stays free for production.

Answer:

## Topic: ADR 0004: Test database for dev is a dedicated Neon branch

### Should the Neon dev branch and the dev Worker's DATABASE_URL be provisioned now, or when the first feature that uses the database is built?

Options:
- Provision now (branch + secret, no DB code)
- Defer the whole dev-test-database feature to the first DB feature

Recommended answer: Provision now: it is small, it meets the stated requirement, and the first DB feature can then start testing on dev straight away.

Answer:

### How should the Worker connect to Neon once DB code exists?

Options:
- @neondatabase/serverless driver (HTTP/WebSocket)
- Cloudflare Hyperdrive in front of Neon with a standard pg driver
- Decide later with the first DB feature

Recommended answer: @neondatabase/serverless driver: it works on Workers with no extra infrastructure; switch to Hyperdrive with a superseding ADR if latency becomes an issue.

Answer:
