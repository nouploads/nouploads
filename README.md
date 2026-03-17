# NoUploads

[![GitHub stars](https://img.shields.io/github/stars/nouploads/nouploads?style=social)](https://github.com/nouploads/nouploads)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

**Privacy-first file tools that run entirely in your browser.** No uploads. No servers. No compromises.

[nouploads.com](https://nouploads.com) — or self-host it yourself.

## What is NoUploads?

NoUploads is an open-source collection of file conversion, compression, and manipulation tools that process everything **100% client-side** using WebAssembly and native browser APIs.

Your files never leave your device. Ever.

**Don't take our word for it — verify yourself.** Open your browser's Network tab while using any tool. You'll see zero file uploads. Or turn on airplane mode after the page loads — everything still works.

## Tools

### Image Tools (available now)

- **HEIC to JPG** — Convert iPhone photos to universal JPG format
- **Image Compress** — Reduce file size with adjustable quality
- **Image Convert** — Convert between PNG, JPG, WebP, AVIF, GIF, BMP, TIFF
- **Image Resize** — Resize by pixels, percentage, or social media presets
- **EXIF Viewer & Stripper** — View or remove photo metadata
- **Images to PDF** — Combine multiple images into a single PDF

### Coming Soon

- PDF tools (merge, split, compress, rotate, unlock)
- Video tools (compress, convert, trim, GIF maker)
- Audio tools (convert, trim, merge)
- AI-powered tools (background removal, image upscaling)

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

```bash
git clone https://github.com/nouploads/nouploads.git
cd nouploads
npm install
npm run build
```

The `dist/` directory contains static files you can serve with any web server (Nginx, Caddy, Apache, or even `npx serve dist`).

### Development

```bash
git clone https://github.com/nouploads/nouploads.git
cd nouploads
npm install
npm run dev
```

## Tech Stack

- **Astro** — Static site generation for SEO-optimized pages
- **React** — Interactive tool components (Astro islands)
- **shadcn/ui** — Accessible, customizable UI components
- **Tailwind CSS** — Utility-first styling
- **WebAssembly** — High-performance file processing in the browser
- **Web Workers** — Off-main-thread processing for responsive UI

No backend. No server. No database. No file storage.

## How It Works

1. You open a tool page (e.g., HEIC to JPG converter)
2. You drop or select your file(s)
3. The processing library loads on demand (cached after first use)
4. Your file is processed entirely in your browser
5. You download the result directly

At no point does your file leave your device. The entire application is static HTML, CSS, JavaScript, and WebAssembly served from a CDN or static file server.

## Self-Hosting

NoUploads is designed to be easy to self-host. Because it's a fully static site (just HTML/CSS/JS/WASM files), you can serve it from:

- **Docker** — Official image with Nginx
- **Any static hosting** — S3, Cloudflare Pages, GitHub Pages, Netlify, Vercel
- **Any web server** — Nginx, Caddy, Apache
- **Build from source** — `npm run build` outputs to `dist/`

Every route is a real `.html` file — no SPA routing configuration needed.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

All contributors must sign our [Contributor License Agreement](CLA.md) before their first PR can be merged.

## License

NoUploads is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).

A commercial license is available for organizations that need to use the code without AGPL obligations. Contact us for details.
