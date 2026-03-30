import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Build a minimal synthetic 2x2 8-bit grayscale FITS file.
 *
 * Header: exactly 2880 bytes (one block of 36 records, each 80 chars).
 * Data: 4 pixels (0, 85, 170, 255) padded to 2880 bytes.
 */
function buildMinimalFits(): Uint8Array {
	const headerStr = [
		"SIMPLE  =                    T",
		"BITPIX  =                    8",
		"NAXIS   =                    2",
		"NAXIS1  =                    2",
		"NAXIS2  =                    2",
		"END",
	]
		.map((line) => line.padEnd(80, " "))
		.join("");
	const header = new TextEncoder().encode(headerStr.padEnd(2880, " "));
	// 4 pixels: 0, 85, 170, 255
	const pixels = new Uint8Array([0, 85, 170, 255]);
	// Pad data to 2880 bytes
	const data = new Uint8Array(2880);
	data.set(pixels);
	const fits = new Uint8Array(header.length + data.length);
	fits.set(header, 0);
	fits.set(data, header.length);
	return fits;
}

describe("decodeFits", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a synthetic 2x2 8-bit FITS file to RGBA pixels", async () => {
		const fits = buildMinimalFits();
		const blob = new Blob([fits as BlobPart], { type: "image/fits" });

		const { decodeFits } = await import(
			"~/features/image-tools/decoders/decode-fits"
		);
		const result = await decodeFits(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		// RGBA = 4 bytes per pixel, 4 pixels
		expect(result.data.length).toBe(2 * 2 * 4);

		// Pixel 0: value=0 → R=G=B=0, A=255
		expect(result.data[0]).toBe(0);
		expect(result.data[1]).toBe(0);
		expect(result.data[2]).toBe(0);
		expect(result.data[3]).toBe(255);

		// Pixel 1: value=85 → R=G=B=85, A=255
		expect(result.data[4]).toBe(85);
		expect(result.data[5]).toBe(85);
		expect(result.data[6]).toBe(85);
		expect(result.data[7]).toBe(255);

		// Pixel 2: value=170 → R=G=B=170, A=255
		expect(result.data[8]).toBe(170);
		expect(result.data[9]).toBe(170);
		expect(result.data[10]).toBe(170);
		expect(result.data[11]).toBe(255);

		// Pixel 3: value=255 → R=G=B=255, A=255
		expect(result.data[12]).toBe(255);
		expect(result.data[13]).toBe(255);
		expect(result.data[14]).toBe(255);
		expect(result.data[15]).toBe(255);
	});

	it("should reject on corrupt data", async () => {
		const blob = new Blob([new Uint8Array(100)], {
			type: "image/fits",
		});

		const { decodeFits } = await import(
			"~/features/image-tools/decoders/decode-fits"
		);

		await expect(decodeFits(blob)).rejects.toThrow();
	});

	it("should respect abort signal", async () => {
		const fits = buildMinimalFits();
		const blob = new Blob([fits as BlobPart], { type: "image/fits" });
		const controller = new AbortController();
		controller.abort();

		const { decodeFits } = await import(
			"~/features/image-tools/decoders/decode-fits"
		);

		await expect(decodeFits(blob, controller.signal)).rejects.toThrow(
			"Aborted",
		);
	});
});
