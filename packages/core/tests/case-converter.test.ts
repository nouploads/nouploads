import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/case-converter.js";

function getToolOrThrow() {
	const tool = getTool("case-converter");
	if (!tool) throw new Error("case-converter not registered");
	return tool;
}

describe("case-converter tool", () => {
	it("should be registered", () => {
		const tool = getTool("case-converter");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
	});

	it("should default to camelCase", async () => {
		const tool = getToolOrThrow();
		const input = new TextEncoder().encode("hello world example");
		const result = await tool.execute(input, {}, {});
		const text = new TextDecoder().decode(result.output);
		expect(text).toBe("helloWorldExample");
		expect(result.extension).toBe(".txt");
		expect(result.mimeType).toBe("text/plain");
	});

	it("should convert to UPPERCASE", async () => {
		const tool = getToolOrThrow();
		const input = new TextEncoder().encode("hello world example");
		const result = await tool.execute(input, { case: "upper" }, {});
		expect(new TextDecoder().decode(result.output)).toBe("HELLO WORLD EXAMPLE");
	});

	it("should convert to lowercase", async () => {
		const tool = getToolOrThrow();
		const input = new TextEncoder().encode("Hello World EXAMPLE");
		const result = await tool.execute(input, { case: "lower" }, {});
		expect(new TextDecoder().decode(result.output)).toBe("hello world example");
	});

	it("should convert to Title Case", async () => {
		const tool = getToolOrThrow();
		const input = new TextEncoder().encode("hello world example");
		const result = await tool.execute(input, { case: "title" }, {});
		expect(new TextDecoder().decode(result.output)).toBe("Hello World Example");
	});

	it("should convert to Sentence case", async () => {
		const tool = getToolOrThrow();
		const input = new TextEncoder().encode("hello world example");
		const result = await tool.execute(input, { case: "sentence" }, {});
		expect(new TextDecoder().decode(result.output)).toBe("Hello world example");
	});

	it("should convert to PascalCase", async () => {
		const tool = getToolOrThrow();
		const input = new TextEncoder().encode("hello world example");
		const result = await tool.execute(input, { case: "pascal" }, {});
		expect(new TextDecoder().decode(result.output)).toBe("HelloWorldExample");
	});

	it("should convert to snake_case", async () => {
		const tool = getToolOrThrow();
		const input = new TextEncoder().encode("hello world example");
		const result = await tool.execute(input, { case: "snake" }, {});
		expect(new TextDecoder().decode(result.output)).toBe("hello_world_example");
	});

	it("should convert to kebab-case", async () => {
		const tool = getToolOrThrow();
		const input = new TextEncoder().encode("hello world example");
		const result = await tool.execute(input, { case: "kebab" }, {});
		expect(new TextDecoder().decode(result.output)).toBe("hello-world-example");
	});

	it("should convert to CONSTANT_CASE", async () => {
		const tool = getToolOrThrow();
		const input = new TextEncoder().encode("hello world example");
		const result = await tool.execute(input, { case: "constant" }, {});
		expect(new TextDecoder().decode(result.output)).toBe("HELLO_WORLD_EXAMPLE");
	});

	it("should convert to dot.case", async () => {
		const tool = getToolOrThrow();
		const input = new TextEncoder().encode("hello world example");
		const result = await tool.execute(input, { case: "dot" }, {});
		expect(new TextDecoder().decode(result.output)).toBe("hello.world.example");
	});

	it("should detect camelCase boundaries", async () => {
		const tool = getToolOrThrow();
		const input = new TextEncoder().encode("helloWorldExample");
		const result = await tool.execute(input, { case: "snake" }, {});
		expect(new TextDecoder().decode(result.output)).toBe("hello_world_example");
	});

	it("should handle empty input", async () => {
		const tool = getToolOrThrow();
		const input = new TextEncoder().encode("");
		const result = await tool.execute(input, { case: "upper" }, {});
		expect(new TextDecoder().decode(result.output)).toBe("");
	});
});
