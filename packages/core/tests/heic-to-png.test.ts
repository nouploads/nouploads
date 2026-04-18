import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/heic-to-png.js";

describe("heic-to-png tool", () => {
	it("should be registered in the registry", () => {
		const tool = getTool("heic-to-png");
		expect(tool).toBeDefined();
		expect(tool?.id).toBe("heic-to-png");
	});

	it("should have correct metadata", () => {
		const tool = getTool("heic-to-png");
		expect(tool?.category).toBe("image");
		expect(tool?.from).toBe("heic");
		expect(tool?.to).toBe("png");
	});

	it("should accept heic and heif MIME types", () => {
		const tool = getTool("heic-to-png");
		expect(tool?.inputMimeTypes).toContain("image/heic");
		expect(tool?.inputMimeTypes).toContain("image/heif");
	});

	it("should accept .heic and .heif extensions", () => {
		const tool = getTool("heic-to-png");
		expect(tool?.inputExtensions).toContain(".heic");
		expect(tool?.inputExtensions).toContain(".heif");
	});

	it("should have no quality option (PNG is lossless)", () => {
		const tool = getTool("heic-to-png");
		expect(tool?.options).toHaveLength(0);
	});

	it("should throw if no image backend provided", async () => {
		const tool = getTool("heic-to-png");
		expect(tool).toBeDefined();
		const input = new Uint8Array([0, 0, 0]);
		await expect(
			// biome-ignore lint/style/noNonNullAssertion: guarded by assertion above
			tool!.execute(input, {}, { imageBackend: undefined }),
		).rejects.toThrow("Image backend required");
	});
});
