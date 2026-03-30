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
import type { Route } from "./+types/to-pdf";

const ImageToPdfTool = lazy(
	() => import("~/features/image-tools/components/image-to-pdf-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Images to PDF Online — Combine Images into PDF, Free & Private | NoUploads",
		description:
			"Combine multiple images into a PDF online for free. No upload, no signup — files never leave your device.",
		path: "/image/to-pdf",
		keywords:
			"images to pdf, combine images pdf, jpg to pdf, png to pdf, free image to pdf converter, private pdf creator, merge images into pdf",
		jsonLdName: "Images to PDF Converter",
	});
}

const faqItems = [
	{
		question: "What image formats can I combine into a PDF?",
		answer:
			"You can combine JPG, PNG, WebP, GIF, BMP, TIFF, AVIF, SVG, and HEIC images into a single PDF. JPG and PNG images are embedded directly, while other formats are automatically converted to PNG before embedding to ensure compatibility.",
	},
	{
		question: "Can I reorder images before creating the PDF?",
		answer:
			"Yes. After dropping your images, each file appears in a list with up/down arrows so you can arrange pages in exactly the order you want. You can also remove individual images or add more files at any time before creating the PDF.",
	},
	{
		question: "What page size options are available?",
		answer:
			'Three options: "Fit to Image" sizes each page to match the image dimensions exactly — ideal for preserving original resolution. "A4" and "Letter" place images centered on standard paper sizes with margins, scaling them down to fit if needed without stretching smaller images up.',
	},
	{
		question: "Is there a limit on how many images I can combine?",
		answer:
			"There is no hard limit. Since processing runs entirely in your browser, the practical limit depends on your device's memory. Most modern devices handle dozens of images without issue. Very large batches (100+ high-resolution photos) may be slow on phones or tablets.",
	},
	{
		question: "Why use NoUploads instead of other image-to-PDF tools?",
		answer:
			"Every image you drop stays on your device — nothing is uploaded to any server, ever. There is no account to create, no watermark on the output, no daily cap on conversions, and no file size restriction beyond what your browser can handle. The tool works offline after the first load, and the source code is open for anyone to inspect.",
	},
];

export default function ToPdfPage() {
	return (
		<ToolPageLayout
			title="Images to PDF"
			description="Combine multiple images into a single PDF — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageToPdfTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					This tool merges JPG, PNG, WebP, and other image formats into a single
					PDF document right inside your browser. Photographers, students, and
					anyone assembling visual documents can reorder pages, choose between
					fit-to-image or standard paper sizes, and download the result
					instantly. Your images never leave your device — the entire conversion
					runs client-side with no server involved.
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
					href="https://github.com/Hopding/pdf-lib"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					pdf-lib
				</a>{" "}
				· MIT License
			</p>
		</ToolPageLayout>
	);
}
