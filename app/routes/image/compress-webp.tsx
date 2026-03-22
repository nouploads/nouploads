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
import type { Route } from "./+types/compress-webp";

const CompressWebpTool = lazy(
	() => import("~/features/image-tools/components/compress-webp-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Compress WebP Online — Free, Private, No Upload | NoUploads",
		description:
			"Compress WebP images online for free. Adjust quality, reduce file size. No upload, no signup — files never leave your device.",
		path: "/image/compress-webp",
		keywords:
			"compress webp, reduce webp size, webp compressor online, free webp compressor, private webp compressor, webp optimization",
		jsonLdName: "WebP Image Compressor",
	});
}

const faqItems = [
	{
		question: "Why compress WebP?",
		answer:
			"WebP already produces smaller files than JPG at the same quality, but you can squeeze even more savings by lowering the quality setting. This is useful for web performance where every kilobyte counts.",
	},
	{
		question: "What quality setting should I use?",
		answer:
			"80% (the default) is a good starting point. WebP handles low quality settings better than JPG — even 50–60% can look acceptable for web use. Use the before/after slider to find your sweet spot.",
	},
	{
		question: "Is my data safe?",
		answer:
			"Yes. Your files never leave your device. All compression happens directly in your browser using the Canvas API — no server upload, no cloud processing, no data collection.",
	},
	{
		question: "Can I compress multiple files at once?",
		answer:
			"Yes. Drop or select multiple WebP files and they'll all be compressed in a batch. You can download each result individually or all at once.",
	},
	{
		question: "Why use NoUploads instead of other WebP compressors?",
		answer:
			"WebP is already an efficient format, so recompressing on a server adds unnecessary round-trip time. NoUploads processes WebP files instantly in your browser with zero network overhead. Your images stay on your device, there's no account required, no usage limits, and it works even when you're offline. The project is free and open source.",
	},
];

export default function CompressWebpPage() {
	return (
		<ToolPageLayout
			title="Compress WebP"
			description="Compress WebP images online — reduce file size with adjustable quality, free and private."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<CompressWebpTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					NoUploads WebP Compressor lets you further optimize WebP images with a
					quality slider and instant before-and-after preview. Ideal for web
					developers and designers looking to shave bytes off already-efficient
					WebP assets. Batch compress multiple files at once — all processing
					happens in your browser with no server involved.
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
