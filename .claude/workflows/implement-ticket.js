export const meta = {
  name: 'implement-ticket',
  description: 'Branch, implement a ticket (developer <-> reviewer loop), write e2e suite, PR + merge, test on dev with tester, fix loop, then update progress or raise an issue',
  whenToUse: 'A task under docs/tasks/ is ready to build and ship. args: string (ticket id/path/text), or {ticket, maxLoops, maxFixLoops, devUrl}',
  phases: [
    { title: 'Branch', detail: 'git-workflow: sync dev-v2 and cut a task branch' },
    { title: 'Implement', detail: 'developer <-> reviewer loop (default 5 rounds)' },
    { title: 'E2E suite', detail: 'developer writes Playwright suite via e2e-from-user-stories' },
    { title: 'Merge', detail: 'git-workflow: PR, validate CI, squash merge, wait for dev deploy' },
    { title: 'Test on dev', detail: 'tester: browser e2e on dev, evidence, compare with expectations' },
    { title: 'Fix loop', detail: 'on failure: developer fix <-> reviewer, PR, merge, retest (default 5 rounds)' },
    { title: 'Close out', detail: 'pass: update Progress.md + summary. fail: raise issue' },
  ],
}

const ticket = typeof args === 'string' ? args : args && args.ticket
if (!ticket) throw new Error('Pass the ticket as args (string or {ticket, maxLoops, maxFixLoops, devUrl}).')
const MAX_LOOPS = (args && args.maxLoops) || 5 // developer <-> reviewer rounds per cycle
const MAX_FIX_LOOPS = (args && args.maxFixLoops) || 5 // tester-fail -> fix cycles
const DEV_URL = (args && args.devUrl) || null // tester falls back to docs/infra if null

const REVIEW = {
  type: 'object',
  properties: {
    satisfied: { type: 'boolean' },
    score: { type: 'number' },
    comments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          comment: { type: 'string' },
        },
        required: ['severity', 'comment'],
      },
    },
  },
  required: ['satisfied', 'comments'],
}

const TEST_RESULT = {
  type: 'object',
  properties: {
    passed: { type: 'boolean' },
    summary: { type: 'string' },
    evidence: { type: 'array', items: { type: 'string' }, description: 'Paths to screenshots / logs / reports' },
    failures: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          scenario: { type: 'string' },
          expected: { type: 'string' },
          actual: { type: 'string' },
          evidence: { type: 'string' },
        },
        required: ['scenario', 'expected', 'actual'],
      },
    },
  },
  required: ['passed', 'summary', 'evidence', 'failures'],
}

// ---------- helpers ----------

// Developer <-> reviewer loop. `task` is what the developer must do this cycle.
async function devReviewLoop(label, task, branch) {
  let comments = []
  let satisfied = false
  let report = ''
  let rounds = 0
  for (; rounds < MAX_LOOPS && !satisfied; rounds++) {
    const n = rounds + 1
    const prompt = rounds === 0
      ? `${task}\n\nYou are on branch ${branch}. Do not switch branches, do not push, do not open a PR; commit your work on this branch in logical steps. Only finish once unit tests, lint and build pass. Return a short report: what changed, files touched, test results.`
      : `The reviewer left comments on your work on branch ${branch}. Fix every high and medium comment, and low ones where reasonable. Re-run unit tests, lint and build, then commit.\n\nComments:\n${JSON.stringify(comments, null, 2)}\n\nOriginal task:\n${task}\n\nReturn a short report of what you changed.`
    report = await agent(prompt, { agentType: 'developer', label: `${label}: dev round ${n}`, phase: label.phase })
    if (!report) throw new Error(`developer returned nothing in ${label.name} round ${n}`)

    const review = await agent(
      `Review the work on branch ${branch} for this task (diff against origin/dev-v2).\n\nTask:\n${task}\n\nDeveloper report:\n${report}\n\nReturn comments ranked high/medium/low, a score 1-10, and satisfied=true only if no high or medium issues remain.`,
      { agentType: 'reviewer', schema: REVIEW, label: `${label}: review round ${n}`, phase: label.phase },
    )
    if (!review) throw new Error(`reviewer returned nothing in ${label.name} round ${n}`)
    comments = review.comments
    satisfied = review.satisfied
    log(`${label.name} round ${n}: ${satisfied ? 'satisfied' : comments.length + ' comments'}`)
  }
  if (!satisfied) log(`${label.name}: reviewer not satisfied after ${MAX_LOOPS} rounds; continuing with remaining comments noted.`)
  return { report, satisfied, comments, rounds }
}

// Push, PR, validate CI, squash merge, then wait until dev is serving the merged commit.
function shipPrompt(branch, notes) {
  return `Load the git-workflow skill and perform "3. When the work is complete" for branch ${branch}: run lint/test/build, commit leftovers (end commit messages with the attribution line from the session reminder), push, open the PR against dev-v2 (use mattpocock-skills:pr for the body), validate CI with gh pr checks --watch, fix failures on the same branch if any (never bypass checks), and squash-merge only after checks pass. If no checks exist or the merge is blocked, stop and report instead of forcing it. Then return to dev-v2 and pull.
After the merge, wait until the dev environment is serving the merged commit (see docs/infra for how dev is deployed${DEV_URL ? `; dev URL: ${DEV_URL}` : ''}). If you cannot determine how to check, say so.
${notes}
Return: PR URL, CI result, merge status (merged true/false), dev deploy status.`
}

const MERGE_RESULT = {
  type: 'object',
  properties: {
    prUrl: { type: 'string' },
    ci: { type: 'string' },
    merged: { type: 'boolean' },
    devDeployed: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['prUrl', 'merged', 'devDeployed'],
}

// Swap this body for the MCP notification when it is installed.
async function raiseFailure(title, body) {
  return await agent(
    `Create a GitHub issue with gh issue create. Title: ${JSON.stringify(title)}. Label "bug" if the label exists (skip labels otherwise). Body (Markdown, keep verbatim):\n\n${body}\n\nReturn the issue URL.`,
    { label: 'raise issue', phase: 'Close out', effort: 'low' },
  )
}

// ---------- 1. Branch ----------
phase('Branch')
const branch = await agent(
  `Load the git-workflow skill and perform "1. Before doing anything: sync and branch" for this ticket: ${ticket}
Pick the branch type from the ticket (feat/fix/test/...), e.g. feat/<short-kebab-description>. If the working tree has changes you did not make for this task, do not discard anything; report and stop.
Return ONLY the branch name.`,
  { label: 'git: sync + branch', phase: 'Branch', effort: 'low' },
)
if (!branch) throw new Error('Could not create branch')

// ---------- 2. Implement ----------
phase('Implement')
const impl = await devReviewLoop(
  { name: 'Implement', phase: 'Implement', toString() { return 'Implement' } },
  `Implement this ticket end to end, with unit tests. Ticket: ${ticket}\nRead CLAUDE.md and the task file / parent feature spec under docs/ first.`,
  branch,
)

// ---------- 3. E2E suite ----------
phase('E2E suite')
const e2e = await devReviewLoop(
  { name: 'E2E suite', phase: 'E2E suite', toString() { return 'E2E suite' } },
  `Write the e2e test suite for this ticket's feature. Load the e2e-from-user-stories skill (.claude/skills/e2e-from-user-stories) and follow it: one Playwright test per Given/When/Then scenario from the feature's user stories, and confirm every scenario has a test. Ticket: ${ticket}`,
  branch,
)

// ---------- 4. PR + merge ----------
phase('Merge')
let merge = await agent(
  shipPrompt(branch, `Implementation notes:\n${impl.report}\nE2E notes:\n${e2e.report}`),
  { label: 'git: PR + CI + merge', phase: 'Merge', schema: MERGE_RESULT },
)
if (!merge || !merge.merged) {
  const body = `Ticket: ${ticket}\n\nBranch ${branch} could not be merged.\n\n${JSON.stringify(merge, null, 2)}`
  const issue = await raiseFailure(`Merge blocked: ${ticket.slice(0, 60)}`, body)
  return { status: 'blocked-at-merge', branch, merge, issue }
}

// ---------- 5/6. Test on dev, fix loop ----------
let result = null
let fixCycles = 0
let currentMerge = merge
for (;;) {
  const attempt = fixCycles + 1
  phase('Test on dev')
  result = await agent(
    `Test this ticket in the dev environment${DEV_URL ? ` (${DEV_URL})` : ''}, attempt ${attempt}. Follow your tester instructions: unit tests, curl checks for backend work, then browser e2e for the task and its parent feature (regression), open a real browser, capture evidence (screenshots, logs) and compare it with the expectations in the task file and feature user stories. Do not edit source files.\n\nTicket: ${ticket}\nMerged PR: ${currentMerge.prUrl}`,
    { agentType: 'tester', schema: TEST_RESULT, label: `tester attempt ${attempt}`, phase: 'Test on dev' },
  )
  if (!result) throw new Error('tester returned nothing')
  log(`Tester attempt ${attempt}: ${result.passed ? 'PASS' : result.failures.length + ' failures'}`)
  if (result.passed) break
  if (fixCycles >= MAX_FIX_LOOPS) break

  fixCycles++
  phase('Fix loop')
  const fixBranch = await agent(
    `Load the git-workflow skill and perform "1. Before doing anything: sync and branch" for a fix. Use branch fix/<short-kebab-description> based on this ticket: ${ticket} (cycle ${fixCycles}). Return ONLY the branch name.`,
    { label: `git: fix branch ${fixCycles}`, phase: 'Fix loop', effort: 'low' },
  )
  const fix = await devReviewLoop(
    { name: `Fix ${fixCycles}`, phase: 'Fix loop', toString() { return `Fix ${fixCycles}` } },
    `The tester found failures on dev for this ticket. Fix the root causes, add or adjust unit/e2e tests so they would have caught it, and do not weaken any test to get green.\nTicket: ${ticket}\nTester summary: ${result.summary}\nFailures:\n${JSON.stringify(result.failures, null, 2)}\nEvidence: ${JSON.stringify(result.evidence)}`,
    fixBranch,
  )
  currentMerge = await agent(
    shipPrompt(fixBranch, `Fix notes:\n${fix.report}`),
    { label: `git: fix PR + merge ${fixCycles}`, phase: 'Fix loop', schema: MERGE_RESULT },
  )
  if (!currentMerge || !currentMerge.merged) {
    const issue = await raiseFailure(
      `Fix merge blocked: ${ticket.slice(0, 60)}`,
      `Ticket: ${ticket}\n\nFix branch ${fixBranch} could not be merged.\n\n${JSON.stringify(currentMerge, null, 2)}\n\nLast tester result:\n${JSON.stringify(result, null, 2)}`,
    )
    return { status: 'blocked-at-fix-merge', branch, fixBranch, result, issue }
  }
}

// ---------- 7. Close out ----------
phase('Close out')
if (result.passed) {
  const closed = await agent(
    `The ticket passed testing on dev. Load docs-placement and git-workflow skills. On a new docs/ branch: set the task status to done in its task file, update docs/features/Progress.md (todo / in progress / done; a feature is done only when all its tasks are), and write a short summary of the work (what was built, PRs, test evidence paths, fix cycles: ${fixCycles}) where docs-placement says it belongs. Then commit, PR, validate CI, squash merge and return to dev-v2.\n\nTicket: ${ticket}\nTester summary: ${result.summary}\nEvidence: ${JSON.stringify(result.evidence)}\nPRs: ${merge.prUrl}${currentMerge !== merge ? ', ' + currentMerge.prUrl : ''}\n\nReturn the summary text and the docs PR URL.`,
    { label: 'update progress + summary', phase: 'Close out' },
  )
  return { status: 'passed', branch, fixCycles, result, closed }
}

const issue = await raiseFailure(
  `E2E still failing after ${MAX_FIX_LOOPS} fix cycles: ${ticket.slice(0, 60)}`,
  `Ticket: ${ticket}\n\nThe tester still fails this ticket on dev after ${MAX_FIX_LOOPS} developer/reviewer fix cycles.\n\n## Last tester summary\n${result.summary}\n\n## Failures\n${JSON.stringify(result.failures, null, 2)}\n\n## Evidence\n${JSON.stringify(result.evidence, null, 2)}\n\n## PRs\n${merge.prUrl}${currentMerge !== merge ? ', ' + currentMerge.prUrl : ''}`,
)
return { status: 'failed', branch, fixCycles, result, issue }
