export const meta = {
  name: 'requirement-breakdown',
  description: 'Branch, analyze a requirement (BA <-> reviewer loop), write docs + open-question files, then PR and merge',
  whenToUse: 'A new requirement needs to be broken into ADRs, features and tasks and documented under docs/. args: string, or {requirement, maxLoops}',
  phases: [
    { title: 'Branch', detail: 'git-workflow: sync dev-v2 and cut a docs branch' },
    { title: 'Analyze', detail: 'business-analyst <-> business-analyst-reviewer loop (default 5 rounds)' },
    { title: 'Document', detail: 'docs-placement: write/update docs and open-question files' },
    { title: 'Merge', detail: 'git-workflow: commit, PR, CI, squash merge' },
  ],
}

const requirement = typeof args === 'string' ? args : args && args.requirement
if (!requirement) throw new Error('Pass the requirement as args (string or {requirement, maxLoops}).')
const MAX_LOOPS = (args && args.maxLoops) || 5

const BREAKDOWN = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    slug: { type: 'string', description: 'short-kebab-case name for the requirement' },
    breakdown: { type: 'string', description: 'Full Markdown breakdown: summary, ADRs (with status), features (with status, side backend/front-end/both, and user stories with Given/When/Then scenarios), tasks (with status, side, verification, mockup if any) and acceptance criteria' },
    questions: {
      type: 'array',
      description: 'Questions only the user can answer',
      items: {
        type: 'object',
        properties: {
          group: { type: 'string', enum: ['adr', 'feature'] },
          topic: { type: 'string', description: 'ADR or feature name the question belongs to' },
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          recommended: { type: 'string', description: 'Recommended answer with one-line reason' },
        },
        required: ['group', 'topic', 'question', 'recommended'],
      },
    },
  },
  required: ['title', 'slug', 'breakdown', 'questions'],
}

const REVIEW = {
  type: 'object',
  properties: {
    satisfied: { type: 'boolean' },
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

// 1. Branch
phase('Branch')
const branchInfo = await agent(
  `Load the git-workflow skill and perform "1. Before doing anything: sync and branch" for a docs-only change.
Requirement (for naming the branch only): ${requirement}
Use a branch named docs/<short-kebab-description>. If the working tree has changes you did not make for this task, do not discard anything: stash nothing, just report and stop.
Return the branch name you are on.`,
  { label: 'git: sync + branch', phase: 'Branch', effort: 'low' },
)

// 2. Analyze loop
phase('Analyze')
let draft = null
let comments = []
let satisfied = false
let rounds = 0
for (; rounds < MAX_LOOPS && !satisfied; rounds++) {
  const n = rounds + 1
  const baPrompt = draft
    ? `Requirement:\n${requirement}\n\nYour previous breakdown:\n${draft.breakdown}\n\nPrevious open questions:\n${JSON.stringify(draft.questions)}\n\nThe reviewer left these comments. Address every high and medium comment, and low ones where reasonable, then return the improved full breakdown:\n${JSON.stringify(comments, null, 2)}\n\nFor every question that only the user can answer, give group (adr or feature), topic, options and a recommended answer. Do not ask what you can decide from CLAUDE.md or docs/.`
    : `Requirement:\n${requirement}\n\nAnalyze it and break it into ADRs, features and small tasks, following your output format: every ADR, feature and task has a status; every feature has a side and a User stories section (IDs, Given/When/Then scenarios) that will feed the e2e test suite; every task has a side and a Verification section, plus a mockup link if one exists. Read CLAUDE.md and docs/ first so you reuse existing terms and avoid duplicating existing documents. For every question that only the user can answer, give group (adr or feature), topic, options and a recommended answer.`
  draft = await agent(baPrompt, {
    agentType: 'business-analyst',
    schema: BREAKDOWN,
    label: `BA round ${n}`,
    phase: 'Analyze',
  })
  if (!draft) throw new Error(`business-analyst returned nothing in round ${n}`)

  const review = await agent(
    `Review this breakdown against the original requirement.\n\nRequirement:\n${requirement}\n\nBreakdown:\n${draft.breakdown}\n\nOpen questions:\n${JSON.stringify(draft.questions, null, 2)}\n\nCheck in particular: user stories with scenarios on every feature, status on every ADR/feature/task, side on every feature and task, Verification on every task. Return comments ranked high/medium/low and satisfied=true only if no high or medium issues remain.`,
    { agentType: 'business-analyst-reviewer', schema: REVIEW, label: `Review round ${n}`, phase: 'Analyze' },
  )
  if (!review) throw new Error(`reviewer returned nothing in round ${n}`)
  comments = review.comments
  satisfied = review.satisfied
  log(`Round ${n}: ${satisfied ? 'satisfied' : comments.length + ' comments'}`)
}
if (!satisfied) log(`Reviewer not satisfied after ${MAX_LOOPS} rounds; documenting the latest draft with the remaining comments as open points.`)

// 3. Document
phase('Document')
const docResult = await agent(
  `Load the docs-placement skill and follow it to write/update the project documents for this requirement on branch ${branchInfo}. Do not create documents in folders the skill does not allow; if something fits no folder, put it in an open-questions file and say so.

Keep the status, side, user stories, verification and mockup fields from the breakdown in the written documents: user stories and side go in the feature spec, status, side, verification and mockup link go in each task file, status goes in each ADR. Mockups belong under docs/ui/<feature-name>/ if they exist. Progress.md status values stay todo / in progress / done.

Title: ${draft.title}
Breakdown (Markdown):
${draft.breakdown}

Remaining reviewer comments (empty if satisfied):
${JSON.stringify(satisfied ? [] : comments, null, 2)}

Also write the questions the user must answer as Markdown files grouped by kind, placed per docs-placement (open decisions):
- one file for group "adr" questions, one file for group "feature" questions (skip a file if it has no questions); inside, group by topic.
- each question: the question, options, and "Recommended answer: ..." so the user has a hint, plus an empty "Answer:" line.
Questions:
${JSON.stringify(draft.questions, null, 2)}

Update the folder README.md files and Progress.md if docs-placement says to. Do NOT commit; just write files. Return the list of files created/updated.`,
  { label: 'write docs', phase: 'Document' },
)

// 4. PR + merge
phase('Merge')
const merged = await agent(
  `Load the git-workflow skill and perform "3. When the work is complete" for branch ${branchInfo}: commit the docs changes (end the commit message with the attribution line from the session reminder), push, open the PR against dev-v2 (use the mattpocock-skills:pr skill for the body), wait for CI, and squash-merge only if checks pass (if no checks exist or merge is blocked, stop and report instead). Then return to dev-v2 and pull.
Files changed:\n${docResult}
Return the PR URL and the merge outcome.`,
  { label: 'git: PR + merge', phase: 'Merge' },
)

return {
  branch: branchInfo,
  rounds,
  satisfied,
  remainingComments: satisfied ? [] : comments,
  questions: draft.questions.length,
  docs: docResult,
  merge: merged,
}
