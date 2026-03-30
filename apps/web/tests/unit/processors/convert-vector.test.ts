import { describe, expect, it, type MockInstance, vi } from "vitest";
import {
	extensionForVectorFormat,
	rasteriseSvg,
	type VectorOutputFormat,
} from "~/features/vector-tools/processors/convert-vector";

describe("extensionForVectorFormat", () => {
	it.each<[VectorOutputFormat, string]>([
		["svg", "svg"],
		["image/png", "png"],
		["image/jpeg", "jpg"],
		["image/webp", "webp"],
		["image/avif", "avif"],
	])("returns '%s' for format '%s'", (format, expected) => {
		expect(extensionForVectorFormat(format)).toBe(expected);
	});
});

describe("rasteriseSvg", () => {
	const SIMPLE_SVG =
		'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>';

	let createElementSpy: MockInstance;
	let createObjectURLSpy: MockInstance;
	let revokeObjectURLSpy: MockInstance;

	function mockImageAndCanvas(opts?: {
		canvasContext?: CanvasRenderingContext2D | null;
		toBlobResult?: Blob | null;
	}) {
		const drawImageSpy = vi.fn();
		const fillRectSpy = vi.fn();
		const toBlobResult =
			opts?.toBlobResult !== undefined
				? opts.toBlobResult
				: new Blob(["fake-png"], { type: "image/png" });
		const canvasContext =
			opts?.canvasContext !== undefined
				? opts.canvasContext
				: ({
						fillStyle: "",
						fillRect: fillRectSpy,
						drawImage: drawImageSpy,
					} as unknown as CanvasRenderingContext2D);

		createObjectURLSpy = vi
			.spyOn(URL, "createObjectURL")
			.mockReturnValue("blob:mock-url");
		revokeObjectURLSpy = vi
			.spyOn(URL, "revokeObjectURL")
			.mockImplementation(() => {});

		createElementSpy = vi
			.spyOn(document, "createElement")
			.mockImplementation((tag: string) => {
				if (tag === "canvas") {
					return {
						width: 0,
						height: 0,
						getContext: () => canvasContext,
						toBlob: (
							cb: (b: Blob | null) => void,
							_type?: string,
							_quality?: number,
						) => cb(toBlobResult),
					} as unknown as HTMLCanvasElement;
				}
				throw new Error(`Unexpected createElement("${tag}")`);
			});

		// Mock Image constructor to trigger onload synchronously.
		// Must use `function` (not arrow) so `new Image()` works.
		const ImageMock = vi.fn().mockImplementation(function (this: {
			onload: (() => void) | null;
			onerror: (() => void) | null;
			naturalWidth: number;
			naturalHeight: number;
			src: string;
		}) {
			this.onload = null;
			this.onerror = null;
			this.naturalWidth = 100;
			this.naturalHeight = 100;
			Object.defineProperty(this, "src", {
				set(_url: string) {
					queueMicrotask(() => this.onload?.());
				},
			});
		});
		vi.stubGlobal("Image", ImageMock);

		return { drawImageSpy, fillRectSpy, ImageMock };
	}

	function restoreMocks() {
		createElementSpy?.mockRestore();
		createObjectURLSpy?.mockRestore();
		revokeObjectURLSpy?.mockRestore();
		vi.unstubAllGlobals();
	}

	it("should render SVG to a PNG blob", async () => {
		const expected = new Blob(["png-data"], { type: "image/png" });
		mockImageAndCanvas({ toBlobResult: expected });

		const blob = await rasteriseSvg(SIMPLE_SVG, {
			mime: "image/png",
			scale: 1,
		});

		expect(blob).toBe(expected);
		expect(blob.size).toBeGreaterThan(0);
		restoreMocks();
	});

	it("should fill white background for JPEG", async () => {
		const { fillRectSpy } = mockImageAndCanvas();

		await rasteriseSvg(SIMPLE_SVG, {
			mime: "image/jpeg",
			scale: 1,
			quality: 0.8,
		});

		expect(fillRectSpy).toHaveBeenCalledWith(0, 0, 100, 100);
		restoreMocks();
	});

	it("should not fill background for PNG", async () => {
		const { fillRectSpy } = mockImageAndCanvas();

		await rasteriseSvg(SIMPLE_SVG, {
			mime: "image/png",
			scale: 1,
		});

		expect(fillRectSpy).not.toHaveBeenCalled();
		restoreMocks();
	});

	it("should scale output dimensions", async () => {
		const { drawImageSpy } = mockImageAndCanvas();

		await rasteriseSvg(SIMPLE_SVG, {
			mime: "image/png",
			scale: 2,
		});

		const [, , , w, h] = drawImageSpy.mock.calls[0];
		expect(w).toBe(200);
		expect(h).toBe(200);
		restoreMocks();
	});

	it("should clean up the object URL", async () => {
		mockImageAndCanvas();

		await rasteriseSvg(SIMPLE_SVG, {
			mime: "image/png",
			scale: 1,
		});

		expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
		restoreMocks();
	});

	it("should reject on pre-aborted signal", async () => {
		const controller = new AbortController();
		controller.abort();

		await expect(
			rasteriseSvg(SIMPLE_SVG, {
				mime: "image/png",
				scale: 1,
				signal: controller.signal,
			}),
		).rejects.toThrow("Aborted");
	});

	it("should reject when canvas context is unavailable", async () => {
		mockImageAndCanvas({ canvasContext: null });

		await expect(
			rasteriseSvg(SIMPLE_SVG, { mime: "image/png", scale: 1 }),
		).rejects.toThrow("Failed to get canvas context");

		restoreMocks();
	});

	it("should reject when toBlob returns null", async () => {
		mockImageAndCanvas({ toBlobResult: null });

		await expect(
			rasteriseSvg(SIMPLE_SVG, { mime: "image/png", scale: 1 }),
		).rejects.toThrow("Canvas toBlob returned null");

		restoreMocks();
	});
});
