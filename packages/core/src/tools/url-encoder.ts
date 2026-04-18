/**
 * URL encoding, decoding, and parsing utilities — the single source of
 * truth for URL manipulation used by both the web app and the CLI.
 *
 * Uses only built-in APIs (encodeURIComponent, URL). Zero dependencies.
 * Sync.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

export interface UrlParseResult {
	protocol: string;
	host: string;
	pathname: string;
	search: string;
	hash: string;
	params: {
		key: string;
		value: string;
		rawKey: string;
		rawValue: string;
	}[];
}

export function encodeUrl(input: string, scope: "component" | "full"): string {
	return scope === "component" ? encodeURIComponent(input) : encodeURI(input);
}

export function decodeUrl(input: string, scope: "component" | "full"): string {
	return scope === "component" ? decodeURIComponent(input) : decodeURI(input);
}

export function parseUrl(input: string): UrlParseResult | null {
	try {
		const url = new URL(input);
		const params: UrlParseResult["params"] = [];
		for (const [rawKey, rawValue] of url.searchParams) {
			params.push({
				key: decodeURIComponent(rawKey),
				value: decodeURIComponent(rawValue),
				rawKey,
				rawValue,
			});
		}
		return {
			protocol: url.protocol,
			host: url.host,
			pathname: url.pathname,
			search: url.search,
			hash: url.hash,
			params,
		};
	} catch {
		return null;
	}
}

export function isValidUrl(input: string): boolean {
	try {
		new URL(input);
		return true;
	} catch {
		return false;
	}
}

const tool: ToolDefinition = {
	id: "url-encoder",
	name: "URL Encoder / Decoder",
	category: "developer",
	description: "Encode or decode URL components and full URLs.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [
		{
			name: "mode",
			type: "string",
			description: "Encode or decode",
			default: "encode",
			choices: ["encode", "decode"],
		},
		{
			name: "scope",
			type: "string",
			description: "Component encoding or full URL encoding",
			default: "component",
			choices: ["component", "full"],
		},
	],
	execute: async (input, options, context) => {
		const text = new TextDecoder().decode(input);
		const mode = (options.mode as string) || "encode";
		const scope = ((options.scope as string) || "component") as
			| "component"
			| "full";

		context.onProgress?.(10);
		const result =
			mode === "encode" ? encodeUrl(text, scope) : decodeUrl(text, scope);
		context.onProgress?.(100);

		return {
			output: new TextEncoder().encode(result),
			extension: ".txt",
			mimeType: "text/plain",
		};
	},
};

registerTool(tool);
export default tool;
