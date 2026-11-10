# Add homepage shell

- Status: not-started

## Goal

Replace the placeholder heading with an empty Homepage frame: page wrapper, yellow hero band (as the page `header`, with its two blobs and an empty two-column hero row) and an empty `main`, with marked slots where later tasks insert sections.

## Scope

Area: UI. Decisions: [ADR 0003](../../adr/0003-frontend-styling-and-self-hosted-fonts.md); structure and landmarks: [ui/homepage.md, Page structure](../../ui/homepage.md#page-structure). Mockup lines: 31 (`sm-blob` keyframes), 55, 58-61, 76.

| File | Change |
|---|---|
| `apps/web/src/home/HomePage.tsx` (new) | `export function HomePage()` returning exactly the tree below. |
| `apps/web/src/home/HomePage.module.css` (new) | Classes `page`, `heroBand`, `blobLeft`, `blobRight`, `heroRow` and keyframes `blob`, values below. |
| `apps/web/src/App.tsx` | Render `<HomePage />` (import from `./home/HomePage.tsx`) and nothing else. |
| `apps/web/src/App.test.tsx` | Replace both old tests with `renders the Homepage landmarks` (`screen.getByRole('banner')` and `screen.getByRole('main')` are in the document) and `no longer shows the placeholder` (`screen.queryByText('SweetMemories home page')` is `null`). |

Tree (slot comments are exact; later tasks replace one comment each with their component):

```tsx
<div className={styles.page}>
  <header className={styles.heroBand}>
    <div aria-hidden="true" className={styles.blobLeft} />
    <div aria-hidden="true" className={styles.blobRight} />
    {/* slot: top-bar */}
    <div className={styles.heroRow}>
      {/* slot: hero-intro */}
      {/* slot: hero-collage */}
    </div>
  </header>
  <main>
    {/* slot: audiences */}
    {/* slot: steps */}
    {/* slot: templates */}
    {/* slot: moments */}
    {/* slot: addresses */}
    {/* slot: closing */}
  </main>
  {/* slot: footer */}
</div>
```

CSS values:

| Class | Declarations |
|---|---|
| `page` | `overflow: hidden;` (line 55; background, color and font come from `body`, set in [add-design-tokens](../web-design-foundation/add-design-tokens.md); do not copy `min-height: 3500px`) |
| `heroBand` | `position: relative; background: var(--color-hero); border-bottom-left-radius: var(--radius-band); border-bottom-right-radius: var(--radius-band); overflow: hidden;` (58) |
| `blobLeft` | `position: absolute; left: -120px; top: 260px; width: 380px; height: 380px; border-radius: 50%; background: var(--color-hero-blob); opacity: 0.7; animation: blob 9s ease-in-out infinite;` (60) |
| `blobRight` | `position: absolute; right: -140px; top: -120px; width: 420px; height: 420px; border-radius: 50%; background: var(--color-page); opacity: 0.55;` (61) |
| `heroRow` | `position: relative; max-width: var(--page-max); margin: 0 auto; box-sizing: border-box; padding: 28px var(--gutter) 110px; display: flex; flex-wrap: wrap; gap: 48px; align-items: center;` (76); inside `@media (max-width: 767px)`: `padding-bottom: 64px;` |
| `@keyframes blob` | copy line 31 (`sm-blob`) by value, renamed `blob` |

Prerequisites (must be `done`): [add-design-tokens](../web-design-foundation/add-design-tokens.md), and therefore [add-self-hosted-fonts](../web-design-foundation/add-self-hosted-fonts.md) (all of [web-design-foundation](../../features/web-design-foundation.md)). Design gate: met ([ADR 0003](../../adr/0003-frontend-styling-and-self-hosted-fonts.md) `accepted`, [Q001](../../questions/questions-2026-11-10-requirement-breakdown.md#q001-accept-adr-0003-styling-and-self-hosted-fonts) answered A on 2026-11-10). Start once the prerequisite is `done`.

Out of scope: any section content (top bar, hero text, collage, sections 2-8), `index.html`, router, footer element (added by [build-page-closing](build-page-closing.md)).

Security: static markup; no data fetching, cookies or user data (CLAUDE.md rules 1 and 5 groundwork). `index.html` stays as is, so the dev smoke check `web home` keeps passing.

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `npm test -w apps/web` runs and passes `renders the Homepage landmarks` and `no longer shows the placeholder`; no test expects `SweetMemories home page`. (AC1)
- [ ] 2. `HomePage.tsx` contains the tree from Scope with all ten slot comments verbatim (top-bar, hero-intro, hero-collage, audiences, steps, templates, moments, addresses, closing, footer; `grep -c '{/\* slot: ' apps/web/src/home/HomePage.tsx` prints 10). (AC1)
- [ ] 3. At `$BASE_URL/` (1440 x 900): one `header` with background `rgb(255, 233, 168)`, bottom radii `64px`; one empty `main`; text "SweetMemories home page" is gone. (AC1, AC2)
- [ ] 4. The left blob is a `rgb(255, 210, 184)` circle at `left: -120px; top: 260px`, 380 px, opacity 0.7, with a running animation; the right blob is `rgb(255, 247, 234)`, 420 px, opacity 0.55; both `aria-hidden="true"`. (AC2, AC8)
- [ ] 5. The hero row is a flex container, `max-width: 1200px`, padding `28px 40px 110px` at 1440 px and `28px 20px 64px` at 375 px. (AC2, AC7)
- [ ] 6. At 320 px `document.documentElement.scrollWidth <= window.innerWidth` is `true`. (AC7)
- [ ] 7. `document.title` is `SweetMemories`; no cookies; Console has no errors or warnings. (AC9, AC11)
- [ ] 8. `npm run typecheck -w apps/web` and `npm run build -w apps/web` exit 0. (AC11)

## e2e-test-suites

Type: FE. `$BASE_URL` = `http://localhost:5173` or `$DEV_WEB_URL`. Not signed in. Viewport 1440 x 900 unless stated. `Spec:`/`Testids:` per [ADR 0004](../../adr/0004-playwright-e2e-specs.md). The spec asserts the page as it is after this task (empty `main`); it is run only for this ticket.

```
E2E-1 -> checklist items 1, 2, 8: tests, slots, build
Spec: prose (npm and grep commands)
Testids: none
Preconditions: npm install done
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose; echo "t=$?"
  2. Run: grep -c '{/\* slot: ' apps/web/src/home/HomePage.tsx; grep -rn 'SweetMemories home page' apps/web/src; echo "g=$?"
  3. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
Expected: both new test names pass, t=0; 10 then "g=1"; b=0
```

```
E2E-2 -> checklist items 3, 4: band and blobs
Spec: e2e/specs/homepage/add-homepage-shell.spec.ts
Testids: none
Preconditions: app running
Steps:
  1. Open $BASE_URL/. In Console run: const h=document.querySelector('header'); const hs=getComputedStyle(h); [document.querySelectorAll('header').length, hs.backgroundColor, hs.borderBottomLeftRadius, hs.borderBottomRightRadius, document.querySelector('main').children.length, document.body.innerText.includes('SweetMemories home page')]
  2. Run: [...h.querySelectorAll(':scope > div[aria-hidden="true"]')].map(d => { const s=getComputedStyle(d); return [s.backgroundColor, s.width, s.opacity, s.left, s.top, s.animationName !== 'none'] })
Expected: step 1 [1, "rgb(255, 233, 168)", "64px", "64px", 0, false]; step 2 [["rgb(255, 210, 184)","380px","0.7","-120px","260px",true], ["rgb(255, 247, 234)","420px","0.55", any, "-120px", false]]
```

```
E2E-3 -> checklist items 5, 6: hero row and narrow screens
Spec: e2e/specs/homepage/add-homepage-shell.spec.ts
Testids: none
Preconditions: app running
Steps:
  1. At 1440 x 900 run: const r=getComputedStyle(document.querySelector('header > div:not([aria-hidden])')); [r.display, r.maxWidth, r.padding]
  2. At 375 x 812 reload and run the same.
  3. At 320 x 640 reload and run: document.documentElement.scrollWidth <= window.innerWidth
Expected: step 1 ["flex","1200px","28px 40px 110px"]; step 2 ["flex","1200px","28px 20px 64px"]; step 3 true
```

```
E2E-4 -> checklist item 7: head, cookies, console
Spec: e2e/specs/homepage/add-homepage-shell.spec.ts
Testids: none
Preconditions: app running; DevTools Console open before load
Steps:
  1. Reload $BASE_URL/. Run: document.title. Check Application > Cookies.
Expected: "SweetMemories"; no cookies; no error or warning entries in Console
```

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#page-structure)
- Replaces the output of: [add-home-page](../web-skeleton/add-home-page.md)
