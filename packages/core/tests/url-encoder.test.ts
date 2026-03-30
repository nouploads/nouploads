import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/url-encoder.js";

describe("url-encoder tool", () => {
	it("should be registered", () => {
		const tool = getTool("url-encoder");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
	});

	it("should encode a component by default", async () => {
		const tool = getTool("url-encoder");
		if (!tool) throw new Error("url-encoder not registered");

		const input = new TextEncoder().encode("hello world&foo=bar");
		const result = await tool.execute(input, {}, {});

		expect(result.extension).toBe(".txt");
		expect(result.mimeType).toBe("text/plain");

		const text = new TextDecoder().decode(result.output);
		expect(text).toBe("hello%20world%26foo%3Dbar");
	});

	it("should decode a component", async () => {
		const tool = getTool("url-encoder");
		if (!tool) throw new Error("url-encoder not registered");

		const input = new TextEncoder().encode("hello%20world%26foo%3Dbar");
		const result = await tool.execute(input, { mode: "decode" }, {});

		const text = new TextDecoder().decode(result.output);
		expect(text).toBe("hello world&foo=bar");
	});

	it("should encode a full URL preserving structure", async () => {
		const tool = getTool("url-encoder");
		if (!tool) throw new Error("url-encoder not registered");

		const input = new TextEncoder().encode(
			"https://example.com/path?q=hello world",
		);
		const result = await tool.execute(
			input,
			{ mode: "encode", scope: "full" },
			{},
		);

		const text = new TextDecoder().decode(result.output);
		// encodeURI preserves ://?= but encodes the space
		expect(text).toContain("https://example.com/path?q=hello%20world");
	});

	it("should decode a full URL", async () => {
		const tool = getTool("url-encoder");
		if (!tool) throw new Error("url-encoder not registered");

		const input = new TextEncoder().encode(
			"https://example.com/path?q=hello%20world",
		);
		const result = await tool.execute(
			input,
			{ mode: "decode", scope: "full" },
			{},
		);

		const text = new TextDecoder().decode(result.output);
		expect(text).toBe("https://example.com/path?q=hello world");
	});

	it("should round-trip encode then decode", async () => {
		const tool = getTool("url-encoder");
		if (!tool) throw new Error("url-encoder not registered");

		const original = "special chars: @#$%^&*()";
		const input = new TextEncoder().encode(original);

		const encoded = await tool.execute(
			input,
			{ mode: "encode", scope: "component" },
			{},
		);
		const decoded = await tool.execute(
			encoded.output,
			{ mode: "decode", scope: "component" },
			{},
		);

		const text = new TextDecoder().decode(decoded.output);
		expect(text).toBe(original);
	});
});
