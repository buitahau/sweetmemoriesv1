# CLAUDE.md

Guidance for Claude Code when working in this repository. See `README.md` for the product overview and screen list.

## Project state

Skeleton approved ([ADR 0001](docs/adr/0001-monorepo-skeleton-and-tooling.md)) and CI/CD plus dev environment approved ([ADR 0002](docs/adr/0002-ci-cd-and-dev-environment-on-cloudflare.md)). **Domain code (users, memories, templates, blocks, photos, auth, database) still waits for design approval; do not write or restore it.** A parked backend draft exists; leave it untouched.

## Stack

React (frontend), Node (backend), Neon/Postgres (database), S3 (photo storage), Better Auth with Google sign-in (auth).

## Domain model

- **User**: signs in with Google; owns a subdomain (`john.sweetmemories.com`).
- **Memory**: a public page at `<subdomain>/<slug>`; created from a template via the wizard; has draft and published states.
- **Template**: a set of blocks plus a wrapper (classes, CSS, script). Admin-authored. Must pass admin review before users can use it.
- **Block**: a unit of content. Built-in types: Text, Timeline, Gallery, Carousel, 3×3 Photo Grid. Custom blocks define fields, markup, style and script. Every block may carry extra classes, CSS and a script.
- **Photo**: uploaded to S3 and picked through the photo picker.

Use these terms consistently in code, schema and UI copy.

## Security rules (non-negotiable)

Templates and custom blocks run admin-authored CSS/JS on public pages, so:

1. Public memory pages are served **without login cookies** (separate origin/cookie scope from the app and admin).
2. Each block's CSS is **scoped** to that block.
3. Block and template scripts are **checked** before acceptance.
4. Templates go through the **review queue** before going live; never bypass it.
5. Memories are public by design, so never put private user data in memory page output.
6. Validate and sanitize slugs (reserved words, uniqueness per user) and uploads (type, size).

## Conventions

- Wizard steps always provide Back, Next and Save; Publish appears only on the last step of a draft.
- Keep the admin template builder split into three pages (details, wrapper, blocks), one open section at a time.
- Keep changes small and focused; ask before making architecture changes that contradict the chosen stack.

## Documentation

All docs live in `docs/` (architecture, api, infra, adr, features, tasks, ui, questions). Use the `writing-docs` skill when writing them. Before implementing a feature or task, read any `docs/questions/questions-*.md` for answered questions; when blocked, append a question to the session's single questions file `docs/questions/questions-<YYYY-MM-DD>-<topic>.md` (one file per session across all features, deleted once all its questions are answered and applied) instead of guessing.

## Commands

Run from the repo root (Node 24, see `.nvmrc`). Details: `docs/infra/local-development.md`. These work once the skeleton tasks are done.

| Command | Does |
|---|---|
| `npm install` | Install all workspaces. |
| `npm run dev` | Start API (`http://localhost:3000`) and web (`http://localhost:5173`). |
| `npm run build` | Build every workspace. |
| `npm test` | Run Vitest once in every workspace. |
| `npm run typecheck` | Type-check every workspace. |
| `npm start -w apps/api` | Run the built API. |

CI and dev deploy: `docs/infra/ci-cd.md`, `docs/infra/dev-environment.md`.
