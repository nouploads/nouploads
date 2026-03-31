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
		title: "Convert JPG to WebP Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert JPG images to WebP for smaller file sizes with similar quality. Free and private.",
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
				question: "Do all browsers support WebP?",
				answer:
					"Yes, all modern browsers — Chrome, Firefox, Safari, Edge — support WebP. The only exceptions are very old browser versions (Safari added support in 2020). For web usage in 2024+, WebP is safe to use universally.",
			},
			{
				question: "Is WebP better than JPG?",
				answer:
					"For file size, yes. WebP consistently achieves smaller files at the same visual quality. JPG still has wider support in legacy software and some social media platforms, so the choice depends on where you're using the images.",
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
				<a
					href="https://en.wikipedia.org/wiki/WebP"
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
		question: "Do all browsers support WebP?",
		answer:
			"Yes, all modern browsers — Chrome, Firefox, Safari, Edge — support WebP. The only exceptions are very old browser versions (Safari added support in 2020). For web usage in 2024+, WebP is safe to use universally.",
	},
	{
		question: "Is WebP better than JPG?",
		answer:
			"For file size, yes. WebP consistently achieves smaller files at the same visual quality. JPG still has wider support in legacy software and some social media platforms, so the choice depends on where you're using the images.",
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
