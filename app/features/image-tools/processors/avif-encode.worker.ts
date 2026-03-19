import encodeAvif from "@jsquash/avif/encode";

export interface AvifEncodeMessage {
	imageData: ImageData;
	quality: number;
}

self.onmessage = async (e: MessageEvent<AvifEncodeMessage>) => {
	try {
		const { imageData, quality } = e.data;
		const buffer = await encodeAvif(imageData, {
			quality,
			speed: 6,
		});
		self.postMessage({ buffer }, [buffer]);
	} catch (err) {
		self.postMessage({
			error: err instanceof Error ? err.message : String(err),
		});
	}
};
