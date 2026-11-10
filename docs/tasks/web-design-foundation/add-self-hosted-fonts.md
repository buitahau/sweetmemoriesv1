# Add self-hosted fonts

- Status: not-started

## Goal

Make Fredoka, Caveat and Figtree (mockup weights only) available in `apps/web`, served from the app's own origin.

## Scope

Area: UI (dependencies + one module). Decision: [ADR 0003](../../adr/0003-frontend-styling-and-self-hosted-fonts.md), Fonts row. Weights: [ui/homepage.md, Fonts](../../ui/homepage.md#fonts).

| File | Change |
|---|---|
| `apps/web/package.json`, root `package-lock.json` | Run from the repo root: `npm install @fontsource/fredoka@^5 @fontsource/caveat@^5 @fontsource/figtree@^5 -w apps/web`. They must land in `dependencies` (not `devDependencies`). |
| `apps/web/src/styles/fonts.ts` (new) | Exactly these 8 side-effect imports, in this order, nothing else: `@fontsource/fredoka/500.css`, `@fontsource/fredoka/600.css`, `@fontsource/fredoka/700.css`, `@fontsource/caveat/500.css`, `@fontsource/caveat/700.css`, `@fontsource/figtree/400.css`, `@fontsource/figtree/500.css`, `@fontsource/figtree/600.css`. First line a comment: `// Self-hosted fonts, see docs/adr/0003-frontend-styling-and-self-hosted-fonts.md`. |
| `apps/web/src/main.tsx` | Add `import './styles/fonts.ts'` as the first import after the `react`/`react-dom` imports and before `import './index.css'`. Nothing else changes. |

Do not add fonts to `index.html`, do not add a `<link>` to any font service, do not copy font files into the repo, and do not add Figtree 700 (the mockup renders bold Figtree at 600, see ui/homepage.md).

Prerequisites: none (first task of [web-design-foundation](../../features/web-design-foundation.md)). Design gate: met ([ADR 0003](../../adr/0003-frontend-styling-and-self-hosted-fonts.md) `accepted`, [Q001](../../questions/questions-2026-11-10-requirement-breakdown.md#q001-accept-adr-0003-styling-and-self-hosted-fonts) answered A on 2026-11-10). This task may start now.

Out of scope: tokens and body styles ([add-design-tokens](add-design-tokens.md)), using the fonts in any component, `index.html`.

Security: no third-party requests (groundwork for CLAUDE.md rule 1 and rule 5: visitors' IP addresses are not sent to a font service). Fonts are OFL-1.1, the licence ships inside each package.

## Verification checklist

The task is complete only when every item below passes. Tags name the [web-design-foundation](../../features/web-design-foundation.md) acceptance criterion (ACn).

- [ ] 1. `apps/web/package.json` `dependencies` contains `@fontsource/fredoka`, `@fontsource/caveat`, `@fontsource/figtree`, each with a `^5.` range; none is in `devDependencies`; `package-lock.json` is updated and no other lockfile exists. (AC1)
- [ ] 2. `apps/web/src/styles/fonts.ts` contains exactly the 8 imports listed in Scope (`grep -c "^import '@fontsource/" apps/web/src/styles/fonts.ts` prints 8). (AC1)
- [ ] 3. `src/main.tsx` imports `./styles/fonts.ts` before `./index.css`. (Behavior)
- [ ] 4. After `npm run build -w apps/web`, `apps/web/dist/assets/` has at least 8 `.woff2` files and `grep -rl 'fonts.googleapis\|fonts.gstatic' apps/web/dist apps/web/src apps/web/index.html` prints nothing. (AC1)
- [ ] 5. In the browser at `$BASE_URL/`, loading each of the 8 faces with `document.fonts.load` resolves to a non-empty list, and every `.woff2` request is on the `$BASE_URL` origin. (AC1, AC5)
- [ ] 6. `npm test -w apps/web`, `npm run typecheck -w apps/web` exit 0. (AC6)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. `Spec:`/`Testids:` per [ADR 0004](../../adr/0004-playwright-e2e-specs.md).

```
E2E-1 -> checklist items 1, 2, 3: files and dependencies
Spec: prose (shell commands)
Testids: none
Preconditions: branch checked out, npm install done
Steps:
  1. Run: node -p "const p=require('./apps/web/package.json'); [Object.keys(p.dependencies).filter(k=>k.startsWith('@fontsource/')), Object.keys(p.devDependencies).filter(k=>k.startsWith('@fontsource/'))]"
  2. Run: grep -c "^import '@fontsource/" apps/web/src/styles/fonts.ts
  3. Run: grep -n "import './" apps/web/src/main.tsx
  4. Run: ls apps/web/pnpm-lock.yaml apps/web/package-lock.json 2>&1
Expected: step 1 prints [ [ '@fontsource/caveat', '@fontsource/figtree', '@fontsource/fredoka' ], [] ] (any order in the first list); step 2 prints 8; step 3 shows './styles/fonts.ts' on an earlier line than './index.css'; step 4 prints "No such file" for both
```

```
E2E-2 -> checklist item 4: built output, no font service
Spec: prose (shell and npm commands)
Testids: none
Preconditions: as E2E-1
Steps:
  1. Run: npm run build -w apps/web && ls apps/web/dist/assets/*.woff2 | wc -l
  2. Run: grep -rl 'fonts.googleapis\|fonts.gstatic' apps/web/dist apps/web/src apps/web/index.html; echo "e=$?"
Expected: step 1 prints a number >= 8; step 2 prints only "e=1" (no matches)
```

```
E2E-3 -> checklist item 5: faces load from own origin
Spec: e2e/specs/web-design-foundation/add-self-hosted-fonts.spec.ts
Testids: none
Preconditions: app running at $BASE_URL; DevTools Network open, cache disabled
Steps:
  1. Open $BASE_URL/.
  2. In Console run: (await Promise.all(['500 20px Fredoka','600 20px Fredoka','700 20px Fredoka','500 20px Caveat','700 20px Caveat','400 20px Figtree','500 20px Figtree','600 20px Figtree'].map(f => document.fonts.load(f)))).map(l => l.length)
  3. Filter Network by "woff2" and read the request URLs.
Expected: step 2 prints eight numbers, each >= 1; every woff2 URL starts with $BASE_URL; no other host appears
```

```
E2E-4 -> checklist item 6: tests and types
Spec: prose (npm commands)
Testids: none
Preconditions: npm install done
Steps:
  1. Run: npm test -w apps/web; echo "t=$?"; npm run typecheck -w apps/web; echo "c=$?"
Expected: t=0; c=0
```

## Links

- Feature: [web-design-foundation](../../features/web-design-foundation.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#fonts)
