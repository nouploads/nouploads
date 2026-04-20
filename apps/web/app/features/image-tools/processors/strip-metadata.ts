/**
 * Strip image metadata — web adapter. Runs
 * @nouploads/core/tools/strip-metadata in the image-pipeline worker.
 * readMetadataSummary stays on the main thread (fast, no worker needed —
 * exifr parses a small header range).
 */
import type {} from "@nouploads/core/tools/strip-metadata";
import exifr from "exifr";
import { runInPipeline } from "../lib/run-in-pipeline";

export interface MetadataSummary {
	camera?: string;
	gps?: { lat: number; lng: number };
	date?: string;
	software?: string;
	dimensions: { width: number; height: number };
	hasGps: boolean;
	fieldCount: number;
}

export interface StripResult {
	blob: Blob;
	originalSize: number;
	strippedSize: number;
	metadataBefore: MetadataSummary;
}

export async function readMetadataSummary(
	file: File,
): Promise<MetadataSummary> {
	const raw = await exifr.parse(file, {
		translateKeys: true,
		translateValues: true,
		reviveValues: true,
		tiff: true,
		xmp: true,
		icc: true,
		iptc: true,
		jfif: true,
		ihdr: true,
		gps: true,
		exif: true,
		interop: true,
	});

	const metadata = raw ?? {};
	const fieldCount = Object.keys(metadata).length;
	const hasGps = !!(metadata.latitude || metadata.longitude);

	const make = metadata.Make as string | undefined;
	const model = metadata.Model as string | undefined;
	let camera: string | undefined;
	if (make && model) {
		camera = model.startsWith(make) ? model : `${make} ${model}`;
	} else if (model) {
		camera = model;
	} else if (make) {
		camera = make;
	}

	let gps: { lat: number; lng: number } | undefined;
	if (hasGps) {
		gps = {
			lat: metadata.latitude as number,
			lng: metadata.longitude as number,
		};
	}

	const dateRaw =
		metadata.DateTimeOriginal ?? metadata.DateTime ?? metadata.ModifyDate;
	let date: string | undefined;
	if (dateRaw instanceof Date) {
		date = dateRaw.toISOString().slice(0, 19).replace("T", " ");
	} else if (typeof dateRaw === "string") {
		date = dateRaw;
	}

	const software = metadata.Software as string | undefined;
	const width = (metadata.ImageWidth as number) ?? 0;
	const height = (metadata.ImageHeight as number) ?? 0;

	return {
		camera,
		gps,
		date,
		software,
		dimensions: { width, height },
		hasGps,
		fieldCount,
	};
}

export async function stripMetadata(
	file: File,
	options?: { quality?: number; signal?: AbortSignal },
): Promise<StripResult> {
	const signal = options?.signal;
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const metadataBefore = await readMetadataSummary(file);
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bytes = new Uint8Array(await file.arrayBuffer());
	const result = await runInPipeline({
		toolId: "strip-metadata",
		input: bytes,
		options: { quality: options?.quality ?? 92 },
		signal,
	});

	const blob = new Blob([result.output as BlobPart], {
		type: result.mimeType,
	});

	// Prefer dimensions from core's metadata when available
	const actualWidth = (result.metadata?.width as number) ?? 0;
	const actualHeight = (result.metadata?.height as number) ?? 0;
	if (actualWidth && actualHeight) {
		metadataBefore.dimensions = { width: actualWidth, height: actualHeight };
	}

	return {
		blob,
		originalSize: file.size,
		strippedSize: blob.size,
		metadataBefore,
	};
}
