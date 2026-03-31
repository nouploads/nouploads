import { packIco } from "./favicon-generator";

export interface FaviconWorkerMessage {
	blob: Blob;
	sizes: number[];
}

self.onmessage = async (e: MessageEvent<FaviconWorkerMessage>) => {
	try {
		const { blob, sizes } = e.data;

		const bitmap = await createImageBitmap(blob);
		const pngBuffers: Uint8Array[] = [];
		const sizeResults: Array<{ size: number; pngBlob: Blob }> = [];

		for (const size of sizes) {
			const canvas = new OffscreenCanvas(size, size);
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				bitmap.close();
				throw new Error("Could not get OffscreenCanvas 2D context");
			}

			ctx.drawImage(bitmap, 0, 0, size, size);

			const pngBlob = await canvas.convertToBlob({ type: "image/png" });
			const arrayBuf = await pngBlob.arrayBuffer();
			pngBuffers.push(new Uint8Array(arrayBuf));
			sizeResults.push({ size, pngBlob });
		}

		bitmap.close();

		const icoData = packIco(pngBuffers, sizes);
		const icoBlob = new Blob([icoData as Uint8Array<ArrayBuffer>], {
			type: "image/x-icon",
		});

		self.postMessage({ icoBlob, sizes: sizeResults });
	} catch (err) {
		self.postMessage({
			error: err instanceof Error ? err.message : String(err),
		});
	}
};
