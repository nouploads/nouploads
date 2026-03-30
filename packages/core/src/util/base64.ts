/**
 * Portable base64 encode/decode utilities.
 * No dependency on `atob`/`btoa` (browser) or `Buffer` (Node).
 */

const CHARS =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function encodeBase64(bytes: Uint8Array): string {
	let result = "";
	const len = bytes.length;
	for (let i = 0; i < len; i += 3) {
		const b0 = bytes[i];
		const b1 = i + 1 < len ? bytes[i + 1] : 0;
		const b2 = i + 2 < len ? bytes[i + 2] : 0;

		result += CHARS[b0 >> 2];
		result += CHARS[((b0 & 3) << 4) | (b1 >> 4)];
		result += i + 1 < len ? CHARS[((b1 & 15) << 2) | (b2 >> 6)] : "=";
		result += i + 2 < len ? CHARS[b2 & 63] : "=";
	}
	return result;
}

const LOOKUP = new Uint8Array(128);
for (let i = 0; i < CHARS.length; i++) {
	LOOKUP[CHARS.charCodeAt(i)] = i;
}

export function decodeBase64(str: string): Uint8Array {
	// Strip whitespace and padding
	const clean = str.replace(/[\s=]/g, "");
	const len = clean.length;
	const outLen = (len * 3) >> 2;
	const out = new Uint8Array(outLen);

	let j = 0;
	for (let i = 0; i < len; i += 4) {
		const a = LOOKUP[clean.charCodeAt(i)];
		const b = i + 1 < len ? LOOKUP[clean.charCodeAt(i + 1)] : 0;
		const c = i + 2 < len ? LOOKUP[clean.charCodeAt(i + 2)] : 0;
		const d = i + 3 < len ? LOOKUP[clean.charCodeAt(i + 3)] : 0;

		out[j++] = (a << 2) | (b >> 4);
		if (j < outLen) out[j++] = ((b & 15) << 4) | (c >> 2);
		if (j < outLen) out[j++] = ((c & 3) << 6) | d;
	}
	return out;
}

/** Detect MIME type from data URI prefix (e.g. "data:image/png;base64,...") */
export function mimeFromDataUri(dataUri: string): string | null {
	const match = dataUri.match(/^data:([^;,]+)/);
	return match ? match[1] : null;
}

/** Strip data URI prefix, returning just the base64 content */
export function stripDataUriPrefix(input: string): string {
	const idx = input.indexOf(",");
	if (idx !== -1 && input.startsWith("data:")) {
		return input.slice(idx + 1);
	}
	return input;
}
