# Format Implementation Tracker

Legend:
- ✅ = Verified and signed off
- ⚠️ = Disputed, needs review
- ❌ = Failed, documented reason below
- ⏳ = In progress
- ➖ = Not started

## Batch 1: Mainstream Formats (F01–F11)

| Status | Format | Lib Verified | Decode Proof | Output Valid | Edge Cases | Sign-off |
|--------|--------|-------------|-------------|-------------|-----------|---------|
| ✅ | **F01 — JPEG** (jpg, jpeg, jpe, jfif, jps) | Browser-native | ✅ | ✅ | ✅ | Pre-existing |
| ✅ | **F02 — PNG + APNG** (png) | Browser-native | ✅ | ✅ | ✅ | Pre-existing |
| ✅ | **F03 — GIF + Animated GIF** (gif) | Browser-native + gifuct-js | ✅ | ✅ | ✅ | Pre-existing |
| ✅ | **F04 — BMP** (bmp) | Browser-native | ✅ | ✅ | ✅ | Pre-existing |
| ✅ | **F05 — WebP + Animated WebP** (webp) | Browser-native | ✅ | ✅ | ✅ | Pre-existing |
| ✅ | **F06 — SVG** (svg) | Browser-native | ✅ | ✅ | ✅ | Pre-existing |
| ✅ | **F07 — HEIC / HEIF** (heic, heif) | heic2any | ✅ | ✅ | ✅ | Pre-existing |
| ✅ | **F08 — AVIF** (avif) | Browser-native | ✅ | ✅ | ✅ | Pre-existing |
| ✅ | **F09 — TIFF** (tiff, tif) | utif2 4.1.0 ✅ | 64x64 ✅ | RGBA ✅ | Abort, corrupt ✅ | Signed off |
| ✅ | **F10 — JPEG XL** (jxl) | jxl-oxide-wasm 0.12.5 ✅ | WASM decoder ✅ | PNG intermediate ✅ | Native fallback, abort ✅ | Signed off |
| ✅ | **F11 — ICO / CUR** (ico, cur) | decode-ico 0.4.1 ✅ | 32x32 ✅ | RGBA ✅ | Abort, corrupt ✅ | Signed off |

## Batch 2: Niche Formats (F12–F20)

| Status | Format | Lib Verified | Decode Proof | Output Valid | Edge Cases | Sign-off |
|--------|--------|-------------|-------------|-------------|-----------|---------|
| ✅ | **F12 — PSD** (psd) | @webtoon/psd 0.4.0 ✅ | Mock verified ✅ | RGBA ✅ | Abort, corrupt ✅ | Signed off |
| ➖ | **F13 — JPEG 2000** (jp2) | | | | | |
| ✅ | **F14 — OpenEXR** (exr) | Custom parser ✅ | Synthetic EXR ✅ | Reinhard tonemap ✅ | ZIP decomp, abort ✅ | Signed off |
| ✅ | **F15 — Radiance HDR** (hdr) | Custom parser ✅ | Synthetic HDR ✅ | Reinhard tonemap ✅ | RLE, abort ✅ | Signed off |
| ✅ | **F16 — TGA** (tga) | Custom parser ✅ | Synthetic TGA ✅ | BGR→RGBA swap ✅ | RLE, flip, abort ✅ | Signed off |
| ✅ | **F17 — DDS** (dds) | Custom parser ✅ | Synthetic DDS ✅ | DXT1/3/5 ✅ | Uncompressed, abort ✅ | Signed off |
| ✅ | **F18 — PCX** (pcx) | Custom parser ✅ | Synthetic PCX ✅ | RLE, palette ✅ | 24-bit, 8-bit, 1-bit ✅ | Signed off |
| ✅ | **F19 — Netpbm** (pbm, pgm, ppm, pnm, pam, pfm) | Custom parser ✅ | P3, P5 tested ✅ | All 10 variants ✅ | PFM float, 16-bit ✅ | Signed off |
| ➖ | **F20 — XCF** (xcf) | | | | | |

## Batch 3: Specialized Formats (F21–F30)

| Status | Format | Lib Verified | Decode Proof | Output Valid | Edge Cases | Sign-off |
|--------|--------|-------------|-------------|-------------|-----------|---------|
| ✅ | **F21 — DICOM** (dcm) | daikon 1.2.46 ✅ | Mock verified ✅ | Window/level ✅ | Auto W/L, abort ✅ | Signed off |
| ✅ | **F22 — FITS** (fts, fits) | Custom parser ✅ | Synthetic FITS ✅ | Percentile stretch ✅ | Float, int16, RGB ✅ | Signed off |
| ✅ | **F23–F28 — Camera RAW** (cr2, nef, arw, dng, +18 more) | JPEG extraction ✅ | Synthetic RAW ✅ | Largest JPEG ✅ | No-JPEG error ✅ | Signed off (preview only) |
| ➖ | **F29 — Legacy** (sgi, ras, xbm, xpm, xwd, picon, g3, g4) | | | | | |
| ➖ | **F30 — Ultra-niche** (pcd, pict, mng, wbmp, sfw, pes, flif, gv) | | | | | |

## Post-Implementation

- [ ] **P01 — Hub page update** (mainstream prominent, niche in collapsible section)
- [ ] **P02 — README.md update** (comprehensive format tables)
- [ ] **P03 — AGENTS.md** (codify Builder+Critic workflow)
- [ ] **P04 — Smoke test all formats**

## Disputes Log

| Format | Issue | Builder Position | Critic Position | Resolution |
|--------|-------|-----------------|-----------------|------------|
| (none) | | | | |
