# Web skeleton

- Status: done

## Summary

A minimal React frontend (`apps/web`, Vite, TypeScript) whose only page shows the heading "SweetMemories home page". It proves the frontend toolchain (dev, build, preview, test) works before real screens from the mockups are built. Decided in [ADR 0001](../adr/0001-monorepo-skeleton-and-tooling.md).

## User story

As a developer or product owner, I want to open the web app in a browser and see "SweetMemories home page", so that I know the frontend builds and serves correctly.

Acceptance criteria:
1. Opening `http://localhost:5173/` shows exactly one visible heading (`<h1>`) with the text `SweetMemories home page` and no other visible text.
2. The browser tab title is `SweetMemories` and `<html lang="en">` is set.
3. The page sets no cookies and makes no network request to another origin.
4. No Vite/React demo content remains (logos, counter button, "Edit src/App.tsx" text).
5. `dev`, `build`, `preview`, `test` and `typecheck` scripts work inside `apps/web`; the built page (`preview`) shows the same heading.
6. The page loads with no errors in the browser console.

## Behavior

- `src/App.tsx` renders `<main><h1>SweetMemories home page</h1></main>`.
- Any path served by the dev or preview server (e.g. `/anything`) shows the same page (Vite SPA fallback). No router yet.
- Text is plain, readable at 320 px width without horizontal scrolling; default browser styles plus at most a minimal `index.css` (no external fonts or CSS frameworks).
- Which "home page" this is: the product root page (future `sweetmemories.com` Homepage), not a User subdomain home ([Q006](../questions/questions-2026-11-08-requirement-breakdown.md)).

## Out of scope

- Real Homepage design from the mockups, routing, sign-in, dashboard, wizard, template builder.
- Calling the API (including health) from the page; dev proxy to the API.
- Analytics, fonts, images, favicons beyond what the cleanup leaves.

## Verification checklist

The feature is complete only when every item below passes.

- [x] 1. Both tasks of this feature have Status `done`. (all ACs)
- [x] 2. At `http://localhost:5173/` the page shows one `<h1>` with text exactly `SweetMemories home page` and no other visible text. (AC1)
- [x] 3. The tab title is `SweetMemories`; `document.documentElement.lang` is `en`. (AC2)
- [x] 4. DevTools Application > Cookies for `http://localhost:5173` is empty after load; the Network tab shows only requests to `localhost:5173`. (AC3; CLAUDE.md security rule 1 groundwork: no cookies, rule 5: no private data in output)
- [x] 5. `apps/web/README.md`, `apps/web/public/`, `apps/web/src/assets/` and `apps/web/src/App.css` do not exist, and `grep -rn -i -E 'react\.svg|vite\.svg|hero\.png|icons\.svg|favicon\.svg|useState|setCount|count is|Edit src/App|Get started' apps/web/src apps/web/index.html` prints nothing. (AC4)
- [x] 6. In `apps/web`: `npm run build` creates `dist/index.html`; `npm run preview` serves it at `http://localhost:4173/` with the same heading; `npm test` and `npm run typecheck` exit 0. (AC5)
- [x] 7. The browser console shows no errors or warnings on load in dev and preview. (AC6)
- [x] 8. `http://localhost:5173/anything` shows the same heading. (Behavior: SPA fallback)
- [x] 9. At 320 px viewport width the heading is fully visible and the page has no horizontal scrollbar. (Behavior: accessibility)

## e2e-test-suites

Type: FE. Start with `npm run dev -w apps/web` (dev) or `npm run build -w apps/web && npm run preview -w apps/web` (preview). No sign-in.

```
E2E-1 -> checklist items 2, 3: heading and title
Preconditions: dev server running; not signed in; fresh browser profile
Steps:
  1. Open http://localhost:5173/.
  2. Read the visible page text and the tab title.
  3. In DevTools Console run: document.querySelectorAll('h1').length, document.querySelector('h1').textContent, document.documentElement.lang, document.body.innerText.trim()
Expected: page shows "SweetMemories home page"; tab title "SweetMemories"; console prints 1, "SweetMemories home page", "en", "SweetMemories home page"
```

```
E2E-2 -> checklist items 4, 7: no cookies, no third-party requests, clean console
Preconditions: dev server running; DevTools open on Network and Console tabs before loading
Steps:
  1. Open http://localhost:5173/ and wait for load.
  2. Check DevTools Application > Cookies > http://localhost:5173.
  3. Check every row in the Network tab.
  4. Check the Console tab.
Expected: cookie list empty; every request URL starts with http://localhost:5173; console has no error or warning entries
```

```
E2E-3 -> checklist item 5: demo content removed
Preconditions: repository checked out
Steps:
  1. Run: ls apps/web/README.md apps/web/public apps/web/src/assets apps/web/src/App.css
  2. Run: grep -rn -i -E 'react\.svg|vite\.svg|hero\.png|icons\.svg|favicon\.svg|useState|setCount|count is|Edit src/App|Get started' apps/web/src apps/web/index.html
Expected: step 1 prints "No such file" for all four paths; step 2 prints nothing
```

```
E2E-4 -> checklist items 6, 7: production build in preview
Preconditions: none
Steps:
  1. Run npm run build -w apps/web; check apps/web/dist/index.html exists.
  2. Run npm run preview -w apps/web; open http://localhost:4173/ with DevTools Console open.
  3. Run npm test -w apps/web and npm run typecheck -w apps/web.
Expected: build exits 0 and file exists; page shows "SweetMemories home page" with no console errors; both commands exit 0
```

```
E2E-5 -> checklist item 8: unknown path
Preconditions: dev server running
Steps:
  1. Open http://localhost:5173/anything.
Expected: page shows "SweetMemories home page"; no 404 page
```

```
E2E-6 -> checklist item 9: narrow screen
Preconditions: dev server running
Steps:
  1. Open http://localhost:5173/; open DevTools device toolbar; set width 320 px.
  2. In Console run: document.documentElement.scrollWidth <= window.innerWidth
Expected: heading fully visible (may wrap); console prints true
```

## Related

- Parent ADR: [0001-monorepo-skeleton-and-tooling](../adr/0001-monorepo-skeleton-and-tooling.md)
- Infra: [local-development](../infra/local-development.md)
- Tasks:
  1. [scaffold-web-app](../tasks/web-skeleton/scaffold-web-app.md)
  2. [add-home-page](../tasks/web-skeleton/add-home-page.md)
