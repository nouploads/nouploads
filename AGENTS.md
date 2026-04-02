# Agent Workflow Rules

## Builder + Critic + Fact-checker System

All non-trivial tasks use a **Builder + Critic + Fact-checker** adversarial workflow. No code is considered complete until all three roles sign off. See CLAUDE.md "Quality Process" for the universal mandate.

### Builder Role

- Implements features, writes code, creates pages
- Must provide hard evidence for every claim (test output, not assertions)
- Must run real files through decoders before claiming they work

### Critic Role

- Scrutinizes every assumption, guess, thought, action, and identifies gaps/blind spots
- Challenges with "prove it" — does not accept hand-waving or plausible-sounding claims
- Demands local test evidence: hex dumps, console output, dimension checks
- Tests error handling with corrupt/truncated files

### Fact-checker Role

- Independently verifies every factual statement, API claim, library behavior, and technical assertion
- Does not trust the Builder's word — runs its own checks (`npm info`, docs reads, hex dumps, test runs)
- Verifies libraries exist, APIs match docs, files actually decode
- Flags any discrepancy between claimed and observed behavior

### Double-pass Sanity Check

Before sign-off, review all output twice: first for correctness (are the facts right?), then for completeness (is anything missing?). Only proceed when both passes are clean.

### Sign-off Checklist (required for every format)

- [ ] Library verified: `npm info <pkg>` shows real, maintained package (or custom parser justified)
- [ ] Real test file decoded without errors
- [ ] Output image has correct dimensions (not 0x0)
- [ ] Output image is valid (magic bytes check)
- [ ] Animated detection works (if applicable)
- [ ] Transparency preserved (if applicable)
- [ ] Corrupt file input produces clean error message
- [ ] No network requests during processing
- [ ] Page renders without errors (if new page created)
- [ ] Tracker updated

### Dispute Resolution

After 3 failed rounds on a specific issue, document the disagreement in the tracker as disputed and move on. Resolve in post-implementation review.

## Coding Standards

- Zero network calls for file processing (client-side only)
- Lazy-load all WASM modules and heavy libraries (never in main bundle)
- All decoders return a standard `DecodedImage` interface (`{ data: Uint8Array, width: number, height: number }`)
- Test with real files, not synthetic/empty buffers (synthetic OK for unit tests, real files for E2E)
- Follow existing patterns exactly — inspect the closest existing example before adding anything new

## SEO Content Rules

Before creating any new tool page, the Builder must provide unique content for
all required sections (see SEO_RULES.md). The Critic and Fact-checker must verify:

1. The authority trivia FAQ is genuinely unique — not a word-swap of another page. No banned FAQ topics (see CLAUDE.md).
2. The About section mentions at least one fact specific to this conversion pair.
3. The page passes the swap test (remove format names → still distinguishable).
4. Title and meta description are unique across the entire site.
5. A self-referencing canonical tag is present.
