import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/css-formatter.js";

describe("css-formatter tool", () => {
	it("should be registered", () => {
		const tool = getTool("css-formatter");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
		expect(tool?.id).toBe("css-formatter");
	});

	it("should minify CSS by stripping comments and whitespace", async () => {
		const tool = getTool("css-formatter");
		if (!tool) throw new Error("css-formatter not registered");

		const input = `body {
  /* primary color */
  color: red;
  margin: 0;
}`;
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, { mode: "minify" }, {});

		expect(result.extension).toBe(".css");
		expect(result.mimeType).toBe("text/css");

		const output = new TextDecoder().decode(result.output);
		expect(output).not.toContain("/*");
		expect(output).not.toContain("primary color");
		expect(output).not.toContain("\n");
		expect(output).toContain("body{");
		expect(output).toContain("color:red");
	});

	it("should beautify minified CSS with proper indentation", async () => {
		const tool = getTool("css-formatter");
		if (!tool) throw new Error("css-formatter not registered");

		const input = "body{color:red;margin:0}";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, { mode: "beautify" }, {});

		const output = new TextDecoder().decode(result.output);
		expect(output).toContain("\n");
		expect(output).toContain("  color: red;");
		expect(output).toContain("  margin: 0");
	});

	it("should default to beautify mode", async () => {
		const tool = getTool("css-formatter");
		if (!tool) throw new Error("css-formatter not registered");

		const input = "a{color:blue}";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, {}, {});

		const output = new TextDecoder().decode(result.output);
		expect(output).toContain("\n");
		expect(output).toContain("  color: blue");
	});
});
