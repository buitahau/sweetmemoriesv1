# Feature: project-skeleton

**Status:** todo
**Side:** both
- backend: project scaffold, scripts and the `GET /api/health` server route.
- front-end: the root layout and the home page route `/` with the text "SweetMemories home page".

Tasks: [../tasks/project-skeleton/](../tasks/project-skeleton/) (01 to 04). ADR: [0001](../adr/0001-single-tanstack-start-app.md). Open questions: [../decisions/project-skeleton.md](../decisions/project-skeleton.md). Mockups: none.

## Goal

A runnable TanStack Start app that exposes a health check API and a home page showing "SweetMemories home page".

## Summary and assumptions

The skeleton ships exactly two things: `GET /api/health` (pollable by monitoring and deploys) and a home page at `/`. It has no auth, database, S3, subdomains, Users, Memories, Templates, Blocks or Photos.

- "Home page" is the product home page on the main domain (`sweetmemories.com`, locally `localhost`), not a User's subdomain home page (a later feature).
- The health check is liveness only. It does not check Neon or S3.
- Path `/api/health`, returns JSON `{"status":"ok"}`.
- Stack per `CLAUDE.md`. shadcn/ui is initialised (config only, no components). Better Auth, Neon and S3 are not added.
- Unit tests use Vitest. E2E tests follow the `e2e-from-user-stories` skill (Playwright, Python, `e2e/project-skeleton/`).

## Scope

In scope: the scaffold, the health route, the home page, a not-found page for unknown paths, local dev docs, build/lint/test commands in `CLAUDE.md`.
Out of scope: Google sign-in, database, S3, subdomains, Memory pages, the wizard, the admin, styling beyond Tailwind defaults.

## User stories

### US-skeleton-1: Health check

**Story:** As an operator (deploy pipeline or uptime monitor), I want a health check endpoint, so that I can tell whether the SweetMemories server is up.

Scenarios:
1. *Happy path*: **Given** the app server is running, **When** a client sends `GET /api/health` with no cookies, **Then** the response status is `200`, the `Content-Type` is `application/json`, and the body is exactly `{"status":"ok"}`.
2. *Not cached*: **Given** the app server is running, **When** a client sends `GET /api/health`, **Then** the response has a `Cache-Control` header containing `no-store`.
3. *Security, no cookies*: **Given** the app server is running, **When** a client sends `GET /api/health`, **Then** the response has no `Set-Cookie` header.
4. *Security, no internal data*: **Given** the app server is running, **When** a client sends `GET /api/health`, **Then** the body contains no environment variables, secrets, hostnames, stack traces or version strings, only the `status` field.
5. *Wrong method*: **Given** the app server is running, **When** a client sends `POST /api/health`, **Then** the response status is `405` and the body does not contain `{"status":"ok"}`.
6. *Server down (failure)*: **Given** the app server is stopped, **When** a client sends `GET /api/health`, **Then** the request fails to connect (no `200` response), so a monitor reports the server as down.

### US-skeleton-2: Home page

**Story:** As a visitor, I want to open the SweetMemories home page, so that I can see the site is live.

Scenarios:
1. *Happy path*: **Given** the app server is running, **When** a visitor opens `/` in a browser with no cookies, **Then** the page loads with status `200` and shows a top-level heading with the text "SweetMemories home page".
2. *Page title*: **Given** the app server is running, **When** a visitor opens `/`, **Then** the browser tab title contains "SweetMemories".
3. *Server-rendered*: **Given** the app server is running, **When** a client fetches `/` without running JavaScript (plain HTTP GET), **Then** the returned HTML contains the text "SweetMemories home page".
4. *Security, no cookies*: **Given** the app server is running, **When** a visitor opens `/` with no cookies, **Then** the response sets no cookies and the browser holds no cookies for the site afterwards.
5. *No errors*: **Given** the app server is running, **When** a visitor opens `/`, **Then** the browser console shows no errors.
6. *Unknown path (edge)*: **Given** the app server is running, **When** a visitor opens `/does-not-exist`, **Then** the response status is `404`, a "Page not found" message is shown, and the text "SweetMemories home page" is not shown as the main heading.

## Acceptance criteria

- `GET /api/health` returns `200`, `application/json`, body `{"status":"ok"}`, `Cache-Control: no-store`, and no `Set-Cookie`.
- `POST /api/health` returns `405`.
- The health response exposes no secrets, environment details, versions or stack traces.
- `/` returns `200`, is server-rendered, shows the heading "SweetMemories home page", has a title containing "SweetMemories", sets no cookies and logs no console errors.
- Unknown paths return `404` with a "Page not found" message.
- `install`, `dev`, `build`, `start`, `lint`, `test` (and running a single test) work from a clean clone and are documented in `CLAUDE.md` and `docs/infra/local-development.md`.
- No auth, database, S3 or subdomain code is added.

## Risks and security notes

- **Cookies (rule 1):** no cookies on `/` or `/api/health`. This is the baseline the e2e tests assert. The cookie-free public origin needs its own ADR (subdomain routing) before any Memory page or sign-in is built.
- **Information leakage (rule 5 spirit):** the health check returns only `{"status":"ok"}`.
- **Secrets:** ship `.env.example` only, gitignore `.env`.
- **Scope creep:** no Better Auth, Neon, S3 or subdomain routing while scaffolding; each needs its own feature (and ADR).
- Rules 2, 3, 4 and 6 are not touched by this skeleton.
- **Terminology:** keep the product home page and a User's subdomain home page separate in copy and routes.
