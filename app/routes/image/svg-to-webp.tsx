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
import type { Route } from "./+types/svg-to-webp";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert SVG to WebP Online — Free, Private, No Upload | NoUploads",
		description:
			"Turn SVG vectors into compact WebP images with transparency support. Runs in your browser — no upload needed.",
		path: "/image/svg-to-webp",
		keywords:
			"svg to webp, convert svg to webp, svg to webp online, svg webp converter, rasterize svg webp, vector to webp",
		jsonLdName: "SVG to WebP Converter",
	});
}

const ACCEPT = { "image/svg+xml": [".svg"] };

const faqItems = [
	{
		question: "What is WebP and why use it for SVG conversion?",
		answer:
			"WebP is a modern image format developed by Google that delivers significantly smaller files than PNG or JPG at equivalent visual quality. Converting your SVG to WebP gives you a lightweight raster image that loads faster on the web while keeping file sizes down — often 25-35% smaller than the same content saved as PNG.",
	},
	{
		question: "Does WebP preserve transparency from my SVG?",
		answer:
			"Yes. Unlike JPG, WebP supports an alpha channel, so transparent regions in your SVG carry over to the WebP output. You get the transparency of PNG combined with the compression efficiency of a modern codec.",
	},
	{
		question: "Which browsers support WebP images?",
		answer:
			"All major browsers — Chrome, Firefox, Safari, Edge, and Opera — support WebP. Safari added support in version 14 (2020), so coverage is now effectively universal. If you need to target very old browsers, PNG remains the safest fallback.",
	},
	{
		question: "How does WebP compare to PNG for rasterized SVGs?",
		answer:
			"For flat-color SVGs like logos and icons, WebP files are typically 25-35% smaller than PNG with no visible quality loss. For SVGs that contain gradients or embedded images, the savings can be even larger. Both formats support transparency, but WebP achieves it at a lower byte cost.",
	},
	{
		question: "Why use NoUploads instead of other SVG to WebP converters?",
		answer:
			"Most online converters upload your file to a remote server for processing. NoUploads does everything locally — the SVG is rasterized and encoded to WebP right inside your browser tab. Your files are never transmitted anywhere. There is no account required, no usage limit, and the tool works fully offline after the page loads. It is open source, so you can verify exactly what the code does.",
	},
];

export default function SvgToWebpPage() {
	return (
		<ToolPageLayout
			title="Convert SVG to WebP"
			description="Turn SVG vector graphics into compact WebP images with transparency support — free, private, no upload required."
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
					Rasterizes SVG vector files into WebP, a modern image format that
					delivers smaller file sizes than PNG while retaining transparency.
					Ideal for web developers optimizing page load times who need to
					convert vector assets into a bandwidth-friendly raster format.
					Processing happens entirely in your browser — no server round-trip, no
					file size limits.
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
