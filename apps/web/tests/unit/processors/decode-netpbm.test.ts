import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Build a minimal 2x2 ASCII PPM (P3) file.
 * Pixels: red (255,0,0), green (0,255,0), blue (0,0,255), white (255,255,255).
 */
function buildP3Ppm(): Uint8Array {
	return new TextEncoder().encode(
		"P3\n2 2\n255\n255 0 0 0 255 0 0 0 255 255 255 255\n",
	);
}

/**
 * Build a minimal 2x1 binary PGM (P5) file.
 * maxval=255, two grayscale pixels: 100, 200.
 */
function buildP5Pgm(): Uint8Array {
	const header = new TextEncoder().encode("P5\n2 1\n255\n");
	const pixels = new Uint8Array([100, 200]);
	const pgm = new Uint8Array(header.length + pixels.length);
	pgm.set(header, 0);
	pgm.set(pixels, header.length);
	return pgm;
}

describe("decodeNetpbm", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a P3 ASCII PPM to correct RGBA pixels", async () => {
		const ppm = buildP3Ppm();
		const blob = new Blob([ppm], { type: "image/x-portable-pixmap" });

		const { decodeNetpbm } = await import(
			"~/features/image-tools/decoders/decode-netpbm"
		);
		const result = await decodeNetpbm(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 2 * 4);

		// Pixel 0: red (255, 0, 0, 255)
		expect(result.data[0]).toBe(255);
		expect(result.data[1]).toBe(0);
		expect(result.data[2]).toBe(0);
		expect(result.data[3]).toBe(255);

		// Pixel 1: green (0, 255, 0, 255)
		expect(result.data[4]).toBe(0);
		expect(result.data[5]).toBe(255);
		expect(result.data[6]).toBe(0);
		expect(result.data[7]).toBe(255);

		// Pixel 2: blue (0, 0, 255, 255)
		expect(result.data[8]).toBe(0);
		expect(result.data[9]).toBe(0);
		expect(result.data[10]).toBe(255);
		expect(result.data[11]).toBe(255);

		// Pixel 3: white (255, 255, 255, 255)
		expect(result.data[12]).toBe(255);
		expect(result.data[13]).toBe(255);
		expect(result.data[14]).toBe(255);
		expect(result.data[15]).toBe(255);
	});

	it("should decode a P5 binary PGM to correct RGBA pixels", async () => {
		const pgm = buildP5Pgm();
		const blob = new Blob([pgm], { type: "image/x-portable-graymap" });

		const { decodeNetpbm } = await import(
			"~/features/image-tools/decoders/decode-netpbm"
		);
		const result = await decodeNetpbm(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(1);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 1 * 4);

		// Pixel 0: gray=100 → R=G=B=100, A=255
		expect(result.data[0]).toBe(100);
		expect(result.data[1]).toBe(100);
		expect(result.data[2]).toBe(100);
		expect(result.data[3]).toBe(255);

		// Pixel 1: gray=200 → R=G=B=200, A=255
		expect(result.data[4]).toBe(200);
		expect(result.data[5]).toBe(200);
		expect(result.data[6]).toBe(200);
		expect(result.data[7]).toBe(255);
	});

	it("should reject on corrupt data", async () => {
		const blob = new Blob([new Uint8Array([0x50, 0x36, 0x0a])], {
			type: "image/x-portable-pixmap",
		});

		const { decodeNetpbm } = await import(
			"~/features/image-tools/decoders/decode-netpbm"
		);

		await expect(decodeNetpbm(blob)).rejects.toThrow();
	});

	it("should respect abort signal", async () => {
		const ppm = buildP3Ppm();
		const blob = new Blob([ppm], { type: "image/x-portable-pixmap" });
		const controller = new AbortController();
		controller.abort();

		const { decodeNetpbm } = await import(
			"~/features/image-tools/decoders/decode-netpbm"
		);

		await expect(decodeNetpbm(blob, controller.signal)).rejects.toThrow(
			"Aborted",
		);
	});
});
