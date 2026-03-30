import { afterEach, describe, expect, it, vi } from "vitest";

// Mock pdf-lib
const mockCreate = vi.fn();
const mockEmbedJpg = vi.fn();
const mockEmbedPng = vi.fn();
const mockAddPage = vi.fn();
const mockDrawImage = vi.fn();
const mockSave = vi.fn();

vi.mock("pdf-lib", () => ({
	PDFDocument: {
		create: mockCreate,
	},
}));

afterEach(() => {
	vi.restoreAllMocks();
	mockCreate.mockReset();
	mockEmbedJpg.mockReset();
	mockEmbedPng.mockReset();
	mockAddPage.mockReset();
	mockDrawImage.mockReset();
	mockSave.mockReset();
});

function setupMockPdfDoc() {
	const embeddedImage = { width: 800, height: 600 };
	mockEmbedJpg.mockResolvedValue(embeddedImage);
	mockEmbedPng.mockResolvedValue(embeddedImage);
	mockDrawImage.mockReturnValue(undefined);
	mockAddPage.mockReturnValue({ drawImage: mockDrawImage });
	mockSave.mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46])); // %PDF

	mockCreate.mockResolvedValue({
		embedJpg: mockEmbedJpg,
		embedPng: mockEmbedPng,
		addPage: mockAddPage,
		save: mockSave,
	});
}

describe("imagesToPdf processor", () => {
	it("should embed a JPG file directly", async () => {
		setupMockPdfDoc();
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		const jpgFile = new File(
			[new Uint8Array([0xff, 0xd8, 0xff])],
			"photo.jpg",
			{ type: "image/jpeg" },
		);

		const result = await imagesToPdf([jpgFile]);

		expect(mockCreate).toHaveBeenCalled();
		expect(mockEmbedJpg).toHaveBeenCalled();
		expect(mockEmbedPng).not.toHaveBeenCalled();
		expect(mockAddPage).toHaveBeenCalledWith([800, 600]);
		expect(mockDrawImage).toHaveBeenCalled();
		expect(mockSave).toHaveBeenCalled();
		expect(result).toBeInstanceOf(Blob);
		expect(result.type).toBe("application/pdf");
	});

	it("should embed a PNG file directly", async () => {
		setupMockPdfDoc();
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		const pngFile = new File(
			[new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
			"image.png",
			{ type: "image/png" },
		);

		const result = await imagesToPdf([pngFile]);

		expect(mockEmbedPng).toHaveBeenCalled();
		expect(mockEmbedJpg).not.toHaveBeenCalled();
		expect(result).toBeInstanceOf(Blob);
	});

	it("should use fit page size by default", async () => {
		setupMockPdfDoc();
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		const jpgFile = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});

		await imagesToPdf([jpgFile]);

		// Page should match image dimensions (800x600 from mock)
		expect(mockAddPage).toHaveBeenCalledWith([800, 600]);
		expect(mockDrawImage).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				x: 0,
				y: 0,
				width: 800,
				height: 600,
			}),
		);
	});

	it("should use A4 page size when specified", async () => {
		setupMockPdfDoc();
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		const jpgFile = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});

		await imagesToPdf([jpgFile], { pageSize: "a4" });

		expect(mockAddPage).toHaveBeenCalledWith([595.28, 841.89]);
	});

	it("should use Letter page size when specified", async () => {
		setupMockPdfDoc();
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		const jpgFile = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});

		await imagesToPdf([jpgFile], { pageSize: "letter" });

		expect(mockAddPage).toHaveBeenCalledWith([612, 792]);
	});

	it("should process multiple images and call onProgress", async () => {
		setupMockPdfDoc();
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		const file1 = new File([new Uint8Array(10)], "photo1.jpg", {
			type: "image/jpeg",
		});
		const file2 = new File([new Uint8Array(10)], "photo2.png", {
			type: "image/png",
		});
		const onProgress = vi.fn();

		await imagesToPdf([file1, file2], undefined, onProgress);

		expect(mockAddPage).toHaveBeenCalledTimes(2);
		expect(onProgress).toHaveBeenCalledWith(1, 2);
		expect(onProgress).toHaveBeenCalledWith(2, 2);
	});

	it("should throw when no images provided", async () => {
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		await expect(imagesToPdf([])).rejects.toThrow("No images provided");
	});

	it("should reject immediately if signal already aborted", async () => {
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		const controller = new AbortController();
		controller.abort();

		const jpgFile = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});

		await expect(
			imagesToPdf([jpgFile], { signal: controller.signal }),
		).rejects.toThrow();
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it("should return a blob with application/pdf type", async () => {
		setupMockPdfDoc();
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		const jpgFile = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});

		const result = await imagesToPdf([jpgFile]);
		expect(result.type).toBe("application/pdf");
		expect(result.size).toBeGreaterThan(0);
	});
});
