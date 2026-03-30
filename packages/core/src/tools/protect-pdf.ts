import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

/**
 * PDF permission flags per PDF spec Table 22 (§7.6.3.2).
 * Bits are numbered from 1 (LSB). Bits 1-2 must be 0, bits 7-8 must be 1.
 * We use a 32-bit signed integer where negative values have bit 32 set.
 */
const PERM_PRINT = 1 << 2; // bit 3
const PERM_MODIFY = 1 << 3; // bit 4
const PERM_COPY = 1 << 4; // bit 5
const PERM_ANNOT = 1 << 5; // bit 6
// Bits 7-8 must be 1 per spec
const PERM_REQUIRED = (1 << 6) | (1 << 7);
// Bits 13-32 must be 1 for rev 3+ (we set them all)
const PERM_HIGH_BITS = 0xfffff000;

/**
 * Padding string defined in PDF spec §7.6.3.3 (Algorithm 2).
 * Used to pad passwords to exactly 32 bytes.
 */
const PASSWORD_PADDING = new Uint8Array([
	0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41, 0x64, 0x00, 0x4b, 0x49, 0x53,
	0x30, 0x30, 0x30, 0x44, 0x6a, 0x04, 0x04, 0x6d, 0xb6, 0xd0, 0x68, 0x3e, 0x80,
	0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

/** Pad or truncate a password to 32 bytes per PDF spec Algorithm 2. */
function padPassword(password: string): Uint8Array {
	const encoded = new TextEncoder().encode(password);
	const result = new Uint8Array(32);
	const len = Math.min(encoded.length, 32);
	result.set(encoded.subarray(0, len));
	if (len < 32) {
		result.set(PASSWORD_PADDING.subarray(0, 32 - len), len);
	}
	return result;
}

/**
 * Simple MD5 implementation (RFC 1321).
 * PDF encryption requires MD5 for key derivation.
 */
function md5(data: Uint8Array): Uint8Array {
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
	const S = [
		7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
		9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
		16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
		15, 21,
	];

	// Pre-processing: add padding
	const bitLen = data.length * 8;
	const padLen =
		data.length % 64 < 56 ? 56 - (data.length % 64) : 120 - (data.length % 64);
	const padded = new Uint8Array(data.length + padLen + 8);
	padded.set(data);
	padded[data.length] = 0x80;
	// Append original length in bits as 64-bit LE
	const view = new DataView(padded.buffer);
	view.setUint32(padded.length - 8, bitLen >>> 0, true);
	view.setUint32(padded.length - 4, 0, true);

	let a0 = 0x67452301;
	let b0 = 0xefcdab89;
	let c0 = 0x98badcfe;
	let d0 = 0x10325476;

	for (let i = 0; i < padded.length; i += 64) {
		const M = new Uint32Array(16);
		for (let j = 0; j < 16; j++) {
			M[j] = view.getUint32(i + j * 4, true);
		}

		let a = a0;
		let b = b0;
		let c = c0;
		let d = d0;

		for (let j = 0; j < 64; j++) {
			let f: number;
			let g: number;
			if (j < 16) {
				f = (b & c) | (~b & d);
				g = j;
			} else if (j < 32) {
				f = (d & b) | (~d & c);
				g = (5 * j + 1) % 16;
			} else if (j < 48) {
				f = b ^ c ^ d;
				g = (3 * j + 5) % 16;
			} else {
				f = c ^ (b | ~d);
				g = (7 * j) % 16;
			}
			const temp = d;
			d = c;
			c = b;
			const x = (a + f + K[j] + M[g]) >>> 0;
			const rotated = ((x << S[j]) | (x >>> (32 - S[j]))) >>> 0;
			b = (b + rotated) >>> 0;
			a = temp;
		}

		a0 = (a0 + a) >>> 0;
		b0 = (b0 + b) >>> 0;
		c0 = (c0 + c) >>> 0;
		d0 = (d0 + d) >>> 0;
	}

	const result = new Uint8Array(16);
	const rv = new DataView(result.buffer);
	rv.setUint32(0, a0, true);
	rv.setUint32(4, b0, true);
	rv.setUint32(8, c0, true);
	rv.setUint32(12, d0, true);
	return result;
}

/**
 * RC4 cipher (symmetric — same function for encrypt and decrypt).
 */
function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
	const s = new Uint8Array(256);
	for (let i = 0; i < 256; i++) s[i] = i;

	let j = 0;
	for (let i = 0; i < 256; i++) {
		j = (j + s[i] + key[i % key.length]) & 0xff;
		[s[i], s[j]] = [s[j], s[i]];
	}

	const out = new Uint8Array(data.length);
	let ii = 0;
	let jj = 0;
	for (let k = 0; k < data.length; k++) {
		ii = (ii + 1) & 0xff;
		jj = (jj + s[ii]) & 0xff;
		[s[ii], s[jj]] = [s[jj], s[ii]];
		out[k] = data[k] ^ s[(s[ii] + s[jj]) & 0xff];
	}
	return out;
}

/** Concat multiple Uint8Arrays. */
function concat(...arrays: Uint8Array[]): Uint8Array {
	let total = 0;
	for (const a of arrays) total += a.length;
	const result = new Uint8Array(total);
	let offset = 0;
	for (const a of arrays) {
		result.set(a, offset);
		offset += a.length;
	}
	return result;
}

/**
 * Compute encryption key per PDF spec Algorithm 2 (§7.6.3.3).
 * For Standard Security Handler revision 3 with RC4-128.
 */
function computeEncryptionKey(
	password: string,
	ownerHash: Uint8Array,
	permissions: number,
	fileId: Uint8Array,
	keyLength: number,
): Uint8Array {
	const padded = padPassword(password);
	const permBytes = new Uint8Array(4);
	new DataView(permBytes.buffer).setInt32(0, permissions, true);

	let hash = md5(concat(padded, ownerHash, permBytes, fileId));

	// Rev 3: repeat MD5 50 times
	for (let i = 0; i < 50; i++) {
		hash = md5(hash.subarray(0, keyLength));
	}

	return hash.subarray(0, keyLength);
}

/**
 * Compute O value per PDF spec Algorithm 3 (§7.6.3.4).
 * For Standard Security Handler revision 3 with RC4-128.
 */
function computeOwnerHash(
	ownerPassword: string,
	userPassword: string,
	keyLength: number,
): Uint8Array {
	const ownerPadded = padPassword(ownerPassword);
	let hash = md5(ownerPadded);

	// Rev 3: repeat MD5 50 times
	for (let i = 0; i < 50; i++) {
		hash = md5(hash.subarray(0, keyLength));
	}

	const ownerKey = hash.subarray(0, keyLength);
	const userPadded = padPassword(userPassword);
	let encrypted = rc4(ownerKey, userPadded);

	// Rev 3: iterate RC4 with modified keys
	for (let i = 1; i <= 19; i++) {
		const tmpKey = new Uint8Array(ownerKey.length);
		for (let j = 0; j < ownerKey.length; j++) {
			tmpKey[j] = ownerKey[j] ^ i;
		}
		encrypted = rc4(tmpKey, encrypted);
	}

	return encrypted;
}

/**
 * Compute U value per PDF spec Algorithm 5 (§7.6.3.4).
 * For Standard Security Handler revision 3 with RC4-128.
 */
function computeUserHash(
	encryptionKey: Uint8Array,
	fileId: Uint8Array,
): Uint8Array {
	const hash = md5(concat(PASSWORD_PADDING, fileId));
	let encrypted = rc4(encryptionKey, hash);

	// Rev 3: iterate RC4 with modified keys
	for (let i = 1; i <= 19; i++) {
		const tmpKey = new Uint8Array(encryptionKey.length);
		for (let j = 0; j < encryptionKey.length; j++) {
			tmpKey[j] = encryptionKey[j] ^ i;
		}
		encrypted = rc4(tmpKey, encrypted);
	}

	// Pad to 32 bytes
	const result = new Uint8Array(32);
	result.set(encrypted);
	return result;
}

/** Build the permissions integer from option booleans. */
function buildPermissions(opts: {
	allowPrinting: boolean;
	allowCopying: boolean;
	allowEditing: boolean;
}): number {
	let p = PERM_REQUIRED | PERM_HIGH_BITS;
	if (opts.allowPrinting) p |= PERM_PRINT;
	if (opts.allowEditing) p |= PERM_MODIFY;
	if (opts.allowCopying) p |= PERM_COPY;
	// Always allow annotations for now
	p |= PERM_ANNOT;
	// Return as signed 32-bit
	return p | 0;
}

/** Generate a random file ID (16 bytes). */
function generateFileId(): Uint8Array {
	const id = new Uint8Array(16);
	if (
		typeof globalThis.crypto !== "undefined" &&
		globalThis.crypto.getRandomValues
	) {
		globalThis.crypto.getRandomValues(id);
	} else {
		for (let i = 0; i < 16; i++) {
			id[i] = Math.floor(Math.random() * 256);
		}
	}
	return id;
}

/** Convert Uint8Array to hex string. */
function toHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

const tool: ToolDefinition = {
	id: "protect-pdf",
	name: "Protect PDF",
	category: "pdf",
	description: "Add password protection and permission restrictions to a PDF.",
	inputMimeTypes: ["application/pdf"],
	inputExtensions: [".pdf"],
	options: [
		{
			name: "userPassword",
			type: "string",
			description: "Password required to open the PDF",
			default: "",
		},
		{
			name: "ownerPassword",
			type: "string",
			description:
				"Password required to change permissions (defaults to user password)",
			default: "",
		},
		{
			name: "allowPrinting",
			type: "boolean",
			description: "Allow printing the document",
			default: true,
		},
		{
			name: "allowCopying",
			type: "boolean",
			description: "Allow copying text and images",
			default: true,
		},
		{
			name: "allowEditing",
			type: "boolean",
			description: "Allow editing the document",
			default: true,
		},
	],
	execute: async (input, options, context) => {
		const { PDFDocument } = await import("pdf-lib");

		const userPassword = (options.userPassword as string) || "";
		const ownerPassword = (options.ownerPassword as string) || userPassword;
		const allowPrinting = (options.allowPrinting as boolean) ?? true;
		const allowCopying = (options.allowCopying as boolean) ?? true;
		const allowEditing = (options.allowEditing as boolean) ?? true;

		if (!userPassword && !ownerPassword) {
			throw new Error("At least one password (user or owner) is required");
		}

		let doc: import("pdf-lib").PDFDocument;
		try {
			doc = await PDFDocument.load(input, {
				ignoreEncryption: true,
			});
		} catch (err) {
			throw new Error(
				`Failed to load PDF: ${err instanceof Error ? err.message : "Invalid PDF"}`,
			);
		}

		const pages = doc.getPages();

		context.onProgress?.(20);

		// Generate file ID for encryption
		const fileId = generateFileId();
		const keyLength = 16; // 128-bit

		// Compute permission flags
		const permissions = buildPermissions({
			allowPrinting,
			allowCopying,
			allowEditing,
		});

		// Compute O (owner hash) per Algorithm 3
		const ownerHash = computeOwnerHash(ownerPassword, userPassword, keyLength);

		context.onProgress?.(40);

		// Compute encryption key per Algorithm 2
		const encryptionKey = computeEncryptionKey(
			userPassword,
			ownerHash,
			permissions,
			fileId,
			keyLength,
		);

		// Compute U (user hash) per Algorithm 5
		const userHash = computeUserHash(encryptionKey, fileId);

		context.onProgress?.(60);

		// Access pdf-lib's low-level context to inject encryption dict
		const ctx = doc.context;

		// Build /Encrypt dictionary
		const encryptDict = ctx.obj({
			Filter: "Standard",
			V: 2, // RC4-based, key length > 40
			R: 3, // Revision 3
			Length: 128,
			P: permissions,
		});

		// Set O and U values as hex strings
		const { PDFHexString, PDFName } = await import("pdf-lib");
		encryptDict.set(PDFName.of("O"), PDFHexString.of(toHex(ownerHash)));
		encryptDict.set(PDFName.of("U"), PDFHexString.of(toHex(userHash)));

		// Register the encrypt dict and set it on the trailer
		const encryptRef = ctx.register(encryptDict);
		ctx.trailerInfo.Encrypt = encryptRef;

		// Set the file ID in the trailer (required for encryption)
		const { PDFArray } = await import("pdf-lib");
		const idHex = toHex(fileId);
		const idArray = PDFArray.withContext(ctx);
		idArray.push(PDFHexString.of(idHex));
		idArray.push(PDFHexString.of(idHex));
		ctx.trailerInfo.ID = idArray;

		context.onProgress?.(80);

		const pdfBytes = await doc.save();

		context.onProgress?.(100);

		return {
			output: new Uint8Array(pdfBytes),
			extension: ".pdf",
			mimeType: "application/pdf",
			metadata: {
				pageCount: pages.length,
				hasUserPassword: !!userPassword,
				hasOwnerPassword: !!ownerPassword,
				allowPrinting,
				allowCopying,
				allowEditing,
			},
		};
	},
};

registerTool(tool);
export default tool;
