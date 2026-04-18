/**
 * Eager registration of every tool in the registry.
 *
 * Consumers who need the full registry (CLI's `--list`,
 * `findToolByFormats`, etc.) should await `loadAllTools()` once at startup:
 *
 *   import { loadAllTools } from "@nouploads/core/load-all-tools";
 *   await loadAllTools();
 *
 * Consumers who only need specific tools should instead import
 * `@nouploads/core/tools/<id>` directly — that triggers only that tool's
 * registration and is tree-shake friendly (the module is imported for
 * its side effect: a top-level `registerTool(tool)` call).
 *
 * Implementation note: we use DYNAMIC imports (`await import(...)`).
 * Dynamic imports are runtime-evaluated; esbuild/tsup cannot DCE them
 * regardless of the package.json sideEffects field. With static
 * `import "./tools/X.js"` statements, esbuild aggressively tree-shakes
 * even when the sideEffects field flags the target as side-effectful —
 * this behavior has historically been unreliable. Dynamic imports sidestep
 * the issue entirely.
 */

export async function loadAllTools(): Promise<void> {
	await Promise.all([
		// IMAGE CONVERSION
		import("./tools/heic-to-jpg.js"),
		import("./tools/heic-to-png.js"),
		import("./tools/heic-to-webp.js"),
		import("./tools/standard-conversions.js"),
		// EXOTIC FORMAT CONVERSIONS
		import("./tools/exotic-conversions.js"),
		// IMAGE MANIPULATION
		import("./tools/compress-image.js"),
		import("./tools/resize-image.js"),
		import("./tools/crop-image.js"),
		import("./tools/rotate-image.js"),
		import("./tools/watermark-image.js"),
		// METADATA
		import("./tools/exif.js"),
		import("./tools/strip-metadata.js"),
		import("./tools/images-to-pdf.js"),
		// BROWSER-ONLY STUBS (aggregator — registers several browser-only tools)
		import("./tools/browser-only-stubs.js"),
		// UTILITY + PDF + DEVELOPER TOOLS
		import("./tools/optimize-svg.js"),
		import("./tools/merge-pdf.js"),
		import("./tools/watermark-pdf.js"),
		import("./tools/pdf-to-text.js"),
		import("./tools/rotate-pdf.js"),
		import("./tools/split-pdf.js"),
		import("./tools/reorder-pdf.js"),
		import("./tools/qr-code.js"),
		import("./tools/base64.js"),
		import("./tools/favicon-generator.js"),
		import("./tools/hash-generator.js"),
		import("./tools/json-formatter.js"),
		import("./tools/jwt-decoder.js"),
		import("./tools/page-numbers-pdf.js"),
		import("./tools/protect-pdf.js"),
		import("./tools/unlock-pdf.js"),
		import("./tools/image-filters.js"),
		import("./tools/regex-tester.js"),
		import("./tools/timestamp-converter.js"),
		import("./tools/uuid-generator.js"),
		import("./tools/url-encoder.js"),
		import("./tools/text-diff.js"),
		import("./tools/markdown-preview.js"),
		import("./tools/word-counter.js"),
		import("./tools/css-formatter.js"),
		import("./tools/color-palette.js"),
		import("./tools/color-picker.js"),
		import("./tools/json-csv.js"),
		import("./tools/case-converter.js"),
		import("./tools/yaml-json.js"),
		import("./tools/cron-parser.js"),
		import("./tools/lorem-ipsum.js"),
		import("./tools/sql-formatter.js"),
		import("./tools/html-formatter.js"),
		import("./tools/js-formatter.js"),
		import("./tools/xml-json.js"),
	]);
}
