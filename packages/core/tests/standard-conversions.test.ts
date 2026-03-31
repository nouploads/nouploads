import { describe, expect, it } from "vitest";
import { findToolByFormats, getAllTools } from "../src/registry.js";

// Import to trigger all registrations
import "../src/tools/heic-to-jpg.js";
import "../src/tools/standard-conversions.js";
import "../src/tools/exotic-conversions.js";

const EXPECTED_CONVERSIONS = [
	["heic", "jpg"],
	["png", "jpg"],
	["png", "webp"],
	["jpg", "png"],
	["jpg", "webp"],
	["webp", "jpg"],
	["webp", "png"],
	["avif", "jpg"],
	["avif", "png"],
	["gif", "jpg"],
	["gif", "png"],
	["bmp", "jpg"],
	["bmp", "png"],
	["bmp", "webp"],
	["svg", "png"],
	["svg", "jpg"],
	["svg", "webp"],
	["tiff", "jpg"],
	["tiff", "png"],
	["ico", "png"],
	["ico", "jpg"],
	["ico", "webp"],
] as const;

describe("standard conversion tools", () => {
	it("should register all expected conversion tools", () => {
		for (const [from, to] of EXPECTED_CONVERSIONS) {
			const tool = findToolByFormats(from, to);
			expect(tool, `${from}-to-${to} should be registered`).toBeDefined();
			expect(tool?.id).toBe(`${from}-to-${to}`);
		}
	});

	it("should have at least 20 tools registered", () => {
		expect(getAllTools().length).toBeGreaterThanOrEqual(20);
	});

	it("should have correct input MIME types for each format", () => {
		const pngToJpg = findToolByFormats("png", "jpg");
		expect(pngToJpg?.inputMimeTypes).toContain("image/png");

		const jpgToPng = findToolByFormats("jpg", "png");
		expect(jpgToPng?.inputMimeTypes).toContain("image/jpeg");

		const webpToJpg = findToolByFormats("webp", "jpg");
		expect(webpToJpg?.inputMimeTypes).toContain("image/webp");

		const svgToPng = findToolByFormats("svg", "png");
		expect(svgToPng?.inputMimeTypes).toContain("image/svg+xml");
	});

	it("should have quality option only for lossy output formats", () => {
		const toJpg = findToolByFormats("png", "jpg");
		expect(toJpg?.options.find((o) => o.name === "quality")).toBeDefined();

		const toWebp = findToolByFormats("png", "webp");
		expect(toWebp?.options.find((o) => o.name === "quality")).toBeDefined();

		const toPng = findToolByFormats("jpg", "png");
		expect(toPng?.options.find((o) => o.name === "quality")).toBeUndefined();
	});

	it("should have category 'image' for all tools", () => {
		for (const tool of getAllTools()) {
			expect(tool.category).toBe("image");
		}
	});
});
