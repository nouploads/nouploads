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
import type { Route } from "./+types/svg-to-jpg";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert SVG to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert SVG vector graphics to JPG images with adjustable quality and white background. Free and private.",
		path: "/image/svg-to-jpg",
		keywords:
			"svg to jpg, convert svg to jpg, svg to jpeg online, svg to jpg converter, rasterize svg jpeg, svg converter",
		jsonLdName: "SVG to JPG Converter",
	});
}

const ACCEPT = { "image/svg+xml": [".svg"] };

const faqItems = [
	{
		question: "Why convert SVG to JPG instead of PNG?",
		answer:
			"JPG produces smaller file sizes than PNG for photographic or gradient-heavy SVGs. If your SVG contains complex gradients, blurs, or embedded images rather than flat colors, JPG will give you a more compact file that loads faster on the web and in emails.",
	},
	{
		question: "What happens to transparent areas in my SVG?",
		answer:
			"JPG does not support transparency. Any transparent regions in your SVG are composited onto a white background before encoding. If you need to keep transparency, convert to PNG or WebP instead.",
	},
	{
		question: "What quality setting should I use?",
		answer:
			"For most SVGs with text and simple shapes, quality 85-90 gives a clean result at a reasonable file size. For SVGs with embedded photographs or complex gradients, 80 is usually enough. Lower values reduce file size but may introduce visible compression artifacts around sharp edges.",
	},
	{
		question: "Can I convert SVGs with embedded fonts or external resources?",
		answer:
			"Embedded fonts and inline styles are rendered correctly since the browser handles the SVG natively. External resources like linked stylesheets or images referenced via URL may not load because the file is processed locally without network access to those remote assets.",
	},
	{
		question: "Why use NoUploads instead of other SVG to JPG converters?",
		answer:
			"SVG files are often proprietary brand assets — your logo, icon system, or pitch-deck illustrations. Handing them to a conversion server means your design IP sits in someone else's logs. NoUploads rasterizes SVGs by loading them into an Image element and drawing onto a Canvas, all inside your browser tab. The vector data never leaves your machine, which is exactly what you want for unreleased brand work or files under client NDA. Once the page is cached, it keeps working without a connection.",
	},
];

export default function SvgToJpgPage() {
	return (
		<ToolPageLayout
			title="Convert SVG to JPG"
			description="Convert SVG vector graphics to JPG images with adjustable quality — free, private, no upload required."
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
					Rasterizes SVG vector graphics at their declared viewBox dimensions by
					drawing them onto an HTML Canvas and exporting the result as JPEG. The
					browser's own SVG renderer handles embedded fonts, CSS styles, and
					path data, so the output matches what you see in Chrome or Firefox.
					Particularly useful when a client, printer, or social media platform
					rejects SVG uploads and you need a flat image quickly. Adjustable JPEG
					quality lets you balance crispness against file weight for
					gradient-heavy or photographic SVGs.
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
