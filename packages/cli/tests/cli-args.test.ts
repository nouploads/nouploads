import { describe, expect, it } from "vitest";
import { findToolByFormats, getAllTools, getTool } from "@nouploads/core";

describe("CLI tool resolution", () => {
	it("should resolve tool by ID for existing tools", () => {
		expect(getTool("merge-pdf")).toBeDefined();
		expect(getTool("optimize-svg")).toBeDefined();
	});

	it("should resolve new tools by ID", () => {
		expect(getTool("split-pdf")).toBeDefined();
		expect(getTool("rotate-pdf")).toBeDefined();
		expect(getTool("watermark-pdf")).toBeDefined();
		expect(getTool("rotate-image")).toBeDefined();
		expect(getTool("favicon-generator")).toBeDefined();
		expect(getTool("json-formatter")).toBeDefined();
		expect(getTool("jwt-decoder")).toBeDefined();
	});

	it("should resolve tool by format pair", () => {
		expect(findToolByFormats("heic", "jpg")).toBeDefined();
		expect(findToolByFormats("png", "jpg")).toBeDefined();
		expect(findToolByFormats("jpg", "webp")).toBeDefined();
	});

	it("should return undefined for nonexistent tool ID", () => {
		expect(getTool("nonexistent-tool")).toBeUndefined();
	});

	it("should return undefined for nonexistent format pair", () => {
		expect(findToolByFormats("abc", "xyz")).toBeUndefined();
	});

	it("should filter out browser-only tools for CLI mode", () => {
		const cliTools = getAllTools().filter(
			(t) => !t.capabilities?.includes("browser"),
		);
		expect(cliTools.length).toBeGreaterThan(0);
		// All CLI-compatible tools should have an execute function
		for (const tool of cliTools) {
			expect(typeof tool.execute).toBe("function");
		}
	});

	it("should have browser-only tools excluded from CLI-eligible set", () => {
		const allTools = getAllTools();
		const cliTools = allTools.filter(
			(t) => !t.capabilities?.includes("browser"),
		);
		// There should be fewer CLI tools than total tools
		expect(cliTools.length).toBeLessThan(allTools.length);
	});

	it("should have options arrays on all tools", () => {
		const tools = getAllTools();
		for (const tool of tools) {
			expect(Array.isArray(tool.options)).toBe(true);
		}
	});
});
