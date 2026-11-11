---
name: docs-placement
description: Decides where a project document belongs under docs/ and how to name it. Use whenever creating, moving or updating an ADR, API reference, architecture note, feature spec, infra guide, open decision, task list, UI mockup or the Progress.md tracker.
---

# Docs placement

All project documents live under `docs/`. Pick the folder by what the document answers, not by who writes it.

## Which folder

| The document answers... | Folder | File name |
| --- | --- | --- |
| Why did we choose X over Y? | `docs/adr/` | `NNNN-short-title.md` |
| What does this endpoint take and return? | `docs/api/` | `<area>.md` (e.g. `memories.md`) |
| How is the system or repo laid out? | `docs/architecture/` | `<topic>.md` |
| What should this feature do? | `docs/features/` | `<feature-name>.md` |
| How do I set up, run, build, test or deploy? | `docs/infra/` | `<topic>.md` |
| What does the product owner still need to decide? | `docs/decisions/` | `<feature-or-adr-name>.md` |
| What steps implement a feature? | `docs/tasks/` | `<feature-name>/NN-short-title.md` |
| What should it look like? | `docs/ui/` | `<feature-name>/<asset-or-note>` |

## Steps

1. Decide the folder from the table. If two fit, split the content: the decision goes in one, the description in the other, and they link to each other.
2. Read that folder's `README.md` for its rules before writing.
3. Create or update the file with the naming above. Use lowercase kebab-case, except `Progress.md` and `README.md`.
4. Link related documents (feature ↔ tasks ↔ ADR ↔ decision ↔ ui) instead of copying content.
5. Update `docs/features/Progress.md` if a feature or task was added or changed state.
6. If the document fits no folder, ask the user. Do not invent a folder.

## Folder rules

- **adr**: one decision per file. Status is proposed, accepted or superseded. Never edit an accepted ADR; write a new one that supersedes it. Number with the next free four-digit number, never reuse one. Sections: Status, Context, Decision, Consequences.
- **api**: per endpoint, state purpose, auth, input, output and errors. Why it is shaped that way goes in an ADR.
- **architecture**: how things fit together. A single trade-off decision goes in an ADR, setup steps go in infra.
- **features**: one spec per feature: goal, status, side (backend, front-end or both), user flow, scope, user stories (ID, story, Given/When/Then scenarios; the source for the e2e tests), acceptance criteria. No implementation steps. `Progress.md` lists every feature with its spec, tasks and status (`todo`, `in progress`, `done`).
- **infra**: practical how-to only. Reasons for tool choices go in an ADR.
- **decisions**: open questions with options, a recommendation and the answer once given. When answered, record the outcome in the ADR or feature spec and mark the question answered. Do not leave accepted decisions only here.
- **tasks**: one folder per feature, one file per task, with status, side (backend or front-end), a checklist, a verification section, a mockup link if any (to `docs/ui/`) and a link to the feature spec. Tick items as they are done. Requirements belong in the feature spec.
- **ui**: mockups and design references grouped by feature. Behavior belongs in the feature spec.

## Common mistakes

- Putting a requirement in `tasks/` instead of `features/`.
- Leaving an accepted decision in `decisions/` instead of recording it in `adr/`.
- Putting setup steps in `architecture/` instead of `infra/`.
- Editing an accepted ADR instead of superseding it.
- Adding a feature or task without updating `Progress.md`.
