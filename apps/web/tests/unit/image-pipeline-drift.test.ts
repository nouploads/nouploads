/**
 * Drift-prevention test for the image-pipeline worker.
 *
 * When someone adds a new `category: "image"` tool to @nouploads/core,
 * this test forces them to make a conscious choice:
 *   (a) wire it into the pipeline worker (add a loader in
 *       apps/web/app/features/image-tools/workers/image-pipeline-tools.ts
 *       so the web UI can call it), or
 *   (b) add the ID to IMAGE_TOOLS_NOT_IN_PIPELINE below with a short
 *       reason — typically "browser-only stub", "covered by
 *       convert-image's main-thread decoder path", or "factory-generated
 *       format-pair tool, served by convert-image".
 *
 * It also catches orphan loaders — pipeline IDs that no longer map to a
 * registered core tool (stale after a core rename, say).
 */
import { loadAllTools } from "@nouploads/core/load-all-tools";
import { beforeAll, describe, expect, it } from "vitest";
import { IMAGE_PIPELINE_TOOL_IDS } from "~/features/image-tools/workers/image-pipeline-tools";

/**
 * Image tools that legitimately do NOT go through the pipeline worker.
 * Each entry must have a one-line reason so reviewers understand why
 * the ID is exempt.
 */
const IMAGE_TOOLS_NOT_IN_PIPELINE: Record<string, string> = {
	// Browser-only stubs — their real implementation stays on the main
	// thread (heic2any, gifsicle-wasm-browser, @imgly/background-removal,
	// pdfjs-dist, canvas rasterization). The web adapter calls them
	// directly; the core tool's execute() throws in Node.
	"heic-to-jpg": "heic2any on main thread; pipeline cannot decode HEIC",
	"heic-to-png": "heic2any on main thread; pipeline cannot decode HEIC",
	"heic-to-webp": "heic2any on main thread; pipeline cannot decode HEIC",
	"compress-gif": "gifsicle-wasm-browser; browser-only",
	"parse-gif-frames": "gifuct-js + canvas compositing; browser-only",
	"remove-background": "@imgly/background-removal; browser-only ML",
	"convert-vector": "SVG -> raster via <img> + canvas; browser-only",
	"exif-view": "read-only metadata read via exifr on main thread",
	"exif-strip": "already handled by strip-metadata pipeline entry",
	// Universal convert-image handles these via 50+ exotic decoders on
	// the main thread. Adding them to the pipeline would duplicate the
	// decoder chain.
	"png-to-jpg": "served by apps/web convert-image (universal)",
	"png-to-webp": "served by apps/web convert-image (universal)",
	"jpg-to-png": "served by apps/web convert-image (universal)",
	"jpg-to-webp": "served by apps/web convert-image (universal)",
	"webp-to-jpg": "served by apps/web convert-image (universal)",
	"webp-to-png": "served by apps/web convert-image (universal)",
	"avif-to-jpg": "served by apps/web convert-image (universal)",
	"avif-to-png": "served by apps/web convert-image (universal)",
	"gif-to-jpg": "served by apps/web convert-image (universal)",
	"gif-to-png": "served by apps/web convert-image (universal)",
	"bmp-to-jpg": "served by apps/web convert-image (universal)",
	"bmp-to-png": "served by apps/web convert-image (universal)",
	"bmp-to-webp": "served by apps/web convert-image (universal)",
	"svg-to-png": "served by apps/web convert-image (universal)",
	"svg-to-jpg": "served by apps/web convert-image (universal)",
	"svg-to-webp": "served by apps/web convert-image (universal)",
	"ico-to-png": "served by apps/web convert-image (universal)",
	"ico-to-jpg": "served by apps/web convert-image (universal)",
	"ico-to-webp": "served by apps/web convert-image (universal)",
	"tiff-to-jpg": "served by apps/web convert-image (exotic decoder)",
	"tiff-to-png": "served by apps/web convert-image (exotic decoder)",
	"psd-to-jpg": "served by apps/web convert-image (exotic decoder)",
	"psd-to-png": "served by apps/web convert-image (exotic decoder)",
	"psb-to-jpg": "served by apps/web convert-image (exotic decoder)",
	"psb-to-png": "served by apps/web convert-image (exotic decoder)",
	"hdr-to-jpg": "served by apps/web convert-image (exotic decoder)",
	"hdr-to-png": "served by apps/web convert-image (exotic decoder)",
	"tga-to-jpg": "served by apps/web convert-image (exotic decoder)",
	"tga-to-png": "served by apps/web convert-image (exotic decoder)",
	"exr-to-jpg": "served by apps/web convert-image (exotic decoder)",
	"exr-to-png": "served by apps/web convert-image (exotic decoder)",
	"dds-to-jpg": "served by apps/web convert-image (exotic decoder)",
	"dds-to-png": "served by apps/web convert-image (exotic decoder)",
	"pcx-to-jpg": "served by apps/web convert-image (exotic decoder)",
	"pcx-to-png": "served by apps/web convert-image (exotic decoder)",
	"netpbm-to-jpg": "served by apps/web convert-image (exotic decoder)",
	"netpbm-to-png": "served by apps/web convert-image (exotic decoder)",
	"sgi-to-jpg": "served by apps/web convert-image (exotic decoder)",
	"sgi-to-png": "served by apps/web convert-image (exotic decoder)",
	"ras-to-jpg": "served by apps/web convert-image (exotic decoder)",
	"ras-to-png": "served by apps/web convert-image (exotic decoder)",
	"wbmp-to-png": "served by apps/web convert-image (exotic decoder)",
	"xbm-to-png": "served by apps/web convert-image (exotic decoder)",
	"xpm-to-png": "served by apps/web convert-image (exotic decoder)",
	"xwd-to-png": "served by apps/web convert-image (exotic decoder)",
	"fits-to-jpg": "served by apps/web convert-image (exotic decoder)",
	"fits-to-png": "served by apps/web convert-image (exotic decoder)",
	"xcf-to-jpg": "served by apps/web convert-image (exotic decoder)",
	"xcf-to-png": "served by apps/web convert-image (exotic decoder)",
	"icns-to-png": "served by apps/web convert-image (exotic decoder)",
	"pict-to-png": "served by apps/web convert-image (exotic decoder)",
	// SVG minifier — text-in, text-out, pure JS, sync; no pipeline needed.
	"optimize-svg": "SVG minifier; main-thread svgo",
};

describe("image-pipeline worker ↔ core registry drift", () => {
	beforeAll(async () => {
		await loadAllTools();
	});

	it("every image-category core tool is either pipeline-handled or explicitly exempt", async () => {
		const { getAllTools } = await import("@nouploads/core");
		const pipelineIds = new Set(IMAGE_PIPELINE_TOOL_IDS);
		const exemptIds = new Set(Object.keys(IMAGE_TOOLS_NOT_IN_PIPELINE));

		const imageTools = getAllTools().filter((t) => t.category === "image");
		const unhandled: string[] = [];
		for (const tool of imageTools) {
			if (pipelineIds.has(tool.id)) continue;
			if (exemptIds.has(tool.id)) continue;
			unhandled.push(tool.id);
		}

		expect(
			unhandled,
			"These image tools are in @nouploads/core but neither wired into the pipeline worker nor documented as exempt. Either add a loader in apps/web/app/features/image-tools/workers/image-pipeline-tools.ts or add the ID to IMAGE_TOOLS_NOT_IN_PIPELINE here.",
		).toEqual([]);
	});

	it("every pipeline loader corresponds to a registered core image tool", async () => {
		const { getAllTools } = await import("@nouploads/core");
		const registered = new Map(
			getAllTools().map((t) => [t.id, t.category] as const),
		);

		const orphans: Array<{ id: string; reason: string }> = [];
		for (const id of IMAGE_PIPELINE_TOOL_IDS) {
			const cat = registered.get(id);
			if (cat === undefined) {
				orphans.push({ id, reason: "not in core registry" });
			} else if (cat !== "image") {
				orphans.push({ id, reason: `category is "${cat}", not "image"` });
			}
		}

		expect(
			orphans,
			"These pipeline loaders no longer map to a registered image tool. Remove them from image-pipeline-tools.ts.",
		).toEqual([]);
	});

	it("exempt list has no stale entries", async () => {
		const { getAllTools } = await import("@nouploads/core");
		const registered = new Set(getAllTools().map((t) => t.id));

		const stale: string[] = [];
		for (const id of Object.keys(IMAGE_TOOLS_NOT_IN_PIPELINE)) {
			if (!registered.has(id)) stale.push(id);
		}

		expect(
			stale,
			"Remove these stale entries from IMAGE_TOOLS_NOT_IN_PIPELINE — they are no longer in the core registry.",
		).toEqual([]);
	});
});
