import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Build a minimal valid ICNS file containing a single uncompressed ARGB entry.
 *
 * Uses "is32" tag (16x16 = 256 pixels). Channel layout: A, R, G, B interleaved
 * (all A bytes first, then all R, all G, all B). Uncompressed = raw data length
 * equals pixelCount * 4.
 *
 * Fills: A=255, R=0x10, G=0x20, B=0x30 for every pixel.
 */
function makeArgb16x16(): Uint8Array {
	const dim = 16;
	const pixelCount = dim * dim; // 256
	const channelData = pixelCount * 4; // 1024 bytes of ARGB data

	const entryDataSize = channelData;
	const entryTotalSize = 8 + entryDataSize; // tag(4) + size(4) + data
	const fileSize = 8 + entryTotalSize; // header(8) + entry

	const buf = new Uint8Array(fileSize);
	const view = new DataView(buf.buffer);

	// File header: magic "icns" + total file size (big-endian)
	buf[0] = 0x69; // 'i'
	buf[1] = 0x63; // 'c'
	buf[2] = 0x6e; // 'n'
	buf[3] = 0x73; // 's'
	view.setUint32(4, fileSize, false);

	// Entry header: tag "is32" + entry size (big-endian)
	buf[8] = 0x69; // 'i'
	buf[9] = 0x73; // 's'
	buf[10] = 0x33; // '3'
	buf[11] = 0x32; // '2'
	view.setUint32(12, entryTotalSize, false);

	// Channel data starts at offset 16
	const dataStart = 16;

	// A channel: all 255
	for (let i = 0; i < pixelCount; i++) {
		buf[dataStart + i] = 255;
	}
	// R channel: all 0x10
	for (let i = 0; i < pixelCount; i++) {
		buf[dataStart + pixelCount + i] = 0x10;
	}
	// G channel: all 0x20
	for (let i = 0; i < pixelCount; i++) {
		buf[dataStart + pixelCount * 2 + i] = 0x20;
	}
	// B channel: all 0x30
	for (let i = 0; i < pixelCount; i++) {
		buf[dataStart + pixelCount * 3 + i] = 0x30;
	}

	return buf;
}

/**
 * Build an ICNS file containing an "is32" ARGB entry plus an "s8mk" mask entry.
 * The mask overrides the alpha channel from the ARGB data.
 *
 * ARGB: A=0, R=0xAA, G=0xBB, B=0xCC
 * Mask: alpha=128 for every pixel
 */
function makeArgbWithMask16x16(): Uint8Array {
	const dim = 16;
	const pixelCount = dim * dim; // 256

	const argbDataSize = pixelCount * 4; // 1024
	const maskDataSize = pixelCount; // 256
	const argbEntrySize = 8 + argbDataSize;
	const maskEntrySize = 8 + maskDataSize;
	const fileSize = 8 + argbEntrySize + maskEntrySize;

	const buf = new Uint8Array(fileSize);
	const view = new DataView(buf.buffer);

	// File header
	buf[0] = 0x69;
	buf[1] = 0x63;
	buf[2] = 0x6e;
	buf[3] = 0x73;
	view.setUint32(4, fileSize, false);

	// Entry 1: "is32" ARGB
	let off = 8;
	buf[off] = 0x69;
	buf[off + 1] = 0x73;
	buf[off + 2] = 0x33;
	buf[off + 3] = 0x32;
	view.setUint32(off + 4, argbEntrySize, false);
	off += 8;

	// A channel: 0
	for (let i = 0; i < pixelCount; i++) buf[off + i] = 0;
	// R channel: 0xAA
	for (let i = 0; i < pixelCount; i++) buf[off + pixelCount + i] = 0xaa;
	// G channel: 0xBB
	for (let i = 0; i < pixelCount; i++) buf[off + pixelCount * 2 + i] = 0xbb;
	// B channel: 0xCC
	for (let i = 0; i < pixelCount; i++) buf[off + pixelCount * 3 + i] = 0xcc;
	off += argbDataSize;

	// Entry 2: "s8mk" mask
	buf[off] = 0x73;
	buf[off + 1] = 0x38;
	buf[off + 2] = 0x6d;
	buf[off + 3] = 0x6b;
	view.setUint32(off + 4, maskEntrySize, false);
	off += 8;

	// Mask: all 128
	for (let i = 0; i < pixelCount; i++) buf[off + i] = 128;

	return buf;
}

/**
 * Build an ICNS with a PackBits-compressed "is32" entry.
 *
 * Each channel is a run of 256 identical bytes, which PackBits encodes as
 * repeated runs of 128 bytes each.
 *
 * PackBits encoding for 256 identical bytes of value V:
 *   [0x81, V] → repeat V 128 times (257 - 129 = 128)
 *   [0x81, V] → repeat V 128 times
 * Total: 4 bytes per channel, 16 bytes for all 4 channels.
 *
 * Values: A=255, R=0x40, G=0x50, B=0x60
 */
function makePackBitsArgb16x16(): Uint8Array {
	// Each channel: 2 PackBits runs of 128 = 4 bytes per channel (16x16 = 256 pixels)
	const compressedChannel = (value: number): Uint8Array => {
		// 0x81 means repeat next byte (257 - 0x81) = (257 - 129) = 128 times
		return new Uint8Array([0x81, value, 0x81, value]);
	};

	const aChannel = compressedChannel(255);
	const rChannel = compressedChannel(0x40);
	const gChannel = compressedChannel(0x50);
	const bChannel = compressedChannel(0x60);

	const compressedData = new Uint8Array(
		aChannel.length + rChannel.length + gChannel.length + bChannel.length,
	);
	let pos = 0;
	compressedData.set(aChannel, pos);
	pos += aChannel.length;
	compressedData.set(rChannel, pos);
	pos += rChannel.length;
	compressedData.set(gChannel, pos);
	pos += gChannel.length;
	compressedData.set(bChannel, pos);

	const entryTotalSize = 8 + compressedData.length;
	const fileSize = 8 + entryTotalSize;

	const buf = new Uint8Array(fileSize);
	const view = new DataView(buf.buffer);

	// File header
	buf[0] = 0x69;
	buf[1] = 0x63;
	buf[2] = 0x6e;
	buf[3] = 0x73;
	view.setUint32(4, fileSize, false);

	// Entry: "is32"
	buf[8] = 0x69;
	buf[9] = 0x73;
	buf[10] = 0x33;
	buf[11] = 0x32;
	view.setUint32(12, entryTotalSize, false);

	buf.set(compressedData, 16);

	return buf;
}

describe("decodeIcns", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode an uncompressed ARGB entry to correct RGBA pixels", async () => {
		const icns = makeArgb16x16();
		const blob = new Blob([icns], { type: "image/x-icns" });

		const { decodeIcns } = await import(
			"~/features/image-tools/decoders/decode-icns"
		);
		const result = await decodeIcns(blob);

		expect(result.width).toBe(16);
		expect(result.height).toBe(16);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(16 * 16 * 4);

		// Check first pixel: RGBA = (0x10, 0x20, 0x30, 255)
		expect(result.data[0]).toBe(0x10); // R
		expect(result.data[1]).toBe(0x20); // G
		expect(result.data[2]).toBe(0x30); // B
		expect(result.data[3]).toBe(255); // A

		// Check last pixel is the same (uniform fill)
		const lastPixelOffset = (16 * 16 - 1) * 4;
		expect(result.data[lastPixelOffset]).toBe(0x10);
		expect(result.data[lastPixelOffset + 1]).toBe(0x20);
		expect(result.data[lastPixelOffset + 2]).toBe(0x30);
		expect(result.data[lastPixelOffset + 3]).toBe(255);
	});

	it("should apply mask entry alpha to ARGB pixels", async () => {
		const icns = makeArgbWithMask16x16();
		const blob = new Blob([icns], { type: "image/x-icns" });

		const { decodeIcns } = await import(
			"~/features/image-tools/decoders/decode-icns"
		);
		const result = await decodeIcns(blob);

		expect(result.width).toBe(16);
		expect(result.height).toBe(16);

		// Check pixel: RGBA = (0xAA, 0xBB, 0xCC, 128) — mask overrides A
		expect(result.data[0]).toBe(0xaa); // R
		expect(result.data[1]).toBe(0xbb); // G
		expect(result.data[2]).toBe(0xcc); // B
		expect(result.data[3]).toBe(128); // A from mask
	});

	it("should decompress PackBits-encoded ARGB entry", async () => {
		const icns = makePackBitsArgb16x16();
		const blob = new Blob([icns], { type: "image/x-icns" });

		const { decodeIcns } = await import(
			"~/features/image-tools/decoders/decode-icns"
		);
		const result = await decodeIcns(blob);

		expect(result.width).toBe(16);
		expect(result.height).toBe(16);
		expect(result.data.length).toBe(16 * 16 * 4);

		// Check first pixel: RGBA = (0x40, 0x50, 0x60, 255)
		expect(result.data[0]).toBe(0x40); // R
		expect(result.data[1]).toBe(0x50); // G
		expect(result.data[2]).toBe(0x60); // B
		expect(result.data[3]).toBe(255); // A
	});

	it("should reject on corrupt data (too short)", async () => {
		const blob = new Blob([new Uint8Array(4)], { type: "image/x-icns" });

		const { decodeIcns } = await import(
			"~/features/image-tools/decoders/decode-icns"
		);

		await expect(decodeIcns(blob)).rejects.toThrow("header is too short");
	});

	it("should reject on invalid magic bytes", async () => {
		const buf = new Uint8Array(16);
		// Wrong magic
		buf[0] = 0x00;
		buf[1] = 0x00;
		buf[2] = 0x00;
		buf[3] = 0x00;
		const view = new DataView(buf.buffer);
		view.setUint32(4, 16, false);

		const blob = new Blob([buf], { type: "image/x-icns" });

		const { decodeIcns } = await import(
			"~/features/image-tools/decoders/decode-icns"
		);

		await expect(decodeIcns(blob)).rejects.toThrow("Invalid magic bytes");
	});

	it("should reject when no valid entries found", async () => {
		const buf = new Uint8Array(16);
		// Valid magic but entry has invalid size
		buf[0] = 0x69;
		buf[1] = 0x63;
		buf[2] = 0x6e;
		buf[3] = 0x73;
		const view = new DataView(buf.buffer);
		view.setUint32(4, 16, false);
		// Entry with tag "XXXX" and size 4 (less than minimum 8)
		buf[8] = 0x58;
		buf[9] = 0x58;
		buf[10] = 0x58;
		buf[11] = 0x58;
		view.setUint32(12, 4, false);

		const blob = new Blob([buf], { type: "image/x-icns" });

		const { decodeIcns } = await import(
			"~/features/image-tools/decoders/decode-icns"
		);

		await expect(decodeIcns(blob)).rejects.toThrow("No valid entries");
	});

	it("should respect abort signal", async () => {
		const icns = makeArgb16x16();
		const blob = new Blob([icns], { type: "image/x-icns" });
		const controller = new AbortController();
		controller.abort();

		const { decodeIcns } = await import(
			"~/features/image-tools/decoders/decode-icns"
		);

		await expect(decodeIcns(blob, controller.signal)).rejects.toThrow(
			"Aborted",
		);
	});
});
