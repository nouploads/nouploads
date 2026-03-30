import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Build a synthetic DOS EPS file with a TIFF preview section.
 *
 * Layout: [30-byte DOS EPS header][TIFF preview bytes]
 * The TIFF preview offset points to byte 30, right after the header.
 */
function makeDosEpsWithTiff(tiffBytes: Uint8Array): Uint8Array {
	const header = new Uint8Array(30);
	const view = new DataView(header.buffer);

	// Magic: 0xC5D0D3C6 (little-endian)
	view.setUint32(0, 0xc5d0d3c6, true);
	// PS offset (not used in this test, but must be valid)
	view.setUint32(4, 30 + tiffBytes.length, true);
	// PS length
	view.setUint32(8, 0, true);
	// WMF offset (none)
	view.setUint32(12, 0, true);
	// WMF length
	view.setUint32(16, 0, true);
	// TIFF offset = right after header
	view.setUint32(20, 30, true);
	// TIFF length
	view.setUint32(24, tiffBytes.length, true);

	const result = new Uint8Array(30 + tiffBytes.length);
	result.set(header);
	result.set(tiffBytes, 30);
	return result;
}

/**
 * Build a synthetic DOS EPS file with only a WMF preview (no TIFF).
 */
function makeDosEpsWithWmf(): Uint8Array {
	const header = new Uint8Array(30 + 10); // header + dummy WMF
	const view = new DataView(header.buffer);

	view.setUint32(0, 0xc5d0d3c6, true);
	view.setUint32(4, 30, true);
	view.setUint32(8, 0, true);
	// WMF offset and length
	view.setUint32(12, 30, true);
	view.setUint32(16, 10, true);
	// No TIFF
	view.setUint32(20, 0, true);
	view.setUint32(24, 0, true);

	return header;
}

/**
 * Build a text EPS with a 1-bit EPSI preview.
 * Creates a 4x2 monochrome preview (all black pixels = 0xFF per byte).
 */
function makeTextEpsWithPreview(): Uint8Array {
	// 4 pixels wide, 1-bit depth → 1 byte per row (ceil(4/8) = 1)
	// 2 rows → 2 hex lines, each with 1 byte = "FF"
	const text = [
		"%!PS-Adobe-3.0 EPSF-3.0",
		"%%BoundingBox: 0 0 4 2",
		"%%BeginPreview: 4 2 1 2",
		"% FF",
		"% FF",
		"%%EndPreview",
		"%%EndComments",
		"",
	].join("\n");
	return new TextEncoder().encode(text);
}

/**
 * Build a text EPS with an 8-bit grayscale EPSI preview.
 * Creates a 2x2 grayscale preview.
 */
function makeTextEpsWithGrayscalePreview(): Uint8Array {
	// 2 pixels wide, 8-bit depth → 2 bytes per row
	// 2 rows → "8080" per line (gray value 0x80 = 128)
	const text = [
		"%!PS-Adobe-3.0 EPSF-3.0",
		"%%BoundingBox: 0 0 2 2",
		"%%BeginPreview: 2 2 8 2",
		"% 8080",
		"% 8080",
		"%%EndPreview",
		"%%EndComments",
		"",
	].join("\n");
	return new TextEncoder().encode(text);
}

/**
 * Build a text EPS without any preview section.
 */
function makeTextEpsNoPreview(): Uint8Array {
	const text = [
		"%!PS-Adobe-3.0 EPSF-3.0",
		"%%BoundingBox: 0 0 100 100",
		"%%EndComments",
		"newpath 0 0 moveto 100 100 lineto stroke",
		"showpage",
		"",
	].join("\n");
	return new TextEncoder().encode(text);
}

describe("decodeEps", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a DOS EPS with TIFF preview via decodeTiff", async () => {
		const fakeWidth = 8;
		const fakeHeight = 4;
		const fakeRgba = new Uint8Array(fakeWidth * fakeHeight * 4);
		fakeRgba.fill(200);

		// Mock the decodeTiff import
		vi.doMock("~/features/image-tools/decoders/decode-tiff", () => ({
			decodeTiff: async () => ({
				data: fakeRgba,
				width: fakeWidth,
				height: fakeHeight,
			}),
		}));

		const { decodeEps } = await import(
			"~/features/image-tools/decoders/decode-eps"
		);

		// Provide some dummy bytes for the "TIFF" section
		const dummyTiff = new Uint8Array(64);
		const dosEps = makeDosEpsWithTiff(dummyTiff);
		const blob = new Blob([dosEps], { type: "application/postscript" });

		const result = await decodeEps(blob);

		expect(result.width).toBe(fakeWidth);
		expect(result.height).toBe(fakeHeight);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(fakeWidth * fakeHeight * 4);
	});

	it("should decode a text EPS with 1-bit EPSI preview", async () => {
		const { decodeEps } = await import(
			"~/features/image-tools/decoders/decode-eps"
		);

		const epsBytes = makeTextEpsWithPreview();
		const blob = new Blob([epsBytes], { type: "application/postscript" });

		const result = await decodeEps(blob);

		expect(result.width).toBe(4);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(4 * 2 * 4); // RGBA

		// All pixels should be black (bit=1 → color=0)
		for (let i = 0; i < 4 * 2; i++) {
			const off = i * 4;
			expect(result.data[off]).toBe(0); // R (black)
			expect(result.data[off + 1]).toBe(0); // G
			expect(result.data[off + 2]).toBe(0); // B
			expect(result.data[off + 3]).toBe(255); // A (opaque)
		}
	});

	it("should decode a text EPS with 8-bit grayscale EPSI preview", async () => {
		const { decodeEps } = await import(
			"~/features/image-tools/decoders/decode-eps"
		);

		const epsBytes = makeTextEpsWithGrayscalePreview();
		const blob = new Blob([epsBytes], { type: "application/postscript" });

		const result = await decodeEps(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 2 * 4);

		// All pixels should be gray (0x80 = 128)
		for (let i = 0; i < 2 * 2; i++) {
			const off = i * 4;
			expect(result.data[off]).toBe(0x80);
			expect(result.data[off + 1]).toBe(0x80);
			expect(result.data[off + 2]).toBe(0x80);
			expect(result.data[off + 3]).toBe(255);
		}
	});

	it("should throw for text EPS without preview", async () => {
		const { decodeEps } = await import(
			"~/features/image-tools/decoders/decode-eps"
		);

		const epsBytes = makeTextEpsNoPreview();
		const blob = new Blob([epsBytes], { type: "application/postscript" });

		await expect(decodeEps(blob)).rejects.toThrow(
			"This EPS file has no embedded preview",
		);
	});

	it("should throw for DOS EPS with only WMF preview", async () => {
		const { decodeEps } = await import(
			"~/features/image-tools/decoders/decode-eps"
		);

		const dosEps = makeDosEpsWithWmf();
		const blob = new Blob([dosEps], { type: "application/postscript" });

		await expect(decodeEps(blob)).rejects.toThrow("WMF preview");
	});

	it("should reject corrupt data (too short)", async () => {
		const { decodeEps } = await import(
			"~/features/image-tools/decoders/decode-eps"
		);

		const blob = new Blob([new Uint8Array(2)], {
			type: "application/postscript",
		});

		await expect(decodeEps(blob)).rejects.toThrow("too small");
	});

	it("should reject data with unrecognized header", async () => {
		const { decodeEps } = await import(
			"~/features/image-tools/decoders/decode-eps"
		);

		const garbage = new Uint8Array(100);
		garbage[0] = 0x00;
		garbage[1] = 0x00;
		garbage[2] = 0x00;
		garbage[3] = 0x00;
		const blob = new Blob([garbage], { type: "application/postscript" });

		await expect(decodeEps(blob)).rejects.toThrow(
			"does not appear to be a valid EPS",
		);
	});

	it("should respect abort signal (pre-aborted)", async () => {
		const { decodeEps } = await import(
			"~/features/image-tools/decoders/decode-eps"
		);

		const epsBytes = makeTextEpsWithPreview();
		const blob = new Blob([epsBytes], { type: "application/postscript" });
		const controller = new AbortController();
		controller.abort();

		await expect(decodeEps(blob, controller.signal)).rejects.toThrow("Aborted");
	});

	it("should reject DOS EPS with TIFF preview extending beyond file", async () => {
		const { decodeEps } = await import(
			"~/features/image-tools/decoders/decode-eps"
		);

		// Create a header that claims TIFF preview is bigger than the file
		const header = new Uint8Array(30);
		const view = new DataView(header.buffer);
		view.setUint32(0, 0xc5d0d3c6, true);
		view.setUint32(4, 30, true);
		view.setUint32(8, 0, true);
		view.setUint32(12, 0, true);
		view.setUint32(16, 0, true);
		view.setUint32(20, 30, true); // TIFF offset
		view.setUint32(24, 9999, true); // TIFF length (way beyond actual file)

		const blob = new Blob([header], { type: "application/postscript" });

		await expect(decodeEps(blob)).rejects.toThrow(
			"extends beyond the file boundary",
		);
	});
});
