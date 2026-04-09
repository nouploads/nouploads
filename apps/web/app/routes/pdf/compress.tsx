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
		title: "Compress PDF Online — Free, No Limits | NoUploads",
		description:
			"Reduce PDF file size by re-rendering pages at adjustable quality in your browser — free, no upload, no file size cap. Pick from three compression levels.",
		path: "/pdf/compress",
		keywords:
			"compress pdf, reduce pdf size, pdf compressor online, shrink pdf, free pdf compressor, private pdf compression",
		jsonLdName: "PDF Compressor",
		faq: [
			{
				question: "What's actually inside a PDF file?",
				answer:
					"A PDF file is not a simple document — internally it is a collection of numbered objects (text streams, fonts, images, metadata) connected by a cross-reference table that maps each object's byte offset. Compressing a PDF typically means recompressing embedded images at lower quality and stripping unused objects, since embedded images are almost always the largest contributors to overall file size.",
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
		],
	});
}

const faqItems = [
	{
		question: "What's actually inside a PDF file?",
		answer: (
			<>
				A PDF file is not a simple document — internally it is a collection of
				numbered objects (text streams, fonts, images, metadata) connected by a
				cross-reference table that maps each object's byte offset. Compressing a
				PDF typically means recompressing embedded images at lower quality and
				stripping unused objects, since embedded images are almost always the
				largest contributors to overall file size. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/PDF#File_structure"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Wikipedia
				</a>
			</>
		),
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
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					pdf.js
				</a>
				{" / "}
				<a
					href="https://github.com/Hopding/pdf-lib"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					pdf-lib
				</a>{" "}
				· Apache-2.0 / MIT License
			</p>
		</ToolPageLayout>
	);
}
