# nouploads

> Convert and process files locally — no uploads, no servers.

[![npm version](https://img.shields.io/npm/v/nouploads.svg)](https://www.npmjs.com/package/nouploads)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

CLI and JavaScript library for image conversion (HEIC, JPG, PNG, WebP, AVIF, GIF, SVG, BMP, TIFF, ICO, PSD, and more), PDF manipulation (merge, split, rotate, watermark, page numbers, protect/unlock), text formatting (HTML, JS, SQL, JSON, XML, YAML, CSS), QR code generation, hashing, encoding utilities, and dozens more file tools — all running locally on your machine. No data ever leaves your device.

Powered by [sharp](https://github.com/lovell/sharp), [pdf-lib](https://github.com/Hopding/pdf-lib), and a curated set of pure-JS libraries. Built on the same engine that powers [nouploads.com](https://nouploads.com).

## Install

### As a global CLI

```bash
npm install -g nouploads
```

### As a library in your project

```bash
npm install nouploads
```

## CLI usage

```bash
# Image conversion (infer from positional args)
nouploads heic jpg photo.heic --quality 80
nouploads png webp screenshot.png
nouploads jpg avif portrait.jpg --quality 90

# Image manipulation
nouploads resize-image photo.jpg --width 1200
nouploads compress-image bigfile.png --quality 70
nouploads strip-metadata photo.jpg
nouploads crop-image photo.jpg --x 100 --y 100 --width 800 --height 600
nouploads rotate-image photo.jpg --width 90

# PDF tools
nouploads merge-pdf a.pdf b.pdf c.pdf -o combined.pdf
nouploads split-pdf input.pdf
nouploads rotate-pdf input.pdf --width 90
nouploads pdf-to-text document.pdf

# Vector & utilities
nouploads optimize-svg logo.svg --multipass
nouploads qr-code --text "https://example.com" -o qr.png

# Discovery
nouploads --list                  # list every available tool
nouploads --info crop-image       # detailed help for a tool
nouploads --version
```

Output files default to the same directory as the input, with the new extension. Use `-o <path>` to override.

## Library usage

Fully typed. ESM only. Node 22+.

### Convert by format pair

```ts
import { readFile, writeFile } from "node:fs/promises";
import { convertFile } from "nouploads";

const input = new Uint8Array(await readFile("photo.heic"));
const result = await convertFile(input, { from: "heic", to: "jpg", quality: 80 });
await writeFile("photo.jpg", result.output);
console.log(result.mimeType);  // "image/jpeg"
```

### Look up a tool by ID and run it

```ts
import { getTool } from "nouploads";

const tool = getTool("optimize-svg");
if (!tool) throw new Error("Tool not found");

const result = await tool.execute(svgBytes, { multipass: true }, {});
```

### Plug in your own image backend

```ts
import { convert, type ImageBackend } from "nouploads";

const myBackend: ImageBackend = {
  async decode(input, format) { /* ... */ },
  async encode(image, options) { /* ... */ },
  async resize(image, options) { /* ... */ },
};

const result = await convert(bytes, { from: "png", to: "webp" }, { imageBackend: myBackend });
```

The default `convertFile` ships with a sharp-backed `ImageBackend` pre-wired. Use `convert` directly if you want to inject your own.

### Discover all tools

```ts
import { getAllTools, getToolsByCategory } from "nouploads";

console.log(`${getAllTools().length} tools available`);
const imageTools = getToolsByCategory("image");
```

## Why nouploads?

Most online file tools upload your files to a server. nouploads doesn't — everything runs locally using sharp (libvips), pdf-lib, and pure-JS libraries. Your files never leave your machine. No accounts, no quotas, no telemetry.

## Tool catalog

100+ tools across image conversion, image editing, PDF manipulation, vector graphics, text formatting, hashing, encoding, and developer utilities.

Browse the full catalog at [nouploads.com](https://nouploads.com), or run `nouploads --list` after install.

## Bundle & runtime

- **Engine:** Node.js 22+ (ESM only)
- **Native deps:** sharp 0.34.x (libvips, prebuilt for macOS/Linux/Windows)
- **Install size:** ~20 MB (mostly libvips for image processing)
- **Cold start:** ~300 ms

Each tool's heavy dependencies are loaded on demand — importing one tool doesn't pull in unrelated engines.

## License

[MIT](LICENSE) — free for any use, including commercial. Bundled third-party libraries retain their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Links

- Web app: [nouploads.com](https://nouploads.com)
- Source: [github.com/nouploads/nouploads](https://github.com/nouploads/nouploads)
- Issues: [github.com/nouploads/nouploads/issues](https://github.com/nouploads/nouploads/issues)
