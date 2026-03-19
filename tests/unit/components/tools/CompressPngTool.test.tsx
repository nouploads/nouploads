import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dropFile } from "../../../helpers/drop-file";

const { mockedCompressPng } = vi.hoisted(() => ({
	mockedCompressPng: vi.fn(),
}));

vi.mock("~/features/image-tools/processors/compress-png", () => ({
	compressPng: mockedCompressPng,
	compressPngBatch: vi.fn(),
}));

let urlCounter = 0;
globalThis.URL.createObjectURL = vi.fn(() => `blob:preview-${urlCounter++}`);
globalThis.URL.revokeObjectURL = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

import CompressPngTool from "~/features/image-tools/components/compress-png-tool";

function renderTool() {
	return render(
		<MemoryRouter>
			<CompressPngTool />
		</MemoryRouter>,
	);
}

describe("CompressPngTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		urlCounter = 0;
	});

	afterEach(() => {
		cleanup();
	});

	it("should show Colors slider label instead of Quality", () => {
		renderTool();
		expect(screen.getByText(/colors.*256/i)).toBeInTheDocument();
		expect(screen.queryByText(/quality/i)).not.toBeInTheDocument();
	});

	it("should call compressPng with colors parameter", async () => {
		mockedCompressPng.mockResolvedValue({
			blob: new Blob(["out"], { type: "image/png" }),
			width: 100,
			height: 100,
		});

		renderTool();
		dropFile(new File(["img-data"], "icon.png", { type: "image/png" }));

		await vi.waitFor(
			() => {
				expect(mockedCompressPng).toHaveBeenCalledTimes(1);
			},
			{ timeout: 3000 },
		);

		expect(mockedCompressPng.mock.calls[0][1]).toMatchObject({ colors: 256 });
	});

	it("should show original and result after compression", async () => {
		mockedCompressPng.mockResolvedValue({
			blob: new Blob(["out"], { type: "image/png" }),
			width: 100,
			height: 100,
		});

		renderTool();
		dropFile(new File(["img-data"], "icon.png", { type: "image/png" }));

		await vi.waitFor(() => {
			expect(screen.getByText("Original")).toBeInTheDocument();
			expect(screen.getByText("Result")).toBeInTheDocument();
		});
	});
});
