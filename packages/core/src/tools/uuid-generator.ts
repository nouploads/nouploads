/**
 * UUID v4 (random) and UUID v7 (timestamp-ordered) generation +
 * validation. Single source of truth for web and CLI. Zero
 * dependencies. Sync.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

export interface UuidValidation {
	valid: boolean;
	version: number | null;
	variant: string | null;
	timestamp?: Date;
}

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
	bytes[0] = (now / 2 ** 40) & 0xff;
	bytes[1] = (now / 2 ** 32) & 0xff;
	bytes[2] = (now / 2 ** 24) & 0xff;
	bytes[3] = (now / 2 ** 16) & 0xff;
	bytes[4] = (now / 2 ** 8) & 0xff;
	bytes[5] = now & 0xff;
	crypto.getRandomValues(bytes.subarray(6));
	bytes[6] = (bytes[6] & 0x0f) | 0x70;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function generateBulk(version: "v4" | "v7", count: number): string[] {
	const clamped = Math.min(Math.max(1, count), 1000);
	const result: string[] = [];
	const fn = version === "v7" ? generateUuidV7 : generateUuidV4;
	for (let i = 0; i < clamped; i++) result.push(fn());
	return result;
}

export function validateUuid(input: string): UuidValidation {
	const trimmed = input.trim().toLowerCase();
	if (!UUID_REGEX.test(trimmed)) {
		return { valid: false, version: null, variant: null };
	}
	const versionChar = trimmed[14];
	const version = Number.parseInt(versionChar, 16);
	const variantNibble = Number.parseInt(trimmed[19], 16);
	let variant: string;
	if ((variantNibble & 0b1000) === 0) variant = "NCS";
	else if ((variantNibble & 0b1100) === 0b1000) variant = "RFC 4122";
	else if ((variantNibble & 0b1110) === 0b1100) variant = "Microsoft";
	else variant = "Future";
	const result: UuidValidation = { valid: true, version, variant };
	if (version === 7) {
		const hex = trimmed.replace(/-/g, "");
		const timestampHex = hex.slice(0, 12);
		const timestamp = Number.parseInt(timestampHex, 16);
		result.timestamp = new Date(timestamp);
	}
	return result;
}

const tool: ToolDefinition = {
	id: "uuid-generator",
	name: "UUID Generator",
	category: "developer",
	description:
		"Generate UUID v4 (random) and UUID v7 (timestamp-ordered) identifiers.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [
		{
			name: "version",
			type: "string",
			description: "UUID version to generate",
			default: "v4",
			choices: ["v4", "v7"],
		},
		{
			name: "count",
			type: "number",
			description: "Number of UUIDs to generate",
			default: 1,
			min: 1,
			max: 1000,
		},
	],
	execute: async (_input, options, _context) => {
		const version = ((options.version as string) || "v4") as "v4" | "v7";
		const count = (options.count as number) || 1;
		const uuids = generateBulk(version, count);
		return {
			output: new TextEncoder().encode(uuids.join("\n")),
			extension: ".txt",
			mimeType: "text/plain",
			metadata: { count: uuids.length, version },
		};
	},
};

registerTool(tool);
export default tool;
