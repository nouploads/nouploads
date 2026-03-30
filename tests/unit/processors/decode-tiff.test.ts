import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIXTURE = join(__dirname, "../../e2e/fixtures/sample.tiff");

describe("decodeTiff", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a real TIFF file to RGBA pixels", async () => {
		const bytes = readFileSync(FIXTURE);
		const blob = new Blob([bytes], { type: "image/tiff" });

		const { decodeTiff } = await import(
			"~/features/image-tools/decoders/decode-tiff"
		);
		const result = await decodeTiff(blob);

		expect(result.width).toBeGreaterThan(0);
		expect(result.height).toBeGreaterThan(0);
		expect(result.data).toBeInstanceOf(Uint8Array);
		// RGBA = 4 bytes per pixel
		expect(result.data.length).toBe(result.width * result.height * 4);
	});

	it("should reject on corrupt data", async () => {
		const blob = new Blob([new Uint8Array(100)], { type: "image/tiff" });

		const { decodeTiff } = await import(
			"~/features/image-tools/decoders/decode-tiff"
		);

		await expect(decodeTiff(blob)).rejects.toThrow();
	});

	it("should respect abort signal", async () => {
		const bytes = readFileSync(FIXTURE);
		const blob = new Blob([bytes], { type: "image/tiff" });
		const controller = new AbortController();
		controller.abort();

		const { decodeTiff } = await import(
			"~/features/image-tools/decoders/decode-tiff"
		);

		await expect(decodeTiff(blob, controller.signal)).rejects.toThrow(
			"Aborted",
		);
	});
});
