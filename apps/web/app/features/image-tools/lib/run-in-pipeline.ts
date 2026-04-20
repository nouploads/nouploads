/**
 * Helper that spawns the image-pipeline worker for a single tool
 * invocation, handles AbortSignal (terminates the worker), and cleans
 * up after the response.
 */
import type {
	PipelineError,
	PipelineMultiSuccess,
	PipelineRequest,
	PipelineSuccess,
} from "../workers/image-pipeline.worker";

export interface PipelineOptions {
	toolId: string;
	/** Single-input tools pass `input`; multi-input tools pass `inputs`. */
	input?: Uint8Array;
	inputs?: Uint8Array[];
	options: Record<string, unknown>;
	signal?: AbortSignal;
}

export function runInPipeline(args: PipelineOptions): Promise<PipelineSuccess> {
	return runPipeline<PipelineSuccess>(args, "single");
}

export function runInPipelineMulti(
	args: PipelineOptions,
): Promise<PipelineMultiSuccess> {
	return runPipeline<PipelineMultiSuccess>(args, "multi");
}

function runPipeline<T extends PipelineSuccess | PipelineMultiSuccess>(
	args: PipelineOptions,
	expect: "single" | "multi",
): Promise<T> {
	return new Promise((resolve, reject) => {
		const { toolId, input, inputs, options, signal } = args;
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const worker = new Worker(
			new URL("../workers/image-pipeline.worker.ts", import.meta.url),
			{ type: "module" },
		);

		const onAbort = () => {
			worker.terminate();
			reject(new DOMException("Aborted", "AbortError"));
		};
		signal?.addEventListener("abort", onAbort, { once: true });

		worker.onmessage = (
			e: MessageEvent<PipelineSuccess | PipelineMultiSuccess | PipelineError>,
		) => {
			signal?.removeEventListener("abort", onAbort);
			worker.terminate();
			if ("error" in e.data) {
				reject(new Error(e.data.error));
				return;
			}
			if (expect === "single" && "outputs" in e.data) {
				reject(
					new Error(
						`Pipeline expected single output for ${toolId} but got multi`,
					),
				);
				return;
			}
			if (expect === "multi" && !("outputs" in e.data)) {
				reject(
					new Error(
						`Pipeline expected multi output for ${toolId} but got single`,
					),
				);
				return;
			}
			resolve(e.data as T);
		};

		worker.onerror = (e) => {
			signal?.removeEventListener("abort", onAbort);
			worker.terminate();
			reject(new Error(e.message || `Pipeline worker failed for ${toolId}`));
		};

		const request: PipelineRequest = { toolId, input, inputs, options };
		worker.postMessage(request);
	});
}
