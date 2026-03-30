import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/image-filters.js";

describe("image-filters tool", () => {
	it("should be registered", () => {
		const tool = getTool("image-filters");
		expect(tool).toBeDefined();
		expect(tool?.id).toBe("image-filters");
		expect(tool?.category).toBe("image");
	});

	it("should have all filter options", () => {
		const tool = getTool("image-filters");
		expect(tool).toBeDefined();

		const optionNames = tool?.options.map((o) => o.name);
		expect(optionNames).toContain("brightness");
		expect(optionNames).toContain("contrast");
		expect(optionNames).toContain("saturation");
		expect(optionNames).toContain("blur");
		expect(optionNames).toContain("hueRotate");
		expect(optionNames).toContain("grayscale");
		expect(optionNames).toContain("sepia");
		expect(optionNames).toContain("invert");
		expect(optionNames).toContain("outputFormat");
	});

	it("should have correct default values", () => {
		const tool = getTool("image-filters");
		expect(tool).toBeDefined();

		const getDefault = (name: string) =>
			tool?.options.find((o) => o.name === name)?.default;

		expect(getDefault("brightness")).toBe(100);
		expect(getDefault("contrast")).toBe(100);
		expect(getDefault("saturation")).toBe(100);
		expect(getDefault("blur")).toBe(0);
		expect(getDefault("hueRotate")).toBe(0);
		expect(getDefault("grayscale")).toBe(0);
		expect(getDefault("sepia")).toBe(0);
		expect(getDefault("invert")).toBe(0);
		expect(getDefault("outputFormat")).toBe("png");
	});

	it("should require browser capability", () => {
		const tool = getTool("image-filters");
		expect(tool?.capabilities).toContain("browser");
	});

	it("should throw when execute is called (browser-only)", async () => {
		const tool = getTool("image-filters");
		expect(tool).toBeDefined();

		await expect(tool?.execute(new Uint8Array([1]), {}, {})).rejects.toThrow(
			/browser environment/,
		);
	});
});
