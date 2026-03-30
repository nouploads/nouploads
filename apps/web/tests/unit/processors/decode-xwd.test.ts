import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Build a minimal 2x2 32bpp XWD file (version 7, MSBFirst, no colormap).
 *
 * Header: 100 bytes (header_size=100, no window name beyond header).
 * Pixels: XRGB format (4 bytes each), bytes_per_line = 8 (2 pixels * 4 bytes).
 *
 * Pixel layout:
 *   (0,0) = red   → 0x00, 0xFF, 0x00, 0x00
 *   (1,0) = green → 0x00, 0x00, 0xFF, 0x00
 *   (0,1) = blue  → 0x00, 0x00, 0x00, 0xFF
 *   (1,1) = white → 0x00, 0xFF, 0xFF, 0xFF
 */
function makeXwd32bpp2x2(): Uint8Array {
	const headerSize = 100;
	const bytesPerLine = 8; // 2 pixels * 4 bytes
	const buf = new ArrayBuffer(headerSize + bytesPerLine * 2);
	const view = new DataView(buf);

	view.setUint32(0, headerSize, false); // header_size
	view.setUint32(4, 7, false); // file_version
	view.setUint32(8, 2, false); // pixmap_format (ZPixmap)
	view.setUint32(12, 24, false); // pixmap_depth
	view.setUint32(16, 2, false); // pixmap_width
	view.setUint32(20, 2, false); // pixmap_height
	view.setUint32(24, 0, false); // xoffset
	view.setUint32(28, 0, false); // byte_order = MSBFirst
	view.setUint32(32, 32, false); // bitmap_unit
	view.setUint32(36, 0, false); // bitmap_bit_order
	view.setUint32(40, 32, false); // bitmap_pad
	view.setUint32(44, 32, false); // bits_per_pixel
	view.setUint32(48, bytesPerLine, false); // bytes_per_line
	view.setUint32(52, 5, false); // visual_class (TrueColor)
	view.setUint32(56, 0xff0000, false); // red_mask
	view.setUint32(60, 0x00ff00, false); // green_mask
	view.setUint32(64, 0x0000ff, false); // blue_mask
	view.setUint32(68, 8, false); // bits_per_rgb
	view.setUint32(72, 256, false); // colormap_entries
	view.setUint32(76, 0, false); // ncolors (at offset 76? — no, see below)
	// Offsets 76..95: window_width, window_height, window_x, window_y, window_bdrwidth
	view.setUint32(76, 2, false); // window_width
	view.setUint32(80, 2, false); // window_height
	view.setUint32(84, 0, false); // window_x
	view.setUint32(88, 0, false); // ncolors = 0
	view.setUint32(92, 0, false); // unused padding
	view.setUint32(96, 0, false); // unused padding

	// Pixel data (MSBFirst: bytes are X,R,G,B)
	const pixels = new Uint8Array(buf, headerSize);
	// Row 0
	// (0,0) red: X=0, R=255, G=0, B=0
	pixels[0] = 0;
	pixels[1] = 255;
	pixels[2] = 0;
	pixels[3] = 0;
	// (1,0) green: X=0, R=0, G=255, B=0
	pixels[4] = 0;
	pixels[5] = 0;
	pixels[6] = 255;
	pixels[7] = 0;
	// Row 1
	// (0,1) blue: X=0, R=0, G=0, B=255
	pixels[8] = 0;
	pixels[9] = 0;
	pixels[10] = 0;
	pixels[11] = 255;
	// (1,1) white: X=0, R=255, G=255, B=255
	pixels[12] = 0;
	pixels[13] = 255;
	pixels[14] = 255;
	pixels[15] = 255;

	return new Uint8Array(buf);
}

/**
 * Build a minimal 2x1 8bpp XWD with a 2-entry colormap.
 * Color 0 = red (255,0,0), Color 1 = blue (0,0,255).
 * Pixels: [0, 1] + padding to bytes_per_line.
 */
function makeXwd8bpp2x1(): Uint8Array {
	const headerSize = 100;
	const ncolors = 2;
	const colormapSize = ncolors * 12;
	const bytesPerLine = 4; // padded to 4 bytes
	const totalSize = headerSize + colormapSize + bytesPerLine * 1;
	const buf = new ArrayBuffer(totalSize);
	const view = new DataView(buf);

	view.setUint32(0, headerSize, false);
	view.setUint32(4, 7, false);
	view.setUint32(8, 2, false);
	view.setUint32(12, 8, false);
	view.setUint32(16, 2, false); // width
	view.setUint32(20, 1, false); // height
	view.setUint32(24, 0, false);
	view.setUint32(28, 0, false); // MSBFirst
	view.setUint32(32, 8, false);
	view.setUint32(36, 0, false);
	view.setUint32(40, 8, false);
	view.setUint32(44, 8, false); // bits_per_pixel
	view.setUint32(48, bytesPerLine, false);
	view.setUint32(52, 3, false); // PseudoColor
	view.setUint32(88, ncolors, false); // ncolors

	// Colormap: 2 entries, each 12 bytes
	// Entry 0: pixel=0, r=0xFF00, g=0x0000, b=0x0000
	let off = headerSize;
	view.setUint32(off, 0, false); // pixel
	view.setUint16(off + 4, 0xff00, false); // r
	view.setUint16(off + 6, 0x0000, false); // g
	view.setUint16(off + 8, 0x0000, false); // b
	// flags + pad bytes already zero

	off += 12;
	// Entry 1: pixel=1, r=0x0000, g=0x0000, b=0xFF00
	view.setUint32(off, 1, false);
	view.setUint16(off + 4, 0x0000, false);
	view.setUint16(off + 6, 0x0000, false);
	view.setUint16(off + 8, 0xff00, false);

	// Pixel data
	const pixels = new Uint8Array(buf, headerSize + colormapSize);
	pixels[0] = 0; // color index 0 → red
	pixels[1] = 1; // color index 1 → blue

	return new Uint8Array(buf);
}

describe("decodeXwd", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a 2x2 32bpp MSBFirst XWD", async () => {
		const xwd = makeXwd32bpp2x2();
		const blob = new Blob([xwd as BlobPart], { type: "image/x-xwindowdump" });

		const { decodeXwd } = await import(
			"~/features/image-tools/decoders/decode-xwd"
		);
		const result = await decodeXwd(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 2 * 4);

		// (0,0) = red
		expect(result.data[0]).toBe(255);
		expect(result.data[1]).toBe(0);
		expect(result.data[2]).toBe(0);
		expect(result.data[3]).toBe(255);

		// (1,0) = green
		expect(result.data[4]).toBe(0);
		expect(result.data[5]).toBe(255);
		expect(result.data[6]).toBe(0);
		expect(result.data[7]).toBe(255);

		// (0,1) = blue
		expect(result.data[8]).toBe(0);
		expect(result.data[9]).toBe(0);
		expect(result.data[10]).toBe(255);
		expect(result.data[11]).toBe(255);

		// (1,1) = white
		expect(result.data[12]).toBe(255);
		expect(result.data[13]).toBe(255);
		expect(result.data[14]).toBe(255);
		expect(result.data[15]).toBe(255);
	});

	it("should decode an 8bpp XWD with colormap", async () => {
		const xwd = makeXwd8bpp2x1();
		const blob = new Blob([xwd as BlobPart], { type: "image/x-xwindowdump" });

		const { decodeXwd } = await import(
			"~/features/image-tools/decoders/decode-xwd"
		);
		const result = await decodeXwd(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(1);
		expect(result.data.length).toBe(2 * 1 * 4);

		// Pixel 0: colormap index 0 → red (255, 0, 0)
		expect(result.data[0]).toBe(255);
		expect(result.data[1]).toBe(0);
		expect(result.data[2]).toBe(0);
		expect(result.data[3]).toBe(255);

		// Pixel 1: colormap index 1 → blue (0, 0, 255)
		expect(result.data[4]).toBe(0);
		expect(result.data[5]).toBe(0);
		expect(result.data[6]).toBe(255);
		expect(result.data[7]).toBe(255);
	});

	it("should reject on corrupt data (too short)", async () => {
		const blob = new Blob([new Uint8Array(20) as BlobPart], {
			type: "image/x-xwindowdump",
		});

		const { decodeXwd } = await import(
			"~/features/image-tools/decoders/decode-xwd"
		);

		await expect(decodeXwd(blob)).rejects.toThrow("too short");
	});

	it("should reject on unsupported version", async () => {
		const buf = new ArrayBuffer(100);
		const view = new DataView(buf);
		view.setUint32(0, 100, false); // header_size
		view.setUint32(4, 6, false); // version 6 (unsupported)
		const blob = new Blob([new Uint8Array(buf) as BlobPart], {
			type: "image/x-xwindowdump",
		});

		const { decodeXwd } = await import(
			"~/features/image-tools/decoders/decode-xwd"
		);

		await expect(decodeXwd(blob)).rejects.toThrow("unsupported version");
	});

	it("should respect abort signal", async () => {
		const xwd = makeXwd32bpp2x2();
		const blob = new Blob([xwd as BlobPart], { type: "image/x-xwindowdump" });
		const controller = new AbortController();
		controller.abort();

		const { decodeXwd } = await import(
			"~/features/image-tools/decoders/decode-xwd"
		);

		await expect(decodeXwd(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
