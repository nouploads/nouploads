# CLAUDE.md

## Purpose

This file defines the mandatory operating rules for AI agents working in this repository.

This repository is optimized for:
- fast implementation
- low-regret changes
- predictable architecture
- strong test coverage
- browser-side file processing
- SEO-ready public routes
- minimal manual cleanup after AI output

The agent must prioritize:
- correctness
- consistency
- small scoped changes
- passing tests
- preserving architecture

The agent must not optimize for novelty, abstraction, or cleverness.

---

## Prime Directive

Make the smallest correct change that satisfies the task and passes the required checks.

Do not redesign the architecture unless explicitly instructed.

Do not refactor unrelated code.

Do not "improve" files outside the requested scope.

---

## Default Working Style

Unless explicitly told otherwise, the agent must:

1. inspect the existing canonical pattern
2. follow the existing structure exactly
3. write or update tests first when practical
4. implement the minimum code needed
5. run validation checks
6. fix only the failing scope
7. stop when the task is complete

The agent must assume that consistency is more important than originality.

---

## Formatting & Linting

This project uses **Biome** for linting and formatting (configured in `biome.json` with opinionated defaults).

After making code changes, the agent must run:
- `npm run lint:fix` — to auto-fix lint issues and format code

This catches style issues, import ordering, and lint violations early — before the final validation pass.

Do not manually adjust formatting. Let Biome handle it.

---

## Canonical Patterns

Before adding a new tool or route, the agent must inspect the closest existing example and copy its structure.

Current canonical example:
- `/image/heic-to-jpg`

When adding similar functionality, the agent must mirror:
- file layout
- metadata style
- page composition
- processor contract style
- test style
- naming conventions

Do not invent a second pattern when one already exists.

---

## Allowed Scope Principle

The agent may only edit files necessary for the task.

If the task does not require changing a file, do not touch it.

If a broader refactor seems helpful, do not perform it unless explicitly requested.

If a broader refactor is truly required to complete the task, the agent must:
- explain why
- keep it minimal
- limit it to the smallest safe area

---

## Forbidden Behaviors

The agent must not:

- refactor unrelated files
- rename files without strong reason
- move files without strong reason
- add dependencies without justification
- change route structure casually
- introduce new state management libraries
- introduce new UI systems
- introduce new testing frameworks
- create barrel files for heavy processors
- import heavy libraries into shared layout/global files
- silently change public behavior outside task scope
- claim success without verifying tests/build

---

## Task Execution Rules

For every task, the agent must first determine:

- exact goal
- allowed files to change
- forbidden files to change
- which tests are required
- whether this is route, feature, processor, or test work
- whether heavy bundle boundaries are affected

If any of these are unclear, infer conservatively from the repository structure and existing patterns.

Do not solve ambiguity by widening the change set.

---

## Routes Rules

Route files live under `app/routes/`.

A route file should usually:
- export `meta()`
- render the page layout
- mount a feature component

A route file should usually not:
- contain heavy processing logic
- contain large helper utilities
- contain validation business logic
- contain unrelated UI abstractions

Target:
- keep route files thin
- prefer under 120 lines where practical

If route logic grows, move logic into:
- feature components
- hooks
- processors
- SEO helpers

---

## Category Pages

When a new tool category is created (e.g. `/pdf`, `/video`, `/audio`, `/developer`), create a category listing page at the category root URL.

Every category page must have:
- **Title**: "[Category] Tools — Free Online [Category-specific keywords] | NoUploads"
- **Meta description**: One sentence about the category + privacy angle. Under 160 characters.
- **Keywords**: Category-specific keywords
- **JSON-LD**: `CollectionPage` schema
- **Canonical URL**
- **Short intro**: 2-3 sentences at the top. What the tools do + privacy + free/unlimited. No fluff.
- **Tool grid**: All tools in that category with names, descriptions, links
- **No FAQ**: FAQs belong on individual tool pages, not category pages
- **Sitemap**: Add the category URL to the sitemap (via `react-router.config.ts` prerender list)
- **Homepage link**: Make the category heading on the homepage link to the category page

Write unique intro copy for each category. Do not template-swap the same sentence with different category names.

---

## SEO Rules

Every public route must be SEO-ready.

The agent must ensure public routes include:
- title
- description
- canonical URL
- Open Graph tags

Prefer shared helpers from `app/lib/seo/`.

If the repository pattern includes JSON-LD, follow that pattern.

The agent must not hand-roll inconsistent metadata if a shared helper exists.

---

## Tool Page Copy Requirements

Every tool page — existing and new — MUST include these content elements. Follow these rules automatically when creating or modifying a tool page.

### Subtitle format

The subtitle (directly under the tool name) must follow:
"[What the tool does] — free, private, no upload required."

Naturally include primary search keywords. One line.

### About this tool section

Between the tool widget and FAQ, include a short "About this tool" paragraph (2-3 sentences):
- What the tool does (specific format/action names)
- Who it's for or when you'd use it
- Privacy differentiator (client-side, no upload, no server)
- One concrete detail (batch support, quality control, format options, etc.)

Write unique copy per tool. NEVER use a template with swapped words — Google penalizes templated content.

### FAQ section

Every tool page must have a FAQ with 2-4 items. Quality over quantity.

**Structure (in order):**
1. **Authority trivia item (ALWAYS first)** — a genuinely interesting fact about the format, tool, or technique with a working HTTPS link to an authoritative source (Wikipedia, W3C, IETF, ISO). The answer uses JSX with a React fragment containing the trivia text, then plain text `Source:`, then an `<a>` link with just the source name (e.g., `Wikipedia`) at the end (className="underline hover:text-foreground transition-colors", target="_blank", rel="noopener"). "Source:" must be plain text outside the link — only the source name is clickable. The question must be unique across the entire site — vary naturally: "Where does X come from?", "What's the story behind X?", "Who invented X?". No corporate phrasing. Trivia text must have <40% meaningful word overlap with any other trivia entry. Verify the source URL resolves.
2. **1-3 page-specific items** — answers must be unique to this particular tool/conversion and could NOT appear on any other page. Good: quality settings, transparency handling, layer behavior, format-specific limitations. Every FAQ answer must pass the swap test: if you substitute any other format name and the answer still reads correctly, it's boilerplate — remove or rewrite it.

**Banned from individual tool page FAQs (site-wide features, not page-specific):**
- "Why use NoUploads instead of...?" — site-wide pitch, not page-specific
- "Is my data safe?" / privacy questions — covered by the site-wide privacy banner
- "Does this work offline?" — site-wide feature
- "Can I convert/process multiple files at once?" — generic batch info (keep only if answer discusses format-specific batch behavior)
- "What is a [FORMAT]?" — redundant with the About section above the FAQ
- "How do I convert/compress X?" — the tool IS the answer; this is filler
- "Is this free?" / "What browsers are supported?" — site-wide features

**No two FAQ questions across the entire site should be identical.** If two pages need similar questions (e.g., quality settings), differentiate by including the format name or tool context.

**FAQPage JSON-LD (MANDATORY):** Every tool page must pass plain-text FAQ data to `buildMeta()` via the `faq` property. This generates `FAQPage` structured data for Google rich snippets. The `faq` array contains `{ question: string; answer: string }` pairs — plain text only, no JSX, no HTML, no "Source: Wikipedia" attributions. Keep answers concise but factually complete. The questions must match the on-page `faqItems` array exactly. This is NOT optional — every new tool page must include `faq` in its `buildMeta()` call.

### Outbound link policy

- Authority/editorial links (Wikipedia, W3C, IETF, ISO, official project pages): use `rel="noopener"` only. Do NOT add `noreferrer` — we want the referrer sent to signal the editorial relationship.
- Untrusted or affiliate links (we currently have none): use `rel="noopener noreferrer nofollow"`.
- All external links use `target="_blank"`.

### Meta tags

Every tool route must export meta via `buildMeta()` with:
- `title`: "[Tool Name] Online — Free, Private, No Upload | NoUploads"
- `description`: One sentence, what the tool does + privacy angle. Under 160 characters.

Unique per tool. Never duplicate meta descriptions.

### Content rules — what NOT to do

- No long-form articles, "10 reasons why..." sections, or listicle-style filler
- No keyword-stuffed paragraphs repeating the same phrase
- No identical or near-identical copy across tool pages
- No walls of text — keep everything concise and scannable
- No marketing superlatives ("the best," "the ultimate," "the most powerful")

### Library attribution

Every tool page must include a muted attribution line below the FAQ section:
- If the tool uses an open-source library: "Powered by [library name linked to repo] · [License]"
- If the tool uses only browser APIs: "Processed using the browser's built-in [API name linked to MDN] — no external libraries"

Style: `text-xs text-muted-foreground mt-8` with underlined links.

**How to find the correct GitHub link:**
1. Check `node_modules/<library>/package.json` — the `repository` field has the canonical URL
2. Or run `npm info <library> repository.url` to get it from the npm registry
3. NEVER guess or infer a GitHub URL from the author's name. Always verify programmatically.
4. After adding the link, verify it resolves to a real page (not a 404)

### Content audience

Copy serves three audiences:
1. **Users** — clean, minimal, understandable in 2 seconds
2. **Search engine crawlers** — keyword-rich enough to rank for "[action] [format] online free" queries
3. **AI crawlers (ChatGPT, Claude, Gemini)** — quotable descriptions that make AI recommend NoUploads

---

## Tool Rules

Each tool must follow the standard structure:

- route file (with meta, subtitle, about section, FAQ — see Tool Page Copy Requirements)
- feature component
- processor module
- tests
- prerender configuration if public

The agent must use shared tool UI patterns:
- ToolPageLayout
- shared dropzone/file list/result state components
- shared error/processing/empty states where available

Do not invent one-off page structures unless explicitly required.

### New tool checklist

When adding any new tool, create these files:
1. **Core tool definition** (`packages/core/src/tools/<tool>.ts`) — register in core registry
2. **Core tool import** — add side-effect import in `packages/core/src/index.ts`
3. **Core tests** (`packages/core/tests/<tool>.test.ts`) — verify registration, test execute
4. **Processor** (`apps/web/app/features/<category>/processors/<tool>.ts`) — pure processing logic
5. **Feature component** (`apps/web/app/features/<category>/components/<tool>.tsx`) — interactive UI calling the processor
6. **Route page** (`apps/web/app/routes/<category>/<tool>.tsx`) — meta export, subtitle, about section, FAQ
7. **Route registration** — add to `apps/web/app/routes.ts`
8. **Unit tests** (`apps/web/tests/unit/processors/<tool>.test.ts`) — test processor functions
9. **E2E tests** — TWO Playwright test files per tool:
   - `apps/web/tests/e2e/<tool>.spec.ts` — static page test (heading, controls, FAQ, SEO meta, canonical)
   - `apps/web/tests/e2e/<tool>-upload.spec.ts` — happy-path test (for file-processing tools: upload fixture, wait for download button, verify result)
10. **Homepage entry** — add to `apps/web/app/lib/tools.ts` gridTools array
11. **Icon registry** — if the tool's `icon` field uses a lucide-react icon not already in `apps/web/app/components/marketing/tool-icon.tsx`, add the import and `iconMap` entry. Without this, the tool tile renders with no icon.
12. **Prerender config** — add route to `apps/web/react-router.config.ts`
13. **OG image** — add entry to `scripts/generate-og-images.ts` PAGES array, then run `npx tsx scripts/generate-og-images.ts`
14. **Category page** — add the new tool to the category index page's quick-links section (e.g. `apps/web/app/routes/pdf/index.tsx` or `apps/web/app/routes/developer/index.tsx`)

Verify:
- `pnpm run build` succeeds, prerendered HTML contains static content, meta tags correct
- OG image exists in `apps/web/public/og/`
- Tool icon renders on the homepage (check that the icon name in `tools.ts` has a matching entry in `tool-icon.tsx` iconMap)
- Command palette indexes the new tool (automatic — `allTools` spreads `gridTools`, so adding to `gridTools` is sufficient)
- FAQ has 2-4 items: trivia first (with "Source: Wikipedia" link), then page-specific only — no boilerplate, no duplicate questions across the site (see FAQ section rules above)
- `buildMeta()` includes `faq` array with plain-text question/answer pairs for FAQPage JSON-LD — verify `FAQPage` appears in prerendered HTML

### Bidirectional conversion rule

When creating an X→Y format conversion tool, also create the reverse Y→X tool at the same time. Both directions get their own route, component, processor, tests, and SEO — following the "separate pages per tool" rule.

This applies only when both directions are technically feasible in-browser. Known exceptions:
- **HEIC encoding** is not possible in-browser (HEVC patents, no JS library) — HEIC→JPG is one-way only

Both tools should share processor infrastructure where possible (e.g. Canvas-based conversion handles both directions with the same code path).

Feasible pairs include: PNG↔JPG, PNG↔WebP, JPG↔WebP, JPG↔PNG.

### Universal tools with format-specific landing pages

When a tool supports multiple input/output format combinations (image conversion, document conversion, video conversion):

1. Build ONE universal tool component with props for default format selection
2. Create ONE universal tool page (e.g., `/image/convert`) targeting broad search queries
3. Create format-specific landing pages for high-volume search pairs (e.g., `/image/jpg-to-png`)
4. Each landing page reuses the same component but MUST have completely unique text content — title, description, keywords, About section, FAQ, "Why NoUploads" entry
5. NEVER template-swap text by just changing format names. Write genuinely different copy for each page. Google penalizes near-duplicate text.
6. Format-specific pages appear in the sitemap but NOT on the homepage tool grid. They're SEO entry points, not top-level navigation items.
7. The `/image` (or equivalent category) page can list popular format pairs as quick links below the main tool grid.
8. Only create landing pages for format pairs with real search volume. Don't create pages nobody will ever search for.

### Format-specific and universal tool parity

Format-specific pages (e.g. `/image/compress-gif`) and universal pages (e.g. `/image/compress`) must ALWAYS have feature parity. If a format-specific config has a slider, option, or processor feature, the universal page must expose it when that format is selected — and vice versa.

How this works architecturally:
- Format-specific tools export a config object (e.g. `gifCompressConfig` from `compress-gif-tool.tsx`)
- The universal tool uses a `resolveConfig` function that selects the right format-specific config based on the detected MIME type
- Both page types use the exact same config object — no parallel configs, no copies
- When adding a new option to any format's config, it automatically appears on both pages

Never create format-specific config or options that aren't wired through the shared base component. When adding a new format or option, verify it works on both the format-specific page AND the universal page.

### Homepage and category page tile rules

The homepage and category pages show ONE card per tool type (convert, compress, resize, etc.), never per format or per format pair. Format-specific pages are SEO landing pages — they surface through:
1. "Popular Conversions/Compressions" quick-link pill sections on category pages
2. Command palette search results
3. Google/AI search landing
4. Direct URL

When a new tool type is added (e.g., "Video Compress"), it gets ONE card on the homepage. Format-specific variants (e.g., "Compress MP4", "Compress MOV") are landing pages with unique SEO copy, not homepage cards.

---

## Processor Rules

Processors must be:
- testable
- explicit
- isolated from route files
- isolated from visual rendering concerns
- portable (no React imports, no DOM globals like document/window/navigator)

Processors must not:
- directly manipulate React state
- directly manipulate page layout
- trigger toasts or navigation
- import large UI components

If a browser API is needed (like Canvas), accept it as an injected dependency.

If possible, processors should:
- accept typed input (`Uint8Array`, `File`, `Blob`)
- return typed success/error results
- handle invalid input explicitly
- be deterministic

---

## Web Worker Rules

All CPU-intensive processing must run in Web Workers to keep the main thread responsive. This includes WASM encoding, pixel manipulation, color quantization, heavy library calls (heic2any, image-q, etc.), and any operation that could block the UI for more than ~50ms.

Every processor that spawns a Web Worker must:
- Create a dedicated `.worker.ts` file per processor (e.g. `compress-png.worker.ts`)
- Keep the main processor `.ts` file as a thin wrapper that spawns the worker and returns a Promise
- Support `AbortSignal` for in-flight cancellation — when aborted, call `worker.terminate()` immediately to avoid zombie CPU usage
- Clean up the abort listener on completion to prevent memory leaks
- Use `OffscreenCanvas` + `convertToBlob()` instead of DOM canvas in workers (`document.createElement("canvas")` is unavailable in workers)

Follow the established pattern from `avif-encode.worker.ts` and `encodeAvifInWorker()` in `convert-image.ts`:
1. Worker file: imports library, listens on `self.onmessage`, posts result or error back
2. Caller: creates `new Worker(new URL("./foo.worker.ts", import.meta.url), { type: "module" })`, wraps in Promise with abort support
3. Worker is terminated after each use (short-lived, one operation per worker instance)

Vite config already has `worker: { format: "es" }` and `optimizeDeps.exclude` for WASM packages.

Unit tests for worker-based processors should mock the `Worker` constructor (see `tests/unit/helpers/mock-worker.ts`), not Canvas/DOM APIs. E2E tests run in a real browser where Workers work natively.

---

## Frontend Abort Rules ("One Job at a Time")

Every `useEffect` that triggers a processor (compress, convert, decode, etc.) must follow the **one-job-at-a-time** pattern:

1. Create a new `AbortController` at the top of the effect
2. Pass `controller.signal` through the config/processor call chain all the way to the worker
3. Check `controller.signal.aborted` after each `await` before updating state
4. Return a cleanup function that calls `controller.abort()` — React calls this before re-running the effect, so the previous job is always cancelled before a new one starts

This guarantees exactly one in-flight operation per effect. When the user changes parameters (quality slider, output format, selects a new file, navigates away), React re-runs the effect, the cleanup aborts the old worker, and the new effect starts fresh. No zombie workers, no stale state updates.

**Pattern:**
```tsx
useEffect(() => {
  const controller = new AbortController();
  setProcessing(true);

  (async () => {
    try {
      const result = await processor(input, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setResult(result);
      setProcessing(false);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Failed");
      setProcessing(false);
    }
  })();

  return () => controller.abort();
}, [input, options]);
```

**Rules:**
- Never use `useRef` counters (e.g. `convertRef.current`) for staleness checks — use `AbortController` instead
- Every processor function in the config interface must accept an optional `signal?: AbortSignal` parameter and pass it through
- Batch operations also need abort — the signal propagates to each sequential worker call
- Do not swallow AbortError silently in the processor — let it propagate so the effect's catch block handles it uniformly

---

## Tool Page UX Rules (Single-File Preview)

Every single-file image tool must follow the gold-standard UX pattern from `image-converter-tool.tsx`:

### Result label (always visible once file is dropped)

- The "Result" header and subtitle render immediately when a file is selected — they do not wait for processing to finish.
- The subtitle uses cross-fading between two spans:
  - A "processing" span (`{filename} — <Spinner /> Compressing...`) with `transition-opacity duration-300`, opacity 1 when processing, 0 when done.
  - A "result" span (rendered only when resultBlob exists) with `absolute right-0 top-0 whitespace-nowrap transition-opacity duration-300`, opacity 0 when processing, 1 when done.
- Both spans occupy the same space via absolute positioning so they cross-fade smoothly.

### Preview area states

Four mutually exclusive states, checked in order:

1. **Initial load** (`converting && !hasResult`): Original image shown at opacity-60 with a centered "Loading preview..." overlay. If no original URL is available yet, show a centered spinner with "Loading preview..." text.
2. **Error** (`error`): Centered error icon and message.
3. **Compare slider** (`originalUrl && resultUrl`): The `ImageCompareSlider` wrapped in a relative container. During re-processing (`converting` is true), the slider fades to opacity 0.25 and a centered `<Spinner className="size-10" />` overlay fades in. Both use `transition-opacity duration-300`.
4. **Original only** (`originalUrl`): Fallback showing just the original image.

### Key behavior: re-processing keeps the compare slider visible

When the user changes a parameter (quality, format) and a previous result exists, the compare slider remains visible but dims. It does NOT get replaced by a full-screen loading overlay. This gives the user visual continuity.

### Transitions

All opacity transitions use `transition-opacity duration-300` (Tailwind). No pulse animations. No other transition properties on color preview boxes (use `transition-none` to avoid lag).

---

## Heavy Dependency Rules

Heavy dependencies must remain local to the feature or tool that needs them.

Examples:
- ffmpeg.wasm
- large image codecs
- PDF runtimes
- OCR engines

The agent must not:
- import heavy dependencies in root layout
- import heavy dependencies in shared layout
- import heavy dependencies through broad barrel exports
- import a heavy processing library at the top level of a component

Preferred approach:
- route-level code split
- dynamic `import()` or runtime `fetch()` inside the component or a hook
- show a loading state with progress for any library >500KB
- use Web Workers for CPU-intensive operations (video, AI inference)

Users of one tool must not download another tool's engine.

---

## Dependency Rules

The agent may not add a new dependency unless it is clearly necessary.

Before adding a dependency, the agent must justify:
1. what problem it solves
2. why existing code/browser APIs are insufficient
3. where it loads
4. whether it affects all routes or only one route
5. likely bundle-size impact
6. whether it affects prerender/browser compatibility

If the dependency is not essential, do not add it.

Prefer:
- existing repo dependencies
- browser APIs
- small focused libraries

Avoid:
- trendy abstractions
- overlapping utility libraries
- speculative dependencies
- architecture-heavy packages

### Version pinning

All dependency versions in `package.json` must be pinned to exact versions — no `^` or `~` prefixes.

When adding a dependency: `npm install --save-exact <pkg>` (or `--save-exact -D` for dev deps).

Always use the latest available version of a package unless there is a known incompatibility (e.g., a peer dependency constraint from another package).

---

## Testing Rules

### Test-first preference

For logic-heavy work, the agent should prefer TDD.

Preferred order:
1. add fixtures if needed
2. write failing tests
3. implement minimum code
4. run tests
5. refactor carefully

This is especially required for:
- processors
- validators
- file handling rules
- metadata helpers
- state transitions
- output contracts

### Two levels of testing

**Level 1: Playwright E2E tests** (`tests/e2e/`)

Test the full user flow in a real browser. Every tool must have an E2E test that:

1. Navigates to the tool page
2. Uploads a test fixture file from `tests/e2e/fixtures/`
3. Waits for processing to complete (wait for download button to appear)
4. Clicks download and captures the output file
5. Asserts: file exists, correct file extension, non-zero file size, valid magic bytes for the output format

Magic bytes reference:
- JPG: starts with `FF D8 FF`
- PNG: starts with `89 50 4E 47`
- WebP: starts with `52 49 46 46` ... `57 45 42 50`
- PDF: starts with `25 50 44 46`
- GIF: starts with `47 49 46 38`

Do NOT:
- Compare pixels between input and output
- Use golden file / snapshot comparison
- Take screenshots for visual comparison
- Assert exact file sizes (they vary by platform)

**Level 2: Vitest unit tests** (`tests/unit/`)

Test processor functions directly without a browser. Every processor must have a unit test that:

1. Reads a fixture file into `Uint8Array`
2. Calls the processor function with default options
3. Asserts: output is not empty, valid magic bytes for the expected format, output size is within a reasonable range
4. For compression tools: assert output size < input size
5. For resize tools: decode output and check dimensions match requested dimensions
6. For conversion tools: assert output magic bytes match the target format

Do NOT:
- Compare pixel-by-pixel output
- Assert exact output file sizes
- Use snapshot testing for binary output

### Playwright rules

For E2E tests, prefer:
- one happy path
- one important failure path
- minimal stable selectors
- real user flows

Do not create brittle over-specified E2E tests.

Focus on:
- upload/select file
- process/convert action
- success result visible
- download action available
- invalid input handled

### Test fixture files

Keep real test files in `tests/e2e/fixtures/`. Requirements:
- Real files, not programmatically generated
- Under 200KB each to keep the repo light (exceptions allowed with justification)
- CC0 or public domain licensed where possible
- One file per format: sample.heic, sample.jpg, sample.png, sample.webp, sample.pdf, etc.
- Add new fixture files as new format support is added

### When to write tests

- Write E2E tests when a tool is complete and working
- Write unit tests when a processor is complete and stable
- Run `npm test` before committing changes to processors
- Run `npm run test:e2e` before deploying to production

### New tool testing checklist

When adding a new tool, also add:
1. A fixture file in `tests/e2e/fixtures/` if the format is not already covered
2. A core test in `packages/core/tests/<tool>.test.ts` for the core tool registration and execute function
3. A unit test in `apps/web/tests/unit/processors/<tool>.test.ts` for the web processor
4. A static page E2E test in `apps/web/tests/e2e/<tool>.spec.ts` — heading, controls, FAQ, SEO meta, canonical
5. A happy-path E2E test in `apps/web/tests/e2e/<tool>-upload.spec.ts` — for file-processing tools: upload fixture, wait for download button, verify result. For interactive tools: fill inputs, verify output

### Required test coverage

For each new tool or processor, the agent must ensure:

- unit tests for processor/helper logic
- component/integration test for primary UI behavior where relevant
- Playwright happy-path test for user-facing tools
- invalid-input test
- large-input or guardrail behavior test where relevant

If a task does not need all of these, follow the smallest existing pattern in the repo.

Do not skip tests merely because manual testing "looks fine."

---

## Performance and Guardrail Rules

Performance is part of correctness.

For tools that process files, the agent must consider:
- maximum file size
- maximum file count
- browser capability limits
- memory-risk scenarios
- mobile constraints
- Safari/WebKit constraints if relevant

If a workload is dangerous, the tool must fail gracefully or warn before processing.

Do not assume unlimited browser capacity.

---

## Accessibility Rules

The agent must preserve basic accessibility.

At minimum:
- buttons must have meaningful text or labels
- file inputs must remain usable without drag/drop
- dialogs must manage focus correctly
- key user flows must remain keyboard reachable
- errors and success states must be visible and understandable

Do not regress accessibility while adding features.

---

## Naming Rules

Use explicit names.

Prefer:
- `remove-metadata-tool.tsx`
- `compress-image.ts`
- `tool-processing-state.tsx`

Avoid:
- `helper.ts`
- `misc.ts`
- `temp.ts`
- `newTool.tsx`
- vague names with unclear responsibility

Names should describe exactly what the file or symbol does.

---

## Editing Rules

When editing files:
- preserve existing formatting style
- preserve naming conventions
- avoid unrelated import sorting churn
- avoid broad rewrites
- avoid moving code between layers unless necessary

Do not create noise diffs.

Prefer small, reviewable diffs.

---

## Refactoring Rules

Refactor only when one of these is true:
- the task requires it
- the existing code blocks safe implementation
- duplication is clearly causing repeated errors
- a module is unreasonably large
- tests already protect the change

Do not perform speculative cleanup.

Do not use feature work as an excuse for architectural experiments.

---

## Validation Rules Before Claiming Success

Before claiming a task is complete, the agent must run or verify the relevant checks.

Minimum expectation:
- lint (`npm run lint`)
- typecheck
- unit tests for changed logic
- component tests if relevant
- Playwright tests if user flow changed
- production build
- for route or UI changes: start the dev server and curl affected pages to verify they render correctly (build passes and TypeScript compiles don't guarantee runtime rendering works)

If any check fails, do not claim success.

If not all checks can be run, the agent must say exactly which were run and which were not.

No bluffing.

---

## Output Rules

When reporting completion, the agent must state:

- what changed
- which files changed
- what tests were added or updated
- what checks passed
- any known caveats
- whether bundle boundaries or guardrails were affected

Be concise and precise.

Do not give marketing-style summaries.

---

## Failure Recovery Rules

If tests fail, the agent must:
1. inspect the failing test output
2. identify the smallest likely cause
3. fix only the relevant scope
4. rerun the relevant checks

Do not respond to one failing test by rewriting broad sections of the codebase.

Fix narrowly first.

---

## Prompt Interpretation Rules

If the user gives a broad request like:
- "build this tool"
- "add this feature"
- "fix this page"

the agent must internally decompose it into:
- route work
- component work
- processor work
- tests
- metadata
- prerender updates

Then implement the smallest safe sequence.

Do not attempt a giant one-shot rewrite.

---

## Protected Areas

Unless explicitly asked, be extremely cautious changing:

- root app shell
- route config conventions
- global styles
- shared UI primitives
- SEO helpers
- build configuration
- test configuration
- dependency manifests

Changes here have broad blast radius.

---

## Standard "Done" Definition

A task involving a new public tool is only done if:

- route exists and is registered in `routes.ts`
- metadata exists (title, description, canonical, OG tags)
- processor exists (core + web)
- core tool registered in `packages/core/src/index.ts`
- unit tests exist (core + web processor)
- E2E Playwright tests exist (static page + upload happy-path)
- happy path works
- invalid input is handled
- large input behavior is defined if relevant
- prerender config is updated in `react-router.config.ts`
- homepage entry added to `tools.ts`
- OG image generated (entry in `scripts/generate-og-images.ts`, run script)
- category index page updated with quick-link
- build passes
- no unrelated files were changed

If these are not true, the task is not done.

---

## Standard "Smallest Safe Change" Definition

The best solution is usually:
- fewer files changed
- fewer abstractions added
- fewer new concepts introduced
- fewer dependencies added
- more reuse of existing patterns

The agent should always prefer this path.

---

## Repository Philosophy

This repository is designed for repeatable AI-assisted shipping.

The agent must optimize for:
- speed
- reliability
- consistency
- maintainability
- low surprise

Do not optimize for:
- novelty
- cleverness
- framework fashion
- speculative abstraction

When in doubt, choose the more boring solution.

---

## Builder + Critic Workflow

All non-trivial implementation tasks must use a **Builder + Critic** adversarial workflow. The purpose is to eliminate guesswork, assumptions, and untested code. "It should work" is not proof — a test log showing it works is proof.

### How it works

For every significant implementation unit (new decoder, new tool, new library integration, architectural change), the agent must alternate between Builder and Critic roles — either by spawning a separate Critic subagent or by explicitly switching modes within a single agent (prefixing reasoning with `[BUILDER]` or `[CRITIC]`).

When using subagents for implementation, **always include a Critic role** — either as a dedicated Critic subagent that reviews the Builder's output, or by instructing each subagent to run the Builder + Critic workflow internally.

### Critic responsibilities

The Critic challenges every assumption with "prove it." The Builder must provide hard evidence (not vibes) to satisfy each checkpoint:

**Checkpoint 1 — Library Verification (before writing any code)**
- "Does this npm package actually exist?" → `npm info <package>`. If it 404s, stop.
- "Is the API what we think it is?" → Read the actual README or source. Never assume API shape from package name.
- "Does it work in the browser?" → Check for `"browser"` or `"module"` fields. Many packages are Node-only.
- "What is the real bundle size?" → Check unpacked size from `npm info`.

**Checkpoint 2 — Implementation Review (during coding)**
- "Does this magic byte sequence actually match?" → Verify with `xxd` hex dump of a real test file.
- "Does this decode path handle the test file?" → Run against a real file, not a hypothetical.
- "Are we handling errors, or just the happy path?" → Feed truncated/corrupt data and verify clean error.
- "Is this actually client-side only?" → Grep for `fetch(`, `XMLHttpRequest`, network calls.

**Checkpoint 3 — Proof of Working (before sign-off)**
- "Show me the test output." → Run a local test with a real file. Output must show real dimensions, not 0x0.
- "Show me the edge case test." → For animated formats: prove frame count > 1. For transparent: prove alpha preserved. For HDR: prove tone mapping works.
- "Does the page render?" → Curl the route in dev mode. No blank screen or error boundary.

**Checkpoint 4 — Sign-off**
Both Builder and Critic must agree on all of:
- [ ] Library exists and installs (or custom parser justified)
- [ ] Decoder handles a real/synthetic test file
- [ ] Output is valid (correct dimensions, correct magic bytes)
- [ ] Edge cases handled (not just acknowledged — tested)
- [ ] Error handling shows user-friendly message on corrupt input
- [ ] No network requests during processing
- [ ] Page renders if new page was created
- [ ] Tests pass
- [ ] FAQ section follows rules (if new page was created — see below)

**FAQ sign-off checklist (for new tool pages):**
- [ ] Trivia is FAQ #1 with natural question wording
- [ ] Trivia source link resolves (curl returns 200 or 301/302)
- [ ] Trivia fact is verifiable from the linked source
- [ ] Source link renders as plain "Source: " text + linked source name (not "Source: Name" as one link)
- [ ] Source link uses `rel="noopener"` not `rel="noopener noreferrer"`
- [ ] No site-wide boilerplate FAQ items (privacy, batch, offline, "why NoUploads", "is this free")
- [ ] Every FAQ answer passes the swap test
- [ ] No FAQ question is identical to any existing question on another page
- [ ] Trivia does not duplicate the About section
- [ ] 2-4 FAQ items total
- [ ] `buildMeta()` includes `faq` array with plain-text pairs for FAQPage JSON-LD
- [ ] Prerendered HTML contains `FAQPage` structured data

### Escalation

If Builder and Critic cannot agree after 3 rounds on a specific issue, document the disagreement, flag as disputed, and move on. Resolve in a follow-up pass.

### What the Critic is NOT

- Not a rubber stamp. "Looks good" without evidence is not valid.
- Not a blocker for fun. If the Builder provides hard proof, the Critic accepts it.
- Not responsible for writing code. It only questions, challenges, and verifies.

---

## Final Instruction

Follow existing patterns.
Change as little as possible.
Add tests.
Keep bundle boundaries clean.
Do not pretend a task is complete unless it is actually verified.
