import QRCode from "qrcode";

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface QrCodeOptions {
	text: string;
	size?: number;
	errorCorrection?: ErrorCorrectionLevel;
	foreground?: string;
	background?: string;
	margin?: number;
}

export interface QrCodeResult {
	pngDataUrl: string;
	svgString: string;
	pngBlob: Blob;
	svgBlob: Blob;
}

export async function generateQrCode(
	options: QrCodeOptions,
): Promise<QrCodeResult> {
	const {
		text,
		size = 300,
		errorCorrection = "M",
		foreground = "#000000",
		background = "#ffffff",
		margin = 4,
	} = options;

	if (!text.trim()) throw new Error("Text is required");

	const pngDataUrl = await QRCode.toDataURL(text, {
		width: size,
		margin,
		errorCorrectionLevel: errorCorrection,
		color: {
			dark: foreground,
			light: background,
		},
	});

	const svgString = await QRCode.toString(text, {
		type: "svg",
		margin,
		errorCorrectionLevel: errorCorrection,
		color: {
			dark: foreground,
			light: background,
		},
	});

	const pngBase64 = pngDataUrl.split(",")[1];
	const pngBinary = atob(pngBase64);
	const pngBytes = new Uint8Array(pngBinary.length);
	for (let i = 0; i < pngBinary.length; i++) {
		pngBytes[i] = pngBinary.charCodeAt(i);
	}
	const pngBlob = new Blob([pngBytes], { type: "image/png" });

	const svgBlob = new Blob([svgString], { type: "image/svg+xml" });

	return { pngDataUrl, svgString, pngBlob, svgBlob };
}

/** Max content length for QR codes (alphanumeric mode) */
export const MAX_QR_LENGTH = 4296;
