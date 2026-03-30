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
import type { Route } from "./+types/pdf-to-jpg";

const PdfToImageTool = lazy(
	() => import("~/features/pdf-tools/components/pdf-to-image-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert PDF to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert PDF pages to JPG images in your browser. Choose DPI, adjust quality. No upload required.",
		path: "/pdf/pdf-to-jpg",
		keywords:
			"pdf to jpg, convert pdf to jpg, pdf to image, pdf to jpeg online, free pdf converter, private pdf to jpg, pdf page to image",
		jsonLdName: "PDF to JPG Converter",
	});
}

const faqItems = [
	{
		question: "How does PDF to JPG conversion work?",
		answer:
			"Your PDF is loaded into the browser using PDF.js (the same engine Firefox uses to display PDFs). Each page is rendered onto a canvas at your chosen resolution, then exported as a JPG image. The entire process happens locally — the PDF never leaves your device.",
	},
	{
		question: "What DPI setting should I choose?",
		answer:
			"72 DPI is fine for quick screen previews. 150 DPI (the default) works well for most uses including emails and presentations. Choose 300 DPI when you need print-quality images or need to zoom into fine details.",
	},
	{
		question: "What about multi-page PDFs?",
		answer:
			"Each page of your PDF becomes a separate JPG image. You can download them individually or grab all pages at once in a single ZIP file. Progress is shown as each page is converted.",
	},
	{
		question: "Can I adjust the JPG quality?",
		answer:
			"Yes. A quality slider lets you choose between smaller file sizes and sharper images. The default of 92% offers a good balance. Lower values shrink files significantly with minimal visible difference for most documents.",
	},
	{
		question: "Why use NoUploads instead of other PDF to JPG tools?",
		answer:
			"Typical PDF converters require you to upload your document to a remote server, which is a problem for confidential or sensitive files. NoUploads converts PDF pages to JPG entirely inside your browser — no upload, no server processing, no data collection. It's free, has no page limits, no watermarks, works offline after the first load, and is fully open source.",
	},
];

export default function PdfToJpgPage() {
	return (
		<ToolPageLayout
			title="PDF to JPG"
			description="Convert PDF pages to high-quality JPG images — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<PdfToImageTool defaultOutputFormat="image/jpeg" />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					This tool renders each page of your PDF as a JPG image directly in
					your browser. It supports adjustable resolution (72, 150, or 300 DPI)
					and JPEG quality settings so you can balance sharpness against file
					size. Multi-page PDFs are handled automatically — every page becomes
					its own image, with a one-click ZIP download for the full set. Because
					all processing happens client-side using PDF.js, your documents stay
					completely private.
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
					href="https://github.com/mozilla/pdf.js"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					PDF.js
				</a>{" "}
				&middot; Apache-2.0 License
			</p>
		</ToolPageLayout>
	);
}
