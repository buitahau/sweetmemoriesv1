# 0001: Monorepo skeleton and tooling

- Status: proposed (awaiting product-owner confirmation, see [Q001, Q002](../questions/questions-2026-11-08-requirement-breakdown.md))
- Date: 2026-11-08

## Context

- The product owner asked to "initialize project including backend and frontend. Only generate the skeleton: with BE, a health check API. With FE, a simple home page showing the text 'SweetMemories home page'."
- The stack is fixed in `CLAUDE.md`: React (frontend), Node (backend), Neon/Postgres, S3, Better Auth (Google). Only React and Node are needed for the skeleton.
- No application code, repository layout or commands exist yet (`README.md` "Repository layout: not yet established"; `CLAUDE.md` "Commands: none yet").
- `CLAUDE.md` "Project state" says a parked backend draft exists and must stay untouched; its location is unknown ([Q003](../questions/questions-2026-11-08-requirement-breakdown.md)). Assumption: it is not under `apps/`.
- `CLAUDE.md` security rule 1 requires public Memory pages to be served later from a separate origin without login cookies. The layout must leave room for that, but the skeleton does not build it.
- Juniors must be able to implement each task without making tooling choices, so every tool and version line is decided here.

## Decision

| Concern | Choice |
|---|---|
| Repository shape | One repository, npm workspaces. Apps live in `apps/<name>/`. |
| Apps in the skeleton | `apps/api` (Node backend), `apps/web` (React frontend). A future `apps/public` (cookie-less Memory page server) gets its own folder later. |
| Package manager | npm (ships with Node; no extra tool). Lockfile `package-lock.json` at the root only. |
| Node version | Node 24 (Maintenance LTS since 2026-10-20, end of life 2028-04-30, per the [Node.js release schedule](https://github.com/nodejs/Release/blob/main/schedule.json), checked 2026-11-08). Root `.nvmrc` contains `24`; root `package.json` `engines.node` is `>=24`. Why not the Active LTS (Node 26): the pinned Vite template itself targets Node 24 (`@types/node` ^24), and 24 gets security fixes for 17 more months, well past the skeleton and first features. Switching to 26 is open as [Q008](../questions/questions-2026-11-08-requirement-breakdown.md#q008-node-24-maintenance-lts-or-node-26-active-lts). |
| Language | TypeScript, `strict: true`. `apps/api` extends the root `tsconfig.base.json`; `apps/web` keeps the Vite template's own (strict) tsconfig files. |
| Module format | ES modules (`"type": "module"`). API uses `"module": "NodeNext"` (relative imports end in `.js`). |
| Backend framework | Express 5. `src/app.ts` exports `createApp()`; `src/server.ts` calls `listen`. |
| Backend dev runner | `tsx watch src/server.ts`; build with `tsc` to `dist/`; start with `node dist/server.js`. |
| Frontend tooling | Vite with the `react-ts` template, generator pinned: `npm create vite@9.3.4 ... --no-interactive --no-immediate`. Verified 2026-11-08: `https://registry.npmjs.org/create-vite/latest` returned version `9.3.4` (same as `npm view create-vite version`). The 9.3.4 `react-ts` template generates React ^19.3, Vite ^8, TypeScript ~7.0 and Oxlint as its default linter (removed, see Linting). React 19. Change the pin only by editing this row. |
| Dependency versions | Major versions fixed here (Express 5, React 19); exact versions come from the committed root `package-lock.json`. |
| Test runner | Vitest in both apps, globals off (tests import from `'vitest'`). API: `supertest`; `typecheck` also checks `test/`. Web: `@testing-library/react` + `jsdom`, cleanup registered in `src/test-setup.ts`. |
| Ports (local) | API `3000` (env `PORT`), web dev `5173`, web preview `4173`. Workers runtime ports `8787` (api) and `8788` (web) are added by [ADR 0002](0002-ci-cd-and-dev-environment-on-cloudflare.md). |
| Root scripts | `dev` (both apps at once via `concurrently`), `build`, `test`, `typecheck` (each runs in every workspace). |
| Linting | Not in the skeleton (type-checking only). The generated Oxlint config, dependency and `lint` script are removed. Added later by its own ADR. |
| Package names | root `sweetmemories` (private), `@sweetmemories/api`, `@sweetmemories/web`. |
| Health check | `GET /api/health` returns `200 {"status":"ok"}`, liveness only, no DB call. See [api/health.md](../api/health.md). |
| Cookies | Neither app sets cookies in the skeleton. |

Details: [architecture/repository-layout.md](../architecture/repository-layout.md), [infra/local-development.md](../infra/local-development.md).

## Consequences

- One `npm install` at the root installs both apps; one command (`npm run dev`) starts both.
- Same language and test runner on both sides keeps tasks junior-friendly.
- Separate `apps/` folders keep the future cookie-less public page server (security rule 1) a separate deployable with its own origin.
- Express 5 has an official Better Auth integration, so auth can be added later without changing frameworks.
- No CI, deployment, database, S3 or auth in this step. The `implement-ticket` flow (CI + deploy to dev) cannot run end to end until CI/deploy exists ([Q005](../questions/questions-2026-11-08-requirement-breakdown.md)). CI and the dev deploy are designed in [ADR 0002](0002-ci-cd-and-dev-environment-on-cloudflare.md); it adds deploy files to `apps/api` and `apps/web` but changes no choice in this ADR.
- `CLAUDE.md` ("Project state", "Commands") must be updated by a human once this is approved ([Q001](../questions/questions-2026-11-08-requirement-breakdown.md)).

## Alternatives

| Option | Why not chosen |
|---|---|
| Two separate repositories (api, web) | Two sets of tooling and PRs for one small team; harder to keep in sync. |
| pnpm / Turborepo / Nx | Extra tool to learn; npm workspaces are enough for two apps. Revisit when builds get slow. |
| Plain JavaScript | Faster start, but domain types (User, Memory, Template, Block, Photo) benefit from TypeScript early. |
| Fastify or Hono instead of Express | Both fine; Express is the most familiar for juniors and has Better Auth support. |
| Next.js (one full-stack app) | Mixes app and public pages in one origin by default; works against security rule 1 and the chosen "React + Node" split. |
| Node 26 | Active LTS since 2026-10-28, end of life 2029-04-30: one more year of support. Not chosen by default because the pinned Vite template and its types target Node 24, and Node 24 is supported until 2028-04-30. Open as [Q008](../questions/questions-2026-11-08-requirement-breakdown.md#q008-node-24-maintenance-lts-or-node-26-active-lts). Change by editing `.nvmrc`, `engines` and this ADR. |

## Features

- [project-workspace](../features/project-workspace.md): root npm workspace, root scripts, documented commands.
- [api-skeleton](../features/api-skeleton.md): Node/Express API app with `GET /api/health`.
- [web-skeleton](../features/web-skeleton.md): React/Vite app with a home page showing "SweetMemories home page".
