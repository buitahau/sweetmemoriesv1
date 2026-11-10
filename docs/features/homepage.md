# Homepage

- Status: not-started

## Summary

The public landing page of SweetMemories ("Homepage, light pink"), shown at `/` of the web app instead of the skeleton's placeholder heading. It explains who the product is for, how it works, what Templates and Blocks look like, and how addresses work, and sends visitors to sign in with Google. Static and frontend-only: no API call, no auth, no domain code. Built from the mockup [docs/ui/Homepage/Landing2.dc.html](../ui/Homepage/Landing2.dc.html); every value, section and rule is in [ui/homepage.md](../ui/homepage.md). Decided in [ADR 0003](../adr/0003-frontend-styling-and-self-hosted-fonts.md); uses the fonts and tokens from [web-design-foundation](web-design-foundation.md).

## User story

As a visitor who is not signed in, I want a friendly page that shows what a Memory page is, who it is for and how to make one, so that I understand SweetMemories and know where to start.

Acceptance criteria:
1. `/` shows, top to bottom: the hero band (top bar, hero intro, hero collage), Who it is for, How it works, Templates, Moments worth keeping, Addresses, the closing band and the footer, as listed in [ui/homepage.md, Page structure](../ui/homepage.md#page-structure). Landmarks: one `header` (banner), one `main`, one `footer` (contentinfo). Exactly one `h1` ("Every little moment deserves a home.") and six `h2`.
2. At a 1440 x 900 viewport the page matches the mockup in layout, colors, font families, font sizes, spacing, radii and shadows, following [Checking fidelity](../ui/homepage.md#checking-fidelity); the only differences are the intended deviations listed there.
3. Nav links "Who it is for", "How it works", "Templates" and the hero link "See how it works" move the page to `#who`, `#how`, `#templates`, `#how`.
4. "Sign in" and both "Start with Google" links point to `SIGN_IN_HREF` (`/sign-in` by default, [Q002](../questions/questions-2026-11-10-requirement-breakdown.md#q002-where-do-sign-in-and-start-with-google-go-before-auth-exists)); the logo links to `/`.
5. All visible copy and item data match the mockup and come from `apps/web/src/home/content.ts` ([Q003](../questions/questions-2026-11-10-requirement-breakdown.md#q003-homepage-copy-promises-features-that-are-not-designed) may change copy later).
6. Entrance animations, hover effects and decorative motion follow [Motion and interaction](../ui/homepage.md#motion-and-interaction); with `prefers-reduced-motion: reduce` nothing moves.
7. The page follows [Responsive rules](../ui/homepage.md#responsive-rules): at 320, 375, 768 and 1024 px there is no horizontal scrollbar and no visible content is cut off at the sides (the page wrapper's `overflow: hidden` would hide it, so both are checked); hero collage hidden at 559 px and narrower.
8. Accessibility: decorative graphics are `aria-hidden`, every link is reachable with Tab in visual order with a visible focus indicator, and the Lighthouse Accessibility score is at least 95.
9. Privacy and security: no cookies, no request to another origin, no `fetch`/XHR at all, no real or private User data (fictional names only). `<title>SweetMemories</title>` and `lang="en"` stay, so the dev smoke check `web home` still passes.
10. Static only: no change under `apps/api`; no domain code (users, memories, templates, blocks, photos, auth, database); no router.
11. `npm test`, `npm run typecheck`, `npm run build` pass in `apps/web`; the browser console shows no errors or warnings.

## Behavior

- The Homepage renders at every path (SPA fallback), as the placeholder did; there is no 404 page yet.
- The template cards and block chips are illustrations from `content.ts`, not real Templates or Blocks, and run no admin-authored CSS or script (so CLAUDE.md rules 2-4 are not triggered). Real Templates appear only after the review queue exists.
- The sample addresses use the fictional subdomain `sam` and are plain text, not links.
- Anchor jumps use the browser's default (no smooth-scroll script).

## Out of scope

- Sign-in, Google OAuth, dashboard, any API call ([Q002](../questions/questions-2026-11-10-requirement-breakdown.md#q002-where-do-sign-in-and-start-with-google-go-before-auth-exists)).
- The sample Memory page "Mia, one to ten" and links to it.
- A router, 404 page, User subdomain home pages.
- SEO and sharing meta tags, favicon, analytics ([Q005](../questions/questions-2026-11-10-requirement-breakdown.md#q005-seo-sharing-tags-and-favicon-for-the-homepage)).
- A dedicated mobile design beyond the default rules ([Q004](../questions/questions-2026-11-10-requirement-breakdown.md#q004-mobile-layout-for-the-homepage)).
- Translations; the copy is English only.

## Verification checklist

The feature is complete only when every item below passes.

- [ ] 1. All 12 tasks of this feature, and both tasks of [web-design-foundation](web-design-foundation.md), have Status `done`. (all ACs)
- [ ] 2. On `$BASE_URL/`: one `header` that is not inside `main`, one `main`, one `footer` outside `main`; `document.querySelectorAll('h1').length === 1` with text `Every little moment deserves a home.`; `document.querySelectorAll('h2').length === 6`, in order: "A little corner of the internet for everyone who loves each other.", "From a pile of photos to a page, in four easy steps.", "Start simple, or tell the whole story.", "Moments worth keeping", "Your family name first, then a page for each memory.", "Start with the memory everyone keeps telling.". (AC1)
- [ ] 3. Section ids `who`, `how`, `templates` exist and appear in that order; the footer text is "Small pages for the moments worth keeping.". (AC1)
- [ ] 4. The E2E-2 spec passes: every `Visual:` value holds at 1440 x 900, 1280 x 900 and 390 x 900 (computed CSS exact; layout relations within ±4 px, [Q008](../questions/questions-2026-11-10-requirement-breakdown.md#q008-visual-fidelity-tolerance-for-the-homepage) default), and the by-eye step finds the decorative positions as in the mockup. These measured values replace the ±4 px mockup-box comparison of [Checking fidelity](../ui/homepage.md#checking-fidelity) step 4, which stays an optional reviewer check ([Q015](../questions/questions-2026-11-10-requirement-breakdown.md#q015-do-the-measured-visual-assertions-replace-the-mockup-bounding-box-comparison), option A). (AC2)
- [ ] 5. Spot values at 1440 px: `h1` font size `76px`, family Fredoka, weight 700; hero band background `rgb(255, 233, 168)` with bottom radii `64px`; templates band background white with radius `64px`; closing band background `rgb(255, 194, 209)`; hero "Start with Google" background `rgb(255, 165, 186)` with box shadow `rgb(229, 126, 152) 0px 6px 0px 0px`. (AC2)
- [ ] 6. Clicking each of the three nav links and "See how it works" changes `location.hash` to `#who`, `#how`, `#templates`, `#how` and the target section's top is within the viewport. Jumps use the browser default: `getComputedStyle(document.documentElement).scrollBehavior === 'auto'` and `grep -rn -E 'scrollIntoView|scroll-behavior' apps/web/src` prints nothing. (AC3; Behavior)
- [ ] 7. The three sign-in links ("Sign in", two "Start with Google") have `href` `/sign-in`; the logo link has `href` `/`; no link points to `Dashboard.dc.html` or `#` alone. (AC4)
- [ ] 8. `npm test -w apps/web` passes the content test that compares counts (3 nav links, 5 hero faces, 3 audiences, 4 steps, 3 template examples, 6 block chips, 8 moments, 4 address rows) and a sample of strings with the mockup. (AC5)
- [ ] 9. Hovering the hero "Start with Google" lifts it (`transform` is `matrix(1, 0, 0, 1, 0, -3)` after 0.3 s); with reduced motion emulated, `document.getAnimations().length === 0` after load and the first audience card's `transitionDuration` is `0s` (hover changes apply instantly, as in the mockup). (AC6; motion)
- [ ] 10. At 320, 375, 768 and 1024 px, `document.documentElement.scrollWidth <= window.innerWidth` and the clip check from [ui/homepage.md, Responsive rules](../ui/homepage.md#responsive-rules) returns `0` (no visible, non-decorative element sticks out of the viewport); at 559 px the element `[data-testid="hero-collage"]` has computed `display: none` and at 560 px it does not. (AC7)
- [ ] 11. Every `svg` in the page has `aria-hidden="true"` (`document.querySelectorAll('svg:not([aria-hidden="true"])').length === 0`); pressing Tab from the top focuses, in order: logo, Who it is for, How it works, Templates, Sign in, Start with Google, See how it works, Start with Google; each focused link shows a visible outline or the button lift. (AC8)
- [ ] 12. Lighthouse Accessibility category score is at least 95 on `$BASE_URL/`. (AC8)
- [ ] 13. After load: no cookies for `$BASE_URL`; every resource on the `$BASE_URL` origin; `performance.getEntriesByType('resource').filter(e => ['fetch','xmlhttprequest'].includes(e.initiatorType)).length === 0`; `grep -rn -E 'fetch\(|XMLHttpRequest|document\.cookie|localStorage' apps/web/src` prints nothing. (AC9; CLAUDE.md rules 1 and 5)
- [ ] 14. `document.title === 'SweetMemories'`, `document.documentElement.lang === 'en'`; on dev, `scripts/smoke-dev.sh` ([dev-deploy-verification](dev-deploy-verification.md)) prints `PASS web home`. (AC9)
- [ ] 15. No task PR of this feature changes a file under `apps/api` (`gh pr diff <n> --name-only` lists none); `apps/web/package.json` has no dependency whose name contains `router` or `auth` (`Object.keys(dependencies).filter(n => /router|auth/i.test(n)).length === 0`); no file in `apps/web/src` defines types named User, Memory, Template, Block or Photo (`grep -rn -E '(type|interface) (User|Memory|Template|Block|Photo)\b' apps/web/src` prints nothing). (AC10; CLAUDE.md "Project state")
- [ ] 16. `npm test -w apps/web`, `npm run typecheck -w apps/web`, `npm run build -w apps/web` exit 0; console has no errors or warnings on load in dev and preview. (AC11)
- [ ] 17. `$BASE_URL/anything` shows the Homepage (same `h1`). (Behavior)

## e2e-test-suites

Type: FE. `$BASE_URL` is `http://localhost:5173` locally or `$DEV_WEB_URL` on dev. Fresh browser profile, not signed in, viewport 1440 x 900 unless stated, reduced motion off unless stated. Wait 3 s after load for entrance animations. Every case has `Spec:` and `Testids:` lines ([ADR 0004](../adr/0004-playwright-e2e-specs.md)). A case with a path is automated in Playwright; when only some steps run in the browser, the brackets name the steps the spec covers and the other steps run as prose. `Spec: prose` gives its reason in brackets (mockup comparison, shell/npm/gh commands, or a judgment by eye). Task-level specs (`e2e/specs/homepage/<task-slug>.spec.ts`) assert the page as it is at that task, so they are isolated ([ADR 0004](../adr/0004-playwright-e2e-specs.md), Spec isolation row; [Q014](../questions/questions-2026-11-10-requirement-breakdown.md#q014-keep-task-level-homepage-specs-from-failing-a-full-playwright-run)): each wraps its tests in `test.describe('<task-slug>', ...)` and is run only for its own ticket with `npx playwright test --grep <task-slug>`. A run of the whole Homepage uses only this feature's spec: `npx playwright test --grep "homepage E2E-"`.

Case fields ([ADR 0005](../adr/0005-e2e-signed-in-data-writing-and-visual-specs.md), `accepted`): every Homepage case is `Auth: none` (not signed in) and `Data: none` (static page, writes nothing), so sign-in and seed/reset infrastructure is never needed. `Visual:` holds measured mockup values only on the mockup case (E2E-2); it is a spec in `homepage.spec.ts`, asserted as [ui/homepage.md, Visual assertions](../ui/homepage.md#visual-assertions) says (`toHaveCSS`, bounding boxes, no screenshots), with one by-eye prose step for decorative positions. Cases that assert fixed computed values at the config viewport without mockup values have `Visual: none`. Viewports for `Visual:` values: [ui/homepage.md, Test case fields](../ui/homepage.md#test-case-fields) ([Q013](../questions/questions-2026-11-10-requirement-breakdown.md#q013-viewports-for-homepage-visual-values)).

```
E2E-1 -> checklist items 2, 3, 17: structure, headings, ids
Spec: e2e/specs/homepage/homepage.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running
Steps:
  1. Open $BASE_URL/.
  2. In Console run: [document.querySelectorAll('header').length, !!document.querySelector('main header'), document.querySelectorAll('main').length, !!document.querySelector('main footer'), document.querySelector('h1').textContent, document.querySelectorAll('h1').length, [...document.querySelectorAll('h2')].map(h => h.textContent)]
  3. Run: ['who','how','templates'].map(id => document.getElementById(id)?.getBoundingClientRect().top + scrollY)
  4. Run: document.querySelector('footer').textContent
  5. Open $BASE_URL/anything and read the h1.
Expected: step 2 [1, false, 1, false, "Every little moment deserves a home.", 1, the six h2 texts of checklist item 2 in that order]; step 3 three increasing numbers; step 4 contains "SweetMemories" and "Small pages for the moments worth keeping."; step 5 h1 is "Every little moment deserves a home."
```

```
E2E-2 -> checklist item 4: visual fidelity
Spec: e2e/specs/homepage/homepage.spec.ts (steps 1-2, the Visual values; step 3, decorative positions by eye, runs as prose)
Testids: none
Auth: none
Data: none
Visual: at 1280 and 1440 wide: content max width 1200px with 40px side padding; h1 76px Fredoka 700, line height 76px; h2 sizes in page order 48px, 48px, 48px, 44px, 46px, 54px; hero band rgb(255, 233, 168) with bottom radii 64px; hero row two columns; who grid 3 columns, how list 4 columns, templates grid 3 columns, each gap 28px; templates band rgb(255, 255, 255), radius 64px, side margins 16px; closing band and footer rgb(255, 194, 209), closing top radii 64px. At 390 wide: h1 48px; every h2 34px; side padding 20px; band radii 40px; hero collage display none; who, how and templates in 1 column
Preconditions: app running; reduced motion emulated; all section tasks done; for step 3 only, mockup served at http://localhost:8000/Landing2.dc.html (see ui/homepage.md) in a second tab at 1440 x 900, reduced motion emulated there too
Steps:
  1. At 1440 x 900, then at 1280 x 900: assert every "at 1280 and 1440 wide" value of Visual on the element it names, per ui/homepage.md, Visual assertions.
  2. At 390 x 900: assert every "At 390 wide" value of Visual the same way.
  3. (prose) At 1440 x 900, compare by eye with the mockup only the decorative positions: hero collage pieces, hero band and closing band blobs, template card previews, audience card faces.
Expected: steps 1-2 every Visual value holds: computed CSS strings exactly as written, sizes exact, layout relations (columns, rows, one row) within ±4 px; step 3 same decorative arrangement, no difference beyond the Deviations in ui/homepage.md. Steps 1-2 replace the Checking fidelity step 4 box comparison (Q015, option A); that comparison is an optional reviewer check, not part of this case
```

```
E2E-3 -> checklist item 5: spot computed values
Spec: e2e/specs/homepage/homepage.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running, 1440 x 900
Steps:
  1. In Console run: const h1=getComputedStyle(document.querySelector('h1')); const band=getComputedStyle(document.querySelector('header')); const tpl=getComputedStyle(document.getElementById('templates').parentElement); const cta=[...document.querySelectorAll('a')].find(a=>a.textContent==='Start with Google'); const c=getComputedStyle(cta); const close=getComputedStyle([...document.querySelectorAll('h2')].at(-1).closest('section')); [h1.fontSize, h1.fontFamily.split(',')[0], h1.fontWeight, band.backgroundColor, band.borderBottomLeftRadius, band.borderBottomRightRadius, tpl.backgroundColor, tpl.borderTopLeftRadius, close.backgroundColor, c.backgroundColor, c.boxShadow]
Expected: ["76px", "Fredoka" (quotes allowed), "700", "rgb(255, 233, 168)", "64px", "64px", "rgb(255, 255, 255)", "64px", "rgb(255, 194, 209)", "rgb(255, 165, 186)", "rgb(229, 126, 152) 0px 6px 0px 0px"]
```

```
E2E-4 -> checklist item 6: in-page links, default jump
Spec: e2e/specs/homepage/homepage.spec.ts (steps 1-4; the grep in step 5 is a shell command and runs as prose)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running, at top of $BASE_URL/; repository checked out for step 5
Steps:
  1. Click nav link "Who it is for"; in Console run: [location.hash, (t => t >= -1 && t < innerHeight)(document.getElementById('who').getBoundingClientRect().top)]
  2. Repeat for "How it works" (#how) and "Templates" (#templates), with the matching id in the command.
  3. Scroll to top, click "See how it works"; read location.hash.
  4. Run: getComputedStyle(document.documentElement).scrollBehavior
  5. Run: grep -rn -E 'scrollIntoView|scroll-behavior' apps/web/src; echo "g=$?"
Expected: ["#who", true], ["#how", true], ["#templates", true]; step 3 "#how"; step 4 "auto"; step 5 only "g=1"
```

```
E2E-5 -> checklist item 7: sign-in and logo links
Spec: e2e/specs/homepage/homepage.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running
Steps:
  1. In Console run: [...document.querySelectorAll('a')].filter(a => ['Sign in','Start with Google'].includes(a.textContent.trim())).map(a => a.getAttribute('href'))
  2. Run: document.querySelector('header a').getAttribute('href')
  3. Run: [...document.querySelectorAll('a')].filter(a => ['#','Dashboard.dc.html'].includes(a.getAttribute('href'))).length
  4. Click "Sign in".
Expected: ["/sign-in","/sign-in","/sign-in"]; "/"; 0; URL becomes $BASE_URL/sign-in and the Homepage is shown (SPA fallback)
```

```
E2E-6 -> checklist items 8, 16: unit tests and builds
Spec: prose (npm commands and the preview server)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: npm install done
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose; echo "t=$?"
  2. Run: npm run typecheck -w apps/web && npm run build -w apps/web; echo "b=$?"
  3. Run: npm run preview -w apps/web; open http://localhost:4173/ with the Console open.
Expected: t=0 and the verbose output lists "has the item counts of the mockup" and "matches sample strings" as passed; b=0; preview shows the Homepage, Console has 0 error and 0 warning entries
```

```
E2E-7 -> checklist item 9: motion and reduced motion
Spec: e2e/specs/homepage/homepage.spec.ts
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running
Steps:
  1. Hover "Start with Google" in the hero; wait 0.3 s; in Console run: getComputedStyle([...document.querySelectorAll('a')].find(a=>a.textContent==='Start with Google')).transform
  2. DevTools > Rendering > prefers-reduced-motion = reduce; reload; wait 1 s; run: document.getAnimations().length
  3. Run: getComputedStyle(document.querySelector('#who article')).transitionDuration
Expected: step 1 "matrix(1, 0, 0, 1, 0, -3)"; step 2 0; step 3 "0s"
```

```
E2E-8 -> checklist item 10: responsive
Spec: e2e/specs/homepage/homepage.spec.ts
Testids: hero-collage
Auth: none
Data: none
Visual: none
Preconditions: app running
Steps:
  1. For widths 320, 375, 768, 1024 (height 800): set the device toolbar, reload, wait 3 s, run: [document.documentElement.scrollWidth <= window.innerWidth, [...document.querySelectorAll('header *, main *, footer *')].filter(e => !e.closest('[aria-hidden="true"]') && e.getBoundingClientRect().width > 0 && (e.getBoundingClientRect().left < -0.5 || e.getBoundingClientRect().right > innerWidth + 0.5)).length]
  2. At width 559 run: getComputedStyle(document.querySelector('[data-testid="hero-collage"]')).display
  3. At width 560 run the same command.
Expected: step 1 [true, 0] at every width (decorative aria-hidden blobs and the collage are excluded; any other element outside 0..innerWidth is clipped content and fails AC7); step 2 "none"; step 3 "block"
```

```
E2E-9 -> checklist items 11, 12: accessibility
Spec: e2e/specs/homepage/homepage.spec.ts (steps 1-2: svg count and focus order; the visible-indicator judgment in step 2 and the Lighthouse CLI in step 3 run as prose)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running; Chrome installed
Steps:
  1. In Console run: document.querySelectorAll('svg:not([aria-hidden="true"])').length
  2. Click the address bar, press Tab repeatedly; note the text of each focused link and whether a focus indicator is visible.
  3. Run: LH="$(mktemp -d)/lh.json"; npx lighthouse "$BASE_URL/" --only-categories=accessibility --output=json --output-path="$LH" --quiet --chrome-flags="--headless=new" && node -p "require('$LH').categories.accessibility.score"
Expected: 0; order "SweetMemories" (logo), "Who it is for", "How it works", "Templates", "Sign in", "Start with Google", "See how it works", "Start with Google", each with a visible indicator; score >= 0.95
```

```
E2E-10 -> checklist items 13, 14: privacy, no API, head, smoke
Spec: e2e/specs/homepage/homepage.spec.ts (steps 1-2; steps 3-4 are shell commands and run as prose)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: app running; DevTools Network open before load
Steps:
  1. Load $BASE_URL/. Check Application > Cookies.
  2. In Console run: [[...new Set(performance.getEntriesByType('resource').map(e=>new URL(e.name).origin))], performance.getEntriesByType('resource').filter(e=>['fetch','xmlhttprequest'].includes(e.initiatorType)).length, document.title, document.documentElement.lang]
  3. Run: grep -rn -E 'fetch\(|XMLHttpRequest|document\.cookie|localStorage' apps/web/src; echo "g=$?"
  4. On dev only: scripts/smoke-dev.sh
Expected: no cookies; [[$BASE_URL origin only], 0, "SweetMemories", "en"]; only "g=1"; step 4 output includes the line "PASS web home" (CLAUDE.md rules 1 and 5)
```

```
E2E-11 -> checklist items 1, 15: tasks done, no domain code
Spec: prose (repository, gh and grep commands)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: repository at the feature's last merge
Steps:
  1. Read the Status line of every task linked under Related and of web-design-foundation's tasks.
  2. For each merged task PR <n> of this feature run: gh pr diff <n> --name-only | grep '^apps/api/'; echo "g=$?"
  3. Run: node -p "Object.keys(require('./apps/web/package.json').dependencies).filter(n => /router|auth/i.test(n)).length"
  4. Run: grep -rn -E '(type|interface) (User|Memory|Template|Block|Photo)\b' apps/web/src; echo "g=$?"
Expected: all "done"; every PR prints only "g=1"; step 3 prints 0; only "g=1"
```

## Related

- Parent ADR: [0003-frontend-styling-and-self-hosted-fonts](../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../ui/homepage.md), mockup [Homepage/](../ui/Homepage/README.md)
- Depends on: [web-design-foundation](web-design-foundation.md); replaces the placeholder of [web-skeleton](web-skeleton.md)
- Smoke check from [dev-deploy-verification](dev-deploy-verification.md) (`done`) must keep passing (checklist item 14).
- E2E specs: follows [ADR 0004](../adr/0004-playwright-e2e-specs.md) (listed there under "Applies to", not a parent); spec project: [e2e-specs](e2e-specs.md).
- Design gate: met. [ADR 0003](../adr/0003-frontend-styling-and-self-hosted-fonts.md) is `accepted` (Q001 answered A, 2026-11-10). Every task is `not-started` and starts once its own Prerequisites are `done`: tasks 1 and 2 now, [add-homepage-shell](../tasks/homepage/add-homepage-shell.md) after [add-design-tokens](../tasks/web-design-foundation/add-design-tokens.md) (the last task of [web-design-foundation](web-design-foundation.md)), tasks 4-12 after add-homepage-shell. [Q010](../questions/questions-2026-11-10-requirement-breakdown.md#q010-record-adr-0003-and-adr-0004-approval-in-claudemd) asks the product owner to record ADR 0003 and 0004 in `CLAUDE.md` "Project state".
- Questions: [questions-2026-11-10-requirement-breakdown](../questions/questions-2026-11-10-requirement-breakdown.md) (Q001, Q009, Q012, Q013, Q014 and Q015 answered; Q002-Q008 and Q010 open, their defaults apply; Q008 is the ±4 px tolerance used for layout relations in [Visual assertions](../ui/homepage.md#visual-assertions); Q013 (A): `Visual:` values at 1280 and 1440 plus 390; Q014 (A): task specs wrapped in `test.describe('<task-slug>')` and run by `--grep`; Q015 (A): the measured `Visual:` assertions replace the mockup bounding-box comparison, which stays an optional reviewer check)
- E2E specs also follow [ADR 0005](../adr/0005-e2e-signed-in-data-writing-and-visual-specs.md) (accepted, Q012): the mockup cases (E2E-2 here and in tasks 4-12) are specs; the tester authors every spec file from the tickets.
- Tasks (1-3 in any order; 3 needs [web-design-foundation](web-design-foundation.md) done; 4-11 after the tasks listed in each one's Prerequisites; 12 last, after 1-11, because it also updates `README.md` to say the Homepage is complete):
  1. [add-home-content](../tasks/homepage/add-home-content.md)
  2. [add-home-illustrations](../tasks/homepage/add-home-illustrations.md)
  3. [add-homepage-shell](../tasks/homepage/add-homepage-shell.md)
  4. [build-top-bar](../tasks/homepage/build-top-bar.md)
  5. [build-hero-intro](../tasks/homepage/build-hero-intro.md)
  6. [build-hero-collage](../tasks/homepage/build-hero-collage.md)
  7. [build-audiences-section](../tasks/homepage/build-audiences-section.md)
  8. [build-steps-section](../tasks/homepage/build-steps-section.md)
  9. [build-templates-section](../tasks/homepage/build-templates-section.md)
  10. [build-moments-section](../tasks/homepage/build-moments-section.md)
  11. [build-addresses-section](../tasks/homepage/build-addresses-section.md)
  12. [build-page-closing](../tasks/homepage/build-page-closing.md)
