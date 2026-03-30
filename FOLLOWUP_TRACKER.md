# Follow-Up Implementation Tracker

Legend: ✅ Signed off | ⚠️ Disputed | ❌ Not feasible | ⏳ In progress | 🔬 Verifying

## Batch 1: Animation + Deferred + High-Value Image Formats
| Status | ID | Task | Lib Verified | Decode Proof | Output Valid | Edge Cases | Sign-off |
|--------|----|------|-------------|-------------|-------------|-----------|---------|
| ✅ | D01 | Animation detection (APNG, WebP, AVIF, JXL, GIF) | Header parsing ✅ | 14 tests ✅ | Badge UI ✅ | All 4 formats ✅ | Signed off |
| ✅ | D02 | JP2 (JPEG 2000) | @cornerstonejs/codec-openjpeg 1.3.0 ✅ | JP2+J2K ✅ | 10 tests ✅ | 8/16-bit, 1-4ch ✅ | Signed off |
| ✅ | D04 | EPS preview extraction | Custom + utif2 ✅ | DOS+text EPS ✅ | 9 tests ✅ | TIFF/EPSI preview ✅ | Signed off |
| ✅ | D05 | ICNS (Apple Icon) | Custom parser ✅ | PNG+ARGB ✅ | 7 tests ✅ | PackBits, masks ✅ | Signed off |
| ✅ | D06 | PSB (Photoshop Big) | @webtoon/psd handles PSB ✅ | Mock verified ✅ | 6 tests ✅ | Size guard ✅ | Signed off |
| ✅ | D09a | SGI decoder | Custom parser ✅ | Synthetic ✅ | 5 tests ✅ | RLE, flip ✅ | Signed off |
| ✅ | D09b | Sun Raster decoder | Custom parser ✅ | Synthetic ✅ | 5 tests ✅ | RLE, colormap ✅ | Signed off |
| ✅ | D09c | WBMP decoder | Custom parser ✅ | Synthetic ✅ | 5 tests ✅ | Multi-byte ints ✅ | Signed off |
| ✅ | D09d | SFW decoder | Custom parser ✅ | Mock JPEG ✅ | 4 tests ✅ | JPEG extraction ✅ | Signed off |
| ✅ | D09e | PCD decoder | Custom parser ✅ | Synthetic ✅ | 4 tests ✅ | YCbCr, Base/4 ✅ | Signed off |
| ✅ | D09f | PICT decoder | Custom parser ✅ | Mock JPEG ✅ | 4 tests ✅ | JPEG extraction ✅ | Signed off |

## Batch 1 Phase B
| Status | ID | Task | Lib Verified | Decode Proof | Output Valid | Edge Cases | Sign-off |
|--------|----|------|-------------|-------------|-------------|-----------|---------|
| ✅ | D03 | XCF (GIMP) | Custom parser + fflate ✅ | 9 tests ✅ | RLE+zlib tiles ✅ | Layer composite ✅ | Signed off |
| ✅ | D10a | XBM decoder | Custom parser ✅ | Synthetic ✅ | 5 tests ✅ | LSB-first 1bpp ✅ | Signed off |
| ✅ | D10b | XPM decoder | Custom parser ✅ | Synthetic ✅ | 6 tests ✅ | X11 colors, None ✅ | Signed off |
| ✅ | D10c | XWD decoder | Custom parser ✅ | Synthetic ✅ | 5 tests ✅ | 8/24/32bpp ✅ | Signed off |
| ✅ | D07 | XPS spike (raster extraction) | jszip ✅ | Mock ZIP ✅ | 6 tests ✅ | TIFF fallback ✅ | Signed off |
| ✅ | D08 | ODG spike (thumbnail extraction) | jszip ✅ | Mock ZIP ✅ | 6 tests ✅ | Pictures/ fallback ✅ | Signed off |

## Batch 2: Vector Tools
| Status | ID | Task | Lib Verified | Decode Proof | Output Valid | Edge Cases | Sign-off |
|--------|----|------|-------------|-------------|-------------|-----------|---------|
| ✅ | D11 | Vector infrastructure | Hub + types + component ✅ | /vector renders ✅ | Cross-links ✅ | Routes wired ✅ | Signed off |
| ✅ | D12 | SVG optimizer (svgo + SVGZ) | svgo 4.0.1 ✅ | 6 tests ✅ | SVGZ output ✅ | CompressionStream ✅ | Signed off |
| ✅ | D13 | SVGZ decoder | fflate fallback ✅ | 6 tests ✅ | Decompression ✅ | Double-gzip ✅ | Signed off |
| ✅ | D14 | EMF decoder (narrow) | Custom 781-line ✅ | 8 tests ✅ | Canvas render ✅ | Shapes, DIB ✅ | Signed off |
| ✅ | D15 | AI (Adobe Illustrator via pdfjs) | pdfjs-dist (installed) ✅ | 4 tests ✅ | PDF render ✅ | PS fallback ✅ | Signed off |
| ✅ | D16 | CDR (CorelDRAW preview) | RIFF+jszip ✅ | 4 tests ✅ | BMP/TIFF extract ✅ | X5+ ZIP ✅ | Signed off |
| ✅ | D17 | VSD / VSDX (Visio) | cfb+jszip ✅ | 10 tests ✅ | Preview extract ✅ | OOXML+OLE2 ✅ | Signed off |
| ❌ | D18 | CGM | N/A | N/A | N/A | N/A | Killed: low demand, complex ISO spec |
| ❌ | D19 | SK / SK1 / SK2 | N/A | N/A | N/A | N/A | Killed: no JS/WASM parser exists |
| ✅ | D20 | PUB (Publisher) | cfb ✅ | 5 tests ✅ | OLE2 extract ✅ | Largest image ✅ | Signed off |

## Batch 3: Integration + Documentation
| Status | ID | Task | Notes |
|--------|----|------|-------|
| ✅ | D21 | AGENTS.md + CONTRIBUTING.md | Already complete from prior work |
| ✅ | D22 | README.md comprehensive update | Updated tool counts (80+), new tool sections, test counts |
| ✅ | D23 | Format router expansion | 10 new tools added (batch-next-10): PDF split/rotate/watermark/text, image rotate/watermark/favicon, JSON formatter, hash generator, JWT decoder |
| ✅ | D24 | /image hub update | Image hub already shows rotate, watermark, favicon via gridTools filter |
| ✅ | D25 | /vector ↔ /image cross-linking | Already complete — /image links to /vector, /vector links to /image |
| ✅ | D26 | Smoke test all new formats | All 10 new routes prerender. 616 unit tests pass. E2E page structure tests pass. |

## Killed Formats
| Format | Reason |
|--------|--------|
| SK/SK1/SK2 | No JS/WASM parser. Python-only toolchain (sK1 UniConvertor). |
| CGM | Complex ISO 8632 spec, near-zero web demand. |
| FLIF | Abandoned format. No JS/WASM decoder on npm. |
| MNG | Dead format. No JS parser. |
| G3/G4 fax | Complex CCITT Huffman, extremely niche. |
| PES | Embroidery stitch data, not an image format. |
| GV | Text graph description, not an image. Defer to vector tools if @hpcc-js/wasm-graphviz viable. |

## Disputes Log
| ID | Issue | Builder Position | Critic Position | Resolution |
|----|-------|-----------------|-----------------|------------|
| | | | | |
