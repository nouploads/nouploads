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
import type { Route } from "./+types/avif-to-jpg";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert AVIF to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert AVIF images to widely compatible JPG format. Fast, free, and private — runs in your browser.",
		path: "/image/avif-to-jpg",
		keywords:
			"avif to jpg, avif to jpeg, convert avif to jpg, open avif file, avif converter, avif to jpg online",
		jsonLdName: "AVIF to JPG Converter",
	});
}

const ACCEPT = { "image/avif": [".avif"] };

const faqItems = [
	{
		question: "What is an AVIF file?",
		answer:
			"AVIF (AV1 Image File Format) is a next-generation image format based on the AV1 video codec. It achieves exceptionally small file sizes at high quality, but not all software and platforms support it yet.",
	},
	{
		question: "Why can't I open AVIF files on my computer?",
		answer:
			"AVIF support depends on your operating system and image viewer. Windows 10 needs the AV1 Video Extension from the Microsoft Store. Older macOS versions don't support it at all. Converting to JPG gives you a file that opens everywhere.",
	},
	{
		question: "Will the conversion lose quality?",
		answer:
			"There's minimal quality loss. AVIF images are typically very high quality to start with, and converting to JPG at 92% quality preserves nearly all visible detail. The resulting file will be larger than the AVIF original because JPG compression is less efficient.",
	},
	{
		question: "Can I batch convert AVIF files?",
		answer:
			"Yes. Select or drop multiple AVIF files and they're all converted to JPG simultaneously. Handy when you've received a set of images in AVIF format and need them in standard JPG.",
	},
	{
		question: "Why use NoUploads instead of other AVIF converters?",
		answer:
			"AVIF is niche enough that most converter sites have limited support or require desktop software. NoUploads decodes AVIF using your browser's native support and re-encodes to JPG entirely on your device. Zero upload, zero install, zero cost — and it handles batch conversion without queues.",
	},
];

export default function AvifToJpgPage() {
	return (
		<ToolPageLayout
			title="Convert AVIF to JPG"
			description="Convert AVIF images to universally supported JPG format — free, private, no upload required."
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
					Decodes AVIF images using your browser's native AV1 support and
					converts them to standard JPG. Useful when you receive AVIF files from
					modern cameras, websites, or messaging apps and need a format your
					software can handle. Works on any browser that supports AVIF decoding
					(Chrome 85+, Firefox 93+, Safari 16.4+).
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
