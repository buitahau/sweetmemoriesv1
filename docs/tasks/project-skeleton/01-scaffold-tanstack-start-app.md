# 01 Scaffold the TanStack Start app

**Status:** done
**Side:** backend
**Size:** M
**Dependencies:** none (needs [ADR 0001](../../adr/0001-single-tanstack-start-app.md) accepted and the package-manager answer in [decisions](../../decisions/0001-single-tanstack-start-app.md))
**Feature spec:** [project-skeleton](../../features/project-skeleton.md)
**Mockup:** none

## What to change

Repo root. Create the TanStack Start app (TypeScript, strict mode) with Tailwind CSS configured, shadcn/ui initialised (config and utils only, no components), Vitest set up with one trivial passing test, ESLint and Prettier (or the scaffold's default linter), `.gitignore`, `.env.example` (empty or comment only), and package scripts `dev`, `build`, `start`, `lint`, `test`. Root layout route with `<html lang="en">` and a default not-found component ("Page not found", status 404). Do not add Better Auth, Neon, S3 or subdomain code.

## Checklist

- [ ] TanStack Start app, TypeScript strict
- [ ] Tailwind CSS configured
- [ ] shadcn/ui initialised (no components)
- [ ] Vitest with one trivial passing test
- [ ] Linter and formatter
- [ ] `.gitignore`, `.env.example`
- [ ] Scripts: dev, build, start, lint, test
- [ ] Root layout and 404 not-found component

## Verification

- [ ] From a clean clone: install, then `lint`, `test` and `build` all exit 0.
- [ ] `dev` starts the server and the default route responds in the browser.
- [ ] `/does-not-exist` returns 404 with "Page not found" (US-skeleton-2 scenario 6).
- [ ] `git status` shows no committed `.env`, `node_modules` or build output.
- [ ] Dependencies contain no auth, database or S3 packages.
