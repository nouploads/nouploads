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
import type { Route } from "./+types/heic-to-jpg";

const HeicToJpgTool = lazy(
	() => import("~/features/image-tools/components/heic-to-jpg-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert HEIC to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert iPhone HEIC photos to JPG online for free. No upload, no signup — files never leave your device.",
		path: "/image/heic-to-jpg",
		keywords:
			"heic to jpg, convert heic, heic converter, iphone photo converter, heic to jpeg online, free heic converter, private file converter, batch heic convert",
		jsonLdName: "HEIC to JPG Converter",
	});
}

const faqItems = [
	{
		question: "What is a HEIC file?",
		answer:
			"HEIC (High Efficiency Image Container) is the default photo format on iPhones and iPads since iOS 11. It offers better compression than JPG while maintaining image quality, but isn't universally supported by all apps and websites.",
	},
	{
		question: "Is my data safe?",
		answer:
			"Yes. Your files never leave your device. All conversion happens directly in your browser using WebAssembly — no server upload, no cloud processing, no data collection.",
	},
	{
		question: "What quality setting should I use?",
		answer:
			"92% (the default) is a good balance between file size and quality. Use 100% for lossless-quality JPG output. For web use or sharing, 80–85% gives significantly smaller files with minimal visible difference.",
	},
	{
		question: "Can I convert multiple files at once?",
		answer:
			"Yes. Drop or select multiple HEIC files and they'll all be converted in a batch. You can download each result individually or all at once.",
	},
	{
		question: "Does this work offline?",
		answer:
			"Yes. After the page loads once, the conversion engine is cached in your browser. You can convert HEIC files even without an internet connection.",
	},
	{
		question: "Why use NoUploads instead of other HEIC converters?",
		answer:
			"HEIC files are your personal photo library — vacations, family gatherings, selfies you haven't shared yet. Most converter sites ask you to hand those photos to a stranger's server. NoUploads decodes them with a local WebAssembly engine so your camera roll never leaves your device. You can batch-convert an entire 500-photo vacation album on a train with no Wi-Fi and no one else sees a single frame. There is no account, no cost, and the source code is public.",
	},
];

export default function HeicToJpgPage() {
	return (
		<ToolPageLayout
			title="HEIC to JPG"
			description="Convert HEIC images to JPG online — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<HeicToJpgTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					HEIC is the default photo format on every iPhone and iPad since iOS
					11. It uses HEVC compression to cut file sizes roughly in half
					compared to JPG while retaining the same visible quality. This tool
					decodes HEIC with a WebAssembly build of libheif, then re-encodes each
					image as a standard JPG you can open anywhere. Drag an entire album in
					at once and adjust the quality slider per batch — useful when you need
					to email vacation photos from a phone that only shoots HEIC.
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

			<LibraryAttribution packages={["heic2any"]} />
		</ToolPageLayout>
	);
}
