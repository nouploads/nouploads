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
import type { Route } from "./+types/tiff-to-jpg";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert TIFF to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert TIFF images to compact JPG format entirely in your browser. No upload, no signup, no limits.",
		path: "/image/tiff-to-jpg",
		keywords:
			"tiff to jpg, tiff to jpeg, convert tiff to jpg, tif to jpg online, tiff converter, tiff to jpg free",
		jsonLdName: "TIFF to JPG Converter",
	});
}

const ACCEPT = { "image/tiff": [".tiff", ".tif"] };

const faqItems = [
	{
		question: "What is a TIFF file?",
		answer:
			"TIFF (Tagged Image File Format) is a high-quality image format widely used in printing, publishing, and professional photography. TIFF files preserve full detail but are typically much larger than JPG because they often store uncompressed or losslessly compressed pixel data.",
	},
	{
		question: "Will converting to JPG reduce quality?",
		answer:
			"JPG uses lossy compression, so there is a small quality reduction. At the default 92% quality setting, the difference is virtually invisible for photographs. The upside is dramatically smaller files — a 30MB TIFF might become a 2MB JPG.",
	},
	{
		question: "Does this handle CMYK and multi-page TIFFs?",
		answer:
			"Yes. CMYK color data is automatically converted to RGB during decoding. Multi-page TIFFs are supported — the first page is converted by default. Common TIFF compressions (LZW, ZIP, JPEG) are all handled.",
	},
	{
		question: "Can I batch convert TIFF files?",
		answer:
			"Yes. Drop or select multiple TIFF files and they are all converted to JPG in a single batch. Each file processes independently, so one failure won't stop the rest.",
	},
	{
		question: "Why use NoUploads instead of other TIFF converters?",
		answer:
			"Print-ready TIFF files can contain sensitive content — client proofs, pre-press artwork, medical scans. NoUploads decodes and converts TIFF entirely on your device using the utif2 library. Nothing is uploaded, there's no file size cap, and it works offline once loaded. Free and open source.",
	},
];

export default function TiffToJpgPage() {
	return (
		<ToolPageLayout
			title="Convert TIFF to JPG"
			description="Convert TIFF images to compact, universally compatible JPG format — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageConverterTool defaultOutputFormat="image/jpeg" accept={ACCEPT} />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					Decodes TIFF files — including LZW, ZIP, and JPEG-compressed variants
					— and re-encodes them as standard JPG with adjustable quality. Ideal
					for converting print-ready files into web-friendly images or shrinking
					scanned documents for email. Supports CMYK-to-RGB conversion and
					16-bit-to-8-bit downscaling automatically. All processing runs locally
					in your browser.
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

			<LibraryAttribution packages={["utif2"]} />
		</ToolPageLayout>
	);
}
