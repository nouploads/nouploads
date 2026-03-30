import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock pdfjs-dist (same pattern as pdf-to-image tests)
const mockGetDocument = vi.fn();
const mockRender = vi.fn();

vi.mock("pdfjs-dist", () => ({
	GlobalWorkerOptions: { workerSrc: "" },
	getDocument: (opts: unknown) => ({
		promise: mockGetDocument(opts),
	}),
}));

// Mock decode-eps for legacy AI fallback
const mockDecodeEps = vi.fn();
vi.mock("~/features/image-tools/decoders/decode-eps", () => ({
	decodeEps: (...args: unknown[]) => mockDecodeEps(...args),
}));

function createMockPage(width: number, height: number) {
	return {
		getViewport: ({ scale }: { scale: number }) => ({
			width: width * scale,
			height: height * scale,
		}),
		render: ({
			canvasContext,
			viewport,
		}: {
			canvasContext: unknown;
			viewport: unknown;
		}) => ({
			promise: mockRender({ canvasContext, viewport }),
		}),
	};
}

describe("decodeAi", () => {
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	beforeEach(() => {
		// Mock DOM canvas + getImageData
		ctx = {
			getImageData: vi.fn().mockReturnValue({
				data: new Uint8ClampedArray(400 * 600 * 4), // 200x300 at 2x scale
				width: 400,
				height: 600,
			}),
		} as unknown as CanvasRenderingContext2D;

		canvas = {
			width: 0,
			height: 0,
			getContext: vi.fn().mockReturnValue(ctx),
		} as unknown as HTMLCanvasElement;

		vi.spyOn(document, "createElement").mockReturnValue(
			canvas as unknown as HTMLElement,
		);

		mockRender.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		mockGetDocument.mockReset();
		mockRender.mockReset();
		mockDecodeEps.mockReset();
	});

	it("should render a PDF-based AI file via pdfjs", async () => {
		const { decodeAi } = await import(
			"~/features/image-tools/decoders/decode-ai"
		);

		const page = createMockPage(200, 300);
		mockGetDocument.mockResolvedValue({
			getPage: vi.fn().mockResolvedValue(page),
		});

		// Create a blob whose first bytes are %PDF
		const pdfHeader = new TextEncoder().encode("%PDF-1.5 fake ai data");
		const file = new Blob([pdfHeader], { type: "application/illustrator" });

		const result = await decodeAi(file);

		expect(result.width).toBe(400); // 200 * 2 scale
		expect(result.height).toBe(600); // 300 * 2 scale
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(400 * 600 * 4);
		expect(mockGetDocument).toHaveBeenCalled();
	});

	it("should delegate legacy PostScript-based AI to EPS decoder", async () => {
		const { decodeAi } = await import(
			"~/features/image-tools/decoders/decode-ai"
		);

		const fakeResult = {
			data: new Uint8Array(100 * 100 * 4),
			width: 100,
			height: 100,
		};
		mockDecodeEps.mockResolvedValue(fakeResult);

		// Create a blob whose first bytes are %!PS (PostScript)
		const psHeader = new TextEncoder().encode("%!PS-Adobe-3.0 EPSF-3.0");
		const file = new Blob([psHeader], { type: "application/illustrator" });

		const result = await decodeAi(file);

		expect(result).toBe(fakeResult);
		expect(mockDecodeEps).toHaveBeenCalledWith(file, undefined);
		expect(mockGetDocument).not.toHaveBeenCalled();
	});

	it("should throw on corrupt/unrecognized data", async () => {
		const { decodeAi } = await import(
			"~/features/image-tools/decoders/decode-ai"
		);

		// Not %PDF and not %!PS — EPS decoder will reject it
		mockDecodeEps.mockRejectedValue(
			new Error("This file does not appear to be a valid EPS file."),
		);

		const garbage = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
		const file = new Blob([garbage], { type: "application/illustrator" });

		await expect(decodeAi(file)).rejects.toThrow();
		expect(mockGetDocument).not.toHaveBeenCalled();
	});

	it("should reject immediately if signal already aborted", async () => {
		const { decodeAi } = await import(
			"~/features/image-tools/decoders/decode-ai"
		);

		const controller = new AbortController();
		controller.abort();

		const pdfHeader = new TextEncoder().encode("%PDF-1.5 fake ai data");
		const file = new Blob([pdfHeader], { type: "application/illustrator" });

		await expect(decodeAi(file, controller.signal)).rejects.toThrow("Aborted");
		expect(mockGetDocument).not.toHaveBeenCalled();
	});
});
