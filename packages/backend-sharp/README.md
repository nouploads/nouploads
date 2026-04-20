# @nouploads/backend-sharp

Sharp-backed `ImageBackend` implementation for [@nouploads/core](../core/README.md). Used by the [nouploads](https://www.npmjs.com/package/nouploads) CLI so every image tool runs on [libvips](https://github.com/libvips/libvips) via [sharp](https://github.com/lovell/sharp).

This package is **private** — it is bundled inside the published `nouploads` CLI tarball (via tsup's `noExternal` workspace rule) rather than published separately.

## Capabilities

- `decode(input, format)` — sharp loads the input buffer and yields raw RGBA.
- `encode(image, { format, quality })` — pipes RGBA through sharp's encoder with format-specific options (`jpeg`, `png`, `webp`, `avif`).
- `resize(image, { width, height, fit })` — sharp's native resize (Lanczos3 by default).
- `crop(image, region)` — sharp's `extract`.
- `transcode(input, from, to, options)` — decode + encode in a single sharp pipeline, which for lossy → lossy pairs (JPG → WebP, etc.) is faster than the default decode/encode fallback.
- `quantize(image, colors)` — sharp's palette quantization (`palette: true`) at encode time, wrapped to match the backend contract.

## Runtime requirements

- Node.js 22+.
- `sharp 0.34.x` with prebuilt libvips binaries (macOS/Linux/Windows, x64 + arm64). No native compilation on install.
- No DOM, no canvas, no browser globals.

## Relationship to other packages

```
@nouploads/core              (tool definitions + ImageBackend interface)
   │
   ├── @nouploads/backend-sharp   ← this package (Node.js + libvips, used by the CLI)
   └── @nouploads/backend-canvas  (browser/worker)
```

The CLI wires a sharp backend into every `ToolContext`; you can plug your own by calling `convert(bytes, options, { imageBackend })` directly from `nouploads`.

## License

[MIT](./LICENSE). Sharp and libvips ship under their respective licenses — see their repos.
