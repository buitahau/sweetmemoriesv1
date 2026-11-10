# Add home content

- Status: not-started

## Goal

Create `apps/web/src/home/content.ts`: every visible string and every per-item value (colors, sizes, rotations) of the Homepage as typed constants, copied from the mockup.

## Scope

Area: UI (data module + unit test). Decision: [ADR 0003](../../adr/0003-frontend-styling-and-self-hosted-fonts.md), Static content and Sign-in links rows. Source: [Landing2.dc.html](../../ui/Homepage/Landing2.dc.html), line numbers below.

Files: `apps/web/src/home/content.ts` (new), `apps/web/src/home/content.test.ts` (new). Nothing else.

`content.ts` exports exactly these (TypeScript, `export const` / `export type`; strings copied character for character, including `’` U+2019 where the mockup has it and the straight `'` in `Bob's first day`):

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

Prerequisites: none (can start before [web-design-foundation](../../features/web-design-foundation.md)).

Out of scope: React components, CSS, rendering, changing any copy (copy questions go to [Q003](../../questions/questions-2026-11-10-requirement-breakdown.md#q003-homepage-copy-promises-features-that-are-not-designed)).

Security: fictional names only (`sam`, Bob, Mia...), no real User data (CLAUDE.md rule 5). No HTML in strings (rendered as text, never with `dangerouslySetInnerHTML`).

## Verification checklist

The task is complete only when every item below passes. Tags name the [homepage](../../features/homepage.md) acceptance criterion (ACn).

- [ ] 1. `apps/web/src/home/content.ts` exports every name in the Scope table with the listed types; `npm run typecheck -w apps/web` exits 0. (AC5)
- [ ] 2. `npm test -w apps/web` runs and passes the four tests named in Scope. (AC5)
- [ ] 3. Every string in `content.ts` equals the mockup text at the listed line (reviewer compares each, including `’` vs `'`). (AC5)
- [ ] 4. `SIGN_IN_HREF` is `'/sign-in'` with the Q002 comment. (AC4)
- [ ] 5. `grep -n -E 'Dashboard|<[a-z]|dangerouslySetInnerHTML' apps/web/src/home/content.ts` prints nothing; `grep -n -E '(type|interface|const) (User|Memory|Template|Block|Photo)\b' apps/web/src/home/content.ts` prints nothing. (AC9, AC10)
- [ ] 6. Under `apps/`, the PR changes only the two files in Scope (`git diff --name-only origin/dev-v1...HEAD -- apps/` lists exactly them). Changes under `docs/` (this task's Status, `docs/tasks/Progress.md`, ticked checklist) are allowed. (AC10)
- [ ] 7. `content.ts` exports no name `Face` (`grep -n -E 'export (type|interface|const) Face\b' apps/web/src/home/content.ts` prints nothing), so it never clashes with the `Face` component of `illustrations.tsx`. (AC5)

## e2e-test-suites

Type: FE (data module, verified by commands). Run from the repo root.

```
E2E-1 -> checklist items 1, 2: tests and types
Preconditions: npm install done
Steps:
  1. Run: npm test -w apps/web -- --reporter=verbose src/home/content.test.ts; echo "t=$?"
  2. Run: npm run typecheck -w apps/web; echo "c=$?"
Expected: output lists "has the item counts of the mockup", "uses six-digit hex colors", "matches sample strings", "points sign-in to the placeholder" as passed; t=0; c=0
```

```
E2E-2 -> checklist items 3, 4: copy matches the mockup
Preconditions: branch checked out
Steps:
  1. Run: for s in "For families, little ones and whole neighborhoods" "No password to make. It is free to look around." "Grandma, Mum and 12 cousins added photos" "sam.sweetmemories.com/bobs-first-day" "Bob's first day" "Big backpack, bigger smile." "One page can be about one child, one summer or one street. Invite people in and let everyone add a piece." "Templates are built from friendly blocks. Some are a title and a photo. Others follow a child from one to ten." "It takes a template, a few photos and a few cozy minutes." "Nana’s recipes" "Curved timeline"; do grep -qF "$s" apps/web/src/home/content.ts || echo "missing: $s"; done; echo done
  2. Run: grep -n "SIGN_IN_HREF" apps/web/src/home/content.ts
Expected: step 1 prints only "done"; step 2 shows the line with '/sign-in' and the comment line mentioning Q002 directly above or beside it
```

```
E2E-3 -> checklist items 5, 6, 7: no markup, no domain names, only two app files, no Face clash
Preconditions: PR branch checked out
Steps:
  1. Run: grep -n -E 'Dashboard|<[a-z]|dangerouslySetInnerHTML' apps/web/src/home/content.ts; echo "a=$?"
  2. Run: grep -n -E '(type|interface|const) (User|Memory|Template|Block|Photo)\b' apps/web/src/home/content.ts; echo "b=$?"
  3. Run: git diff --name-only origin/dev-v1...HEAD -- apps/
  4. Run: grep -n -E 'export (type|interface|const) Face\b' apps/web/src/home/content.ts; echo "f=$?"; grep -c 'export type FaceData' apps/web/src/home/content.ts
Expected: only "a=1"; only "b=1"; exactly apps/web/src/home/content.ts and apps/web/src/home/content.test.ts (files under docs/ may also change in the PR but are not listed by this command); only "f=1" then 1
```

## Links

- Feature: [homepage](../../features/homepage.md)
- ADR: [0003-frontend-styling-and-self-hosted-fonts](../../adr/0003-frontend-styling-and-self-hosted-fonts.md)
- UI: [homepage](../../ui/homepage.md)
