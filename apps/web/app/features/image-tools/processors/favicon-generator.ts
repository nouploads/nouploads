/**
 * Favicon generator — web adapter. Runs @nouploads/core/tools/favicon-generator
 * via the multi-output image pipeline and splits the emitted outputs back
 * into the `{icoBlob, sizes[]}` shape that the UI component consumes.
 */
import type {} from "@nouploads/core/tools/favicon-generator";
import { runInPipelineMulti } from "../lib/run-in-pipeline";

export interface FaviconSizeResult {
	size: number;
	pngBlob: Blob;
}

export interface FaviconGeneratorResult {
	icoBlob: Blob;
	sizes: FaviconSizeResult[];
}

export const DEFAULT_SIZES = [16, 32, 48];

/**
 * Generate a multi-size favicon ICO file from an image.
 * Dispatches to the core favicon-generator tool via the pipeline worker.
 */
export async function generateFavicon(
	input: File,
	options?: {
		sizes?: number[];
		signal?: AbortSignal;
	},
): Promise<FaviconGeneratorResult> {
	const signal = options?.signal;
	const bytes = new Uint8Array(await input.arrayBuffer());

	const result = await runInPipelineMulti({
		toolId: "favicon-generator",
		input: bytes,
		options: {},
		signal,
	});

	let icoBlob: Blob | null = null;
	const sizes: FaviconSizeResult[] = [];

	for (const out of result.outputs) {
		const blob = new Blob([out.bytes as BlobPart], { type: out.mimeType });
		if (out.mimeType === "image/x-icon") {
			icoBlob = blob;
			continue;
		}
		const match = /favicon-(\d+)x\d+\.png/.exec(out.filename);
		if (match) {
			sizes.push({ size: Number(match[1]), pngBlob: blob });
		}
	}

	if (!icoBlob) {
		throw new Error("Favicon pipeline did not return an .ico output");
	}

	sizes.sort((a, b) => a.size - b.size);

	return { icoBlob, sizes };
}
