export interface GifFrame {
	index: number;
	delay: number;
	thumbnailUrl: string;
	previewUrl: string;
	blob: Blob;
}

export interface GifFrameData {
	frames: GifFrame[];
	width: number;
	height: number;
}

/**
 * Parse an animated GIF into individual composited frames.
 *
 * Heavy work runs in a Web Worker using gifuct-js. Returns frame blobs
 * (full-resolution PNG) and thumbnail object URLs for filmstrip display.
 */
export function parseGifFrames(
	blob: Blob,
	signal?: AbortSignal,
): Promise<GifFrameData> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const worker = new Worker(
			new URL("./parse-gif-frames.worker.ts", import.meta.url),
			{ type: "module" },
		);

		const onAbort = () => {
			worker.terminate();
			reject(new DOMException("Aborted", "AbortError"));
		};
		signal?.addEventListener("abort", onAbort, { once: true });

		worker.onmessage = (e) => {
			signal?.removeEventListener("abort", onAbort);
			worker.terminate();

			if (e.data.error) {
				reject(new Error(e.data.error));
				return;
			}

			const frames: GifFrame[] = e.data.frames.map(
				(f: {
					index: number;
					delay: number;
					thumbnailBlob: Blob;
					fullBlob: Blob;
				}) => ({
					index: f.index,
					delay: f.delay,
					thumbnailUrl: URL.createObjectURL(f.thumbnailBlob),
					previewUrl: URL.createObjectURL(f.fullBlob),
					blob: f.fullBlob,
				}),
			);

			resolve({
				frames,
				width: e.data.width,
				height: e.data.height,
			});
		};

		worker.onerror = (e) => {
			signal?.removeEventListener("abort", onAbort);
			worker.terminate();
			reject(new Error(e.message || "GIF frame parsing failed"));
		};

		blob.arrayBuffer().then(
			(buffer) => {
				if (signal?.aborted) {
					worker.terminate();
					signal.removeEventListener("abort", onAbort);
					reject(new DOMException("Aborted", "AbortError"));
					return;
				}
				worker.postMessage({ buffer }, [buffer]);
			},
			(err) => {
				signal?.removeEventListener("abort", onAbort);
				worker.terminate();
				reject(err);
			},
		);
	});
}

/**
 * Revoke all thumbnail object URLs created by parseGifFrames.
 */
export function revokeGifFrameUrls(frames: GifFrame[]): void {
	for (const frame of frames) {
		URL.revokeObjectURL(frame.thumbnailUrl);
		URL.revokeObjectURL(frame.previewUrl);
	}
}
