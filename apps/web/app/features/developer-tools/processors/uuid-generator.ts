export interface UuidValidation {
	valid: boolean;
	version: number | null;
	variant: string | null;
	timestamp?: Date;
}

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Generate a random UUID v4 using the Web Crypto API.
 */
export function generateUuidV4(): string {
	return crypto.randomUUID();
}

/**
 * Generate a timestamp-ordered UUID v7 per RFC 9562.
 * First 48 bits encode Unix timestamp in milliseconds,
 * remaining bits are random with version/variant set.
 */
export function generateUuidV7(): string {
	const now = Date.now();
	const bytes = new Uint8Array(16);
	// Timestamp in first 48 bits (big-endian)
	bytes[0] = (now / 2 ** 40) & 0xff;
	bytes[1] = (now / 2 ** 32) & 0xff;
	bytes[2] = (now / 2 ** 24) & 0xff;
	bytes[3] = (now / 2 ** 16) & 0xff;
	bytes[4] = (now / 2 ** 8) & 0xff;
	bytes[5] = now & 0xff;
	// Random fill remaining bytes
	crypto.getRandomValues(bytes.subarray(6));
	// Set version 7 (0111 in bits 48-51)
	bytes[6] = (bytes[6] & 0x0f) | 0x70;
	// Set variant 10xx (bits 64-65)
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	// Format as UUID string
	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Generate multiple UUIDs of the specified version.
 */
export function generateBulk(version: "v4" | "v7", count: number): string[] {
	const clamped = Math.min(Math.max(1, count), 1000);
	const result: string[] = [];
	const fn = version === "v7" ? generateUuidV7 : generateUuidV4;
	for (let i = 0; i < clamped; i++) {
		result.push(fn());
	}
	return result;
}

/**
 * Validate a UUID string and extract version, variant, and
 * embedded timestamp (for v7).
 */
export function validateUuid(input: string): UuidValidation {
	const trimmed = input.trim().toLowerCase();

	if (!UUID_REGEX.test(trimmed)) {
		return { valid: false, version: null, variant: null };
	}

	// Extract version nibble (character at position 14, the first
	// char of the third group)
	const versionChar = trimmed[14];
	const version = Number.parseInt(versionChar, 16);

	// Extract variant bits (character at position 19, the first
	// char of the fourth group)
	const variantNibble = Number.parseInt(trimmed[19], 16);
	let variant: string;
	if ((variantNibble & 0b1000) === 0) {
		variant = "NCS";
	} else if ((variantNibble & 0b1100) === 0b1000) {
		variant = "RFC 4122";
	} else if ((variantNibble & 0b1110) === 0b1100) {
		variant = "Microsoft";
	} else {
		variant = "Future";
	}

	const result: UuidValidation = {
		valid: true,
		version,
		variant,
	};

	// For v7, extract the embedded timestamp from the first 48 bits
	if (version === 7) {
		const hex = trimmed.replace(/-/g, "");
		const timestampHex = hex.slice(0, 12);
		const timestamp = Number.parseInt(timestampHex, 16);
		result.timestamp = new Date(timestamp);
	}

	return result;
}
