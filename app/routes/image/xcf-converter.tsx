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
import type { Route } from "./+types/xcf-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert XCF Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert GIMP XCF files to JPG, PNG, or WebP in your browser. Flattens layers, handles RLE and indexed color.",
		path: "/image/xcf-converter",
		keywords:
			"xcf to jpg, xcf to png, xcf converter, open xcf file, gimp to jpg, convert xcf online, xcf viewer, gimp file converter",
		jsonLdName: "XCF Converter",
	});
}

const ACCEPT = { "image/x-xcf": [".xcf"] };

const faqItems = [
	{
		question: "What is an XCF file?",
		answer:
			"XCF is the native file format for GIMP (GNU Image Manipulation Program). It preserves the full editing state — layers, channels, paths, and selection masks. Because XCF is specific to GIMP, most other applications cannot open it directly. This tool flattens the layered document into a standard image format that works everywhere.",
	},
	{
		question: "How does the converter handle GIMP layers?",
		answer:
			"The decoder reads every visible layer from the XCF file, respects each layer's opacity and x/y position, and composites them bottom-to-top using standard alpha blending. The result matches what you see when you flatten the image in GIMP. Hidden layers are skipped entirely.",
	},
	{
		question: "Does it support all GIMP blend modes?",
		answer:
			"Currently only Normal blend mode is fully supported. Layers set to other blend modes (Multiply, Screen, Overlay, etc.) are still composited, but treated as Normal. For most documents with straightforward layer stacks, the output will look correct. Complex blend-mode-heavy compositions may differ from the GIMP preview.",
	},
	{
		question: "What about indexed-color and grayscale XCF files?",
		answer:
			"Both are supported. Indexed-color images have their palette embedded in the file, and the decoder maps each pixel index to its RGB value. Grayscale images are expanded to full RGB. The output is always a standard RGBA image regardless of the original color mode.",
	},
	{
		question: "Why use NoUploads instead of other XCF converters?",
		answer:
			"GIMP project files often contain work-in-progress designs, unpublished artwork, or client drafts that should stay private. NoUploads decodes the XCF binary format entirely in your browser with a custom parser — no file ever leaves your device, no server processes your data. It handles RLE and zlib tile compression, all three color modes, and multi-layer compositing. Free, unlimited, works offline, open source, no signup required.",
	},
];

export default function XcfConverterPage() {
	return (
		<ToolPageLayout
			title="Convert XCF"
			description="Convert GIMP XCF project files to JPG, PNG, WebP, or AVIF — free, private, no upload required."
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
					Opens GIMP XCF files and composites all visible layers into a single
					flattened image you can export as JPG, PNG, WebP, or AVIF. Useful when
					you need to share GIMP artwork with someone who does not have GIMP
					installed, or when you want a quick preview without launching the full
					editor. Supports RGB, grayscale, and indexed-color documents with RLE
					or zlib-compressed tiles. Everything runs locally in your browser —
					the file never touches a server.
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

			<LibraryAttribution browserApi="canvas" />
		</ToolPageLayout>
	);
}
