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
import type { Route } from "./+types/svg-optimizer";

const SvgOptimizerTool = lazy(
	() => import("~/features/vector-tools/components/svg-optimizer-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Optimize SVG Online — Free, Private, No Upload | NoUploads",
		description:
			"Minify and optimize SVG files in your browser. Remove metadata, comments, and redundant attributes. Download optimized SVG or SVGZ.",
		path: "/vector/svg-optimizer",
		keywords:
			"optimize svg, minify svg, svg optimizer online, compress svg, svgo online, svg minifier, reduce svg file size, svgz",
		jsonLdName: "SVG Optimizer",
		faq: [
			{
				question: "Why do SVG files from design tools need optimization?",
				answer:
					"SVG files exported from tools like Adobe Illustrator, Figma, or Sketch often contain editor-specific metadata, unused definitions, redundant groups, and default attribute values that inflate file size without affecting how the image renders. Removing this cruft typically reduces SVG files by 30-60% — similar to how JavaScript minification strips whitespace and comments to shrink code for faster delivery.",
			},
			{
				question: "How much can SVG files be reduced in size?",
				answer:
					"Typical savings range from 10% to 60%, depending on how the SVG was created. Files exported from design tools like Figma, Illustrator, or Inkscape often contain large amounts of editor-specific metadata and verbose path definitions — these compress especially well. Simple, hand-written SVGs see smaller gains.",
			},
			{
				question: "Does optimization change how my SVG looks?",
				answer:
					"No. The optimization is strictly lossless — it only removes data that has no visual effect. Path coordinates are simplified and attributes are cleaned up, but the rendered output stays pixel-identical. Your shapes, colors, gradients, and text all remain intact.",
			},
			{
				question: "What is SVGZ and when should I use it?",
				answer:
					"SVGZ is a gzip-compressed SVG file. It's typically 60-80% smaller than the optimized SVG and is supported by all modern browsers when served with the correct Content-Encoding header. Use SVGZ when you control the server configuration and want the absolute smallest file size for icons, illustrations, or logos.",
			},
		],
	});
}

const faqItems = [
	{
		question: "Why do SVG files from design tools need optimization?",
		answer: (
			<>
				SVG files exported from tools like Adobe Illustrator, Figma, or Sketch
				often contain editor-specific metadata, unused definitions, redundant
				groups, and default attribute values that inflate file size without
				affecting how the image renders. Removing this cruft typically reduces
				SVG files by 30-60% — similar to how JavaScript minification strips
				whitespace and comments to shrink code for faster delivery. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/SVG#Compression"
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
		question: "How much can SVG files be reduced in size?",
		answer:
			"Typical savings range from 10% to 60%, depending on how the SVG was created. Files exported from design tools like Figma, Illustrator, or Inkscape often contain large amounts of editor-specific metadata and verbose path definitions — these compress especially well. Simple, hand-written SVGs see smaller gains.",
	},
	{
		question: "Does optimization change how my SVG looks?",
		answer:
			"No. The optimization is strictly lossless — it only removes data that has no visual effect. Path coordinates are simplified and attributes are cleaned up, but the rendered output stays pixel-identical. Your shapes, colors, gradients, and text all remain intact.",
	},
	{
		question: "What is SVGZ and when should I use it?",
		answer:
			"SVGZ is a gzip-compressed SVG file. It's typically 60-80% smaller than the optimized SVG and is supported by all modern browsers when served with the correct Content-Encoding header. Use SVGZ when you control the server configuration and want the absolute smallest file size for icons, illustrations, or logos.",
	},
];

export default function SvgOptimizerPage() {
	return (
		<ToolPageLayout
			title="SVG Optimizer"
			description="Minify and optimize SVG files using svgo — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<SvgOptimizerTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					This tool uses svgo to strip metadata, comments, editor cruft, and
					unnecessary attributes from SVG files, then optimizes path data and
					merges redundant elements. It also offers SVGZ (gzip-compressed SVG)
					output for maximum compression when you control the hosting
					environment. Ideal for cleaning up SVGs exported from Figma,
					Illustrator, Inkscape, or Sketch before deploying to production.
					Everything runs client-side in your browser — no files are sent to any
					server.
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

			<LibraryAttribution packages={["svgo"]} />
		</ToolPageLayout>
	);
}
