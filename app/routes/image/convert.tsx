import { lazy, Suspense } from "react";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Spinner } from "~/components/ui/spinner";
import { ACCEPT_IMAGES } from "~/lib/accept";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/convert";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert Images Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert between JPG, PNG, WebP, AVIF, and more for free. No upload, no signup — files never leave your device.",
		path: "/image/convert",
		keywords:
			"image converter, convert image format, png to jpg, jpg to webp, webp to png, free image converter, private image converter, batch image convert, convert images online",
		jsonLdName: "Image Format Converter",
	});
}

const faqItems = [
	{
		question: "Which image formats can I convert between?",
		answer:
			"You can convert from any browser-supported format — JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, and SVG — to JPG, PNG, WebP, or AVIF output. The converter auto-detects the input format from the file you drop in.",
	},
	{
		question: "Will converting my image reduce its quality?",
		answer:
			"It depends on the output format. Converting to PNG produces a lossless copy at the target format. Converting to JPG, WebP, or AVIF uses lossy compression, but at high default quality (92%) the difference is imperceptible for most images. Transparency is preserved when converting to PNG or WebP.",
	},
	{
		question: "Can I convert multiple images at once?",
		answer:
			"Yes. Drop or select multiple files and they'll all be converted in a batch to your chosen output format. You can download each file individually or all at once.",
	},
	{
		question: "What happens to transparent backgrounds?",
		answer:
			"PNG and WebP preserve transparency. If you convert a transparent image to JPG, the transparent areas become white — JPG doesn't support alpha channels.",
	},
	{
		question: "Why use NoUploads instead of other image converters?",
		answer:
			"Most online converters upload your images to remote servers for processing. NoUploads converts everything directly in your browser using the Canvas API — your files never leave your device. There's no signup, no watermarks, no file size limits, and it works offline. It's free and open source.",
	},
];

export default function ConvertPage() {
	return (
		<ToolPageLayout
			title="Convert Images"
			description="Convert between JPG, PNG, WebP, AVIF, and more — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageConverterTool accept={ACCEPT_IMAGES} />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The NoUploads Image Converter handles format-to-format conversion for
					JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, and SVG files. Drop any
					supported image, pick your target format, and download instantly.
					Batch mode lets you convert entire folders at once. Everything runs in
					your browser — no server processing, no account required.
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
