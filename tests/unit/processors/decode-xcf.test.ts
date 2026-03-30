import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Build a minimal valid XCF file with a single RGB layer and one 64x64 tile.
 * Uses uncompressed tile storage (compression=0) with "file\0" version.
 *
 * Structure:
 *   Header: "gimp xcf file\0" + width(4) + height(4) + baseType(4)
 *   Properties: PROP_COMPRESSION(type=17, len=1, value=compression) + PROP_END
 *   Layer pointer list: [layerOffset, 0]
 *   Layer: width(4) + height(4) + type(4) + name(len+str) + properties + hierPtr + maskPtr(0)
 *   Hierarchy: width(4) + height(4) + bpp(4) + levelPtr
 *   Level: width(4) + height(4) + tileOffset + 0
 *   Tile: raw pixel data (width * height * bpp bytes, interleaved per pixel)
 */
function makeMinimalXcf(options?: {
	width?: number;
	height?: number;
	compression?: number;
	baseType?: number;
	layerType?: number;
	pixelFill?: number[];
	visible?: boolean;
	opacity?: number;
}): Uint8Array {
	const w = options?.width ?? 2;
	const h = options?.height ?? 2;
	const compression = options?.compression ?? 0;
	const baseType = options?.baseType ?? 0; // RGB
	const layerType = options?.layerType ?? 0; // RGB (3 bpp)
	const visible = options?.visible ?? true;
	const opacity = options?.opacity ?? 255;

	const bpp =
		layerType === 1
			? 4
			: layerType === 0
				? 3
				: layerType === 2
					? 1
					: layerType === 3
						? 2
						: 3;

	const parts: number[] = [];

	function writeU32(val: number) {
		parts.push(
			(val >>> 24) & 0xff,
			(val >>> 16) & 0xff,
			(val >>> 8) & 0xff,
			val & 0xff,
		);
	}

	function writeI32(val: number) {
		writeU32(val >>> 0);
	}

	// --- Header ---
	// "gimp xcf file\0"
	const magic = "gimp xcf file\0";
	for (let i = 0; i < magic.length; i++) parts.push(magic.charCodeAt(i));

	writeU32(w); // width
	writeU32(h); // height
	writeU32(baseType); // base type

	// --- Image properties ---
	// PROP_COMPRESSION (type=17, len=1)
	writeU32(17);
	writeU32(1);
	parts.push(compression);

	// PROP_END
	writeU32(0);
	writeU32(0);

	// --- Layer pointer list ---
	// We'll fill in the actual layer offset after building the layer.
	// For now, record where the pointer sits.
	const layerPtrPos = parts.length;
	writeU32(0); // placeholder for layer offset
	writeU32(0); // null terminator

	// --- Layer ---
	const layerOffset = parts.length;

	writeU32(w); // layer width
	writeU32(h); // layer height
	writeU32(layerType); // layer type

	// Layer name: uint32 length (including null) + "L\0"
	writeU32(2);
	parts.push(0x4c, 0x00); // "L\0"

	// Layer properties
	// PROP_VISIBLE (type=8, len=4)
	writeU32(8);
	writeU32(4);
	writeU32(visible ? 1 : 0);

	// PROP_OPACITY (type=6, len=4)
	writeU32(6);
	writeU32(4);
	writeU32(opacity);

	// PROP_OFFSETS (type=15, len=8)
	writeU32(15);
	writeU32(8);
	writeI32(0); // offsetX
	writeI32(0); // offsetY

	// PROP_MODE (type=7, len=4)
	writeU32(7);
	writeU32(4);
	writeU32(0); // Normal

	// PROP_END
	writeU32(0);
	writeU32(0);

	// Hierarchy pointer (will fill in)
	const hierPtrPos = parts.length;
	writeU32(0); // placeholder
	writeU32(0); // mask pointer (none)

	// --- Hierarchy ---
	const hierOffset = parts.length;
	writeU32(w);
	writeU32(h);
	writeU32(bpp);

	// Level pointer (will fill in)
	const levelPtrPos = parts.length;
	writeU32(0); // placeholder
	writeU32(0); // null terminator for level list

	// --- Level ---
	const levelOffset = parts.length;
	writeU32(w);
	writeU32(h);

	// Tile offset (will fill in)
	const tilePtrPos = parts.length;
	writeU32(0); // placeholder
	writeU32(0); // null terminator

	// --- Tile data ---
	const tileOffset = parts.length;
	const pixelCount = w * h;
	const fill = options?.pixelFill ?? [255, 0, 0]; // default: red

	if (compression === 0) {
		// Uncompressed: bpp bytes per pixel, interleaved
		for (let i = 0; i < pixelCount; i++) {
			for (let c = 0; c < bpp; c++) {
				parts.push(fill[c] ?? 255);
			}
		}
	} else if (compression === 1) {
		// RLE: for each channel, write a literal run of pixelCount identical values
		for (let c = 0; c < bpp; c++) {
			const val = fill[c] ?? 255;
			// Use literal run: n <= 126 means n+1 literals
			// For small pixel counts (<=127), one run is enough
			let remaining = pixelCount;
			while (remaining > 0) {
				if (remaining <= 127) {
					parts.push(remaining - 1); // n = remaining - 1
					for (let j = 0; j < remaining; j++) parts.push(val);
					remaining = 0;
				} else {
					parts.push(126); // 127 literals
					for (let j = 0; j < 127; j++) parts.push(val);
					remaining -= 127;
				}
			}
		}
	}

	// --- Patch pointers ---
	// Layer pointer
	parts[layerPtrPos] = (layerOffset >>> 24) & 0xff;
	parts[layerPtrPos + 1] = (layerOffset >>> 16) & 0xff;
	parts[layerPtrPos + 2] = (layerOffset >>> 8) & 0xff;
	parts[layerPtrPos + 3] = layerOffset & 0xff;

	// Hierarchy pointer
	parts[hierPtrPos] = (hierOffset >>> 24) & 0xff;
	parts[hierPtrPos + 1] = (hierOffset >>> 16) & 0xff;
	parts[hierPtrPos + 2] = (hierOffset >>> 8) & 0xff;
	parts[hierPtrPos + 3] = hierOffset & 0xff;

	// Level pointer
	parts[levelPtrPos] = (levelOffset >>> 24) & 0xff;
	parts[levelPtrPos + 1] = (levelOffset >>> 16) & 0xff;
	parts[levelPtrPos + 2] = (levelOffset >>> 8) & 0xff;
	parts[levelPtrPos + 3] = levelOffset & 0xff;

	// Tile pointer
	parts[tilePtrPos] = (tileOffset >>> 24) & 0xff;
	parts[tilePtrPos + 1] = (tileOffset >>> 16) & 0xff;
	parts[tilePtrPos + 2] = (tileOffset >>> 8) & 0xff;
	parts[tilePtrPos + 3] = tileOffset & 0xff;

	return new Uint8Array(parts);
}

describe("decodeXcf", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a minimal 2x2 RGB XCF to correct RGBA pixels", async () => {
		const xcf = makeMinimalXcf({
			width: 2,
			height: 2,
			pixelFill: [255, 0, 0], // red
		});
		const blob = new Blob([xcf], { type: "image/x-xcf" });

		const { decodeXcf } = await import(
			"~/features/image-tools/decoders/decode-xcf"
		);
		const result = await decodeXcf(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 2 * 4);

		// All pixels should be red (255,0,0,255)
		for (let i = 0; i < 4; i++) {
			const off = i * 4;
			expect(result.data[off]).toBe(255); // R
			expect(result.data[off + 1]).toBe(0); // G
			expect(result.data[off + 2]).toBe(0); // B
			expect(result.data[off + 3]).toBe(255); // A
		}
	});

	it("should decode a 2x2 RGBA XCF with semi-transparent pixels", async () => {
		const xcf = makeMinimalXcf({
			width: 2,
			height: 2,
			layerType: 1, // RGBA
			pixelFill: [0, 255, 0, 128], // green at 50% alpha
		});
		const blob = new Blob([xcf], { type: "image/x-xcf" });

		const { decodeXcf } = await import(
			"~/features/image-tools/decoders/decode-xcf"
		);
		const result = await decodeXcf(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);

		// Check first pixel: green with ~128 alpha, composited onto transparent canvas
		// srcA = 128/255 * 255/255 / 255 ≈ 0.502, canvas starts transparent
		// outA = srcA = 0.502, outRGB = green
		expect(result.data[0]).toBe(0); // R
		expect(result.data[1]).toBe(255); // G
		expect(result.data[2]).toBe(0); // B
		// Alpha should be approximately 128
		expect(result.data[3]).toBeGreaterThan(100);
		expect(result.data[3]).toBeLessThan(160);
	});

	it("should decode RLE-compressed tile data", async () => {
		const xcf = makeMinimalXcf({
			width: 2,
			height: 2,
			compression: 1, // RLE
			pixelFill: [0, 0, 255], // blue
		});
		const blob = new Blob([xcf], { type: "image/x-xcf" });

		const { decodeXcf } = await import(
			"~/features/image-tools/decoders/decode-xcf"
		);
		const result = await decodeXcf(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);

		// All pixels should be blue (0,0,255,255)
		for (let i = 0; i < 4; i++) {
			const off = i * 4;
			expect(result.data[off]).toBe(0); // R
			expect(result.data[off + 1]).toBe(0); // G
			expect(result.data[off + 2]).toBe(255); // B
			expect(result.data[off + 3]).toBe(255); // A
		}
	});

	it("should skip invisible layers", async () => {
		const xcf = makeMinimalXcf({
			width: 2,
			height: 2,
			visible: false,
			pixelFill: [255, 0, 0],
		});
		const blob = new Blob([xcf], { type: "image/x-xcf" });

		const { decodeXcf } = await import(
			"~/features/image-tools/decoders/decode-xcf"
		);

		await expect(decodeXcf(blob)).rejects.toThrow("No visible layers found");
	});

	it("should reject on corrupt data (too short)", async () => {
		const blob = new Blob([new Uint8Array(10)], { type: "image/x-xcf" });

		const { decodeXcf } = await import(
			"~/features/image-tools/decoders/decode-xcf"
		);

		await expect(decodeXcf(blob)).rejects.toThrow("too short");
	});

	it("should reject on invalid magic bytes", async () => {
		const bad = new Uint8Array(100);
		bad.set(new TextEncoder().encode("not a xcf!"));
		const blob = new Blob([bad], { type: "image/x-xcf" });

		const { decodeXcf } = await import(
			"~/features/image-tools/decoders/decode-xcf"
		);

		await expect(decodeXcf(blob)).rejects.toThrow("Invalid magic bytes");
	});

	it("should reject when dimensions are zero", async () => {
		const xcf = makeMinimalXcf({ width: 0, height: 2 });
		const blob = new Blob([xcf], { type: "image/x-xcf" });

		const { decodeXcf } = await import(
			"~/features/image-tools/decoders/decode-xcf"
		);

		await expect(decodeXcf(blob)).rejects.toThrow("dimensions are zero");
	});

	it("should respect abort signal (pre-aborted)", async () => {
		const { decodeXcf } = await import(
			"~/features/image-tools/decoders/decode-xcf"
		);
		const blob = new Blob([new Uint8Array(100)], { type: "image/x-xcf" });
		const controller = new AbortController();
		controller.abort();

		await expect(decodeXcf(blob, controller.signal)).rejects.toThrow("Aborted");
	});

	it("should apply layer opacity during compositing", async () => {
		const xcf = makeMinimalXcf({
			width: 1,
			height: 1,
			layerType: 0, // RGB
			opacity: 128, // ~50%
			pixelFill: [255, 255, 255],
		});
		const blob = new Blob([xcf], { type: "image/x-xcf" });

		const { decodeXcf } = await import(
			"~/features/image-tools/decoders/decode-xcf"
		);
		const result = await decodeXcf(blob);

		expect(result.width).toBe(1);
		expect(result.height).toBe(1);

		// White pixel at ~50% opacity composited on transparent canvas
		// Alpha should be roughly 128
		expect(result.data[3]).toBeGreaterThan(100);
		expect(result.data[3]).toBeLessThan(160);
	});
});
