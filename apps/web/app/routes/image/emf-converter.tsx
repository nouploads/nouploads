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
import type { Route } from "./+types/emf-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert EMF Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert Windows EMF metafiles to JPG, PNG, or WebP in your browser. Renders shapes, lines, fills, and embedded bitmaps.",
		path: "/image/emf-converter",
		keywords:
			"emf to jpg, emf converter, emf to png, open emf file, convert emf online, emf viewer, enhanced metafile converter, emf to image",
		jsonLdName: "EMF Converter",
		faq: [
			{
				question: "How did the EMF format originate?",
				answer:
					'Enhanced Metafile (EMF) was introduced with Windows NT 3.1 in 1993 as a successor to the older WMF format. Rather than storing pixels, EMF records a sequence of GDI (Graphics Device Interface) drawing commands — instructions like "draw a line from A to B" or "fill this rectangle with blue." This makes it resolution-independent, conceptually similar to SVG but built on Microsoft\'s proprietary graphics model.',
			},
			{
				question: "Which EMF features does this tool support?",
				answer:
					"This decoder handles the most common EMF records: basic shapes (rectangles, ellipses, polygons, polylines), line drawing, path operations (begin/end/fill/stroke), pen and brush creation, object selection, embedded bitmaps via STRETCHDIBITS, and coordinate transforms. Complex features like advanced text layout, clipping regions, world transforms, and gradient fills are not implemented — those elements may render differently than in Windows.",
			},
			{
				question: "Why does my EMF file look different here than in Windows?",
				answer:
					"EMF is a recording of Windows GDI calls, and a perfect renderer would need a full GDI implementation. This tool covers the ~70% of records that appear in most real-world EMF files — shapes, fills, strokes, and embedded images. Files that rely heavily on text positioning, complex clipping, raster operations, or world transforms may show visual differences.",
			},
			{
				question: "Can I convert EMF files on a Mac or Linux machine?",
				answer:
					"Yes. Because this tool runs entirely in your browser, it works on macOS, Linux, ChromeOS, and Windows — anywhere with a modern browser. No Windows-specific software is needed. Drop your EMF file and download a standard JPG, PNG, or WebP image.",
			},
		],
	});
}

const ACCEPT = { "image/x-emf": [".emf"] };

const faqItems = [
	{
		question: "How did the EMF format originate?",
		answer: (
			<>
				Enhanced Metafile (EMF) was introduced with Windows NT 3.1 in 1993 as a
				successor to the older WMF format. Rather than storing pixels, EMF
				records a sequence of GDI (Graphics Device Interface) drawing commands —
				instructions like &quot;draw a line from A to B&quot; or &quot;fill this
				rectangle with blue.&quot; This makes it resolution-independent,
				conceptually similar to SVG but built on Microsoft's proprietary
				graphics model. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Windows_Metafile#EMF"
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
		question: "Which EMF features does this tool support?",
		answer:
			"This decoder handles the most common EMF records: basic shapes (rectangles, ellipses, polygons, polylines), line drawing, path operations (begin/end/fill/stroke), pen and brush creation, object selection, embedded bitmaps via STRETCHDIBITS, and coordinate transforms. Complex features like advanced text layout, clipping regions, world transforms, and gradient fills are not implemented — those elements may render differently than in Windows.",
	},
	{
		question: "Why does my EMF file look different here than in Windows?",
		answer:
			"EMF is a recording of Windows GDI calls, and a perfect renderer would need a full GDI implementation. This tool covers the ~70% of records that appear in most real-world EMF files — shapes, fills, strokes, and embedded images. Files that rely heavily on text positioning, complex clipping, raster operations, or world transforms may show visual differences.",
	},
	{
		question: "Can I convert EMF files on a Mac or Linux machine?",
		answer:
			"Yes. Because this tool runs entirely in your browser, it works on macOS, Linux, ChromeOS, and Windows — anywhere with a modern browser. No Windows-specific software is needed. Drop your EMF file and download a standard JPG, PNG, or WebP image.",
	},
];

export default function EmfConverterPage() {
	return (
		<ToolPageLayout
			title="Convert EMF"
			description="Convert Windows Enhanced Metafile (EMF) graphics to JPG, PNG, or WebP — free, private, no upload required."
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
					Renders EMF (Enhanced Metafile) vector graphics commonly found in
					Windows clipboard data, Office documents, and technical diagrams.
					Supports basic shapes, lines, fills, pen and brush styles, path
					operations, and embedded bitmaps. Complex metafiles with advanced text
					layout, clipping, or world transforms may render differently than in
					Windows — this is a narrow decoder covering the most common GDI
					records. All processing runs in your browser using the Canvas API — no
					file is uploaded to any server.
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
