---
name: implement-and-test-ticket
description: Implement a ticket (ADR, feature or task), deploy it to dev, test it and loop until it passes. Runs the implement-ticket workflow, waits ~3 minutes for CI and the dev deploy, spawns the tester agent, compares the evidence with the ticket goal and mockup, loops back with the gap on failure, then updates the ticket status and writes a summary. Use when the user asks to implement and verify/test a ticket end to end.
---

# Implement and test ticket

Input: the ticket as a path or slug. Ask if none is given.

## Step 1: Read the ticket

Read the ticket plus its feature/ADR, checklist and any mockup under `docs/ui`. Write down the **goal** and **purpose**, and the acceptance points the tester must prove. Find the dev environment base URL in `docs/infra` or `docs/questions`; if unknown, ask the user. Never guess.

Also decide which `e2e-test-suites` cases are spec-eligible ([ADR 0004](../../../docs/adr/0004-playwright-e2e-specs.md)): FE case, no authentication, no data writes, not a visual-fidelity comparison. Each case carries `Spec: <path>` or `Spec: prose`; the spec file is `e2e/specs/<feature-slug>/<feature-or-task-slug>.spec.ts` and test titles start with `<ticket-slug> E2E-n`. BE tickets have no specs (curl suites).

## Step 1b: Author specs first (FE tickets with spec-eligible cases)

Specs are written before the implementation, in their own small PR, so `implement-ticket` stays unchanged and the implementer never sees or edits them.

1. `git fetch origin`; `git checkout -b test/<slug>-specs origin/dev-v1`.
2. Spawn the `tester` in **author mode** with the ticket path only (no diff, no implementation hints, no merge commit). It writes `e2e/specs/<feature-slug>/<feature-or-task-slug>.spec.ts` from the ticket, runs `npm --prefix e2e run list` to prove it parses, and reports. It may fail against dev now, since the code does not exist yet; that is expected.
3. Commit, push, open a PR into `dev-v1`, have the `reviewer` agent review it (one round, read-only), check `gh pr checks`, then `gh pr merge --squash --delete-branch`. Same rules as `implement-ticket` step 5 (no force-merge, no bypass). Specs are not run in CI.
4. Then continue with step 2 from a fresh `origin/dev-v1`.

Skip this step only when every spec-eligible case ID already has a matching `test()` title (`<ticket-slug> E2E-n`) in the spec file, or no case is spec-eligible. A spec file that exists but lacks some IDs is not skipped.

## Step 2: Execute the implement-ticket workflow

Invoke the `implement-ticket` skill for this ticket (branch from `dev-v1`, implement, review, fix, PR, merge). On loop iterations pass the gap from step 6 so the implementer fixes it. If it stops (blocked, unresolved Blocker/Major, merge refused), stop and report.

## Step 3: Wait for CI and deploy

Wait about 3 minutes (background sleep, no busy poll). Then check `gh run list --branch dev-v1 --limit 3` for the CI/deploy run on the merge commit. If still running, wait 2 more minutes, at most 3 extra checks. A failed CI/deploy counts as a failed test: go to step 6 with `gh run view <id> --log-failed`.

## Step 4: Test

Spawn the `tester` agent with the ticket path, the dev URL and the merge commit. It runs in **test mode**: first only the current ticket's spec file (a feature's spec file only when the ticket is the feature; `BASE_URL=$DEV_WEB_URL`, JSON report at `e2e/test-results/report.json`), then tests the remaining prose cases and checklist items by hand. It reports Pass/Fail/Blocked with evidence (responses, logs, screenshots, report excerpts, text). The tester never edits `e2e/` in this mode. A spec that is broken, wrong or missing is a test problem: the tester reports it, and the fix goes through a fresh author-mode run in a small `test/<slug>-specs-fix-<n>` PR as in step 1b, not through the implementer. Spec-fix PRs do not count toward the 3 cycles; cap them at 2 per run, then report the spec as blocked. If items are Blocked by the environment, not the code, report to the user instead of looping.

## Step 5: Compare with goal and mockup

Judge the evidence yourself against the ticket goal and the mockup, not just the tester's verdict. Map only this ticket's case IDs (`<ticket-slug> E2E-n`) in the JSON report to the checklist items it proves (`E2E-n -> checklist item m` in the ticket); a failed spec fails its items, and a checklist item that no case (spec or prose) proves counts as a fail. Check each checklist item and visible behaviour/layout against the mockup. Result: **pass** only if the goal is met and nothing in the checklist fails. Otherwise **fail**.

## Step 6: On fail, analyze and loop

For each gap: the item, expected vs actual, reproduction steps, evidence, and suspected cause with `file:line` (confirm by reading code). Separate real defects from test/environment problems; only defects go back. Record the gap in the session's `docs/questions/questions-<YYYY-MM-DD>-<topic>.md` per the `writing-docs` skill. Then return to step 2 with the gap on a new fix branch and repeat steps 2-5.

Stop after 3 full cycles. If still failing, report what passes, what fails, the evidence and the likely cause; do not keep merging.

## Step 7: Update status and summarize

Update the ticket's status field (per `writing-docs` conventions) to done/verified, or to failed/blocked with the reason, and tick the checklist items that passed. Write a short summary in the ticket: what was built, PR links, test evidence, cycles taken, leftovers. 
Then update the two progress files with the same status and today's date (`YYYY-MM-DD`) in the `Updated` column. Keep their existing table format, and change only the rows of this ticket:

- `docs/tasks/Progress.md`: the ticket's row in its feature section (`| [slug](feature/slug.md) | <status> | <date> |`). For a feature or ADR ticket, update every task row of that feature that the run completed.
- `docs/features/Progress.md`: the feature's row. Set `Tasks done` to `<done>/<total>` counted from `docs/tasks/Progress.md`. Set the feature status to `done` only when all its tasks are `done` and its checklist passed; `in-progress` when some are done; `blocked` or `failed` with the cause in the ticket otherwise.

Use the same status words already in the tables (`not-started`, `in-progress`, `done`, `blocked`, `failed`); never invent others. The status in the progress files must match the ticket file. Do this also when the result is failed or blocked. Commit the changes on a small docs branch and merge them through a PR into `dev-v1` like any other change (no direct push). Then report:

```
ticket: <slug>
result: passed | failed after <n> cycles | blocked
PRs: <links>
test: <pass/fail/blocked counts>
gaps left: <list or none>
```

## Rules

- All rules of `implement-ticket` apply (only `dev-v1`, no skipped review or CI).
- The tester only tests (it edits `e2e/` only in author mode, never in test mode, and never application code); the implementer only changes application code and adds the `data-testid` values the ticket lists (never edits `e2e/`). Pass information through prompts.
- Never report a pass you did not see in evidence.
- Never leave the progress files out of date at the end of a run.
