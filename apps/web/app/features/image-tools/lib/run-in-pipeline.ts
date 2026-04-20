/**
 * Helper that spawns the image-pipeline worker for a single tool
 * invocation, handles AbortSignal (terminates the worker), and cleans
 * up after the response.
 */
import type {
	PipelineError,
	PipelineRequest,
	PipelineSuccess,
} from "../workers/image-pipeline.worker";

export interface PipelineOptions {
	toolId: string;
	input: Uint8Array;
	options: Record<string, unknown>;
	signal?: AbortSignal;
}

export function runInPipeline(
	args: PipelineOptions,
): Promise<PipelineSuccess> {
	return new Promise((resolve, reject) => {
		const { toolId, input, options, signal } = args;
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const worker = new Worker(
			new URL(
				"../workers/image-pipeline.worker.ts",
				import.meta.url,
			),
			{ type: "module" },
		);

		const onAbort = () => {
			worker.terminate();
			reject(new DOMException("Aborted", "AbortError"));
		};
		signal?.addEventListener("abort", onAbort, { once: true });

		worker.onmessage = (e: MessageEvent<PipelineSuccess | PipelineError>) => {
			signal?.removeEventListener("abort", onAbort);
			worker.terminate();
			if ("error" in e.data) {
				reject(new Error(e.data.error));
			} else {
				resolve(e.data);
			}
		};

		worker.onerror = (e) => {
			signal?.removeEventListener("abort", onAbort);
			worker.terminate();
			reject(new Error(e.message || `Pipeline worker failed for ${toolId}`));
		};

		const request: PipelineRequest = { toolId, input, options };
		worker.postMessage(request);
	});
}
