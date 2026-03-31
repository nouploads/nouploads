# NoUploads

[![GitHub stars](https://img.shields.io/github/stars/nouploads/nouploads?style=social)](https://github.com/nouploads/nouploads)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

**Privacy-first file tools that run entirely on your device.** No uploads. No servers. No compromises.

[nouploads.com](https://nouploads.com) | [CLI on npm](https://www.npmjs.com/package/nouploads) | Self-host with Docker

## Why NoUploads?

Most online file tools upload your files to a server. NoUploads doesn't — everything runs **locally** using WebAssembly, native browser APIs, or Node.js (via the CLI). Your files never leave your device.

- **Private** — files stay on your device, always
- **Works offline** — load the page once, then disconnect
- **Free and unlimited** — no file size limits, no daily caps, no account required
- **Open source** — inspect the code, verify the claims, self-host it
- **Fast** — no upload/download wait, processing starts instantly

## Monorepo Structure

```
nouploads/
├── packages/
│   ├── core/            → Shared conversion logic, tool registry, format decoders
│   ├── cli/             → CLI tool (published as `nouploads` on npm)
│   ├── backend-sharp/   → Node.js image backend using sharp (libvips)
│   └── backend-canvas/  → Browser image backend using Canvas API
├── apps/
│   └── web/             → The website (nouploads.com) — React Router + Vite
├── fixtures/            → Shared test fixtures
├── pnpm-workspace.yaml
└── turbo.json
```

**`@nouploads/core`** contains 90+ tools covering image conversion (20+ format pairs), compression, resize, crop, rotate/flip, watermark, filters/effects, favicon generation, EXIF metadata, PDF split/merge/rotate/watermark/text-extraction/page-numbers/protect/unlock, SVG optimization, QR code generation, JSON formatting, hash generation, JWT decoding, base64 encoding, regex testing, timestamp conversion, UUID generation, URL encoding, text diff, Markdown preview, and 18 exotic format decoders (PSD, TGA, HDR, EXR, DDS, TIFF, etc.). All tools are platform-agnostic — the same logic powers the website, CLI, and future desktop/mobile apps.

## Quick Start

### Use the website

Visit [nouploads.com](https://nouploads.com) — no installation needed.

### CLI

```bash
npx nouploads heic jpg photo.heic --quality 80
npx nouploads png webp screenshot.png
npx nouploads optimize-svg logo.svg
npx nouploads merge-pdf a.pdf b.pdf -o combined.pdf
npx nouploads resize-image photo.jpg --width 800 --format png
npx nouploads compress-jpg photo.jpg --quality 60
npx nouploads --list          # see all 80+ tools
npx nouploads --info crop-image  # detailed help for a tool
```

Or install globally:

```bash
npm install -g nouploads
nouploads heic jpg photo.heic
```

### Self-host with Docker

```bash
docker run -d -p 3000:3000 ghcr.io/nouploads/nouploads:latest
```

### Self-host with Docker Compose

```bash
git clone https://github.com/nouploads/nouploads.git
cd nouploads
docker-compose up -d
```

## Development

Requires Node.js 24+ and pnpm 9+.

```bash
git clone https://github.com/nouploads/nouploads.git
cd nouploads
pnpm install
pnpm build          # build all packages
pnpm dev            # start web dev server
```

### Run the web app

```bash
pnpm --filter @nouploads/web dev      # dev server at localhost:5173
pnpm --filter @nouploads/web test     # 769 unit tests
pnpm --filter @nouploads/web test:e2e # Playwright e2e tests
```

### Run package tests

```bash
pnpm --filter @nouploads/core test    # 68 tests (unit + sharp integration)
pnpm test                              # all tests across all packages
```

### Build the CLI locally

```bash
pnpm --filter nouploads build
node packages/cli/bin/nouploads.js --list
```

## Tools

### Image Conversion

70+ format pairs including: HEIC, JPG, PNG, WebP, AVIF, GIF, SVG, BMP, TIFF, ICO, JXL, PSD, PSB, TGA, HDR, EXR, DDS, PCX, NetPBM, FITS, XCF, ICNS, and more.

### Image Editing

Resize, crop, rotate/flip, compress (JPG/PNG/WebP/GIF), watermark, filters/effects (grayscale, sepia, blur, etc.), remove background (AI), EXIF viewer/stripper, images to PDF, favicon generator (ICO).

### PDF Tools

PDF to JPG/PNG, merge PDFs, split PDF, rotate PDF, compress PDF, add watermark, extract text, add page numbers, password protect, unlock.

### Vector Tools

SVG optimizer (svgo) with SVGZ export.

### Developer Tools

Color picker (HEX/RGB/HSL/CMYK/LAB/OKLCH), JSON formatter/validator/minifier, hash generator (MD5/SHA-1/SHA-256/SHA-384/SHA-512), JWT decoder, base64 encoder/decoder, QR code generator, regex tester, Unix timestamp converter, UUID v4/v7 generator, URL encoder/decoder, text diff/compare, Markdown preview.

Full tool list: [nouploads.com](https://nouploads.com) or `npx nouploads --list`

## Architecture

The core conversion logic in `@nouploads/core` is platform-agnostic:

- **`ImageBackend` interface** — decode, encode, resize, crop, transcode. Implemented by `backend-sharp` (Node/CLI) and `backend-canvas` (browser).
- **Tool registry** — each tool is a `ToolDefinition` with metadata, options, and an execute function. The CLI auto-discovers all registered tools.
- **Exotic decoders** — 18 pure-JS format decoders (no WASM, no Canvas) that work in both Node and browser.
- **Web Workers** — the web app runs CPU-intensive operations off the main thread for a responsive UI. This is web-app specific; the CLI uses sharp directly.
- **SEO structured data** — every tool page includes FAQPage JSON-LD for Google rich snippets, authority trivia with Wikipedia/W3C source links, and internal cross-links between related tools.

See [ARCHITECTURE.md](ARCHITECTURE.md) for a detailed breakdown.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

All contributors must sign our [Contributor License Agreement](CLA.md) before their first PR can be merged.

## License

NoUploads is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).

A commercial license is available for organizations that need to use the code without AGPL obligations. Contact us for details.
