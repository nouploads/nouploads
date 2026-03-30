import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock gifsicle-wasm-browser module
const mockRun = vi.fn();
vi.mock("gifsicle-wasm-browser", () => ({
	default: { run: mockRun },
}));

describe("compressGif", () => {
	beforeEach(() => {
		mockRun.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should call gifsicle with lossy and optimization flags", async () => {
		const { compressGif } = await import(
			"~/features/image-tools/processors/compress-gif"
		);

		const outputFile = new File(["compressed"], "output.gif", {
			type: "image/gif",
		});
		mockRun.mockResolvedValue([outputFile]);

		const input = new Blob(["fake-gif"], { type: "image/gif" });
		const result = await compressGif(input, {
			lossy: 80,
			colors: 256,
			optimizeTransparency: true,
		});

		expect(mockRun).toHaveBeenCalledOnce();
		const callArgs = mockRun.mock.calls[0][0];
		expect(callArgs.input[0].name).toBe("input.gif");
		expect(callArgs.command[0]).toContain("--lossy=80");
		expect(callArgs.command[0]).toContain("-O2");
		expect(callArgs.command[0]).not.toContain("--colors");
		expect(callArgs.command[0]).toContain("-o /out/output.gif");
		expect(result.blob).toBe(outputFile);
	});

	it("should include --colors flag when colors < 256", async () => {
		const { compressGif } = await import(
			"~/features/image-tools/processors/compress-gif"
		);

		const outputFile = new File(["compressed"], "output.gif", {
			type: "image/gif",
		});
		mockRun.mockResolvedValue([outputFile]);

		const input = new Blob(["fake-gif"], { type: "image/gif" });
		await compressGif(input, {
			lossy: 50,
			colors: 128,
			optimizeTransparency: false,
		});

		const command = mockRun.mock.calls[0][0].command[0];
		expect(command).toContain("--colors 128");
		expect(command).toContain("-O1");
		expect(command).not.toContain("-O2");
	});

	it("should skip --lossy flag when lossy is 0", async () => {
		const { compressGif } = await import(
			"~/features/image-tools/processors/compress-gif"
		);

		const outputFile = new File(["compressed"], "output.gif", {
			type: "image/gif",
		});
		mockRun.mockResolvedValue([outputFile]);

		const input = new Blob(["fake-gif"], { type: "image/gif" });
		await compressGif(input, {
			lossy: 0,
			colors: 256,
			optimizeTransparency: false,
		});

		const command = mockRun.mock.calls[0][0].command[0];
		expect(command).not.toContain("--lossy");
		expect(command).toContain("-O1");
	});

	it("should throw when gifsicle returns no output", async () => {
		const { compressGif } = await import(
			"~/features/image-tools/processors/compress-gif"
		);

		mockRun.mockResolvedValue([]);

		const input = new Blob(["fake-gif"], { type: "image/gif" });
		await expect(
			compressGif(input, {
				lossy: 80,
				colors: 256,
				optimizeTransparency: true,
			}),
		).rejects.toThrow("GIF compression produced no output");
	});

	it("should reject immediately if signal already aborted", async () => {
		const { compressGif } = await import(
			"~/features/image-tools/processors/compress-gif"
		);

		const controller = new AbortController();
		controller.abort();

		const input = new Blob(["fake-gif"], { type: "image/gif" });
		await expect(
			compressGif(input, {
				lossy: 80,
				colors: 256,
				optimizeTransparency: true,
				signal: controller.signal,
			}),
		).rejects.toThrow();

		expect(mockRun).not.toHaveBeenCalled();
	});
});

describe("compressGifBatch", () => {
	beforeEach(() => {
		mockRun.mockReset();
	});

	it("should compress multiple files and report progress", async () => {
		const { compressGifBatch } = await import(
			"~/features/image-tools/processors/compress-gif"
		);

		const out1 = new File(["c1"], "out1.gif", { type: "image/gif" });
		const out2 = new File(["c2"], "out2.gif", { type: "image/gif" });
		mockRun.mockResolvedValueOnce([out1]).mockResolvedValueOnce([out2]);

		const inputs = [
			new Blob(["gif1"], { type: "image/gif" }),
			new Blob(["gif2"], { type: "image/gif" }),
		];
		const onProgress = vi.fn();

		const results = await compressGifBatch(
			inputs,
			{ lossy: 80, colors: 256, optimizeTransparency: true },
			onProgress,
		);

		expect(results).toHaveLength(2);
		expect((results[0] as { blob: Blob }).blob).toBe(out1);
		expect((results[1] as { blob: Blob }).blob).toBe(out2);
		expect(onProgress).toHaveBeenCalledTimes(2);
		expect(onProgress).toHaveBeenCalledWith(0, 2);
		expect(onProgress).toHaveBeenCalledWith(1, 2);
	});

	it("should capture errors per file without stopping batch", async () => {
		const { compressGifBatch } = await import(
			"~/features/image-tools/processors/compress-gif"
		);

		const out1 = new File(["c1"], "out1.gif", { type: "image/gif" });
		mockRun
			.mockResolvedValueOnce([out1])
			.mockRejectedValueOnce(new Error("bad gif"));

		const inputs = [
			new Blob(["gif1"], { type: "image/gif" }),
			new Blob(["gif2"], { type: "image/gif" }),
		];

		const results = await compressGifBatch(inputs, {
			lossy: 80,
			colors: 256,
			optimizeTransparency: true,
		});

		expect(results).toHaveLength(2);
		expect((results[0] as { blob: Blob }).blob).toBe(out1);
		expect(results[1]).toBeInstanceOf(Error);
		expect((results[1] as Error).message).toBe("bad gif");
	});
});
