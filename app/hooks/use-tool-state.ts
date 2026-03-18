import { useCallback, useState } from "react";

export type ToolPhase = "idle" | "ready" | "processing" | "done" | "error";

export interface ToolState<TResult = unknown> {
	/** Currently selected files */
	files: File[];
	/** Current phase of the tool lifecycle */
	phase: ToolPhase;
	/** Result data (tool-specific shape) */
	result: TResult | null;
	/** Error message if phase is "error" */
	error: string | null;
	/** Whether a single file is selected */
	isSingleFile: boolean;
	/** Whether multiple files are selected (batch mode) */
	isBatch: boolean;
	/** Accept files from dropzone */
	handleFiles: (incoming: File[]) => void;
	/** Move to processing phase */
	startProcessing: () => void;
	/** Move to done phase with result */
	finish: (result: TResult) => void;
	/** Move to error phase with message */
	fail: (message: string) => void;
	/** Reset to idle (clear files, result, error) */
	reset: () => void;
}

/**
 * Shared state hook for all tool components.
 *
 * Manages the common file-selection → processing → result lifecycle.
 * Tool-specific options (quality, format, etc.) are managed separately
 * by the tool component itself.
 */
export function useToolState<TResult = unknown>(): ToolState<TResult> {
	const [files, setFiles] = useState<File[]>([]);
	const [phase, setPhase] = useState<ToolPhase>("idle");
	const [result, setResult] = useState<TResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length > 0) {
			setFiles(incoming);
			setPhase("ready");
			setResult(null);
			setError(null);
		}
	}, []);

	const startProcessing = useCallback(() => {
		setPhase("processing");
		setError(null);
	}, []);

	const finish = useCallback((r: TResult) => {
		setResult(r);
		setPhase("done");
	}, []);

	const fail = useCallback((message: string) => {
		setError(message);
		setPhase("error");
	}, []);

	const reset = useCallback(() => {
		setFiles([]);
		setPhase("idle");
		setResult(null);
		setError(null);
	}, []);

	return {
		files,
		phase,
		result,
		error,
		isSingleFile: files.length === 1,
		isBatch: files.length > 1,
		handleFiles,
		startProcessing,
		finish,
		fail,
		reset,
	};
}
