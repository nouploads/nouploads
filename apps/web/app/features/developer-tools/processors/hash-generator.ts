export interface HashResult {
	md5: string;
	sha1: string;
	sha256: string;
	sha384: string;
	sha512: string;
}

/**
 * Compute a SHA-family hash using the Web Crypto API and return a hex string.
 */
async function digestToHex(
	algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512",
	data: Uint8Array,
): Promise<string> {
	const hash = await crypto.subtle.digest(algorithm, data);
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

// ─── MD5 implementation ──────────────────────────────────────
// Pure-JS MD5 following RFC 1321. Web Crypto does not support MD5.

function md5Hash(data: Uint8Array): string {
	// Pre-computed per-round shift amounts
	const s = [
		7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
		9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
		16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
		15, 21,
	];

	// Pre-computed constants: floor(2^32 * abs(sin(i + 1)))
	const K = [
		0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
		0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
		0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
		0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
		0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
		0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
		0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
		0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
		0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
		0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
		0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
	];

	// Pad message: append 0x80, then zeros, then 64-bit little-endian bit length
	const bitLen = data.length * 8;
	const padLen = (data.length % 64 < 56 ? 56 : 120) - (data.length % 64);
	const padded = new Uint8Array(data.length + padLen + 8);
	padded.set(data);
	padded[data.length] = 0x80;
	// Write bit length as 64-bit little-endian (only low 32 bits needed for < 512 MB)
	const view = new DataView(padded.buffer);
	view.setUint32(padded.length - 8, bitLen >>> 0, true);
	view.setUint32(padded.length - 4, Math.floor(bitLen / 0x100000000), true);

	// Initialize hash values
	let a0 = 0x67452301;
	let b0 = 0xefcdab89;
	let c0 = 0x98badcfe;
	let d0 = 0x10325476;

	// Process each 512-bit (64-byte) chunk
	const M = new Uint32Array(16);
	for (let offset = 0; offset < padded.length; offset += 64) {
		// Break chunk into sixteen 32-bit little-endian words
		for (let j = 0; j < 16; j++) {
			M[j] = view.getUint32(offset + j * 4, true);
		}

		let A = a0;
		let B = b0;
		let C = c0;
		let D = d0;

		for (let i = 0; i < 64; i++) {
			let F: number;
			let g: number;
			if (i < 16) {
				F = (B & C) | (~B & D);
				g = i;
			} else if (i < 32) {
				F = (D & B) | (~D & C);
				g = (5 * i + 1) % 16;
			} else if (i < 48) {
				F = B ^ C ^ D;
				g = (3 * i + 5) % 16;
			} else {
				F = C ^ (B | ~D);
				g = (7 * i) % 16;
			}
			F = (F + A + K[i] + M[g]) >>> 0;
			A = D;
			D = C;
			C = B;
			B = (B + ((F << s[i]) | (F >>> (32 - s[i])))) >>> 0;
		}

		a0 = (a0 + A) >>> 0;
		b0 = (b0 + B) >>> 0;
		c0 = (c0 + C) >>> 0;
		d0 = (d0 + D) >>> 0;
	}

	// Produce the final hash as a 32-character hex string (little-endian)
	function toLEHex(val: number): string {
		return [val & 0xff, (val >>> 8) & 0xff, (val >>> 16) & 0xff, val >>> 24]
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}

	return toLEHex(a0) + toLEHex(b0) + toLEHex(c0) + toLEHex(d0);
}

/**
 * Generate all five hash digests for a given byte array.
 */
export async function generateHashes(data: Uint8Array): Promise<HashResult> {
	const [sha1, sha256, sha384, sha512] = await Promise.all([
		digestToHex("SHA-1", data),
		digestToHex("SHA-256", data),
		digestToHex("SHA-384", data),
		digestToHex("SHA-512", data),
	]);
	const md5 = md5Hash(data);
	return { md5, sha1, sha256, sha384, sha512 };
}
