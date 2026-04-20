import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";
import "../src/tools/color-picker.js";

describe("color-picker tool", () => {
	it("is registered under developer category", () => {
		const tool = getTool("color-picker");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
	});

	it("execute() converts a CSS color string to every supported format", async () => {
		const tool = getTool("color-picker");
		if (!tool) throw new Error("color-picker not registered");

		const result = await tool.execute(
			new TextEncoder().encode("#ff0000"),
			{},
			{},
		);
		if ("outputs" in result) throw new Error("unexpected multi-output");
		const body = JSON.parse(new TextDecoder().decode(result.output));
		expect(body.hex.toLowerCase()).toBe("#ff0000");
		// rgb/hsl/etc. are emitted as component lists ("r, g, b") rather
		// than the CSS functional notation — callers wrap them if needed.
		expect(body.rgb).toBe("255, 0, 0");
		expect(body.hsl).toBe("0, 100, 50");
	});

	it("throws on an empty input", async () => {
		const tool = getTool("color-picker");
		if (!tool) throw new Error("color-picker not registered");
		await expect(tool.execute(new Uint8Array(), {}, {})).rejects.toThrow();
	});

	it("throws on an unparseable color string", async () => {
		const tool = getTool("color-picker");
		if (!tool) throw new Error("color-picker not registered");
		await expect(
			tool.execute(new TextEncoder().encode("not-a-color"), {}, {}),
		).rejects.toThrow();
	});
});
