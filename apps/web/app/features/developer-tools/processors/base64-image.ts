import { decodeBase64, encodeBase64 } from "@nouploads/core";

/**
 * Encode a file to base64 data URI and raw base64 string.
 */
export interface Base64EncodeResult {
	dataUri: string;
	rawBase64: string;
	mimeType: string;
	byteLength: number;
	base64Length: number;
}

export async function encodeImageToBase64(
	file: File,
): Promise<Base64EncodeResult> {
	const bytes = new Uint8Array(await file.arrayBuffer());
	const rawBase64 = encodeBase64(bytes);
	const mimeType = file.type || "application/octet-stream";
	const dataUri = `data:${mimeType};base64,${rawBase64}`;

	return {
		dataUri,
		rawBase64,
		mimeType,
		byteLength: file.size,
		base64Length: rawBase64.length,
	};
}

/**
 * Decode a base64 string (with or without data URI prefix) to a Blob.
 */
export interface Base64DecodeResult {
	blob: Blob;
	mimeType: string;
	width?: number;
	height?: number;
}

export async function decodeBase64ToImage(
	input: string,
): Promise<Base64DecodeResult> {
	const trimmed = input.trim();

	let mimeType = "image/png";
	let base64Data: string;

	if (trimmed.startsWith("data:")) {
		const match = trimmed.match(/^data:([^;]+);base64,(.+)$/s);
		if (!match) throw new Error("Invalid data URI format");
		mimeType = match[1];
		base64Data = match[2];
	} else {
		base64Data = trimmed;
		// Detect MIME from magic bytes of decoded content
		try {
			const probe = decodeBase64(base64Data.slice(0, 24));
			if (probe[0] === 0xff && probe[1] === 0xd8 && probe[2] === 0xff)
				mimeType = "image/jpeg";
			else if (
				probe[0] === 0x89 &&
				probe[1] === 0x50 &&
				probe[2] === 0x4e &&
				probe[3] === 0x47
			)
				mimeType = "image/png";
			else if (
				probe[0] === 0x47 &&
				probe[1] === 0x49 &&
				probe[2] === 0x46 &&
				probe[3] === 0x38
			)
				mimeType = "image/gif";
			else if (
				probe[0] === 0x52 &&
				probe[1] === 0x49 &&
				probe[8] === 0x57 &&
				probe[9] === 0x45
			)
				mimeType = "image/webp";
		} catch {
			// If detection fails, keep default
		}
	}

	try {
		const cleaned = base64Data.replace(/\s/g, "");
		// Validate base64 characters before decoding
		if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
			throw new Error("Invalid base64 characters");
		}
		const bytes = decodeBase64(cleaned);
		const blob = new Blob([bytes as BlobPart], { type: mimeType });

		let width: number | undefined;
		let height: number | undefined;
		try {
			const bitmap = await createImageBitmap(blob);
			width = bitmap.width;
			height = bitmap.height;
			bitmap.close();
		} catch {
			// Not a valid image or unsupported format
		}

		return { blob, mimeType, width, height };
	} catch {
		throw new Error("Invalid base64 string — could not decode");
	}
}
