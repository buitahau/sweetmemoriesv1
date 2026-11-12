# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

TanStack Start skeleton is in place: `GET /api/health` and the home page `/`. No auth, database or S3 yet. Full setup guide: `docs/infra/local-development.md`.

Commands (pnpm, Node 24):

- `pnpm install`: install dependencies.
- `pnpm dev`: dev server at http://localhost:3000.
- `pnpm build` then `pnpm start`: production build and run.
- `pnpm lint`, `pnpm typecheck`, `pnpm format`.
- `pnpm test`: all unit tests (Vitest). Single test: `pnpm test src/server/health.test.ts` (one file) or `pnpm test -t "test name"` (by name).
- E2E (Python Playwright + pytest): see `e2e/README.md`; single test with `-k "test_name"`.

## Project

SweetMemories lets people turn memories (a person, an event, a first day) into small public web pages.

Each user gets a subdomain:

- `john.sweetmemories.com` is the user's home page.
- `john.sweetmemories.com/alice` is a memory page.

**Flow:** sign in with Google → choose a template → add photos and text → publish.

Memories are fully public. Only an admin reviews templates before they go live.

## Stack

- TanStack Start for both front-end and backend
- Tailwind CSS + shadcn/ui
- Neon/Postgres (database)
- S3 (photo storage)
- Better Auth with Google sign-in

Ask before making architecture changes that contradict this stack.

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
- Keep changes small and focused.

## Architecture and rules

Read these at the start of every session; they are the source of truth:

- @docs/architecture/ARCHITECTURE.md
- @docs/architecture/RULES.md

## Docs

All project documents live under `docs/` (`adr`, `api`, `architecture`, `features`, `infra`, `decisions`, `tasks`, `ui`). Before creating, moving or updating any document there, load the `docs-placement` skill. It says which folder and file name to use. Each folder also has a `README.md`.

If a document fits no folder, ask instead of inventing one.
