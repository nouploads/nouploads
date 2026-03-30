import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Build a minimal 4x4 uncompressed RGBA DDS file.
 * fourCC = 0, RGB bit count = 32, standard BGRA masks.
 */
function makeUncompressed4x4(): Uint8Array {
	// 4 bytes magic + 124 bytes header + 64 bytes pixel data = 192 bytes
	const buf = new Uint8Array(192);
	const view = new DataView(buf.buffer);

	// Magic: "DDS "
	buf[0] = 0x44;
	buf[1] = 0x44;
	buf[2] = 0x53;
	buf[3] = 0x20;

	// Header (starts at offset 4)
	view.setUint32(4, 124, true); // header size
	view.setUint32(8, 0x1 | 0x2 | 0x4 | 0x1000, true); // flags
	view.setUint32(16, 4, true); // height
	view.setUint32(20, 4, true); // width

	// Pixel format (starts at offset 4 + 72 = 76)
	view.setUint32(76, 32, true); // pixel format struct size
	view.setUint32(80, 0x41, true); // pixel format flags (DDPF_RGB | DDPF_ALPHAPIXELS)
	// fourCC at offset 88 = 0 (uncompressed)
	view.setUint32(92, 32, true); // RGB bit count
	view.setUint32(96, 0x00ff0000, true); // R mask
	view.setUint32(100, 0x0000ff00, true); // G mask
	view.setUint32(104, 0x000000ff, true); // B mask
	view.setUint32(108, 0xff000000, true); // A mask

	// Pixel data (starts at offset 128): 16 pixels * 4 bytes each = 64 bytes
	// Fill all pixels with BGRA = (0x00, 0x00, 0xFF, 0xFF) → RGBA red, opaque
	for (let i = 0; i < 16; i++) {
		const off = 128 + i * 4;
		buf[off] = 0x00; // B
		buf[off + 1] = 0x00; // G
		buf[off + 2] = 0xff; // R
		buf[off + 3] = 0xff; // A
	}

	return buf;
}

describe("decodeDds", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a 4x4 uncompressed RGBA DDS to correct dimensions and pixel data", async () => {
		const dds = makeUncompressed4x4();
		const blob = new Blob([dds], { type: "image/vnd-ms.dds" });

		const { decodeDds } = await import(
			"~/features/image-tools/decoders/decode-dds"
		);
		const result = await decodeDds(blob);

		expect(result.width).toBe(4);
		expect(result.height).toBe(4);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(4 * 4 * 4);

		// Every pixel should be red (R=255, G=0, B=0, A=255)
		// The masks map: R mask = 0x00FF0000 (bits 16-23), so byte at bits 16-23 is 0xFF → R=255
		for (let i = 0; i < 16; i++) {
			const off = i * 4;
			expect(result.data[off]).toBe(255); // R
			expect(result.data[off + 1]).toBe(0); // G
			expect(result.data[off + 2]).toBe(0); // B
			expect(result.data[off + 3]).toBe(255); // A
		}
	});

	it("should reject corrupt data (too short)", async () => {
		const blob = new Blob([new Uint8Array(10)], { type: "image/vnd-ms.dds" });

		const { decodeDds } = await import(
			"~/features/image-tools/decoders/decode-dds"
		);

		await expect(decodeDds(blob)).rejects.toThrow();
	});

	it("should reject invalid magic number", async () => {
		const buf = new Uint8Array(192);
		const view = new DataView(buf.buffer);
		view.setUint32(0, 0x12345678, true); // wrong magic
		view.setUint32(4, 124, true);

		const blob = new Blob([buf], { type: "image/vnd-ms.dds" });

		const { decodeDds } = await import(
			"~/features/image-tools/decoders/decode-dds"
		);

		await expect(decodeDds(blob)).rejects.toThrow("Invalid magic number");
	});

	it("should respect abort signal", async () => {
		const dds = makeUncompressed4x4();
		const blob = new Blob([dds], { type: "image/vnd-ms.dds" });
		const controller = new AbortController();
		controller.abort();

		const { decodeDds } = await import(
			"~/features/image-tools/decoders/decode-dds"
		);

		await expect(decodeDds(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
