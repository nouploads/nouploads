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
import type { Route } from "./+types/avif-to-png";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert AVIF to PNG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert AVIF images to lossless PNG format. Preserves transparency and detail. Free and private.",
		path: "/image/avif-to-png",
		keywords:
			"avif to png, convert avif to png, avif to png transparent, avif to png lossless, avif converter",
		jsonLdName: "AVIF to PNG Converter",
	});
}

const ACCEPT = { "image/avif": [".avif"] };

const faqItems = [
	{
		question: "Why convert AVIF to PNG instead of JPG?",
		answer:
			"Choose PNG when you need lossless quality or when the AVIF image has transparency. PNG preserves every pixel without any compression artifacts, making it ideal for graphics, screenshots, and images you plan to edit further.",
	},
	{
		question: "Is transparency preserved in the conversion?",
		answer:
			"Yes. AVIF supports alpha transparency, and PNG preserves it perfectly. If your AVIF file has transparent regions, they'll remain transparent in the PNG output.",
	},
	{
		question: "Why is the PNG file so much larger?",
		answer:
			"AVIF is an extremely efficient format — often 50% smaller than PNG. When you convert to PNG, you're trading compression efficiency for universal compatibility and lossless pixel fidelity. The larger file size is expected.",
	},
	{
		question: "Which browsers support AVIF?",
		answer:
			"Chrome 85+, Firefox 93+, and Safari 16.4+ can decode AVIF. If your browser can load this page and display images, it likely supports AVIF decoding. The conversion itself runs on the browser's built-in image pipeline.",
	},
	{
		question: "Why use NoUploads instead of other AVIF to PNG converters?",
		answer:
			"Most AVIF conversion tools require installing desktop software or uploading files to a remote server. NoUploads does the conversion entirely in your browser — your AVIF files never leave your machine. It's instant, free, works offline, and handles batches without any registration.",
	},
];

export default function AvifToPngPage() {
	return (
		<ToolPageLayout
			title="Convert AVIF to PNG"
			description="Convert AVIF images to lossless PNG with transparency preserved — free, private, no upload required."
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
					Converts AVIF images to lossless PNG using your browser's built-in AV1
					decoder. Preserves transparency and full image detail. Useful for
					designers who receive AVIF assets and need a standard lossless format
					for their workflow. Batch conversion is supported for processing
					multiple files at once.
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
