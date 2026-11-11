---
name: e2e-from-user-stories
description: Turns the user stories in a SweetMemories feature spec into e2e test cases and Playwright scripts, one test per Given/When/Then scenario. Use when asked to write, add or update e2e tests for a feature, task or user story, or to check that every scenario has a test.
---

# E2E tests from user stories

Each Given/When/Then scenario in a feature spec becomes exactly one e2e test. The spec is the source of truth; never invent behavior the spec does not state.

## Inputs

1. The feature spec in `docs/features/<feature-name>.md`, section **User stories**. IDs look like `US-<feature>-<n>`.
2. The task file in `docs/tasks/<feature-name>/` if the work is for one task (its acceptance criteria and Verification section).
3. `CLAUDE.md` for the security rules and domain terms.

If the spec has no user stories, or a scenario is vague or not observable, stop and report it. Do not guess. Fix the spec (via the business-analyst) first.

## Steps

1. **List scenarios.** Read every story and list each scenario with its story ID. Number them `US-<feature>-<n>.<m>` (story, scenario).
2. **Write test cases.** For each scenario, write a case with: ID, title, preconditions (Given), steps (When), expected results (Then), session needed (public, user, admin), and test data. Keep one behavior per case.
3. **Check coverage.** Every story has a happy path, a failure path, an edge case and, where relevant, a security/permission case. A story missing one is a spec gap: report it, do not fill it in silently.
4. **Load `webapp-testing`** with the Skill tool and write Playwright scripts the way it describes (Python, `networkidle` before inspecting dynamic pages, helper scripts run with `--help` first).
5. **Write the scripts.** One file per feature under `e2e/<feature-name>/`, one test function per case, named `test_<case_id>_<short_title>` with the case ID and story ID in the docstring. Do not write or run tests against production.
6. **Run them** against the dev or local URL you were given. Report pass, fail and blocked per case. A test that fails because of a real bug stays failing; never weaken an assertion to get green.
7. **Update the spec link.** If the feature spec or `docs/features/Progress.md` tracks tests, update it (load `docs-placement` first).

## Writing good cases

- **Assert what the user sees**: visible text, URL, page state, saved result after reload. Not internal implementation or CSS classes. Prefer role and label locators over selectors.
- **Be independent.** Each test sets up and cleans up its own data. Name test data clearly (for example slug `e2e-<timestamp>`) and delete it afterward.
- **Auth.** Public memory pages are tested with no cookies. App and admin pages use a storage state file. Never type real Google credentials. If no signed-in session exists, mark those cases BLOCKED with the reason.
- **Security scenarios are tests too.** For public memory pages assert no auth cookies are set, no private user data appears in the output, block CSS is scoped, and an unreviewed Template cannot be used. For slugs and uploads test reserved words, duplicates, wrong type and oversize.
- **Wizard convention.** Assert Back, Next and Save on every step, and Publish only on the last step of a draft.
- **Screenshots.** Capture one at each key step, and look at it before calling the case passed.
- Use the domain terms (User, Memory, Template, Block, Photo) in titles and messages.

## Case format

```
### US-<feature>-<n>.<m> <title>
Story: US-<feature>-<n>   Type: happy | failure | edge | security   Session: public | user | admin
Given: ...
When: ...
Then: ...
Data: ...
Script: e2e/<feature-name>/test_<...>.py::test_<case_id>_<short_title>
```

## Output

Report: the cases written (table of ID, title, type, script), coverage gaps found in the spec, and the run result per case with screenshot paths. State plainly what was not run and why.
