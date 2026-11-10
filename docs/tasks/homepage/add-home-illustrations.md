# Add home illustrations

- Status: not-started

## Goal

Create `apps/web/src/home/illustrations.tsx`: the Homepage's decorative SVG shapes as small React components, all hidden from assistive technology.

## Scope

Area: UI (one component module + unit test). Decision: [ADR 0003](../../adr/0003-frontend-styling-and-self-hosted-fonts.md), Graphics row and the SVG hex exception in the Design tokens row. Source: [Landing2.dc.html](../../ui/Homepage/Landing2.dc.html).

Files: `apps/web/src/home/illustrations.tsx` (new), `apps/web/src/home/illustrations.test.tsx` (new).

Every component: a named export, renders one `<svg>` with `aria-hidden="true"` and `focusable="false"`, takes an optional `className?: string` passed to the `<svg>`, and copies `viewBox`, shapes, paths and colors exactly from the listed lines (hex values directly in `fill`/`stroke`). Convert attribute names to React (`stroke-width` -> `strokeWidth`, `stroke-linecap` -> `strokeLinecap`, `stroke-linejoin` -> `strokeLinejoin`). No `style` prop, no animation inside the components (sections add animation through `className`).

| Component | Props | Size (`width`/`height`) | Copy from line |
|---|---|---|---|
| `LogoMark` | `variant: 'header' \| 'footer'` | header 38, footer 28 | header: 65 (tile `#FF8FAB` `rx="11"`, white heart); footer: 274 (white tile `rx="10"`, heart `#FF8FAB`) |
| `Face` | `bg: string; size: number` | `size` | 155 (viewBox `0 0 60 60`, circle fill = `bg`) |
| `Heart` | `size: number` | `size` | 80 (path, fill `#FF8A4C`, viewBox `0 0 30 30`) |
| `Sun` | `raysClassName?: string` | 110 | 106-112 (rays `<g>` gets `className={raysClassName}`, no inline style; its `transform-origin` and spin are set by the collage CSS; keep rays stroke, sun circle, eyes, smile, cheeks) |
| `Cloud` | - | 120 x 72 | 114 |
| `Star` | - | 46 | 133 (polygon, fill `#FFC93C`, stroke `#FFB020`) |
| `LockIcon` | - | 13 | 119 |
| `AddressIcon` | `kind: 'home' \| 'heart'` | 22 | 246 (viewBox `0 0 20 20`, stroke `#3B2433`, `strokeWidth` 1.7); path `d` for `home` from line 324, for `heart` from line 325 |

The hero face ring (line 94: `border`, `border-radius`, `background`, negative margin) is styling of the hero intro, not of `Face`; do not add it here.

`illustrations.test.tsx` (Vitest + Testing Library, imports from `'vitest'`), tests:
- `hides every illustration from assistive technology`: render each component (all variants/kinds) and expect its `container.querySelector('svg')` to have `aria-hidden="true"`.
- `sizes Face and Heart from props`: `Face` with `size={52}` has `width="52"` and `height="52"`; its first `circle` has `fill` equal to the `bg` prop; `Heart` with `size={22}` has `width="22"`.
- `draws the two logo variants`: header variant `width="38"`, footer variant `width="28"`.
- `passes className through`: `Star` with `className="x"` has class `x` on the `svg`; without `className` the `svg` has no `class="undefined"`.

The `unit-tests` section below maps these tests to checklist items.

Prerequisites: none.

Out of scope: placing illustrations on the page, animations, the collage's non-SVG shapes (sample card, polaroids, blobs), any icon library.

Security: static SVG only, no `dangerouslySetInnerHTML`, no external `href` in SVG (CLAUDE.md rule 1 groundwork: no third-party requests).

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `illustrations.tsx` exports `LogoMark`, `Face`, `Heart`, `Sun`, `Cloud`, `Star`, `LockIcon`, `AddressIcon` with the props in Scope; `npm run typecheck -w apps/web` exits 0. (AC2)
- [ ] 2. `npm test -w apps/web` passes the four tests named in Scope. (AC8)
- [ ] 3. Each component's `viewBox`, paths, shapes and colors equal the listed mockup lines (reviewer compares side by side). (AC2)
- [ ] 4. `grep -n -E 'dangerouslySetInnerHTML|href=|xlink|style=' apps/web/src/home/illustrations.tsx` prints nothing. (Security)
- [ ] 5. Under `apps/`, the PR changes only the two files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them). Changes under `docs/` (this task's Status, `docs/tasks/Progress.md`, ticked checklist) are allowed. (AC10)

## e2e-test-suites

Type: FE (component module, verified by commands). Run from the repo root. `Spec:`/`Testids:` per [ADR 0004](../../adr/0004-playwright-e2e-specs.md): no case opens a page, so all are prose. Every case is `Auth: none`, `Data: none`, `Visual: none` (commands only; [ui/homepage.md, Test case fields](../../ui/homepage.md#test-case-fields)).

```
E2E-1 -> checklist items 1, 2: exports, tests, types
Spec: prose (npm and grep commands)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: npm install done
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/illustrations.test.tsx; echo "t=$?"
  2. Run: npm run typecheck -w apps/web; echo "c=$?"
  3. Run: grep -o -E 'export (function|const) [A-Za-z]+' apps/web/src/home/illustrations.tsx
Expected: the four test names pass; t=0; c=0; step 3 lists LogoMark, Face, Heart, Sun, Cloud, Star, LockIcon, AddressIcon
```

```
E2E-2 -> checklist item 3: shapes match the mockup
Spec: prose (shell commands)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: branch checked out
Steps:
  1. Run: for d in "M15 22s-6.5-4.1-6.5-8.4A3.6 3.6 0 0 1 15 11.6a3.6 3.6 0 0 1 6.5 2C21.5 17.9 15 22 15 22z" "M15 25s-10-6.3-10-13A5.5 5.5 0 0 1 15 9a5.5 5.5 0 0 1 10 3c0 6.7-10 13-10 13z" "M3.5 9.5L10 4l6.5 5.5V16h-4.2v-4.2H7.7V16H3.5z" "M10 16.5s-6-3.8-6-8A3.3 3.3 0 0 1 10 6.6a3.3 3.3 0 0 1 6 1.9c0 4.2-6 8-6 8z" "M14 44a13 13 0 0 1 2-26 18 18 0 0 1 34-3 15 15 0 0 1 14 29z" "M21 37q9 8 18 0" "20,3 25,14.5 37.5,15.5 28,23.500 31,36 20,29.500 9,36 12,23.500 2.500,15.500 15,14.500" "M4 5V3.6a2 2 0 0 1 4 0V5" 'viewBox="0 0 12 12"' 'viewBox="0 0 40 40"'; do grep -qF -- "$d" apps/web/src/home/illustrations.tsx || echo "missing: $d"; done; echo done
Expected: prints only "done" (the strings are: LogoMark heart (lines 65, 274), Heart (line 80), AddressIcon home (line 324), AddressIcon heart (line 325), Cloud (line 114), Face smile (line 155), Star polygon `points` (line 133, copied character for character), LockIcon shackle path and LockIcon and Star `viewBox` (lines 119, 133); the LockIcon `rect` (`x` 2, `y` 5, `width` 8, `height` 6, `rx` 1.5, fill `#6B4A5A`) is compared by the reviewer under checklist item 3)
```

```
E2E-3 -> checklist items 4, 5: no unsafe markup, scope
Spec: prose (grep and git commands)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: PR branch checked out
Steps:
  1. Run: grep -n -E 'dangerouslySetInnerHTML|href=|xlink|style=' apps/web/src/home/illustrations.tsx; echo "g=$?"
  2. Run: git diff --name-only origin/dev-v1...HEAD -- apps/
Expected: only "g=1"; exactly apps/web/src/home/illustrations.tsx and apps/web/src/home/illustrations.test.tsx (files under docs/ may also change in the PR but are not listed by this command)
```

## unit-tests

Vitest + Testing Library, colocated in `apps/web/src/home/illustrations.test.tsx` (the four tests named in Scope). Render only; no network.

Unit: the eight components of `apps/web/src/home/illustrations.tsx`.

| ID | Case: input -> expected | Checklist |
|---|---|---|
| U-1 | `hides every illustration from assistive technology`: render `LogoMark` (both variants), `Face`, `Heart`, `Sun`, `Cloud`, `Star`, `LockIcon`, `AddressIcon` (both kinds) -> each `svg` has `aria-hidden="true"` (10 renders, 0 without it) | 2 |
| U-2 | `sizes Face and Heart from props`: `<Face bg="#FFC09A" size={52} />` -> `width="52"`, `height="52"`, first `circle` `fill="#FFC09A"`; `<Heart size={22} />` -> `width="22"` | 1, 2 |
| U-3 | `draws the two logo variants`: `variant="header"` -> `width="38"`; `variant="footer"` -> `width="28"` | 1, 2 |
| U-4 | `passes className through`: `<Star className="x" />` -> the `svg` has class `x`; without `className` -> no `class="undefined"` | 1, 2 |

Security (no external `href`, no `style`, no `dangerouslySetInnerHTML`; CLAUDE.md rule 1 groundwork) is checked by grep in checklist item 4, not by a unit test.

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md#accessibility)
