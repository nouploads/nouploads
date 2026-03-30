import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Minimal synthetic PCD at Base/4 resolution (384x256).
 * Y plane at offset 0xB800 (47104), followed by Cb and Cr planes.
 * Chroma planes are half resolution (192x128).
 *
 * To keep the fixture small, we create the minimum viable file:
 * 0xB800 bytes of padding + Y plane + Cb + Cr.
 */
function makePcdBase4(): Uint8Array {
	const BASE4_OFFSET = 0xb800; // 47104
	const width = 384;
	const height = 256;
	const chromaW = 192;
	const chromaH = 128;

	const ySize = width * height; // 98304
	const chromaSize = chromaW * chromaH; // 24576
	const totalSize = BASE4_OFFSET + ySize + 2 * chromaSize;

	const buf = new Uint8Array(totalSize);

	// Fill Y plane with a known value (luma = 180)
	for (let i = 0; i < ySize; i++) {
		buf[BASE4_OFFSET + i] = 180;
	}

	// Fill Cb plane with 128 (neutral)
	for (let i = 0; i < chromaSize; i++) {
		buf[BASE4_OFFSET + ySize + i] = 128;
	}

	// Fill Cr plane with 128 (neutral)
	for (let i = 0; i < chromaSize; i++) {
		buf[BASE4_OFFSET + ySize + chromaSize + i] = 128;
	}

	return buf;
}

describe("decodePcd", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a Base/4 PCD to correct dimensions and RGBA", async () => {
		const pcd = makePcdBase4();
		const blob = new Blob([pcd], { type: "image/x-photo-cd" });

		const { decodePcd } = await import(
			"~/features/image-tools/decoders/decode-pcd"
		);
		const result = await decodePcd(blob);

		expect(result.width).toBe(384);
		expect(result.height).toBe(256);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(384 * 256 * 4);

		// With Y=180, Cb=128, Cr=128: should be neutral gray
		// R = 180 + 1.402*(128-128) = 180
		// G = 180 - 0.34414*(128-128) - 0.71414*(128-128) = 180
		// B = 180 + 1.772*(128-128) = 180
		expect(result.data[0]).toBe(180); // R
		expect(result.data[1]).toBe(180); // G
		expect(result.data[2]).toBe(180); // B
		expect(result.data[3]).toBe(255); // A
	});

	it("should produce valid color from non-neutral chroma", async () => {
		const BASE4_OFFSET = 0xb800;
		const width = 384;
		const height = 256;
		const chromaW = 192;
		const chromaH = 128;
		const ySize = width * height;
		const chromaSize = chromaW * chromaH;
		const totalSize = BASE4_OFFSET + ySize + 2 * chromaSize;

		const buf = new Uint8Array(totalSize);

		// Y=200, Cb=100, Cr=180
		for (let i = 0; i < ySize; i++) buf[BASE4_OFFSET + i] = 200;
		for (let i = 0; i < chromaSize; i++) buf[BASE4_OFFSET + ySize + i] = 100;
		for (let i = 0; i < chromaSize; i++)
			buf[BASE4_OFFSET + ySize + chromaSize + i] = 180;

		const blob = new Blob([buf], { type: "image/x-photo-cd" });
		const { decodePcd } = await import(
			"~/features/image-tools/decoders/decode-pcd"
		);
		const result = await decodePcd(blob);

		// R = 200 + 1.402*(180-128) = 200 + 72.9 ≈ 255 (clamped)
		// G = 200 - 0.34414*(100-128) - 0.71414*(180-128) = 200 + 9.6 - 37.1 ≈ 173
		// B = 200 + 1.772*(100-128) = 200 - 49.6 ≈ 150
		// Values are rounded and clamped
		const r = result.data[0];
		const g = result.data[1];
		const b = result.data[2];

		expect(r).toBe(255); // clamped
		expect(g).toBeGreaterThan(160);
		expect(g).toBeLessThan(185);
		expect(b).toBeGreaterThan(140);
		expect(b).toBeLessThan(160);
		expect(result.data[3]).toBe(255); // A
	});

	it("should reject when file is too small for any resolution", async () => {
		// Way too small for even Base/4
		const blob = new Blob([new Uint8Array(1000)], {
			type: "image/x-photo-cd",
		});

		const { decodePcd } = await import(
			"~/features/image-tools/decoders/decode-pcd"
		);

		await expect(decodePcd(blob)).rejects.toThrow("too small");
	});

	it("should respect abort signal", async () => {
		const pcd = makePcdBase4();
		const blob = new Blob([pcd], { type: "image/x-photo-cd" });
		const controller = new AbortController();
		controller.abort();

		const { decodePcd } = await import(
			"~/features/image-tools/decoders/decode-pcd"
		);

		await expect(decodePcd(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
