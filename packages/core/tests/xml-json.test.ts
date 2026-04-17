import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/xml-json.js";

describe("xml-json tool", () => {
	it("should be registered", () => {
		const tool = getTool("xml-json");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
		expect(tool?.id).toBe("xml-json");
	});

	it("should convert XML to JSON", async () => {
		const tool = getTool("xml-json");
		if (!tool) throw new Error("xml-json not registered");

		const xml = "<root><name>Alice</name><age>30</age></root>";
		const encoded = new TextEncoder().encode(xml);
		const result = await tool.execute(
			encoded,
			{ direction: "xml-to-json", indent: 2 },
			{},
		);

		expect(result.extension).toBe(".json");
		expect(result.mimeType).toBe("application/json");

		const output = new TextDecoder().decode(result.output);
		const parsed = JSON.parse(output);
		expect(parsed.root.name).toBe("Alice");
		expect(parsed.root.age).toBe(30);
	});

	it("should preserve XML attributes with @_ prefix", async () => {
		const tool = getTool("xml-json");
		if (!tool) throw new Error("xml-json not registered");

		const xml = '<user id="42" role="admin">Alice</user>';
		const encoded = new TextEncoder().encode(xml);
		const result = await tool.execute(
			encoded,
			{ direction: "xml-to-json" },
			{},
		);

		const output = new TextDecoder().decode(result.output);
		const parsed = JSON.parse(output);
		expect(parsed.user["@_id"]).toBe(42);
		expect(parsed.user["@_role"]).toBe("admin");
		expect(parsed.user["#text"] ?? parsed.user).toBeDefined();
	});

	it("should convert repeated elements to arrays", async () => {
		const tool = getTool("xml-json");
		if (!tool) throw new Error("xml-json not registered");

		const xml = "<items><item>a</item><item>b</item><item>c</item></items>";
		const encoded = new TextEncoder().encode(xml);
		const result = await tool.execute(
			encoded,
			{ direction: "xml-to-json" },
			{},
		);

		const output = new TextDecoder().decode(result.output);
		const parsed = JSON.parse(output);
		expect(Array.isArray(parsed.items.item)).toBe(true);
		expect(parsed.items.item).toEqual(["a", "b", "c"]);
	});

	it("should convert JSON to XML", async () => {
		const tool = getTool("xml-json");
		if (!tool) throw new Error("xml-json not registered");

		const json = JSON.stringify({ root: { name: "Alice", age: 30 } });
		const encoded = new TextEncoder().encode(json);
		const result = await tool.execute(
			encoded,
			{ direction: "json-to-xml", indent: 2 },
			{},
		);

		expect(result.extension).toBe(".xml");
		expect(result.mimeType).toBe("application/xml");

		const output = new TextDecoder().decode(result.output);
		expect(output).toContain("<root>");
		expect(output).toContain("<name>Alice</name>");
		expect(output).toContain("<age>30</age>");
		expect(output).toContain("</root>");
	});

	it("should restore @_-prefixed keys as XML attributes", async () => {
		const tool = getTool("xml-json");
		if (!tool) throw new Error("xml-json not registered");

		const json = JSON.stringify({
			user: { "@_id": "42", "@_role": "admin", "#text": "Alice" },
		});
		const encoded = new TextEncoder().encode(json);
		const result = await tool.execute(
			encoded,
			{ direction: "json-to-xml" },
			{},
		);

		const output = new TextDecoder().decode(result.output);
		expect(output).toMatch(/<user[^>]*id="42"[^>]*>/);
		expect(output).toMatch(/role="admin"/);
	});

	it("should respect indent option when converting JSON to XML", async () => {
		const tool = getTool("xml-json");
		if (!tool) throw new Error("xml-json not registered");

		const json = JSON.stringify({ root: { child: "hello" } });
		const encoded = new TextEncoder().encode(json);
		const result = await tool.execute(
			encoded,
			{ direction: "json-to-xml", indent: 4 },
			{},
		);

		const output = new TextDecoder().decode(result.output);
		expect(output).toMatch(/^ {4}<child>/m);
	});

	it("should roundtrip XML → JSON → XML preserving structure", async () => {
		const tool = getTool("xml-json");
		if (!tool) throw new Error("xml-json not registered");

		const original = '<root><user id="1"><name>Alice</name></user></root>';
		const toJson = await tool.execute(
			new TextEncoder().encode(original),
			{ direction: "xml-to-json" },
			{},
		);
		const toXml = await tool.execute(
			toJson.output,
			{ direction: "json-to-xml" },
			{},
		);

		const xmlOutput = new TextDecoder().decode(toXml.output);
		expect(xmlOutput).toContain("<root>");
		expect(xmlOutput).toContain("<name>Alice</name>");
		expect(xmlOutput).toMatch(/id="1"/);
	});

	it("should throw on malformed JSON when converting to XML", async () => {
		const tool = getTool("xml-json");
		if (!tool) throw new Error("xml-json not registered");

		const encoded = new TextEncoder().encode("{invalid json}");
		await expect(
			tool.execute(encoded, { direction: "json-to-xml" }, {}),
		).rejects.toThrow();
	});
});
