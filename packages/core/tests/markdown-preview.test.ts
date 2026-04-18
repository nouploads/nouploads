import { describe, expect, it } from "vitest";
import { getAllTools, getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/markdown-preview.js";

describe("markdown-preview tool", () => {
	it("should be registered", () => {
		const tool = getTool("markdown-preview");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
	});

	it("should have correct metadata", () => {
		const tool = getTool("markdown-preview");
		expect(tool?.name).toBe("Markdown Preview");
		expect(tool?.inputMimeTypes).toContain("text/markdown");
		expect(tool?.inputMimeTypes).toContain("text/plain");
		expect(tool?.inputExtensions).toContain(".md");
		expect(tool?.inputExtensions).toContain(".txt");
		expect(tool?.inputExtensions).toContain(".markdown");
	});

	it("should have gfm option", () => {
		const tool = getTool("markdown-preview");
		const gfmOption = tool?.options.find((o) => o.name === "gfm");
		expect(gfmOption).toBeDefined();
		expect(gfmOption?.type).toBe("boolean");
		expect(gfmOption?.default).toBe(true);
	});

	it("should render markdown to HTML", async () => {
		const tool = getTool("markdown-preview");
		if (!tool) throw new Error("tool not registered");
		const input = new TextEncoder().encode(
			"# Hello\n\nThis is **bold** text.",
		);
		const result = await tool.execute(input, {}, {});
		if ("outputs" in result) throw new Error("unexpected multi result");
		const html = new TextDecoder().decode(result.output);
		expect(html).toContain("<h1>");
		expect(html).toContain("Hello");
		expect(html).toContain("<strong>");
	});

	it("should appear in all tools list", () => {
		const ids = getAllTools().map((t) => t.id);
		expect(ids).toContain("markdown-preview");
	});
});
