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
| Image Convert | HEIC, JPG, PNG, WebP, AVIF, GIF, SVG, BMP, TIFF | JPG, PNG, WebP, AVIF | [`/image/convert`](https://nouploads.com/image/convert) |
| HEIC to JPG | HEIC | JPG | [`/image/heic-to-jpg`](https://nouploads.com/image/heic-to-jpg) |
| JPG to PNG | JPG | PNG | [`/image/jpg-to-png`](https://nouploads.com/image/jpg-to-png) |
| PNG to JPG | PNG | JPG | [`/image/png-to-jpg`](https://nouploads.com/image/png-to-jpg) |
| JPG to WebP | JPG | WebP | [`/image/jpg-to-webp`](https://nouploads.com/image/jpg-to-webp) |
| WebP to JPG | WebP | JPG | [`/image/webp-to-jpg`](https://nouploads.com/image/webp-to-jpg) |
| PNG to WebP | PNG | WebP | [`/image/png-to-webp`](https://nouploads.com/image/png-to-webp) |
| WebP to PNG | WebP | PNG | [`/image/webp-to-png`](https://nouploads.com/image/webp-to-png) |
| SVG to PNG | SVG | PNG | [`/image/svg-to-png`](https://nouploads.com/image/svg-to-png) |
| AVIF to JPG | AVIF | JPG | [`/image/avif-to-jpg`](https://nouploads.com/image/avif-to-jpg) |
| AVIF to PNG | AVIF | PNG | [`/image/avif-to-png`](https://nouploads.com/image/avif-to-png) |
| GIF to JPG | GIF | JPG | [`/image/gif-to-jpg`](https://nouploads.com/image/gif-to-jpg) |

### Image Compression

| Tool | Input | Output | URL |
|------|-------|--------|-----|
| Image Compress | JPG, PNG, WebP, AVIF, GIF | Same format (smaller) | [`/image/compress`](https://nouploads.com/image/compress) |
| Compress JPG | JPG | JPG | [`/image/compress-jpg`](https://nouploads.com/image/compress-jpg) |
| Compress PNG | PNG | PNG | [`/image/compress-png`](https://nouploads.com/image/compress-png) |
| Compress WebP | WebP | WebP | [`/image/compress-webp`](https://nouploads.com/image/compress-webp) |
| Compress GIF | GIF | GIF | [`/image/compress-gif`](https://nouploads.com/image/compress-gif) |

### Developer Tools

| Tool | Description | URL |
|------|-------------|-----|
| Color Picker | Pick colors from spectrum or images; convert between HEX, RGB, HSL, HSV, HWB, CMYK, LAB, LCH, OKLCH | [`/developer/color-picker`](https://nouploads.com/developer/color-picker) |

### Coming Soon

- Image Resize, EXIF Viewer, Images to PDF
- PDF tools (merge, split, compress, rotate, unlock)
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
