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
		question: "What's the story behind the AVIF format?",
		answer: (
			<>
				AVIF is based on the AV1 video codec, developed by the Alliance for Open
				Media — a consortium that includes Google, Mozilla, Apple, Microsoft,
				Netflix, and Amazon. The format was designed from the ground up to be
				royalty-free, a deliberate response to the complex licensing surrounding
				HEVC/H.265 which underpins the competing HEIF format. AVIF typically
				achieves 30–50% smaller file sizes than JPEG at comparable visual
				quality.{" "}
				<a
					href="https://en.wikipedia.org/wiki/AVIF"
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
		question: "Why can't I open AVIF files on my computer?",
		answer:
			"AVIF support depends on your operating system and image viewer. Windows 10 needs the AV1 Video Extension from the Microsoft Store. Older macOS versions don't support it at all. Converting to JPG gives you a file that opens everywhere.",
	},
	{
		question: "Will the conversion lose quality?",
		answer:
			"There's minimal quality loss. AVIF images are typically very high quality to start with, and converting to JPG at 92% quality preserves nearly all visible detail. The resulting file will be larger than the AVIF original because JPG compression is less efficient.",
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
					AVIF uses the AV1 video codec for still images, achieving roughly 50%
					smaller files than JPG at the same quality. The trade-off is limited
					software support: Windows 10 needs the AV1 extension, and many editors
					still reject .avif outright. This tool leverages your browser's
					built-in AV1 decoder — no WASM download required — and re-encodes the
					bitmap as a standard JPEG. Batch mode handles dumps from modern
					cameras or messaging apps that default to AVIF.
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
