import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dropFile } from "../../../helpers/drop-file";

const { mockedCompressImage } = vi.hoisted(() => ({
	mockedCompressImage: vi.fn(),
}));

vi.mock("~/features/image-tools/processors/compress-image", () => ({
	compressImage: mockedCompressImage,
	compressImageBatch: vi.fn(),
}));

let urlCounter = 0;
globalThis.URL.createObjectURL = vi.fn(() => `blob:preview-${urlCounter++}`);
globalThis.URL.revokeObjectURL = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

import CompressWebpTool from "~/features/image-tools/components/compress-webp-tool";

function renderTool() {
	return render(
		<MemoryRouter>
			<CompressWebpTool />
		</MemoryRouter>,
	);
}

describe("CompressWebpTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		urlCounter = 0;
	});

	afterEach(() => {
		cleanup();
	});

	it("should show Quality slider label", () => {
		renderTool();
		expect(screen.getByText(/quality.*80%/i)).toBeInTheDocument();
	});

	it("should call compressImage with webp output format", async () => {
		mockedCompressImage.mockResolvedValue({
			blob: new Blob(["out"], { type: "image/webp" }),
			width: 100,
			height: 100,
		});

		renderTool();
		dropFile(new File(["img-data"], "photo.webp", { type: "image/webp" }));

		await vi.waitFor(
			() => {
				expect(mockedCompressImage).toHaveBeenCalledTimes(1);
			},
			{ timeout: 3000 },
		);

		expect(mockedCompressImage.mock.calls[0][1]).toMatchObject({
			quality: 0.8,
			outputFormat: "image/webp",
		});
	});

	it("should show original and result after compression", async () => {
		mockedCompressImage.mockResolvedValue({
			blob: new Blob(["out"], { type: "image/webp" }),
			width: 100,
			height: 100,
		});

		renderTool();
		dropFile(new File(["img-data"], "photo.webp", { type: "image/webp" }));

		await vi.waitFor(() => {
			expect(screen.getByText("Original")).toBeInTheDocument();
			expect(screen.getByText("Result")).toBeInTheDocument();
		});
	});
});
