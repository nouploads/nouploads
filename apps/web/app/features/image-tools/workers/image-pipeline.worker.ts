/**
 * Generic image-tool pipeline worker. Loads a core image tool by ID,
 * creates a canvas-backed ImageBackend, and runs the tool's execute()
 * on the given input.
 *
 * One worker per request; terminated after a single response.
 *
 * The tool-id → loader map lives in image-pipeline-tools.ts so the
 * drift test can inspect it without pulling in OffscreenCanvas.
 */

import { createCanvasBackend } from "@nouploads/backend-canvas";
import type { ToolResultOutput } from "@nouploads/core";
import { isToolResultMulti } from "@nouploads/core";
import { loadPipelineTool } from "./image-pipeline-tools";

export interface PipelineRequest {
	toolId: string;
	/** Single-input tools pass `input`; multi-input tools pass `inputs`. */
	input?: Uint8Array;
	inputs?: Uint8Array[];
	options: Record<string, unknown>;
}

export interface PipelineSuccess {
	output: Uint8Array;
	extension: string;
	mimeType: string;
	metadata?: Record<string, unknown>;
}

export interface PipelineMultiSuccess {
	outputs: ToolResultOutput[];
	metadata?: Record<string, unknown>;
}

export interface PipelineError {
	error: string;
}

self.onmessage = async (e: MessageEvent<PipelineRequest>) => {
	try {
		const { toolId, input, inputs, options } = e.data;
		const tool = await loadPipelineTool(toolId);
		const backend = createCanvasBackend();
		const ctx = { imageBackend: backend };
		let result: Awaited<ReturnType<typeof tool.execute>>;
		if (inputs) {
			if (!tool.executeMulti) {
				throw new Error(`Tool ${toolId} does not support multi-input`);
			}
			result = await tool.executeMulti(inputs, options, ctx);
		} else if (input) {
			result = await tool.execute(input, options, ctx);
		} else {
			throw new Error("Pipeline request missing both input and inputs");
		}
		if (isToolResultMulti(result)) {
			const response: PipelineMultiSuccess = {
				outputs: result.outputs,
				metadata: result.metadata,
			};
			self.postMessage(response);
			return;
		}
		const response: PipelineSuccess = {
			output: result.output,
			extension: result.extension,
			mimeType: result.mimeType,
			metadata: result.metadata,
		};
		self.postMessage(response);
	} catch (err) {
		const response: PipelineError = {
			error: err instanceof Error ? err.message : String(err),
		};
		self.postMessage(response);
	}
};
