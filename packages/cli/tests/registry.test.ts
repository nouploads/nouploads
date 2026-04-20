import { findToolByFormats, getAllTools, getTool } from "@nouploads/core";
import { loadAllTools } from "@nouploads/core/load-all-tools";
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(async () => {
	await loadAllTools();
});

describe("tool registry", () => {
	it("should have 80+ registered tools", () => {
		const tools = getAllTools();
		expect(tools.length).toBeGreaterThanOrEqual(80);
	});

	// Verify each of the 10 new tools is registered
	const newToolIds = [
		"split-pdf",
		"rotate-pdf",
		"pdf-to-text",
		"watermark-pdf",
		"rotate-image",
		"favicon-generator",
		"watermark-image",
		"json-formatter",
		"hash-generator",
		"jwt-decoder",
	];

	for (const id of newToolIds) {
		it(`should have tool: ${id}`, () => {
			const tool = getTool(id);
			expect(tool).toBeDefined();
			expect(tool?.id).toBe(id);
		});
	}

	// Format pair lookup for known conversions
	it("should find heic-to-jpg by format pair", () => {
		const tool = findToolByFormats("heic", "jpg");
		expect(tool).toBeDefined();
		expect(tool?.id).toBe("heic-to-jpg");
	});

	it("should find png-to-jpg by format pair", () => {
		const tool = findToolByFormats("png", "jpg");
		expect(tool).toBeDefined();
	});

	// Verify categories for the new tools
	it("should have tools in all expected categories", () => {
		const tools = getAllTools();
		const categories = new Set(tools.map((t) => t.category));
		expect(categories).toContain("image");
		expect(categories).toContain("pdf");
		expect(categories).toContain("developer");
	});

	it("should have pdf-category tools from the new batch", () => {
		const pdfToolIds = [
			"split-pdf",
			"rotate-pdf",
			"pdf-to-text",
			"watermark-pdf",
		];
		for (const id of pdfToolIds) {
			const tool = getTool(id);
			expect(tool).toBeDefined();
			expect(tool?.category).toBe("pdf");
		}
	});

	it("should have developer-category tools from the new batch", () => {
		const devToolIds = ["json-formatter", "hash-generator", "jwt-decoder"];
		for (const id of devToolIds) {
			const tool = getTool(id);
			expect(tool).toBeDefined();
			expect(tool?.category).toBe("developer");
		}
	});

	// Verify browser-only tools have the capability marker
	it("should mark pdf-to-text as browser-only", () => {
		const tool = getTool("pdf-to-text");
		expect(tool?.capabilities).toContain("browser");
	});

	it("should mark watermark-image as browser-only", () => {
		const tool = getTool("watermark-image");
		expect(tool?.capabilities).toContain("browser");
	});

	// Verify non-browser tools do NOT have the browser capability
	it("should not mark split-pdf as browser-only", () => {
		const tool = getTool("split-pdf");
		expect(tool?.capabilities?.includes("browser")).not.toBe(true);
	});

	it("should not mark json-formatter as browser-only", () => {
		const tool = getTool("json-formatter");
		expect(tool?.capabilities?.includes("browser")).not.toBe(true);
	});
});
