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
import type { Route } from "./+types/jpg-to-webp";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "JPG to WebP — Free, Instant, No Upload | NoUploads",
		description:
			"Convert JPG to WebP for 25-34% smaller files at the same visual quality in your browser. Ideal for web performance and Lighthouse scores. No upload, no signup.",
		path: "/image/jpg-to-webp",
		keywords:
			"jpg to webp, jpeg to webp, convert jpg to webp, webp converter, reduce image size webp",
		jsonLdName: "JPG to WebP Converter",
		faq: [
			{
				question: "Why did Google create WebP?",
				answer:
					"WebP was developed by Google and first released in 2010. It uses predictive coding derived from the VP8 video codec to achieve lossy compression roughly 30% smaller than JPEG at equivalent visual quality. Google estimated that if the entire web switched to WebP, it would save approximately 50 petabytes of bandwidth per day — a major motivation for a company that serves billions of images through search and YouTube.",
			},
			{
				question: "What quality setting gives the best JPG-to-WebP tradeoff?",
				answer:
					"For photographic content, quality 75-80 in WebP roughly matches quality 85-90 in JPG visually while being 25-34% smaller. At quality 50 and below, WebP introduces blocky artifacts in gradients differently than JPG's banding — test with your actual images. For sharp-edged graphics like screenshots, lossless WebP is often smaller than a high-quality JPG.",
			},
		],
	});
}

const ACCEPT = { "image/jpeg": [".jpg", ".jpeg"] };

const faqItems = [
	{
		question: "Why did Google create WebP?",
		answer: (
			<>
				WebP was developed by Google and first released in 2010. It uses
				predictive coding derived from the VP8 video codec to achieve lossy
				compression roughly 30% smaller than JPEG at equivalent visual quality.
				Google estimated that if the entire web switched to WebP, it would save
				approximately 50 petabytes of bandwidth per day — a major motivation for
				a company that serves billions of images through search and YouTube.{" "}
				Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/WebP"
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
		question: "What quality setting gives the best JPG-to-WebP tradeoff?",
		answer:
			"For photographic content, quality 75-80 in WebP roughly matches quality 85-90 in JPG visually while being 25-34% smaller. At quality 50 and below, WebP introduces blocky artifacts in gradients differently than JPG's banding — test with your actual images. For sharp-edged graphics like screenshots, lossless WebP is often smaller than a high-quality JPG.",
	},
];

export default function JpgToWebpPage() {
	return (
		<ToolPageLayout
			title="Convert JPG to WebP"
			description="Convert JPG images to modern WebP format for smaller files — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageConverterTool defaultOutputFormat="image/webp" accept={ACCEPT} />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					WebP typically shaves 25--35% off a JPG's file size at the same
					perceived quality thanks to its VP8-based lossy encoder. This tool
					targets web developers running Lighthouse audits and e-commerce teams
					optimizing product galleries: drop a batch of JPGs, pick a quality
					level, and grab the WebP output for direct deployment. The Canvas API
					handles encoding natively in every modern browser, so there is no WASM
					payload to download and conversions start instantly.
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
