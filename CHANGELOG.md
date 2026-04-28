# Changelog

## [0.4.1] - 2026-04-28

### Added

- `nouploads` CLI is now on npm. `npm install -g nouploads` exposes every tool from nouploads.com — image conversion (HEIC, AVIF, WebP, PNG, JPG, …), PDF manipulation (merge, split, rotate, watermark, page numbers, protect/unlock), text formatting (HTML, JS, SQL, JSON, XML, YAML, CSS), QR code generation, hashing, encoding, and more — running locally on Node 22+ via sharp/libvips. Programmatic library usage is also supported via `import { convertFile, getTool } from "nouploads"`.

### Maintenance

- The web app and the new CLI now share a single tool registry (`@nouploads/core`); every web processor delegates to it. A drift-prevention unit test catches any new image tool added without being wired into the shared pipeline.
- npm releases are signed with SLSA provenance attestation via GitHub Actions.

## [0.4.0] - 2026-04-17

### Added

- SQL formatter tool
- HTML formatter tool
- JavaScript formatter tool
- XML ↔ JSON converter tool

### Maintenance

- Sitemap lastmod date updates

## [0.3.0] - 2026-04-14

### Added

- 10 new developer and utility tools: YAML ↔ JSON converter, EXIF metadata stripper, PDF reorder, JSON ↔ CSV converter, cron parser, color palette extractor, case converter, CSS formatter/minifier, word counter, lorem ipsum generator
- New `/privacy` and `/self-hosting` pages
- Redesigned homepage with new hero, popular tools grid, and open source section
- Enhanced about page with feature comparison table and org section
- First-page previews for PDF watermark, page numbers, rotate, and split tools
- SEO overhaul: visual breadcrumbs, related tools section, redesigned 4-column footer, BreadcrumbList JSON-LD, enriched titles and descriptions across all 108 pages

### Fixed

- Lorem ipsum count input now allows clearing the field and surfaces inline validation errors for out-of-range values
- SVG optimizer falls back to regex when SVGO's parser crashes on malformed input
- PDF-to-image reprocesses when DPI changes after completion
- PDF password padding and per-object stream encryption now match the PDF spec
- Safari PDF text extraction works via a ReadableStream asyncIterator polyfill
- Image filters fall back to manual pixel manipulation on Safari (CSS filter gaps)
- Clearer macOS Safari HEIC conversion error message
- Stale results cleared when switching PDF split modes
- Download hidden when PDF compression would increase file size
- Hydration warning suppressed and file drops outside dropzones blocked
- Resize tool snaps height to aspect ratio when re-locking
- Download button stays visible but disabled during re-processing
- Category index pages now use correct heading order
- Slider thumbs and SelectTrigger buttons have aria-labels
- PDF reorder drag handlers use the correct DragEvent type
- Lighthouse assertions now use Lighthouse 13 directly instead of `@lhci/cli`

### Maintenance

- Expanded unit and E2E coverage for the 10 new tools, including abort handling, invalid input, and edge cases (CJK/RTL/emoji, Unicode, CRLF, multi-document YAML, etc.)
- Husky pre-push hook and CI-matching validation script (typecheck, lint, build, unit, E2E smoke)
- Docker image optimized with alpine and minimal runtime deps
- Shared CI build artifacts and cached Playwright browsers
- Build-only dependencies moved to devDependencies
- Documentation refresh across CLAUDE.md and SEO_RULES.md for the monorepo structure
- `/release` skill shared with all collaborators

## [0.2.0] - 2026-03-31

### Added

- 7 new image conversion tools: GIF→PNG, HEIC→PNG, HEIC→WebP, ICO→WebP, BMP→JPG, BMP→PNG, BMP→WebP
- OG image generation now runs automatically during build

### Fixed

- Sitemap uses real git modification dates per route instead of uniform build date
- Sitemap priority tiers differentiate core tools from niche converters
- Route discovery works correctly on static S3 hosting
- Broken library attribution links for @webtoon/psd and @imgly/background-removal

## [0.1.0] - 2026-03-31

### Added

- 70 file processing tools running entirely client-side
- Image conversion across 30+ formats (JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF, SVG, ICO, HEIC, PSD, TGA, HDR, EXR, DDS, and more)
- Image compression (JPEG, WebP, PNG)
- Image resize and crop with multiple fit modes
- EXIF metadata viewer and stripper
- Images to PDF converter
- PDF tools: merge, compress, PDF to image
- SVG optimizer (svgo)
- AI-powered background removal
- QR code generator
- Base64 image encoder/decoder
- Developer color picker (HEX/RGB/HSL/HSV/HWB/CMYK/LAB/LCH/OKLCH)
- 18 custom zero-dependency format decoders in @nouploads/core
- Node.js CLI with interactive TUI mode
