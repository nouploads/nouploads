# TOOL_PLAYBOOK.md

## Purpose

This playbook defines the exact repeatable process for adding a new tool to NoUploads.

Goal:
- fast implementation
- consistent structure
- AI-friendly execution
- strong SEO
- reliable tests
- minimal regressions

Do not improvise a new workflow per tool.

---

## Golden Rule

Every new tool must follow the same pattern as an existing good example.

Recommended canonical example:
- `/image/heic-to-jpg`

Before building a new tool, inspect the existing canonical tool and copy its structure.

---

## Tool Anatomy

Each tool should have:

1. route file
2. feature component
3. processor module
4. optional feature-local helper modules
5. test fixtures
6. unit test
7. component/integration test
8. Playwright E2E test
9. metadata
10. prerender route entry if public/indexable

---

## Standard File Checklist

Example: adding `/image/remove-metadata`

Expected files:

- `apps/web/app/routes/image/remove-metadata.tsx`
- `apps/web/app/features/image-tools/components/remove-metadata-tool.tsx`
- `apps/web/app/features/image-tools/processors/remove-metadata.ts`
- `packages/core/src/tools/strip-metadata.ts` (core tool definition)
- `packages/core/tests/strip-metadata.test.ts` (core tests)
- `apps/web/tests/unit/processors/remove-metadata.test.ts`
- `apps/web/tests/unit/components/tools/RemoveMetadataTool.test.tsx`
- `apps/web/tests/e2e/remove-metadata.spec.ts`
- fixture files under `apps/web/tests/e2e/fixtures/` as needed

Optional:
- feature-local helper files
- JSON-LD helper usage
- tool-specific option panel component

---

## Step-by-Step Workflow

### Step 1: Define the tool clearly
Before coding, answer:

- What exact user problem does this tool solve?
- What file types are accepted?
- What file types are produced?
- Is the tool single-file or multi-file?
- What is the expected success output?
- What invalid cases must be rejected?
- What are the size or count guardrails?
- Is the tool indexable and public?
- Does it need a heavy dependency?
- Can the heavy dependency be lazy-loaded?

Do not start implementation until this is clear.

---

### Step 2: Create or choose fixtures
Add realistic sample inputs.

Examples:
- valid file
- invalid file
- corrupted file
- large file
- weird filename
- metadata-heavy image
- edge-case dimensions

Fixtures are the foundation of reliable tool development.

---

### Step 3: Write unit tests first
Write failing Vitest specs for:
- input validation
- output expectations
- error cases
- limits and guardrails

Examples:
- accepts supported format
- rejects unsupported format
- strips metadata correctly
- preserves filename stem
- returns expected output type
- errors on oversized input

Do this before implementing processor logic.

---

### Step 4: Implement the processor
Create a processor module in the feature area.

Processor rules:
- pure where possible
- no UI logic
- no toast logic
- no route logic
- return structured results or typed errors
- easy to unit test

The processor should satisfy the failing tests from Step 3.

---

### Step 5: Add or update feature component
Create the tool UI component.

This component should:
- use shared tool shell components
- handle file selection
- call the processor or orchestration hook
- show empty / error / processing / result states
- avoid duplicating layout patterns already used elsewhere

Do not build a custom page structure unless there is a strong reason.

---

### Step 6: Add route file
Create the route module under `apps/web/app/routes/`.

The route file should:
- export `meta()`
- render `ToolPageLayout`
- mount the feature component
- include title and description
- include trust messaging where appropriate

Keep the route file thin.

---

### Step 7: Add SEO metadata
Every public tool route must include:
- title
- description
- canonical URL
- OG title
- OG description

Optional:
- route-specific OG image
- JSON-LD structured data
- FAQ content if useful

Prefer using shared SEO helpers.

---

### Step 7b: Register tool in tools.ts, tool-icon.tsx, and packages/core

Add the tool entry to the `tools` array in `apps/web/app/lib/tools.ts` with title, description, href, icon name, and colors. Set `comingSoon: false` (or remove the field).

Then add the Lucide icon import to the `iconMap` in `apps/web/app/components/marketing/tool-icon.tsx`. If you forget this step, the icon will silently fail in production (a dev-time console warning will remind you).

Also register the core tool definition in `packages/core/src/tools/` and add the side-effect import in `packages/core/src/index.ts`.

---

### Step 8: Add prerender entry
If the route is a public indexed page, add it to the prerender list in `apps/web/react-router.config.ts`.

Public tool pages should generally be prerendered so crawlers receive HTML immediately.

---

### Step 9: Write component test
Add a component/integration test to verify:
- valid file can be selected
- invalid file produces clear error
- action button disabled/enabled correctly
- processing state appears
- result state renders on success

This protects UI behavior without requiring full browser E2E for every detail.

---

### Step 10: Write Playwright happy path
Add one browser test for the main user journey:

- open route
- select file
- process file
- confirm result appears
- confirm download action is available

Add one unhappy path where practical:
- invalid file
- oversized file
- unsupported browser capability
- excessive batch size

---

### Step 11: Check bundle boundaries
Before considering the tool done, verify:

- heavy dependency is not imported by shared layout
- heavy dependency is not imported via shared barrel file
- route-local code splitting is preserved
- large engines are lazy-loaded if possible

Users of other tools must not pay this tool's dependency cost.

---

### Step 12: Run acceptance checks
Required checks:
- typecheck
- lint
- unit tests
- component tests
- Playwright tests
- build

If any fail, the tool is not done.

---

## Standard Tool Route Template

Use this shape:

```tsx
// File: apps/web/app/routes/image/remove-metadata.tsx
import type { Route } from "./+types/remove-metadata";
import { lazy, Suspense } from "react";
import { buildMeta } from "~/lib/seo/meta";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import { Spinner } from "~/components/ui/spinner";

const RemoveMetadataTool = lazy(() => import("~/features/image-tools/components/remove-metadata-tool"));

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: "Remove Image Metadata - NoUploads",
    description: "Remove EXIF and image metadata locally in your browser. No uploads required.",
    path: "/image/remove-metadata",
    ogImage: "/og/remove-metadata.png",
  });
}

export default function RemoveMetadataPage() {
  return (
    <ToolPageLayout
      title="Remove Image Metadata"
      description="Strip EXIF and other metadata from images on your device."
      category="Image Tools"
    >
      <Suspense fallback={<Spinner />}>
        <RemoveMetadataTool />
      </Suspense>
    </ToolPageLayout>
  );
}
```

---

## Standard Tool Component Expectations

A tool component should usually provide:

- file picker
- drag/drop
- validation feedback
- settings if needed
- convert/process action
- progress state
- result state
- download action
- retry/reset action

Avoid embedding processing logic directly in the JSX file unless extremely small.

---

## Standard Processor Contract

A processor should ideally:

- accept explicit typed input
- return explicit typed output
- return structured errors
- be deterministic for the same input
- avoid hidden side effects

Example shape:

```ts
type RemoveMetadataInput = {
  file: File;
};

type RemoveMetadataSuccess = {
  outputFile: File;
};

type RemoveMetadataError =
  | { code: "UNSUPPORTED_TYPE"; message: string }
  | { code: "TOO_LARGE"; message: string }
  | { code: "PROCESSING_FAILED"; message: string };

type RemoveMetadataResult =
  | { ok: true; value: RemoveMetadataSuccess }
  | { ok: false; error: RemoveMetadataError };
```

Use this kind of explicit contract where practical.

---

## Standard Guardrail Checklist

For every tool, decide explicitly:

- max file size
- max file count
- supported MIME types
- supported extensions
- mobile support limits
- Safari/WebKit caveats
- unsupported-device behavior
- memory-risk behavior

Do not leave these implicit.

---

## Tool Categories

Keep tools grouped by clear categories.

Examples:

- Image Tools
- PDF Tools
- Vector Tools
- Developer Tools
- Video Tools (future)
- Audio Tools (future)

Do not create miscellaneous junk categories.

---

## Heavy Dependency Policy

If the tool needs a heavy engine:

- keep it feature-local
- prefer dynamic import
- load on demand when possible
- never leak it into shared bundles

Examples:

- `ffmpeg.wasm`
- PDF processing runtime
- OCR runtime
- codec runtimes

Document any heavy dependency in the PR.

---

## AI Build Prompt Template

Use this template when asking AI to add a tool:

```
Task: add `/image/remove-metadata`.

Follow the exact structure and conventions used by the canonical example tool.

Allowed to change:
- apps/web/app/routes/image/remove-metadata.tsx
- apps/web/app/features/image-tools/components/remove-metadata-tool.tsx
- apps/web/app/features/image-tools/processors/remove-metadata.ts
- packages/core/src/tools/strip-metadata.ts
- packages/core/tests/strip-metadata.test.ts
- packages/core/src/index.ts (add side-effect import)
- apps/web/tests/unit/processors/remove-metadata.test.ts
- apps/web/tests/unit/components/tools/RemoveMetadataTool.test.tsx
- apps/web/tests/e2e/remove-metadata.spec.ts

Do not change:
- shared layout components
- global route patterns
- package.json
- unrelated processors
- unrelated tests

Requirements:
- write tests first
- use shared ToolPageLayout
- export route meta()
- keep route file thin
- no new dependencies
- invalid file behavior required
- large file behavior required
- preserve bundle boundaries
- pass lint, typecheck, Vitest, and Playwright
```

This keeps AI work scoped and reliable.

---

## Review Checklist Before Merge

Before merging a tool, verify:

- route file is thin
- metadata exists
- processor is test-covered
- UI states are clear
- invalid inputs are handled
- limits are explicit
- heavy libs are lazy/route-local
- Playwright happy path passes
- build passes
- no unrelated architecture drift occurred

---

## Anti-Patterns

Do not do these:

- giant route files with embedded business logic
- processor logic inside JSX handlers
- shared imports of heavy tool engines
- skipping tests because "it works locally"
- inventing a new page pattern for each tool
- adding dependencies for trivial utilities
- broad AI prompts that allow unrelated refactors

These slow the project down.

---

## Definition of Done

A tool is done only if:

- route exists
- feature component exists
- processor exists
- fixtures exist
- unit tests pass
- component behavior is covered
- Playwright happy path passes
- invalid input behavior exists
- large input behavior exists
- metadata exists
- prerender is configured if needed
- build is green

If not, it is not done.

---

## Final Rule

Ship tools by repeating a proven pattern.

Do not reward novelty.
Reward speed, reliability, and consistency.
