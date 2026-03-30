import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Minimal 2x2 XPM with 2 colors, cpp=1.
 * "." = white (#FFFFFF), "#" = black (#000000)
 * Row 0: ".#" → white, black
 * Row 1: "#." → black, white
 */
function makeXpm2x2(): string {
	return [
		"/* XPM */",
		"static char *test_xpm[] = {",
		'"2 2 2 1",',
		'". c #FFFFFF",',
		'"# c #000000",',
		'".#",',
		'"#."',
		"};",
	].join("\n");
}

/**
 * 2x1 XPM with transparent and colored pixels, cpp=2.
 * "AA" = transparent (None), "BB" = red (#FF0000)
 */
function makeXpmTransparent(): string {
	return [
		"/* XPM */",
		"static char *t_xpm[] = {",
		'"2 1 2 2",',
		'"AA c None",',
		'"BB c #FF0000",',
		'"AABB"',
		"};",
	].join("\n");
}

/**
 * 1x1 XPM using an X11 color name.
 */
function makeXpmX11Color(): string {
	return [
		"/* XPM */",
		"static char *c_xpm[] = {",
		'"1 1 1 1",',
		'"x c blue",',
		'"x"',
		"};",
	].join("\n");
}

describe("decodeXpm", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a 2x2 XPM checkerboard", async () => {
		const text = makeXpm2x2();
		const blob = new Blob([text], { type: "image/x-xpixmap" });

		const { decodeXpm } = await import(
			"~/features/image-tools/decoders/decode-xpm"
		);
		const result = await decodeXpm(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(2 * 2 * 4);

		// (0,0) = white
		expect(result.data[0]).toBe(255);
		expect(result.data[1]).toBe(255);
		expect(result.data[2]).toBe(255);
		expect(result.data[3]).toBe(255);

		// (1,0) = black
		expect(result.data[4]).toBe(0);
		expect(result.data[5]).toBe(0);
		expect(result.data[6]).toBe(0);
		expect(result.data[7]).toBe(255);

		// (0,1) = black
		expect(result.data[8]).toBe(0);
		expect(result.data[9]).toBe(0);
		expect(result.data[10]).toBe(0);
		expect(result.data[11]).toBe(255);

		// (1,1) = white
		expect(result.data[12]).toBe(255);
		expect(result.data[13]).toBe(255);
		expect(result.data[14]).toBe(255);
		expect(result.data[15]).toBe(255);
	});

	it("should handle transparent pixels (None)", async () => {
		const text = makeXpmTransparent();
		const blob = new Blob([text], { type: "image/x-xpixmap" });

		const { decodeXpm } = await import(
			"~/features/image-tools/decoders/decode-xpm"
		);
		const result = await decodeXpm(blob);

		expect(result.width).toBe(2);
		expect(result.height).toBe(1);
		expect(result.data.length).toBe(2 * 1 * 4);

		// Pixel 0: transparent (RGBA 0,0,0,0)
		expect(result.data[0]).toBe(0);
		expect(result.data[1]).toBe(0);
		expect(result.data[2]).toBe(0);
		expect(result.data[3]).toBe(0);

		// Pixel 1: red
		expect(result.data[4]).toBe(255);
		expect(result.data[5]).toBe(0);
		expect(result.data[6]).toBe(0);
		expect(result.data[7]).toBe(255);
	});

	it("should handle X11 color names", async () => {
		const text = makeXpmX11Color();
		const blob = new Blob([text], { type: "image/x-xpixmap" });

		const { decodeXpm } = await import(
			"~/features/image-tools/decoders/decode-xpm"
		);
		const result = await decodeXpm(blob);

		expect(result.width).toBe(1);
		expect(result.height).toBe(1);
		expect(result.data.length).toBe(4);

		// blue = (0, 0, 255, 255)
		expect(result.data[0]).toBe(0);
		expect(result.data[1]).toBe(0);
		expect(result.data[2]).toBe(255);
		expect(result.data[3]).toBe(255);
	});

	it("should reject on corrupt data (not enough strings)", async () => {
		const text = '/* XPM */\nstatic char *t[] = { "bad" };';
		const blob = new Blob([text], { type: "image/x-xpixmap" });

		const { decodeXpm } = await import(
			"~/features/image-tools/decoders/decode-xpm"
		);

		await expect(decodeXpm(blob)).rejects.toThrow();
	});

	it("should reject on invalid header values", async () => {
		const text = [
			"/* XPM */",
			"static char *t[] = {",
			'"abc def ghi jkl",',
			"};",
		].join("\n");
		const blob = new Blob([text], { type: "image/x-xpixmap" });

		const { decodeXpm } = await import(
			"~/features/image-tools/decoders/decode-xpm"
		);

		await expect(decodeXpm(blob)).rejects.toThrow();
	});

	it("should respect abort signal", async () => {
		const text = makeXpm2x2();
		const blob = new Blob([text], { type: "image/x-xpixmap" });
		const controller = new AbortController();
		controller.abort();

		const { decodeXpm } = await import(
			"~/features/image-tools/decoders/decode-xpm"
		);

		await expect(decodeXpm(blob, controller.signal)).rejects.toThrow("Aborted");
	});
});
