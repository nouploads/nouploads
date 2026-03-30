import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock pdfjs-dist (needs DOMMatrix which isn't available in Node)
const mockGetDocument = vi.fn();
const mockRender = vi.fn();

vi.mock("pdfjs-dist", () => ({
	GlobalWorkerOptions: { workerSrc: "" },
	getDocument: (opts: unknown) => ({
		promise: mockGetDocument(opts),
	}),
}));

// Mock pdf-lib to avoid the JpegEmbedder parsing issue with fake JPEG blobs
const mockDrawImage = vi.fn();
const mockAddPage = vi.fn().mockReturnValue({ drawImage: mockDrawImage });
const mockEmbedJpg = vi.fn().mockResolvedValue({ width: 100, height: 100 });
// Produce valid PDF magic bytes so assertions on output work
const PDF_HEADER = new TextEncoder().encode("%PDF-1.4\n");
const mockSave = vi.fn().mockResolvedValue(PDF_HEADER);

vi.mock("pdf-lib", () => ({
	PDFDocument: {
		create: vi.fn().mockResolvedValue({
			addPage: mockAddPage,
			embedJpg: mockEmbedJpg,
			save: mockSave,
		}),
	},
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

describe("compressPdf processor", () => {
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	beforeEach(() => {
		ctx = {
			fillStyle: "",
			fillRect: vi.fn(),
		} as unknown as CanvasRenderingContext2D;

		canvas = {
			width: 0,
			height: 0,
			getContext: vi.fn().mockReturnValue(ctx),
			toBlob: vi.fn(
				(cb: (b: Blob | null) => void, _type: string, _quality: number) => {
					cb(new Blob(["fake-jpeg"], { type: "image/jpeg" }));
				},
			),
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
		mockDrawImage.mockClear();
		mockAddPage.mockClear();
		mockEmbedJpg.mockClear();
		mockSave.mockClear();
		// Restore mock return values after clear
		mockAddPage.mockReturnValue({ drawImage: mockDrawImage });
		mockEmbedJpg.mockResolvedValue({ width: 100, height: 100 });
		mockSave.mockResolvedValue(PDF_HEADER);
	});

	it("should compress a single-page PDF and return result", async () => {
		const { compressPdf } = await import(
			"~/features/pdf-tools/processors/compress-pdf"
		);

		const page = createMockPage(612, 792);
		mockGetDocument.mockResolvedValue({
			numPages: 1,
			getPage: vi.fn().mockResolvedValue(page),
		});

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		const result = await compressPdf(file, { level: "medium" });

		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.blob.type).toBe("application/pdf");
		expect(result.originalSize).toBe(file.size);
		expect(result.compressedSize).toBe(result.blob.size);
		expect(result.pageCount).toBe(1);
		expect(mockEmbedJpg).toHaveBeenCalledTimes(1);
		expect(mockAddPage).toHaveBeenCalledTimes(1);
	});

	it("should default to medium compression level", async () => {
		const { compressPdf } = await import(
			"~/features/pdf-tools/processors/compress-pdf"
		);

		const page = createMockPage(612, 792);
		mockGetDocument.mockResolvedValue({
			numPages: 1,
			getPage: vi.fn().mockResolvedValue(page),
		});

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		// Call without level — should default to "medium" (dpi: 100)
		await compressPdf(file);

		// Medium level renders at scale 100/72 ~ 1.389
		const expectedWidth = Math.floor(612 * (100 / 72));
		expect(canvas.width).toBe(expectedWidth);
	});

	it("should use correct DPI for each compression level", async () => {
		const { compressPdf } = await import(
			"~/features/pdf-tools/processors/compress-pdf"
		);

		const levelDpi = { low: 150, medium: 100, high: 72 } as const;

		for (const [level, dpi] of Object.entries(levelDpi)) {
			const page = createMockPage(612, 792);
			mockGetDocument.mockResolvedValue({
				numPages: 1,
				getPage: vi.fn().mockResolvedValue(page),
			});

			const file = new File(["fake-pdf-data"], "test.pdf", {
				type: "application/pdf",
			});

			await compressPdf(file, {
				level: level as "low" | "medium" | "high",
			});

			const expectedWidth = Math.floor(612 * (dpi / 72));
			expect(canvas.width).toBe(expectedWidth);
		}
	});

	it("should compress a multi-page PDF and report progress", async () => {
		const { compressPdf } = await import(
			"~/features/pdf-tools/processors/compress-pdf"
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

		const file = new File(["fake-pdf-data"], "multi.pdf", {
			type: "application/pdf",
		});

		const result = await compressPdf(file, { level: "low" }, onProgress);

		expect(result.pageCount).toBe(2);
		expect(onProgress).toHaveBeenCalledWith(1, 2);
		expect(onProgress).toHaveBeenCalledWith(2, 2);
		expect(mockAddPage).toHaveBeenCalledTimes(2);
		expect(mockEmbedJpg).toHaveBeenCalledTimes(2);
	});

	it("should fill white background for JPEG rendering", async () => {
		const { compressPdf } = await import(
			"~/features/pdf-tools/processors/compress-pdf"
		);

		const page = createMockPage(100, 100);
		mockGetDocument.mockResolvedValue({
			numPages: 1,
			getPage: vi.fn().mockResolvedValue(page),
		});

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		await compressPdf(file);

		expect(ctx.fillStyle).toBe("#ffffff");
		expect(ctx.fillRect).toHaveBeenCalled();
	});

	it("should produce output with PDF magic bytes", async () => {
		const { compressPdf } = await import(
			"~/features/pdf-tools/processors/compress-pdf"
		);

		const page = createMockPage(612, 792);
		mockGetDocument.mockResolvedValue({
			numPages: 1,
			getPage: vi.fn().mockResolvedValue(page),
		});

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		const result = await compressPdf(file);
		const bytes = new Uint8Array(await result.blob.arrayBuffer());

		// PDF magic bytes: %PDF (25 50 44 46)
		expect(bytes[0]).toBe(0x25);
		expect(bytes[1]).toBe(0x50);
		expect(bytes[2]).toBe(0x44);
		expect(bytes[3]).toBe(0x46);
	});

	it("should preserve original page dimensions in addPage call", async () => {
		const { compressPdf } = await import(
			"~/features/pdf-tools/processors/compress-pdf"
		);

		const page = createMockPage(612, 792);
		mockGetDocument.mockResolvedValue({
			numPages: 1,
			getPage: vi.fn().mockResolvedValue(page),
		});

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		await compressPdf(file, { level: "high" });

		// addPage should be called with original dimensions (scale=1 viewport)
		expect(mockAddPage).toHaveBeenCalledWith([612, 792]);
		// drawImage should also use original dimensions
		expect(mockDrawImage).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ x: 0, y: 0, width: 612, height: 792 }),
		);
	});

	it("should reject immediately if signal already aborted", async () => {
		const { compressPdf } = await import(
			"~/features/pdf-tools/processors/compress-pdf"
		);

		const controller = new AbortController();
		controller.abort();

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		await expect(
			compressPdf(file, { signal: controller.signal }),
		).rejects.toThrow("Aborted");

		expect(mockGetDocument).not.toHaveBeenCalled();
	});

	it("should throw user-friendly error for password-protected PDFs", async () => {
		const { compressPdf } = await import(
			"~/features/pdf-tools/processors/compress-pdf"
		);

		const pwError = new Error("No password given");
		pwError.name = "PasswordException";
		mockGetDocument.mockRejectedValue(pwError);

		const file = new File(["fake-pdf-data"], "protected.pdf", {
			type: "application/pdf",
		});

		await expect(compressPdf(file)).rejects.toThrow("password-protected");
	});

	it("should pass JPEG quality from level settings to toBlob", async () => {
		const { compressPdf } = await import(
			"~/features/pdf-tools/processors/compress-pdf"
		);

		const page = createMockPage(612, 792);
		mockGetDocument.mockResolvedValue({
			numPages: 1,
			getPage: vi.fn().mockResolvedValue(page),
		});

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		await compressPdf(file, { level: "high" });

		// High level uses quality 0.5
		expect(canvas.toBlob).toHaveBeenCalledWith(
			expect.any(Function),
			"image/jpeg",
			0.5,
		);
	});
});
