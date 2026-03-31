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
import type { Route } from "./+types/svgz-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert SVGZ Online — Free, Private, No Upload | NoUploads",
		description:
			"Decompress SVGZ files and convert to JPG, PNG, WebP, or AVIF in your browser. No upload, no server.",
		path: "/image/svgz-converter",
		keywords:
			"svgz to png, svgz to jpg, svgz converter online, open svgz file, compressed svg converter",
		jsonLdName: "SVGZ Converter",
	});
}

const ACCEPT = { "image/svg+xml-compressed": [".svgz"] };

const faqItems = [
	{
		question: "How does SVGZ compression actually work?",
		answer: (
			<>
				SVGZ is simply a gzip-compressed SVG file, typically reducing file size
				by 20–50% while remaining functionally identical to its uncompressed
				counterpart. All modern web browsers can decompress and render SVGZ
				natively. The compression uses the same DEFLATE algorithm found in ZIP
				files and PNG images — a well-proven lossless method standardized in RFC
				1951.{" "}
				<a
					href="https://en.wikipedia.org/wiki/SVG#Compression"
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
		question: "How does this tool convert SVGZ files?",
		answer:
			"The tool decompresses the gzip layer to recover the original SVG markup, then renders the vector graphics onto a canvas at full resolution. From there you can export to JPG, PNG, WebP, or AVIF. The entire process runs in your browser — the compressed file is never sent to a server. Because SVG is resolution-independent, the rasterized output matches the intrinsic dimensions defined in the SVG viewBox.",
	},
	{
		question: "Can I get the uncompressed SVG instead of a raster image?",
		answer:
			"This converter outputs raster formats (JPG, PNG, WebP, AVIF). If you only need to decompress the SVGZ back to plain SVG, you can use any gzip decompression tool — SVGZ is literally gzipped SVG with a different file extension. On macOS or Linux, running 'gunzip file.svgz' in a terminal produces the raw SVG.",
	},
];

export default function SvgzConverterPage() {
	return (
		<ToolPageLayout
			title="Convert SVGZ"
			description="Decompress SVGZ (gzip-compressed SVG) files and convert to JPG, PNG, WebP, or AVIF — free, private, no upload required."
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
					Converts SVGZ files — gzip-compressed SVG vector graphics — into
					standard raster formats. The tool decompresses the gzip wrapper to
					recover the original SVG markup, renders it at full resolution, and
					lets you save the result as JPG, PNG, WebP, or AVIF. Useful when you
					receive SVGZ assets from web servers, mapping tools, or design
					pipelines and need a raster version for presentations, documents, or
					social media. All decompression and rendering happens locally in your
					browser using the native DecompressionStream API and Canvas.
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
