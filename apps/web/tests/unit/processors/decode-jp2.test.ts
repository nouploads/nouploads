import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * JP2 box-format signature (first 12 bytes).
 */
const JP2_SIGNATURE = new Uint8Array([
	0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x87, 0x0a,
]);

/**
 * J2K codestream magic (first 4 bytes).
 */
const J2K_MAGIC = new Uint8Array([0xff, 0x4f, 0xff, 0x51]);

/**
 * Build a minimal buffer that starts with valid JP2 signature bytes.
 * The rest is zero-filled (not a valid JP2, but passes magic byte check).
 */
function buildJp2Shell(size = 256): Uint8Array {
	const buf = new Uint8Array(size);
	buf.set(JP2_SIGNATURE, 0);
	return buf;
}

/**
 * Build a minimal buffer that starts with J2K codestream magic.
 */
function buildJ2kShell(size = 256): Uint8Array {
	const buf = new Uint8Array(size);
	buf.set(J2K_MAGIC, 0);
	return buf;
}

describe("decodeJp2", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should reject files without valid JP2 or J2K magic bytes", async () => {
		const blob = new Blob([new Uint8Array(200)], { type: "image/jp2" });

		const { decodeJp2 } = await import(
			"~/features/image-tools/decoders/decode-jp2"
		);

		await expect(decodeJp2(blob)).rejects.toThrow("valid JP2 or J2K magic");
	});

	it("should reject files that are too small for JP2 signature", async () => {
		const blob = new Blob([new Uint8Array(4)], { type: "image/jp2" });

		const { decodeJp2 } = await import(
			"~/features/image-tools/decoders/decode-jp2"
		);

		await expect(decodeJp2(blob)).rejects.toThrow("valid JP2 or J2K magic");
	});

	it("should reject when decoder throws (corrupt codestream)", async () => {
		// Has valid JP2 magic but garbage after
		const buf = buildJp2Shell(100);

		vi.doMock("@cornerstonejs/codec-openjpeg/decode", () => ({
			default: () =>
				Promise.resolve({
					J2KDecoder: class {
						getEncodedBuffer(len: number) {
							return new Uint8Array(len);
						}
						decode() {
							throw new Error("opj decode failed");
						}
					},
				}),
		}));

		const blob = new Blob([buf as BlobPart], { type: "image/jp2" });

		const { decodeJp2 } = await import(
			"~/features/image-tools/decoders/decode-jp2"
		);

		await expect(decodeJp2(blob)).rejects.toThrow("could not be decoded");
	});

	it("should reject when dimensions are zero", async () => {
		const buf = buildJp2Shell(100);

		vi.doMock("@cornerstonejs/codec-openjpeg/decode", () => ({
			default: () =>
				Promise.resolve({
					J2KDecoder: class {
						getEncodedBuffer(len: number) {
							return new Uint8Array(len);
						}
						decode() {}
						getFrameInfo() {
							return {
								width: 0,
								height: 0,
								bitsPerSample: 8,
								componentCount: 3,
								isSigned: false,
							};
						}
						getDecodedBuffer() {
							return new Uint8Array(0);
						}
					},
				}),
		}));

		const blob = new Blob([buf as BlobPart], { type: "image/jp2" });

		const { decodeJp2 } = await import(
			"~/features/image-tools/decoders/decode-jp2"
		);

		await expect(decodeJp2(blob)).rejects.toThrow("invalid dimensions");
	});

	it("should reject when dimensions exceed limit", async () => {
		const buf = buildJp2Shell(100);

		vi.doMock("@cornerstonejs/codec-openjpeg/decode", () => ({
			default: () =>
				Promise.resolve({
					J2KDecoder: class {
						getEncodedBuffer(len: number) {
							return new Uint8Array(len);
						}
						decode() {}
						getFrameInfo() {
							return {
								width: 20000,
								height: 20000,
								bitsPerSample: 8,
								componentCount: 3,
								isSigned: false,
							};
						}
						getDecodedBuffer() {
							return new Uint8Array(0);
						}
					},
				}),
		}));

		const blob = new Blob([buf as BlobPart], { type: "image/jp2" });

		const { decodeJp2 } = await import(
			"~/features/image-tools/decoders/decode-jp2"
		);

		await expect(decodeJp2(blob)).rejects.toThrow("exceed the 16384px limit");
	});

	it("should reject unsupported component count", async () => {
		const buf = buildJp2Shell(100);

		vi.doMock("@cornerstonejs/codec-openjpeg/decode", () => ({
			default: () =>
				Promise.resolve({
					J2KDecoder: class {
						getEncodedBuffer(len: number) {
							return new Uint8Array(len);
						}
						decode() {}
						getFrameInfo() {
							return {
								width: 2,
								height: 2,
								bitsPerSample: 8,
								componentCount: 5,
								isSigned: false,
							};
						}
						getDecodedBuffer() {
							return new Uint8Array(2 * 2 * 5);
						}
					},
				}),
		}));

		const blob = new Blob([buf as BlobPart], { type: "image/jp2" });

		const { decodeJp2 } = await import(
			"~/features/image-tools/decoders/decode-jp2"
		);

		await expect(decodeJp2(blob)).rejects.toThrow("5 color components");
	});

	it("should decode a mocked 2x2 RGB image to RGBA", async () => {
		const buf = buildJp2Shell(100);
		// 2x2 RGB: 12 bytes
		const pixels = new Uint8Array([
			255, 0, 0, 0, 255, 0, 0, 0, 255, 128, 128, 128,
		]);

		vi.doMock("@cornerstonejs/codec-openjpeg/decode", () => ({
			default: () =>
				Promise.resolve({
					J2KDecoder: class {
						getEncodedBuffer(len: number) {
							return new Uint8Array(len);
						}
						decode() {}
						getFrameInfo() {
							return {
								width: 2,
								height: 2,
								bitsPerSample: 8,
								componentCount: 3,
								isSigned: false,
							};
						}
						getDecodedBuffer() {
							return pixels;
						}
					},
				}),
		}));

		const blob = new Blob([buf as BlobPart], { type: "image/jp2" });

		const { decodeJp2 } = await import(
			"~/features/image-tools/decoders/decode-jp2"
		);
		const result = await decodeJp2(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 2 * 4); // RGBA

		// Pixel 0: R=255, G=0, B=0, A=255
		expect(result.data[0]).toBe(255);
		expect(result.data[1]).toBe(0);
		expect(result.data[2]).toBe(0);
		expect(result.data[3]).toBe(255);

		// Pixel 1: R=0, G=255, B=0, A=255
		expect(result.data[4]).toBe(0);
		expect(result.data[5]).toBe(255);
		expect(result.data[6]).toBe(0);
		expect(result.data[7]).toBe(255);
	});

	it("should decode a mocked 2x2 grayscale image to RGBA", async () => {
		const buf = buildJ2kShell(100);
		const pixels = new Uint8Array([0, 85, 170, 255]);

		vi.doMock("@cornerstonejs/codec-openjpeg/decode", () => ({
			default: () =>
				Promise.resolve({
					J2KDecoder: class {
						getEncodedBuffer(len: number) {
							return new Uint8Array(len);
						}
						decode() {}
						getFrameInfo() {
							return {
								width: 2,
								height: 2,
								bitsPerSample: 8,
								componentCount: 1,
								isSigned: false,
							};
						}
						getDecodedBuffer() {
							return pixels;
						}
					},
				}),
		}));

		const blob = new Blob([buf as BlobPart], { type: "image/jp2" });

		const { decodeJp2 } = await import(
			"~/features/image-tools/decoders/decode-jp2"
		);
		const result = await decodeJp2(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data.length).toBe(16);

		// Pixel 0: gray=0 → R=0, G=0, B=0, A=255
		expect(result.data[0]).toBe(0);
		expect(result.data[1]).toBe(0);
		expect(result.data[2]).toBe(0);
		expect(result.data[3]).toBe(255);

		// Pixel 3: gray=255 → R=255, G=255, B=255, A=255
		expect(result.data[12]).toBe(255);
		expect(result.data[13]).toBe(255);
		expect(result.data[14]).toBe(255);
		expect(result.data[15]).toBe(255);
	});

	it("should decode a mocked 2x2 RGBA image", async () => {
		const buf = buildJp2Shell(100);
		const pixels = new Uint8Array([
			255, 0, 0, 200, 0, 255, 0, 150, 0, 0, 255, 100, 128, 128, 128, 50,
		]);

		vi.doMock("@cornerstonejs/codec-openjpeg/decode", () => ({
			default: () =>
				Promise.resolve({
					J2KDecoder: class {
						getEncodedBuffer(len: number) {
							return new Uint8Array(len);
						}
						decode() {}
						getFrameInfo() {
							return {
								width: 2,
								height: 2,
								bitsPerSample: 8,
								componentCount: 4,
								isSigned: false,
							};
						}
						getDecodedBuffer() {
							return pixels;
						}
					},
				}),
		}));

		const blob = new Blob([buf as BlobPart], { type: "image/jp2" });

		const { decodeJp2 } = await import(
			"~/features/image-tools/decoders/decode-jp2"
		);
		const result = await decodeJp2(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data.length).toBe(16);

		// Pixel 0: R=255, G=0, B=0, A=200
		expect(result.data[0]).toBe(255);
		expect(result.data[3]).toBe(200);

		// Pixel 3: R=128, G=128, B=128, A=50
		expect(result.data[12]).toBe(128);
		expect(result.data[15]).toBe(50);
	});

	it("should respect abort signal (pre-aborted)", async () => {
		const { decodeJp2 } = await import(
			"~/features/image-tools/decoders/decode-jp2"
		);
		const blob = new Blob([new Uint8Array(200)], { type: "image/jp2" });
		const controller = new AbortController();
		controller.abort();

		await expect(decodeJp2(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
