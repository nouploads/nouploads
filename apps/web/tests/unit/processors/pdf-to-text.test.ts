import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock pdfjs-dist (needs DOMMatrix which isn't available in Node)
const mockGetDocument = vi.fn();

vi.mock("pdfjs-dist", () => ({
	GlobalWorkerOptions: { workerSrc: "" },
	getDocument: (opts: unknown) => ({
		promise: mockGetDocument(opts),
	}),
}));

function createMockTextPage(items: { str: string; hasEOL: boolean }[]) {
	return {
		getTextContent: vi.fn().mockResolvedValue({
			items: items.map((item) => ({
				str: item.str,
				dir: "ltr",
				transform: [1, 0, 0, 1, 0, 0],
				width: 10,
				height: 10,
				fontName: "g_d0_f1",
				hasEOL: item.hasEOL,
			})),
			styles: {},
			lang: null,
		}),
	};
}

describe("pdfToText processor", () => {
	beforeEach(() => {
		mockGetDocument.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should extract text from a single-page PDF", async () => {
		const { pdfToText } = await import(
			"~/features/pdf-tools/processors/pdf-to-text"
		);

		const page = createMockTextPage([
			{ str: "Hello ", hasEOL: false },
			{ str: "World", hasEOL: true },
			{ str: "Second line", hasEOL: true },
		]);

		mockGetDocument.mockResolvedValue({
			numPages: 1,
			getPage: vi.fn().mockResolvedValue(page),
		});

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		const result = await pdfToText(file);

		expect(result.pageCount).toBe(1);
		expect(result.charCount).toBeGreaterThan(0);
		expect(result.text).toContain("--- Page 1 ---");
		expect(result.text).toContain("Hello World");
		expect(result.text).toContain("Second line");
	});

	it("should extract text from a multi-page PDF with separators", async () => {
		const { pdfToText } = await import(
			"~/features/pdf-tools/processors/pdf-to-text"
		);

		const page1 = createMockTextPage([
			{ str: "Page one content", hasEOL: true },
		]);
		const page2 = createMockTextPage([
			{ str: "Page two content", hasEOL: true },
		]);

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

		const result = await pdfToText(file);

		expect(result.pageCount).toBe(2);
		expect(result.text).toContain("--- Page 1 ---");
		expect(result.text).toContain("--- Page 2 ---");
		expect(result.text).toContain("Page one content");
		expect(result.text).toContain("Page two content");
	});

	it("should report progress for each page", async () => {
		const { pdfToText } = await import(
			"~/features/pdf-tools/processors/pdf-to-text"
		);

		const page1 = createMockTextPage([{ str: "A", hasEOL: true }]);
		const page2 = createMockTextPage([{ str: "B", hasEOL: true }]);
		const page3 = createMockTextPage([{ str: "C", hasEOL: true }]);
		const onProgress = vi.fn();

		mockGetDocument.mockResolvedValue({
			numPages: 3,
			getPage: vi
				.fn()
				.mockResolvedValueOnce(page1)
				.mockResolvedValueOnce(page2)
				.mockResolvedValueOnce(page3),
		});

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		await pdfToText(file, {}, onProgress);

		expect(onProgress).toHaveBeenCalledWith(1, 3);
		expect(onProgress).toHaveBeenCalledWith(2, 3);
		expect(onProgress).toHaveBeenCalledWith(3, 3);
	});

	it("should return zero charCount for empty PDF", async () => {
		const { pdfToText } = await import(
			"~/features/pdf-tools/processors/pdf-to-text"
		);

		const page = createMockTextPage([]);

		mockGetDocument.mockResolvedValue({
			numPages: 1,
			getPage: vi.fn().mockResolvedValue(page),
		});

		const file = new File(["fake-pdf-data"], "empty.pdf", {
			type: "application/pdf",
		});

		const result = await pdfToText(file);

		expect(result.pageCount).toBe(1);
		expect(result.charCount).toBe(0);
	});

	it("should handle text items with hasEOL line breaks", async () => {
		const { pdfToText } = await import(
			"~/features/pdf-tools/processors/pdf-to-text"
		);

		const page = createMockTextPage([
			{ str: "Line one", hasEOL: true },
			{ str: "Line two", hasEOL: false },
			{ str: " continued", hasEOL: true },
		]);

		mockGetDocument.mockResolvedValue({
			numPages: 1,
			getPage: vi.fn().mockResolvedValue(page),
		});

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		const result = await pdfToText(file);

		expect(result.text).toContain("Line one\nLine two continued");
	});

	it("should skip TextMarkedContent items without str property", async () => {
		const { pdfToText } = await import(
			"~/features/pdf-tools/processors/pdf-to-text"
		);

		// Simulate mixed items: some are TextItem, some are TextMarkedContent
		const page = {
			getTextContent: vi.fn().mockResolvedValue({
				items: [
					{
						type: "beginMarkedContent",
						id: "mc1",
					},
					{
						str: "Real text",
						dir: "ltr",
						transform: [1, 0, 0, 1, 0, 0],
						width: 10,
						height: 10,
						fontName: "g_d0_f1",
						hasEOL: true,
					},
					{
						type: "endMarkedContent",
						id: "mc1",
					},
				],
				styles: {},
				lang: null,
			}),
		};

		mockGetDocument.mockResolvedValue({
			numPages: 1,
			getPage: vi.fn().mockResolvedValue(page),
		});

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		const result = await pdfToText(file);

		expect(result.text).toContain("Real text");
		expect(result.charCount).toBe(9); // "Real text" = 9 chars
	});

	it("should reject immediately if signal already aborted", async () => {
		const { pdfToText } = await import(
			"~/features/pdf-tools/processors/pdf-to-text"
		);

		const controller = new AbortController();
		controller.abort();

		const file = new File(["fake-pdf-data"], "test.pdf", {
			type: "application/pdf",
		});

		await expect(
			pdfToText(file, { signal: controller.signal }),
		).rejects.toThrow("Aborted");

		expect(mockGetDocument).not.toHaveBeenCalled();
	});

	it("should throw user-friendly error for password-protected PDFs", async () => {
		const { pdfToText } = await import(
			"~/features/pdf-tools/processors/pdf-to-text"
		);

		const pwError = new Error("No password given");
		pwError.name = "PasswordException";
		mockGetDocument.mockRejectedValue(pwError);

		const file = new File(["fake-pdf-data"], "protected.pdf", {
			type: "application/pdf",
		});

		await expect(pdfToText(file)).rejects.toThrow("password-protected");
	});
});
