# Performance Audit — nouploads.com

**Date:** 2026-03-30

## Entry Point & Shared Bundles

| Asset | Raw | Gzipped | Notes |
|---|---|---|---|
| `entry.client` | 186.93 kB | 59.10 kB | React, React DOM, React Router runtime |
| `chunk-UVKPFVEO` (shared React chunk) | 126.10 kB | 42.43 kB | Shared across entry + all routes |
| `root` module | 1.69 kB | 0.86 kB | Minimal — just shell |
| CSS bundle | 81.27 kB | 13.89 kB | Single Tailwind stylesheet |
| `site-header` | 100.46 kB | 32.57 kB | Header + nav + lazy command palette loader; imported by 79/80 routes |
| `index-BqJMBDCF` (radix primitives) | 3.71 kB | 1.42 kB | Shared UI primitives |

**Baseline per page load (shared JS):** ~318 kB raw / ~103 kB gzipped (entry + shared chunk + site-header + root).

**Assessment:** The entry chunk at 59 kB gzipped is well under the 200 kB target. The shared chunk (~42 kB gz) is React + React Router — irreducible. The site-header at ~33 kB gzipped is the largest shared module but contains the navigation shell needed on every page, plus lazy-loads the command palette. Overall baseline is healthy.

## WASM & Heavy Assets (Lazy-Loaded)

| Asset | Raw | Gzipped | Loaded by |
|---|---|---|---|
| `ort-wasm-simd-threaded.jsep` | 23,914 kB | 5,663 kB | Background removal only |
| `avif_enc_mt` WASM | 3,535 kB | 1,143 kB | AVIF encoding only |
| `avif_enc` WASM | 3,486 kB | 1,128 kB | AVIF encoding (single-thread fallback) |
| `jxl_oxide_wasm_bg` WASM | 1,765 kB | 638 kB | JXL decoding only |
| `pdf.worker.min` | 1,239 kB | — | PDF tools only |

**Assessment:** All WASM files are properly lazy-loaded. None appear in the entry bundle, root route, or any route's static import chain. They are fetched only when the specific tool is used. The ORT WASM (24 MB) for background removal is the largest single asset but is only loaded for that one tool — acceptable.

## Heavy JS Libraries (Lazy-Loaded)

| Asset | Raw | Gzipped | Loaded by |
|---|---|---|---|
| `heic2any` | 1,300 kB | — | HEIC to JPG tool only |
| `main` (DICOM/SVGO/parsers) | 1,198 kB | 255 kB | Niche converter tools only |
| `svgo-node` | 575 kB | 167 kB | SVG optimizer only |
| `openjpegjs_decode` | 482 kB | — | JP2 converter only |
| `pdf` (pdf-lib) | 396 kB | — | PDF merge/split/rotate/compress |
| `ort.bundle.min` | 400 kB | — | Background removal ONNX runtime |
| `index-8JL7mNLn` (pdf-lib core) | 388 kB | 165 kB | PDF tools only |
| `gifsicle.min` | 334 kB | — | GIF compression only |
| `index-4lamJML2` (pdfjs-dist) | 81 kB | 22 kB | PDF rendering tools |

**Assessment:** All heavy libraries are isolated to their respective tool chunks. No heavy library appears in the entry bundle or shared layout. Verified by manifest analysis — no route statically imports `main-*` or `index-8JL7*`.

## Code-Splitting Verification

- All 79 tool routes use `lazy()` imports for their feature components
- Workers use `new Worker(new URL("./foo.worker.ts", import.meta.url), { type: "module" })` pattern (11 workers verified)
- WASM packages (`@jsquash/avif`, `jxl-oxide-wasm`) are excluded from `optimizeDeps` in vite config
- Heavy library imports (`pdf-lib`, `heic2any`, `@jsquash/avif`, `jxl-oxide-wasm`, `@imgly/background-removal`, `pdfjs-dist`) are confined to `features/` and `processors/` directories — none leak into shared layout, root, or route files

## Shared Bundle Contamination Check

| Library | Shared? | Location |
|---|---|---|
| `pdf-lib` | No | `features/pdf-tools/processors/` and `features/image-tools/processors/` only |
| `pdfjs-dist` | No | Not directly imported (loaded via worker) |
| `heic2any` | No | Not found in any import (loaded dynamically) |
| `@jsquash/avif` | No | Not found in any import (loaded in worker) |
| `jxl-oxide-wasm` | No | Not found in any import (loaded in worker) |
| `@imgly/background-removal` | No | Not found in any import (loaded dynamically) |

**Result: No shared bundle contamination detected.**

## Route Chunk Sizes

Individual route modules are small (2-6 kB gzipped each). The largest route-level chunks:
- `image-converter-tool`: 32 kB (shared by ~30 format conversion pages)
- `gif-frame-selector`: 53 kB (GIF tools)
- `command-palette`: 23 kB (lazy-loaded from site header)

All are appropriately scoped.

## Recommendations

1. **No critical issues found.** The codebase follows good code-splitting practices.
2. **site-header chunk (33 kB gz):** Contains icon imports for all tool categories. Could theoretically be reduced by lazy-loading category icons, but the benefit is marginal given it's a one-time load cached across page navigations.
3. **OG images:** Currently all routes use a single default OG image (`/og/default.png`, which does not exist in public/). Per-tool OG images would improve social sharing appearance.
4. **CSS:** Single 14 kB gzipped stylesheet is efficient. No per-route CSS splitting needed.

## Summary

The build is well-optimized. Entry point is 59 kB gzipped — well under the 200 kB threshold. All heavy dependencies (WASM, pdf-lib, heic2any, ONNX runtime) are properly code-split and lazy-loaded. No shared bundle contamination. Each tool loads only what it needs.
