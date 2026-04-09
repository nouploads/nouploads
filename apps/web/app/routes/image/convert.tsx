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
import { ACCEPT_IMAGES } from "~/lib/accept";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/convert";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert Images Online — Free, No Limits | NoUploads",
		description:
			"Convert between JPG, PNG, WebP, AVIF, and more formats in your browser — free, no upload, transparency preserved where supported. Batch-ready converter.",
		path: "/image/convert",
		keywords:
			"image converter, convert image format, png to jpg, jpg to webp, webp to png, free image converter, private image converter, batch image convert, convert images online",
		jsonLdName: "Image Format Converter",
		faq: [
			{
				question: "How do digital images represent color under the hood?",
				answer:
					"Most digital images use the RGB color model, where each pixel stores red, green, and blue intensity values. The standard of 8 bits per channel (256 levels per color, 16.7 million total colors) became established in the early 1990s as a practical match for human color perception. Different image formats package these pixel values in different ways — some with compression, some without, some with transparency — but the underlying RGB data is remarkably consistent across formats.",
			},
			{
				question: "Will converting my image reduce its quality?",
				answer:
					"It depends on the output format. Converting to PNG produces a lossless copy at the target format. Converting to JPG, WebP, or AVIF uses lossy compression, but at high default quality (92%) the difference is imperceptible for most images. Transparency is preserved when converting to PNG or WebP.",
			},
			{
				question: "What happens to transparent backgrounds?",
				answer:
					"PNG and WebP preserve transparency. If you convert a transparent image to JPG, the transparent areas become white — JPG doesn't support alpha channels.",
			},
		],
	});
}

const faqItems = [
	{
		question: "How do digital images represent color under the hood?",
		answer: (
			<>
				Most digital images use the RGB color model, where each pixel stores
				red, green, and blue intensity values. The standard of 8 bits per
				channel (256 levels per color, 16.7 million total colors) became
				established in the early 1990s as a practical match for human color
				perception. Different image formats package these pixel values in
				different ways — some with compression, some without, some with
				transparency — but the underlying RGB data is remarkably consistent
				across formats. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/RGB_color_model"
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
		question: "Will converting my image reduce its quality?",
		answer:
			"It depends on the output format. Converting to PNG produces a lossless copy at the target format. Converting to JPG, WebP, or AVIF uses lossy compression, but at high default quality (92%) the difference is imperceptible for most images. Transparency is preserved when converting to PNG or WebP.",
	},
	{
		question: "What happens to transparent backgrounds?",
		answer:
			"PNG and WebP preserve transparency. If you convert a transparent image to JPG, the transparent areas become white — JPG doesn't support alpha channels.",
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

			<LibraryAttribution browserApi="canvas" />
		</ToolPageLayout>
	);
}
