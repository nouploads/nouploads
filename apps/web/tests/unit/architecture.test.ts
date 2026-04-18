import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEATURES_DIR = path.resolve(__dirname, "../../app/features");

/**
 * Snapshot of web processors that DO NOT YET delegate to @nouploads/core, taken
 * 2026-04-17 right after Phase 0 of the single-source-of-truth migration. Each
 * entry is grandfathered: the architecture test ignores it. Migrating a tool
 * means removing it from this set in the same PR. Adding a NEW processor file
 * that doesn't delegate to core fails the test below.
 *
 * The set should only ever shrink. See MIGRATION_TRACKER.md for context.
 */
const CORE_DELEGATION_EXEMPT = new Set<string>([
	// pdf-tools (7) — Phase 2 + Phase 5
	"pdf-tools/processors/compress-pdf.ts",
	"pdf-tools/processors/pdf-to-image.ts",
	"pdf-tools/processors/pdf-to-text.ts",

	// vector-tools (1) — Phase 5
	"vector-tools/processors/convert-vector.ts",

	// developer-tools (22) — Phase 3
	"developer-tools/processors/case-converter.ts",
	"developer-tools/processors/color-picker.ts",
	"developer-tools/processors/cron-parser.ts",
	"developer-tools/processors/css-formatter.ts",
	"developer-tools/processors/hash-generator.ts",
	"developer-tools/processors/html-formatter.ts",
	"developer-tools/processors/js-formatter.ts",
	"developer-tools/processors/json-csv.ts",
	"developer-tools/processors/json-formatter.ts",
	"developer-tools/processors/jwt-decoder.ts",
	"developer-tools/processors/lorem-ipsum.ts",
	"developer-tools/processors/markdown-preview.ts",
	"developer-tools/processors/qr-code.ts",
	"developer-tools/processors/regex-tester.ts",
	"developer-tools/processors/sql-formatter.ts",
	"developer-tools/processors/text-diff.ts",
	"developer-tools/processors/timestamp-converter.ts",
	"developer-tools/processors/url-encoder.ts",
	"developer-tools/processors/uuid-generator.ts",
	"developer-tools/processors/word-counter.ts",
	"developer-tools/processors/xml-json.ts",
	"developer-tools/processors/yaml-json.ts",

	// image-tools (19) — Phase 4 + Phase 5
	"image-tools/processors/color-palette.ts",
	"image-tools/processors/compress-gif.ts",
	"image-tools/processors/compress-image.ts",
	"image-tools/processors/compress-png.ts",
	"image-tools/processors/convert-image.ts",
	"image-tools/processors/crop-image.ts",
	"image-tools/processors/exif-metadata.ts",
	"image-tools/processors/favicon-generator.ts",
	"image-tools/processors/heic-to-jpg.ts",
	"image-tools/processors/heic-to-png.ts",
	"image-tools/processors/heic-to-webp.ts",
	"image-tools/processors/image-filters.ts",
	"image-tools/processors/image-to-pdf.ts",
	"image-tools/processors/parse-gif-frames.ts",
	"image-tools/processors/remove-background.ts",
	"image-tools/processors/resize-image.ts",
	"image-tools/processors/rotate-image.ts",
	"image-tools/processors/strip-metadata.ts",
	"image-tools/processors/watermark-image.ts",
]);

function findProcessorFiles(): string[] {
	const result: string[] = [];
	for (const category of readdirSync(FEATURES_DIR)) {
		const procDir = path.join(FEATURES_DIR, category, "processors");
		const stat = statSync(procDir, { throwIfNoEntry: false });
		if (!stat?.isDirectory()) continue;
		for (const file of readdirSync(procDir)) {
			if (!file.endsWith(".ts") || file.endsWith(".worker.ts")) continue;
			result.push(`${category}/processors/${file}`);
		}
	}
	return result.sort();
}

describe("Architecture: web processors must delegate to @nouploads/core", () => {
	const processors = findProcessorFiles();

	it("snapshot has at least 55 primary processors (catches accidental loss)", () => {
		expect(processors.length).toBeGreaterThanOrEqual(55);
	});

	it("every processor either delegates to core or is in the exempt grandfather list", () => {
		const violations: string[] = [];
		for (const relPath of processors) {
			if (CORE_DELEGATION_EXEMPT.has(relPath)) continue;
			const src = readFileSync(path.join(FEATURES_DIR, relPath), "utf8");
			if (!/from\s+["']@nouploads\/core["']/.test(src)) {
				violations.push(relPath);
			}
		}
		expect(
			violations,
			`These processors don't import @nouploads/core. Either add the delegation to core (preferred) or — only with strong justification, see MIGRATION_TRACKER.md — add the path to CORE_DELEGATION_EXEMPT in apps/web/tests/unit/architecture.test.ts:`,
		).toEqual([]);
	});

	it("exempt list contains no stale entries (i.e. no longer-forked files still listed)", () => {
		const stillForked = new Set(processors);
		const stale: string[] = [];
		for (const exempt of CORE_DELEGATION_EXEMPT) {
			if (!stillForked.has(exempt)) {
				stale.push(exempt);
			} else {
				const src = readFileSync(path.join(FEATURES_DIR, exempt), "utf8");
				if (/from\s+["']@nouploads\/core["']/.test(src)) {
					stale.push(`${exempt} (now delegates — remove from exempt list)`);
				}
			}
		}
		expect(
			stale,
			"Remove these stale entries from CORE_DELEGATION_EXEMPT:",
		).toEqual([]);
	});
});
