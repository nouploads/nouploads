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
import type { Route } from "./+types/color-palette";

const ColorPaletteTool = lazy(
	() => import("~/features/image-tools/components/color-palette-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Color Palette Extractor — Free, No Limits | NoUploads",
		description:
			"Extract dominant colors from any image as HEX, RGB, and HSL values in your browser — free, no upload, powered by median-cut quantization for accurate results.",
		path: "/image/color-palette",
		keywords:
			"color palette extractor, extract colors from image, dominant colors, hex color picker, RGB from image, HSL, palette generator, color scheme, image colors",
		jsonLdName: "Color Palette Extractor",
		faq: [
			{
				question:
					"What is the story behind the median-cut color quantization algorithm?",
				answer:
					"The median-cut algorithm was introduced by Paul Heckbert in his 1982 SIGGRAPH paper as a method for choosing a limited color palette to represent an image. It works by recursively splitting the color space at the median of the channel with the widest range, producing perceptually balanced clusters. The technique became foundational in early computer graphics and is still used today for palette extraction and GIF encoding.",
			},
			{
				question:
					"How does the palette extractor decide which colors are dominant?",
				answer:
					"The tool downsamples your image to roughly 100 by 100 pixels for speed, then groups every pixel into clusters using median-cut quantization. Each cluster is split along the color channel (red, green, or blue) with the greatest range, and the average color of each final cluster becomes one swatch in your palette. The result highlights the colors that cover the most area in the image rather than the brightest or most saturated ones.",
			},
			{
				question:
					"Why does the extracted palette sometimes differ from what I expect?",
				answer:
					"Median-cut groups pixels by their numeric RGB values, which does not always match human perception of prominence. A large background area may dominate even if a smaller accent color feels more important visually. Adjusting the color count slider can help surface subtle accent tones by splitting the color space into finer buckets. Fully transparent pixels are excluded automatically so they do not skew the result.",
			},
		],
	});
}

const faqItems = [
	{
		question:
			"What is the story behind the median-cut color quantization algorithm?",
		answer: (
			<>
				The median-cut algorithm was introduced by Paul Heckbert in his 1982
				SIGGRAPH paper as a method for choosing a limited color palette to
				represent an image. It works by recursively splitting the color space at
				the median of the channel with the widest range, producing perceptually
				balanced clusters. The technique became foundational in early computer
				graphics and is still used today for palette extraction and GIF
				encoding. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Median_cut"
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
		question:
			"How does the palette extractor decide which colors are dominant?",
		answer:
			"The tool downsamples your image to roughly 100 by 100 pixels for speed, then groups every pixel into clusters using median-cut quantization. Each cluster is split along the color channel (red, green, or blue) with the greatest range, and the average color of each final cluster becomes one swatch in your palette. The result highlights the colors that cover the most area in the image rather than the brightest or most saturated ones.",
	},
	{
		question:
			"Why does the extracted palette sometimes differ from what I expect?",
		answer:
			"Median-cut groups pixels by their numeric RGB values, which does not always match human perception of prominence. A large background area may dominate even if a smaller accent color feels more important visually. Adjusting the color count slider can help surface subtle accent tones by splitting the color space into finer buckets. Fully transparent pixels are excluded automatically so they do not skew the result.",
	},
];

export default function ColorPalettePage() {
	return (
		<ToolPageLayout
			title="Color Palette Extractor"
			description="Extract dominant colors from any image as hex, RGB, and HSL \u2014 free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ColorPaletteTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The Color Palette Extractor analyzes any image and pulls out its
					dominant colors using median-cut quantization. Drop a photo, logo, or
					design mockup and get a clean palette of 3 to 12 colors with hex, RGB,
					and HSL values you can copy with one click. Designers use it to
					extract brand colors from screenshots, artists use it to study color
					composition, and developers grab CSS variables or Tailwind config
					directly from the export buttons. Everything runs in your browser
					through the Canvas API — no files are uploaded to any server.
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
