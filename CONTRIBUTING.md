# Contributing to NoUploads

Thank you for your interest in contributing to NoUploads! This guide will help you get started.

## Contributor License Agreement (CLA)

**All contributors must agree to the [CLA](CLA.md) before their first PR can be merged.** The CLA grants the project owner the right to relicense contributions, which is necessary for dual licensing (AGPL + commercial). You retain copyright of your contributions.

By opening a PR, you confirm that you have read and agree to the CLA.

## Getting Started

### Prerequisites

- Node.js 24.14+
- npm

### Setup

```bash
git clone https://github.com/nouploads/nouploads.git
cd nouploads
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

### Build

```bash
npm run build    # Production build → build/client/
npm run start    # Serve the production build locally
```

## Project Structure

```
app/
├── routes/                 # React Router routes (file-based)
│   ├── home.tsx            # Homepage
│   ├── about.tsx           # About page
│   ├── image/              # Image tool pages (convert, compress, etc.)
│   └── developer/          # Developer tool pages (color picker, etc.)
├── components/
│   ├── ui/                 # shadcn/ui components (do not hand-edit)
│   ├── layout/             # Header, footer, command palette
│   ├── tool/               # Shared tool UI (dropzone, compare slider, fullscreen)
│   └── marketing/          # Tool grid, tool icon, tool filter
├── features/
│   ├── image-tools/
│   │   ├── components/     # Tool-specific React components
│   │   └── processors/     # Pure processing logic
│   └── developer-tools/
│       ├── components/     # Color picker, etc.
│       └── processors/     # Color conversion, etc.
├── lib/                    # Shared utilities (search, SEO, tools registry)
├── styles/                 # Global CSS
├── root.tsx                # App shell (HTML document, theme script)
└── routes.ts               # Route definitions
```

## How to Add a New Tool

Each tool requires three pieces:

### 1. Processor (`app/features/<category>/processors/<tool>.ts`)

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

### 2. React Component (`app/features/<category>/components/<tool>.tsx`)

Interactive widget using shadcn/ui. Imports the processor statically (code splitting is handled at the route level).

```tsx
import { ToolDropzone } from '~/components/tool/tool-dropzone';
import { DownloadButton } from '~/components/tool/tool-actions';
import { myTool } from '~/features/category/processors/my-tool';

export default function MyTool() {
  // ToolDropzone → call processor → show DownloadButton
}
```

### 3. Route (`app/routes/<category>/<tool>.tsx`)

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

Don't forget to add the route to `app/routes.ts` and `react-router.config.ts` (prerender list).

### 4. Tests (TDD — specs first)

Every new feature **must** have tests written **before** the implementation. We follow test-driven development:

1. **Write spec files first** — create unit tests (Vitest) and/or e2e tests (Playwright) that describe the expected behavior.
2. **Run tests to confirm they fail** — `npm test` should show your new tests failing.
3. **Build the feature** — implement code until all tests pass.
4. **Refactor** — clean up while keeping tests green.

#### Unit tests (Vitest)

Located in `tests/unit/`. Mirror the `app/` structure:

```
tests/unit/
├── processors/     # Processor tests (pure logic)
└── components/     # React component tests (@testing-library/react)
```

```bash
npm test          # Run once
npm run test:watch # Watch mode
```

#### E2E tests (Playwright)

Located in `tests/e2e/`. One spec per page or feature:

```bash
npm run test:e2e   # Run e2e tests (starts dev server automatically)
npm run test:all   # Run both unit + e2e
```

#### What to test for a new tool

| Layer | File | What to test |
|---|---|---|
| Processor | `tests/unit/processors/<category>/<tool>.test.ts` | Input/output, options, edge cases, error handling |
| Component | `tests/unit/components/tools/<Tool>.test.tsx` | Rendering, user interactions, state transitions |
| E2E | `tests/e2e/<tool>.spec.ts` | Full page load, file drop, conversion flow, download |

## Key Rules

1. **Client-side only.** All file processing must happen in the browser. No server uploads. No external API calls with user data.
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
