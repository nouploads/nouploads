import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/watermark-image.js";

describe("watermark-image tool", () => {
	it("should be registered", () => {
		const tool = getTool("watermark-image");
		expect(tool).toBeDefined();
		expect(tool?.id).toBe("watermark-image");
		expect(tool?.category).toBe("image");
	});

	it("should expose text, mode, rotation, color, opacity, fontSize, format, quality options", () => {
		const tool = getTool("watermark-image");
		const names = tool?.options.map((o) => o.name);
		expect(names).toContain("text");
		expect(names).toContain("mode");
		expect(names).toContain("rotation");
		expect(names).toContain("color");
		expect(names).toContain("opacity");
		expect(names).toContain("fontSize");
		expect(names).toContain("format");
		expect(names).toContain("quality");
	});

	it("should require browser capability", () => {
		const tool = getTool("watermark-image");
		expect(tool?.capabilities).toContain("browser");
	});

	it("should throw when execute is called without imageBackend", async () => {
		const tool = getTool("watermark-image");
		await expect(tool?.execute(new Uint8Array([1]), {}, {})).rejects.toThrow(
			/Image backend/,
		);
	});

	// In a bare Node/Vitest environment OffscreenCanvas is not defined,
	// so execute() surfaces the browser-only requirement immediately.
	// This guards against the tool ever regressing back to a dumb stub
	// like `throw new Error("use the web processor")` — which would
	// still "throw" but silently break the pipeline migration.
	it("should mention OffscreenCanvas when run outside a browser context", async () => {
		const tool = getTool("watermark-image");
		const fakeBackend = {
			decode: async () => ({ width: 1, height: 1, data: new Uint8Array(4) }),
			encode: async () => new Uint8Array([0x89]),
			resize: async () => ({ width: 1, height: 1, data: new Uint8Array(4) }),
		};
		await expect(
			tool?.execute(new Uint8Array([1]), {}, { imageBackend: fakeBackend }),
		).rejects.toThrow(/OffscreenCanvas/);
	});
});
