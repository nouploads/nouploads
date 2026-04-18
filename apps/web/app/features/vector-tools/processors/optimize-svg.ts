import { getTool, isToolResultMulti } from "@nouploads/core";

export interface OptimizeSvgOptions {
	removeComments?: boolean;
	removeMetadata?: boolean;
	cleanupIds?: boolean;
	signal?: AbortSignal;
}

export interface OptimizeSvgResult {
	svg: string;
	originalSize: number;
	optimizedSize: number;
}

export async function optimizeSvg(
	input: Blob,
	options?: OptimizeSvgOptions,
): Promise<OptimizeSvgResult> {
	const signal = options?.signal;
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bytes = new Uint8Array(await input.arrayBuffer());
	const originalSize = bytes.byteLength;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const tool = getTool("optimize-svg");
	if (!tool) throw new Error("optimize-svg tool not found in core registry");

	const result = await tool.execute(bytes, { multipass: true }, { signal });
	if (isToolResultMulti(result)) {
		throw new Error("optimize-svg unexpectedly returned multiple outputs");
	}

	const svg = new TextDecoder().decode(result.output);
	return {
		svg,
		originalSize,
		optimizedSize: result.output.byteLength,
	};
}

/**
 * Compress an optimized SVG string to SVGZ (gzipped SVG).
 * Tries native CompressionStream first, falls back to fflate.
 */
export async function svgToSvgz(svg: string): Promise<Blob> {
	try {
		const cs = new CompressionStream("gzip");
		const writer = cs.writable.getWriter();
		writer.write(new TextEncoder().encode(svg));
		writer.close();
		return new Response(cs.readable).blob();
	} catch {
		const { gzipSync } = await import("fflate");
		const compressed = gzipSync(new TextEncoder().encode(svg));
		return new Blob([compressed as BlobPart], { type: "image/svg+xml" });
	}
}
