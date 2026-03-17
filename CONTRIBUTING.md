# Contributing to NoUploads

Thank you for your interest in contributing to NoUploads! This guide will help you get started.

## Contributor License Agreement (CLA)

**All contributors must agree to the [CLA](CLA.md) before their first PR can be merged.** The CLA grants the project owner the right to relicense contributions, which is necessary for dual licensing (AGPL + commercial). You retain copyright of your contributions.

By opening a PR, you confirm that you have read and agree to the CLA.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/nouploads/nouploads.git
cd nouploads
npm install
npm run dev
```

The dev server starts at `http://localhost:4321`.

### Build

```bash
npm run build    # Production build → dist/
npm run preview  # Preview the production build locally
```

## Project Structure

```
src/
├── pages/              # Astro pages (file-based routing)
│   ├── index.astro     # Homepage
│   └── image/          # Image tool pages
├── layouts/            # Astro layouts (BaseLayout, ToolLayout)
├── components/
│   ├── ui/             # shadcn/ui components (do not hand-edit)
│   ├── tools/          # React tool components (interactive islands)
│   ├── *.astro         # Static Astro components
│   └── *.tsx           # Shared React components
├── processors/         # Pure TypeScript processing logic
│   └── image/          # Image processors
├── hooks/              # Custom React hooks
├── lib/                # Shared utilities
└── styles/             # Global CSS
```

## How to Add a New Tool

Each tool requires three files:

### 1. Processor (`src/processors/<category>/<tool>.ts`)

Pure TypeScript function. No React, no DOM, no browser globals.

```typescript
export interface MyToolOptions {
  quality: number;
}

export async function myTool(input: Uint8Array, options: MyToolOptions): Promise<Uint8Array> {
  // Processing logic here
  // Dynamically import heavy libraries inside the function
  const lib = (await import('some-library')).default;
  // ...process and return result
}
```

### 2. React Component (`src/components/tools/MyTool.tsx`)

Interactive widget using shadcn/ui. Calls the processor.

```tsx
import { FileDropzone } from '../FileDropzone';
import { DownloadButton } from '../DownloadButton';
import { myTool } from '../../processors/category/my-tool';

export default function MyTool() {
  // FileDropzone → call processor → show DownloadButton
}
```

### 3. Astro Page (`src/pages/<category>/<tool>.astro`)

SEO-optimized page with static content.

```astro
---
import ToolLayout from '../../layouts/ToolLayout.astro';
import MyTool from '../../components/tools/MyTool.tsx';
---
<ToolLayout title="My Tool" description="Description for SEO">
  <MyTool client:load />

  <section class="prose">
    <h2>How it works</h2>
    <p>Explanation text...</p>

    <h2>Frequently asked questions</h2>
    <!-- Q&A content -->
  </section>
</ToolLayout>
```

## Key Rules

1. **Client-side only.** All file processing must happen in the browser. No server uploads. No external API calls with user data.
2. **Processors are pure.** No React, no DOM, no `document`, no `window` in processor files. They should work in any JavaScript runtime.
3. **Dynamic imports for heavy libraries.** Never import processing libraries at the top level. Use `await import()` inside the function.
4. **Show loading states.** If a library is >500KB, show a progress bar while it loads.
5. **Static content for SEO.** Every tool page must have explanation text and FAQ in the Astro template (not in the React component).

## Commit Conventions

Use conventional commits:

- `feat: add image rotate tool`
- `fix: handle HEIC files with multiple images`
- `docs: update self-hosting instructions`
- `refactor: extract shared processing logic`

## Questions?

Open an issue on GitHub if you need help or have questions.
