import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/yaml-json.js";

describe("yaml-json tool", () => {
	it("should be registered", () => {
		const tool = getTool("yaml-json");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
		expect(tool?.id).toBe("yaml-json");
	});

	it("should convert YAML to JSON", async () => {
		const tool = getTool("yaml-json");
		if (!tool) throw new Error("yaml-json not registered");

		const yamlInput = "name: Alice\nage: 30\nitems:\n  - a\n  - b";
		const encoded = new TextEncoder().encode(yamlInput);
		const result = await tool.execute(
			encoded,
			{ direction: "yaml-to-json", indent: 2 },
			{},
		);

		expect(result.extension).toBe(".json");
		expect(result.mimeType).toBe("application/json");

		const output = new TextDecoder().decode(result.output);
		const parsed = JSON.parse(output);
		expect(parsed.name).toBe("Alice");
		expect(parsed.age).toBe(30);
		expect(parsed.items).toEqual(["a", "b"]);
	});

	it("should convert JSON to YAML", async () => {
		const tool = getTool("yaml-json");
		if (!tool) throw new Error("yaml-json not registered");

		const jsonInput = '{"name":"Bob","active":true}';
		const encoded = new TextEncoder().encode(jsonInput);
		const result = await tool.execute(
			encoded,
			{ direction: "json-to-yaml", indent: 2 },
			{},
		);

		expect(result.extension).toBe(".yaml");
		expect(result.mimeType).toBe("text/yaml");

		const output = new TextDecoder().decode(result.output);
		expect(output).toContain("name: Bob");
		expect(output).toContain("active: true");
	});

	it("should resolve YAML anchors during conversion", async () => {
		const tool = getTool("yaml-json");
		if (!tool) throw new Error("yaml-json not registered");

		const yamlInput =
			"defaults: &defaults\n  color: red\n  size: 10\nitem:\n  <<: *defaults\n  name: First";
		const encoded = new TextEncoder().encode(yamlInput);
		const result = await tool.execute(
			encoded,
			{ direction: "yaml-to-json" },
			{},
		);

		const output = new TextDecoder().decode(result.output);
		const parsed = JSON.parse(output);
		expect(parsed.item.color).toBe("red");
		expect(parsed.item.size).toBe(10);
		expect(parsed.item.name).toBe("First");
	});

	it("should throw on invalid YAML", async () => {
		const tool = getTool("yaml-json");
		if (!tool) throw new Error("yaml-json not registered");

		const yamlInput = "key: [unclosed";
		const encoded = new TextEncoder().encode(yamlInput);
		await expect(
			tool.execute(encoded, { direction: "yaml-to-json" }, {}),
		).rejects.toThrow();
	});

	it("should throw on invalid JSON when converting to YAML", async () => {
		const tool = getTool("yaml-json");
		if (!tool) throw new Error("yaml-json not registered");

		const jsonInput = "{invalid json}";
		const encoded = new TextEncoder().encode(jsonInput);
		await expect(
			tool.execute(encoded, { direction: "json-to-yaml" }, {}),
		).rejects.toThrow();
	});

	it("should respect indent option", async () => {
		const tool = getTool("yaml-json");
		if (!tool) throw new Error("yaml-json not registered");

		const yamlInput = "a: 1";
		const encoded = new TextEncoder().encode(yamlInput);
		const result = await tool.execute(
			encoded,
			{ direction: "yaml-to-json", indent: 4 },
			{},
		);

		const output = new TextDecoder().decode(result.output);
		expect(output).toBe('{\n    "a": 1\n}');
	});
});
