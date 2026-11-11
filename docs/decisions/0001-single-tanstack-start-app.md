# Open questions: ADR 0001 Single TanStack Start app

ADR: [0001-single-tanstack-start-app](../adr/0001-single-tanstack-start-app.md)

## Topic: ADR 0001: Single TanStack Start app as the project scaffold

### Which package manager should the project use?

Options:
- pnpm
- npm
- bun

Recommended answer: pnpm: fast, strict dependency resolution, widely supported by TanStack Start and CI.

Answer: pnpm

### Do you approve a single TanStack Start app at the repo root (no monorepo), with the cookie-free public origin handled by a later subdomain-routing ADR?

Options:
- Yes, single app now; decide origin split later
- No, start with a monorepo separating app/admin and public pages

Recommended answer: Yes, single app now: simplest option that matches the stack; a later ADR can supersede it if public pages need a separate deployable.

Answer: Yes, single app now; decide origin split later