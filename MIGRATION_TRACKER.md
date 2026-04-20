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

## Snapshot (2026-04-19, post Phase 5)

55 primary web processors. **All 55 import `@nouploads/core`; architecture exempt list is empty.** Of the 55: ~29 are true runtime delegators via the image-pipeline worker or direct `getTool().execute()` calls; ~19 are developer tools that thinly re-export from core but still execute in-process for sync UX (Phase 3 audit); 7 are genuinely browser-only (pdfjs-dist DOM dependency, gifsicle-wasm-browser, @imgly/background-removal, canvas rasterization) and declare a type-only core dependency so the drift-prevention test keeps working.

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
| `pdf-tools/processors/pdf-to-text.ts` | ✅ (type-only) | `pdf-to-text` stub | 🌐 | n/a | Phase 5 done 2026-04-19: pdfjs-dist needs DOMMatrix (DOM-only). Type-only core import tracks dependency. |
| `pdf-tools/processors/compress-pdf.ts` | ✅ (type-only) | `compress-pdf` stub | 🌐 | n/a | Phase 5 done 2026-04-19: pdfjs-dist + canvas both DOM-only. Type-only core import. |
| `pdf-tools/processors/pdf-to-image.ts` | ✅ (type-only) | `pdf-to-jpg`/`pdf-to-png` stubs | 🌐 | n/a | Phase 5 done 2026-04-19: pdfjs-dist needs DOMMatrix. Type-only core import. |
| **vector-tools (2)** | | | | | |
| `vector-tools/processors/optimize-svg.ts` | ✅ | `optimize-svg` | ✅ | n/a | |
| `vector-tools/processors/convert-vector.ts` | ✅ (type-only) | `convert-vector` stub | 🌐 | n/a | Phase 5 done 2026-04-19: SVG → raster via `<img>` + canvas, DOM-only. Added stub + type-only import. |
| **developer-tools (23)** | | | | | |
| `developer-tools/processors/base64-image.ts` | ✅ | `base64` | ✅ | n/a | |
| `developer-tools/processors/case-converter.ts` | ❌ permanent fork | `case-converter` | ❌ permanent | n/a | sync UX, trivial impl |
| `developer-tools/processors/color-picker.ts` | ❌ permanent fork | (none) | ❌ permanent | n/a | sync UX, color math |
| `developer-tools/processors/cron-parser.ts` | ❌ permanent fork | `cron-parser` | ❌ permanent | n/a | sync UX, custom parser |
| `developer-tools/processors/css-formatter.ts` | ❌ permanent fork | `css-formatter` | ❌ permanent | n/a | sync UX, simple impl |
| `developer-tools/processors/hash-generator.ts` | ❌ permanent fork | `hash-generator` | ❌ permanent | n/a | sync Web Crypto wrapper |
| `developer-tools/processors/html-formatter.ts` | ✅ | `html-formatter` | ✅ | n/a | Migrated 2026-04-17 (Phase 3.1) |
| `developer-tools/processors/js-formatter.ts` | ✅ | `js-formatter` | ✅ | n/a | Migrated 2026-04-17 (Phase 3.1) |
| `developer-tools/processors/json-csv.ts` | ❌ permanent fork | `json-csv` | ❌ permanent | n/a | sync UX, custom parser |
| `developer-tools/processors/json-formatter.ts` | ❌ permanent fork | `json-formatter` | ❌ permanent | n/a | sync UX, JSON.parse wrapper |
| `developer-tools/processors/jwt-decoder.ts` | ❌ permanent fork | `jwt-decoder` | ❌ permanent | n/a | sync UX, base64+JSON |
| `developer-tools/processors/lorem-ipsum.ts` | ❌ permanent fork | `lorem-ipsum` | ❌ permanent | n/a | sync UX, text generator |
| `developer-tools/processors/markdown-preview.ts` | ❌ permanent fork | `markdown-preview` | ❌ permanent | n/a | sync UX, marked() async:false (typing→preview) |
| `developer-tools/processors/qr-code.ts` | ❌ permanent fork | `qr-code` | ❌ permanent | n/a | multi-format output (PNG+SVG); core's single-output contract mismatch |
| `developer-tools/processors/regex-tester.ts` | ❌ permanent fork | `regex-tester` | ❌ permanent | n/a | sync UX, RegExp eval |
| `developer-tools/processors/sql-formatter.ts` | ✅ | `sql-formatter` | ✅ | n/a | Migrated 2026-04-17 (Phase 3.1) |
| `developer-tools/processors/text-diff.ts` | ❌ permanent fork | `text-diff` | ❌ permanent | n/a | sync UX, diff algo |
| `developer-tools/processors/timestamp-converter.ts` | ❌ permanent fork | `timestamp-converter` | ❌ permanent | n/a | sync UX, Date methods |
| `developer-tools/processors/url-encoder.ts` | ❌ permanent fork | `url-encoder` | ❌ permanent | n/a | sync UX, encodeURIComponent wrapper |
| `developer-tools/processors/uuid-generator.ts` | ❌ permanent fork | `uuid-generator` | ❌ permanent | n/a | sync UX, crypto.randomUUID wrapper |
| `developer-tools/processors/word-counter.ts` | ❌ permanent fork | `word-counter` | ❌ permanent | n/a | sync UX, regex counts |
| `developer-tools/processors/xml-json.ts` | ❌ permanent fork | `xml-json` | ❌ permanent | n/a | sync UX, fast-xml-parser (typing→convert) |
| `developer-tools/processors/yaml-json.ts` | ❌ permanent fork | `yaml-json` | ❌ permanent | n/a | sync UX, js-yaml (typing→convert) |
| **image-tools (19)** | | | | | |
| `image-tools/processors/rotate-image.ts` | ✅ | `rotate-image` | ✅ | n/a | Migrated 2026-04-17 (Phase 4.0 spike); pipeline-worker pattern proved |
| `image-tools/processors/resize-image.ts` | ✅ | `resize-image` | ✅ | n/a | Migrated 2026-04-17 (Phase 4.1) |
| `image-tools/processors/crop-image.ts` | ✅ | `crop-image` | ✅ | n/a | Migrated 2026-04-17 (Phase 4.1) |
| `image-tools/processors/strip-metadata.ts` | ✅ | `strip-metadata` | ✅ | n/a | Migrated 2026-04-17 (Phase 4.1) |
| `image-tools/processors/exif-metadata.ts` | ✅ | `exif` | ✅ | n/a | Migrated 2026-04-17 (Phase 4.1); exifr on main thread (type-only core import) |
| `image-tools/processors/watermark-image.ts` | ✅ | `watermark-image` | ✅ | n/a | Migrated 2026-04-17 (Phase 4.1) |
| `image-tools/processors/compress-image.ts` | ✅ | `compress-jpg`/`compress-webp`/`compress-png` | ✅ | n/a | Migrated 2026-04-17 (Phase 4.1); dispatches by output format |
| `image-tools/processors/compress-png.ts` | ✅ | `compress-png` | ✅ | n/a | Migrated 2026-04-17 (Phase 4.1); added `quantize` to canvas backend using image-q |
| `image-tools/processors/image-filters.ts` | ✅ | `image-filters` | ✅ | n/a | Migrated 2026-04-17 (Phase 4.1); ported pixel math into core |
| `image-tools/processors/favicon-generator.ts` | ✅ | `favicon-generator` | ✅ | n/a | Migrated 2026-04-17 (Phase 4.1); pipeline now supports `ToolResultMulti` |
| `image-tools/processors/color-palette.ts` | ✅ | `color-palette` | ✅ | n/a | Migrated 2026-04-17 (Phase 4.1); adapter parses JSON output |
| `image-tools/processors/image-to-pdf.ts` | ✅ | `images-to-pdf` | ✅ | n/a | Migrated 2026-04-17 (Phase 4.1); pipeline now supports multi-input |
| `image-tools/processors/heic-to-jpg.ts` | ✅ | `heic-to-jpg` | ✅ | n/a | Migrated 2026-04-17 (Phase 4.1); heic2any stays main-thread (DOM canvas required); type-only core import |
| `image-tools/processors/heic-to-png.ts` | ✅ | `heic-to-png` | ✅ | n/a | Same as heic-to-jpg |
| `image-tools/processors/heic-to-webp.ts` | ✅ | `heic-to-webp` | ✅ | n/a | Same as heic-to-jpg |
| `image-tools/processors/convert-image.ts` | ✅ | `{png,jpg,webp,avif,…}-to-*` (type-only) | ✅ | n/a | Migrated 2026-04-17 (Phase 4.1); inherent web-only (50+ JS pixel decoders + HEIC + SVG + AVIF WASM); type-only core import documents dependency |
| `image-tools/processors/compress-gif.ts` | ✅ (type-only) | `compress-gif` stub | 🌐 | n/a | Phase 5 done 2026-04-19: gifsicle-wasm-browser is browser-only. Added stub + type-only import. |
| `image-tools/processors/parse-gif-frames.ts` | ✅ (type-only) | `parse-gif-frames` stub | 🌐 | n/a | Phase 5 done 2026-04-19: gifuct-js + canvas compositing. Type-only import (core stub renamed from `gif-frames`). |
| `image-tools/processors/remove-background.ts` | ✅ (type-only) | `remove-background` stub | 🌐 | n/a | Phase 5 done 2026-04-19: @imgly/background-removal is browser-only ML. Type-only import. |

## Worker files — Phase 4 outcome

Per-tool workers were **collapsed into a single generic `image-pipeline.worker.ts`** that loads the requested core tool by ID, spins up a canvas-backed `ImageBackend`, and runs the tool's `execute`/`executeMulti`. One worker per request; terminated after the response. Supports both single-input (`input: Uint8Array`) and multi-input (`inputs: Uint8Array[]`) tools, and both `ToolResult` and `ToolResultMulti` responses.

Remaining workers live in `apps/web/app/features/image-tools/workers/` and `…/processors/`:

- `image-pipeline.worker.ts` — generic dispatcher (new; serves all migrated image tools)
- `avif-encode.worker.ts` — AVIF WASM encoder (convert-image's AVIF path; cannot go via canvas)
- `convert-image.worker.ts` — universal OffscreenCanvas encoder for exotic-decoder paths
- `parse-gif-frames.worker.ts` — Phase 5 browser-only
- `heic-decode.worker.ts` — reserved; current HEIC path keeps `heic2any` on main thread

Deleted as part of Phase 4.1: `compress-image.worker.ts`, `compress-png.worker.ts`, `favicon-generator.worker.ts`, `image-filters.worker.ts`, `rotate-image.worker.ts`, `resize-image.worker.ts`, `crop-image.worker.ts`, `watermark-image.worker.ts`.

## Phase 4.1 bundle (recorded 2026-04-17)

Total `apps/web/build/client/`: **55 MB** (includes prerendered HTML, images, fonts). +3 MB vs. Phase 3S baseline; attributable to (a) image-q moved from web to `@nouploads/backend-canvas` where the new `quantize` method lives, and (b) pixel-math for image-filters promoted into core. No unexpected regressions.

## Phase 3S baseline bundle (recorded 2026-04-18)

Total `apps/web/build/client/`: **52 MB** (includes prerendered HTML, images, fonts).

Largest JS chunks:
- `heic2any` — 1.3 MB (unrelated to dev tools)
- `main` — 1.2 MB
- `svgo-node` — 564 KB
- `openjpegjs_decode` — 484 KB
- `index-*` — 472 KB (root shell)
- `pdf` (pdf-lib) — 400 KB

Used to detect bundle regression after Phase 3S.1 core tree-shake refactor.

## Migration progress

| Phase | Total | Migrated | Remaining | Status |
|---|---|---|---|---|
| Phase 0 — Foundation | 7 tasks | 7 | 0 | ✅ done (2026-04-17) |
| Phase 1 — Core contract extension | 3 tasks (signal, ToolResultMulti, heic re-classify) | 3 | 0 | ✅ done (2026-04-17) |
| Phase 2 — PDF migrations | 4 (unlock, reorder, split, protect) | 4 | 0 | ✅ done (2026-04-17) |
| Phase 3 — Developer migrations | 22 dev tools (strict SSOT, no forks) | 22 | 0 | ✅ done (2026-04-18, Phase 3S). All 22 web processors are thin re-exports from @nouploads/core/tools/<id>; also created color-picker in core, replaced markdown-preview + hash-generator stubs with real impls, added marked + culori deps |
| Phase 4.0 — Image spike | 1 (rotate-image) | 1 | 0 | ✅ done (2026-04-17) |
| Phase 4.1 — Image rollout | 15 | 15 | 0 | ✅ done (2026-04-17) — generic `image-pipeline.worker.ts` with multi-input + multi-output; added `quantize` to canvas backend; ported image-filters pixel math to core; core's `favicon-generator` returns `ToolResultMulti` (3 PNGs + ICO). convert-image + HEIC trio keep their DOM-only/exotic paths but declare a type-only core dependency. |
| Phase 5 — Browser-only cleanup | 7 (compress-gif, compress-pdf, convert-vector, parse-gif-frames, pdf-to-image, pdf-to-text, remove-background; compress-png was lifted into Phase 4.1 via canvas-backend quantize) | 7 | 0 | ✅ done (2026-04-19) — all 7 declare type-only core imports; added `convert-vector`, `compress-gif`, `parse-gif-frames` stubs to `browser-only-stubs.ts`; architecture exempt list is empty |
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
