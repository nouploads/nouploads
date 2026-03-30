# SEO Content Rules

## The Anti-pSEO Rule

Every page on this site must pass the **swap test**: if you remove all format names
from the text content, can you still tell which page you're on? If not, the page
is a template clone and must be fixed.

## Content Requirements by Page Type

### X-to-Y Conversion Pages (/image/heic-to-jpg, etc.)

Each page MUST have these unique sections below the tool UI:

1. **About section** — 2-4 sentences. Must mention at least one fact specific to
   this conversion pair that wouldn't apply to any other pair. If you can swap the
   format names and the text still makes sense for another page, it's not specific enough.

2. **FAQ section** — 3-5 questions with genuinely unique answers. At least one FAQ
   must address a technical aspect specific to this conversion (lossy vs lossless,
   transparency handling, metadata preservation, etc.).

3. **"Why use NoUploads"** FAQ — MUST vary meaningfully across pages. The privacy
   message is important but should be framed differently per format. HEIC pages should
   mention iPhone photos on servers. PSD pages should mention proprietary design files.
   GIF pages should mention meme/messaging content. Don't just repeat "no upload, works
   offline" identically.

**Minimum unique word count:** 150 words of body text (not counting shared UI).

### Compression Pages (/image/compress-jpg, etc.)

Each page MUST explain how compression works for THIS specific format:
- What type of compression (lossy vs lossless vs color quantization)?
- What the slider actually controls for this format?
- What artifacts to expect at low settings?

**Minimum unique word count:** 100 words.

### Niche Catch-All Converter Pages (/image/psd-converter, etc.)

Each page MUST have:
1. "What is [FORMAT]?" — who uses it, where it comes from
2. "Who needs this?" — target user and use case
3. Conversion-specific notes (layers flattened, preview extracted, etc.)

**Minimum unique word count:** 150 words.

## How to Add a New Conversion Page

1. Write the unique content FIRST.
2. Run the swap test: remove format names from About + FAQ. Still distinguishable?
3. If you can't write a unique "Why convert X to Y?" that differs from every other
   page's version, DO NOT create a separate page. Add it to /image/convert instead.

## What NOT to Do

- Do NOT use identical "Why NoUploads" answers across pages.
- Do NOT create pages where the only difference is one keyword swap.
- Do NOT repeat "no upload, works offline, free, open source" identically on every page.
- Do NOT create niche X-to-Y pages (no /image/exr-to-avif).
