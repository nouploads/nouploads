import { describe, expect, it } from "vitest";
import { findToolByFormats } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/heic-to-jpg.js";

function getHeicToJpg() {
	const tool = findToolByFormats("heic", "jpg");
	if (!tool) throw new Error("heic-to-jpg tool not registered");
	return tool;
}

describe("heic-to-jpg tool", () => {
	it("should be registered in the registry", () => {
		const tool = getHeicToJpg();
		expect(tool.id).toBe("heic-to-jpg");
	});

	it("should have quality option with correct defaults", () => {
		const tool = getHeicToJpg();
		const quality = tool.options.find((o) => o.name === "quality");
		expect(quality).toBeDefined();
		expect(quality?.default).toBe(80);
		expect(quality?.min).toBe(1);
		expect(quality?.max).toBe(100);
	});

	it("should accept heic and heif MIME types", () => {
		const tool = getHeicToJpg();
		expect(tool.inputMimeTypes).toContain("image/heic");
		expect(tool.inputMimeTypes).toContain("image/heif");
	});

	it("should accept .heic and .heif extensions", () => {
		const tool = getHeicToJpg();
		expect(tool.inputExtensions).toContain(".heic");
		expect(tool.inputExtensions).toContain(".heif");
	});

	it("should throw if no image backend provided", async () => {
		const tool = getHeicToJpg();
		const input = new Uint8Array([0, 0, 0]);
		await expect(
			tool.execute(input, {}, { imageBackend: undefined }),
		).rejects.toThrow("Image backend required");
	});
});
