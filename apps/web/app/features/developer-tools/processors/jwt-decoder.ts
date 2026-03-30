/**
 * JWT Decoder processor.
 *
 * Decodes a JWT token string into its header, payload, and signature parts.
 * Uses only browser-built-in base64 decoding (atob) — no external libraries.
 */

export interface DecodedJwt {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	signature: string; // hex representation
	headerRaw: string; // raw base64url
	payloadRaw: string; // raw base64url
	signatureRaw: string; // raw base64url
	isExpired: boolean | null; // null if no exp claim
	expiresAt: Date | null;
}

/**
 * Decode a base64url-encoded string to a UTF-8 string.
 */
function base64UrlDecode(str: string): string {
	// Replace URL-safe chars with standard base64
	const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
	// Pad with = if needed
	const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
	return atob(padded);
}

/**
 * Decode a JWT token string into its constituent parts.
 *
 * @throws Error if the token does not have exactly 3 dot-separated parts,
 *         or if the header/payload are not valid JSON.
 */
export function decodeJwt(token: string): DecodedJwt {
	const trimmed = token.trim();
	if (!trimmed) {
		throw new Error("Empty input: please paste a JWT token");
	}

	const parts = trimmed.split(".");
	if (parts.length !== 3) {
		throw new Error("Invalid JWT: expected 3 parts separated by dots");
	}

	const [headerB64, payloadB64, signatureB64] = parts;

	let headerJson: string;
	let payloadJson: string;
	try {
		headerJson = base64UrlDecode(headerB64);
	} catch {
		throw new Error("Invalid JWT: header is not valid base64url");
	}

	try {
		payloadJson = base64UrlDecode(payloadB64);
	} catch {
		throw new Error("Invalid JWT: payload is not valid base64url");
	}

	let header: Record<string, unknown>;
	let payload: Record<string, unknown>;
	try {
		header = JSON.parse(headerJson);
	} catch {
		throw new Error("Invalid JWT: header is not valid JSON");
	}

	try {
		payload = JSON.parse(payloadJson);
	} catch {
		throw new Error("Invalid JWT: payload is not valid JSON");
	}

	// Convert signature to hex
	let sigBytes: string;
	try {
		sigBytes = base64UrlDecode(signatureB64);
	} catch {
		throw new Error("Invalid JWT: signature is not valid base64url");
	}
	const signature = Array.from(sigBytes, (c) =>
		c.charCodeAt(0).toString(16).padStart(2, "0"),
	).join("");

	// Check expiration
	let isExpired: boolean | null = null;
	let expiresAt: Date | null = null;
	if (typeof payload.exp === "number") {
		expiresAt = new Date(payload.exp * 1000);
		isExpired = Date.now() > payload.exp * 1000;
	}

	return {
		header,
		payload,
		signature,
		headerRaw: headerB64,
		payloadRaw: payloadB64,
		signatureRaw: signatureB64,
		isExpired,
		expiresAt,
	};
}
