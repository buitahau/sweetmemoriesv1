---
name: writing-docs
description: Write and maintain project documentation under docs/. Use when creating or editing architecture notes, API docs, infra docs, ADRs, feature specs, tasks, UI/mockup docs, or when starting, resuming or pausing implementation of a feature or task (one questions file per session for humans).
model: haiku
---

# Writing docs

All documentation lives under `docs/`. Pick the folder by content, not by who asked.

```
docs/
  architecture/            system design, data model, boundaries
    diagrams/              diagram sources + exports (.mmd, .svg, .png)
  api/                     endpoints, request/response shapes, auth
  infra/                   hosting, DNS/subdomains, Neon, S3, env vars, deploys
  adr/                     architecture decision records
  features/                what a feature does and why (product spec)
    Progress.md            status board of all features
  tasks/                   concrete units of work, grouped per feature: tasks/<feature-slug>/<task>.md
    Progress.md            status board of all tasks
  ui/                      screens, flows, copy
    mockup/                mockup exports and notes
  questions/               open questions for humans, one file per session (see below)
```

Before writing, check the target folder for an existing doc on the topic. Update it instead of creating a duplicate. Link related docs with relative paths.

## Naming

- kebab-case, `.md`. Name by topic: `memory-wizard.md`, `custom-block-editor.md`.
- Tasks live in a folder named after their feature: `docs/tasks/<feature-slug>/<task-name>.md` (e.g. `docs/tasks/memory-wizard/add-step-navigation.md`). `<feature-slug>` is the feature doc's name without `.md`. Create the folder first if it does not exist. Never put task files directly in `docs/tasks/` (only `Progress.md` lives there).
- Status boards are named exactly `Progress.md` (capital P): `docs/features/Progress.md` and `docs/tasks/Progress.md`. They are not feature or task docs.
- ADRs: `NNNN-short-title.md`, numbered sequentially (`0001-use-neon.md`). Never renumber or delete; supersede instead.
- Diagrams: `docs/architecture/diagrams/<topic>.mmd` (Mermaid preferred) and embed or link from the owning doc.

## Templates

**Feature** (`features/`): Status · Summary · User story · Behavior · Out of scope · Related (ADRs, API, UI, tasks).

**Task** (`tasks/<feature-slug>/`): Status · Goal · Scope · Acceptance criteria (checklist) · Links to feature/ADR.

Both start with a status line right under the title:

```markdown
- Status: not-started | in-progress | blocked | done
```

Update it in the same change as the work. A feature is `done` only when all its tasks are `done`.

## Progress.md: status boards

`docs/features/Progress.md` and `docs/tasks/Progress.md` each hold one table, one row per doc, so status is visible at a glance. The doc's own `Status` line is the source of truth; keep the board in sync whenever you create, rename, delete or change the status of a feature or task.

`docs/features/Progress.md`:

```markdown
# Feature progress

| Feature | Status | Tasks done | Updated |
|---|---|---|---|
| [memory-wizard](memory-wizard.md) | in-progress | 2/5 | YYYY-MM-DD |
```

`docs/tasks/Progress.md` (group by feature, one section per `<feature-slug>`):

```markdown
# Task progress

## memory-wizard
| Task | Status | Updated |
|---|---|---|
| [add-step-navigation](memory-wizard/add-step-navigation.md) | done | YYYY-MM-DD |
```

Status values are the same everywhere: `not-started`, `in-progress`, `blocked`, `done`.

**API** (`api/`): Purpose · Auth · Endpoints (method, path, request, response, errors) · Notes.

**Infra** (`infra/`): What · Where it runs · Config/env vars (names only, never secrets) · How to change it.

**ADR** (`adr/`): Status (proposed/accepted/superseded by NNNN) · Context · Decision · Consequences · Alternatives.

**Architecture / UI**: lead with a short overview, then details. Put images in `diagrams/` or `mockup/`.

## Questions folder: handoff between agents and humans

`docs/questions/` holds the questions agents cannot decide alone. There is no per-feature progress file: status lives in the feature/task `Status` line and in `Progress.md`.

```
docs/questions/
  questions-<YYYY-MM-DD>-<topic>.md  ALL questions of one session, across every feature, one file
```

**One questions file per session.** The human answers in one place, so never create one file per question, per feature or per agent. At the first question of a session, create `docs/questions/questions-<YYYY-MM-DD>-<topic>.md` (`<topic>` is a short kebab-case name for the session's work). Every later question in that session, from any feature or any subagent, is appended to that same file. Before creating one, check `docs/questions/` for a questions file that already exists from this session (or that you were told to use) and reuse it. When you spawn subagents, give them the file's path so they append instead of creating their own. Questions are numbered Q001, Q002... within the file and each names its feature.

### While working
Keep the feature/task `Status` line and its `Progress.md` row current, and tick the task's checklist. Do not create other progress or log files.

### When you have a concern or are unsure
Do not guess on anything that is the user's decision. Instead:

1. Append a section to the session's questions file (create it with a `# Questions: <topic> (YYYY-MM-DD)` heading if missing, see above). Use the next free number in that file:

```markdown
## QNNN: <title>

- Feature: <slug>
- Status: open | answered
- Asked: YYYY-MM-DD
- Blocks: <checklist item or "nothing, using default below">

**Question**: Clear, self-contained. Include what you found and why it matters.

**Options**
1. A: pros/cons (recommended)
2. B: pros/cons

**Default if unanswered**: what the agent will assume if work must continue.

**Answer**: _(human fills in)_

---
```

2. Set the task Status to `blocked` if work cannot continue; otherwise continue on unrelated checklist items.
3. Stop on the blocked part and tell the user the questions file path and the question number. At the end of the session, give the user the one file path to answer in.

### When resuming
1. Read every `docs/questions/questions-*.md` that has questions for this feature.
2. For each of this feature's questions with an Answer: set its Status to `answered`, apply the answer, and if it is a lasting design decision, write or update an ADR in `docs/adr/` (or the owning feature/API/infra doc).
3. Once every question in a questions file is answered and applied, delete that file. Do not delete it while any question in it, for any feature, is still open.
4. Continue from the first unchecked checklist item. Do not redo checked items.

### When finished
Set Status to `done` (in the feature/task doc and `Progress.md`), tick everything, and make sure lasting knowledge is in `features/`, `api/`, `adr/` etc. Delete answered questions; remove the questions file only if nothing else in it is open.

## Playwright specs

FE tickets ([ADR 0004](../../../docs/adr/0004-playwright-e2e-specs.md)): each case in `e2e-test-suites` has `Spec: <path>` or `Spec: prose`, and `Testids: <list>` (kebab-case, or `none`). A case is spec-eligible only if it needs no sign-in, writes no data and is not a mockup comparison. Specs live in `e2e/specs/<feature-slug>/<feature-or-task-slug>.spec.ts`; each `test()` title starts with the ticket slug and case ID (`homepage E2E-1 ...`). Docs say which specs exist; do not copy spec code into docs. Keep the case's Expected line exact enough to become an assertion.

## Rules

- Docs describe the current truth. Update the doc in the same change as the code or design it describes.
- Never put secrets, tokens or real user data in docs.
- Match terms in `CLAUDE.md` (User, Memory, Template, Block, Photo).
- Be concise: lists and tables over prose, no filler.
