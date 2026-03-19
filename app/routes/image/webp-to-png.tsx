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
import type { Route } from "./+types/webp-to-png";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert WebP to PNG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert WebP images to lossless PNG format. Preserves transparency. Free, private, browser-based.",
		path: "/image/webp-to-png",
		keywords:
			"webp to png, convert webp to png, webp to png transparent, webp converter lossless, save webp as png",
		jsonLdName: "WebP to PNG Converter",
	});
}

const ACCEPT = { "image/webp": [".webp"] };

const faqItems = [
	{
		question: "Why convert WebP to PNG instead of JPG?",
		answer:
			"Choose PNG when your WebP image has transparency or when you need a lossless format for further editing. PNG preserves every pixel exactly — no compression artifacts are introduced, unlike JPG. If you just need compatibility and don't care about transparency, JPG works too.",
	},
	{
		question: "Does the conversion preserve transparency?",
		answer:
			"Yes. WebP supports alpha transparency, and PNG preserves it perfectly. If your WebP image has a transparent background, the converted PNG will keep it intact.",
	},
	{
		question: "Will the PNG file be larger than the WebP?",
		answer:
			"Almost always. WebP is a more efficient format than PNG, especially for complex images. Expect the PNG output to be 2–5x larger. The tradeoff is broader software compatibility and lossless quality.",
	},
	{
		question: "Can I convert animated WebP files?",
		answer:
			"This tool converts the first frame of animated WebP images into a static PNG. For full animated WebP conversion, a dedicated animation tool would be needed.",
	},
	{
		question: "Why use NoUploads instead of other WebP to PNG tools?",
		answer:
			"Privacy and speed. Your WebP files stay entirely on your device — nothing is uploaded to any server. Conversion is instantaneous because it uses your browser's built-in image decoder. No signup, no limits, no waiting in a conversion queue. It's open source and works offline.",
	},
];

export default function WebpToPngPage() {
	return (
		<ToolPageLayout
			title="Convert WebP to PNG"
			description="Convert WebP images to lossless PNG with transparency — free, private, no upload required."
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
					Converts WebP images to lossless PNG format while preserving
					transparency. Use it when you need to open WebP files in software that
					only supports traditional formats, or when you want a pixel-perfect
					copy for editing. Handles single files and batches directly in your
					browser.
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
