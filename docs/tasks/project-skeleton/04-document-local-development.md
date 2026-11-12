# 04 Document local development and commands

**Status:** done
**Side:** backend
**Size:** S
**Dependencies:** 01, 02, 03
**Feature spec:** [project-skeleton](../../features/project-skeleton.md)
**Mockup:** none

## What to change

Add `docs/infra/local-development.md` (prerequisites, Node version, install, run dev, build, start, lint, test, run a single test, health check URL). Update the **Status** section of `CLAUDE.md` with the build/lint/test commands, including how to run a single test. Keep the feature spec, these task files and `docs/features/Progress.md` in sync. Load the `docs-placement` skill before editing `docs/`.

## Checklist

- [x] `docs/infra/local-development.md`
- [x] `CLAUDE.md` Status section updated
- [x] `Progress.md` in sync

## Verification

- [x] Following only `docs/infra/local-development.md` on a clean clone gets the dev server running, "SweetMemories home page" at `/` and `{"status":"ok"}` at `/api/health`.
- [x] The single-test command in `CLAUDE.md` runs just the named test.
- [x] `Progress.md` lists `project-skeleton` with links to spec and tasks, and its status matches the task statuses.
