/**
 * QR code generator — web adapter. Combines @nouploads/core's
 * generateQrPng and generateQrSvg into the {pngDataUrl, svgString,
 * pngBlob, svgBlob} shape the web component consumes.
 */
import {
	MAX_QR_LENGTH as CORE_MAX_QR_LENGTH,
	generateQrPng,
	generateQrSvg,
} from "@nouploads/core/tools/qr-code";

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

export const MAX_QR_LENGTH = CORE_MAX_QR_LENGTH;

export async function generateQrCode(
	options: QrCodeOptions,
): Promise<QrCodeResult> {
	const { text, ...rest } = options;
	if (!text.trim()) throw new Error("Text is required");

	const [pngBytes, svgString] = await Promise.all([
		generateQrPng(text, rest),
		generateQrSvg(text, rest),
	]);

	const pngBlob = new Blob([pngBytes as BlobPart], { type: "image/png" });
	const svgBlob = new Blob([svgString], { type: "image/svg+xml" });

	// Build data URL without FileReader (works in both browser + Node)
	const b64 =
		typeof Buffer !== "undefined"
			? Buffer.from(pngBytes).toString("base64")
			: btoa(Array.from(pngBytes, (b) => String.fromCharCode(b)).join(""));
	const pngDataUrl = `data:image/png;base64,${b64}`;

	return { pngDataUrl, svgString, pngBlob, svgBlob };
}
