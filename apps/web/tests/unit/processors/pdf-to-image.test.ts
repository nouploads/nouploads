import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock pdfjs-dist
const mockGetPage = vi.fn();
const mockGetDocument = vi.fn();
const mockRender = vi.fn();

vi.mock("pdfjs-dist", () => ({
	GlobalWorkerOptions: { workerSrc: "" },
	getDocument: (opts: unknown) => ({
		promise: mockGetDocument(opts),
	}),
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

describe("pdfToImages processor", () => {
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	beforeEach(() => {
		// Mock DOM canvas + toBlob
		ctx = {
			fillStyle: "",
			fillRect: vi.fn(),
		} as unknown as CanvasRenderingContext2D;

		canvas = {
			width: 0,
			height: 0,
			getContext: vi.fn().mockReturnValue(ctx),
			toBlob: vi.fn((cb: (b: Blob | null) => void, type: string) => {
				cb(new Blob(["fake-image"], { type }));
			}),
		} as unknown as HTMLCanvasElement;

		vi.spyOn(document, "createElement").mockReturnValue(
			canvas as unknown as HTMLElement,
		);

		mockRender.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		mockGetDocument.mockReset();
		mockGetPage.mockReset();
		mockRender.mockReset();
	});

	it("should convert a single-page PDF to JPEG", async () => {
		const { pdfToImages } = await import(
			"~/features/pdf-tools/processors/pdf-to-image"
		);

		const page = createMockPage(612, 792); // standard US letter at 72 DPI
		mockGetDocument.mockResolvedValue({
			numPages: 1,
			getPage: vi.fn().mockResolvedValue(page),
		});

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		const results = await pdfToImages(file, {
			outputFormat: "image/jpeg",
			dpi: 150,
			quality: 0.92,
		});

		expect(results).toHaveLength(1);
		expect(results[0].pageNumber).toBe(1);
		expect(results[0].blob).toBeInstanceOf(Blob);
		expect(results[0].blob.size).toBeGreaterThan(0);
		// At 150 DPI (scale 150/72 ≈ 2.083), dimensions should be scaled
		expect(results[0].width).toBe(Math.floor(612 * (150 / 72)));
		expect(results[0].height).toBe(Math.floor(792 * (150 / 72)));
	});

	it("should convert a multi-page PDF and report progress", async () => {
		const { pdfToImages } = await import(
			"~/features/pdf-tools/processors/pdf-to-image"
		);

		const page1 = createMockPage(612, 792);
		const page2 = createMockPage(612, 792);
		const onProgress = vi.fn();

		mockGetDocument.mockResolvedValue({
			numPages: 2,
			getPage: vi
				.fn()
				.mockResolvedValueOnce(page1)
				.mockResolvedValueOnce(page2),
		});

		const file = new File(["fake-pdf-data"], "multipage.pdf", {
			type: "application/pdf",
		});

		const results = await pdfToImages(
			file,
			{ outputFormat: "image/png", dpi: 72 },
			onProgress,
		);

		expect(results).toHaveLength(2);
		expect(results[0].pageNumber).toBe(1);
		expect(results[1].pageNumber).toBe(2);
		expect(onProgress).toHaveBeenCalledWith(1, 2);
		expect(onProgress).toHaveBeenCalledWith(2, 2);
	});

	it("should fill white background for JPEG output", async () => {
		const { pdfToImages } = await import(
			"~/features/pdf-tools/processors/pdf-to-image"
		);

		const page = createMockPage(100, 100);
		mockGetDocument.mockResolvedValue({
			numPages: 1,
			getPage: vi.fn().mockResolvedValue(page),
		});

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		await pdfToImages(file, { outputFormat: "image/jpeg" });

		expect(ctx.fillStyle).toBe("#ffffff");
		expect(ctx.fillRect).toHaveBeenCalled();
	});

	it("should not fill background for PNG output", async () => {
		const { pdfToImages } = await import(
			"~/features/pdf-tools/processors/pdf-to-image"
		);

		const page = createMockPage(100, 100);
		mockGetDocument.mockResolvedValue({
			numPages: 1,
			getPage: vi.fn().mockResolvedValue(page),
		});

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		await pdfToImages(file, { outputFormat: "image/png" });

		expect(ctx.fillRect).not.toHaveBeenCalled();
	});

	it("should reject immediately if signal already aborted", async () => {
		const { pdfToImages } = await import(
			"~/features/pdf-tools/processors/pdf-to-image"
		);

		const controller = new AbortController();
		controller.abort();

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		await expect(
			pdfToImages(file, {
				outputFormat: "image/jpeg",
				signal: controller.signal,
			}),
		).rejects.toThrow();

		expect(mockGetDocument).not.toHaveBeenCalled();
	});

	it("should throw user-friendly error for password-protected PDFs", async () => {
		const { pdfToImages } = await import(
			"~/features/pdf-tools/processors/pdf-to-image"
		);

		const pwError = new Error("No password given");
		pwError.name = "PasswordException";
		mockGetDocument.mockRejectedValue(pwError);

		const file = new File(["fake-pdf-data"], "protected.pdf", {
			type: "application/pdf",
		});

		await expect(
			pdfToImages(file, { outputFormat: "image/jpeg" }),
		).rejects.toThrow("password-protected");
	});

	it("should use default DPI of 150 when not specified", async () => {
		const { pdfToImages } = await import(
			"~/features/pdf-tools/processors/pdf-to-image"
		);

		const page = createMockPage(612, 792);
		mockGetDocument.mockResolvedValue({
			numPages: 1,
			getPage: vi.fn().mockResolvedValue(page),
		});

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		const results = await pdfToImages(file, { outputFormat: "image/png" });

		// Default DPI = 150, scale = 150/72
		expect(results[0].width).toBe(Math.floor(612 * (150 / 72)));
		expect(results[0].height).toBe(Math.floor(792 * (150 / 72)));
	});
});
