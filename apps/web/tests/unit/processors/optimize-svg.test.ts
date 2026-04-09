import { describe, expect, it } from "vitest";
import {
	optimizeSvg,
	svgToSvgz,
} from "~/features/vector-tools/processors/optimize-svg";

const SAMPLE_SVG =
	'<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><!-- comment --><rect width="100" height="100" fill="#ff0000"/></svg>';

describe("optimizeSvg", () => {
	it("should produce smaller output and remove comments", async () => {
		const blob = new Blob([SAMPLE_SVG], { type: "image/svg+xml" });
		const result = await optimizeSvg(blob);

		expect(result.optimizedSize).toBeLessThan(result.originalSize);
		expect(result.svg).not.toContain("<!-- comment -->");
		expect(result.svg).toContain("<svg");
		expect(result.svg).toContain("xmlns");
	});

	it("should remove XML processing instruction", async () => {
		const blob = new Blob([SAMPLE_SVG], { type: "image/svg+xml" });
		const result = await optimizeSvg(blob);

		expect(result.svg).not.toContain("<?xml");
	});

	it("should preserve viewBox when present", async () => {
		const svgWithViewBox =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>';
		const blob = new Blob([svgWithViewBox], { type: "image/svg+xml" });
		const result = await optimizeSvg(blob);

		expect(result.svg).toContain("viewBox");
	});

	it("should return correct size measurements", async () => {
		const blob = new Blob([SAMPLE_SVG], { type: "image/svg+xml" });
		const result = await optimizeSvg(blob);

		expect(result.originalSize).toBe(new Blob([SAMPLE_SVG]).size);
		expect(result.optimizedSize).toBe(new Blob([result.svg]).size);
		expect(result.optimizedSize).toBeGreaterThan(0);
	});

	it("should throw on pre-aborted signal", async () => {
		const controller = new AbortController();
		controller.abort();

		const blob = new Blob([SAMPLE_SVG], { type: "image/svg+xml" });
		await expect(
			optimizeSvg(blob, { signal: controller.signal }),
		).rejects.toThrow("Aborted");
	});

	it("should optimize SVGs with complex arc paths", async () => {
		const arcSvg =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M10 10 A 40 40 0 0 1 50 50 A 40 40 0 0 1 90 90 A 40 40 0 1 0 130 130"/></svg>';
		const blob = new Blob([arcSvg], { type: "image/svg+xml" });
		const result = await optimizeSvg(blob);

		expect(result.svg).toContain("<svg");
		expect(result.optimizedSize).toBeGreaterThan(0);
	});
});

describe("svgToSvgz", () => {
	it("should produce a gzipped blob smaller than the input", async () => {
		// Use a large-ish SVG string so gzip actually compresses
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">${"<rect width='10' height='10' fill='red'/>".repeat(50)}</svg>`;
		const blob = await svgToSvgz(svg);

		expect(blob.size).toBeGreaterThan(0);
		expect(blob.size).toBeLessThan(new Blob([svg]).size);

		// Verify gzip magic bytes (1f 8b)
		const bytes = new Uint8Array(await blob.arrayBuffer());
		expect(bytes[0]).toBe(0x1f);
		expect(bytes[1]).toBe(0x8b);
	});
});
