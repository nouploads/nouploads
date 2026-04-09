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
		title: "Image Filters Online — Free, No Limits | NoUploads",
		description:
			"Apply grayscale, sepia, blur, brightness, contrast, and more to images in your browser — free, no upload, real-time preview. Includes one-click presets.",
		path: "/image/filters",
		keywords:
			"image filters online, photo effects free, grayscale image, sepia filter, blur image, adjust brightness contrast, image effects no upload, private photo editor",
		jsonLdName: "Image Filters",
		faq: [
			{
				question: "What's the math behind image filters?",
				answer:
					"Most image filters apply a mathematical operation called convolution: a small matrix (called a kernel) slides across every pixel in the image, multiplying each pixel's neighbors by the kernel values and summing the results. A blur kernel uses uniform values to average neighbors together, edge detection uses negative values next to positive ones to highlight transitions, and sharpening amplifies the difference between a pixel and its surroundings.",
			},
			{
				question: "Are there one-click presets available?",
				answer:
					"Yes. The tool includes five presets: Grayscale, Sepia, Invert, Vintage (warm sepia tones with boosted contrast and brightness), and High Contrast. Click any preset to apply it instantly, then tweak individual sliders if needed. The Reset All button restores every slider to its default value.",
			},
			{
				question: "Does applying filters reduce image quality?",
				answer:
					"The tool processes your image at its original resolution using the Canvas API. For lossless formats like PNG the output is pixel-perfect. For lossy formats like JPG and WebP, a high-quality encoding (92%) minimizes compression artifacts. Dimensions are always preserved.",
			},
		],
	});
}

const faqItems = [
	{
		question: "What's the math behind image filters?",
		answer: (
			<>
				Most image filters apply a mathematical operation called convolution: a
				small matrix (called a kernel) slides across every pixel in the image,
				multiplying each pixel's neighbors by the kernel values and summing the
				results. A blur kernel uses uniform values to average neighbors
				together, edge detection uses negative values next to positive ones to
				highlight transitions, and sharpening amplifies the difference between a
				pixel and its surroundings. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Kernel_(image_processing)"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Wikipedia
				</a>
			</>
		),
	},
	{
		question: "Are there one-click presets available?",
		answer:
			"Yes. The tool includes five presets: Grayscale, Sepia, Invert, Vintage (warm sepia tones with boosted contrast and brightness), and High Contrast. Click any preset to apply it instantly, then tweak individual sliders if needed. The Reset All button restores every slider to its default value.",
	},
	{
		question: "Does applying filters reduce image quality?",
		answer:
			"The tool processes your image at its original resolution using the Canvas API. For lossless formats like PNG the output is pixel-perfect. For lossy formats like JPG and WebP, a high-quality encoding (92%) minimizes compression artifacts. Dimensions are always preserved.",
	},
];

export default function FiltersPage() {
	return (
		<ToolPageLayout
			title="Image Filters"
			description="Apply visual effects like grayscale, sepia, blur, brightness, and contrast to any image — free, private, no upload required."
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
