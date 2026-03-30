import { gzipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const MINIMAL_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="red"/></svg>';

function makeSvgz(svg: string = MINIMAL_SVG): Uint8Array {
	return gzipSync(new TextEncoder().encode(svg));
}

describe("decodeSvgz (vector)", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decompress SVGZ to valid SVG markup", async () => {
		const svgz = makeSvgz();
		const blob = new Blob([svgz as BlobPart]);

		const { decodeSvgz } = await import(
			"~/features/vector-tools/decoders/decode-svgz"
		);
		const result = await decodeSvgz(blob);

		expect(result.svgMarkup).toContain("<svg");
		expect(result.svgMarkup).toContain('fill="red"');
		expect(result.sourceFormat).toBe("SVGZ");
		expect(result.width).toBe(2);
		expect(result.height).toBe(2);
	});

	it("should handle SVG without explicit dimensions", async () => {
		const svgNoDims =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
		const svgz = makeSvgz(svgNoDims);
		const blob = new Blob([svgz as BlobPart]);

		const { decodeSvgz } = await import(
			"~/features/vector-tools/decoders/decode-svgz"
		);
		const result = await decodeSvgz(blob);

		expect(result.svgMarkup).toContain("<svg");
		expect(result.width).toBeUndefined();
		expect(result.height).toBeUndefined();
	});

	it("should reject data with invalid gzip header", async () => {
		const blob = new Blob([new Uint8Array([0x00, 0x00, 0x00, 0x00])]);

		const { decodeSvgz } = await import(
			"~/features/vector-tools/decoders/decode-svgz"
		);

		await expect(decodeSvgz(blob)).rejects.toThrow("Invalid gzip header");
	});

	it("should reject gzip data that does not contain SVG", async () => {
		const notSvg = gzipSync(new TextEncoder().encode("Hello, World!"));
		const blob = new Blob([notSvg as BlobPart]);

		const { decodeSvgz } = await import(
			"~/features/vector-tools/decoders/decode-svgz"
		);

		await expect(decodeSvgz(blob)).rejects.toThrow(
			"does not appear to contain SVG",
		);
	});

	it("should reject too-short input", async () => {
		const blob = new Blob([new Uint8Array([0x1f])]);

		const { decodeSvgz } = await import(
			"~/features/vector-tools/decoders/decode-svgz"
		);

		await expect(decodeSvgz(blob)).rejects.toThrow("Invalid gzip header");
	});

	it("should respect abort signal", async () => {
		const svgz = makeSvgz();
		const blob = new Blob([svgz as BlobPart]);
		const controller = new AbortController();
		controller.abort();

		const { decodeSvgz } = await import(
			"~/features/vector-tools/decoders/decode-svgz"
		);

		await expect(decodeSvgz(blob, controller.signal)).rejects.toThrow(
			"Aborted",
		);
	});
});
