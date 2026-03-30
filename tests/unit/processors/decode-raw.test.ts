import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Build a fake RAW file: 1024 bytes of zeros (simulating a RAW header)
 * followed by the real JPEG fixture data.
 */
function makeFakeRaw(): Uint8Array {
	const jpegFixture = readFileSync(
		join(__dirname, "../../e2e/fixtures/sample.jpg"),
	);
	const fakeRaw = new Uint8Array(1024 + jpegFixture.length);
	fakeRaw.set(jpegFixture, 1024);
	return fakeRaw;
}

/**
 * Build a fake RAW file with a small thumbnail JPEG before the main one.
 * The decoder should pick the larger JPEG (the second one).
 */
function makeFakeRawWithThumbnail(): Uint8Array {
	const jpegFixture = readFileSync(
		join(__dirname, "../../e2e/fixtures/sample.jpg"),
	);
	// Tiny valid JPEG: SOI + APP0 marker + EOI
	const tinyJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]);
	const fakeRaw = new Uint8Array(
		512 + tinyJpeg.length + 512 + jpegFixture.length,
	);
	fakeRaw.set(tinyJpeg, 512);
	fakeRaw.set(jpegFixture, 512 + tinyJpeg.length + 512);
	return fakeRaw;
}

describe("decodeRaw", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("should extract the embedded JPEG and decode to RGBA pixels", async () => {
		const width = 20;
		const height = 15;

		vi.stubGlobal(
			"createImageBitmap",
			vi.fn(() => Promise.resolve({ width, height, close: vi.fn() })),
		);

		const pixelData = new Uint8ClampedArray(width * height * 4);
		pixelData.fill(128);

		vi.spyOn(document, "createElement").mockReturnValue({
			width: 0,
			height: 0,
			getContext: vi.fn(() => ({
				drawImage: vi.fn(),
				getImageData: vi.fn(() => ({
					data: pixelData,
					width,
					height,
				})),
			})),
		} as unknown as HTMLElement);

		const fakeRaw = makeFakeRaw();
		const blob = new Blob([fakeRaw], { type: "image/x-canon-cr2" });

		const { decodeRaw } = await import(
			"~/features/image-tools/decoders/decode-raw"
		);
		const result = await decodeRaw(blob);

		expect(result.width).toBe(width);
		expect(result.height).toBe(height);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(width * height * 4);

		// Verify createImageBitmap was called with a JPEG blob
		const mockCIB = vi.mocked(createImageBitmap);
		expect(mockCIB).toHaveBeenCalledOnce();
		const jpegArg = mockCIB.mock.calls[0][0] as Blob;
		expect(jpegArg).toBeInstanceOf(Blob);
		expect(jpegArg.type).toBe("image/jpeg");
	});

	it("should pick the largest JPEG when multiple are embedded", async () => {
		const width = 20;
		const height = 15;

		vi.stubGlobal(
			"createImageBitmap",
			vi.fn(() => Promise.resolve({ width, height, close: vi.fn() })),
		);

		vi.spyOn(document, "createElement").mockReturnValue({
			width: 0,
			height: 0,
			getContext: vi.fn(() => ({
				drawImage: vi.fn(),
				getImageData: vi.fn(() => ({
					data: new Uint8ClampedArray(width * height * 4),
					width,
					height,
				})),
			})),
		} as unknown as HTMLElement);

		const fakeRaw = makeFakeRawWithThumbnail();
		const blob = new Blob([fakeRaw], { type: "image/x-nikon-nef" });

		const { decodeRaw } = await import(
			"~/features/image-tools/decoders/decode-raw"
		);
		const result = await decodeRaw(blob);

		// Should succeed (picked the larger JPEG, not the 6-byte thumbnail)
		expect(result.width).toBe(width);
		expect(result.height).toBe(height);

		// The blob passed to createImageBitmap should be the full-size JPEG,
		// not the tiny thumbnail
		const mockCIB = vi.mocked(createImageBitmap);
		const jpegArg = mockCIB.mock.calls[0][0] as Blob;
		expect(jpegArg.size).toBeGreaterThan(100);
	});

	it("should throw a clean error when no JPEG is embedded", async () => {
		// Raw bytes with no JPEG magic bytes
		const noJpegData = new Uint8Array(2048);
		noJpegData.fill(0x42);
		const blob = new Blob([noJpegData], { type: "image/x-canon-cr2" });

		const { decodeRaw } = await import(
			"~/features/image-tools/decoders/decode-raw"
		);

		await expect(decodeRaw(blob)).rejects.toThrow(
			"This RAW file does not contain an embedded JPEG preview",
		);
	});

	it("should respect abort signal (pre-aborted)", async () => {
		const fakeRaw = makeFakeRaw();
		const blob = new Blob([fakeRaw], { type: "image/x-canon-cr2" });
		const controller = new AbortController();
		controller.abort();

		const { decodeRaw } = await import(
			"~/features/image-tools/decoders/decode-raw"
		);

		await expect(decodeRaw(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
