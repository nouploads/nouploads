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
import type { Route } from "./+types/jpg-to-png";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert JPG to PNG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert JPG images to PNG format with transparency support. Free, private, runs in your browser.",
		path: "/image/jpg-to-png",
		keywords:
			"jpg to png, jpeg to png, convert jpg to png online, jpg to png converter free, jpg to png transparent background",
		jsonLdName: "JPG to PNG Converter",
	});
}

const ACCEPT = { "image/jpeg": [".jpg", ".jpeg"] };

const faqItems = [
	{
		question: "Why convert JPG to PNG?",
		answer:
			"PNG supports transparency and uses lossless compression, making it ideal for logos, icons, screenshots, and graphics with sharp edges. Converting from JPG to PNG won't add transparency to an existing photo, but it stops further quality loss from re-saving.",
	},
	{
		question: "Will the file size increase?",
		answer:
			"Usually yes. PNG uses lossless compression while JPG is lossy, so the PNG output is often larger. The tradeoff is perfect pixel fidelity — no compression artifacts are introduced.",
	},
	{
		question: "Can I add a transparent background after converting?",
		answer:
			"This converter preserves the image as-is in PNG format. To make a background transparent, you'd need an image editor. However, having the file in PNG format is the first step since JPG doesn't support transparency at all.",
	},
	{
		question: "Does converting JPG to PNG improve image quality?",
		answer:
			"No. Converting formats doesn't recover detail lost during JPG compression. What it does is prevent any additional quality loss — once in PNG format, the image can be edited and re-saved without degradation.",
	},
	{
		question: "Why use NoUploads instead of other JPG to PNG converters?",
		answer:
			"Other converters upload your photos to their servers for processing. NoUploads runs entirely in your browser — your JPG files never leave your device. There's no queue, no daily limit, no watermark, and it works even without an internet connection.",
	},
];

export default function JpgToPngPage() {
	return (
		<ToolPageLayout
			title="Convert JPG to PNG"
			description="Convert JPG images to lossless PNG format — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageConverterTool defaultOutputFormat="image/png" accept={ACCEPT} />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					Converts JPEG photographs and images into PNG format using your
					browser's Canvas API. Useful when you need lossless storage, plan to
					edit the image further, or require a format that supports alpha
					transparency. Handles single files and batch conversions with no file
					size restrictions.
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
