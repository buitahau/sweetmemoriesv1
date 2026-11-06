# Add home page

- Status: not-started

## Goal

Make the web app's only page show the heading "SweetMemories home page", with tab title "SweetMemories" and `lang="en"`.

## Scope

Area: UI. Files:

| File | Change |
|---|---|
| `apps/web/src/App.tsx` | Render exactly `<main><h1>SweetMemories home page</h1></main>`. No other text, no images, no state, no data fetching. |
| `apps/web/index.html` | `<html lang="en">`; `<title>SweetMemories</title>`. Keep `<link rel="icon" href="data:," />` and `<div id="root"></div>`. |
| `apps/web/src/App.test.tsx` | Replace the smoke test with tests named `shows the home page heading` (expects `screen.getByRole('heading', { level: 1, name: 'SweetMemories home page' })` to be in the document and `screen.getAllByRole('heading')` to have length 1) and `has no other text` (expects `container.textContent` to equal `SweetMemories home page`). |

Copy is fixed by the product owner: `SweetMemories home page` (capital S and M, no punctuation).

Test files import `describe`, `it` and `expect` from `'vitest'` explicitly; DOM cleanup between tests comes from `src/test-setup.ts` (see [scaffold-web-app](scaffold-web-app.md) step 6).

Prerequisites:
- Design gate: [Q001](../../questions/questions-2026-11-08-requirement-breakdown.md#q001-does-this-requirement-approve-writing-skeleton-code-during-the-design-phase) answered "Yes", [ADR 0001](../../adr/0001-monorepo-skeleton-and-tooling.md) Status `accepted`, `CLAUDE.md` "Project state" updated by a human. Otherwise do not start.
- Tasks (must be `done`): [scaffold-web-app](scaffold-web-app.md).

Out of scope: real Homepage design from the mockups, links, navigation, sign-in button, router, calling the API, favicon or logo, meta description.

Security: static text only; no cookies, no third-party requests (groundwork for CLAUDE.md security rule 1), no user data (rule 5).

## Verification checklist

The task is complete only when every item below passes. Tags name the [web-skeleton](../../features/web-skeleton.md) acceptance criterion (ACn) or requirement each item proves.

- [ ] 1. `npm test -w apps/web` exits 0 and runs `shows the home page heading` and `has no other text`. (AC1, AC5)
- [ ] 2. In the browser at `http://localhost:5173/` the page shows one `<h1>` with text exactly `SweetMemories home page` and no other visible text. (AC1)
- [ ] 3. The tab title is `SweetMemories` and `document.documentElement.lang` is `en`. (AC2)
- [ ] 4. After loading the page, DevTools shows no cookies for `localhost:5173`, every Network request goes to `localhost:5173`, and the Console has no errors or warnings. (AC3, AC6)
- [ ] 5. `http://localhost:5173/anything` shows the same heading. (Behavior: SPA fallback)
- [ ] 6. After `npm run build -w apps/web && npm run preview -w apps/web`, `http://localhost:4173/` shows the same heading and title. (AC5)
- [ ] 7. At 320 px viewport width, `document.documentElement.scrollWidth <= window.innerWidth` is `true`. (Behavior: readable at 320 px)
- [ ] 8. `npm run typecheck -w apps/web` exits 0. (AC5)

## e2e-test-suites

Type: FE. Start the dev server with `npm run dev -w apps/web`. No sign-in, fresh browser profile.

```
E2E-1 -> checklist items 1, 8: automated tests and types
Preconditions: npm install done
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose
  2. Run: npm run typecheck -w apps/web
Expected: step 1 exits 0 and lists both test names as passed; step 2 exits 0
```

```
E2E-2 -> checklist items 2, 3: heading, title, language
Preconditions: dev server running; browser at http://localhost:5173/
Steps:
  1. Read the visible text and the tab title.
  2. In DevTools Console run: [document.querySelectorAll('h1').length, document.querySelector('h1').textContent, document.title, document.documentElement.lang, document.body.innerText.trim()]
Expected: page shows only "SweetMemories home page"; tab title "SweetMemories"; console prints [1, "SweetMemories home page", "SweetMemories", "en", "SweetMemories home page"]
```

```
E2E-3 -> checklist item 4: no cookies, no third-party requests, clean console
Preconditions: dev server running; DevTools open on Network and Console before loading
Steps:
  1. Open http://localhost:5173/ and wait for load.
  2. Check Application > Cookies > http://localhost:5173.
  3. Check every Network row URL.
  4. Check the Console.
Expected: no cookies; all URLs start with http://localhost:5173; no error or warning entries (CLAUDE.md security rule 1 groundwork)
```

```
E2E-4 -> checklist item 5: unknown path
Preconditions: dev server running
Steps:
  1. Open http://localhost:5173/anything.
Expected: page shows "SweetMemories home page"
```

```
E2E-5 -> checklist item 6: production build
Preconditions: dev server stopped; port 4173 free
Steps:
  1. Run npm run build -w apps/web, then npm run preview -w apps/web.
  2. Open http://localhost:4173/.
Expected: page shows "SweetMemories home page"; tab title "SweetMemories"
```

```
E2E-6 -> checklist item 7: narrow screen
Preconditions: dev server running
Steps:
  1. Open http://localhost:5173/; open DevTools device toolbar; set width to 320 px.
  2. In Console run: document.documentElement.scrollWidth <= window.innerWidth
Expected: heading fully visible (may wrap to two lines); console prints true
```

## Links

- Feature: [web-skeleton](../../features/web-skeleton.md)
- ADR: [0001-monorepo-skeleton-and-tooling](../../adr/0001-monorepo-skeleton-and-tooling.md)
