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
import type { Route } from "./+types/compress-gif";

const CompressGifTool = lazy(
	() => import("~/features/image-tools/components/compress-gif-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Compress GIF Online — Free, No Limits | NoUploads",
		description:
			"Shrink animated GIFs using lossy LZW compression and transparency optimization in your browser — free, no upload, preserves every frame and loop setting.",
		path: "/image/compress-gif",
		keywords:
			"compress gif, reduce gif size, gif compressor, optimize gif, lossy gif compression, gif optimizer online, shrink gif file size",
		jsonLdName: "GIF Compressor",
		faq: [
			{
				question: "Why is GIF limited to 256 colors per frame?",
				answer:
					"GIF uses indexed color — each frame contains a palette of up to 256 colors, and every pixel is simply an index into that palette. This was a practical design choice in 1987, when most computer displays could show only 256 colors and modems ran at 1,200–2,400 baud. The constraint that seems like a limitation today was actually a feature that kept file sizes tiny enough for early online services like CompuServe.",
			},
			{
				question: "How does GIF compression work?",
				answer:
					"This tool uses gifsicle's lossy LZW compression, which subtly modifies pixel data so the LZW algorithm can compress it more efficiently. It also optimizes transparency — replacing duplicate pixels between frames with transparent ones so there's less data to store. The result is a smaller GIF that looks nearly identical to the original.",
			},
			{
				question: "What does the quality slider control?",
				answer:
					"The slider controls quality from 10% (maximum compression, smallest file, most artifacts) to 100% (minimal compression, largest file, best quality). For most GIFs, 70–85% gives a good balance between file size and visual fidelity. Start at the default (80%) and adjust based on the preview.",
			},
			{
				question: "Will my animated GIF still animate after compression?",
				answer:
					"Yes. The compression preserves all frames, timing, and loop settings. It reduces file size by optimizing how frame data is stored, not by removing frames. The output is still a fully animated GIF.",
			},
		],
	});
}

const faqItems = [
	{
		question: "Why is GIF limited to 256 colors per frame?",
		answer: (
			<>
				GIF uses indexed color — each frame contains a palette of up to 256
				colors, and every pixel is simply an index into that palette. This was a
				practical design choice in 1987, when most computer displays could show
				only 256 colors and modems ran at 1,200–2,400 baud. The constraint that
				seems like a limitation today was actually a feature that kept file
				sizes tiny enough for early online services like CompuServe. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/GIF#Palettes"
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
		question: "How does GIF compression work?",
		answer:
			"This tool uses gifsicle's lossy LZW compression, which subtly modifies pixel data so the LZW algorithm can compress it more efficiently. It also optimizes transparency — replacing duplicate pixels between frames with transparent ones so there's less data to store. The result is a smaller GIF that looks nearly identical to the original.",
	},
	{
		question: "What does the quality slider control?",
		answer:
			"The slider controls quality from 10% (maximum compression, smallest file, most artifacts) to 100% (minimal compression, largest file, best quality). For most GIFs, 70–85% gives a good balance between file size and visual fidelity. Start at the default (80%) and adjust based on the preview.",
	},
	{
		question: "Will my animated GIF still animate after compression?",
		answer:
			"Yes. The compression preserves all frames, timing, and loop settings. It reduces file size by optimizing how frame data is stored, not by removing frames. The output is still a fully animated GIF.",
	},
];

export default function CompressGifPage() {
	return (
		<ToolPageLayout
			title="Compress GIF"
			description="Compress animated GIFs with lossy LZW compression — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<CompressGifTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The NoUploads GIF Compressor shrinks animated GIF files using
					gifsicle's lossy LZW compression and transparency optimization,
					running entirely in your browser via WebAssembly. Drag and drop any
					GIF, adjust the compression slider, and compare the before and after
					side by side. Handles single files and large batches with no signup or
					file size restrictions.
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

			<LibraryAttribution packages={["gifsicle-wasm-browser"]} />
		</ToolPageLayout>
	);
}
