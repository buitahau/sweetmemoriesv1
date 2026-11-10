# Add home content

- Status: not-started

## Goal

Create `apps/web/src/home/content.ts`: every visible string and every per-item value (colors, sizes, rotations) of the Homepage as typed constants, copied from the mockup.

## Scope

Area: UI (data module + unit test). Decision: [ADR 0003](../../adr/0003-frontend-styling-and-self-hosted-fonts.md), Static content and Sign-in links rows. Source: [Landing2.dc.html](../../ui/Homepage/Landing2.dc.html), line numbers below.

Files: `apps/web/src/home/content.ts` (new), `apps/web/src/home/content.test.ts` (new). Nothing else.

`content.ts` exports exactly these (TypeScript, `export const` / `export type`; strings copied character for character, including `’` U+2019 where the mockup has it and the straight `'` in `Bob's first day` (collage title, line 124; write that one string in double quotes so it appears unescaped in the file and the E2E-2 grep finds it)):

| Export | Type | Value (mockup line) |
|---|---|---|
| `SIGN_IN_HREF` | `string` | `'/sign-in'`, with comment `// Placeholder until auth exists, see docs/questions Q002 (2026-11-10)` |
| `brand` | `{ name: string; tagline: string }` | `SweetMemories` (66), `Small pages for the moments worth keeping.` (277) |
| `NavLink` / `navLinks` | `{ label: string; href: string }[]` | Who it is for `#who`, How it works `#how`, Templates `#templates` (69-71) |
| `signInLabel` | `string` | `Sign in` (72) |
| `hero` | object with `badge`, `titleBefore`, `titleHighlight`, `titleAfter`, `lead`, `primaryCta`, `secondaryCta`, `note`, `facesCaption`: `string`; `faceColors: string[]` | badge (81); title split as `Every little moment deserves a ` / `home` / `.` (83); lead (84); `Start with Google` (86); `See how it works` (87); note (89); facesCaption (97); faceColors = the 5 `bg` values of `heroFaces` (288) |
| `collage` | object with `address`, `title`, `subtitle`, `noteLine`, `noteTitle`: `string`; `photoCaptions: [string, string]` | (120), (124), (125), (136), (137), `['at the gate', 'new friends']` (126-127) |
| `FaceData` | `{ bg: string; size: number }` | - (named `FaceData`, not `Face`, because `illustrations.tsx` exports a component `Face`) |
| `sectionText` | object with keys `who`, `how`, `templates`, `moments`, `addresses`, `closing`, each `{ title: string; lead?: string }` | who (147, 148); how (168, no lead); templates (185, 186); moments (225, 226); addresses (238, 239); closing (264, 265) |
| `Audience` / `audiences` | `{ title; text; example; bg; shadow: string; faces: FaceData[] }[]` | 3 items (290-292); `face(bg, size)` becomes `{ bg, size }` with `size` a number |
| `Step` / `steps` | `{ n; bg; line; title; text: string }[]` | 4 items (295-298) |
| `TemplateExample` / `templateExamples` | `{ name; description: string; count: number; paper; shadow; accent: string }[]` | 3 items (301-303) |
| `blockCountSuffix` | `string` | `'blocks'` (205: the word after the count, e.g. `3 blocks`) |
| `blocksLabel` | `string` | `Made from building blocks` (212) |
| `Chip` / `blockChips` | `{ name; bg; rot: string }[]` | 6 items (306-311) |
| `Moment` / `moments` | `{ text; bg; shadow; rot: string }[]` | 8 items (314-321) |
| `AddressRow` / `addressRows` | `{ url; text; bg: string; icon: 'home' \| 'heart' }[]` | 4 items (324-327); first `icon: 'home'`, others `'heart'`. Do not copy `border` or the SVG path: the first-row border rule and the icon paths belong to the components. |
| `closingCta` | `string` | `Start with Google` (267) |

Name rule ([ADR 0003](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)): no type or constant named `User`, `Memory`, `Template`, `Block` or `Photo`; Homepage cards are "examples".

`content.test.ts` (Vitest, imports `describe`, `it`, `expect` from `'vitest'`), tests:
- `has the item counts of the mockup`: `navLinks` 3, `hero.faceColors` 5, `audiences` 3 (each with 3 faces), `steps` 4, `templateExamples` 3, `blockChips` 6, `moments` 8, `addressRows` 4.
- `uses six-digit hex colors`: every color field of every item matches `/^#[0-9A-F]{6}$/`.
- `matches sample strings`: `hero.titleBefore + hero.titleHighlight + hero.titleAfter === 'Every little moment deserves a home.'`; `audiences[0].example === 'Grandpa’s garden'`; `steps[3].title === 'Publish and share'`; `templateExamples[1].count === 4`; `moments[7].text === 'Our new puppy'`; `addressRows[2].url === 'sam.sweetmemories.com/first-day-of-bob'`; `blockCountSuffix === 'blocks'`.
- `points sign-in to the placeholder`: `SIGN_IN_HREF === '/sign-in'`; `navLinks.map(l => l.href)` equals `['#who', '#how', '#templates']`.
- `uses degree rotations`: every `blockChips[].rot` and `moments[].rot` matches `/^-?\d+(\.\d+)?deg$/` (the value goes into the CSS custom property `--rot`; a bare number or `rotate(...)` would silently break the tilt).

Prerequisites: none (can start before [web-design-foundation](../../features/web-design-foundation.md)).

Out of scope: React components, CSS, rendering, changing any copy (copy questions go to [Q003](../../questions/questions-2026-11-10-requirement-breakdown.md#q003-homepage-copy-promises-features-that-are-not-designed)).

Security: fictional names only (`sam`, Bob, Mia...), no real User data (CLAUDE.md rule 5). No HTML in strings (rendered as text, never with `dangerouslySetInnerHTML`).

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `apps/web/src/home/content.ts` exports every name in the Scope table with the listed types; `npm run typecheck -w apps/web` exits 0. (AC5)
- [ ] 2. `npm test -w apps/web` runs and passes the five tests named in Scope. (AC5)
- [ ] 3. Every visible text string of the mockup is in `content.ts` character for character (including `’` vs `'`): E2E-2 step 1 finds all 42 unique `title`, `text`, `example`, `name`, `description` and `url` values of mockup lines 288-327, and step 2 finds every markup string it lists (hero, collage, section titles and leads, nav, footer). The per-item colors, sizes, rotations and counts are compared with lines 288-327 by the reviewer. (AC5)
- [ ] 4. `SIGN_IN_HREF` is `'/sign-in'` with the Q002 comment. (AC4)
- [ ] 5. `grep -n -E 'Dashboard|<[a-z]|dangerouslySetInnerHTML' apps/web/src/home/content.ts` prints nothing; `grep -n -E '(type|interface|const) (User|Memory|Template|Block|Photo)\b' apps/web/src/home/content.ts` prints nothing. (AC9, AC10)
- [ ] 6. Under `apps/`, the PR changes only the two files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them). Changes under `docs/` (this task's Status, `docs/tasks/Progress.md`, ticked checklist) are allowed. (AC10)
- [ ] 7. `content.ts` exports no name `Face` (`grep -n -E 'export (type|interface|const) Face\b' apps/web/src/home/content.ts` prints nothing), so it never clashes with the `Face` component of `illustrations.tsx`. (AC5)

## e2e-test-suites

Type: FE (data module, verified by commands). Run from the repo root. `Spec:`/`Testids:` per [ADR 0004](../../adr/0004-playwright-e2e-specs.md): no case opens a page, so all are prose. Every case is `Auth: none`, `Data: none`, `Visual: none` (commands only; [ui/homepage.md, Test case fields](../../ui/homepage.md#test-case-fields)).

```
E2E-1 -> checklist items 1, 2: tests and types
Spec: prose (npm commands)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: npm install done
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/content.test.ts; echo "t=$?"
  2. Run: npm run typecheck -w apps/web; echo "c=$?"
Expected: output lists "has the item counts of the mockup", "uses six-digit hex colors", "matches sample strings", "points sign-in to the placeholder", "uses degree rotations" as passed; t=0; c=0
```

```
E2E-2 -> checklist items 3, 4: copy matches the mockup
Spec: prose (shell commands)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: branch checked out; run from the repo root in a UTF-8 shell
Steps:
  1. Run (item text taken straight from the mockup's renderVals): F="$(mktemp)"; sed -n '288,327p' docs/ui/Homepage/Landing2.dc.html | grep -oE "(title|text|example|name|description|url): '[^']*'" | sed -E "s/^[a-z]+: '(.*)'\$/\1/" | sort -u > "$F"; wc -l < "$F"; while IFS= read -r s; do grep -qF -- "$s" apps/web/src/home/content.ts || echo "missing: $s"; done < "$F"; rm "$F"; echo done
  2. Run (markup text, mockup lines 66-277): for s in "SweetMemories" "Small pages for the moments worth keeping." "Who it is for" "How it works" "Templates" "Sign in" "For families, little ones and whole neighborhoods" "Every little moment deserves a " "Turn first steps, birthdays and street parties into tiny pages that everyone you love can open, share and add to." "Start with Google" "See how it works" "No password to make. It is free to look around." "Grandma, Mum and 12 cousins added photos" "sam.sweetmemories.com/bobs-first-day" "Bob's first day" "Big backpack, bigger smile." "at the gate" "new friends" "Grandma just added a photo" "Share this link" "A little corner of the internet for everyone who loves each other." "One page can be about one child, one summer or one street. Invite people in and let everyone add a piece." "From a pile of photos to a page, in four easy steps." "Start simple, or tell the whole story." "Templates are built from friendly blocks. Some are a title and a photo. Others follow a child from one to ten." "Made from building blocks" "Moments worth keeping" "A few of the small pages you could make today." "Your family name first, then a page for each memory." "Choose an address like sam.sweetmemories.com. Every memory you publish gets its own page underneath it, easy to say and easy to share at the dinner table." "Start with the memory everyone keeps telling." "It takes a template, a few photos and a few cozy minutes."; do grep -qF -- "$s" apps/web/src/home/content.ts || echo "missing: $s"; done; echo done
  3. Run: grep -n "SIGN_IN_HREF" apps/web/src/home/content.ts
Expected: step 1 prints 42 then only "done" (no "missing:" line); step 2 prints only "done"; step 3 shows the line with '/sign-in' and the comment line mentioning Q002 directly above or beside it
```

```
E2E-3 -> checklist items 5, 6, 7: no markup, no domain names, only two app files, no Face clash
Spec: prose (grep and git commands)
Testids: none
Auth: none
Data: none
Visual: none
Preconditions: PR branch checked out
Steps:
  1. Run: grep -n -E 'Dashboard|<[a-z]|dangerouslySetInnerHTML' apps/web/src/home/content.ts; echo "a=$?"
  2. Run: grep -n -E '(type|interface|const) (User|Memory|Template|Block|Photo)\b' apps/web/src/home/content.ts; echo "b=$?"
  3. Run: git diff --name-only origin/dev-v1...HEAD -- apps/
  4. Run: grep -n -E 'export (type|interface|const) Face\b' apps/web/src/home/content.ts; echo "f=$?"; grep -c 'export type FaceData' apps/web/src/home/content.ts
Expected: only "a=1"; only "b=1"; exactly apps/web/src/home/content.ts and apps/web/src/home/content.test.ts (files under docs/ may also change in the PR but are not listed by this command); only "f=1" then 1
```

## unit-tests

Vitest, colocated in `apps/web/src/home/content.test.ts` (the five tests named in Scope). Pure data checks: no DOM, no network.

Unit: `apps/web/src/home/content.ts` (all exports).

| ID | Case: input -> expected | Checklist |
|---|---|---|
| U-1 | `has the item counts of the mockup`: the exported arrays -> lengths `navLinks` 3, `hero.faceColors` 5, `audiences` 3 (each `faces` 3), `steps` 4, `templateExamples` 3, `blockChips` 6, `moments` 8, `addressRows` 4 | 1, 2 |
| U-2 | `uses six-digit hex colors`: every color field (`hero.faceColors`, `bg`, `shadow`, `line`, `paper`, `accent`, `faces[].bg`) -> matches `/^#[0-9A-F]{6}$/`; a short (`#FFF`) or named (`red`) color fails | 2, 3 |
| U-3 | `matches sample strings`: the seven sample values in Scope -> equal exactly, including U+2019 in `Grandpa’s garden` (a straight `'` fails) | 2, 3 |
| U-4 | `points sign-in to the placeholder`: `SIGN_IN_HREF` -> `'/sign-in'`; `navLinks` hrefs -> `['#who', '#how', '#templates']` (no `Dashboard.dc.html`, no bare `#`) | 2, 4 |
| U-5 | `uses degree rotations`: every `blockChips[].rot` and `moments[].rot` -> matches `/^-?\d+(\.\d+)?deg$/` (`-1.5deg` passes; `2` or `rotate(2deg)` fails) | 2 |

CLAUDE.md rule 5 (no private User data) is enforced by review of fictional names (checklist item 3), not by a unit test.

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md)
