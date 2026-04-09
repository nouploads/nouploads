# CLAUDE.md

## Purpose

Mandatory operating rules for AI agents in this repository. Priorities: correctness, consistency, small scoped changes, passing tests, preserving architecture, browser-side processing, SEO-ready routes, minimal manual cleanup. Do not optimize for novelty, abstraction, or cleverness.

---

## Prime Directive

Make the smallest correct change that satisfies the task and passes the required checks. Do not redesign the architecture unless explicitly instructed. Do not refactor unrelated code. Do not "improve" files outside the requested scope.

---

## Default Working Style

Unless explicitly told otherwise:

1. inspect the existing canonical pattern
2. follow the existing structure exactly
3. write or update tests first when practical
4. implement the minimum code needed
5. run validation checks
6. fix only the failing scope
7. stop when the task is complete

---

## Quality Process

Be thorough. For every non-trivial task:

1. **Spin up a Critic subagent** — scrutinizes every assumption, guess, thought, action, and identifies gaps, blind spots, and anything missed. Challenges with "prove it" — no hand-waving.

2. **Spin up a Fact-checker subagent** — independently verifies every factual statement, API claim, library behavior, file format detail, or technical assertion via its own checks (npm info, hex dumps, docs reads, test runs).

3. **Double-pass sanity check** — review output twice: first for correctness, then for completeness. Only proceed when both passes are clean.

This applies to all work — research, implementation, debugging, code review, and answering questions — not just implementation. See **Builder + Critic Workflow** for implementation-specific protocol.

"I think this is right" is never sufficient. "I verified this is right, here's the evidence" is the minimum bar.

---

## Formatting & Linting

Uses **Biome** (configured in `biome.json`). After code changes, run `npm run lint:fix`. Do not manually adjust formatting.

---

## Canonical Patterns

Before adding a new tool or route, inspect the closest existing example and copy its structure.

Current canonical example: `/image/heic-to-jpg`

Mirror: file layout, metadata style, page composition, processor contract, test style, naming. Do not invent a second pattern when one exists.

---

## Scope & Forbidden Behaviors

Only edit files necessary for the task. If a broader refactor is truly required, explain why, keep it minimal, and limit to the smallest safe area.

The agent must not:
- rename or move files without strong reason
- add dependencies without justification
- change route structure casually
- introduce new state management, UI, or testing frameworks
- create barrel files for heavy processors
- import heavy libraries into shared layout/global files
- silently change public behavior outside task scope
- claim success without verifying tests/build

---

## Task Execution Rules

For every task, first determine: exact goal, allowed/forbidden files, required tests, whether this is route/feature/processor/test work, whether heavy bundle boundaries are affected. Infer conservatively from existing patterns. Do not solve ambiguity by widening the change set.

---

## Routes Rules

Route files live under `app/routes/`. Should: export `meta()`, render layout, mount a feature component. Should NOT: contain heavy processing, large utilities, validation logic, unrelated abstractions. Keep under 120 lines. Move growing logic into feature components, hooks, processors, or SEO helpers.

---

## Category Pages

When a new tool category is created (e.g. `/pdf`, `/video`, `/audio`, `/developer`), create a category listing page at the category root URL with:
- **Title**: "[Category] Tools — Free, No Upload | NoUploads" (under 60 chars)
- **Meta description**: One sentence + differentiator. 150-160 chars.
- **Keywords**, **JSON-LD** (`CollectionPage`), **Canonical URL**
- **Breadcrumbs**: Import and render `<Breadcrumbs />` from `~/components/layout/breadcrumbs`
- **Short intro**: 2-3 sentences. No fluff.
- **Tool grid**: All tools with names, descriptions, links
- **No FAQ** (FAQs belong on individual tool pages)
- **Sitemap**: Add to `react-router.config.ts` prerender list
- **Homepage link**: Category heading links to category page

Write unique intro copy per category. No template-swapping.

---

## SEO Rules

Every public route must include: title (<60 chars), description (150-160 chars), canonical URL, Open Graph tags. Use `buildMeta()` from `app/lib/seo/meta.ts` — it auto-generates canonical, OG, Twitter Card, and BreadcrumbList JSON-LD. Do not hand-roll metadata.

**Sitemap:** Generated from `react-router.config.ts` prerender list by `scripts/generate-sitemap.ts`. No `<priority>` or `<changefreq>` tags (Google ignores both). Uses git-based `<lastmod>` dates.

**Breadcrumbs:** Visual breadcrumbs (`app/components/layout/breadcrumbs.tsx`) render on all tool and category pages via `ToolPageLayout`. BreadcrumbList JSON-LD is auto-generated by `buildMeta()`. Both use `CATEGORY_LABELS` mapping for segment names.

**Related tools:** `ToolPageLayout` auto-renders related tools from `app/lib/related-tools.ts` based on the current URL path. Hand-curated per tool (3-5 genuinely related, workflow-adjacent tools).

**Footer:** 4-column layout (Tools, Categories, Project, Open Source) in `app/components/layout/site-footer.tsx`. Links to `/privacy`, `/self-hosting`, `/about`, GitHub, popular tools, and category pages.

---

## Tool Page Copy Requirements

### Subtitle format

"[What the tool does] — free, private, no upload required." Include primary search keywords. One line.

### About this tool section

Between tool widget and FAQ, 2-3 sentences: what it does, who it's for, privacy differentiator, one concrete detail. Write unique copy per tool — NEVER template-swap.

### FAQ section

2-4 items. Quality over quantity.

**Structure:**
1. **Authority trivia (ALWAYS first)** — genuinely interesting fact with HTTPS link to authoritative source (Wikipedia, W3C, IETF, ISO). JSX: React fragment with trivia text, plain text `Source:`, then `<a>` with source name (className="underline hover:text-foreground transition-colors", target="_blank", rel="noopener"). Question must be unique across the entire site — vary naturally. <40% word overlap with other trivia entries. Verify URL resolves.
2. **1-3 page-specific items** — answers unique to this tool. Must pass the swap test: if substituting another format name still reads correctly, it's boilerplate — rewrite.

**Banned FAQ topics** (site-wide, not page-specific): "Why NoUploads?", privacy/safety, offline, generic batch, "What is [FORMAT]?", "How do I [action]?", "Is this free?", browser support.

**No duplicate questions across the site.** Differentiate by including format/tool context.

**FAQPage JSON-LD (MANDATORY):** Pass plain-text FAQ data to `buildMeta()` via `faq` property — `{ question: string; answer: string }[]`, no JSX/HTML. Questions must match on-page `faqItems`. Every tool page must include this.

### Outbound link policy

- Authority links (Wikipedia, W3C, IETF, ISO, official pages): `rel="noopener"` only (no `noreferrer`).
- Untrusted/affiliate: `rel="noopener noreferrer nofollow"`.
- All external: `target="_blank"`.

### Meta tags

Export via `buildMeta()`: title under 60 chars with a relevant modifier ("Instant", "No Limits", "No Signup"). Description 150-160 chars, unique per tool. Never use "No Quality Loss" for lossy operations (any X-to-JPG, compression).

`buildMeta()` auto-generates: canonical URL, OG tags, Twitter Card tags, BreadcrumbList JSON-LD (from path), WebApplication JSON-LD (when `jsonLdName` provided), FAQPage JSON-LD (when `faq` provided).

### Content rules

No long-form articles, listicles, keyword stuffing, duplicate copy across pages, walls of text, or marketing superlatives.

### Library attribution

Below FAQ: "Powered by [library linked to repo] · [License]" or "Processed using the browser's built-in [API linked to MDN] — no external libraries". Style: `text-xs text-muted-foreground mt-8`.

**GitHub link verification:** Check `node_modules/<lib>/package.json` `repository` field or `npm info <lib> repository.url`. NEVER guess. Verify with `curl -sL -o /dev/null -w '%{http_code}' <URL>` → must return 200. The attribution unit test enforces `repoUrl` matches package.json.

**License:** Must be valid SPDX identifier (MIT, Apache-2.0, etc.). If npm returns non-SPDX, check the repo for actual license.

### Content audience

Serves: (1) Users — clean, minimal, 2-second comprehension. (2) Search crawlers — keyword-rich for "[action] [format] online free". (3) AI crawlers — quotable descriptions.

---

## Tool Rules

Each tool: route file (meta, subtitle, about, FAQ), feature component, processor, tests, prerender config. Use shared UI patterns: ToolPageLayout, shared dropzone/file list/result state, shared error/processing/empty states.

### New tool checklist

1. **Core tool** (`packages/core/src/tools/<tool>.ts`) — register in core registry
2. **Core import** — side-effect import in `packages/core/src/index.ts`
3. **Core tests** (`packages/core/tests/<tool>.test.ts`)
4. **Processor** (`apps/web/app/features/<category>/processors/<tool>.ts`)
5. **Component** (`apps/web/app/features/<category>/components/<tool>.tsx`)
6. **Route** (`apps/web/app/routes/<category>/<tool>.tsx`) — meta, subtitle, about, FAQ
7. **Route registration** in `apps/web/app/routes.ts`
8. **Unit tests** (`apps/web/tests/unit/processors/<tool>.test.ts`)
9. **E2E tests** — TWO files:
   - `tests/e2e/<tool>.spec.ts` — static page (heading, controls, FAQ, SEO, canonical)
   - `tests/e2e/<tool>-upload.spec.ts` — happy-path (upload fixture, download, verify)
10. **Homepage entry** in `apps/web/app/lib/tools.ts` gridTools with `keywords` array
11. **Icon registry** — add to `tool-icon.tsx` iconMap if needed
12. **Prerender** — add route to `react-router.config.ts`
13. **OG image** — add to `scripts/generate-og-images.ts`, run script
14. **Category page** — add to category index quick-links
15. **Related tools** — add entry in `apps/web/app/lib/related-tools.ts` with 3-5 genuinely related tools

**Breadcrumbs** are automatic — `ToolPageLayout` renders a visual breadcrumb nav, and `buildMeta()` generates BreadcrumbList JSON-LD from the route path. No manual work needed.

**Verify:** build succeeds, prerendered HTML has static content + meta, OG image exists, icon renders, command palette indexes tool, FAQ follows rules, `buildMeta()` includes `faq` for JSON-LD.

### Bidirectional conversion rule

When creating X→Y conversion, also create Y→X (when both directions are feasible in-browser). Exception: HEIC encoding not possible in-browser. Share processor infrastructure where possible. Feasible pairs: PNG↔JPG, PNG↔WebP, JPG↔WebP, JPG↔PNG.

### Universal tools with format-specific landing pages

1. Build ONE universal component with props for default format
2. Create ONE universal page (e.g., `/image/convert`) for broad queries
3. Create format-specific landing pages for high-volume pairs (e.g., `/image/jpg-to-png`)
4. Each landing page: same component, completely unique text (title, description, about, FAQ)
5. NEVER template-swap by changing format names — Google penalizes this
6. Format-specific pages: in sitemap, NOT on homepage grid (SEO entry points only)
7. Category page can list popular pairs as quick links
8. Only create pages for pairs with real search volume

### Format-specific and universal tool parity

Format-specific and universal pages must ALWAYS have feature parity. Both use the exact same config object — format-specific tools export a config, the universal tool's `resolveConfig` selects it by MIME type. Never create format-specific options that aren't wired through the shared base component.

### Homepage and category page tile rules

ONE card per tool type (convert, compress, resize), never per format. Format-specific pages surface through: category quick-links, command palette, search engines, direct URL.

### Command palette search keywords

Every `tools.ts` entry needs a `keywords` array (indexed by Fuse.js with title/description).

**Include:** abbreviations/extensions (DCM, CR3, JXL), full format names ("JPEG XL"), related software (Photoshop, Unity, Lightroom), use cases ("CT scan", "game texture"), alternative spellings, synonyms ("optimize" for compress, "epoch" for timestamp).

**Exclude:** words already in title (searched at 2x weight), generic filler ("tool", "online", "free"), marketing terms.

**Pattern:** Think 3 user personas and what they'd type. Update keywords when modifying capabilities.

---

## Processor Rules

Processors must be: testable, explicit, isolated from routes and rendering, portable (no React/DOM globals). Must not: manipulate React state, trigger toasts/navigation, import UI components.

If a browser API is needed (Canvas), accept as injected dependency. Processors should: accept typed input (`Uint8Array`, `File`, `Blob`), return typed success/error results, handle invalid input explicitly, be deterministic.

---

## Web Worker Rules

All CPU-intensive processing (WASM, pixel manipulation, quantization, heavy libraries, >50ms operations) must run in Web Workers.

Requirements:
- Dedicated `.worker.ts` file per processor
- Main `.ts` file is thin wrapper spawning worker + returning Promise
- `AbortSignal` support — abort calls `worker.terminate()`
- Clean up abort listener on completion
- `OffscreenCanvas` + `convertToBlob()` instead of DOM canvas

Follow pattern from `avif-encode.worker.ts` / `encodeAvifInWorker()`: worker imports library + listens on `self.onmessage`; caller creates `new Worker(new URL("./foo.worker.ts", import.meta.url), { type: "module" })`; worker terminated after each use. Vite config has `worker: { format: "es" }` and `optimizeDeps.exclude` for WASM.

Unit tests: mock Worker constructor (see `tests/unit/helpers/mock-worker.ts`). E2E: workers work natively.

---

## Frontend Abort Rules ("One Job at a Time")

Every `useEffect` triggering a processor must:
1. Create `AbortController` at top
2. Pass `controller.signal` through to worker
3. Check `controller.signal.aborted` after each `await` before updating state
4. Return cleanup calling `controller.abort()`

This guarantees one in-flight operation per effect. React cleanup aborts old work before new effect starts. Wrap async logic in an IIFE `(async () => { ... })()`. Set processing state at the top, clear in both success and error paths. Coerce errors: `err instanceof Error ? err.message : "Failed"`.

**Rules:**
- Never use `useRef` counters for staleness — use `AbortController`
- Every processor config must accept optional `signal?: AbortSignal`
- Batch operations propagate signal to each worker call
- Do not swallow AbortError in processor — let it propagate to effect's catch

---

## Tool Page UX Rules (Single-File Preview)

Follow the pattern from `image-converter-tool.tsx`:

### Result label
Renders immediately on file select (doesn't wait for processing). Subtitle cross-fades between "processing" span (`{filename} — <Spinner /> Compressing...`, opacity 1→0) and "result" span (absolute positioned, opacity 0→1). Both use `transition-opacity duration-300`.

### Preview area states (mutually exclusive, checked in order)
1. **Initial load** (`converting && !hasResult`): Original at opacity-60 with "Loading preview..." overlay. If no original URL, centered spinner.
2. **Error**: Centered error icon + message.
3. **Compare slider** (`originalUrl && resultUrl`): `ImageCompareSlider`. During re-processing: slider fades to opacity-0.25, centered spinner overlay. Both `transition-opacity duration-300`.
4. **Original only** (`originalUrl`): Fallback.

**Key:** Re-processing keeps compare slider visible but dimmed (visual continuity). All transitions: `transition-opacity duration-300`. No pulse animations. Color preview boxes: `transition-none`.

---

## Heavy Dependency Rules

Heavy deps (ffmpeg.wasm, image codecs, PDF runtimes, OCR engines) must stay local to the feature that needs them. Never import in root/shared layout or broad barrel exports.

Use: route-level code split, dynamic `import()` or `fetch()`, loading state with progress for >500KB libs, Web Workers for CPU work. Users of one tool must not download another tool's engine.

---

## Dependency Rules

Do not add dependencies unless clearly necessary. Justify: what it solves, why browser APIs are insufficient, where it loads, route scope, bundle impact, prerender compatibility.

Prefer: existing deps, browser APIs, small focused libraries. Avoid: trendy abstractions, overlapping utilities, speculative deps.

**Version pinning:** Exact versions only (no `^`/`~`). Use `npm install --save-exact`. Prefer latest version unless incompatible.

---

## Testing Rules

### Test-first preference

For logic-heavy work, prefer TDD: fixtures → failing tests → minimum code → run tests → refactor.

### Two levels of testing

**Level 1: Playwright E2E** (`tests/e2e/`)
1. Navigate to tool page
2. Upload fixture from `tests/e2e/fixtures/`
3. Wait for download button
4. Click download, capture output
5. Assert: file exists, correct extension, non-zero size, valid magic bytes

Magic bytes: JPG `FF D8 FF`, PNG `89 50 4E 47`, WebP `52 49 46 46...57 45 42 50`, PDF `25 50 44 46`, GIF `47 49 46 38`.

Do NOT: compare pixels, use snapshots/screenshots, assert exact sizes.

**Level 2: Vitest unit** (`tests/unit/`)
1. Read fixture into `Uint8Array`, call processor with defaults
2. Assert: non-empty output, valid magic bytes, reasonable size range
3. Compression: output < input. Resize: dimensions match. Conversion: magic bytes match target.

Do NOT: pixel comparison, exact sizes, snapshot binary output.

### Playwright rules

Prefer: one happy path, one failure path, minimal stable selectors, real flows. Focus: upload → process → result visible → download available → invalid input handled.

### Fixtures

Real files in `tests/e2e/fixtures/`, under 200KB, CC0/public domain preferred, one per format.

### Required test coverage

For each new tool: unit tests for processor, component/integration test for primary UI where relevant, Playwright happy-path, invalid-input test, large-input guardrail test where relevant. Follow smallest existing pattern. Do not skip tests because manual testing "looks fine."

---

## Performance, Guardrails & Accessibility

For file-processing tools, consider: max file size/count, browser limits, memory risk, mobile constraints, Safari/WebKit issues. Fail gracefully or warn.

Preserve accessibility: meaningful button labels, file inputs usable without drag/drop, correct dialog focus, keyboard-reachable flows, visible error/success states.

---

## Code Style Rules

**Naming:** Use explicit names (`remove-metadata-tool.tsx`, `compress-image.ts`). Avoid vague names (`helper.ts`, `misc.ts`, `temp.ts`).

**Editing:** Preserve existing formatting/naming. Avoid unrelated import sorting, broad rewrites, moving code between layers unnecessarily. Prefer small reviewable diffs.

**Refactoring:** Only when the task requires it, existing code blocks implementation, duplication causes errors, a module is unreasonably large, or tests protect the change. No speculative cleanup or architectural experiments.

---

## Validation Rules Before Claiming Success

Run all relevant checks:
- lint: `npm run lint:fix` then `pnpm exec biome check .` (must exit 0)
- typecheck
- unit tests for changed logic (`npm test` before committing processor changes)
- **Playwright E2E** — full suite after any route/component/processor/test change (note pre-existing failures but don't count as blockers)
- production build
- for route/UI changes: dev server + curl affected pages

If any check fails, do not claim success. If checks cannot all run, state exactly which were/weren't run. No bluffing.

---

## Pre-Push Validation

Before running `git push`, you MUST pass all of the following checks locally. Do not push with `--no-verify`. Do not skip checks because they "passed earlier" or "only metadata changed."

1. **Typecheck:** `pnpm --filter @nouploads/web typecheck` (must exit 0)
2. **Lint:** `pnpm exec biome check .` (must exit 0 — warnings are OK, errors are not)
3. **Build:** `pnpm build` (must exit 0)
4. **Unit tests:** `pnpm test` (must exit 0)
5. **E2E smoke:** `pnpm --filter @nouploads/web exec playwright test tests/e2e/homepage.spec.ts tests/e2e/navigation.spec.ts tests/e2e/404.spec.ts --project=chromium` (must exit 0)

If any check fails, fix the issue before pushing. These are the same checks that the husky `pre-push` hook enforces at the git level. Running them yourself first avoids wasted round-trips.

**Critical:** When changing homepage content, hero text, tool grid, badges, or navigation structure, you MUST update the corresponding E2E tests (`homepage.spec.ts`, `navigation.spec.ts`) in the same commit.

---

## Output & Failure Recovery

**Output:** State what changed, which files, tests added/updated, checks passed, known caveats, bundle impacts. Be concise.

**Failures:** Inspect output, identify smallest likely cause, fix only relevant scope, rerun. Do not rewrite broad sections in response to one failure.

**Broad requests:** Decompose into route, component, processor, tests, metadata, prerender. Implement smallest safe sequence.

---

## Protected Areas

Be extremely cautious changing (unless explicitly asked): root app shell, route config, global styles, shared UI primitives, SEO helpers, build/test config, dependency manifests. Broad blast radius.

---

## Standard "Done" Definition

A new public tool is done only if:
- route registered in `routes.ts` with metadata (title <60 chars, description 150-160 chars, canonical, OG)
- processor exists (core + web), core tool registered in `packages/core/src/index.ts`
- unit tests (core + web processor) and E2E tests (static + upload) exist
- happy path works, invalid input handled, large input behavior defined
- prerender config updated, homepage entry added, OG image generated
- related tools entry added in `app/lib/related-tools.ts`
- category index page updated, build passes, no unrelated files changed

---

## Builder + Critic Workflow

Implementation-specific application of the Quality Process. All non-trivial implementation must use **Builder + Critic + Fact-checker** adversarial workflow. "It should work" is not proof — test output is proof.

The Builder writes code. Critic and Fact-checker (defined in Quality Process) challenge every assumption. Can operate as subagents or labeled modes (`[BUILDER]`, `[CRITIC]`, `[FACT-CHECK]`). Always include all three roles. Double-pass sanity check before sign-off.

**Role distinction:** The Critic focuses on logic, assumptions, and gaps. The Fact-checker focuses on factual accuracy and independent verification. They are not redundant. Neither writes code — they only question, challenge, and verify. They are not rubber stamps ("looks good" without evidence is invalid) but must accept hard proof.

### Critic checkpoints

**1 — Library Verification (before coding)**
- Package exists? → `npm info`. API shape? → Read actual README/source. Browser-compatible? → Check `"browser"`/`"module"` fields. Bundle size? → `npm info` unpacked size.

**2 — Implementation Review**
- Magic bytes match? → `xxd` hex dump. Decode handles test file? → Run against real file. Error handling? → Feed corrupt data. Client-side only? → Grep for `fetch(`, `XMLHttpRequest`.

**3 — Proof of Working**
- Test output with real file (real dimensions, not 0x0). Edge cases tested (animated frames, transparency, HDR). Page renders (curl in dev mode).

**4 — Sign-off (all three must agree)**
- [ ] Library exists/installs (or custom parser justified)
- [ ] Handles real/synthetic test file with valid output
- [ ] Edge cases tested, not just acknowledged
- [ ] User-friendly error on corrupt input
- [ ] No network requests during processing
- [ ] Page renders, tests pass, FAQ follows rules

**Escalation:** If Builder and Critic can't agree after 3 rounds, document disagreement and move on.
