# CODE_GUIDELINES.md

## Goal

This repository is optimized for:
- fast, reliable AI-assisted development
- predictable architecture
- low-regret maintenance
- strong SEO for public routes
- safe browser-side file processing
- minimal framework cleverness

The codebase must remain boring, explicit, testable, and easy to debug.

---

## Core Principles

1. Prefer simple and explicit over clever.
2. Keep route files thin.
3. Keep heavy processing logic out of shared modules.
4. Every public route must be SEO-ready.
5. Every tool must follow the same structure.
6. Tests are required for all tool logic.
7. No new dependency without clear justification.
8. Never break existing tool patterns without updating the playbook.

---

## Stack Rules

The approved stack is:

- React
- React Router (framework mode)
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui (Radix, new-york style)
- Vitest
- React Testing Library
- Playwright

Do not introduce alternative frameworks, UI systems, state managers, or test runners unless explicitly approved.

---

## File and Folder Rules

### Routes
All public pages live under `app/routes/`.

Route modules may:
- export `meta()`
- render page layout
- wire route data to feature components

Route modules must not:
- contain large processing logic
- contain complex validation logic
- contain large inline helper functions
- import unrelated heavy libraries

### Components
Shared UI components live under:
- `app/components/layout/`
- `app/components/tool/`
- `app/components/marketing/`
- `app/components/ui/`

Do not place feature-specific business logic in shared UI components.

### Features
Feature logic lives under:
- `app/features/image-tools/`
- `app/features/pdf-tools/`
- `app/features/shared/`

Each feature area should contain:
- `components/`
- `processors/`
- `lib/`

### Shared utilities
Only truly shared low-level utilities belong in:
- `app/lib/`
- `app/features/shared/lib/`

Examples:
- filename helpers
- download helpers
- file-size formatting
- mime helpers
- browser capability detection

---

## Route File Rules

A route file should usually do only these things:
1. define route metadata
2. render a layout
3. mount the feature component

Target route file size:
- preferred: under 120 lines
- warning zone: 120-200 lines
- over 200 lines requires justification

If a route grows too large, move logic into:
- feature component
- shared tool component
- processor
- hook
- seo helper

---

## Metadata Rules

Every public route must export `meta()`.

Each public route must define:
- title
- description
- canonical URL
- Open Graph title
- Open Graph description

Prefer shared helpers from `app/lib/seo/` instead of hand-writing repeated metadata.

If relevant, include JSON-LD structured data.

---

## Tool Page Rules

Every tool page must use the shared tool page pattern.

Each tool page should include:
- H1 title
- short description
- trust signal ("files stay on your device" or equivalent)
- primary tool UI
- clear empty state
- clear error state
- clear processing state
- result state
- FAQ or supporting content if useful for SEO

Use shared components from `app/components/tool/` whenever possible.

Do not invent a new page structure for each tool.

---

## Heavy Dependency Rules

Heavy libraries must never be imported from:
- root layout
- shared layout
- shared barrel files
- global utility files

Heavy libraries must be:
- route-local
- feature-local
- lazy-loaded when possible

Examples of heavy dependencies:
- ffmpeg.wasm
- PDF engines
- image codecs
- OCR engines
- large WASM runtimes

Preferred pattern:
- route-level code split (automatic via React Router)
- dynamic `import()` on interaction if practical

Users on `/image/heic-to-jpg` must not pay for `/video/mp4-to-gif`.

---

## Import Rules

Prefer direct imports over barrel imports for heavy or feature-specific code.

Allowed:
- small shared barrel files for UI-only exports if truly lightweight

Avoid:
- `processors/index.ts` that re-exports everything
- giant `lib/index.ts` files
- importing entire feature trees from one file

Reason:
barrel files often destroy bundle boundaries and make AI-generated code sloppier.

---

## Dependency Rules

Before adding any dependency, answer:
1. What problem does it solve?
2. Why can this not be solved with existing code or browser APIs?
3. Is it actively maintained?
4. Is it route-local or global?
5. What is the bundle-size impact?
6. Does it introduce SSR/prerender/browser compatibility issues?

No dependency may be added without this justification in the PR.

Prefer:
- browser APIs
- existing stack primitives
- small focused libraries

Avoid:
- overlapping abstractions
- trendy state managers
- magic meta-framework glue
- unnecessary helper libraries

---

## TypeScript Rules

- Use explicit types for public APIs.
- Avoid `any`.
- Prefer narrow types and discriminated unions for tool states.
- Validate external or user-derived inputs.
- Keep processor function signatures explicit.

If a type is reused across a feature area, move it into `types/`.

---

## State Rules

Keep state local unless sharing is truly necessary.

Prefer:
- component-local state
- feature-local hooks
- explicit props

Avoid:
- premature global state
- hidden shared mutable state
- clever event buses

For tool flows, state should be easy to inspect and reason about.

---

## Processor Rules

Processors must be:
- pure where possible
- small
- testable
- independent from route modules
- independent from visual UI concerns

Processors should not:
- touch DOM directly
- trigger toasts
- mutate React state
- contain page copy
- read global UI state

Processors may:
- validate files
- transform files
- return structured results
- return typed errors

---

## Error Handling Rules

All user-facing failures must be graceful.

Every tool must define behavior for:
- unsupported format
- corrupted file
- empty input
- oversized file
- too many files
- processing failure
- browser incompatibility

Never allow silent failure.

Errors shown to users must be:
- plain English
- short
- specific
- actionable where possible

---

## Performance Rules

Performance is a product feature.

All tools must consider:
- bundle size
- lazy loading
- memory pressure
- batch limits
- mobile browser constraints
- Safari/WebKit behavior

Guardrails are required for dangerous workloads.

Examples:
- file count limits
- file size limits
- warning before huge batch processing
- feature disablement for unsupported devices

Do not assume the browser can safely process everything.

---

## Accessibility Rules

At minimum:
- all buttons and inputs must be labeled
- dialogs must manage focus correctly
- drag/drop must have file-picker fallback
- keyboard navigation must work for primary flows
- error and success states must be visible and understandable

Do not rely only on drag-and-drop.

---

## Testing Rules

Every new tool requires tests.

Minimum required coverage:
- unit tests for processors/helpers
- component test for main interaction behavior
- Playwright happy-path flow
- at least one invalid-input case
- route smoke coverage

Do not merge untested tool logic.

---

## TDD Rules

Preferred workflow:
1. add or update fixtures
2. write failing tests
3. implement smallest code needed
4. run tests
5. refactor carefully
6. keep tests green

For tool logic, spec-first is preferred.

AI should be instructed to satisfy existing tests, not redesign architecture.

---

## AI Contribution Rules

AI-generated changes must be:
- small
- scoped
- test-backed
- pattern-matching an existing good example

Never ask AI to:
- redesign the entire architecture
- refactor unrelated files during a feature task
- invent new patterns without approval

When using AI, prompts must specify:
- goal
- allowed files to edit
- forbidden files
- tests to satisfy
- constraints to follow

---

## PR Rules

Each PR should ideally contain one logical change.

PR must include:
- what changed
- why it changed
- routes affected
- tests added or updated
- any new dependency justification
- any bundle/performance concern
- any new file-size or batch-size limit

Avoid giant mixed PRs.

---

## Refactoring Rules

Refactor only when one of these is true:
- duplication is clearly hurting velocity
- tests are already in place
- bundle boundaries are being damaged
- a module is too large or unclear
- a repeated pattern is now stable enough to extract

Do not refactor speculatively.

---

## Naming Rules

Use descriptive names.

Prefer:
- `heic-to-jpg-tool.tsx`
- `compress-image.ts`
- `tool-processing-state.tsx`

Avoid:
- vague names like `helper.ts`, `utils2.ts`, `magic.ts`
- trendy names like `engine.ts` unless truly justified

Names should tell future maintainers exactly what the file does.

---

## "Done" Definition

A tool is done only when all of the following are true:
- route exists
- metadata exists
- prerender path is configured if needed
- processor is implemented
- fixtures exist
- unit tests pass
- component test passes
- Playwright happy path passes
- invalid input behavior is defined
- large input behavior is defined
- build passes
- no unrelated files were changed

If any of these are missing, the tool is not done.

---

## Final Rule

This repository is not a playground for framework experiments.

Optimize for:
- shipping
- reliability
- clarity
- repeatability

When in doubt, choose the more boring option.
