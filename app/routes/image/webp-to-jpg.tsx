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
import type { Route } from "./+types/webp-to-jpg";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert WebP to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert WebP images to JPG for universal compatibility. Free, private, no upload needed.",
		path: "/image/webp-to-jpg",
		keywords:
			"webp to jpg, webp to jpeg, convert webp to jpg, webp converter, open webp file as jpg",
		jsonLdName: "WebP to JPG Converter",
	});
}

const ACCEPT = { "image/webp": [".webp"] };

const faqItems = [
	{
		question: "Why convert WebP to JPG?",
		answer:
			"WebP is a newer format that not all software supports. If you downloaded an image from the web and your photo editor, presentation software, or social media platform doesn't accept WebP, converting to JPG gives you universal compatibility.",
	},
	{
		question: "Will I lose quality converting WebP to JPG?",
		answer:
			"There's a small quality reduction because both formats use lossy compression and re-encoding introduces slight degradation. At the default quality setting (92%), the difference is essentially invisible to the human eye.",
	},
	{
		question: "Why are some website images in WebP format?",
		answer:
			"Web developers use WebP because it produces smaller file sizes than JPG at similar quality, which speeds up page loading. When you right-click and save these images, you get a .webp file that older software may not open.",
	},
	{
		question: "Can I batch convert WebP files?",
		answer:
			"Yes. Drop multiple WebP files at once and they'll all be converted to JPG. Useful when you've saved several images from the web and need them in a standard format for a document or presentation.",
	},
	{
		question: "Why use NoUploads instead of other WebP converters?",
		answer:
			"Many WebP converters require you to upload files to a server and wait in a queue. NoUploads converts WebP to JPG instantly in your browser with zero wait time. Your images stay on your device, there are no daily limits, and it works without an internet connection.",
	},
];

export default function WebpToJpgPage() {
	return (
		<ToolPageLayout
			title="Convert WebP to JPG"
			description="Convert WebP images to universally compatible JPG format — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageConverterTool defaultOutputFormat="image/jpeg" accept={ACCEPT} />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					Turns WebP images into standard JPG files your software can open.
					Designed for anyone who saves images from websites and needs them in a
					format that works everywhere — email attachments, Office documents,
					older photo editors. Processes files locally in your browser with no
					server round-trip.
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
