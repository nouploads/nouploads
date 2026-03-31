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
import type { Route } from "./+types/resize";

const ImageResizeTool = lazy(
	() => import("~/features/image-tools/components/image-resize-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Resize Images Online — Free, Private, No Upload | NoUploads",
		description:
			"Resize images by pixels or percentage for free. Lock aspect ratio, pick output format, preview instantly. Files never leave your device.",
		path: "/image/resize",
		keywords:
			"resize image, image resizer online, resize image pixels, resize image percentage, scale image, reduce image dimensions, free image resizer, private image resizer",
		jsonLdName: "Image Resizer",
		faq: [
			{
				question: "Where does the Lanczos resampling algorithm come from?",
				answer:
					"When you resize an image, the software must create or remove pixels through a process called resampling. The most common algorithm for high-quality downscaling, Lanczos resampling, is named after Hungarian mathematician Cornelius Lanczos. It uses a windowed sinc function to calculate the ideal color value for each new pixel by considering a neighborhood of surrounding original pixels, producing sharp results with minimal ringing artifacts.",
			},
			{
				question: "How do I resize an image without stretching it?",
				answer:
					"Keep the aspect ratio locked (the lock icon between width and height). When you change one dimension, the other adjusts automatically to maintain the original proportions. This prevents any distortion or stretching.",
			},
			{
				question: "What output formats are available for resized images?",
				answer:
					"You can save your resized image as JPG, PNG, or WebP. JPG and WebP support a quality slider so you can balance file size and visual clarity. PNG produces lossless output at the cost of larger files.",
			},
			{
				question: "Is there a maximum image size I can resize?",
				answer:
					"The tool handles images up to 16,384 pixels on either side, which covers virtually every use case from phone photos to high-resolution scans. Processing happens in a Web Worker so your browser stays responsive even with large files.",
			},
		],
	});
}

const faqItems = [
	{
		question: "Where does the Lanczos resampling algorithm come from?",
		answer: (
			<>
				When you resize an image, the software must create or remove pixels
				through a process called resampling. The most common algorithm for
				high-quality downscaling, Lanczos resampling, is named after Hungarian
				mathematician Cornelius Lanczos. It uses a windowed sinc function to
				calculate the ideal color value for each new pixel by considering a
				neighborhood of surrounding original pixels, producing sharp results
				with minimal ringing artifacts.{" "}
				<a
					href="https://en.wikipedia.org/wiki/Lanczos_resampling"
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
		question: "How do I resize an image without stretching it?",
		answer:
			"Keep the aspect ratio locked (the lock icon between width and height). When you change one dimension, the other adjusts automatically to maintain the original proportions. This prevents any distortion or stretching.",
	},
	{
		question: "What output formats are available for resized images?",
		answer:
			"You can save your resized image as JPG, PNG, or WebP. JPG and WebP support a quality slider so you can balance file size and visual clarity. PNG produces lossless output at the cost of larger files.",
	},
	{
		question: "Is there a maximum image size I can resize?",
		answer:
			"The tool handles images up to 16,384 pixels on either side, which covers virtually every use case from phone photos to high-resolution scans. Processing happens in a Web Worker so your browser stays responsive even with large files.",
	},
];

export default function ResizePage() {
	return (
		<ToolPageLayout
			title="Image Resize"
			description="Resize images by pixels or percentage with aspect ratio control — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageResizeTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The NoUploads Image Resizer lets you scale images to exact pixel
					dimensions or common percentage presets. Lock the aspect ratio to
					avoid distortion, choose JPG, PNG, or WebP output, and adjust quality
					for lossy formats. A live before-and-after comparison shows you the
					result before you download. All processing runs in a Web Worker inside
					your browser — nothing is uploaded to any server.
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
