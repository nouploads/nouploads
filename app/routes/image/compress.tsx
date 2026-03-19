import { lazy, Suspense } from "react";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Spinner } from "~/components/ui/spinner";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/compress";

const ImageCompressorTool = lazy(
	() => import("~/features/image-tools/components/image-compressor-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Compress Images Online — Free, Private, No Upload | NoUploads",
		description:
			"Compress JPG, PNG, and WebP images online for free. Adjust quality, see before and after. Files never leave your device.",
		path: "/image/compress",
		keywords:
			"compress image, reduce image size, image compressor online, free image compressor, compress jpg png webp, private image compression, batch compress images",
		jsonLdName: "Image Compressor",
	});
}

const faqItems = [
	{
		question: "Which image formats can I compress?",
		answer:
			"You can compress JPG, PNG, WebP, and AVIF images. The tool re-encodes each file in its original format at the quality level you choose, keeping the same file type while reducing size.",
	},
	{
		question: "How does the quality slider work?",
		answer:
			"The slider controls the compression level from 10% (maximum compression, smallest file, most artifacts) to 100% (minimal compression, largest file, best quality). For most uses, 70–85% gives a good balance between size and visual quality.",
	},
	{
		question: "Can I compress multiple images at once?",
		answer:
			"Yes. Drop or select multiple image files and they'll all be compressed in a batch. You can download each result individually or grab everything at once with the Download All button.",
	},
	{
		question: "Is my data safe?",
		answer:
			"Completely. Your images never leave your device. All compression runs in your browser using the Canvas API — there's no server upload, no cloud processing, and no data collection.",
	},
	{
		question: "Why use NoUploads instead of other image compressors?",
		answer:
			"Most online compressors upload your photos to remote servers, which means your personal images pass through someone else's infrastructure. NoUploads processes everything locally in your browser. There's no queue, no daily limit, no watermark, and it works even offline. It's free, open source, and you can verify the code yourself.",
	},
];

export default function CompressPage() {
	return (
		<ToolPageLayout
			title="Compress Images"
			description="Compress JPG, PNG, and WebP images online — reduce file size with adjustable quality, free and private."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageCompressorTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The NoUploads Image Compressor reduces file sizes for JPG, PNG, WebP,
					and AVIF images using your browser's Canvas API. Drag and drop any
					supported image, adjust the quality slider, and compare the before and
					after side by side. Handles single files and large batches with no
					file size restrictions or account required.
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

			<p className="text-xs text-muted-foreground mt-8">
				Processed using the browser's built-in{" "}
				<a
					href="https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					Canvas API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
