import type { VectorDecoderResult } from "./types";

/**
 * Decode an SVGZ (gzip-compressed SVG) file to SVG markup.
 *
 * Uses the browser's native DecompressionStream API (Chrome 80+,
 * Firefox 113+, Safari 16.4+) with an fflate fallback for older
 * browsers or environments where the Compression Streams API is
 * unavailable.
 */
export async function decodeSvgz(
	input: Blob,
	signal?: AbortSignal,
): Promise<VectorDecoderResult> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();
	const bytes = new Uint8Array(buffer);

	// Verify gzip magic bytes (0x1F 0x8B)
	if (bytes.length < 2 || bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
		throw new Error(
			"This SVGZ file could not be decoded. Invalid gzip header.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Decompress using native DecompressionStream, with fflate fallback
	let svgText: string;
	try {
		const ds = new DecompressionStream("gzip");
		const readable = new Blob([buffer]).stream().pipeThrough(ds);
		svgText = await new Response(readable).text();
	} catch {
		const { gunzipSync } = await import("fflate");
		svgText = new TextDecoder().decode(gunzipSync(bytes));
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	if (!svgText.includes("<svg")) {
		throw new Error("Decompressed data does not appear to contain SVG markup.");
	}

	// Extract dimensions from SVG attributes
	const widthMatch = svgText.match(/width="([^"]+)"/);
	const heightMatch = svgText.match(/height="([^"]+)"/);
	const width = widthMatch ? Number.parseFloat(widthMatch[1]) : undefined;
	const height = heightMatch ? Number.parseFloat(heightMatch[1]) : undefined;

	return { svgMarkup: svgText, width, height, sourceFormat: "SVGZ" };
}
