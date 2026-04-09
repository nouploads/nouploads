# Changelog

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
