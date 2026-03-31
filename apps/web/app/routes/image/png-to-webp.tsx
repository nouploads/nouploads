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
import type { Route } from "./+types/png-to-webp";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert PNG to WebP Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert PNG images to WebP with transparency preserved. Smaller files, same quality. Free and private.",
		path: "/image/png-to-webp",
		keywords:
			"png to webp, convert png to webp, png to webp transparent, webp converter, optimize png for web",
		jsonLdName: "PNG to WebP Converter",
		faq: [
			{
				question: "How does WebP achieve smaller files than PNG?",
				answer:
					"WebP's lossless mode uses techniques that PNG lacks — including cross-color transforms, a subtract-green transform, and a custom entropy coder. For lossy mode, it applies predictive coding from the VP8 video codec that analyzes surrounding pixel blocks to predict each new block's content. Google's benchmarks showed WebP lossless files are on average 26% smaller than equivalent PNGs.",
			},
			{
				question: "Does PNG to WebP preserve transparency?",
				answer:
					"Yes. WebP supports alpha transparency just like PNG. Your transparent backgrounds, rounded corners, and semi-transparent effects will carry over perfectly to the WebP output.",
			},
			{
				question: "Is the conversion lossless?",
				answer:
					"WebP supports both lossy and lossless modes. This converter uses lossy compression at high quality (92%) by default, which provides the best size-to-quality ratio. The visual difference is essentially imperceptible.",
			},
			{
				question: "When should I keep PNG instead of converting?",
				answer:
					"Keep PNG if you need pixel-perfect lossless quality for technical diagrams, if your target platform doesn't support WebP, or if you're archiving images and want maximum compatibility with future software.",
			},
		],
	});
}

const ACCEPT = { "image/png": [".png"] };

const faqItems = [
	{
		question: "How does WebP achieve smaller files than PNG?",
		answer: (
			<>
				WebP's lossless mode uses techniques that PNG lacks — including
				cross-color transforms, a subtract-green transform, and a custom entropy
				coder. For lossy mode, it applies predictive coding from the VP8 video
				codec that analyzes surrounding pixel blocks to predict each new block's
				content. Google's benchmarks showed WebP lossless files are on average
				26% smaller than equivalent PNGs.{" "}
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
		question: "Does PNG to WebP preserve transparency?",
		answer:
			"Yes. WebP supports alpha transparency just like PNG. Your transparent backgrounds, rounded corners, and semi-transparent effects will carry over perfectly to the WebP output.",
	},
	{
		question: "Is the conversion lossless?",
		answer:
			"WebP supports both lossy and lossless modes. This converter uses lossy compression at high quality (92%) by default, which provides the best size-to-quality ratio. The visual difference is essentially imperceptible.",
	},
	{
		question: "When should I keep PNG instead of converting?",
		answer:
			"Keep PNG if you need pixel-perfect lossless quality for technical diagrams, if your target platform doesn't support WebP, or if you're archiving images and want maximum compatibility with future software.",
	},
];

export default function PngToWebpPage() {
	return (
		<ToolPageLayout
			title="Convert PNG to WebP"
			description="Convert PNG images to efficient WebP format with transparency — free, private, no upload required."
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
					Converts PNG images to WebP format while preserving alpha
					transparency. WebP delivers noticeably smaller files than PNG, making
					it a smart choice for web assets, app icons, and any image where file
					size matters. Handles single files and large batches entirely in your
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

			<LibraryAttribution browserApi="canvas" />
		</ToolPageLayout>
	);
}
