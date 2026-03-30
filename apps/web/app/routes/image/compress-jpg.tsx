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
import type { Route } from "./+types/compress-jpg";

const CompressJpgTool = lazy(
	() => import("~/features/image-tools/components/compress-jpg-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Compress JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Compress JPG images online for free. Adjust quality, see before and after. No upload, no signup — files never leave your device.",
		path: "/image/compress-jpg",
		keywords:
			"compress jpg, reduce jpg size, jpg compressor, image compression online, free image compressor, private image compressor, batch compress jpg",
		jsonLdName: "JPG Image Compressor",
	});
}

const faqItems = [
	{
		question: "How does JPG compression work?",
		answer:
			"JPG uses lossy compression — it discards some visual detail to reduce file size. Lower quality settings produce smaller files with more visible artifacts. Higher quality preserves more detail at the cost of larger files.",
	},
	{
		question: "What quality setting should I use?",
		answer:
			"80% (the default) gives a great balance between file size and visual quality. For web images, 60–75% produces significantly smaller files with minimal visible difference. For archival quality, use 90–100%.",
	},
	{
		question: "Is my data safe?",
		answer:
			"Yes. Your files never leave your device. All compression happens directly in your browser using the Canvas API — no server upload, no cloud processing, no data collection.",
	},
	{
		question: "Can I compress multiple files at once?",
		answer:
			"Yes. Drop or select multiple JPG files and they'll all be compressed in a batch. You can download each result individually or all at once.",
	},
	{
		question: "Why use NoUploads instead of other image compressors?",
		answer:
			"Photos are personal — vacation snapshots, family portraits, ID scans. Most compressors upload those files to a server, and some even strip your EXIF data or slap on a watermark. NoUploads keeps everything on your device. You control exactly how much quality to trade for size with the live before-and-after slider, and your originals are never touched. No signup, no daily caps, works offline, and the source code is open for anyone to audit.",
	},
];

export default function CompressJpgPage() {
	return (
		<ToolPageLayout
			title="Compress JPG"
			description="Compress JPG images online — reduce file size with adjustable quality, free and private."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<CompressJpgTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					NoUploads JPG Compressor reduces JPEG file sizes directly in your
					browser with a simple quality slider. Drag the before-and-after
					comparison to see exactly how compression affects your image. Process
					single photos or batch compress entire folders — no server upload, no
					signup, no file size limits.
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
