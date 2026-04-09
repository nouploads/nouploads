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
		title: "SVG to JPG — Free, Instant, No Upload | NoUploads",
		description:
			"Rasterize SVG vector graphics to JPG in your browser. Transparent regions render on a white background with adjustable JPEG quality. No upload, no signup.",
		path: "/image/svg-to-jpg",
		keywords:
			"svg to jpg, convert svg to jpg, svg to jpeg online, svg to jpg converter, rasterize svg jpeg, svg converter",
		jsonLdName: "SVG to JPG Converter",
		faq: [
			{
				question: "Where does the SVG format come from?",
				answer:
					"Scalable Vector Graphics (SVG) was developed by the World Wide Web Consortium (W3C) beginning in 1999. It emerged after six competing proposals for web vector graphics were submitted in 1998, including Adobe's PGML and Microsoft's VML. Rather than adopt any single proposal, the W3C created an entirely new XML-based language — a decision that ultimately produced a more elegant and extensible standard.",
			},
			{
				question: "What happens to transparent areas in my SVG?",
				answer:
					"JPG does not support transparency. Any transparent regions in your SVG are composited onto a white background before encoding. If you need to keep transparency, use the SVG to PNG or SVG to WebP converter instead.",
			},
			{
				question: "What JPG quality is best for SVG conversion?",
				answer:
					"For most SVGs with text and simple shapes, quality 85-90 gives a clean result at a reasonable file size. For SVGs with embedded photographs or complex gradients, 80 is usually enough. Lower values reduce file size but may introduce visible compression artifacts around sharp edges.",
			},
			{
				question:
					"Can I convert SVGs with embedded fonts or external resources?",
				answer:
					"Embedded fonts and inline styles are rendered correctly since the browser handles the SVG natively. External resources like linked stylesheets or images referenced via URL may not load because the file is processed locally without network access to those remote assets.",
			},
		],
	});
}

const ACCEPT = { "image/svg+xml": [".svg"] };

const faqItems = [
	{
		question: "Where does the SVG format come from?",
		answer: (
			<>
				Scalable Vector Graphics (SVG) was developed by the World Wide Web
				Consortium (W3C) beginning in 1999. It emerged after six competing
				proposals for web vector graphics were submitted in 1998, including
				Adobe's PGML and Microsoft's VML. Rather than adopt any single proposal,
				the W3C created an entirely new XML-based language — a decision that
				ultimately produced a more elegant and extensible standard. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/SVG"
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
		question: "What happens to transparent areas in my SVG?",
		answer: (
			<>
				JPG does not support transparency. Any transparent regions in your SVG
				are composited onto a white background before encoding. If you need to
				keep transparency, use our{" "}
				<a
					href="/image/svg-to-png"
					className="underline hover:text-foreground transition-colors"
				>
					SVG to PNG
				</a>{" "}
				or{" "}
				<a
					href="/image/svg-to-webp"
					className="underline hover:text-foreground transition-colors"
				>
					SVG to WebP
				</a>{" "}
				converter instead.
			</>
		),
	},
	{
		question: "What JPG quality is best for SVG conversion?",
		answer:
			"For most SVGs with text and simple shapes, quality 85-90 gives a clean result at a reasonable file size. For SVGs with embedded photographs or complex gradients, 80 is usually enough. Lower values reduce file size but may introduce visible compression artifacts around sharp edges.",
	},
	{
		question: "Can I convert SVGs with embedded fonts or external resources?",
		answer:
			"Embedded fonts and inline styles are rendered correctly since the browser handles the SVG natively. External resources like linked stylesheets or images referenced via URL may not load because the file is processed locally without network access to those remote assets.",
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
