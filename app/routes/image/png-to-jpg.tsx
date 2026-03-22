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
import type { Route } from "./+types/png-to-jpg";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert PNG to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert PNG images to JPG for smaller file sizes. Free, private, no server upload required.",
		path: "/image/png-to-jpg",
		keywords:
			"png to jpg, png to jpeg, convert png to jpg online, png to jpg converter, reduce png file size",
		jsonLdName: "PNG to JPG Converter",
	});
}

const ACCEPT = { "image/png": [".png"] };

const faqItems = [
	{
		question: "Why convert PNG to JPG?",
		answer:
			"JPG files are significantly smaller than PNGs for photographic content. If you have screenshots or photos saved as PNG and need to reduce file size for email, web uploads, or storage, converting to JPG is the fastest way to shrink them.",
	},
	{
		question: "What happens to transparent areas?",
		answer:
			"JPG doesn't support transparency. Any transparent areas in your PNG will be filled with a white background during conversion. If you need to preserve transparency, consider WebP or keep the PNG format.",
	},
	{
		question: "How much smaller will my files be?",
		answer:
			"It depends on the image content. Photographs converted from PNG to JPG typically shrink by 50–90%. Simple graphics with flat colors see less dramatic savings because JPG compression is optimized for continuous-tone images.",
	},
	{
		question: "Can I convert multiple PNGs at once?",
		answer:
			"Yes. Select or drag multiple PNG files and they'll all be converted to JPG in a batch. Download each result individually or grab everything at once.",
	},
	{
		question: "Why use NoUploads instead of other PNG to JPG tools?",
		answer:
			"Your screenshots and images may contain sensitive content — text, personal data, or proprietary information. NoUploads never sees your files because conversion happens entirely in your browser. No data leaves your machine, there's no signup required, and you can use it offline.",
	},
];

export default function PngToJpgPage() {
	return (
		<ToolPageLayout
			title="Convert PNG to JPG"
			description="Convert PNG images to compact JPG format — free, private, no upload required."
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
					Converts PNG screenshots, graphics, and photos into compressed JPG
					format. Ideal for reducing file size before sharing via email or
					uploading to platforms that prefer JPEG. Transparent regions are
					filled with white. Supports batch conversion of multiple files at
					once.
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
