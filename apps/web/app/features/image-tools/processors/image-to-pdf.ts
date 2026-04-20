/**
 * Images → PDF — web adapter. Runs @nouploads/core/tools/images-to-pdf in
 * the image-pipeline worker. Progress reporting is coarse (start/end
 * only) because the core tool's internal `onProgress` isn't surfaced
 * across the worker boundary yet.
 */
import type {} from "@nouploads/core/tools/images-to-pdf";
import { runInPipeline } from "../lib/run-in-pipeline";

export interface ImageToPdfOptions {
	pageSize?: "fit" | "a4" | "letter";
	signal?: AbortSignal;
}

export async function imagesToPdf(
	images: File[],
	options?: ImageToPdfOptions,
	onProgress?: (completed: number, total: number) => void,
): Promise<Blob> {
	if (images.length === 0) {
		throw new Error("No images provided");
	}

	const pageSize = options?.pageSize ?? "fit";
	const signal = options?.signal;

	onProgress?.(0, images.length);

	const inputs: Uint8Array[] = [];
	for (const file of images) {
		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
		inputs.push(new Uint8Array(await file.arrayBuffer()));
	}

	const result = await runInPipeline({
		toolId: "images-to-pdf",
		inputs,
		options: { pageSize },
		signal,
	});

	onProgress?.(images.length, images.length);
	return new Blob([result.output as BlobPart], { type: "application/pdf" });
}
