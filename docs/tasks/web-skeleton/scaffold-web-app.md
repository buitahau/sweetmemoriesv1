# Scaffold web app

- Status: not-started

## Goal

Create the `apps/web` workspace from the Vite `react-ts` template, with all demo content removed, and working `dev`, `build`, `preview`, `test` and `typecheck` scripts. The page content itself comes in the next task.

## Scope

Area: UI tooling. Follow [ADR 0001](../../adr/0001-monorepo-skeleton-and-tooling.md) and [repository-layout](../../architecture/repository-layout.md).

Steps:
1. From the repo root, run exactly: `npm create vite@9.3.4 apps/web -- --template react-ts --no-interactive --no-immediate` (generator version pinned in [ADR 0001](../../adr/0001-monorepo-skeleton-and-tooling.md); do not use `@latest`). `--no-interactive` makes create-vite 9.3.4 ask no questions; `--no-immediate` stops it from installing and starting the dev server. With these flags it uses its default linter, Oxlint, which step 3 removes. The command must finish without any prompt. If it shows a prompt, or the generated `react` dependency is not major version 19, stop and add a question to the session questions file instead of continuing.
   Expected generated files (create-vite 9.3.4 `react-ts`): `README.md`, `.gitignore`, `.oxlintrc.json`, `index.html`, `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `public/favicon.svg`, `public/icons.svg`, `src/App.css`, `src/App.tsx`, `src/index.css`, `src/main.tsx`, `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`.
2. In `apps/web/package.json`: set `"name": "@sweetmemories/web"`, keep `"private": true` and `"type": "module"`. Set `"scripts"` to exactly (this drops the generated `"lint": "oxlint"`):
   `"dev": "vite"`, `"build": "tsc -b && vite build"`, `"preview": "vite preview"`, `"test": "vitest run"`, `"typecheck": "tsc -b"`.
3. Remove linting from the template (ADR 0001: no linting in the skeleton): delete `apps/web/.oxlintrc.json` and the `oxlint` entry from `devDependencies`. If an `eslint.config.js` or any `eslint*`, `@eslint/*`, `typescript-eslint` or `globals` dependency exists, delete it too.
4. Install test tools: `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom -w apps/web`, then `npm install` at the root. Do not create `apps/web/package-lock.json` (root lockfile only).
5. `apps/web/vite.config.ts`: keep the React plugin; add `server: { port: 5173, strictPort: true }`, `preview: { port: 4173, strictPort: true }`, `test: { environment: 'jsdom', setupFiles: './src/test-setup.ts' }`. Add `/// <reference types="vitest/config" />` as the first line so `test` type-checks.
6. Create `apps/web/src/test-setup.ts` with exactly these lines (Vitest globals are off, so Testing Library cannot register its automatic cleanup; this does it explicitly so each test starts with an empty DOM):
   ```ts
   import '@testing-library/jest-dom/vitest'
   import { afterEach } from 'vitest'
   import { cleanup } from '@testing-library/react'

   afterEach(cleanup)
   ```
   Do not set `globals: true`. Every test file imports `describe`, `it` and `expect` from `'vitest'` explicitly.
7. Remove demo content: delete `apps/web/README.md` (generator text with linter setup advice), `src/App.css`, the whole `src/assets/` folder (`hero.png`, `react.svg`, `vite.svg`) and the whole `public/` folder (`favicon.svg`, `icons.svg`). In `index.html` replace the `<link rel="icon" ... href="/favicon.svg" />` line with `<link rel="icon" href="data:," />` (prevents a favicon request). Leave the generated `<title>` as is; [add-home-page](add-home-page.md) changes it.
8. Replace `src/index.css` with exactly: `body { margin: 0; font-family: system-ui, sans-serif; }` and `main { padding: 1rem; }`.
9. Replace `src/App.tsx` with a component that renders `<main></main>` (no imports of CSS, images or `useState`).
10. Create `src/App.test.tsx`: imports `describe`, `it`, `expect` from `'vitest'`; test named `renders the main landmark` that renders `<App />` and expects `screen.getByRole('main')` to be in the document.

TypeScript: keep the template's own `tsconfig*.json` files (already `strict`); `apps/web` does not extend the root `tsconfig.base.json`.

Prerequisites:
- Design gate: [Q001](../../questions/questions-2026-11-08-requirement-breakdown.md#q001-does-this-requirement-approve-writing-skeleton-code-during-the-design-phase) answered "Yes", [ADR 0001](../../adr/0001-monorepo-skeleton-and-tooling.md) Status `accepted`, `CLAUDE.md` "Project state" updated by a human. Otherwise do not start.
- Tasks (must be `done`): [create-root-workspace](../project-workspace/create-root-workspace.md).

Out of scope: the heading text, tab title and `lang` (next task [add-home-page](add-home-page.md)), routing, calling the API, dev proxy, fonts, images, analytics, root scripts.

Security: no third-party requests, scripts or fonts on the page; no cookies (groundwork for CLAUDE.md security rule 1).

## Verification checklist

The task is complete only when every item below passes. Tags name the [web-skeleton](../../features/web-skeleton.md) acceptance criterion (ACn) or requirement each item proves.

- [ ] 1. `apps/web/package.json` has name `@sweetmemories/web` and the five scripts exactly as in Scope step 2 (no `lint` script). (AC5)
- [ ] 2. No `.oxlintrc.json` and no `eslint.config.js` in `apps/web`, and `apps/web/package.json` has no dependency whose name contains `oxlint` or `eslint` and no `globals` dependency. (ADR 0001: no linting)
- [ ] 3. Only one `package-lock.json` exists, at the repo root. (ADR 0001: root lockfile only)
- [ ] 4. `apps/web/README.md`, `apps/web/src/App.css`, `apps/web/src/assets/` and `apps/web/public/` do not exist; `grep -rn -i -E 'react\.svg|vite\.svg|hero\.png|icons\.svg|favicon\.svg|useState|setCount|count is|Edit src/App|Get started' apps/web/src apps/web/index.html` prints nothing. (AC4; ADR 0001: no linting advice left)
- [ ] 5. `apps/web/index.html` has `<link rel="icon" href="data:," />`. (AC3, AC6: no favicon request, no 404 in the console)
- [ ] 6. `npm test -w apps/web` exits 0 and runs `renders the main landmark`. (AC5)
- [ ] 7. `npm run typecheck -w apps/web` exits 0. (AC5)
- [ ] 8. `npm run build -w apps/web` exits 0 and creates `apps/web/dist/index.html`. (AC5)
- [ ] 9. `npm run dev -w apps/web` serves `http://localhost:5173/` (HTTP 200, HTML contains `<div id="root">`); if port 5173 is taken, it exits with an error instead of picking another port. (AC5)
- [ ] 10. `npm run preview -w apps/web` (after build) serves `http://localhost:4173/` with HTTP 200. (AC5)
- [ ] 11. `apps/web/src/test-setup.ts` matches Scope step 6 (contains `afterEach(cleanup)`), `apps/web/vite.config.ts` does not contain `globals`, and `apps/web/package.json` `react` dependency is major version 19. (ADR 0001: test runner, React 19)
- [ ] 12. The step 1 command finished without showing any prompt (the implementer records the exact command in `docs/tasks/web-skeleton/scaffold-web-app.md` notes). (ADR 0001: pinned generator)

## e2e-test-suites

Type: FE (tooling). Steps run in a terminal at the repo root and a browser.

```
E2E-1 -> checklist items 1, 2, 3: package setup
Preconditions: task branch checked out, npm install done
Steps:
  1. Run: node -e "const p=require('./apps/web/package.json');console.log(p.name,JSON.stringify(p.scripts))"
  2. Run: ls apps/web/.oxlintrc.json apps/web/eslint.config.js; grep -n -E 'oxlint|eslint|"globals"' apps/web/package.json
  3. Run: find . -name package-lock.json -not -path "*/node_modules/*"
Expected: step 1 prints @sweetmemories/web and the five scripts from Scope, no "lint"; step 2 prints "No such file" for both files and no grep lines; step 3 prints only ./package-lock.json
```

```
E2E-2 -> checklist items 4, 5: demo content and generator README removed
Preconditions: task branch checked out
Steps:
  1. Run: ls apps/web/README.md apps/web/public apps/web/src/assets apps/web/src/App.css; ls apps/web/src
  2. Run: grep -rn -i -E 'react\.svg|vite\.svg|hero\.png|icons\.svg|favicon\.svg|useState|setCount|count is|Edit src/App|Get started' apps/web/src apps/web/index.html
  3. Run: grep -n 'rel="icon"' apps/web/index.html
Expected: step 1 prints "No such file" for README.md, public, src/assets and src/App.css, and the src listing shows only App.tsx, App.test.tsx, index.css, main.tsx, test-setup.ts; step 2 prints nothing; step 3 prints only the data:, icon link
```

```
E2E-7 -> checklist item 12: generator ran without prompts
Preconditions: scratch folder outside the repo (e.g. $SCRATCH), Node 24
Steps:
  1. Run: cd "$SCRATCH" && npm create vite@9.3.4 probe -- --template react-ts --no-interactive --no-immediate < /dev/null; echo "exit=$?"
  2. Run: ls probe
  3. Delete "$SCRATCH/probe".
Expected: step 1 exits 0 without waiting for input and prints a "Done" message; step 2 lists the files named in Scope step 1 (README.md, index.html, package.json, src, public, tsconfig*.json, vite.config.ts) and no node_modules
```

```
E2E-3 -> checklist items 6, 7, 8: test, typecheck, build
Preconditions: npm install done
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose
  2. Run: npm run typecheck -w apps/web
  3. Run: npm run build -w apps/web; ls apps/web/dist/index.html
Expected: step 1 exits 0 and lists "renders the main landmark" as passed; step 2 exits 0; step 3 exits 0 and lists the file
```

```
E2E-4 -> checklist item 9: dev server and strict port
Preconditions: port 5173 free
Steps:
  1. Run npm run dev -w apps/web; open http://localhost:5173/ in a browser; view page source.
  2. In a second terminal run npm run dev -w apps/web again.
Expected: step 1 page loads (blank, no errors in console) and source contains <div id="root">; step 2 exits with an error saying port 5173 is in use
```

```
E2E-5 -> checklist item 10: preview
Preconditions: step 3 of E2E-3 done; port 4173 free
Steps:
  1. Run npm run preview -w apps/web; open http://localhost:4173/.
Expected: page loads with HTTP 200 (DevTools Network shows 200 for the document)
```

```
E2E-6 -> checklist item 11: test cleanup and versions
Preconditions: task branch checked out
Steps:
  1. Run: grep -c 'afterEach(cleanup)' apps/web/src/test-setup.ts
  2. Run: grep -c 'globals' apps/web/vite.config.ts
  3. Run: node -e "console.log(require('./apps/web/package.json').dependencies.react)"
Expected: step 1 prints 1; step 2 prints 0; step 3 prints a range starting with ^19
```

## Links

- Feature: [web-skeleton](../../features/web-skeleton.md)
- ADR: [0001-monorepo-skeleton-and-tooling](../../adr/0001-monorepo-skeleton-and-tooling.md)
- Next: [add-home-page](add-home-page.md)
