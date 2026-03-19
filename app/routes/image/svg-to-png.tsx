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
import type { Route } from "./+types/svg-to-png";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert SVG to PNG Online — Free, Private, No Upload | NoUploads",
		description:
			"Rasterize SVG vector graphics to PNG images. Preserves transparency. Free and private.",
		path: "/image/svg-to-png",
		keywords:
			"svg to png, convert svg to png, svg to png online, rasterize svg, svg to image, svg converter",
		jsonLdName: "SVG to PNG Converter",
	});
}

const ACCEPT = { "image/svg+xml": [".svg"] };

const faqItems = [
	{
		question: "Why convert SVG to PNG?",
		answer:
			"SVG is a vector format that not all platforms accept — social media, email clients, and many CMS systems require raster images. Converting to PNG gives you a pixel-based image that works everywhere while preserving any transparency in the original SVG.",
	},
	{
		question: "What resolution will the PNG be?",
		answer:
			"The PNG is rendered at the SVG's declared dimensions (width and height attributes or viewBox). If your SVG specifies 800×600, the PNG output will be 800×600 pixels. For higher resolution, edit the SVG dimensions before converting.",
	},
	{
		question: "Will transparency be preserved?",
		answer:
			"Yes. Any transparent regions in your SVG remain transparent in the PNG output. PNG fully supports alpha transparency, so backgrounds, overlapping elements, and opacity effects all carry over.",
	},
	{
		question: "Can I convert SVG logos and icons?",
		answer:
			"Absolutely. This is one of the most common use cases — converting vector logos to PNG for documents, email signatures, presentations, or platforms that don't render SVG. Drop your SVG file and download a clean PNG in seconds.",
	},
	{
		question: "Why use NoUploads instead of other SVG converters?",
		answer:
			"SVG files for logos and brand assets are often confidential. NoUploads renders the SVG to PNG entirely in your browser — the file never leaves your computer. There's no server, no account, no daily cap, and it works offline. Perfect for designers working with client assets.",
	},
];

export default function SvgToPngPage() {
	return (
		<ToolPageLayout
			title="Convert SVG to PNG"
			description="Rasterize SVG vector graphics to PNG images with transparency — free, private, no upload required."
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
					Rasterizes SVG vector graphics into PNG bitmap images at the SVG's
					native dimensions. Commonly used by designers and developers who need
					to export vector logos, icons, or illustrations for platforms that
					only accept raster formats. Transparency is fully preserved, and
					everything happens client-side.
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
