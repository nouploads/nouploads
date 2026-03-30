/**
 * Every tool in nouploads implements this interface.
 * The registry auto-generates CLI subcommands, site pages, and help text from this metadata.
 */

import type { ImageBackend } from "./backend.js";

export interface ToolOption {
	name: string;
	type: "number" | "string" | "boolean";
	description: string;
	default?: number | string | boolean;
	min?: number;
	max?: number;
	choices?: string[];
	required?: boolean;
}

export interface ToolDefinition {
	/** Unique slug: 'heic-to-jpg', 'compress-jpg', 'pdf-to-png', etc. */
	id: string;
	/** Human-readable: 'HEIC to JPG Converter' */
	name: string;
	/** Tool category for grouping */
	category: "image" | "pdf" | "developer" | "document";
	/** Short description for CLI --help and site meta tags */
	description: string;
	/** Source format (null for tools like 'compress' that don't convert) */
	from?: string;
	/** Target format (null for tools like 'exif-viewer') */
	to?: string;
	/** MIME types accepted as input */
	inputMimeTypes: string[];
	/** File extensions accepted (with dots: '.heic', '.pdf') */
	inputExtensions: string[];
	/** Options exposed to both site UI and CLI flags */
	options: ToolOption[];
	/** Required platform capabilities (e.g. ["browser"], ["wasm"]). Empty = runs anywhere. */
	capabilities?: string[];
	/** The actual conversion function (single input) */
	execute: ToolExecuteFn;
	/** Optional multi-input function for tools like merge-pdf that combine multiple files */
	executeMulti?: ToolExecuteMultiFn;
}

export interface ToolContext {
	/** Platform-specific image processing backend */
	imageBackend?: ImageBackend;
	/** Report progress 0-100 */
	onProgress?: (percent: number) => void;
}

export type ToolExecuteFn = (
	input: Uint8Array,
	options: Record<string, unknown>,
	context: ToolContext,
) => Promise<ToolResult>;

export type ToolExecuteMultiFn = (
	inputs: Uint8Array[],
	options: Record<string, unknown>,
	context: ToolContext,
) => Promise<ToolResult>;

export interface ToolResult {
	/** Output file bytes */
	output: Uint8Array;
	/** Suggested output filename extension (with dot) */
	extension: string;
	/** Suggested output MIME type */
	mimeType: string;
	/** Optional metadata about the conversion */
	metadata?: Record<string, unknown>;
}
