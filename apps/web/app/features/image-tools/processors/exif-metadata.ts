/**
 * Parse EXIF/XMP/IPTC/ICC metadata from image files using exifr.
 * Main-thread only — exifr reads a small header range, fast enough that
 * a worker would be overkill. The stripping operation lives in
 * strip-metadata.ts which delegates to @nouploads/core.
 */
// Type-only dependency on core's exif tool — documents that the CLI /
// library side surfaces this capability via the core registry, even
// though the web viewer uses exifr directly for its richer categorized
// output shape.
import type {} from "@nouploads/core/tools/exif";
import exifr from "exifr";

export interface ExifData {
	camera?: Record<string, string | number | boolean>;
	lens?: Record<string, string | number | boolean>;
	exposure?: Record<string, string | number | boolean>;
	gps?: Record<string, string | number | boolean>;
	image?: Record<string, string | number | boolean>;
	other?: Record<string, string | number | boolean>;
	hasGps: boolean;
	raw: Record<string, unknown>;
}

const CAMERA_FIELDS = [
	"Make",
	"Model",
	"Software",
	"DateTime",
	"DateTimeOriginal",
	"ModifyDate",
];
const LENS_FIELDS = [
	"LensModel",
	"LensMake",
	"FocalLength",
	"FocalLengthIn35mmFormat",
];
const EXPOSURE_FIELDS = [
	"ExposureTime",
	"FNumber",
	"ISO",
	"ExposureProgram",
	"MeteringMode",
	"Flash",
	"WhiteBalance",
	"ExposureCompensation",
	"ShutterSpeedValue",
	"ApertureValue",
];
const GPS_FIELDS = [
	"latitude",
	"longitude",
	"GPSAltitude",
	"GPSDateStamp",
	"GPSTimeStamp",
];
const IMAGE_FIELDS = [
	"ImageWidth",
	"ImageHeight",
	"Orientation",
	"ColorSpace",
	"BitsPerSample",
	"Compression",
	"XResolution",
	"YResolution",
];

export async function parseExifData(file: File): Promise<ExifData> {
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

	if (!raw) return { hasGps: false, raw: {} };

	const camera: Record<string, string | number | boolean> = {};
	const lens: Record<string, string | number | boolean> = {};
	const exposure: Record<string, string | number | boolean> = {};
	const gps: Record<string, string | number | boolean> = {};
	const image: Record<string, string | number | boolean> = {};
	const other: Record<string, string | number | boolean> = {};

	for (const [key, value] of Object.entries(raw)) {
		if (value === undefined || value === null) continue;
		const displayValue: string | number | boolean =
			typeof value === "object"
				? JSON.stringify(value)
				: typeof value === "string" ||
						typeof value === "number" ||
						typeof value === "boolean"
					? value
					: String(value);

		if (CAMERA_FIELDS.includes(key)) camera[key] = displayValue;
		else if (LENS_FIELDS.includes(key)) lens[key] = displayValue;
		else if (EXPOSURE_FIELDS.includes(key)) exposure[key] = displayValue;
		else if (GPS_FIELDS.includes(key)) gps[key] = displayValue;
		else if (IMAGE_FIELDS.includes(key)) image[key] = displayValue;
		else other[key] = displayValue;
	}

	const hasGps = !!(raw.latitude || raw.longitude);

	return { camera, lens, exposure, gps, image, other, hasGps, raw };
}
