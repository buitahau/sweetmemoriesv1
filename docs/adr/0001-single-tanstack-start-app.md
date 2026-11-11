# ADR 0001: Single TanStack Start app as the project scaffold

## Status

proposed

Open questions: [../decisions/0001-single-tanstack-start-app.md](../decisions/0001-single-tanstack-start-app.md)

## Context

The repo is empty. We need one layout that hosts the app, admin and public memory pages and their APIs. Security rule 1 says public memory pages must later be served from a separate cookie-free origin, so the layout we pick now must not make that hard. The choice affects the folder structure, scripts, CI and how later features are added.

Options:

1. **One TanStack Start app at the repo root, with file-based routes and server routes for the API.** Simplest and matches the stack. The three surfaces (app, admin, public) are separated later by host-based routing and cookie configuration inside one deployable. Trade-off: the origin split is enforced in code and config, not by separate deployables.
2. **A monorepo (workspaces) with separate apps for app/admin and public pages from day one.** Strongest physical isolation for the cookie-free origin. Trade-off: more tooling, duplicated config, premature for a skeleton with two routes.
3. **A separate backend service plus a TanStack Start front-end.** Contradicts the stack ("TanStack Start for both front-end and backend") and would need explicit approval. Not recommended.

## Decision

Option 1. Use a single TanStack Start app at the repo root, with Tailwind CSS and shadcn/ui initialised, Vitest for unit tests, and the API under `/api/*` server routes. The cookie-free public origin gets its own ADR when subdomain routing is designed. If it needs a separate deployable, that ADR supersedes this one.

## Consequences

- Easier: fast start, one install, one dev server, one deploy, and the default TanStack Start conventions that the project skills (`tanstack-start-best-practices`) assume.
- Harder: the separate cookie scope for public memory pages must be enforced through host-based routing and cookie domain config later, not through a separate build. That future ADR must be explicit and tested.

Related: [feature spec](../features/project-skeleton.md)
