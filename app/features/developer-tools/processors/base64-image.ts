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
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const dataUri = reader.result as string;
			const commaIndex = dataUri.indexOf(",");
			const rawBase64 = dataUri.slice(commaIndex + 1);
			resolve({
				dataUri,
				rawBase64,
				mimeType: file.type || "application/octet-stream",
				byteLength: file.size,
				base64Length: rawBase64.length,
			});
		};
		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});
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
		try {
			const firstBytes = atob(base64Data.slice(0, 16));
			if (firstBytes.startsWith("\xFF\xD8\xFF")) mimeType = "image/jpeg";
			else if (firstBytes.startsWith("\x89PNG")) mimeType = "image/png";
			else if (firstBytes.startsWith("GIF8")) mimeType = "image/gif";
			else if (
				firstBytes.startsWith("RIFF") &&
				firstBytes.slice(8, 12) === "WEBP"
			)
				mimeType = "image/webp";
		} catch {
			// If detection fails, keep default
		}
	}

	try {
		const binary = atob(base64Data.replace(/\s/g, ""));
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		const blob = new Blob([bytes], { type: mimeType });

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
