export const meta = {
  name: 'implement-work',
  description: 'Implement a feature (review all its tasks, implement-ticket per task, then the feature) or a task (implement-ticket, review related feature/tasks, correct), and gate on unit + e2e tests',
  whenToUse: 'A feature or task under docs/ is ready to build. args: string (feature/task name or path), or {target, kind?: "feature"|"task", maxLoops, maxFixLoops, devUrl, maxGateRounds}',
  phases: [
    { title: 'Resolve', detail: 'find out if the target is a feature or a task, list its tasks' },
    { title: 'Review', detail: 'feature: review spec + all tasks. task: (after build) review related feature and sibling tasks' },
    { title: 'Tasks', detail: 'implement-ticket for each task, one by one, in order' },
    { title: 'Feature', detail: 'implement-ticket for the feature as a whole (user stories, regression)' },
    { title: 'Follow-up', detail: 'task mode: implement-ticket for corrections the review found' },
    { title: 'Final gate', detail: 'unit tests, lint, typecheck, build and e2e must all pass; fix loop otherwise' },
  ],
}

const target = typeof args === 'string' ? args : args && args.target
if (!target) throw new Error('Pass the feature or task as args (string or {target, kind, maxLoops, maxFixLoops, devUrl, maxGateRounds}).')
const KIND_HINT = (args && args.kind) || null
const MAX_GATE_ROUNDS = (args && args.maxGateRounds) || 3
const TICKET_OPTS = {
  maxLoops: (args && args.maxLoops) || 5,
  maxFixLoops: (args && args.maxFixLoops) || 5,
  devUrl: (args && args.devUrl) || undefined,
}

const RESOLVED = {
  type: 'object',
  properties: {
    kind: { type: 'string', enum: ['feature', 'task'] },
    featureName: { type: 'string' },
    featureSpec: { type: 'string', description: 'Path to the feature spec under docs/features/' },
    task: { type: 'string', description: 'Path to the task file (kind=task only)' },
    tasks: {
      type: 'array',
      description: 'All tasks of the feature in implementation order (for kind=task: the sibling tasks too)',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          title: { type: 'string' },
          status: { type: 'string' },
        },
        required: ['path', 'title'],
      },
    },
  },
  required: ['kind', 'featureName', 'featureSpec', 'tasks'],
}

const REVIEW = {
  type: 'object',
  properties: {
    satisfied: { type: 'boolean' },
    summary: { type: 'string' },
    taskChanges: {
      type: 'array',
      description: 'Tasks that must be corrected or modified (code, tests or task file). Tasks that are fine are omitted.',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          change: { type: 'string', description: 'What to correct or modify, concretely' },
        },
        required: ['path', 'severity', 'change'],
      },
    },
    featureChanges: {
      type: 'array',
      description: 'Changes needed at feature level (spec, cross-task gaps, missing tasks, user stories without a test)',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          change: { type: 'string' },
        },
        required: ['severity', 'change'],
      },
    },
  },
  required: ['satisfied', 'summary', 'taskChanges', 'featureChanges'],
}

const GATE = {
  type: 'object',
  properties: {
    passed: { type: 'boolean' },
    unit: { type: 'string', description: 'pnpm test result' },
    lintTypecheckBuild: { type: 'string' },
    e2e: { type: 'string', description: 'e2e result on dev (counts passed/failed)' },
    summary: { type: 'string' },
    failures: { type: 'array', items: { type: 'string' } },
    evidence: { type: 'array', items: { type: 'string' } },
  },
  required: ['passed', 'summary', 'failures'],
}

const ok = (r) => r && (r.status === 'passed')
const results = { tasks: [], feature: null, followUps: [], gate: [] }

// Runs implement-ticket as a sub-workflow. A ticket may already be (partly) built:
// the developer must verify first and only change what is missing or wrong.
async function ticket(text, label) {
  log(`implement-ticket: ${label}`)
  const r = await workflow('implement-ticket', { ticket: text, ...TICKET_OPTS })
  log(`implement-ticket ${label}: ${r && r.status}`)
  return r
}

const EXISTING_NOTE =
  'It may already be fully or partly implemented (check git log, the code, tests and its status in docs/features/Progress.md first). ' +
  'Do the work if missing, correct it if wrong, modify it if the review notes below require it, and leave what is already correct alone. Do not weaken tests.'

// ---------- 0. Resolve ----------
phase('Resolve')
const resolved = await agent(
  `Resolve this target in the SweetMemories docs: ${JSON.stringify(target)}${KIND_HINT ? ` (caller says it is a ${KIND_HINT})` : ''}.
Look in docs/features/ (specs, Progress.md) and docs/tasks/<feature>/. Decide if it is a feature or a single task. Return the feature name, its spec path, and ALL tasks of that feature in implementation order (numeric prefix order) with their status from Progress.md / the task file. For a task, also return its own path in "task". Do not change anything.`,
  { label: 'resolve target', phase: 'Resolve', schema: RESOLVED, effort: 'low' },
)
if (!resolved) throw new Error('Could not resolve target')
const kind = KIND_HINT || resolved.kind
log(`Target is ${kind} "${resolved.featureName}" with ${resolved.tasks.length} tasks`)

const taskList = resolved.tasks.map((t) => `- ${t.path} (${t.title}; ${t.status || 'status unknown'})`).join('\n')

if (kind === 'feature') {
  // ---------- 1. Review all tasks of the feature ----------
  phase('Review')
  const review = await agent(
    `Review feature "${resolved.featureName}" before it is built. Read the spec ${resolved.featureSpec}, its decisions/ADRs, and EVERY task:\n${taskList}\n
Check: every user story / Given-When-Then is covered by a task; tasks are in a buildable order; each task is small, testable and has acceptance criteria; no task contradicts CLAUDE.md, docs/architecture/RULES.md (security rules!) or the stack; tasks already marked done really match the spec and the code.
Return per-task changes (only for tasks that need correcting or modifying, with concrete instructions) and feature-level changes (missing tasks, spec gaps). satisfied=true only if no high or medium item remains. Do not edit files.`,
    { agentType: 'business-analyst-reviewer', label: 'review feature + tasks', phase: 'Review', schema: REVIEW },
  )
  if (!review) throw new Error('feature review returned nothing')
  log(`Feature review: ${review.taskChanges.length} task changes, ${review.featureChanges.length} feature changes`)

  // Missing tasks / spec gaps are documentation changes: let the analyst fix them on a docs branch first.
  const docChanges = review.featureChanges.filter((c) => c.severity !== 'low')
  if (docChanges.length) {
    await agent(
      `Load the git-workflow and docs-placement skills. On a new docs/ branch, update the feature spec and add or edit the task files of feature "${resolved.featureName}" for these review findings, update docs/features/Progress.md, then PR, validate CI, squash-merge and return to dev-v2. If a finding needs a product decision, record it as an open question in docs/decisions per docs-placement instead of guessing.\n\nFindings:\n${JSON.stringify(docChanges, null, 2)}`,
      { label: 'docs: apply feature review', phase: 'Review' },
    )
  }

  // ---------- 2. Each task, one by one (merges land on dev-v2, so strictly sequential) ----------
  phase('Tasks')
  for (const t of resolved.tasks) {
    const notes = review.taskChanges.filter((c) => c.path === t.path)
    const text = `Task ${t.path} (${t.title}) of feature ${resolved.featureName}. ${EXISTING_NOTE}${notes.length ? `\n\nReview notes to apply:\n${JSON.stringify(notes, null, 2)}` : ''}`
    const r = await ticket(text, t.path)
    results.tasks.push({ path: t.path, status: r && r.status })
    if (!ok(r)) {
      return { status: 'blocked-at-task', task: t.path, results, review }
    }
  }

  // ---------- 3. The feature as a whole ----------
  phase('Feature')
  const featureText = `Feature ${resolved.featureName} as a whole (spec ${resolved.featureSpec}). All its tasks are merged. Verify every user story / Given-When-Then scenario end to end (unit tests, e2e suite with one test per scenario, e2e on dev), plus regression of earlier features. ${EXISTING_NOTE} Correct or complete anything the tasks missed at feature level (integration gaps, missing e2e scenarios, wrong wiring), then mark the feature done in docs/features/Progress.md only when all its tasks are done.${review.featureChanges.length ? `\n\nFeature-level review notes:\n${JSON.stringify(review.featureChanges, null, 2)}` : ''}`
  results.feature = await ticket(featureText, `feature ${resolved.featureName}`)
  if (!ok(results.feature)) return { status: 'blocked-at-feature', results, review }
} else {
  // ---------- 1. Implement the task ----------
  phase('Tasks')
  const r = await ticket(`Task ${resolved.task || target}. ${EXISTING_NOTE}`, resolved.task || target)
  results.tasks.push({ path: resolved.task || target, status: r && r.status })
  if (!ok(r)) return { status: 'blocked-at-task', results }

  // ---------- 2. Review the feature and sibling tasks affected by the change ----------
  phase('Review')
  const review = await agent(
    `Task ${resolved.task || target} of feature "${resolved.featureName}" was just implemented and merged. Review what it changed against the rest of the feature (spec ${resolved.featureSpec}) and its sibling tasks:\n${taskList}\n
Use git log / the merged PR diff. Find: sibling tasks whose assumptions, files, copy, routes, tokens or tests are now wrong or duplicated; user stories now uncovered or broken; docs (spec, task files, Progress.md, infra) that are now stale; regressions in already-done tasks. Return per-task changes (path + concrete correction) and feature-level changes. satisfied=true only if nothing high or medium remains. Do not edit files.`,
    { agentType: 'reviewer', label: 'review feature + sibling tasks', phase: 'Review', schema: REVIEW },
  )
  if (!review) throw new Error('related-changes review returned nothing')
  log(`Related review: ${review.taskChanges.length} task changes, ${review.featureChanges.length} feature changes`)

  // ---------- 3. Correct what the review found ----------
  phase('Follow-up')
  for (const c of review.taskChanges.filter((c) => c.severity !== 'low')) {
    const fr = await ticket(`Correct task ${c.path} of feature ${resolved.featureName} after a change to ${resolved.task || target}. ${EXISTING_NOTE}\n\nRequired change:\n${c.change}`, `fix ${c.path}`)
    results.followUps.push({ path: c.path, status: fr && fr.status })
    if (!ok(fr)) return { status: 'blocked-at-followup', path: c.path, results, review }
  }
  const featureNotes = review.featureChanges.filter((c) => c.severity !== 'low')
  if (featureNotes.length || review.taskChanges.length) {
    results.feature = await ticket(
      `Feature ${resolved.featureName} as a whole (spec ${resolved.featureSpec}) after a change to ${resolved.task || target}. Verify all user stories end to end and regression; correct or modify feature-level gaps. ${EXISTING_NOTE}${featureNotes.length ? `\n\nFeature-level review notes:\n${JSON.stringify(featureNotes, null, 2)}` : ''}`,
      `feature ${resolved.featureName}`,
    )
    if (!ok(results.feature)) return { status: 'blocked-at-feature', results, review }
  }
}

// ---------- Final gate: everything green, unit AND e2e ----------
phase('Final gate')
let gate = null
for (let round = 1; round <= MAX_GATE_ROUNDS; round++) {
  gate = await agent(
    `Final gate for ${kind} "${resolved.featureName}"${kind === 'task' ? ` (task ${resolved.task || target})` : ''}. On an up-to-date dev-v2 (git pull) run, in this order, and report the real output counts:
1. pnpm lint, pnpm typecheck, pnpm build
2. pnpm test (ALL unit tests, not only this feature's)
3. The FULL e2e suite (Python Playwright + pytest, see e2e/README.md) against the dev environment${TICKET_OPTS.devUrl ? ` (${TICKET_OPTS.devUrl})` : ''}, after confirming dev serves the latest dev-v2 commit (docs/infra/dev-environment.md). Capture screenshots/logs for any failure.
passed=true ONLY if every one of these is green with zero failures and zero skipped-because-broken tests. Do not edit source files and do not rerun until green by luck: a flaky test is a failure to report.`,
    { agentType: 'tester', label: `final gate round ${round}`, phase: 'Final gate', schema: GATE },
  )
  if (!gate) throw new Error('final gate returned nothing')
  results.gate.push({ round, passed: gate.passed, summary: gate.summary })
  log(`Final gate round ${round}: ${gate.passed ? 'ALL GREEN' : gate.failures.length + ' failures'}`)
  if (gate.passed) break
  if (round === MAX_GATE_ROUNDS) break

  const fr = await ticket(
    `Fix failing tests found by the final gate for ${kind} "${resolved.featureName}". Fix root causes (code or tests that are genuinely wrong), never weaken or skip a test to get green.\n\nGate summary: ${gate.summary}\nunit: ${gate.unit || 'n/a'}\nlint/typecheck/build: ${gate.lintTypecheckBuild || 'n/a'}\ne2e: ${gate.e2e || 'n/a'}\nFailures:\n${JSON.stringify(gate.failures, null, 2)}\nEvidence: ${JSON.stringify(gate.evidence || [])}`,
    `gate fix ${round}`,
  )
  results.followUps.push({ path: `gate fix ${round}`, status: fr && fr.status })
  if (!ok(fr)) break
}

if (!gate || !gate.passed) {
  const issue = await agent(
    `Create a GitHub issue with gh issue create. Title: ${JSON.stringify(`Tests still failing after implementing ${resolved.featureName}`)}. Label "bug" if it exists. Body (Markdown, keep verbatim):\n\nTarget: ${target}\n\n## Last gate result\n${JSON.stringify(gate, null, 2)}\n\n## Run\n${JSON.stringify(results, null, 2)}\n\nReturn the issue URL.`,
    { label: 'raise issue', phase: 'Final gate', effort: 'low' },
  )
  return { status: 'failed', kind, results, gate, issue }
}
return { status: 'passed', kind, feature: resolved.featureName, results, gate }
