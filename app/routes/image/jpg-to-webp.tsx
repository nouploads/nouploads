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
	});
}

const ACCEPT = { "image/jpeg": [".jpg", ".jpeg"] };

const faqItems = [
	{
		question: "Why convert JPG to WebP?",
		answer:
			"WebP produces files 25–35% smaller than JPG at comparable visual quality. If you're optimizing images for a website, app, or want to save storage space, WebP gives you noticeably better compression without visible quality loss.",
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
	{
		question: "Can I convert JPG photos to WebP in bulk?",
		answer:
			"Yes. Drop multiple JPG files at once to batch convert them all to WebP. Ideal for optimizing an entire folder of photos before uploading to your website or CMS.",
	},
	{
		question: "Why use NoUploads instead of other JPG to WebP converters?",
		answer:
			"Web-based converters typically upload your JPGs to their servers, compress them remotely, and send back the results. NoUploads skips all of that — conversion runs directly in your browser using the Canvas API. Your photos never leave your device, there's no waiting, and you get unlimited conversions for free.",
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
					Converts JPG photographs to Google's WebP format, which delivers
					significantly smaller file sizes at perceptually identical quality.
					Particularly useful for web developers optimizing site performance and
					anyone looking to save storage space. Processes files instantly in
					your browser with batch support.
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
