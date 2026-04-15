import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/js-formatter.js";

describe("js-formatter tool", () => {
	it("should be registered", () => {
		const tool = getTool("js-formatter");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
		expect(tool?.id).toBe("js-formatter");
	});

	it("should beautify a single-line function", async () => {
		const tool = getTool("js-formatter");
		if (!tool) throw new Error("js-formatter not registered");

		const input = "function greet(name){return 'hello '+name}";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, {}, {});

		expect(result.extension).toBe(".js");
		expect(result.mimeType).toBe("application/javascript");

		const output = new TextDecoder().decode(result.output);
		expect(output).toContain("function greet(name)");
		expect(output).toContain("return");
		expect(output).toContain("\n");
	});

	it("should respect indentSize", async () => {
		const tool = getTool("js-formatter");
		if (!tool) throw new Error("js-formatter not registered");

		const input = "if(x){doIt()}";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, { indentSize: 4 }, {});

		const output = new TextDecoder().decode(result.output);
		expect(output).toMatch(/\n {4}doIt/);
	});

	it("should use tab indent when indentChar is tab", async () => {
		const tool = getTool("js-formatter");
		if (!tool) throw new Error("js-formatter not registered");

		const input = "if(x){doIt()}";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(
			encoded,
			{ indentChar: "tab", indentSize: 1 },
			{},
		);

		const output = new TextDecoder().decode(result.output);
		expect(output).toMatch(/\n\tdoIt/);
	});

	it("should place opening brace on next line when braceStyle is expand", async () => {
		const tool = getTool("js-formatter");
		if (!tool) throw new Error("js-formatter not registered");

		const input = "function f(){return 1}";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, { braceStyle: "expand" }, {});

		const output = new TextDecoder().decode(result.output);
		// Expand style: `function f()\n{\n  return 1;\n}`
		expect(output).toMatch(/function f\(\)\s*\n\s*\{/);
	});

	it("should end output with a newline", async () => {
		const tool = getTool("js-formatter");
		if (!tool) throw new Error("js-formatter not registered");

		const input = "const x=1";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, {}, {});

		const output = new TextDecoder().decode(result.output);
		expect(output.endsWith("\n")).toBe(true);
	});

	it("should handle arrow functions and template literals", async () => {
		const tool = getTool("js-formatter");
		if (!tool) throw new Error("js-formatter not registered");

		// biome-ignore lint/suspicious/noTemplateCurlyInString: testing template literal string form
		const expr = "hello ${n}";
		const input = `const g=(n)=>\`${expr}\`;const r=g('world');`;
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, {}, {});

		const output = new TextDecoder().decode(result.output);
		expect(output).toContain("const g = (n) =>");
		expect(output).toContain(`\`${expr}\``);
	});

	it("should preserve strings verbatim", async () => {
		const tool = getTool("js-formatter");
		if (!tool) throw new Error("js-formatter not registered");

		const input = "const s='a   b   c';const t=\"x  y\";";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, {}, {});

		const output = new TextDecoder().decode(result.output);
		expect(output).toContain("'a   b   c'");
		expect(output).toContain('"x  y"');
	});

	it("should produce empty output for empty input", async () => {
		const tool = getTool("js-formatter");
		if (!tool) throw new Error("js-formatter not registered");

		const encoded = new TextEncoder().encode("");
		const result = await tool.execute(encoded, {}, {});

		const output = new TextDecoder().decode(result.output);
		expect(output.trim()).toBe("");
	});
});
