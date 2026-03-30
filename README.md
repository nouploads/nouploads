# NoUploads

[![GitHub stars](https://img.shields.io/github/stars/nouploads/nouploads?style=social)](https://github.com/nouploads/nouploads)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

**Privacy-first file tools that run entirely in your browser.** No uploads. No servers. No compromises.

[nouploads.com](https://nouploads.com) — or self-host it yourself.

## Why NoUploads?

Most online file tools upload your files to a server. NoUploads doesn't — everything runs **100% client-side** using WebAssembly and native browser APIs. Your files never leave your device.

- **Private** — files stay on your device, always
- **Works offline** — load the page once, then disconnect
- **Free and unlimited** — no file size limits, no daily caps, no account required
- **Open source** — inspect the code, verify the claims, self-host it
- **Fast** — no upload/download wait, processing starts instantly

**Don't take our word for it — verify yourself.** Open your browser's Network tab while using any tool. You'll see zero file uploads.

## Tools

### Image Conversion

| Tool | Input | Output | URL |
|------|-------|--------|-----|
| Image Convert | HEIC, JPG, PNG, WebP, AVIF, GIF, SVG, BMP, TIFF, JXL, ICO | JPG, PNG, WebP, AVIF | [`/image/convert`](https://nouploads.com/image/convert) |
| HEIC to JPG | HEIC | JPG | [`/image/heic-to-jpg`](https://nouploads.com/image/heic-to-jpg) |
| JPG to PNG | JPG | PNG | [`/image/jpg-to-png`](https://nouploads.com/image/jpg-to-png) |
| PNG to JPG | PNG | JPG | [`/image/png-to-jpg`](https://nouploads.com/image/png-to-jpg) |
| JPG to WebP | JPG | WebP | [`/image/jpg-to-webp`](https://nouploads.com/image/jpg-to-webp) |
| WebP to JPG | WebP | JPG | [`/image/webp-to-jpg`](https://nouploads.com/image/webp-to-jpg) |
| PNG to WebP | PNG | WebP | [`/image/png-to-webp`](https://nouploads.com/image/png-to-webp) |
| WebP to PNG | WebP | PNG | [`/image/webp-to-png`](https://nouploads.com/image/webp-to-png) |
| SVG to PNG | SVG | PNG | [`/image/svg-to-png`](https://nouploads.com/image/svg-to-png) |
| SVG to JPG | SVG | JPG | [`/image/svg-to-jpg`](https://nouploads.com/image/svg-to-jpg) |
| SVG to WebP | SVG | WebP | [`/image/svg-to-webp`](https://nouploads.com/image/svg-to-webp) |
| AVIF to JPG | AVIF | JPG | [`/image/avif-to-jpg`](https://nouploads.com/image/avif-to-jpg) |
| AVIF to PNG | AVIF | PNG | [`/image/avif-to-png`](https://nouploads.com/image/avif-to-png) |
| GIF to JPG | GIF | JPG | [`/image/gif-to-jpg`](https://nouploads.com/image/gif-to-jpg) |
| TIFF to JPG | TIFF | JPG | [`/image/tiff-to-jpg`](https://nouploads.com/image/tiff-to-jpg) |
| TIFF to PNG | TIFF | PNG | [`/image/tiff-to-png`](https://nouploads.com/image/tiff-to-png) |
| ICO to PNG | ICO | PNG | [`/image/ico-to-png`](https://nouploads.com/image/ico-to-png) |
| ICO to JPG | ICO | JPG | [`/image/ico-to-jpg`](https://nouploads.com/image/ico-to-jpg) |
| JXL to JPG | JXL | JPG | [`/image/jxl-to-jpg`](https://nouploads.com/image/jxl-to-jpg) |
| JXL to PNG | JXL | PNG | [`/image/jxl-to-png`](https://nouploads.com/image/jxl-to-png) |

### Niche / Professional Format Converters

These converters accept specialist formats and output to mainstream formats (JPG, PNG, WebP, AVIF). All processing is client-side.

| Tool | Input Formats | URL |
|------|--------------|-----|
| RAW Converter | CR2, CR3, CRW, NEF, NRW, ARW, SR2, SRW, DNG, RAF, ORF, PEF, ERF, RW2, MRW, MEF, MOS, KDC, DCR, X3F, 3FR, RAW | [`/image/raw-converter`](https://nouploads.com/image/raw-converter) |
| PSD Converter | PSD | [`/image/psd-converter`](https://nouploads.com/image/psd-converter) |
| PSB Converter | PSB | [`/image/psb-converter`](https://nouploads.com/image/psb-converter) |
| EXR Converter | EXR | [`/image/exr-converter`](https://nouploads.com/image/exr-converter) |
| HDR Converter | HDR | [`/image/hdr-converter`](https://nouploads.com/image/hdr-converter) |
| DICOM Converter | DCM | [`/image/dcm-converter`](https://nouploads.com/image/dcm-converter) |
| FITS Converter | FITS, FTS | [`/image/fits-converter`](https://nouploads.com/image/fits-converter) |
| TGA Converter | TGA | [`/image/tga-converter`](https://nouploads.com/image/tga-converter) |
| DDS Converter | DDS | [`/image/dds-converter`](https://nouploads.com/image/dds-converter) |
| PCX Converter | PCX | [`/image/pcx-converter`](https://nouploads.com/image/pcx-converter) |
| Netpbm Converter | PBM, PGM, PPM, PNM, PAM, PFM | [`/image/netpbm-converter`](https://nouploads.com/image/netpbm-converter) |
| JP2 Converter | JP2, J2K, JPF, JPX | [`/image/jp2-converter`](https://nouploads.com/image/jp2-converter) |
| ICNS Converter | ICNS | [`/image/icns-converter`](https://nouploads.com/image/icns-converter) |
| XCF Converter | XCF | [`/image/xcf-converter`](https://nouploads.com/image/xcf-converter) |
| EPS Converter | EPS, PS | [`/image/eps-converter`](https://nouploads.com/image/eps-converter) |
| AI Converter | AI | [`/image/ai-converter`](https://nouploads.com/image/ai-converter) |
| EMF Converter | EMF | [`/image/emf-converter`](https://nouploads.com/image/emf-converter) |
| SVGZ Converter | SVGZ | [`/image/svgz-converter`](https://nouploads.com/image/svgz-converter) |
| XPS Converter | XPS, OXPS | [`/image/xps-converter`](https://nouploads.com/image/xps-converter) |
| ODG Converter | ODG | [`/image/odg-converter`](https://nouploads.com/image/odg-converter) |
| CDR Converter | CDR | [`/image/cdr-converter`](https://nouploads.com/image/cdr-converter) |
| Visio Converter | VSD, VSDX | [`/image/vsd-converter`](https://nouploads.com/image/vsd-converter) |
| PUB Converter | PUB | [`/image/pub-converter`](https://nouploads.com/image/pub-converter) |
| X Window Converter | XBM, XPM, XWD | [`/image/xwindow-converter`](https://nouploads.com/image/xwindow-converter) |
| Legacy Converter | SGI, RAS, WBMP, PCD, PICT, SFW | [`/image/legacy-converter`](https://nouploads.com/image/legacy-converter) |

### Image Editing

| Tool | Description | URL |
|------|-------------|-----|
| Image Resize | Resize images by pixels, percentage, or presets with aspect ratio lock | [`/image/resize`](https://nouploads.com/image/resize) |
| Image Crop | Crop images with free or preset aspect ratios (1:1, 4:3, 16:9, 3:2) | [`/image/crop`](https://nouploads.com/image/crop) |
| Remove Background | Remove image backgrounds using local AI (ONNX model) | [`/image/remove-background`](https://nouploads.com/image/remove-background) |
| EXIF Viewer | View and strip EXIF metadata from photos | [`/image/exif`](https://nouploads.com/image/exif) |
| Images to PDF | Combine multiple images into a single PDF | [`/image/to-pdf`](https://nouploads.com/image/to-pdf) |

### Image Compression

| Tool | Input | Output | URL |
|------|-------|--------|-----|
| Image Compress | JPG, PNG, WebP, AVIF, GIF | Same format (smaller) | [`/image/compress`](https://nouploads.com/image/compress) |
| Compress JPG | JPG | JPG | [`/image/compress-jpg`](https://nouploads.com/image/compress-jpg) |
| Compress PNG | PNG | PNG | [`/image/compress-png`](https://nouploads.com/image/compress-png) |
| Compress WebP | WebP | WebP | [`/image/compress-webp`](https://nouploads.com/image/compress-webp) |
| Compress GIF | GIF | GIF | [`/image/compress-gif`](https://nouploads.com/image/compress-gif) |

### Vector Tools

| Tool | Description | URL |
|------|-------------|-----|
| SVG Optimizer | Minify and optimize SVG files with svgo, export as SVGZ | [`/vector/svg-optimizer`](https://nouploads.com/vector/svg-optimizer) |

### PDF Tools

| Tool | Input | Output | URL |
|------|-------|--------|-----|
| PDF to JPG | PDF | JPG images | [`/pdf/pdf-to-jpg`](https://nouploads.com/pdf/pdf-to-jpg) |
| PDF to PNG | PDF | PNG images | [`/pdf/pdf-to-png`](https://nouploads.com/pdf/pdf-to-png) |
| Merge PDFs | Multiple PDFs | Single PDF | [`/pdf/merge`](https://nouploads.com/pdf/merge) |
| Compress PDF | PDF | Smaller PDF | [`/pdf/compress`](https://nouploads.com/pdf/compress) |

### Vector Tools

| Tool | Description | URL |
|------|-------------|-----|
| SVG Optimizer | Minify and optimize SVG files using svgo; download optimized SVG or SVGZ | [`/vector/svg-optimizer`](https://nouploads.com/vector/svg-optimizer) |

### Developer Tools

| Tool | Description | URL |
|------|-------------|-----|
| Color Picker | Pick colors from spectrum or images; convert between HEX, RGB, HSL, HSV, HWB, CMYK, LAB, LCH, OKLCH | [`/developer/color-picker`](https://nouploads.com/developer/color-picker) |
| Base64 Image | Encode images to base64 data URIs or decode base64 strings back to images | [`/developer/base64-image`](https://nouploads.com/developer/base64-image) |
| QR Code Generator | Generate QR codes from text/URLs with custom size, colors, and error correction | [`/developer/qr-code`](https://nouploads.com/developer/qr-code) |

### Coming Soon

- Video tools (compress, convert, trim, GIF maker)
- Audio tools (convert, trim, merge)

## Quick Start

### Use the hosted version

Visit [nouploads.com](https://nouploads.com) — no installation needed.

### Self-host with Docker

```bash
docker run -d -p 8080:80 ghcr.io/nouploads/nouploads:latest
```

Then open http://localhost:8080

### Self-host with Docker Compose

```bash
git clone https://github.com/nouploads/nouploads.git
cd nouploads
docker-compose up -d
```

### Build from source

Requires Node.js 24+.

```bash
git clone https://github.com/nouploads/nouploads.git
cd nouploads
npm install
npm run build
```

The `build/client/` directory contains static files you can serve with any web server (Nginx, Caddy, Apache, or even `npx serve build/client`).

### Development

```bash
npm install
npm run dev
```

Run tests:

```bash
npm test            # unit tests (Vitest)
npm run test:e2e    # end-to-end tests (Playwright)
```

## How It Works

1. You open a tool page (e.g., HEIC to JPG converter)
2. You drop or select your file(s)
3. The processing library loads on demand (cached after first use)
4. Your file is processed entirely in your browser using Web Workers
5. You download the result directly

The entire application is static HTML, CSS, JavaScript, and WebAssembly — no backend, no database, no file storage.

## Tech Stack

- **React Router** — framework with static pre-rendering for SEO
- **React** + **shadcn/ui** — accessible, customizable UI components
- **Tailwind CSS** — utility-first styling
- **WebAssembly** — high-performance file processing in the browser
- **Web Workers** — off-main-thread processing for responsive UI
- **Vitest** + **Playwright** — unit and end-to-end testing

## Self-Hosting

NoUploads is designed to be easy to self-host. Because it's a fully static site (just HTML/CSS/JS/WASM files), you can serve it from:

- **Docker** — official image with Nginx
- **Any static hosting** — S3, Cloudflare Pages, GitHub Pages, Netlify, Vercel
- **Any web server** — Nginx, Caddy, Apache
- **Build from source** — `npm run build` outputs to `build/client/`

Every route is a real `.html` file — no SPA routing configuration needed.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

All contributors must sign our [Contributor License Agreement](CLA.md) before their first PR can be merged.

## License

NoUploads is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).

A commercial license is available for organizations that need to use the code without AGPL obligations. Contact us for details.
