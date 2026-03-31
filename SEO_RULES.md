# SEO Content Rules

## The Anti-pSEO Rule

Every page on this site must pass the **swap test**: if you remove all format names
from the text content, can you still tell which page you're on? If not, the page
is a template clone and must be fixed.

## FAQ Rules

### Structure
1. Trivia item is ALWAYS FAQ #1 — format origin/history with authority source link
2. After trivia: only 1-2 page-specific items whose answers are unique to THIS tool/conversion
3. Target 2-4 FAQ items per page total — quality over quantity, never pad

### Trivia item requirements
- One genuinely interesting fact a normal person would appreciate (not dry spec details)
- Working HTTPS link to an authoritative source (Wikipedia, W3C, IETF, ISO, official project page)
- Link format: `Source: Wikipedia` — not "Learn more on Wikipedia" or "Read more at W3C"
- Link attributes: `target="_blank" rel="noopener"` — never add `noreferrer` on authority links
- Question wording must be natural and varied across pages (no two identical questions site-wide)
- Must not duplicate the About section content — trivia covers history/origin, About covers what the tool does

### Banned from individual tool page FAQs
These are site-wide features. They belong on /about or /faq once, not repeated on every tool page:
- Privacy/security ("Is my data safe?", "files never leave your device")
- Batch processing ("Can I convert multiple files at once?")
- Offline support ("Does this work offline?")
- Generic "Why NoUploads?" with swap-testable answer
- "How do I convert X to Y?" (the tool itself answers this)
- "Is this free?" / "What browsers are supported?" / any site-wide feature

### Swap test (applies to FAQs too)
Every FAQ answer must pass the swap test: replace the format name with any other format — if the answer still makes sense, it's boilerplate and must not exist as a standalone FAQ item on individual tool pages.

### Do NOT split format identity across multiple FAQ items
Wrong: separate "What is HEIC?" and "Who created HEIF?" entries.
Right: one trivia item that covers origin, creator, and an interesting fact in a single cohesive answer.

### FAQPage JSON-LD structured data (MANDATORY)
Every tool page must pass a `faq` array to `buildMeta()` containing plain-text `{ question, answer }` pairs. This generates a `FAQPage` schema in the page's `<head>`, enabling Google FAQ rich snippets. The plain-text answers must match the on-page content but strip all JSX, HTML links, and "Source: Wikipedia" attributions. Verify `FAQPage` appears in the prerendered HTML after building.

---

## Content Requirements by Page Type

### X-to-Y Conversion Pages (/image/heic-to-jpg, etc.)

Each page MUST have these unique sections below the tool UI:

1. **About section** — 2-4 sentences. Must mention at least one fact specific to
   this conversion pair that wouldn't apply to any other pair. If you can swap the
   format names and the text still makes sense for another page, it's not specific enough.

2. **FAQ section** — 2-4 items following the FAQ Rules above. Trivia first, then
   page-specific technical questions (lossy vs lossless, transparency handling,
   metadata preservation, etc.). No site-wide boilerplate.

**Minimum unique word count:** 150 words of body text (not counting shared UI).

### Compression Pages (/image/compress-jpg, etc.)

Each page MUST explain how compression works for THIS specific format:
- What type of compression (lossy vs lossless vs color quantization)?
- What the slider actually controls for this format?
- What artifacts to expect at low settings?

**Minimum unique word count:** 100 words.

### Niche Catch-All Converter Pages (/image/psd-converter, etc.)

Each page MUST have:
1. About section covering who uses the format and what it's for
2. FAQ with trivia first, then conversion-specific notes (layers flattened, preview extracted, etc.)

**Minimum unique word count:** 150 words.

## How to Add a New Conversion Page

1. Write the unique content FIRST.
2. Run the swap test: remove format names from About + FAQ. Still distinguishable?
3. If you can't write a unique "Why convert X to Y?" that differs from every other
   page's version, DO NOT create a separate page. Add it to /image/convert instead.

## What NOT to Do

- Do NOT create pages where the only difference is one keyword swap.
- Do NOT repeat site-wide features (privacy, offline, batch) as standalone FAQ items on tool pages.
- Do NOT create niche X-to-Y pages (no /image/exr-to-avif).
