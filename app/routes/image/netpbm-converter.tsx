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
import type { Route } from "./+types/netpbm-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert Netpbm Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert PBM, PGM, PPM, PNM, PAM, and PFM files to JPG, PNG, or WebP in your browser. No upload, no signup.",
		path: "/image/netpbm-converter",
		keywords:
			"pbm to png, pgm converter, ppm to jpg, netpbm viewer, pam to png, pfm converter, convert pnm online",
		jsonLdName: "Netpbm Converter",
	});
}

const ACCEPT = {
	"image/x-portable-bitmap": [".pbm"],
	"image/x-portable-graymap": [".pgm"],
	"image/x-portable-pixmap": [".ppm"],
	"image/x-portable-anymap": [".pnm"],
	"image/x-portable-arbitrarymap": [".pam"],
	"image/x-portable-floatmap": [".pfm"],
};

const faqItems = [
	{
		question: "What are Netpbm image formats?",
		answer:
			"Netpbm is a family of simple image formats dating back to the late 1980s. PBM stores black-and-white bitmaps, PGM stores grayscale images, PPM stores color images, and PNM is a catch-all extension for any of those three. PAM is a newer generalized format supporting arbitrary channel counts. PFM stores floating-point pixel data for high dynamic range work. Their plain-text variants are human-readable, making them popular as interchange formats in academic research, scientific imaging, and command-line image pipelines.",
	},
	{
		question: "How does this converter handle PFM float data?",
		answer:
			"PFM files store each pixel channel as a 32-bit IEEE floating-point number, which can represent brightness values far beyond what monitors can display. This tool applies the Reinhard tone mapping operator to compress the dynamic range into standard 8-bit output, preserving detail in both shadows and highlights without harsh clipping.",
	},
	{
		question: "Can I convert both ASCII and binary Netpbm files?",
		answer:
			"Yes. The decoder handles all ten Netpbm variants: ASCII formats (P1 PBM, P2 PGM, P3 PPM), binary formats (P4 PBM, P5 PGM, P6 PPM), PAM (P7), and PFM (Pf grayscale, PF color). Both ASCII and binary versions of PBM, PGM, and PPM are automatically detected from the magic number in the file header.",
	},
	{
		question: "Why use NoUploads instead of other Netpbm converters?",
		answer:
			"Netpbm files often come from scientific instruments, medical imaging pipelines, or research data sets that may be sensitive or unpublished. This tool decodes every Netpbm variant entirely in your browser using a custom parser -- nothing is sent to a server. There is no file size limit beyond your device's memory, no account required, no watermarks, and it works offline once loaded. The source code is open for audit.",
	},
];

export default function NetpbmConverterPage() {
	return (
		<ToolPageLayout
			title="Convert Netpbm"
			description="Convert PBM, PGM, PPM, PNM, PAM, and PFM images to JPG, PNG, WebP, or AVIF — free, private, no upload required."
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
					Reads all Netpbm image formats — PBM (bitmap), PGM (grayscale), PPM
					(color), PNM (any of the three), PAM (arbitrary channels), and PFM
					(floating-point HDR) — and converts them to standard web formats.
					Useful for researchers working with scientific imaging tools,
					developers debugging image pipelines, and anyone who encounters these
					formats from Unix-era graphics utilities. Decoding runs entirely in
					your browser with a built-in parser that handles ASCII, binary, and
					float pixel encodings without any server or external library.
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
