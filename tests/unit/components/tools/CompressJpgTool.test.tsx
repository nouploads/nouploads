import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dropFile, dropFiles } from "../../../helpers/drop-file";

const { mockedCompressImage, mockedCompressImageBatch } = vi.hoisted(() => ({
	mockedCompressImage: vi.fn(),
	mockedCompressImageBatch: vi.fn(),
}));

vi.mock("~/features/image-tools/processors/compress-image", () => ({
	compressImage: mockedCompressImage,
	compressImageBatch: mockedCompressImageBatch,
}));

let urlCounter = 0;
globalThis.URL.createObjectURL = vi.fn(() => `blob:preview-${urlCounter++}`);
globalThis.URL.revokeObjectURL = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

import CompressJpgTool from "~/features/image-tools/components/compress-jpg-tool";

function renderTool() {
	return render(
		<MemoryRouter>
			<CompressJpgTool />
		</MemoryRouter>,
	);
}

describe("CompressJpgTool — single file", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		urlCounter = 0;
	});

	afterEach(() => {
		cleanup();
	});

	it("should show original and result panels after dropping a JPG", async () => {
		mockedCompressImage.mockResolvedValue({
			blob: new Blob(["out"], { type: "image/jpeg" }),
			width: 100,
			height: 100,
		});

		renderTool();
		dropFile(new File(["img-data"], "photo.jpg", { type: "image/jpeg" }));

		await vi.waitFor(() => {
			expect(screen.getByText("Original")).toBeInTheDocument();
			expect(screen.getByText("Result")).toBeInTheDocument();
		});
	});

	it("should call compressImage with jpeg output format", async () => {
		mockedCompressImage.mockResolvedValue({
			blob: new Blob(["out"], { type: "image/jpeg" }),
			width: 100,
			height: 100,
		});

		renderTool();
		dropFile(new File(["img-data"], "photo.jpg", { type: "image/jpeg" }));

		await vi.waitFor(
			() => {
				expect(mockedCompressImage).toHaveBeenCalledTimes(1);
			},
			{ timeout: 3000 },
		);

		expect(mockedCompressImage.mock.calls[0][1]).toMatchObject({
			quality: 0.8,
			outputFormat: "image/jpeg",
		});
	});

	it("should show download button after compression", async () => {
		mockedCompressImage.mockResolvedValue({
			blob: new Blob(["out"], { type: "image/jpeg" }),
			width: 100,
			height: 100,
		});

		renderTool();
		dropFile(new File(["img-data"], "photo.jpg", { type: "image/jpeg" }));

		await vi.waitFor(
			() => {
				expect(
					screen.getByRole("button", { name: /download/i }),
				).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});

	it("should show quality slider label", () => {
		renderTool();
		expect(screen.getByText(/quality.*80%/i)).toBeInTheDocument();
	});

	it("should re-compress when quality slider changes", async () => {
		mockedCompressImage.mockResolvedValue({
			blob: new Blob(["out"], { type: "image/jpeg" }),
			width: 100,
			height: 100,
		});

		renderTool();
		dropFile(new File(["img-data"], "photo.jpg", { type: "image/jpeg" }));

		await vi.waitFor(
			() => {
				expect(mockedCompressImage).toHaveBeenCalledTimes(1);
			},
			{ timeout: 3000 },
		);

		const thumb = screen.getByRole("slider");
		fireEvent.keyDown(thumb, { key: "ArrowLeft" });

		await vi.waitFor(
			() => {
				expect(mockedCompressImage).toHaveBeenCalledTimes(2);
			},
			{ timeout: 3000 },
		);
	});

	it('should reset to dropzone when "Compress more" is clicked', async () => {
		mockedCompressImage.mockResolvedValue({
			blob: new Blob(["out"], { type: "image/jpeg" }),
			width: 100,
			height: 100,
		});

		renderTool();
		dropFile(new File(["img-data"], "photo.jpg", { type: "image/jpeg" }));

		await vi.waitFor(
			() => {
				expect(screen.getByText("Original")).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);

		fireEvent.click(screen.getByRole("button", { name: /compress more/i }));

		expect(screen.getByText(/drop/i)).toBeInTheDocument();
		expect(screen.queryByText("Original")).not.toBeInTheDocument();
	});

	it("should show error state when compression fails", async () => {
		mockedCompressImage.mockRejectedValue(new Error("Invalid image"));

		renderTool();
		dropFile(new File(["bad-data"], "photo.jpg", { type: "image/jpeg" }));

		await vi.waitFor(
			() => {
				expect(
					screen.getByText(/compression failed|invalid image/i),
				).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});
});

describe("CompressJpgTool — batch mode", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		urlCounter = 0;
	});

	afterEach(() => {
		cleanup();
	});

	it("should show per-file results with filenames", async () => {
		mockedCompressImageBatch.mockResolvedValue([
			{
				blob: new Blob(["out-1"], { type: "image/jpeg" }),
				width: 100,
				height: 100,
			},
			{
				blob: new Blob(["out-2"], { type: "image/jpeg" }),
				width: 200,
				height: 200,
			},
		]);

		renderTool();
		dropFiles([
			new File(["img-1"], "photo1.jpg", { type: "image/jpeg" }),
			new File(["img-2"], "photo2.jpg", { type: "image/jpeg" }),
		]);

		await vi.waitFor(
			() => {
				expect(screen.getByText("photo1.jpg")).toBeInTheDocument();
				expect(screen.getByText("photo2.jpg")).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});

	it('should have a "Download all" button for batch results', async () => {
		mockedCompressImageBatch.mockResolvedValue([
			{
				blob: new Blob(["out-1"], { type: "image/jpeg" }),
				width: 100,
				height: 100,
			},
			{
				blob: new Blob(["out-2"], { type: "image/jpeg" }),
				width: 100,
				height: 100,
			},
		]);

		renderTool();
		dropFiles([
			new File(["img-1"], "a.jpg", { type: "image/jpeg" }),
			new File(["img-2"], "b.jpg", { type: "image/jpeg" }),
		]);

		await vi.waitFor(
			() => {
				expect(
					screen.getByRole("button", { name: /download all/i }),
				).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});
});
