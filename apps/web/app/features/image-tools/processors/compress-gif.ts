// Core tool is a browser-only stub — gifsicle-wasm-browser is
// browser-only. Type-only import keeps the drift-prevention test
// satisfied while the real work stays on the main thread here.
import type {} from "@nouploads/core/tools/browser-only-stubs";

export interface CompressGifOptions {
	/** Lossy compression level (0–200). Higher = more compression + more artifacts. Default 80. */
	lossy: number;
	/** Number of colors to keep (2–256). 256 = no reduction. */
	colors: number;
	/** Optimize transparency for better compression. */
	optimizeTransparency: boolean;
	/** Signal to abort processing. */
	signal?: AbortSignal;
}

export interface CompressGifResult {
	blob: Blob;
}

export async function compressGif(
	input: Blob,
	options: CompressGifOptions,
): Promise<CompressGifResult> {
	const { lossy, colors, optimizeTransparency, signal } = options;

	if (signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	// @ts-expect-error — no type declarations for gifsicle-wasm-browser
	const gifsicle = await import("gifsicle-wasm-browser");

	if (signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	// Build gifsicle command
	// -O2 enables store-only-changed-pixels + transparency optimization
	// -O3 is slower with marginal improvement, especially for large files
	const parts = [optimizeTransparency ? "-O2" : "-O1"];

	if (lossy > 0) {
		parts.push(`--lossy=${lossy}`);
	}

	if (colors < 256) {
		parts.push(`--colors`, `${colors}`);
	}

	parts.push("input.gif", "-o", "/out/output.gif");

	const command = [parts.join(" ")];

	const result = await gifsicle.default.run({
		input: [{ file: input, name: "input.gif" }],
		command,
	});

	if (signal?.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	if (!result || !Array.isArray(result) || result.length === 0) {
		throw new Error("GIF compression produced no output");
	}

	const outputFile = result[0];
	if (!outputFile || outputFile.size === 0) {
		throw new Error("GIF compression produced an empty file");
	}

	// gifsicle-wasm-browser returns File objects (which extend Blob)
	return { blob: outputFile };
}

export async function compressGifBatch(
	inputs: Blob[],
	options: CompressGifOptions,
	onProgress?: (completedIndex: number, totalCount: number) => void,
): Promise<(CompressGifResult | Error)[]> {
	const results: (CompressGifResult | Error)[] = [];

	for (let i = 0; i < inputs.length; i++) {
		try {
			const output = await compressGif(inputs[i], options);
			results.push(output);
		} catch (err) {
			results.push(err instanceof Error ? err : new Error(String(err)));
		}
		onProgress?.(i, inputs.length);
	}

	return results;
}
