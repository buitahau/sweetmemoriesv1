---
name: implement-and-test-ticket
description: Implement a ticket (ADR, feature or task), deploy it to dev, test it and loop until it passes. Runs the implement-ticket workflow, waits ~3 minutes for CI and the dev deploy, spawns the tester agent, compares the evidence with the ticket goal and mockup, loops back with the gap on failure, then updates the ticket status and writes a summary. Use when the user asks to implement and verify/test a ticket end to end.
---

# Implement and test ticket

Input: the ticket as a path or slug. Ask if none is given.

## Step 1: Read the ticket

Read the ticket plus its feature/ADR, checklist and any mockup under `docs/ui`. Write down the **goal** and **purpose**, and the acceptance points the tester must prove. Find the dev environment base URL in `docs/infra` or `docs/questions`; if unknown, ask the user. Never guess.

## Step 2: Execute the implement-ticket workflow

Invoke the `implement-ticket` skill for this ticket (branch from `dev-v1`, implement, review, fix, PR, merge). On loop iterations pass the gap from step 6 so the implementer fixes it. If it stops (blocked, unresolved Blocker/Major, merge refused), stop and report.

## Step 3: Wait for CI and deploy

Wait about 3 minutes (background sleep, no busy poll). Then check `gh run list --branch dev-v1 --limit 3` for the CI/deploy run on the merge commit. If still running, wait 2 more minutes, at most 3 extra checks. A failed CI/deploy counts as a failed test: go to step 6 with `gh run view <id> --log-failed`.

## Step 4: Test

Spawn the `tester` agent with the ticket path, the dev URL and the merge commit. It tests every checklist item and reports Pass/Fail/Blocked with evidence (responses, logs, screenshots or text). If items are Blocked by the environment, not the code, report to the user instead of looping.

## Step 5: Compare with goal and mockup

Judge the evidence yourself against the ticket goal and the mockup, not just the tester's verdict. Check each checklist item and visible behaviour/layout against the mockup. Result: **pass** only if the goal is met and nothing in the checklist fails. Otherwise **fail**.

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
- The tester only tests; the implementer only changes code. Pass information through prompts.
- Never report a pass you did not see in evidence.
- Never leave the progress files out of date at the end of a run.
