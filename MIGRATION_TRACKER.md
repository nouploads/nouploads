# MIGRATION_TRACKER.md

Living document tracking the migration from forked web processors to single-source-of-truth via `@nouploads/core`.

**Goal:** every `apps/web/app/features/*/processors/*.ts` file delegates to a tool in `@nouploads/core`. Web processors become thin adapters (File → bytes → core → Blob). Core's tool registry is the single source of truth that powers the web app, the CLI, the npm library, and any future bindings.

**Phase definitions:** see the Phase 0–7 plan in conversation history. Phases referenced here:

- **Phase 2** — PDF tools migration
- **Phase 3** — Developer tool migrations (text-in, text-out)
- **Phase 4** — Image tool migrations via worker-backed ImageBackend
- **Phase 5** — Browser-only tool cleanup
- **n/a** — already delegating, or covered by a different phase

**Status legend:**

- ✅ delegating — web processor calls `getTool(...).execute(...)`
- ❌ forked — web reimplements logic locally
- 🌐 browser-only-stub — registered in core with `capabilities: ["browser"]`, real impl lives in web

## Snapshot (2026-04-17)

55 primary web processors. **10 delegating, 45 forked** (was 6/49 before Phase 2 completed 2026-04-17). 12 worker files (handled separately in Phase 4 backend design, not migrated 1:1).

| Web processor | Current | Core tool ID | Target | Phase | Notes |
|---|---|---|---|---|---|
| **pdf-tools (11)** | | | | | |
| `pdf-tools/processors/merge-pdf.ts` | ✅ | `merge-pdf` | ✅ | n/a | Reference pattern |
| `pdf-tools/processors/page-numbers-pdf.ts` | ✅ | `page-numbers-pdf` | ✅ | n/a | |
| `pdf-tools/processors/rotate-pdf.ts` | ✅ | `rotate-pdf` | ✅ | n/a | |
| `pdf-tools/processors/watermark-pdf.ts` | ✅ | `watermark-pdf` | ✅ | n/a | |
| `pdf-tools/processors/protect-pdf.ts` | ✅ | `protect-pdf` | ✅ | n/a | Migrated 2026-04-17 (Phase 2.4); also fixed core PASSWORD_PADDING + missing encryptObjects bugs |
| `pdf-tools/processors/reorder-pdf.ts` | ✅ | `reorder-pdf` | ✅ | n/a | Migrated 2026-04-17 (Phase 2.2) |
| `pdf-tools/processors/split-pdf.ts` | ✅ | `split-pdf` | ✅ | n/a | Migrated 2026-04-17 (Phase 2.3); first ToolResultMulti consumer; also fixed core's silently-broken multi-range path |
| `pdf-tools/processors/unlock-pdf.ts` | ✅ | `unlock-pdf` | ✅ | n/a | Migrated 2026-04-17 (Phase 2.1); also fixed core's missing `delete trailerInfo.Encrypt` bug |
| `pdf-tools/processors/pdf-to-text.ts` | ❌ | (stub only) | 🌐 | 5 | Reclassified Phase 2 → 5: web impl uses pdfjs-dist (DOM-only). Stays browser-only. |
| `pdf-tools/processors/compress-pdf.ts` | ❌ | (stub only) | 🌐 | 5 | Reclassified Phase 2 → 5: web impl uses pdfjs-dist + canvas to rasterize pages, both DOM-only. Stays browser-only. |
| `pdf-tools/processors/pdf-to-image.ts` | ❌ | (stub only) | 🌐 | 5 | pdfjs-dist needs DOMMatrix; stays browser-only with worker-backed ImageBackend |
| **vector-tools (2)** | | | | | |
| `vector-tools/processors/optimize-svg.ts` | ✅ | `optimize-svg` | ✅ | n/a | |
| `vector-tools/processors/convert-vector.ts` | ❌ | (none) | 🌐 | 5 | SVG → raster via Canvas; browser-only |
| **developer-tools (23)** | | | | | |
| `developer-tools/processors/base64-image.ts` | ✅ | `base64` | ✅ | n/a | |
| `developer-tools/processors/case-converter.ts` | ❌ | `case-converter` | ✅ | 3 | text→text |
| `developer-tools/processors/color-picker.ts` | ❌ | (none) | ✅ | 3 | Pure color math; add to core if not present |
| `developer-tools/processors/cron-parser.ts` | ❌ | `cron-parser` | ✅ | 3 | text→text |
| `developer-tools/processors/css-formatter.ts` | ❌ | `css-formatter` | ✅ | 3 | text→text |
| `developer-tools/processors/hash-generator.ts` | ❌ | `hash-generator` | ✅ | 3 | bytes→text |
| `developer-tools/processors/html-formatter.ts` | ❌ | `html-formatter` | ✅ | 3 | text→text |
| `developer-tools/processors/js-formatter.ts` | ❌ | `js-formatter` | ✅ | 3 | text→text |
| `developer-tools/processors/json-csv.ts` | ❌ | `json-csv` | ✅ | 3 | text→text |
| `developer-tools/processors/json-formatter.ts` | ❌ | `json-formatter` | ✅ | 3 | text→text |
| `developer-tools/processors/jwt-decoder.ts` | ❌ | `jwt-decoder` | ✅ | 3 | text→text |
| `developer-tools/processors/lorem-ipsum.ts` | ❌ | `lorem-ipsum` | ✅ | 3 | text→text |
| `developer-tools/processors/markdown-preview.ts` | ❌ | `markdown-preview` | ✅ | 3 | text→text |
| `developer-tools/processors/qr-code.ts` | ❌ | `qr-code` | ✅ | 3 | text→PNG |
| `developer-tools/processors/regex-tester.ts` | ❌ | `regex-tester` | ✅ | 3 | text→text |
| `developer-tools/processors/sql-formatter.ts` | ❌ | `sql-formatter` | ✅ | 3 | text→text |
| `developer-tools/processors/text-diff.ts` | ❌ | `text-diff` | ✅ | 3 | text→text |
| `developer-tools/processors/timestamp-converter.ts` | ❌ | `timestamp-converter` | ✅ | 3 | text→text |
| `developer-tools/processors/url-encoder.ts` | ❌ | `url-encoder` | ✅ | 3 | text→text |
| `developer-tools/processors/uuid-generator.ts` | ❌ | `uuid-generator` | ✅ | 3 | text→text |
| `developer-tools/processors/word-counter.ts` | ❌ | `word-counter` | ✅ | 3 | text→text |
| `developer-tools/processors/xml-json.ts` | ❌ | `xml-json` | ✅ | 3 | text→text |
| `developer-tools/processors/yaml-json.ts` | ❌ | `yaml-json` | ✅ | 3 | text→text |
| **image-tools (19)** | | | | | |
| `image-tools/processors/rotate-image.ts` | ❌ | `rotate-image` | ✅ | 4.0 | **Spike** — simplest image tool; proves worker-backed ImageBackend pattern |
| `image-tools/processors/resize-image.ts` | ❌ | `resize-image` | ✅ | 4.1 | Simple |
| `image-tools/processors/crop-image.ts` | ❌ | `crop-image` | ✅ | 4.1 | Simple |
| `image-tools/processors/strip-metadata.ts` | ❌ | `strip-metadata` | ✅ | 4.1 | Simple |
| `image-tools/processors/exif-metadata.ts` | ❌ | `exif` | ✅ | 4.1 | Read-only |
| `image-tools/processors/watermark-image.ts` | ❌ | `watermark-image` | ✅ | 4.1 | Medium |
| `image-tools/processors/compress-image.ts` | ❌ | `compress-image` | ✅ | 4.1 | Medium — quality range varies by format |
| `image-tools/processors/convert-image.ts` | ❌ | (universal — registers per format) | ✅ | 4.1 | Medium — format compatibility matrix |
| `image-tools/processors/image-filters.ts` | ❌ | `image-filters` | ✅ | 4.1 | Medium — pixel ops |
| `image-tools/processors/favicon-generator.ts` | ❌ | `favicon-generator` | ✅ | 4.1 | Medium — needs Phase 1 `ToolResultMulti` (multiple sizes) |
| `image-tools/processors/color-palette.ts` | ❌ | `color-palette` | ✅ | 4.1 | Medium — verify image-q Node compat |
| `image-tools/processors/image-to-pdf.ts` | ❌ | `images-to-pdf` | ✅ | 4.1 | Medium — pdf-lib + image decode |
| `image-tools/processors/heic-to-jpg.ts` | ❌ | `heic-to-jpg` | ✅ | 4.1 | Worker backend uses heic2any in browser; sharp+libheif in Node |
| `image-tools/processors/heic-to-png.ts` | ❌ | `heic-to-png` | ✅ | 4.1 | Misfiled in browser-only-stubs.ts; actually delegates via imageBackend |
| `image-tools/processors/heic-to-webp.ts` | ❌ | `heic-to-webp` | ✅ | 4.1 | Same as heic-to-png |
| `image-tools/processors/compress-gif.ts` | ❌ | (none) | 🌐 | 5 | gifsicle-wasm-browser is browser-only |
| `image-tools/processors/parse-gif-frames.ts` | ❌ | (none) | 🌐 | 5 | Multi-output (N frames); browser-only for now |
| `image-tools/processors/remove-background.ts` | ❌ | `remove-background` | 🌐 | 5 | @imgly/background-removal is browser-only ML |
| `image-tools/processors/compress-png.ts` | ❌ | (none) | 🌐 | 5 | Uses image-q + custom worker pipeline |

## Worker files (12) — Phase 4 design

These are not migrated 1:1; they become implementation details of the worker-backed `ImageBackend` in `apps/web`. Strategy: each tool's worker stays in apps/web; web's `ImageBackend` impl posts messages to the right worker per `decode/encode/resize/crop/transcode` call. Core stays synchronous-looking; backend handles worker lifecycle.

- `avif-encode.worker.ts`
- `compress-image.worker.ts`
- `compress-png.worker.ts`
- `convert-image.worker.ts`
- `crop-image.worker.ts`
- `favicon-generator.worker.ts`
- `heic-decode.worker.ts`
- `image-filters.worker.ts`
- `parse-gif-frames.worker.ts`
- `resize-image.worker.ts`
- `rotate-image.worker.ts`
- `watermark-image.worker.ts`

## Migration progress

| Phase | Total | Migrated | Remaining | Status |
|---|---|---|---|---|
| Phase 0 — Foundation | 7 tasks | 7 | 0 | ✅ done (2026-04-17) |
| Phase 1 — Core contract extension | 3 tasks (signal, ToolResultMulti, heic re-classify) | 3 | 0 | ✅ done (2026-04-17) |
| Phase 2 — PDF migrations | 4 (unlock, reorder, split, protect) | 4 | 0 | ✅ done (2026-04-17) |
| Phase 3 — Developer migrations | 22 | 0 | 22 | pending |
| Phase 4.0 — Image spike | 1 (rotate-image) | 0 | 1 | pending |
| Phase 4.1 — Image rollout | 14 | 0 | 14 | pending |
| Phase 5 — Browser-only cleanup | 8 (compress-gif, compress-pdf, compress-png, convert-vector, parse-gif-frames, pdf-to-image, pdf-to-text, remove-background) | 0 | 8 | pending |
| Phase 6 — First npm publish | 1 | 0 | 1 | blocked on Phases 2–5 |
| Phase 7 — Drift prevention test | 1 | 1 | 0 | ✅ done (2026-04-17) |

## Per-tool migration checklist

When migrating a single tool (e.g. `rotate-pdf` → `protect-pdf`), follow this checklist:

1. Verify the corresponding core tool exists and matches the web processor's behavior. If missing, add to `packages/core/src/tools/<id>.ts` first with full unit tests.
2. Create `<processor>.core.ts` next to the existing `<processor>.ts` — implements the new path that calls `getTool(<id>).execute(...)`.
3. Add an entry to `apps/web/app/lib/feature-flags.ts`: `"<id>": false`.
4. Update `<processor>.ts` to dispatch on the flag.
5. Run `pnpm test:e2e` for the affected tool route.
6. Flip flag to `true`, deploy, monitor for ~2 weeks.
7. Second PR: delete `<processor>.legacy.ts` (the old fork), remove the flag entry.
8. Update this tracker (✅ in the table).

## Drift prevention

After Phase 0, an architecture test in `apps/web/tests/unit/architecture.test.ts` will fail CI if any new web processor under `apps/web/app/features/*/processors/*.ts` doesn't import from `@nouploads/core`. The 49 currently-forked processors are grandfathered into a `CORE_DELEGATION_EXEMPT` list; the list shrinks as each tool is migrated. New entries are forbidden.
