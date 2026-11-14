# 11 Retire the old "SweetMemories home page" assertions

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** 02 and 03 (lands in the same PR as 03; task 02 keeps the old `h1`)
**Feature spec:** [homepage](../../features/homepage.md)
**Mockup:** none

## What to change

Land in the same PR as [03](03-hero.md), which removes the old "SweetMemories home page" `h1` (task 02 keeps it), otherwise CI and the dev smoke tests go red.

Update every spec, test and doc that asserts the old heading. Leave the historical task files unchanged (`docs/tasks/project-skeleton/03-*`, `04-*`, `docs/tasks/dev-deploy/03-*`).

## Checklist

- [ ] `src/components/home-page.test.tsx`: assert the new `h1`, or delete it if task 03's section tests replace it
- [ ] `e2e/project-skeleton/test_project_skeleton.py`: set `HEADING` to "Every little moment deserves a home."
- [ ] `e2e/dev-deploy/test_dev_deploy.py`: set `HEADING` (line 34, used as the `h1` assertion around line 91) to the new heading
- [ ] `docs/features/project-skeleton.md`: Side line, Goal, US-skeleton-2 scenarios 1, 3 and 6 and acceptance criteria use the new heading, or mark scenarios 1 and 3 as superseded by US-homepage-1; keep scenarios 2, 4, 5 and the 404 check
- [ ] `docs/features/dev-deploy.md` line 30 ("Live on dev"): update the expected heading
- [ ] `docs/infra/local-development.md` line 36: update the setup check
- [ ] Progress.md rows for `homepage` and `homepage-seo` kept in sync

## Verification

- [ ] `pnpm test` is green.
- [ ] `pytest e2e/project-skeleton` passes locally (`pnpm build && pnpm start`).
- [ ] After merge and deploy, `pytest e2e/dev-deploy` passes against dev (`E2E_BASE_URL` set to the dev URL).
- [ ] US-skeleton-2.6 still asserts that "Page not found" is shown and the home `h1` is not.
- [ ] `grep -rn "SweetMemories home page" src e2e docs/features docs/infra` returns nothing.
