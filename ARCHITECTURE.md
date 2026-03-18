# ARCHITECTURE.md

## Overview

NoUploads is a privacy-first, open-source collection of file tools that process everything 100% client-side. No files ever leave the user's device.

Built with React Router framework mode on Vite. Pre-rendered for SEO. Deployed as static HTML to AWS S3 + CloudFront.

---

## Stack

| Layer | Technology |
|---|---|
| Build | Vite |
| Framework | React Router v7 (framework mode) |
| UI | React, shadcn/ui (Radix, new-york), Tailwind CSS v4 |
| Routing | React Router (file conventions under `app/routes/`) |
| SEO | Route `meta()` exports, `buildMeta()` helper, pre-rendering |
| Testing | Vitest (unit + component), Playwright (e2e + smoke + stress) |
| Deployment | Static pre-rendered HTML → S3 + CloudFront |

---

## Folder Structure

```
nouploads/
├─ CLAUDE.md                        # AI agent operating rules
├─ CODE_GUIDELINES.md               # Development rules and conventions
├─ TOOL_PLAYBOOK.md                 # Step-by-step recipe for adding tools
├─ ARCHITECTURE.md                  # This file
├─ PROMPTS/                         # Versioned AI prompt templates
├─ .github/
│  └─ PULL_REQUEST_TEMPLATE.md
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ react-router.config.ts           # Pre-render route list
├─ components.json                  # shadcn/ui config
├─ public/
│  ├─ favicon.svg
│  ├─ robots.txt
│  └─ og/                           # Open Graph images per route
├─ app/
│  ├─ root.tsx                      # HTML document shell
│  ├─ routes.ts                     # Route definitions
│  ├─ entry.client.tsx
│  ├─ entry.server.tsx
│  ├─ styles/
│  │  └─ global.css                 # Tailwind v4 config + CSS variables
│  ├─ routes/                       # Page routes (thin files)
│  ├─ components/
│  │  ├─ layout/                    # Site header, footer, privacy banner
│  │  ├─ tool/                      # Shared tool UI primitives
│  │  ├─ marketing/                 # Homepage sections
│  │  ├─ seo/                       # JSON-LD components
│  │  └─ ui/                        # shadcn/ui generated components
│  ├─ features/                     # Domain-specific logic
│  │  ├─ image-tools/
│  │  │  ├─ components/             # Tool UI components
│  │  │  ├─ processors/             # Pure processing logic
│  │  │  └─ lib/                    # Feature-local helpers
│  │  ├─ pdf-tools/                 # Future
│  │  └─ shared/
│  │     ├─ lib/                    # File-size, download, MIME helpers
│  │     └─ types/                  # Shared type definitions
│  ├─ lib/
│  │  ├─ seo/                       # buildMeta() and SEO helpers
│  │  ├─ search.ts                  # Fuse.js fuzzy search config
│  │  ├─ tools.ts                   # Tool registry (titles, descriptions, icons)
│  │  └─ utils.ts                   # cn() helper
│  └─ hooks/                        # Shared React hooks
└─ tests/
   ├─ fixtures/                     # Real test files (HEIC, JPG, PDF, etc.)
   ├─ unit/                         # Vitest: processors, helpers, hooks
   ├─ component/                    # Vitest + RTL: UI behavior
   ├─ e2e/                          # Playwright: browser flows + smoke
   └─ stress/                       # Playwright: large files, many files
```

---

## Layer Responsibilities

### `app/routes/`
Page entry points. Each file exports `meta()` and renders a layout with a feature component. Route files should be thin (~50-120 lines). No heavy business logic here.

### `app/components/layout/`
Site shell: header, footer, privacy banner, command palette. Shared across all pages. Must not import heavy tool-specific dependencies.

### `app/components/tool/`
Reusable tool UI primitives: dropzone, preview, actions bar, empty/error/processing states. Used by all tool pages for consistency.

### `app/components/marketing/`
Homepage sections: hero, tool grid, how-it-works, verify section, FAQ. Only used on marketing pages.

### `app/components/ui/`
shadcn/ui generated components. Do not edit manually unless necessary. Keep this clean and boring.

### `app/features/{category}/`
Domain-specific logic grouped by tool category. Each feature area has its own `components/`, `processors/`, and `lib/`. Heavy dependencies stay here and are never leaked to shared modules.

### `app/features/shared/`
Tiny shared utilities used across feature categories: file-size formatting, download helpers, MIME detection, type definitions.

### `app/lib/`
App-wide utilities: SEO helpers, search config, tool registry, Tailwind `cn()` helper.

### `app/hooks/`
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

## Code Splitting Strategy

1. **Route splitting** (automatic): React Router code-splits each route module.
2. **Lazy tool components**: `lazy(() => import(...))` loads tool UI only when route renders.
3. **Dynamic processor imports**: `await import(...)` loads heavy engines (heic2any, ffmpeg.wasm, etc.) only on user interaction.

Users of one tool never download another tool's dependencies.

---

## SEO Strategy

- All public routes are pre-rendered at build time via `react-router.config.ts`
- Each route exports `meta()` with title, description, canonical, OG tags
- Shared `buildMeta()` helper prevents inconsistent metadata
- JSON-LD structured data on tool pages where useful
- Real `<a href>` links for crawler discoverability
- History API routing (no hash fragments)
- Proper 404 page with correct HTTP status

---

## Build & Deploy

```
npm run build    # Vite build + React Router pre-rendering
```

Output: `build/client/` containing:
- Pre-rendered HTML for every public route
- Code-split JS chunks
- CSS
- Static assets from `public/`
- `sitemap.xml` (via vite-plugin-sitemap)

Deploy `build/client/` to S3. Serve via CloudFront with:
- `index.html` as default document
- Custom error response for 404 → `/404.html`

---

## Testing Strategy

| Layer | Tool | Scope | Coverage goal |
|---|---|---|---|
| Unit | Vitest | Processors, helpers, hooks, meta builders | High |
| Component | Vitest + RTL | Tool UI behavior, state transitions | Moderate |
| E2E | Playwright | Full browser flows, route smoke, cross-browser | Thin but strong |
| Stress | Playwright | Large files, many files, memory limits | Explicit |

Smoke tests cover every public route: loads, title exists, h1 exists, no console errors.

---

## Canonical Example

`/image/heic-to-jpg` is the hand-curated canonical tool. Every new tool copies its exact structure. See `TOOL_PLAYBOOK.md` for the step-by-step recipe.
