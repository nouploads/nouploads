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
import type { Route } from "./+types/filters";

const ImageFiltersTool = lazy(
	() => import("~/features/image-tools/components/image-filters-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Image Filters Online \u2014 Apply Effects Free, Private, No Upload | NoUploads",
		description:
			"Apply grayscale, sepia, blur, brightness, contrast, and more to images. Free, private, processed entirely in your browser.",
		path: "/image/filters",
		keywords:
			"image filters online, photo effects free, grayscale image, sepia filter, blur image, adjust brightness contrast, image effects no upload, private photo editor",
		jsonLdName: "Image Filters",
	});
}

const faqItems = [
	{
		question: "What filters can I apply to my images?",
		answer:
			"You can adjust brightness, contrast, saturation, blur, hue rotation, grayscale, sepia, and invert. Each filter has a dedicated slider so you can fine-tune the exact intensity. You can also combine multiple filters at once for creative effects.",
	},
	{
		question: "Are there one-click presets available?",
		answer:
			"Yes. The tool includes five presets: Grayscale, Sepia, Invert, Vintage (warm sepia tones with boosted contrast and brightness), and High Contrast. Click any preset to apply it instantly, then tweak individual sliders if needed. The Reset All button restores every slider to its default value.",
	},
	{
		question: "What image formats are supported?",
		answer:
			"You can filter JPG, PNG, WebP, AVIF, GIF, BMP, and TIFF images. The output preserves the original format so your files stay compatible with wherever you plan to use them.",
	},
	{
		question: "Does applying filters reduce image quality?",
		answer:
			"The tool processes your image at its original resolution using the Canvas API. For lossless formats like PNG the output is pixel-perfect. For lossy formats like JPG and WebP, a high-quality encoding (92%) minimizes compression artifacts. Dimensions are always preserved.",
	},
	{
		question: "Why use NoUploads instead of other image filter tools?",
		answer:
			"Traditional online photo editors upload your pictures to their servers for processing. NoUploads runs entirely in your browser \u2014 images never leave your device. There is no signup, no watermark, no daily limit, and the tool works even without an internet connection. It is free, unlimited, and open source.",
	},
];

export default function FiltersPage() {
	return (
		<ToolPageLayout
			title="Image Filters"
			description="Apply visual effects like grayscale, sepia, blur, brightness, and contrast to any image \u2014 free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageFiltersTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The NoUploads Image Filters tool lets you adjust brightness, contrast,
					saturation, blur, hue, grayscale, sepia, and invert on any raster
					image. Use built-in presets like Vintage or High Contrast for quick
					edits, or dial in each slider for precise control. A live before/after
					comparison updates as you drag, so you can see the effect in real
					time. Processing happens entirely inside a Web Worker on your device —
					no server, no upload, no waiting.
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
