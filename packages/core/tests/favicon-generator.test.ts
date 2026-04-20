import { describe, expect, it } from "vitest";
import { packIco } from "../src/tools/favicon-generator.js";

describe("packIco (core)", () => {
	it("should produce valid ICO header bytes (00 00 01 00)", () => {
		const fakePng16 = new Uint8Array([
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
		]);
		const fakePng32 = new Uint8Array([
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
		]);

		const ico = packIco([fakePng16, fakePng32], [16, 32]);

		expect(ico[0]).toBe(0x00);
		expect(ico[1]).toBe(0x00);
		expect(ico[2]).toBe(0x01);
		expect(ico[3]).toBe(0x00);
	});

	it("should encode image count correctly", () => {
		const fakePng = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

		const ico2 = packIco([fakePng, fakePng], [16, 32]);
		const view2 = new DataView(ico2.buffer);
		expect(view2.getUint16(4, true)).toBe(2);

		const ico3 = packIco([fakePng, fakePng, fakePng], [16, 32, 48]);
		const view3 = new DataView(ico3.buffer);
		expect(view3.getUint16(4, true)).toBe(3);
	});

	it("should encode directory entries with correct sizes", () => {
		const fakePng = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
		const ico = packIco([fakePng, fakePng, fakePng], [16, 32, 48]);
		expect(ico[6]).toBe(16);
		expect(ico[7]).toBe(16);
		expect(ico[22]).toBe(32);
		expect(ico[23]).toBe(32);
		expect(ico[38]).toBe(48);
		expect(ico[39]).toBe(48);
	});

	it("should encode bits per pixel as 32", () => {
		const fakePng = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
		const ico = packIco([fakePng], [16]);
		const view = new DataView(ico.buffer);
		expect(view.getUint16(12, true)).toBe(32);
	});

	it("should embed PNG data at correct offsets", () => {
		const png1 = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0xaa]);
		const png2 = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0xbb, 0xcc]);

		const ico = packIco([png1, png2], [16, 32]);
		const view = new DataView(ico.buffer);

		const offset1 = view.getUint32(18, true);
		expect(offset1).toBe(38);
		const size1 = view.getUint32(14, true);
		expect(size1).toBe(5);
		expect(ico[offset1]).toBe(0x89);
		expect(ico[offset1 + 4]).toBe(0xaa);

		const offset2 = view.getUint32(34, true);
		expect(offset2).toBe(43);
		expect(ico[offset2]).toBe(0x89);
		expect(ico[offset2 + 5]).toBe(0xcc);
	});

	it("should calculate total size correctly", () => {
		const png1 = new Uint8Array(100);
		const png2 = new Uint8Array(200);
		const png3 = new Uint8Array(300);

		const ico = packIco([png1, png2, png3], [16, 32, 48]);
		expect(ico.length).toBe(654);
	});

	it("should throw if pngBuffers and sizes have different lengths", () => {
		expect(() => packIco([new Uint8Array(1)], [16, 32])).toThrow(/same length/);
	});

	it("should throw if no PNG buffers provided", () => {
		expect(() => packIco([], [])).toThrow(/At least one/);
	});

	it("should encode 256px size as 0 in directory entry", () => {
		const fakePng = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
		const ico = packIco([fakePng], [256]);
		expect(ico[6]).toBe(0);
		expect(ico[7]).toBe(0);
	});
});
