import { describe, expect, it } from "vitest";
import { detectAnimation } from "~/features/image-tools/lib/detect-animation";

/** Helper to create a File from a Uint8Array with the given name and MIME type. */
function makeFile(bytes: Uint8Array, name: string, type: string): File {
	return new File([bytes.buffer as ArrayBuffer], name, { type });
}

// ─── GIF helpers ─────────────────────────────────────────────

/**
 * Build a minimal valid GIF89a binary with `frameCount` frames.
 *
 * Structure:
 *   Header (6) + Logical Screen Descriptor (7) + [Image Descriptor (10) +
 *   LZW min code (1) + data sub-block (2) + block terminator (1)] * N + Trailer (1)
 *
 * Each frame uses a 1x1 image with a trivial LZW stream.
 */
function buildGif(frameCount: number): Uint8Array {
	const parts: number[] = [];

	// GIF89a header
	parts.push(
		0x47,
		0x49,
		0x46,
		0x38,
		0x39,
		0x61, // "GIF89a"
		0x01,
		0x00, // width = 1
		0x01,
		0x00, // height = 1
		0x00, // packed (no GCT)
		0x00, // bg color index
		0x00, // pixel aspect ratio
	);

	for (let i = 0; i < frameCount; i++) {
		// Image Descriptor
		parts.push(
			0x2c, // image separator
			0x00,
			0x00, // left
			0x00,
			0x00, // top
			0x01,
			0x00, // width = 1
			0x01,
			0x00, // height = 1
			0x00, // packed (no LCT)
		);
		// LZW minimum code size
		parts.push(0x02);
		// One data sub-block: 1 byte of data
		parts.push(0x01, 0x00);
		// Block terminator
		parts.push(0x00);
	}

	// Trailer
	parts.push(0x3b);

	return new Uint8Array(parts);
}

// ─── PNG / APNG helpers ──────────────────────────────────────

/** Build a 4-byte big-endian uint32. */
function uint32BE(n: number): number[] {
	return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

/** Build a PNG chunk (without CRC — detection code doesn't verify CRC). */
function pngChunk(type: string, data: number[]): number[] {
	const typeBytes = [...type].map((c) => c.charCodeAt(0));
	return [
		...uint32BE(data.length), // chunk length
		...typeBytes, // chunk type
		...data, // chunk data
		0x00,
		0x00,
		0x00,
		0x00, // CRC placeholder
	];
}

/**
 * Build a minimal PNG-like binary.
 * If `numFrames` > 0, includes an acTL chunk with that frame count.
 */
function buildPng(numFrames: number | null): Uint8Array {
	const parts: number[] = [];

	// PNG signature
	parts.push(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);

	// IHDR chunk (13 bytes of data)
	const ihdrData = [
		...uint32BE(1), // width
		...uint32BE(1), // height
		0x08, // bit depth
		0x02, // color type (RGB)
		0x00, // compression
		0x00, // filter
		0x00, // interlace
	];
	parts.push(...pngChunk("IHDR", ihdrData));

	// acTL chunk (if animated)
	if (numFrames !== null) {
		const actlData = [
			...uint32BE(numFrames), // num_frames
			...uint32BE(0), // num_plays (0 = infinite)
		];
		parts.push(...pngChunk("acTL", actlData));
	}

	// IEND chunk
	parts.push(...pngChunk("IEND", []));

	return new Uint8Array(parts);
}

// ─── WebP helpers ────────────────────────────────────────────

/** Build a 4-byte little-endian uint32. */
function uint32LE(n: number): number[] {
	return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
}

/**
 * Build a minimal WebP binary.
 * If `animated` is true, sets the animation bit in VP8X and adds `anmfCount` ANMF chunks.
 */
function buildWebp(animated: boolean, anmfCount = 0): Uint8Array {
	const chunks: number[] = [];

	// VP8X chunk: 10 bytes payload
	const flags = animated ? 0x02 : 0x00;
	const vp8xPayload = [
		flags, // flags
		0x00,
		0x00,
		0x00, // reserved
		0x00,
		0x00,
		0x00, // canvas width - 1 (24 bits LE)
		0x00,
		0x00,
		0x00, // canvas height - 1 (24 bits LE)
	];
	chunks.push(
		0x56,
		0x50,
		0x38,
		0x58, // "VP8X"
		...uint32LE(vp8xPayload.length),
		...vp8xPayload,
	);

	// ANMF chunks (minimal: 24 bytes each with empty frame data)
	for (let i = 0; i < anmfCount; i++) {
		const anmfPayload = new Array(24).fill(0);
		chunks.push(
			0x41,
			0x4e,
			0x4d,
			0x46, // "ANMF"
			...uint32LE(anmfPayload.length),
			...anmfPayload,
		);
	}

	// RIFF wrapper
	const riffContent = [
		0x57,
		0x45,
		0x42,
		0x50, // "WEBP"
		...chunks,
	];
	const riffHeader = [
		0x52,
		0x49,
		0x46,
		0x46, // "RIFF"
		...uint32LE(riffContent.length),
	];

	return new Uint8Array([...riffHeader, ...riffContent]);
}

// ─── AVIF helpers ────────────────────────────────────────────

/**
 * Build a minimal AVIF ftyp box.
 * `compatibleBrands` is an array of 4-char brand strings.
 */
function buildAvif(compatibleBrands: string[]): Uint8Array {
	const parts: number[] = [];

	const brandBytes = compatibleBrands.flatMap((b) =>
		[...b].map((c) => c.charCodeAt(0)),
	);

	// ftyp box: size (4) + "ftyp" (4) + major_brand (4) + minor_version (4) + compatible_brands
	const boxSize = 8 + 4 + 4 + brandBytes.length;
	parts.push(
		...uint32BE(boxSize),
		0x66,
		0x74,
		0x79,
		0x70, // "ftyp"
		0x61,
		0x76,
		0x69,
		0x66, // major_brand = "avif"
		0x00,
		0x00,
		0x00,
		0x00, // minor_version = 0
		...brandBytes,
	);

	return new Uint8Array(parts);
}

// ─── Tests ───────────────────────────────────────────────────

describe("detectAnimation", () => {
	describe("GIF", () => {
		it("detects animated GIF with 2 frames", async () => {
			const data = buildGif(2);
			const file = makeFile(data, "test.gif", "image/gif");
			const result = await detectAnimation(file);
			expect(result).not.toBeNull();
			expect(result?.isAnimated).toBe(true);
			expect(result?.frameCount).toBe(2);
			expect(result?.format).toBe("GIF");
		});

		it("detects single-frame GIF as not animated", async () => {
			const data = buildGif(1);
			const file = makeFile(data, "test.gif", "image/gif");
			const result = await detectAnimation(file);
			expect(result).not.toBeNull();
			expect(result?.isAnimated).toBe(false);
			expect(result?.frameCount).toBe(1);
		});

		it("detects animated GIF with 5 frames", async () => {
			const data = buildGif(5);
			const file = makeFile(data, "test.gif", "image/gif");
			const result = await detectAnimation(file);
			expect(result).not.toBeNull();
			expect(result?.isAnimated).toBe(true);
			expect(result?.frameCount).toBe(5);
		});
	});

	describe("PNG / APNG", () => {
		it("detects APNG with acTL chunk as animated", async () => {
			const data = buildPng(3);
			const file = makeFile(data, "test.png", "image/png");
			const result = await detectAnimation(file);
			expect(result).not.toBeNull();
			expect(result?.isAnimated).toBe(true);
			expect(result?.frameCount).toBe(3);
			expect(result?.format).toBe("APNG");
		});

		it("detects PNG without acTL chunk as not animated", async () => {
			const data = buildPng(null);
			const file = makeFile(data, "test.png", "image/png");
			const result = await detectAnimation(file);
			expect(result).not.toBeNull();
			expect(result?.isAnimated).toBe(false);
			expect(result?.frameCount).toBe(1);
			expect(result?.format).toBe("PNG");
		});

		it("detects APNG with 1 frame as not animated", async () => {
			const data = buildPng(1);
			const file = makeFile(data, "test.png", "image/png");
			const result = await detectAnimation(file);
			expect(result).not.toBeNull();
			expect(result?.isAnimated).toBe(false);
			expect(result?.frameCount).toBe(1);
			expect(result?.format).toBe("APNG");
		});
	});

	describe("WebP", () => {
		it("detects animated WebP with ANMF chunks", async () => {
			const data = buildWebp(true, 4);
			const file = makeFile(data, "test.webp", "image/webp");
			const result = await detectAnimation(file);
			expect(result).not.toBeNull();
			expect(result?.isAnimated).toBe(true);
			expect(result?.frameCount).toBe(4);
			expect(result?.format).toBe("WebP");
		});

		it("detects static WebP as not animated", async () => {
			const data = buildWebp(false);
			const file = makeFile(data, "test.webp", "image/webp");
			const result = await detectAnimation(file);
			expect(result).not.toBeNull();
			expect(result?.isAnimated).toBe(false);
			expect(result?.frameCount).toBe(1);
		});

		it("detects animated WebP flag without ANMF chunks", async () => {
			const data = buildWebp(true, 0);
			const file = makeFile(data, "test.webp", "image/webp");
			const result = await detectAnimation(file);
			expect(result).not.toBeNull();
			expect(result?.isAnimated).toBe(true);
			expect(result?.frameCount).toBe(0);
		});
	});

	describe("AVIF", () => {
		it("detects animated AVIF with avis brand", async () => {
			const data = buildAvif(["avif", "avis"]);
			const file = makeFile(data, "test.avif", "image/avif");
			const result = await detectAnimation(file);
			expect(result).not.toBeNull();
			expect(result?.isAnimated).toBe(true);
			expect(result?.frameCount).toBe(0); // frame count not available for AVIF
			expect(result?.format).toBe("AVIF");
		});

		it("detects static AVIF without avis brand", async () => {
			const data = buildAvif(["avif", "mif1"]);
			const file = makeFile(data, "test.avif", "image/avif");
			const result = await detectAnimation(file);
			expect(result).not.toBeNull();
			expect(result?.isAnimated).toBe(false);
			expect(result?.frameCount).toBe(1);
		});
	});

	describe("unsupported formats", () => {
		it("returns null for JPEG", async () => {
			const data = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
			const file = makeFile(data, "test.jpg", "image/jpeg");
			const result = await detectAnimation(file);
			expect(result).toBeNull();
		});

		it("returns null for TIFF", async () => {
			const data = new Uint8Array([0x49, 0x49, 0x2a, 0x00]);
			const file = makeFile(data, "test.tiff", "image/tiff");
			const result = await detectAnimation(file);
			expect(result).toBeNull();
		});

		it("returns null for non-image file", async () => {
			const data = new Uint8Array([0x00, 0x00, 0x00]);
			const file = makeFile(data, "test.txt", "text/plain");
			const result = await detectAnimation(file);
			expect(result).toBeNull();
		});
	});
});
