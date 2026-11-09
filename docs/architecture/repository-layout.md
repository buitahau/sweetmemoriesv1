# Repository layout

Planned layout for the skeleton, decided in [ADR 0001](../adr/0001-monorepo-skeleton-and-tooling.md). Status: proposed, not built yet.

## Overview

One repository, npm workspaces, one folder per deployable app under `apps/`.

Files we write by hand are listed below. Files the Vite generator (`create-vite` 9.3.4) creates and we keep unchanged (`tsconfig.app.json`, `tsconfig.node.json`, `.gitignore` inside `apps/web`) are not listed. Generated files we delete: `apps/web/README.md`, `apps/web/.oxlintrc.json`, `apps/web/public/`, `apps/web/src/assets/`, `apps/web/src/App.css`. Exact contents are in the tasks.

```
/                          repository root
  package.json             private, "type": "module", "workspaces": ["apps/*"], root scripts
  package-lock.json        the only lockfile
  tsconfig.base.json       shared strict TypeScript settings (used by apps/api)
  .nvmrc                   24
  .gitignore               see create-root-workspace task for the exact lines
  apps/
    api/                   @sweetmemories/api  (Node, Express 5)
      package.json
      tsconfig.json        build config, extends ../../tsconfig.base.json
      tsconfig.test.json   typecheck config, includes src and test
      src/config.ts        parsePort(): validates PORT
      src/app.ts           createApp(): builds the Express app (no listen)
      src/server.ts        reads PORT, calls listen
      src/routes/health.ts GET /api/health
      test/config.test.ts  Vitest
      test/app.test.ts     Vitest + supertest
      test/health.test.ts  Vitest + supertest
    web/                   @sweetmemories/web  (React 19, Vite)
      package.json
      index.html
      tsconfig.json        from the Vite template (strict)
      vite.config.ts
      src/main.tsx
      src/index.css        minimal base styles
      src/App.tsx          home page
      src/App.test.tsx     Vitest + Testing Library
      src/test-setup.ts    jest-dom matchers + cleanup after each test
  docs/                    documentation
```

### Added by ADR 0002 (CI/CD, dev deploy)

Planned in [ADR 0002](../adr/0002-ci-cd-and-dev-environment-on-cloudflare.md), not built yet.

```
/
  .github/workflows/
    ci.yml                 CI / verify on every PR            (add-ci-workflow)
    deploy-dev.yml         Deploy dev on push to dev-v1       (add-deploy-dev-workflow, add-dev-smoke-script)
  scripts/
    wait-for-dev-deploy.sh waits until dev runs a commit      (add-wait-for-deploy-script)
    smoke-dev.sh           post-deploy smoke checks           (add-dev-smoke-script)
  .gitignore               + .wrangler/
  apps/
    api/
      wrangler.jsonc       Worker sweetmemories-api-dev       (add-api-worker)
      src/worker.ts        Workers entry, wraps createApp()   (add-api-worker)
      src/cloudflare-node.d.ts  types for 'cloudflare:node'   (add-api-worker)
      src/routes/version.ts     GET /api/version              (add-version-endpoint)
      test/version.test.ts                                    (add-version-endpoint)
    web/
      wrangler.jsonc       Worker sweetmemories-web-dev, assets only (add-web-worker)
```

`apps/web/dist/version.json` and `apps/web/dist/_headers` are written by the deploy workflow and never committed.

Task sources: [create-root-workspace](../tasks/project-workspace/create-root-workspace.md), [scaffold-api-app](../tasks/api-skeleton/scaffold-api-app.md), [add-health-endpoint](../tasks/api-skeleton/add-health-endpoint.md), [scaffold-web-app](../tasks/web-skeleton/scaffold-web-app.md), [add-home-page](../tasks/web-skeleton/add-home-page.md).

## Boundaries

- `apps/api` and `apps/web` do not import from each other.
- No shared package yet; add `packages/<name>` only when real shared code exists.
- Future: `apps/public` will serve published Memory pages on a separate origin without login cookies (`CLAUDE.md` security rule 1). Not part of the skeleton.
- The parked backend draft is not moved into `apps/api` and is not edited.
