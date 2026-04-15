import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/html-formatter.js";

describe("html-formatter tool", () => {
	it("should be registered", () => {
		const tool = getTool("html-formatter");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
		expect(tool?.id).toBe("html-formatter");
	});

	it("should beautify a collapsed HTML document", async () => {
		const tool = getTool("html-formatter");
		if (!tool) throw new Error("html-formatter not registered");

		const input =
			"<html><head><title>T</title></head><body><div><p>Hi</p></div></body></html>";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, {}, {});

		expect(result.extension).toBe(".html");
		expect(result.mimeType).toBe("text/html");

		const output = new TextDecoder().decode(result.output);
		expect(output).toContain("\n");
		expect(output).toContain("<html>");
		expect(output).toContain("<body>");
		// Default indent is 2 spaces — nested elements should be indented
		expect(output).toMatch(/\n {2,}<(head|body|div|p|title)/);
	});

	it("should respect indentSize", async () => {
		const tool = getTool("html-formatter");
		if (!tool) throw new Error("html-formatter not registered");

		const input = "<div><p>Hi</p></div>";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, { indentSize: 4 }, {});

		const output = new TextDecoder().decode(result.output);
		expect(output).toMatch(/\n {4}<p>/);
	});

	it("should use tab indent when indentChar is tab", async () => {
		const tool = getTool("html-formatter");
		if (!tool) throw new Error("html-formatter not registered");

		const input = "<div><p>Hi</p></div>";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(
			encoded,
			{ indentChar: "tab", indentSize: 1 },
			{},
		);

		const output = new TextDecoder().decode(result.output);
		expect(output).toMatch(/\n\t<p>/);
	});

	it("should end output with a newline", async () => {
		const tool = getTool("html-formatter");
		if (!tool) throw new Error("html-formatter not registered");

		const input = "<p>Hi</p>";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, {}, {});

		const output = new TextDecoder().decode(result.output);
		expect(output.endsWith("\n")).toBe(true);
	});

	it("should handle HTML fragments without full document structure", async () => {
		const tool = getTool("html-formatter");
		if (!tool) throw new Error("html-formatter not registered");

		const input = '<ul><li>a</li><li>b</li><li class="active">c</li></ul>';
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, {}, {});

		const output = new TextDecoder().decode(result.output);
		expect(output).toContain("<ul>");
		expect(output).toContain("<li>a</li>");
		expect(output).toContain('class="active"');
	});

	it("should preserve <!DOCTYPE html> preamble", async () => {
		const tool = getTool("html-formatter");
		if (!tool) throw new Error("html-formatter not registered");

		const input = "<!DOCTYPE html><html><body><p>Hi</p></body></html>";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, {}, {});

		const output = new TextDecoder().decode(result.output);
		expect(output).toMatch(/^<!DOCTYPE html>/i);
	});

	it("should produce empty output for empty input", async () => {
		const tool = getTool("html-formatter");
		if (!tool) throw new Error("html-formatter not registered");

		const encoded = new TextEncoder().encode("");
		const result = await tool.execute(encoded, {}, {});

		const output = new TextDecoder().decode(result.output);
		expect(output.trim()).toBe("");
	});
});
