# @nouploads/core

Platform-agnostic tool registry and processors that power the [nouploads](https://www.npmjs.com/package/nouploads) CLI, the [nouploads.com](https://nouploads.com) web app, and any future bindings.

This package is **private today** — the same code ships to npm via the [`nouploads`](https://www.npmjs.com/package/nouploads) package (CLI + library). Everything here is the single source of truth for tool definitions, registration, and execution contracts.

## What's inside

- `src/registry.ts` — global registry of tool definitions + lookup helpers (`getTool`, `getAllTools`, `findToolByFormats`).
- `src/tool.ts` — the `ToolDefinition` contract every tool implements: `id`, `name`, `category`, `options`, and `execute(input, options, context)`.
- `src/backend.ts` — the `ImageBackend` interface (`decode` / `encode` / `resize` / `crop` / optional `transcode` + `quantize`). Consumers pass a platform-specific implementation via `ToolContext.imageBackend`.
- `src/tools/*.ts` — one file per tool (or one file per closely-related family, e.g. `compress-image.ts` registers `compress-jpg` / `compress-webp` / `compress-png`). Each file calls `registerTool(...)` as a side effect on import.
- `src/tools/standard-conversions.ts` / `exotic-conversions.ts` — factory-registered format-pair tools (`png-to-jpg`, `tiff-to-png`, …).
- `src/tools/browser-only-stubs.ts` — registrations for tools whose real implementation must live in the browser (pdfjs-dist, gifsicle-wasm, `@imgly/background-removal`, canvas rasterization). `execute` throws in Node.
- `src/load-all-tools.ts` — `loadAllTools()` that dynamically imports every `./tools/*.js` so every tool is registered. Uses dynamic imports on purpose so per-tool tree-shaking still works for consumers that only need one tool.

## Tree-shaking

Consumers can pay only for the tools they use:

```ts
// Pays for one tool (≈ 4 KB + registry).
import tool from "@nouploads/core/tools/rotate-image";
const result = await tool.execute(bytes, { action: "rotate-cw" }, { imageBackend });
```

Or load the whole catalogue:

```ts
// Registers all ~100 tools (dynamic imports — still chunkable by bundlers).
import { loadAllTools } from "@nouploads/core/load-all-tools";
await loadAllTools();
```

`package.json` declares `"sideEffects": ["./dist/tools/*.js", "./dist/load-all-tools.js"]`, so bundlers know the `registerTool(...)` calls in those files are intentional and must not be tree-shaken, while the rest of the package is pure.

## Adding a new tool

1. `packages/core/src/tools/<id>.ts` — define `ToolDefinition`, call `registerTool`, default-export the tool.
2. `packages/core/src/load-all-tools.ts` — add a `await import("./tools/<id>.js")` line.
3. `packages/core/tests/<id>.test.ts` — registration + options + a real-execute smoke test.
4. Add a web adapter under `apps/web/app/features/<category>/processors/<id>.ts` if the UI needs it, and a case in `apps/web/app/features/image-tools/workers/image-pipeline.worker.ts` if it's an image tool that runs through the pipeline.

See `CLAUDE.md` at the repo root for the full contract rules.

## Public surface

The `nouploads` npm package re-exports this module verbatim. The subpath layout is:

```
nouploads                     → @nouploads/core entry (registry helpers, types, convert())
nouploads/load-all-tools      → loadAllTools()
nouploads/tools/<id>          → individual tool module (default export + any named helpers)
```

Internal (workspace-only) consumers import `@nouploads/core` directly; external consumers import `nouploads`.

## License

[MIT](./LICENSE). The apps/web AGPL license does not extend to this package.
