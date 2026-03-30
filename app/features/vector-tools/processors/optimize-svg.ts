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

	const text = await input.text();
	const originalSize = new Blob([text]).size;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Use the browser build — no Node-specific APIs needed
	const { optimize } = await import("svgo/browser");

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const result = optimize(text, {
		multipass: true,
		plugins: ["preset-default"],
	});

	return {
		svg: result.data,
		originalSize,
		optimizedSize: new Blob([result.data]).size,
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
		return new Blob([compressed], { type: "image/svg+xml" });
	}
}
