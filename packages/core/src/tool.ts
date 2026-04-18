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
	/**
	 * Cooperative cancellation. Tools should poll `signal?.aborted` at coarse
	 * checkpoints (between iterations, before heavy ops) and throw when
	 * aborted. Long-running async work should pass the signal to inner
	 * primitives where supported. The CLI propagates SIGINT to abort; the
	 * web app uses it to terminate workers when a new operation supersedes
	 * an in-flight one.
	 */
	signal?: AbortSignal;
}

export type ToolExecuteFn = (
	input: Uint8Array,
	options: Record<string, unknown>,
	context: ToolContext,
) => Promise<ToolResult | ToolResultMulti>;

export type ToolExecuteMultiFn = (
	inputs: Uint8Array[],
	options: Record<string, unknown>,
	context: ToolContext,
) => Promise<ToolResult | ToolResultMulti>;

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

/**
 * Per-file payload inside a ToolResultMulti.
 */
export interface ToolResultOutput {
	/** Output file bytes */
	bytes: Uint8Array;
	/** Suggested filename including extension (e.g. "page-1.pdf", "frame-0.png") */
	filename: string;
	/** Suggested MIME type */
	mimeType: string;
}

/**
 * Result for tools that produce N output files from one input (e.g.
 * split-pdf produces one PDF per page; parse-gif-frames produces one
 * image per frame). The CLI writes each output to disk; the web app
 * surfaces them as a list of downloadable blobs.
 */
export interface ToolResultMulti {
	/** Multiple output files */
	outputs: ToolResultOutput[];
	/** Optional metadata about the conversion */
	metadata?: Record<string, unknown>;
}

/**
 * Type guard: narrow a tool result to ToolResultMulti when present.
 */
export function isToolResultMulti(
	result: ToolResult | ToolResultMulti,
): result is ToolResultMulti {
	return "outputs" in result;
}
