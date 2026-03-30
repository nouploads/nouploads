import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Build a minimal synthetic 2x1 uncompressed EXR file (scanline, half-float).
 *
 * Layout:
 * - Magic: 76 2F 31 01
 * - Version: 2, scanline
 * - Header attributes: channels (R, G, B half-float), compression (0=none),
 *   dataWindow (0,0,1,0), displayWindow (0,0,1,0)
 * - Offset table: 1 entry (1 scanline)
 * - Scanline block: y=0, data size, then channel data (B, G, R alphabetical)
 *
 * Pixel 1: R=1.0, G=0.5, B=0.0  (half: 0x3C00, 0x3800, 0x0000)
 *   Reinhard: R=1/(1+1)=0.5→128, G=0.5/1.5≈0.333→85, B=0→0
 * Pixel 2: R=0.0, G=0.0, B=1.0  (half: 0x0000, 0x0000, 0x3C00)
 *   Reinhard: R=0→0, G=0→0, B=1/(1+1)=0.5→128
 */
function buildMinimalExr(): Uint8Array {
	const parts: Uint8Array[] = [];

	// Magic number (little-endian: 0x762F3101)
	parts.push(new Uint8Array([0x76, 0x2f, 0x31, 0x01]));

	// Version field: version 2, no flags (scanline)
	parts.push(le32(2));

	// --- Header attributes ---

	// channels attribute (chlist)
	// Channels must be sorted alphabetically: B, G, R
	const channelData = buildChannelList([
		{ name: "B", pixelType: 1 },
		{ name: "G", pixelType: 1 },
		{ name: "R", pixelType: 1 },
	]);
	parts.push(nullStr("channels"));
	parts.push(nullStr("chlist"));
	parts.push(le32(channelData.length));
	parts.push(channelData);

	// compression attribute: 0 = none
	parts.push(nullStr("compression"));
	parts.push(nullStr("compression"));
	parts.push(le32(1));
	parts.push(new Uint8Array([0]));

	// dataWindow attribute: box2i (0, 0, 1, 0) — 2 pixels wide, 1 pixel tall
	parts.push(nullStr("dataWindow"));
	parts.push(nullStr("box2i"));
	parts.push(le32(16));
	parts.push(le32Signed(0));
	parts.push(le32Signed(0));
	parts.push(le32Signed(1));
	parts.push(le32Signed(0));

	// displayWindow attribute: same as dataWindow
	parts.push(nullStr("displayWindow"));
	parts.push(nullStr("box2i"));
	parts.push(le32(16));
	parts.push(le32Signed(0));
	parts.push(le32Signed(0));
	parts.push(le32Signed(1));
	parts.push(le32Signed(0));

	// End of header (empty name)
	parts.push(new Uint8Array([0]));

	// --- Offset table ---
	// We'll fill this in after we know the scanline block position
	const offsetTableIndex = parts.length;
	// Placeholder for 8-byte offset (will be overwritten)
	parts.push(new Uint8Array(8));

	// --- Scanline block ---

	// y coordinate (int32)
	parts.push(le32Signed(0));

	// Channel data for 1 scanline, 2 pixels, channels in alphabetical order (B, G, R)
	// Each channel: 2 pixels * 2 bytes (half-float) = 4 bytes per channel
	// Pixel 1: R=1.0, G=0.5, B=0.0
	// Pixel 2: R=0.0, G=0.0, B=1.0
	// Stored alphabetically: B first, then G, then R
	const B_data = new Uint8Array([
		...le16(0x0000), // B pixel1 = 0.0
		...le16(0x3c00), // B pixel2 = 1.0
	]);
	const G_data = new Uint8Array([
		...le16(0x3800), // G pixel1 = 0.5
		...le16(0x0000), // G pixel2 = 0.0
	]);
	const R_data = new Uint8Array([
		...le16(0x3c00), // R pixel1 = 1.0
		...le16(0x0000), // R pixel2 = 0.0
	]);

	const pixelData = concat(B_data, G_data, R_data);

	// Data size (int32)
	parts.push(le32(pixelData.length));
	parts.push(pixelData);

	// Fix up the offset table — points to the scanline block start (y coordinate)
	let offsetToScanline = 0;
	for (let i = 0; i < offsetTableIndex + 1; i++) {
		offsetToScanline += parts[i].length;
	}
	// Write the offset as a 64-bit little-endian value
	const offsetBytes = new Uint8Array(8);
	const offsetView = new DataView(offsetBytes.buffer);
	offsetView.setUint32(0, offsetToScanline, true);
	offsetView.setUint32(4, 0, true);
	parts[offsetTableIndex] = offsetBytes;

	return concatAll(parts);
}

function nullStr(s: string): Uint8Array {
	const encoded = new TextEncoder().encode(s);
	const result = new Uint8Array(encoded.length + 1);
	result.set(encoded);
	result[encoded.length] = 0;
	return result;
}

function le32(v: number): Uint8Array {
	const buf = new Uint8Array(4);
	new DataView(buf.buffer).setUint32(0, v, true);
	return buf;
}

function le32Signed(v: number): Uint8Array {
	const buf = new Uint8Array(4);
	new DataView(buf.buffer).setInt32(0, v, true);
	return buf;
}

function le16(v: number): Uint8Array {
	const buf = new Uint8Array(2);
	new DataView(buf.buffer).setUint16(0, v, true);
	return buf;
}

function buildChannelList(
	channels: Array<{ name: string; pixelType: number }>,
): Uint8Array {
	const parts: Uint8Array[] = [];
	for (const ch of channels) {
		parts.push(nullStr(ch.name)); // name + null
		parts.push(le32(ch.pixelType)); // pixel type
		parts.push(new Uint8Array([0, 0, 0, 0])); // pLinear + reserved
		parts.push(le32(1)); // xSampling
		parts.push(le32(1)); // ySampling
	}
	// Terminating null byte
	parts.push(new Uint8Array([0]));
	return concatAll(parts);
}

function concat(a: Uint8Array, b: Uint8Array, c: Uint8Array): Uint8Array {
	const result = new Uint8Array(a.length + b.length + c.length);
	result.set(a);
	result.set(b, a.length);
	result.set(c, a.length + b.length);
	return result;
}

function concatAll(parts: Uint8Array[]): Uint8Array {
	const total = parts.reduce((s, p) => s + p.length, 0);
	const result = new Uint8Array(total);
	let offset = 0;
	for (const p of parts) {
		result.set(p, offset);
		offset += p.length;
	}
	return result;
}

describe("decodeExr", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a synthetic uncompressed EXR file to RGBA pixels", async () => {
		const exr = buildMinimalExr();
		const blob = new Blob([exr], { type: "image/x-exr" });

		const { decodeExr } = await import(
			"~/features/image-tools/decoders/decode-exr"
		);
		const result = await decodeExr(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(1);
		expect(result.data).toBeInstanceOf(Uint8Array);
		// RGBA = 4 bytes per pixel, 2 pixels
		expect(result.data.length).toBe(2 * 1 * 4);

		// Pixel 1: R=1.0, G=0.5, B=0.0
		// Reinhard: R=1/(1+1)=0.5→128, G=0.5/1.5≈0.333→85, B=0→0
		// R channel
		expect(result.data[0]).toBeGreaterThan(120);
		expect(result.data[0]).toBeLessThan(135);
		// G channel
		expect(result.data[1]).toBeGreaterThan(75);
		expect(result.data[1]).toBeLessThan(95);
		// B channel
		expect(result.data[2]).toBe(0);
		// Alpha = 255 (no alpha channel → default 1.0)
		expect(result.data[3]).toBe(255);

		// Pixel 2: R=0.0, G=0.0, B=1.0
		// R and G = 0
		expect(result.data[4]).toBe(0);
		expect(result.data[5]).toBe(0);
		// B = Reinhard(1.0) = 0.5 → 128
		expect(result.data[6]).toBeGreaterThan(120);
		expect(result.data[6]).toBeLessThan(135);
		// Alpha = 255
		expect(result.data[7]).toBe(255);
	});

	it("should reject on corrupt data", async () => {
		const blob = new Blob([new Uint8Array(100)], { type: "image/x-exr" });

		const { decodeExr } = await import(
			"~/features/image-tools/decoders/decode-exr"
		);

		await expect(decodeExr(blob)).rejects.toThrow();
	});

	it("should reject on data too small to be EXR", async () => {
		const blob = new Blob([new Uint8Array(4)], { type: "image/x-exr" });

		const { decodeExr } = await import(
			"~/features/image-tools/decoders/decode-exr"
		);

		await expect(decodeExr(blob)).rejects.toThrow("too small");
	});

	it("should reject on invalid magic number", async () => {
		const data = new Uint8Array(100);
		data[0] = 0xff;
		data[1] = 0xd8;
		const blob = new Blob([data], { type: "image/x-exr" });

		const { decodeExr } = await import(
			"~/features/image-tools/decoders/decode-exr"
		);

		await expect(decodeExr(blob)).rejects.toThrow("magic number");
	});

	it("should respect abort signal", async () => {
		const exr = buildMinimalExr();
		const blob = new Blob([exr], { type: "image/x-exr" });
		const controller = new AbortController();
		controller.abort();

		const { decodeExr } = await import(
			"~/features/image-tools/decoders/decode-exr"
		);

		await expect(decodeExr(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
