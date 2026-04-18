/**
 * JWT Decoder. Single source of truth for web and CLI. Decodes a JWT
 * token string into its header, payload, signature (hex), raw parts, and
 * expiration status. Uses only built-in base64 decoding — no libraries.
 * Sync.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

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

function base64UrlDecodeToString(str: string): string {
	const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
	if (typeof Buffer !== "undefined") {
		return Buffer.from(padded, "base64").toString("binary");
	}
	return atob(padded);
}

function base64UrlDecodeToUtf8(str: string): string {
	const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
	if (typeof Buffer !== "undefined") {
		return Buffer.from(padded, "base64").toString("utf-8");
	}
	return atob(padded);
}

export function decodeJwt(token: string): DecodedJwt {
	const trimmed = token.trim();
	if (!trimmed) throw new Error("Empty input: please paste a JWT token");

	const parts = trimmed.split(".");
	if (parts.length !== 3) {
		throw new Error("Invalid JWT: expected 3 parts separated by dots");
	}

	const [headerB64, payloadB64, signatureB64] = parts;

	let headerJson: string;
	try {
		headerJson = base64UrlDecodeToUtf8(headerB64);
	} catch {
		throw new Error("Invalid JWT: header is not valid base64url");
	}

	let payloadJson: string;
	try {
		payloadJson = base64UrlDecodeToUtf8(payloadB64);
	} catch {
		throw new Error("Invalid JWT: payload is not valid base64url");
	}

	let header: Record<string, unknown>;
	try {
		header = JSON.parse(headerJson);
	} catch {
		throw new Error("Invalid JWT: header is not valid JSON");
	}

	let payload: Record<string, unknown>;
	try {
		payload = JSON.parse(payloadJson);
	} catch {
		throw new Error("Invalid JWT: payload is not valid JSON");
	}

	let sigBytes: string;
	try {
		sigBytes = base64UrlDecodeToString(signatureB64);
	} catch {
		throw new Error("Invalid JWT: signature is not valid base64url");
	}
	const signature = Array.from(sigBytes, (c) =>
		c.charCodeAt(0).toString(16).padStart(2, "0"),
	).join("");

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

const tool: ToolDefinition = {
	id: "jwt-decoder",
	name: "JWT Decoder",
	category: "developer",
	description:
		"Decode and inspect JWT tokens. View header, payload, and expiration status.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [],
	execute: async (input, _options, context) => {
		const token = new TextDecoder().decode(input).trim();
		context.onProgress?.(10);
		const decoded = decodeJwt(token);
		context.onProgress?.(100);
		return {
			output: new TextEncoder().encode(
				JSON.stringify(
					{
						header: decoded.header,
						payload: decoded.payload,
						signature: decoded.signature,
						isExpired: decoded.isExpired,
						expiresAt: decoded.expiresAt,
					},
					null,
					2,
				),
			),
			extension: ".json",
			mimeType: "application/json",
			metadata: {
				isExpired: decoded.isExpired,
				expiresAt: decoded.expiresAt?.toISOString() ?? null,
			},
		};
	},
};

registerTool(tool);
export default tool;
