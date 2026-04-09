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
import type { Route } from "./+types/webp-to-jpg";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "WebP to JPG — Free, Instant, No Upload | NoUploads",
		description:
			"Convert WebP images to universally compatible JPG in your browser. Produces files every email client, editor, and social platform accepts. No upload, no signup.",
		path: "/image/webp-to-jpg",
		keywords:
			"webp to jpg, webp to jpeg, convert webp to jpg, webp converter, open webp file as jpg",
		jsonLdName: "WebP to JPG Converter",
		faq: [
			{
				question: "How did WebP go from a Google experiment to a web standard?",
				answer:
					"When Google released WebP in 2010, adoption was painfully slow — most notably, Apple's Safari didn't add support until September 2020, a full decade after launch. Google pushed adoption by converting YouTube thumbnails and Chrome Web Store images to WebP. The format finally reached universal browser support in 2020 and is now widely used by major e-commerce platforms and CDNs to reduce image bandwidth.",
			},
			{
				question: "Will I lose quality converting WebP to JPG?",
				answer:
					"There's a small quality reduction because both formats use lossy compression and re-encoding introduces slight degradation. At the default quality setting (92%), the difference is essentially invisible to the human eye.",
			},
			{
				question: "What happens to transparent areas in a WebP image?",
				answer:
					"WebP supports alpha transparency but JPG does not. Any transparent regions in the WebP are composited onto a white background during conversion. If preserving transparency matters, use a WebP to PNG converter instead.",
			},
		],
	});
}

const ACCEPT = { "image/webp": [".webp"] };

const faqItems = [
	{
		question: "How did WebP go from a Google experiment to a web standard?",
		answer: (
			<>
				When Google released WebP in 2010, adoption was painfully slow — most
				notably, Apple's Safari didn't add support until September 2020, a full
				decade after launch. Google pushed adoption by converting YouTube
				thumbnails and Chrome Web Store images to WebP. The format finally
				reached universal browser support in 2020 and is now widely used by
				major e-commerce platforms and CDNs to reduce image bandwidth. Source:{" "}
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
		question: "Will I lose quality converting WebP to JPG?",
		answer:
			"There's a small quality reduction because both formats use lossy compression and re-encoding introduces slight degradation. At the default quality setting (92%), the difference is essentially invisible to the human eye.",
	},
	{
		question: "What happens to transparent areas in a WebP image?",
		answer: (
			<>
				WebP supports alpha transparency but JPG does not. Any transparent
				regions in the WebP are composited onto a white background during
				conversion. If preserving transparency matters, use our{" "}
				<a
					href="/image/webp-to-png"
					className="underline hover:text-foreground transition-colors"
				>
					WebP to PNG converter
				</a>{" "}
				instead.
			</>
		),
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
					WebP is the format you get when you "Save Image As" from most modern
					websites — Chrome, Edge, and Firefox all default to it. This tool
					decodes WebP using the browser's native decoder and pipes the bitmap
					straight to the Canvas API for JPG encoding. The result is a plain
					JPEG that Outlook, PowerPoint, older versions of Photoshop, and every
					social media upload form accept without complaint. Batch mode lets you
					convert a folder of saved web images in one drop.
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
