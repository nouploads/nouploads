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
import type { Route } from "./+types/cdr-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert CDR Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert CorelDRAW CDR files to JPG, PNG, or WebP in your browser. Extracts embedded preview images privately.",
		path: "/image/cdr-converter",
		keywords:
			"cdr to jpg, cdr to png, cdr converter online, open cdr file, coreldraw converter, cdr viewer online, convert cdr free",
		jsonLdName: "CDR Converter",
	});
}

const ACCEPT = { "application/vnd.corel-draw": [".cdr"] };

const faqItems = [
	{
		question: "What is a CDR file?",
		answer:
			"CDR is the native file format for CorelDRAW, a vector graphics editor first released in 1989. CDR files store vector drawings, text, bitmaps, and page layout information. The format has evolved significantly — older versions use a RIFF container structure, while CDR X5 and later versions use a ZIP-based archive format similar to OOXML documents.",
	},
	{
		question: "How does this tool convert CDR files without a server?",
		answer:
			"CorelDRAW files typically embed preview images for quick display in file managers and other applications. This tool extracts that embedded preview — checking RIFF DISP chunks in classic CDR files and thumbnail images in ZIP-based CDR archives. The preview is then available for download as JPG, PNG, WebP, or AVIF. All processing runs in your browser.",
	},
	{
		question: "What are the limitations of CDR preview extraction?",
		answer:
			"This tool extracts the embedded preview image, not the full vector artwork. The preview resolution depends on what CorelDRAW stored when saving the file — typically a mid-resolution bitmap suitable for thumbnails and quick previews. CDR files without embedded previews cannot be converted. For full vector editing, you need CorelDRAW or Inkscape.",
	},
	{
		question: "Which CDR versions are supported?",
		answer:
			"Both classic RIFF-based CDR files (versions up through X4) and newer ZIP-based CDR files (X5 and later) are supported. The decoder checks the file structure and uses the appropriate extraction method. Very old CDR files from the early 1990s that lack embedded previews may not work.",
	},
	{
		question: "Why use NoUploads instead of other CDR converters?",
		answer:
			"Design files are often proprietary and confidential. NoUploads extracts the CDR preview entirely on your device — the file never leaves your browser, no data goes to any server. There are no file size limits, no daily conversion caps, and no watermarks on the output. The tool works offline after the first load, requires no account, and is open source.",
	},
];

export default function CdrConverterPage() {
	return (
		<ToolPageLayout
			title="Convert CDR"
			description="Convert CorelDRAW CDR files to JPG, PNG, or WebP — free, private, no upload required."
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
					Extracts embedded preview images from CorelDRAW CDR files and converts
					them to standard web formats. Handles both classic RIFF-based CDR
					files and newer ZIP-based archives (CDR X5+). Useful when you need a
					quick image from a CDR file without installing CorelDRAW. Processing
					runs entirely in your browser — classic files are parsed with a custom
					RIFF reader, and ZIP-based files are opened with JSZip.
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

			<LibraryAttribution packages={["jszip"]} />
		</ToolPageLayout>
	);
}
