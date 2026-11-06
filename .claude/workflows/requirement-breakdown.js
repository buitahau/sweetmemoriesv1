export const meta = {
  name: 'requirement-breakdown',
  description: 'Analyze a requirement, classify into ADR / feature / task docs, review them, then assess and correct',
  whenToUse: 'A new requirement, feature idea or change request must be turned into reviewed ADRs, feature specs and tasks (each feature/task with a verification checklist) under docs/.',
  phases: [
    { title: 'Analyze', detail: 'business-analyst analyzes, classifies (existing vs new ADR/feature/task) and writes docs' },
    { title: 'Review', detail: 'business-analyst-review checks the docs (read-only)' },
    { title: 'Correct', detail: 'business-analyst assesses each finding and corrects the docs' },
  ],
}

// args: a string (the requirement) or {requirement: string, maxReviewRounds?: number}
const requirement = typeof args === 'string' ? args : args && args.requirement
if (!requirement) throw new Error('Pass the requirement as args (string or {requirement}).')
const MAX_ROUNDS = (args && args.maxReviewRounds) || 2

const HIERARCHY_RULE = `
Document hierarchy (mandatory): ADR -> Feature -> Task.
- One ADR has one or more Features. One Feature has one or more Tasks. Each Feature belongs to exactly one parent ADR; each Task belongs to exactly one parent Feature.
- Every ADR, every Feature and every Task is its own .md file. Never combine several in one file, never leave one without a file.
- Every Feature must have a parent ADR: reuse an existing ADR if one covers the decision, otherwise create a new one. Every ADR must list at least one Feature, and every Feature at least one Task.
- Link both ways with relative paths: the ADR has a "Features" list; the Feature has "Parent ADR" and a "Tasks" list (in its Related section); the Task has "Feature" and "ADR" links (in its Links section).
- Do not make a Task that spans several Features, or a Feature that spans several ADRs; split it.`

const QFILE = `docs/questions/questions-${new Date().toISOString().slice(0, 10)}-requirement-breakdown.md`

const DOCS_RULE = `
Documentation placement (mandatory): FIRST read .claude/skills/writing-docs/SKILL.md in full and follow it exactly (you cannot invoke skills, so read the file). In particular:
- Pick the folder by content: ADR -> docs/adr/, feature -> docs/features/, task -> docs/tasks/<feature-slug>/<task-name>.md (group tasks in a folder named after their parent feature, i.e. the feature file name without .md; create the folder first, never put a task directly in docs/tasks/). If the requirement also changes system design, API, infra or UI, update the matching doc in docs/architecture/, docs/api/, docs/infra/ or docs/ui/ instead of burying that content in a feature.
- Check the target folder for an existing doc on the topic and update it instead of creating a duplicate.
- Naming: kebab-case .md named by topic. ADRs are NNNN-short-title.md, numbered sequentially after the highest existing number; never renumber or delete, supersede instead.
- Use the skill's template for each doc type: Feature = Summary, User story, Behavior, Out of scope, Related; Task = Goal, Scope, Acceptance criteria (checklist), Links to feature/ADR, Status; ADR = Status, Context, Decision, Consequences, Alternatives (plus a "Features" list of its child features).
- Link related docs with relative paths.
- No per-feature progress files. ALL product-owner questions of this run, for every feature, go in ONE file: ${QFILE} (create with a '# Questions: requirement-breakdown' heading if missing, otherwise append; next free QNNN; each question gets a '- Feature: <slug>' line; use the skill's question format). Never create one file per question or per feature.
- Never write outside docs/. No secrets or real user data in docs.`

const CHECKLIST_RULE = `
Verification checklist rule (mandatory for every feature and every task doc):
- Add a "## Verification checklist" section of "- [ ]" items. In task docs, this IS the template's "Acceptance criteria (checklist)": use one section, titled "## Verification checklist", do not duplicate.
- Each item is a concrete, objectively checkable condition (observable behavior, test, or doc check), not a vague wish.
- Feature checklist: covers every acceptance criterion, the relevant security rules from CLAUDE.md, and key edge cases.
- Task checklist: covers what must be true for that task alone to be done.
- State at the top of the section: "The feature/task is complete only when every item below passes."
- Every checklist item must trace to an acceptance criterion or requirement.`

const CLASSIFY_SCHEMA = {
  type: 'object',
  properties: {
    restatement: { type: 'string' },
    slug: { type: 'string', description: 'Short kebab-case label for the whole requirement (a label only, not a folder name)' },
    confidence: { type: 'number', description: 'Final self-evaluation confidence 1.0-5.0' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['adr', 'feature', 'task'] },
          action: { type: 'string', enum: ['existing-reused', 'existing-updated', 'new'] },
          path: { type: 'string', description: 'Repo-relative path: docs/adr/NNNN-*.md, docs/features/*.md or docs/tasks/<feature-slug>/*.md' },
          title: { type: 'string' },
          parent: { type: 'string', description: 'Path of the parent doc: a feature\'s ADR, a task\'s feature. Empty for an ADR.' },
          reason: { type: 'string', description: 'Why this classification (e.g. which existing ADR already covers it)' },
          checklistCount: { type: 'number', description: 'Number of verification checklist items (features/tasks only; 0 for ADRs)' },
        },
        required: ['kind', 'action', 'path', 'title', 'reason'],
      },
    },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['restatement', 'slug', 'items'],
}

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['Approve', 'Approve with changes', 'Needs rework'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          severity: { type: 'string', enum: ['Blocker', 'Major', 'Minor', 'Nit'] },
          document: { type: 'string' },
          issue: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
        required: ['id', 'severity', 'document', 'issue', 'suggestedFix'],
      },
    },
    traceabilityGaps: { type: 'array', items: { type: 'string' } },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'findings'],
}

const CORRECT_SCHEMA = {
  type: 'object',
  properties: {
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          findingId: { type: 'string' },
          decision: { type: 'string', enum: ['accepted', 'rejected', 'needs-product-owner'] },
          rationale: { type: 'string' },
          changedFiles: { type: 'array', items: { type: 'string' } },
        },
        required: ['findingId', 'decision', 'rationale'],
      },
    },
    openQuestions: { type: 'array', items: { type: 'string' } },
    questionFiles: { type: 'array', items: { type: 'string' }, description: 'Paths of questions files written or appended (should be only the single session file)' },
    changedFiles: { type: 'array', items: { type: 'string' }, description: 'Every doc created, moved or edited in this correction' },
  },
  required: ['decisions'],
}

// ---- 1. Analyze + classify + write docs --------------------------------
phase('Analyze')
const plan = await agent(
  `Requirement from the product owner:

"""
${requirement}
"""

Do this, in order:
1. Analyze and break down the requirement following your normal process, including your self-evaluation loop (max 3 passes).
2. CLASSIFY every outcome before writing anything. Search docs/adr, docs/features, docs/tasks and docs/questions first.
   - ADR: if an existing ADR already covers the decision, reuse it ("existing-reused") and link to it; only if it must change, update it ("existing-updated"). Create a new ADR ("new") only for a significant, not-yet-recorded decision (architecture, security model, data model, stack-affecting choice).
   - Feature: reuse/update an existing feature spec if the requirement extends it; otherwise create a new one. Attach it to its parent ADR.
   - Task: small, focused, junior-ready (see your task breakdown rules), attached to its parent feature. Reuse/update existing tasks where they already match.
   Build the full tree first (ADR -> features -> tasks), then write it.
3. Write or update the docs in the correct docs/ folders, one .md file per ADR, per feature and per task. Do not write application code.
4. Product-owner questions: do not invent answers. Record each as a question file with a suggested default, per the placement rule.
${HIERARCHY_RULE}
${DOCS_RULE}
${CHECKLIST_RULE}

Return every doc you touched or reused, each with its parent path (empty for ADRs).`,
  { agentType: 'business-analyst', label: 'analyze+classify', phase: 'Analyze', schema: CLASSIFY_SCHEMA },
)
if (!plan) throw new Error('Analysis agent returned nothing.')

const missingChecklist = plan.items.filter(
  i => (i.kind === 'feature' || i.kind === 'task') && !(i.checklistCount > 0),
)
if (missingChecklist.length) {
  log(`Warning: no verification checklist reported for: ${missingChecklist.map(i => i.path).join(', ')}`)
}
// Deterministic placement check against the writing-docs folder/naming rules.
const PLACEMENT = {
  adr: /^docs\/adr\/\d{4}-[a-z0-9]+(-[a-z0-9]+)*\.md$/,
  feature: /^docs\/features\/[a-z0-9]+(-[a-z0-9]+)*\.md$/,
  task: /^docs\/tasks\/[a-z0-9]+(-[a-z0-9]+)*\/[a-z0-9]+(-[a-z0-9]+)*\.md$/,
}
const misplaced = plan.items.filter(i => !PLACEMENT[i.kind].test(i.path))
if (misplaced.length) {
  log(`Misplaced docs (will be flagged to reviewer): ${misplaced.map(i => `${i.kind}:${i.path}`).join(', ')}`)
}
// Deterministic hierarchy check: ADR 1-N Feature 1-N Task, one file each.
const byPath = new Map(plan.items.map(i => [i.path, i]))
const childrenOf = p => plan.items.filter(i => i.parent === p)
const hierarchyIssues = []
if (byPath.size !== plan.items.length) hierarchyIssues.push('Duplicate paths: two docs share one file')
for (const i of plan.items) {
  const parent = i.parent ? byPath.get(i.parent) : null
  if (i.kind === 'adr' && i.parent) hierarchyIssues.push(`ADR ${i.path} must not have a parent`)
  if (i.kind === 'feature' && !(parent && parent.kind === 'adr')) hierarchyIssues.push(`Feature ${i.path} has no parent ADR in the set`)
  if (i.kind === 'task' && !(parent && parent.kind === 'feature')) hierarchyIssues.push(`Task ${i.path} has no parent feature in the set`)
  if (i.kind === 'adr' && !childrenOf(i.path).some(c => c.kind === 'feature')) hierarchyIssues.push(`ADR ${i.path} has no feature`)
  if (i.kind === 'feature' && !childrenOf(i.path).some(c => c.kind === 'task')) hierarchyIssues.push(`Feature ${i.path} has no task`)
}
if (hierarchyIssues.length) log(`Hierarchy issues (will be flagged to reviewer): ${hierarchyIssues.join('; ')}`)
log(`Classified ${plan.items.length} docs (slug: ${plan.slug}, confidence: ${plan.confidence ?? 'n/a'})`)

const paths = plan.items.map(i => i.path)
const tree = plan.items.map(i => `- ${i.kind}: ${i.path}${i.parent ? ` (parent: ${i.parent})` : ''}`).join('\n')

// ---- 2/3. Review -> assess & correct (bounded loop) ---------------------
const rounds = []
let lastReview = null
for (let round = 1; round <= MAX_ROUNDS; round++) {
  phase('Review')
  lastReview = await agent(
    `Review these requirement documents for SweetMemories (round ${round} of ${MAX_ROUNDS}):
${tree}
${round > 1 ? `Note: this tree is the initial one. The previous correction may have added, moved, split or removed docs (changed files: ${rounds.flatMap(r => (r.correction && r.correction.changedFiles) || []).join(', ') || 'none reported'}). Treat the files on disk as the truth and re-derive the tree from them.\n` : ''}
Original requirement, for traceability:
"""
${requirement}
"""

Also verify the hierarchy ADR -> Feature -> Task: each doc is its own .md file; each feature has exactly one parent ADR and each task exactly one parent feature; every ADR lists at least one feature and every feature at least one task; links run both ways and match the tree above (open each file and compare). Flag broken or missing links, orphans and multi-parent docs as Major.${hierarchyIssues.length ? `\nKnown hierarchy problems detected by the workflow: ${hierarchyIssues.join('; ')}` : ''}

Also verify placement and format against .claude/skills/writing-docs/SKILL.md (read it): correct folder by content, kebab-case names, ADRs numbered NNNN- sequentially without gaps or renumbering, skill templates followed, no duplicate of an existing doc, relative links between docs, no per-feature progress files (all questions in the single session file ${QFILE}; flag any questions/ folder, per-feature or per-question question files as Major); tasks under docs/tasks/<feature-slug>/ matching their parent feature, none directly in docs/tasks/. Flag violations as Major.${misplaced.length ? `\nKnown placement problems detected by the workflow: ${misplaced.map(i => `${i.kind}:${i.path}`).join(', ')}` : ''}

Also verify: every feature and task has a "Verification checklist" whose items are concrete, checkable, traceable to acceptance criteria, and sufficient so that all items passing really means the feature/task is complete. Flag missing or weak checklists as Major.
You are read-only; report findings only.`,
    { agentType: 'business-analyst-review', label: `review r${round}`, phase: 'Review', schema: REVIEW_SCHEMA },
  )
  if (!lastReview) { log('Review agent returned nothing; stopping.'); break }

  const actionable = lastReview.findings.filter(f => f.severity !== 'Nit')
  const blocking = lastReview.findings.filter(f => f.severity === 'Blocker' || f.severity === 'Major')
  log(`Round ${round}: verdict "${lastReview.verdict}", ${lastReview.findings.length} findings (${blocking.length} blocker/major)`)

  if (lastReview.verdict === 'Approve' && !blocking.length) { rounds.push({ round, review: lastReview, correction: null }); break }

  phase('Correct')
  const correction = await agent(
    `A reviewer produced these findings on the docs you wrote. Assess each one critically; do not accept blindly.

Docs (hierarchy ADR -> Feature -> Task):
${tree}

Review (JSON):
${JSON.stringify(lastReview, null, 2)}

For every finding (include Nits only if trivial to fix):
- accepted: fix the doc now (edit in place, keep ADR <-> feature <-> task links and checklists consistent). List changed files.
- rejected: give a short rationale why the finding is wrong or out of scope.
- needs-product-owner: do not decide; add to Open questions with a suggested default.
Move any doc that is in the wrong folder or misnamed to the correct place (create the corrected file, delete the wrong one, fix every link to it; never renumber existing ADRs). If you add, split, merge or remove a doc, keep the tree valid and report it in changedFiles. Then append unresolved product-owner questions to the single file ${QFILE} (with a Feature line each) and list them in the feature's progress.md. Do not write application code.
${HIERARCHY_RULE}
${DOCS_RULE}
${CHECKLIST_RULE}
Re-run your self-evaluation on the corrected docs (counts toward your max 3 passes).`,
    { agentType: 'business-analyst', label: `assess+correct r${round}`, phase: 'Correct', schema: CORRECT_SCHEMA },
  )
  rounds.push({ round, review: lastReview, correction })
  if (!correction) { log('Correction agent returned nothing; stopping.'); break }
  if (round === MAX_ROUNDS && actionable.length) {
    log(`Max review rounds (${MAX_ROUNDS}) reached; the last corrections were not re-reviewed.`)
  }
}

return {
  slug: plan.slug,
  restatement: plan.restatement,
  confidence: plan.confidence,
  docs: plan.items,
  hierarchyIssues,
  missingChecklist: missingChecklist.map(i => i.path),
  rounds,
  openQuestions: [
    ...(plan.openQuestions || []),
    ...rounds.flatMap(r => (r.correction && r.correction.openQuestions) || []),
  ],
}
