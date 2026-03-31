import exifr from "exifr";

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

/**
 * Read a summary of key metadata fields from an image file using exifr.
 */
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

	// Build camera string from Make + Model
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

	// Extract GPS
	let gps: { lat: number; lng: number } | undefined;
	if (hasGps) {
		gps = {
			lat: metadata.latitude as number,
			lng: metadata.longitude as number,
		};
	}

	// Extract date
	const dateRaw =
		metadata.DateTimeOriginal ?? metadata.DateTime ?? metadata.ModifyDate;
	let date: string | undefined;
	if (dateRaw instanceof Date) {
		date = dateRaw.toISOString().slice(0, 19).replace("T", " ");
	} else if (typeof dateRaw === "string") {
		date = dateRaw;
	}

	// Extract software
	const software = metadata.Software as string | undefined;

	// Extract dimensions from EXIF (fallback to 0)
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

/**
 * Strip all metadata from an image by re-encoding through Canvas.
 * Canvas re-encode produces a clean file with no embedded metadata.
 */
export async function stripMetadata(
	file: File,
	options?: { quality?: number; signal?: AbortSignal },
): Promise<StripResult> {
	const signal = options?.signal;
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Read metadata before stripping
	const metadataBefore = await readMetadataSummary(file);
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Create image bitmap
	const bitmap = await createImageBitmap(file);
	const { width, height } = bitmap;

	if (signal?.aborted) {
		bitmap.close();
		throw new DOMException("Aborted", "AbortError");
	}

	// Update dimensions from actual bitmap
	metadataBefore.dimensions = { width, height };

	// Draw onto OffscreenCanvas to strip all metadata
	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		bitmap.close();
		throw new Error("Failed to create canvas context");
	}
	ctx.drawImage(bitmap, 0, 0);
	bitmap.close();

	// Determine output MIME type and quality
	let outputType = file.type;
	const quality = (options?.quality ?? 92) / 100;
	if (!["image/jpeg", "image/png", "image/webp"].includes(outputType)) {
		outputType = "image/png";
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const blob = await canvas.convertToBlob({
		type: outputType,
		quality: outputType === "image/png" ? undefined : quality,
	});

	return {
		blob,
		originalSize: file.size,
		strippedSize: blob.size,
		metadataBefore,
	};
}
