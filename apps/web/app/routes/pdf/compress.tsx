import { lazy, Suspense } from "react";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Spinner } from "~/components/ui/spinner";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/compress";

const PdfCompressTool = lazy(
	() => import("~/features/pdf-tools/components/pdf-compress-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Compress PDF Online — Free, Private, No Upload | NoUploads",
		description:
			"Reduce PDF file size by re-rendering pages at lower quality. Free, private, no upload required.",
		path: "/pdf/compress",
		keywords:
			"compress pdf, reduce pdf size, pdf compressor online, shrink pdf, free pdf compressor, private pdf compression",
		jsonLdName: "PDF Compressor",
	});
}

const faqItems = [
	{
		question: "How does PDF compression work?",
		answer:
			"This tool re-renders each page of your PDF as a compressed JPG image at a reduced resolution, then assembles those images into a new PDF. The trade-off is that text becomes rasterized — it's no longer selectable — but the file size drops significantly for PDFs that contain photos, scans, or graphics.",
	},
	{
		question: "Will the compressed PDF look different?",
		answer:
			'There may be some visible quality loss, depending on the compression level you choose. "Low" compression preserves most detail at 150 DPI with 85% JPEG quality. "High" compression is more aggressive at 72 DPI and 50% quality, producing noticeably smaller files with softer text and images. For most documents, "Medium" strikes a practical balance.',
	},
	{
		question: "Which compression level should I choose?",
		answer:
			'Use "Low" when you need the output to stay close to the original in visual fidelity — good for reports with charts or detailed diagrams. "Medium" works well for general documents, presentations, and forms you need to email. "High" is best when file size matters more than sharpness, such as archiving large batches or uploading to size-limited portals.',
	},
	{
		question: "Does this work with scanned PDFs?",
		answer:
			"Yes — scanned PDFs are essentially images already, so re-rendering them at a lower resolution and quality can reduce file size substantially. This tool handles scanned documents the same way it handles any other PDF: each page is rendered to canvas and re-exported as a compressed JPG.",
	},
	{
		question: "Why use NoUploads instead of other PDF compressors?",
		answer:
			"Most PDF compression services require you to upload your document to their servers, which raises privacy concerns for contracts, tax forms, medical records, or any sensitive material. NoUploads compresses your PDF entirely inside your browser — the file never leaves your device. There are no daily limits, no watermarks, no account required, and the tool works offline after the first page load. The code is open source so you can verify exactly what happens to your files.",
	},
];

export default function CompressPdfPage() {
	return (
		<ToolPageLayout
			title="Compress PDF"
			description="Reduce PDF file size by re-rendering pages as compressed images — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<PdfCompressTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					This tool works by re-rendering each page as a compressed JPG image,
					which reduces file size at the cost of some visual quality. It's most
					effective for PDFs containing photos and graphics. Text-heavy or
					already-optimized PDFs may see minimal size reduction. Three
					compression levels let you balance between output quality and file
					size. Everything runs client-side using PDF.js and pdf-lib — your
					documents never leave your device.
				</p>
			</section>

			<section>
				<h2 className="text-lg font-semibold mb-4">
					Frequently Asked Questions
				</h2>
				<Accordion type="multiple">
					{faqItems.map((item, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static FAQ list never changes
						<AccordionItem key={i} value={`faq-${i}`}>
							<AccordionTrigger>{item.question}</AccordionTrigger>
							<AccordionContent>
								<p className="text-muted-foreground">{item.answer}</p>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</section>

			<p className="text-xs text-muted-foreground mt-8">
				Powered by{" "}
				<a
					href="https://github.com/nicolo-ribaudo/pdfjs-dist"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					pdf.js
				</a>
				{" / "}
				<a
					href="https://github.com/Hopding/pdf-lib"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					pdf-lib
				</a>{" "}
				· Apache-2.0 / MIT License
			</p>
		</ToolPageLayout>
	);
}
