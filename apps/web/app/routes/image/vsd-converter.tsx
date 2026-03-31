import { lazy, Suspense } from "react";
import { LibraryAttribution } from "~/components/tool/library-attribution";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Spinner } from "~/components/ui/spinner";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/vsd-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Convert Visio VSD/VSDX Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert Microsoft Visio VSD and VSDX diagrams to JPG, PNG, or WebP in your browser. No server, no upload.",
		path: "/image/vsd-converter",
		keywords:
			"vsd to jpg, vsdx to png, visio converter online, open vsd file, vsdx converter, visio to image, convert visio free",
		jsonLdName: "Visio VSD/VSDX Converter",
	});
}

const ACCEPT = {
	"application/vnd.visio": [".vsd"],
	"application/vnd.ms-visio.drawing.main+xml": [".vsdx"],
};

const faqItems = [
	{
		question: "How did Visio and the VSD format come about?",
		answer: (
			<>
				Visio was originally developed as a product called Axon by Shapeware
				Corporation in 1992, then acquired by Microsoft in 2000. The VSD format
				became the de facto standard for business diagrams: flowcharts,
				organizational charts, network topology maps, and floor plans. Visio's
				stencil-and-connector approach made it possible for non-designers to
				create professional-looking technical diagrams.{" "}
				<a
					href="https://en.wikipedia.org/wiki/Microsoft_Visio"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Source: Wikipedia
				</a>
			</>
		),
	},
	{
		question: "How does this tool handle both VSD and VSDX formats?",
		answer:
			"The two formats use completely different internal structures. VSD files are OLE2 compound files — the tool reads them with the cfb library and scans binary streams for embedded JPEG, PNG, or BMP images. VSDX files are ZIP archives — the tool opens them with JSZip and looks for the OOXML thumbnail or media images. Both paths extract the best available preview.",
	},
	{
		question: "What should I expect when converting VSD files?",
		answer:
			"This tool extracts embedded images and thumbnails rather than rendering the full diagram. Text, shapes, connectors, and page layout are not reproduced — that would require a complete Visio rendering engine. The quality depends on what Visio stored as a preview when the file was saved. For full diagram editing, use Microsoft Visio, draw.io, or Lucidchart.",
	},
	{
		question: "Can I convert Visio files with multiple pages?",
		answer:
			"The tool extracts the primary thumbnail or the largest embedded image, which typically represents the first page or a composite preview. Individual page-by-page extraction is not supported — the goal is to produce a usable image from the diagram as quickly as possible.",
	},
];

export default function VsdConverterPage() {
	return (
		<ToolPageLayout
			title="Convert Visio VSD/VSDX"
			description="Convert Microsoft Visio VSD and VSDX diagrams to JPG, PNG, or WebP — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageConverterTool accept={ACCEPT} />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					Extracts preview images from Microsoft Visio diagram files in both
					legacy VSD and modern VSDX formats. VSD files are parsed as OLE2
					compound files using the cfb library, scanning streams for embedded
					JPEG or PNG data. VSDX files are opened as ZIP archives using JSZip,
					extracting the OOXML thumbnail or the largest media image. Ideal for
					pulling a quick image from a Visio diagram without a Visio license.
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

			<LibraryAttribution packages={["cfb", "jszip"]} />
		</ToolPageLayout>
	);
}
