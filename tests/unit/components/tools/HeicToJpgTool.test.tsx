import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dropFile, dropFiles } from "../../../helpers/drop-file";

// Use vi.hoisted() so mocks are available when vi.mock factory runs (hoisted above imports)
const { mockedHeicToJpg, mockedHeicToJpgBatch } = vi.hoisted(() => ({
	mockedHeicToJpg: vi.fn(),
	mockedHeicToJpgBatch: vi.fn(),
}));

vi.mock("~/features/image-tools/processors/heic-to-jpg", () => ({
	heicToJpg: mockedHeicToJpg,
	heicToJpgBatch: mockedHeicToJpgBatch,
}));

// Mock heic2any to prevent dynamic import issues
vi.mock("heic2any", () => ({
	default: vi.fn(),
}));

// Mock URL.createObjectURL / revokeObjectURL for image previews
let urlCounter = 0;
globalThis.URL.createObjectURL = vi.fn(() => `blob:preview-${urlCounter++}`);
globalThis.URL.revokeObjectURL = vi.fn();

import HeicToJpgTool from "~/features/image-tools/components/heic-to-jpg-tool";

// ─── Single-file: live preview UX ─────────────────────────────

describe("HeicToJpgTool — single file live preview", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		urlCounter = 0;
	});

	afterEach(() => {
		cleanup();
	});

	it("should show original and result panels after dropping a file", async () => {
		mockedHeicToJpg.mockResolvedValue(
			new Blob(["jpg"], { type: "image/jpeg" }),
		);

		render(<HeicToJpgTool />);
		dropFile(new File(["heic-data"], "photo.heic", { type: "image/heic" }));

		await vi.waitFor(() => {
			expect(screen.getByText("Original")).toBeInTheDocument();
			expect(screen.getByText("Result")).toBeInTheDocument();
		});
	});

	it("should show original image preview after conversion", async () => {
		mockedHeicToJpg.mockResolvedValue(
			new Blob(["jpg"], { type: "image/jpeg" }),
		);

		render(<HeicToJpgTool />);
		dropFile(new File(["heic-data"], "photo.heic", { type: "image/heic" }));

		await vi.waitFor(() => {
			const images = document.querySelectorAll("img");
			const originalImg = Array.from(images).find(
				(img) => img.alt === "Original",
			);
			expect(originalImg).toBeTruthy();
		});
	});

	it("should show result image after conversion completes", async () => {
		mockedHeicToJpg.mockResolvedValue(
			new Blob(["jpg-data"], { type: "image/jpeg" }),
		);

		render(<HeicToJpgTool />);
		dropFile(new File(["heic-data"], "photo.heic", { type: "image/heic" }));

		await vi.waitFor(
			() => {
				const images = document.querySelectorAll("img");
				const resultImg = Array.from(images).find(
					(img) => img.alt === "Result",
				);
				expect(resultImg).toBeTruthy();
			},
			{ timeout: 3000 },
		);
	});

	it("should show download button and filename after conversion", async () => {
		mockedHeicToJpg.mockResolvedValue(
			new Blob(["jpg-data"], { type: "image/jpeg" }),
		);

		render(<HeicToJpgTool />);
		dropFile(new File(["heic-data"], "photo.heic", { type: "image/heic" }));

		await vi.waitFor(
			() => {
				expect(screen.getByText(/photo\.jpg/)).toBeInTheDocument();
				expect(
					screen.getByRole("button", { name: /download/i }),
				).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});

	it("should call processor twice on file drop (preview + result)", async () => {
		mockedHeicToJpg.mockResolvedValue(
			new Blob(["jpg"], { type: "image/jpeg" }),
		);

		render(<HeicToJpgTool />);
		dropFile(new File(["heic-data"], "photo.heic", { type: "image/heic" }));

		await vi.waitFor(
			() => {
				// Once for preview at quality 1.0, once for result at slider quality
				expect(mockedHeicToJpg).toHaveBeenCalledTimes(2);
			},
			{ timeout: 3000 },
		);

		// Check the quality arguments
		const calls = mockedHeicToJpg.mock.calls;
		expect(calls[0][1]).toEqual({ quality: 1.0 }); // preview
		expect(calls[1][1]).toEqual({ quality: 0.92 }); // result (92% default)
	});

	it("should re-convert when quality slider changes", async () => {
		mockedHeicToJpg.mockResolvedValue(
			new Blob(["jpg"], { type: "image/jpeg" }),
		);

		render(<HeicToJpgTool />);
		dropFile(new File(["heic-data"], "photo.heic", { type: "image/heic" }));

		// Wait for initial conversions
		await vi.waitFor(
			() => {
				expect(mockedHeicToJpg).toHaveBeenCalledTimes(2);
			},
			{ timeout: 3000 },
		);

		// Change the quality slider
		const thumb = screen.getByRole("slider");
		fireEvent.keyDown(thumb, { key: "ArrowLeft" });

		// Should trigger a third conversion with new quality
		await vi.waitFor(
			() => {
				expect(mockedHeicToJpg).toHaveBeenCalledTimes(3);
			},
			{ timeout: 3000 },
		);
	});

	it("should keep quality slider visible at all times", async () => {
		mockedHeicToJpg.mockResolvedValue(
			new Blob(["jpg"], { type: "image/jpeg" }),
		);

		render(<HeicToJpgTool />);

		// Slider visible before file drop
		expect(screen.getByText(/jpg quality/i)).toBeInTheDocument();

		dropFile(new File(["heic-data"], "photo.heic", { type: "image/heic" }));

		// Slider still visible after conversion
		await vi.waitFor(
			() => {
				expect(screen.getByText(/photo\.jpg/)).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
		expect(screen.getByText(/jpg quality/i)).toBeInTheDocument();
	});

	it('should reset to dropzone when "Convert more" is clicked', async () => {
		mockedHeicToJpg.mockResolvedValue(
			new Blob(["jpg"], { type: "image/jpeg" }),
		);

		render(<HeicToJpgTool />);
		dropFile(new File(["heic-data"], "photo.heic", { type: "image/heic" }));

		await vi.waitFor(
			() => {
				expect(screen.getByText(/photo\.jpg/)).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);

		fireEvent.click(screen.getByRole("button", { name: /convert more/i }));

		expect(screen.getByText(/drop/i)).toBeInTheDocument();
		expect(screen.queryByText("Original")).not.toBeInTheDocument();
	});

	it("should show error state when conversion fails", async () => {
		mockedHeicToJpg
			.mockResolvedValueOnce(new Blob(["preview"], { type: "image/jpeg" })) // preview succeeds
			.mockRejectedValueOnce(new Error("Invalid HEIC file")); // result fails

		render(<HeicToJpgTool />);
		dropFile(new File(["bad-data"], "photo.heic", { type: "image/heic" }));

		await vi.waitFor(
			() => {
				expect(
					screen.getByText(/conversion failed|invalid heic/i),
				).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});
});

// ─── Multi-file batch ──────────────────────────────────────────

describe("HeicToJpgTool — batch mode", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		urlCounter = 0;
	});

	afterEach(() => {
		cleanup();
	});

	it("should accept multiple files via the dropzone", () => {
		render(<HeicToJpgTool />);

		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		expect(input).toBeTruthy();
		expect(input.multiple).toBe(true);
	});

	it("should show per-file results with filenames", async () => {
		const output1 = new Blob(["jpg-1"], { type: "image/jpeg" });
		const output2 = new Blob(["jpg-2"], { type: "image/jpeg" });

		mockedHeicToJpgBatch.mockResolvedValue([output1, output2]);

		render(<HeicToJpgTool />);
		dropFiles([
			new File(["heic-1"], "photo1.heic", { type: "image/heic" }),
			new File(["heic-2"], "photo2.heic", { type: "image/heic" }),
		]);

		await vi.waitFor(
			() => {
				expect(screen.getByText("photo1.jpg")).toBeInTheDocument();
				expect(screen.getByText("photo2.jpg")).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});

	it("should show progress during batch conversion", async () => {
		let resolveConversion: (value: (Blob | Error)[]) => void;
		mockedHeicToJpgBatch.mockImplementation(
			(
				_blobs: Blob[],
				// biome-ignore lint/suspicious/noExplicitAny: test mock callback signature
				_opts: any,
				onProgress?: (i: number, t: number) => void,
			) =>
				new Promise((resolve) => {
					resolveConversion = resolve;
					// Simulate progress
					onProgress?.(0, 2);
				}),
		);

		render(<HeicToJpgTool />);
		dropFiles([
			new File(["heic-1"], "a.heic", { type: "image/heic" }),
			new File(["heic-2"], "b.heic", { type: "image/heic" }),
		]);

		await vi.waitFor(
			() => {
				expect(screen.getByText(/1 of 2/)).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);

		// Resolve to clean up
		await act(async () => {
			resolveConversion?.([new Blob(["jpg-1"]), new Blob(["jpg-2"])]);
		});
	});

	it("should show individual download buttons for each result", async () => {
		mockedHeicToJpgBatch.mockResolvedValue([
			new Blob(["jpg-1"], { type: "image/jpeg" }),
			new Blob(["jpg-2"], { type: "image/jpeg" }),
		]);

		render(<HeicToJpgTool />);
		dropFiles([
			new File(["heic-1"], "photo1.heic", { type: "image/heic" }),
			new File(["heic-2"], "photo2.heic", { type: "image/heic" }),
		]);

		await vi.waitFor(
			() => {
				const downloadButtons = screen.getAllByRole("button", {
					name: /download/i,
				});
				expect(downloadButtons.length).toBeGreaterThanOrEqual(2);
			},
			{ timeout: 3000 },
		);
	});

	it("should show error indicator for failed files while showing successful ones", async () => {
		mockedHeicToJpgBatch.mockResolvedValue([
			new Blob(["jpg-1"], { type: "image/jpeg" }),
			new Error("Invalid HEIC file"),
		]);

		render(<HeicToJpgTool />);
		dropFiles([
			new File(["heic-1"], "good.heic", { type: "image/heic" }),
			new File(["bad-data"], "bad.heic", { type: "image/heic" }),
		]);

		await vi.waitFor(
			() => {
				expect(screen.getByText("good.jpg")).toBeInTheDocument();
				expect(screen.getByText(/failed/i)).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});

	it('should have a "Download all" button for batch results', async () => {
		mockedHeicToJpgBatch.mockResolvedValue([
			new Blob(["jpg-1"], { type: "image/jpeg" }),
			new Blob(["jpg-2"], { type: "image/jpeg" }),
		]);

		render(<HeicToJpgTool />);
		dropFiles([
			new File(["heic-1"], "a.heic", { type: "image/heic" }),
			new File(["heic-2"], "b.heic", { type: "image/heic" }),
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

	it('should reset all files when "Convert more" is clicked', async () => {
		mockedHeicToJpgBatch.mockResolvedValue([
			new Blob(["jpg-1"]),
			new Blob(["jpg-2"]),
		]);

		render(<HeicToJpgTool />);
		dropFiles([
			new File(["heic-1"], "a.heic", { type: "image/heic" }),
			new File(["heic-2"], "b.heic", { type: "image/heic" }),
		]);

		await vi.waitFor(
			() => {
				expect(screen.getByText("a.jpg")).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);

		fireEvent.click(screen.getByRole("button", { name: /convert more/i }));

		expect(screen.getByText(/drop/i)).toBeInTheDocument();
		expect(screen.queryByText("a.jpg")).not.toBeInTheDocument();
	});
});
