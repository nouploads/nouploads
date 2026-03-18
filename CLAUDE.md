# CLAUDE.md

## Purpose

This file defines the mandatory operating rules for AI agents working in this repository.

This repository is optimized for:
- fast implementation
- low-regret changes
- predictable architecture
- strong test coverage
- browser-side file processing
- SEO-ready public routes
- minimal manual cleanup after AI output

The agent must prioritize:
- correctness
- consistency
- small scoped changes
- passing tests
- preserving architecture

The agent must not optimize for novelty, abstraction, or cleverness.

---

## Prime Directive

Make the smallest correct change that satisfies the task and passes the required checks.

Do not redesign the architecture unless explicitly instructed.

Do not refactor unrelated code.

Do not "improve" files outside the requested scope.

---

## Default Working Style

Unless explicitly told otherwise, the agent must:

1. inspect the existing canonical pattern
2. follow the existing structure exactly
3. write or update tests first when practical
4. implement the minimum code needed
5. run validation checks
6. fix only the failing scope
7. stop when the task is complete

The agent must assume that consistency is more important than originality.

---

## Canonical Patterns

Before adding a new tool or route, the agent must inspect the closest existing example and copy its structure.

Current canonical example:
- `/image/heic-to-jpg`

When adding similar functionality, the agent must mirror:
- file layout
- metadata style
- page composition
- processor contract style
- test style
- naming conventions

Do not invent a second pattern when one already exists.

---

## Allowed Scope Principle

The agent may only edit files necessary for the task.

If the task does not require changing a file, do not touch it.

If a broader refactor seems helpful, do not perform it unless explicitly requested.

If a broader refactor is truly required to complete the task, the agent must:
- explain why
- keep it minimal
- limit it to the smallest safe area

---

## Forbidden Behaviors

The agent must not:

- refactor unrelated files
- rename files without strong reason
- move files without strong reason
- add dependencies without justification
- change route structure casually
- introduce new state management libraries
- introduce new UI systems
- introduce new testing frameworks
- create barrel files for heavy processors
- import heavy libraries into shared layout/global files
- silently change public behavior outside task scope
- claim success without verifying tests/build

---

## Task Execution Rules

For every task, the agent must first determine:

- exact goal
- allowed files to change
- forbidden files to change
- which tests are required
- whether this is route, feature, processor, or test work
- whether heavy bundle boundaries are affected

If any of these are unclear, infer conservatively from the repository structure and existing patterns.

Do not solve ambiguity by widening the change set.

---

## Routes Rules

Route files live under `app/routes/`.

A route file should usually:
- export `meta()`
- render the page layout
- mount a feature component

A route file should usually not:
- contain heavy processing logic
- contain large helper utilities
- contain validation business logic
- contain unrelated UI abstractions

Target:
- keep route files thin
- prefer under 120 lines where practical

If route logic grows, move logic into:
- feature components
- hooks
- processors
- SEO helpers

---

## SEO Rules

Every public route must be SEO-ready.

The agent must ensure public routes include:
- title
- description
- canonical URL
- Open Graph tags

Prefer shared helpers from `app/lib/seo/`.

If the repository pattern includes JSON-LD, follow that pattern.

The agent must not hand-roll inconsistent metadata if a shared helper exists.

---

## Tool Rules

Each tool must follow the standard structure:

- route file
- feature component
- processor module
- tests
- route metadata
- prerender configuration if public

The agent must use shared tool UI patterns:
- ToolPageLayout
- shared dropzone/file list/result state components
- shared error/processing/empty states where available

Do not invent one-off page structures unless explicitly required.

---

## Processor Rules

Processors must be:
- testable
- explicit
- isolated from route files
- isolated from visual rendering concerns

Processors must not:
- directly manipulate React state
- directly manipulate page layout
- trigger toasts or navigation
- import large UI components

If possible, processors should:
- accept typed input
- return typed success/error results
- handle invalid input explicitly
- be deterministic

---

## Heavy Dependency Rules

Heavy dependencies must remain local to the feature or tool that needs them.

Examples:
- ffmpeg.wasm
- large image codecs
- PDF runtimes
- OCR engines

The agent must not:
- import heavy dependencies in root layout
- import heavy dependencies in shared layout
- import heavy dependencies through broad barrel exports

Preferred approach:
- route-level code split
- dynamic import for heavy processor/runtime when appropriate

Users of one tool must not download another tool's engine.

---

## Dependency Rules

The agent may not add a new dependency unless it is clearly necessary.

Before adding a dependency, the agent must justify:
1. what problem it solves
2. why existing code/browser APIs are insufficient
3. where it loads
4. whether it affects all routes or only one route
5. likely bundle-size impact
6. whether it affects prerender/browser compatibility

If the dependency is not essential, do not add it.

Prefer:
- existing repo dependencies
- browser APIs
- small focused libraries

Avoid:
- trendy abstractions
- overlapping utility libraries
- speculative dependencies
- architecture-heavy packages

---

## Test-First Preference

For logic-heavy work, the agent should prefer TDD.

Preferred order:
1. add fixtures if needed
2. write failing tests
3. implement minimum code
4. run tests
5. refactor carefully

This is especially required for:
- processors
- validators
- file handling rules
- metadata helpers
- state transitions
- output contracts

---

## Required Test Coverage

For each new tool or processor, the agent must ensure:

- unit tests for processor/helper logic
- component/integration test for primary UI behavior where relevant
- Playwright happy-path test for user-facing tools
- invalid-input test
- large-input or guardrail behavior test where relevant

If a task does not need all of these, follow the smallest existing pattern in the repo.

Do not skip tests merely because manual testing "looks fine."

---

## Playwright Rules

For E2E tests, prefer:
- one happy path
- one important failure path
- minimal stable selectors
- real user flows

Do not create brittle over-specified E2E tests.

Focus on:
- upload/select file
- process/convert action
- success result visible
- download action available
- invalid input handled

---

## Performance and Guardrail Rules

Performance is part of correctness.

For tools that process files, the agent must consider:
- maximum file size
- maximum file count
- browser capability limits
- memory-risk scenarios
- mobile constraints
- Safari/WebKit constraints if relevant

If a workload is dangerous, the tool must fail gracefully or warn before processing.

Do not assume unlimited browser capacity.

---

## Accessibility Rules

The agent must preserve basic accessibility.

At minimum:
- buttons must have meaningful text or labels
- file inputs must remain usable without drag/drop
- dialogs must manage focus correctly
- key user flows must remain keyboard reachable
- errors and success states must be visible and understandable

Do not regress accessibility while adding features.

---

## Naming Rules

Use explicit names.

Prefer:
- `remove-metadata-tool.tsx`
- `compress-image.ts`
- `tool-processing-state.tsx`

Avoid:
- `helper.ts`
- `misc.ts`
- `temp.ts`
- `newTool.tsx`
- vague names with unclear responsibility

Names should describe exactly what the file or symbol does.

---

## Editing Rules

When editing files:
- preserve existing formatting style
- preserve naming conventions
- avoid unrelated import sorting churn
- avoid broad rewrites
- avoid moving code between layers unless necessary

Do not create noise diffs.

Prefer small, reviewable diffs.

---

## Refactoring Rules

Refactor only when one of these is true:
- the task requires it
- the existing code blocks safe implementation
- duplication is clearly causing repeated errors
- a module is unreasonably large
- tests already protect the change

Do not perform speculative cleanup.

Do not use feature work as an excuse for architectural experiments.

---

## Validation Rules Before Claiming Success

Before claiming a task is complete, the agent must run or verify the relevant checks.

Minimum expectation:
- typecheck
- unit tests for changed logic
- component tests if relevant
- Playwright tests if user flow changed
- production build

If any check fails, do not claim success.

If not all checks can be run, the agent must say exactly which were run and which were not.

No bluffing.

---

## Output Rules

When reporting completion, the agent must state:

- what changed
- which files changed
- what tests were added or updated
- what checks passed
- any known caveats
- whether bundle boundaries or guardrails were affected

Be concise and precise.

Do not give marketing-style summaries.

---

## Failure Recovery Rules

If tests fail, the agent must:
1. inspect the failing test output
2. identify the smallest likely cause
3. fix only the relevant scope
4. rerun the relevant checks

Do not respond to one failing test by rewriting broad sections of the codebase.

Fix narrowly first.

---

## Prompt Interpretation Rules

If the user gives a broad request like:
- "build this tool"
- "add this feature"
- "fix this page"

the agent must internally decompose it into:
- route work
- component work
- processor work
- tests
- metadata
- prerender updates

Then implement the smallest safe sequence.

Do not attempt a giant one-shot rewrite.

---

## Protected Areas

Unless explicitly asked, be extremely cautious changing:

- root app shell
- route config conventions
- global styles
- shared UI primitives
- SEO helpers
- build configuration
- test configuration
- dependency manifests

Changes here have broad blast radius.

---

## Standard "Done" Definition

A task involving a new public tool is only done if:

- route exists
- metadata exists
- processor exists
- tests exist
- happy path works
- invalid input is handled
- large input behavior is defined if relevant
- prerender config is updated if relevant
- build passes
- no unrelated files were changed

If these are not true, the task is not done.

---

## Standard "Smallest Safe Change" Definition

The best solution is usually:
- fewer files changed
- fewer abstractions added
- fewer new concepts introduced
- fewer dependencies added
- more reuse of existing patterns

The agent should always prefer this path.

---

## Repository Philosophy

This repository is designed for repeatable AI-assisted shipping.

The agent must optimize for:
- speed
- reliability
- consistency
- maintainability
- low surprise

Do not optimize for:
- novelty
- cleverness
- framework fashion
- speculative abstraction

When in doubt, choose the more boring solution.

---

## Final Instruction

Follow existing patterns.
Change as little as possible.
Add tests.
Keep bundle boundaries clean.
Do not pretend a task is complete unless it is actually verified.
