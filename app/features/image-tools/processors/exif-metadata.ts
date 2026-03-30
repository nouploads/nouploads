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

	if (!raw) {
		return { hasGps: false, raw: {} };
	}

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

export async function stripMetadata(
	file: File,
	signal?: AbortSignal,
): Promise<Blob> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bitmap = await createImageBitmap(file);
	const { width, height } = bitmap;

	if (signal?.aborted) {
		bitmap.close();
		throw new DOMException("Aborted", "AbortError");
	}

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		bitmap.close();
		throw new Error("Failed to create canvas context");
	}
	ctx.drawImage(bitmap, 0, 0);
	bitmap.close();

	let outputType = file.type;
	let quality: number | undefined;
	if (outputType === "image/jpeg") quality = 0.95;
	if (!["image/jpeg", "image/png", "image/webp"].includes(outputType)) {
		outputType = "image/png";
	}

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) resolve(blob);
				else reject(new Error("Failed to create image blob"));
			},
			outputType,
			quality,
		);
	});
}
