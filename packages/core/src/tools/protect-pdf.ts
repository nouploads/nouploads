import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

/**
 * PDF Standard Security Handler (V=2, R=3, RC4-128) per PDF spec §7.6.3.
 *
 * Implements password-based encryption from scratch using only Web Crypto +
 * pure JS (MD5 + RC4). pdf-lib doesn't ship encryption, so we inject the
 * /Encrypt dictionary via pdf-lib's low-level context API and encrypt every
 * string and stream object with per-object RC4 keys.
 */

/**
 * PDF permission flags per PDF spec Table 22 (§7.6.3.2).
 * Bits are numbered from 1 (LSB). Bits 1-2 must be 0, bits 7-8 must be 1.
 */
const PERM_PRINT = 1 << 2; // bit 3
const PERM_MODIFY = 1 << 3; // bit 4
const PERM_COPY = 1 << 4; // bit 5
const PERM_ANNOT = 1 << 5; // bit 6
const PERM_REQUIRED = (1 << 6) | (1 << 7);
const PERM_HIGH_BITS = 0xfffff000;

/**
 * Padding string defined in PDF spec §7.6.3.3 (Algorithm 2). Exactly 32 bytes.
 */
const PASSWORD_PADDING = new Uint8Array([
	0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41, 0x64, 0x00, 0x4e, 0x56, 0xff,
	0xfa, 0x01, 0x08, 0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80, 0x2f, 0x0c,
	0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

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

/** MD5 (RFC 1321). PDF encryption uses MD5 for key derivation. */
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

	const bitLen = data.length * 8;
	const padLen =
		data.length % 64 < 56 ? 56 - (data.length % 64) : 120 - (data.length % 64);
	const padded = new Uint8Array(data.length + padLen + 8);
	padded.set(data);
	padded[data.length] = 0x80;
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

/** RC4 cipher (symmetric). */
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

/** Compute encryption key per PDF spec Algorithm 2. */
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
	for (let i = 0; i < 50; i++) {
		hash = md5(hash.subarray(0, keyLength));
	}
	return hash.subarray(0, keyLength);
}

/** Compute O value per PDF spec Algorithm 3. */
function computeOwnerHash(
	ownerPassword: string,
	userPassword: string,
	keyLength: number,
): Uint8Array {
	const ownerPadded = padPassword(ownerPassword);
	let hash = md5(ownerPadded);
	for (let i = 0; i < 50; i++) {
		hash = md5(hash.subarray(0, keyLength));
	}
	const ownerKey = hash.subarray(0, keyLength);
	const userPadded = padPassword(userPassword);
	let encrypted = rc4(ownerKey, userPadded);
	for (let i = 1; i <= 19; i++) {
		const tmpKey = new Uint8Array(ownerKey.length);
		for (let j = 0; j < ownerKey.length; j++) {
			tmpKey[j] = ownerKey[j] ^ i;
		}
		encrypted = rc4(tmpKey, encrypted);
	}
	return encrypted;
}

/** Compute U value per PDF spec Algorithm 5. */
function computeUserHash(
	encryptionKey: Uint8Array,
	fileId: Uint8Array,
): Uint8Array {
	const hash = md5(concat(PASSWORD_PADDING, fileId));
	let encrypted = rc4(encryptionKey, hash);
	for (let i = 1; i <= 19; i++) {
		const tmpKey = new Uint8Array(encryptionKey.length);
		for (let j = 0; j < encryptionKey.length; j++) {
			tmpKey[j] = encryptionKey[j] ^ i;
		}
		encrypted = rc4(tmpKey, encrypted);
	}
	const result = new Uint8Array(32);
	result.set(encrypted);
	return result;
}

function buildPermissions(opts: {
	allowPrinting: boolean;
	allowCopying: boolean;
	allowEditing: boolean;
}): number {
	let p = PERM_REQUIRED | PERM_HIGH_BITS;
	if (opts.allowPrinting) p |= PERM_PRINT;
	if (opts.allowEditing) p |= PERM_MODIFY;
	if (opts.allowCopying) p |= PERM_COPY;
	p |= PERM_ANNOT;
	return p | 0;
}

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

function toHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/** Compute per-object encryption key per PDF spec §7.6.2. */
function computeObjectKey(
	encryptionKey: Uint8Array,
	objectNumber: number,
	generationNumber: number,
): Uint8Array {
	const input = new Uint8Array(encryptionKey.length + 5);
	input.set(encryptionKey);
	const n = encryptionKey.length;
	input[n] = objectNumber & 0xff;
	input[n + 1] = (objectNumber >> 8) & 0xff;
	input[n + 2] = (objectNumber >> 16) & 0xff;
	input[n + 3] = generationNumber & 0xff;
	input[n + 4] = (generationNumber >> 8) & 0xff;
	const hash = md5(input);
	return hash.subarray(0, Math.min(encryptionKey.length + 5, 16));
}

type PdfLib = typeof import("pdf-lib");

/** Recursively encrypt PDFString/PDFHexString values inside a PDFDict. */
function encryptDictStrings(
	dict: import("pdf-lib").PDFDict,
	objKey: Uint8Array,
	lib: PdfLib,
): void {
	for (const [key, value] of dict.entries()) {
		if (value instanceof lib.PDFString || value instanceof lib.PDFHexString) {
			const encrypted = rc4(objKey, value.asBytes());
			dict.set(key, lib.PDFHexString.of(toHex(encrypted)));
		} else if (value instanceof lib.PDFDict) {
			encryptDictStrings(value, objKey, lib);
		} else if (value instanceof lib.PDFArray) {
			encryptArrayStrings(value, objKey, lib);
		}
	}
}

/** Recursively encrypt PDFString/PDFHexString values inside a PDFArray. */
function encryptArrayStrings(
	arr: import("pdf-lib").PDFArray,
	objKey: Uint8Array,
	lib: PdfLib,
): void {
	for (let i = 0; i < arr.size(); i++) {
		const value = arr.get(i);
		if (value instanceof lib.PDFString || value instanceof lib.PDFHexString) {
			const encrypted = rc4(objKey, value.asBytes());
			arr.set(i, lib.PDFHexString.of(toHex(encrypted)));
		} else if (value instanceof lib.PDFDict) {
			encryptDictStrings(value, objKey, lib);
		} else if (value instanceof lib.PDFArray) {
			encryptArrayStrings(value, objKey, lib);
		}
	}
}

/**
 * Encrypt all string and stream objects in the PDF per the Standard
 * encryption handler (V=2, R=3, RC4-128).
 */
function encryptObjects(
	ctx: import("pdf-lib").PDFContext,
	encryptionKey: Uint8Array,
	encryptRef: import("pdf-lib").PDFRef,
	lib: PdfLib,
): void {
	for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
		if (
			ref.objectNumber === encryptRef.objectNumber &&
			ref.generationNumber === encryptRef.generationNumber
		) {
			continue;
		}

		const objKey = computeObjectKey(
			encryptionKey,
			ref.objectNumber,
			ref.generationNumber,
		);

		if (obj instanceof lib.PDFRawStream) {
			(obj as unknown as { contents: Uint8Array }).contents = rc4(
				objKey,
				obj.contents,
			);
			encryptDictStrings(obj.dict, objKey, lib);
		} else if (obj instanceof lib.PDFDict) {
			encryptDictStrings(obj, objKey, lib);
		} else if (obj instanceof lib.PDFArray) {
			encryptArrayStrings(obj, objKey, lib);
		}
	}
}

const tool: ToolDefinition = {
	id: "protect-pdf",
	name: "Protect PDF",
	category: "pdf",
	description:
		"Add password protection (RC4-128) and permission restrictions to a PDF.",
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
				"Owner password (defaults to userPassword if empty). Owner can change permissions.",
			default: "",
		},
		{
			name: "allowPrinting",
			type: "boolean",
			description: "Allow printing",
			default: true,
		},
		{
			name: "allowCopying",
			type: "boolean",
			description: "Allow copying text and graphics",
			default: true,
		},
		{
			name: "allowEditing",
			type: "boolean",
			description: "Allow modifying the document",
			default: true,
		},
	],
	execute: async (input, options, context) => {
		const pdfLib = await import("pdf-lib");
		const { PDFDocument, PDFHexString, PDFName, PDFArray } = pdfLib;

		const userPassword = (options.userPassword as string) ?? "";
		const ownerPassword = (options.ownerPassword as string) || userPassword;
		const allowPrinting = (options.allowPrinting as boolean) ?? true;
		const allowCopying = (options.allowCopying as boolean) ?? true;
		const allowEditing = (options.allowEditing as boolean) ?? true;

		if (!userPassword && !ownerPassword) {
			throw new Error("At least one password (user or owner) is required");
		}

		if (context.signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}

		let doc: import("pdf-lib").PDFDocument;
		try {
			doc = await PDFDocument.load(input, { ignoreEncryption: true });
		} catch (err) {
			throw new Error(
				`Failed to load PDF: ${err instanceof Error ? err.message : "Invalid PDF"}`,
			);
		}

		const pages = doc.getPages();
		context.onProgress?.(20);

		if (context.signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}

		const fileId = generateFileId();
		const keyLength = 16;

		const permissions = buildPermissions({
			allowPrinting,
			allowCopying,
			allowEditing,
		});

		const ownerHash = computeOwnerHash(ownerPassword, userPassword, keyLength);
		context.onProgress?.(40);

		const encryptionKey = computeEncryptionKey(
			userPassword,
			ownerHash,
			permissions,
			fileId,
			keyLength,
		);
		const userHash = computeUserHash(encryptionKey, fileId);
		context.onProgress?.(60);

		if (context.signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}

		const ctx = doc.context;
		const encryptDict = ctx.obj({
			Filter: "Standard",
			V: 2,
			R: 3,
			Length: 128,
			P: permissions,
		});

		encryptDict.set(PDFName.of("O"), PDFHexString.of(toHex(ownerHash)));
		encryptDict.set(PDFName.of("U"), PDFHexString.of(toHex(userHash)));

		const encryptRef = ctx.register(encryptDict);
		ctx.trailerInfo.Encrypt = encryptRef;

		const idHex = toHex(fileId);
		const idArray = PDFArray.withContext(ctx);
		idArray.push(PDFHexString.of(idHex));
		idArray.push(PDFHexString.of(idHex));
		ctx.trailerInfo.ID = idArray;

		// Encrypt all string and stream objects with per-object RC4 keys.
		// pdf-lib doesn't ship encryption support, so we walk every indirect
		// object and apply RC4 manually per the PDF spec.
		encryptObjects(ctx, encryptionKey, encryptRef, pdfLib);

		context.onProgress?.(80);

		if (context.signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}

		// useObjectStreams: false avoids the complication of encrypting
		// nested objects inside a compressed object stream.
		const pdfBytes = await doc.save({ useObjectStreams: false });

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
