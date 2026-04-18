# Contributing to NoUploads

Thank you for your interest in contributing to NoUploads! This guide will help you get started.

## Contributor License Agreement (CLA)

**All contributors must agree to the [CLA](CLA.md) before their first PR can be merged.** The CLA grants the project owner the right to relicense contributions, which is necessary for our split-license model: the `nouploads` npm package and all `packages/*` are MIT-licensed (free for any use), while `apps/web/` is AGPL-3.0-only (clone deterrent for the deployed nouploads.com web app). You retain copyright of your contributions.

By opening a PR, you confirm that you have read and agree to the CLA.

## Getting Started

### Prerequisites

- Node.js 24.14+
- pnpm 9+

### Setup

```bash
git clone https://github.com/nouploads/nouploads.git
cd nouploads
pnpm install
pnpm dev
```

The dev server starts at `http://localhost:5173`.

### Build

```bash
pnpm build                          # Production build (all packages + web app)
pnpm --filter @nouploads/web start  # Serve the production build locally
```

## Monorepo Structure

```
nouploads/
├── packages/
│   ├── core/               # @nouploads/core — shared tool logic, registry, decoders
│   ├── cli/                # CLI tool (published as `nouploads` on npm)
│   ├── backend-sharp/      # Node.js image backend using sharp
│   └── backend-canvas/     # Browser image backend using Canvas API
├── apps/
│   └── web/                # @nouploads/web — the website (React Router + Vite)
│       ├── app/
│       │   ├── routes/     # React Router routes (file-based)
│       │   │   ├── home.tsx
│       │   │   ├── about.tsx
│       │   │   ├── image/      # Image tool pages
│       │   │   ├── pdf/        # PDF tool pages
│       │   │   ├── vector/     # Vector tool pages
│       │   │   └── developer/  # Developer tool pages
│       │   ├── components/
│       │   │   ├── ui/         # shadcn/ui components (do not hand-edit)
│       │   │   ├── layout/     # Header, footer, command palette
│       │   │   ├── tool/       # Shared tool UI (dropzone, compare slider, fullscreen)
│       │   │   └── marketing/  # Tool grid, tool icon, tool filter
│       │   ├── features/
│       │   │   ├── image-tools/
│       │   │   │   ├── components/     # Tool-specific React components
│       │   │   │   ├── processors/     # Pure processing logic
│       │   │   │   └── decoders/       # Format-specific decoders
│       │   │   ├── pdf-tools/
│       │   │   │   ├── components/
│       │   │   │   ├── processors/
│       │   │   │   └── lib/
│       │   │   ├── vector-tools/
│       │   │   │   ├── components/
│       │   │   │   ├── processors/
│       │   │   │   └── decoders/
│       │   │   └── developer-tools/
│       │   │       ├── components/
│       │   │       └── processors/
│       │   ├── lib/            # Shared utilities (search, SEO, tools registry)
│       │   ├── styles/         # Global CSS
│       │   ├── root.tsx        # App shell (HTML document, theme script)
│       │   └── routes.ts       # Route definitions
│       └── tests/
│           ├── helpers/        # Shared test helpers (drop-file)
│           ├── unit/           # Vitest: processors, components, hooks, lib
│           └── e2e/            # Playwright: browser flows + fixtures
├── fixtures/               # Shared test fixtures
├── turbo.json
└── pnpm-workspace.yaml
```

## How to Add a New Tool

Each tool requires pieces in both `packages/core/` and `apps/web/`:

### 1. Core tool definition (`packages/core/src/tools/<tool>.ts`)

Register the tool in the shared core registry. Add a side-effect import in `packages/core/src/index.ts`.

### 2. Core tests (`packages/core/tests/<tool>.test.ts`)

Test the core tool logic independent of the web UI.

### 3. Processor (`apps/web/app/features/<category>/processors/<tool>.ts`)

Pure TypeScript function. No React, no DOM, no browser globals.

```typescript
export interface MyToolOptions {
  quality: number;
}

export async function myTool(input: Blob, options: MyToolOptions): Promise<Blob> {
  // Processing logic here
  // Dynamically import heavy libraries inside the function
  const lib = (await import('some-library')).default;
  // ...process and return result
}
```

### 4. React Component (`apps/web/app/features/<category>/components/<tool>.tsx`)

Interactive widget using shadcn/ui. Imports the processor statically (code splitting is handled at the route level).

```tsx
import { ToolDropzone } from '~/components/tool/tool-dropzone';
import { DownloadButton } from '~/components/tool/tool-actions';
import { myTool } from '~/features/category/processors/my-tool';

export default function MyTool() {
  // ToolDropzone → call processor → show DownloadButton
}
```

### 5. Route (`apps/web/app/routes/<category>/<tool>.tsx`)

Lazy-loads the tool component. Includes SEO metadata and static content (FAQ).

```tsx
import { lazy, Suspense } from "react";
import { buildMeta } from "~/lib/seo/meta";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";

const MyTool = lazy(() => import("~/features/category/components/my-tool"));

export function meta() {
  return buildMeta({
    title: "My Tool — NoUploads",
    description: "Description for SEO.",
    path: "/category/my-tool",
  });
}

export default function MyToolPage() {
  return (
    <ToolPageLayout title="My Tool" description="Description for users.">
      <Suspense fallback={<div>Loading...</div>}>
        <MyTool />
      </Suspense>
      {/* FAQ section with shadcn Accordion */}
    </ToolPageLayout>
  );
}
```

Don't forget to add the route to `apps/web/app/routes.ts` and `apps/web/react-router.config.ts` (prerender list).

### 6. Tests (TDD — specs first)

Every new feature **must** have tests written **before** the implementation. We follow test-driven development:

1. **Write spec files first** — create unit tests (Vitest) and/or e2e tests (Playwright) that describe the expected behavior.
2. **Run tests to confirm they fail** — `pnpm test` should show your new tests failing.
3. **Build the feature** — implement code until all tests pass.
4. **Refactor** — clean up while keeping tests green.

#### Unit tests (Vitest)

Located in `apps/web/tests/unit/`. Mirror the `app/` structure:

```
apps/web/tests/unit/
├── processors/     # Processor tests (pure logic)
├── components/     # React component tests (@testing-library/react)
├── helpers/        # Mock workers, test utilities
├── hooks/          # Hook tests
└── lib/            # Library/utility tests
```

```bash
pnpm test                                  # Run all tests (via turbo)
pnpm --filter @nouploads/web test          # Run web tests once
pnpm --filter @nouploads/web test:watch    # Watch mode
```

#### E2E tests (Playwright)

Located in `apps/web/tests/e2e/`. One spec per page or feature:

```bash
pnpm --filter @nouploads/web test:e2e   # Run e2e tests (starts dev server automatically)
pnpm --filter @nouploads/web test:all   # Run both unit + e2e
```

#### What to test for a new tool

| Layer | File | What to test |
|---|---|---|
| Core | `packages/core/tests/<tool>.test.ts` | Core tool logic, options, format handling |
| Processor | `apps/web/tests/unit/processors/<category>/<tool>.test.ts` | Input/output, options, edge cases, error handling |
| Component | `apps/web/tests/unit/components/tools/<Tool>.test.tsx` | Rendering, user interactions, state transitions |
| E2E | `apps/web/tests/e2e/<tool>.spec.ts` | Full page load, file drop, conversion flow, download |

## Key Rules

1. **Client-side only.** All file processing must happen in the browser. No server uploads. No external API calls with user data.
1. **Pinned dependency versions.** All versions in `package.json` must be exact (e.g., `"react": "19.2.4"`, not `"react": "^19.2.4"`). Use `pnpm add --save-exact <pkg>` when adding dependencies. Always use the latest available version unless there is a known incompatibility.
2. **Processors are pure.** No React, no DOM, no `document`, no `window` in processor files. They should work in any JavaScript runtime.
3. **Dynamic imports for heavy libraries.** Never import processing libraries at the top level of a processor. Use `await import()` inside the function.
4. **Show loading states.** If a library is >500KB, show a progress bar while it loads.
5. **Static content for SEO.** Every tool page must have explanation text and FAQ in the route file (pre-rendered into HTML).

## Commit Conventions

Use conventional commits:

- `feat: add image rotate tool`
- `fix: handle HEIC files with multiple images`
- `docs: update self-hosting instructions`
- `refactor: extract shared processing logic`

## Questions?

Open an issue on GitHub if you need help or have questions.
