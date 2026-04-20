# @nouploads/backend-canvas

Canvas-backed `ImageBackend` implementation for [@nouploads/core](../core/README.md). Used by the [nouploads.com](https://nouploads.com) web app — specifically inside the `image-pipeline` Web Worker, which spawns one worker per image-tool invocation, creates a canvas backend, and runs a core tool against it.

This package is **private** — it is not published to npm. It ships only inside `apps/web`'s Vite bundle.

## Capabilities

- `decode(input, format)` — uses `createImageBitmap` on a `Blob` to handle PNG/JPG/WebP/GIF/BMP. Returns raw RGBA `Uint8Array`.
- `encode(image, { format, quality })` — draws the ImageData to an `OffscreenCanvas` (or `HTMLCanvasElement` fallback) and calls `convertToBlob`. Supports JPEG/PNG/WebP and best-effort AVIF.
- `resize(image, { width, height, fit })` — draws source to destination canvas; fit modes are informational (native Canvas doesn't implement contain/cover — resize-image tool handles the math above).
- `crop(image, region)` — draws a sub-rectangle into a fresh canvas.
- `quantize(image, colors)` — dynamic-imports [image-q](https://github.com/ibezkrovnyi/image-quantization) and runs Floyd-Steinberg dithering with a Wu quantization palette. Only loaded when a tool actually calls it (compress-png).

There is no `transcode` shortcut — the canvas backend always takes the decode → encode path.

## Runtime requirements

- Browser or Web Worker environment with `OffscreenCanvas` (Chrome 69+, Firefox 105+, Safari 16.4+).
- Ambient `ImageData` constructor.
- For HEIC, AVIF beyond the canvas's native support, and 50+ exotic formats, the web app keeps its own main-thread decoders and only hands raw RGBA to this backend.

## Relationship to other packages

```
@nouploads/core              (tool definitions + ImageBackend interface)
   │
   ├── @nouploads/backend-canvas  ← this package (browser/worker)
   └── @nouploads/backend-sharp   (Node.js + libvips, used by the CLI)
```

A tool that requires an image backend throws at `execute(...)` time if `context.imageBackend` is missing — that's how the CLI signals "this tool is browser-only" without hard-coding the distinction in core.

## License

[MIT](./LICENSE).
