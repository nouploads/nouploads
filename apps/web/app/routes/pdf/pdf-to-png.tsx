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
import type { Route } from "./+types/pdf-to-png";

const PdfToImageTool = lazy(
	() => import("~/features/pdf-tools/components/pdf-to-image-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "PDF to PNG Converter — Free, No Limits | NoUploads",
		description:
			"Convert PDF pages to lossless PNG images in your browser — free, no upload, no page limit. Pick 72, 150, or 300 DPI for pixel-perfect text and graphics.",
		path: "/pdf/pdf-to-png",
		keywords:
			"pdf to png, convert pdf to png, pdf to image, pdf page to png online, free pdf to png, private pdf converter, lossless pdf export",
		jsonLdName: "PDF to PNG Converter",
		faq: [
			{
				question: "What makes PDF so complex to rasterize?",
				answer:
					"A single PDF page can contain a rich mix of vector graphics, raster images, live searchable text, embedded fonts, form fields, and even JavaScript — all layered together. This is why converting a PDF to an image (a process called rasterization) requires a full rendering engine rather than simple pixel extraction: every element must be composited at the target resolution to produce the final output.",
			},
			{
				question: "Why choose PNG over JPG for PDF pages?",
				answer:
					"PNG is a lossless format, so every pixel is preserved exactly as rendered. This makes it ideal for documents with sharp text, line art, diagrams, or screenshots where JPG compression artifacts would be noticeable. PNG also supports transparency, which JPG does not.",
			},
			{
				question: "Will the output files be large?",
				answer:
					"PNG files are typically larger than JPG because PNG uses lossless compression. A single 300 DPI page can be several megabytes. If file size matters more than pixel-perfect quality, consider using the PDF to JPG tool instead.",
			},
			{
				question: "What resolution should I pick?",
				answer:
					"72 DPI matches typical screen resolution and produces the smallest files. 150 DPI is a solid middle ground for sharing or embedding in slides. 300 DPI is best for printing or when you need to capture fine details.",
			},
		],
	});
}

const faqItems = [
	{
		question: "What makes PDF so complex to rasterize?",
		answer: (
			<>
				A single PDF page can contain a rich mix of vector graphics, raster
				images, live searchable text, embedded fonts, form fields, and even
				JavaScript — all layered together. This is why converting a PDF to an
				image (a process called rasterization) requires a full rendering engine
				rather than simple pixel extraction: every element must be composited at
				the target resolution to produce the final output. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/PDF"
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
		question: "Why choose PNG over JPG for PDF pages?",
		answer:
			"PNG is a lossless format, so every pixel is preserved exactly as rendered. This makes it ideal for documents with sharp text, line art, diagrams, or screenshots where JPG compression artifacts would be noticeable. PNG also supports transparency, which JPG does not.",
	},
	{
		question: "Will the output files be large?",
		answer:
			"PNG files are typically larger than JPG because PNG uses lossless compression. A single 300 DPI page can be several megabytes. If file size matters more than pixel-perfect quality, consider using the PDF to JPG tool instead.",
	},
	{
		question: "What resolution should I pick?",
		answer:
			"72 DPI matches typical screen resolution and produces the smallest files. 150 DPI is a solid middle ground for sharing or embedding in slides. 300 DPI is best for printing or when you need to capture fine details.",
	},
];

export default function PdfToPngPage() {
	return (
		<ToolPageLayout
			title="PDF to PNG"
			description="Export PDF pages as lossless PNG images — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<PdfToImageTool defaultOutputFormat="image/png" />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					Turn any PDF into crisp, lossless PNG images without leaving your
					browser. Each page is rendered at your chosen resolution using PDF.js
					and exported as a PNG file that preserves every detail — sharp text,
					vector graphics, transparency, and all. Ideal for extracting diagrams
					from technical papers, saving receipts, or preparing slides. Your PDF
					never touches a server; processing runs entirely on your device.
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
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					PDF.js
				</a>{" "}
				&middot; Apache-2.0 License
			</p>
		</ToolPageLayout>
	);
}
