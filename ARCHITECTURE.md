# ARCHITECTURE.md

## Overview

NoUploads is a privacy-first, open-source collection of file tools that process everything 100% client-side. No files ever leave the user's device.

Built as a monorepo with a shared core library (`@nouploads/core`) and a web app (`@nouploads/web`). The web app uses React Router framework mode on Vite, pre-rendered for SEO, deployed as static HTML to AWS S3 + CloudFront.

---

## Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Build | Vite (web), tsup (packages) |
| Framework | React Router v7 (framework mode) |
| UI | React, shadcn/ui (Radix, new-york), Tailwind CSS v4 |
| Routing | React Router (file conventions under `apps/web/app/routes/`) |
| SEO | Route `meta()` exports, `buildMeta()` helper, pre-rendering |
| Testing | Vitest (unit + component), Playwright (e2e) |
| Deployment | Static pre-rendered HTML → S3 + CloudFront |

---

## Monorepo Structure

```
nouploads/
├─ CLAUDE.md                        # AI agent operating rules
├─ CODE_GUIDELINES.md               # Development rules and conventions
├─ TOOL_PLAYBOOK.md                 # Step-by-step recipe for adding tools
├─ ARCHITECTURE.md                  # This file
├─ PROMPTS/                         # Versioned AI prompt templates
├─ .github/
│  └─ PULL_REQUEST_TEMPLATE.md
├─ package.json                     # Root workspace config (turbo scripts)
├─ pnpm-workspace.yaml              # pnpm workspace definition
├─ turbo.json                       # Turborepo pipeline config
├─ fixtures/                        # Shared test fixtures
├─ packages/
│  ├─ core/                         # @nouploads/core — shared tool logic
│  │  ├─ src/
│  │  │  ├─ index.ts                # Exports + side-effect tool registration
│  │  │  ├─ registry.ts             # Tool registry (findToolByFormats, getAllTools)
│  │  │  ├─ tool.ts                 # ToolDefinition type
│  │  │  ├─ backend.ts              # ImageBackend interface
│  │  │  ├─ format-maps.ts          # FORMAT_TO_MIME, FORMAT_TO_EXTENSION
│  │  │  ├─ tools/                  # Tool definitions (one per tool)
│  │  │  └─ decoders/               # Shared decoder types
│  │  └─ tests/                     # Core unit tests
│  ├─ cli/                          # CLI tool (published as `nouploads` on npm)
│  ├─ backend-sharp/                # Node.js image backend using sharp
│  └─ backend-canvas/               # Browser image backend using Canvas API
├─ apps/
│  └─ web/                          # @nouploads/web — the website
│     ├─ package.json
│     ├─ vite.config.ts
│     ├─ react-router.config.ts     # Pre-render route list
│     ├─ components.json            # shadcn/ui config
│     ├─ public/
│     │  ├─ favicon.svg
│     │  └─ robots.txt
│     ├─ app/
│     │  ├─ root.tsx                # HTML document shell
│     │  ├─ routes.ts               # Route definitions
│     │  ├─ styles/
│     │  │  └─ global.css           # Tailwind v4 config + CSS variables
│     │  ├─ routes/                 # Page routes (thin files)
│     │  │  ├─ home.tsx, about.tsx
│     │  │  ├─ image/               # Image tool pages
│     │  │  ├─ pdf/                 # PDF tool pages
│     │  │  ├─ vector/              # Vector tool pages
│     │  │  └─ developer/           # Developer tool pages
│     │  ├─ components/
│     │  │  ├─ layout/              # Site header, footer, command palette
│     │  │  ├─ tool/                # Shared tool UI (dropzone, compare slider, fullscreen)
│     │  │  ├─ marketing/           # Homepage sections, tool grid, tool icon
│     │  │  ├─ seo/                 # JSON-LD components
│     │  │  └─ ui/                  # shadcn/ui generated components
│     │  ├─ features/               # Domain-specific logic
│     │  │  ├─ image-tools/
│     │  │  │  ├─ components/       # Tool UI components
│     │  │  │  ├─ processors/       # Pure processing logic
│     │  │  │  ├─ decoders/         # Format-specific decoders (DDS, EXR, TGA, etc.)
│     │  │  │  └─ lib/              # Feature-local helpers
│     │  │  ├─ pdf-tools/
│     │  │  │  ├─ components/       # PDF tool UI components
│     │  │  │  ├─ processors/       # PDF processing logic
│     │  │  │  └─ lib/              # PDF feature-local helpers
│     │  │  ├─ vector-tools/
│     │  │  │  ├─ components/       # SVG optimizer UI
│     │  │  │  ├─ processors/       # SVG processing logic
│     │  │  │  └─ decoders/         # Vector format decoders
│     │  │  └─ developer-tools/
│     │  │     ├─ components/       # Color picker, JSON formatter, etc.
│     │  │     └─ processors/       # Color conversion, hashing, etc.
│     │  ├─ lib/
│     │  │  ├─ seo/                 # buildMeta() and SEO helpers
│     │  │  ├─ search.ts            # Fuse.js fuzzy search config
│     │  │  ├─ tools.ts             # Tool registry (titles, descriptions, icons)
│     │  │  ├─ accept.ts            # MIME accept filters
│     │  │  └─ utils.ts             # cn() helper
│     │  └─ hooks/                  # Shared React hooks
│     └─ tests/
│        ├─ helpers/                # Shared test helpers (drop-file)
│        ├─ unit/                   # Vitest: processors, helpers, hooks, components
│        │  ├─ processors/
│        │  ├─ components/tools/
│        │  ├─ helpers/             # Mock workers, etc.
│        │  ├─ hooks/
│        │  └─ lib/
│        └─ e2e/                    # Playwright: browser flows
│           ├─ fixtures/            # Real test files (HEIC, JPG, PNG, WebP, GIF, BMP, ICO, TIFF, PDF, SVG, JP2)
│           └─ helpers/
```

---

## Layer Responsibilities

### `packages/core/`
Platform-agnostic tool logic. Contains tool definitions, format decoders, the tool registry, and the `ImageBackend` interface. The same logic powers the website, CLI, and future desktop/mobile apps. No browser or Node-specific APIs — backends are injected.

### `apps/web/app/routes/`
Page entry points. Each file exports `meta()` and renders a layout with a feature component. Route files should be thin (~50-120 lines). No heavy business logic here.

### `apps/web/app/components/layout/`
Site shell: header, footer, privacy banner, command palette. Shared across all pages. Must not import heavy tool-specific dependencies.

### `apps/web/app/components/tool/`
Reusable tool UI primitives used by all tool pages for consistency:
- `tool-dropzone.tsx` — file upload dropzone with drag/drop and file picker
- `tool-page-layout.tsx` — standard page wrapper with title, description, trust signal
- `tool-actions.tsx` — download button and other action buttons
- `tool-progress.tsx` — batch progress indicator
- `image-compare-slider.tsx` — before/after image comparison with draggable divider
- `fullscreen.tsx` — shared fullscreen primitives (`useFullscreen` hook, `FullscreenToggle` button, `FullscreenOverlay` backdrop)
- `frame-scrubber.tsx` — GIF/animation frame selector
- `library-attribution.tsx` — standardized library/license attribution

### `apps/web/app/components/marketing/`
Homepage sections: hero, tool grid, how-it-works, verify section, FAQ. Only used on marketing pages.

### `apps/web/app/components/ui/`
shadcn/ui generated components. Do not edit manually unless necessary. Keep this clean and boring.

### `apps/web/app/features/{category}/`
Domain-specific logic grouped by tool category (image-tools, pdf-tools, vector-tools, developer-tools). Each feature area has its own `components/`, `processors/`, and optionally `lib/` and `decoders/`. Heavy dependencies stay here and are never leaked to shared modules.

### `apps/web/app/lib/`
App-wide utilities: SEO helpers, search config, tool registry, MIME accept filters, Tailwind `cn()` helper.

### `apps/web/app/hooks/`
Shared React hooks used across features.

---

## Data Flow for a Tool Page

```
User visits /image/heic-to-jpg
  → React Router serves pre-rendered HTML (SEO-ready)
  → React hydrates the page
  → Route component mounts ToolPageLayout + lazy-loads HeicToJpgTool
  → User drops a file
  → Feature component calls processor via dynamic import()
  → Processor (heic2any) loads and converts the file
  → Result blob returned to component
  → Component shows preview + download button
  → User downloads the result
  → No data ever left the device
```

---

## Universal vs Format-Specific Tool Pattern

Tools that support multiple formats (compress, convert) use a shared base component with a config object:

- **Format-specific pages** (e.g. `/image/compress-gif`) export a static config and pass it directly: `<CompressToolBase config={gifCompressConfig} />`
- **Universal pages** (e.g. `/image/compress`) pass a `resolveConfig` function that selects the right format-specific config based on the detected file MIME type: `<CompressToolBase resolveConfig={resolveConfig} accept={ACCEPT_COMPRESSIBLE} />`

The base component handles all shared UI (sliders, dropzone, preview, batch mode). Format-specific configs carry their own slider ranges, labels, and processor functions. This guarantees that both page types always have identical features — adding a slider to a format config automatically appears on both pages.

---

## Code Splitting Strategy

1. **Route splitting** (automatic): React Router code-splits each route module.
2. **Lazy tool components**: `lazy(() => import(...))` loads tool UI only when route renders.
3. **Dynamic processor imports**: `await import(...)` loads heavy engines (heic2any, ffmpeg.wasm, etc.) only on user interaction.

Users of one tool never download another tool's dependencies.

---

## SEO Strategy

- All public routes are pre-rendered at build time via `apps/web/react-router.config.ts`
- Each route exports `meta()` with title, description, canonical, OG tags
- Shared `buildMeta()` helper prevents inconsistent metadata
- JSON-LD structured data on tool pages where useful
- Real `<a href>` links for crawler discoverability
- History API routing (no hash fragments)
- Proper 404 page with correct HTTP status

---

## Build & Deploy

```
pnpm build    # Turborepo builds all packages + web app with pre-rendering
```

Output: `apps/web/build/client/` containing:
- Pre-rendered HTML for every public route
- Code-split JS chunks
- CSS
- Static assets from `public/`
- `sitemap.xml` (via vite-plugin-sitemap)

Deploy `apps/web/build/client/` to S3. Serve via CloudFront with:
- `index.html` as default document
- Custom error response for 404 → `/404.html`

---

## Testing Strategy

| Layer | Tool | Scope | Coverage goal |
|---|---|---|---|
| Unit | Vitest | Processors, helpers, hooks, meta builders | High |
| Component | Vitest + RTL | Tool UI behavior, state transitions | Moderate |
| E2E | Playwright | Full browser flows, upload-process-download | Thin but strong |

---

## Canonical Example

`/image/heic-to-jpg` is the hand-curated canonical tool. Every new tool copies its exact structure. See `TOOL_PLAYBOOK.md` for the step-by-step recipe.
