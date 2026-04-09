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
import type { Route } from "./+types/watermark";

const ImageWatermarkTool = lazy(
	() => import("~/features/image-tools/components/image-watermark-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Add Watermark Online — Free, No Limits | NoUploads",
		description:
			"Add centered or tiled text watermarks to images in your browser — free, no upload, adjustable opacity, rotation, and font size. Ideal for proofs and drafts.",
		path: "/image/watermark",
		keywords:
			"add watermark to image, image watermark online, text watermark, watermark photo, free watermark tool, private watermark, watermark no upload, tiled watermark",
		jsonLdName: "Image Watermark",
		faq: [
			{
				question: "Where does the word 'watermark' come from?",
				answer:
					'The word "watermark" originates from 13th-century Italian papermaking, where a raised design on the wire mold left a thinner area in the wet pulp that became visible when the dried paper was held up to light. Paper mills used watermarks to identify their products, and governments adopted them for currency authentication. Digital watermarking adapts the same concept — embedding ownership or origin data directly into a file\'s content.',
			},
			{
				question:
					"What is the difference between centered and tiled watermarks?",
				answer:
					"A centered watermark places a single text label in the middle of your image, useful for branding a preview or proof. A tiled watermark repeats the text across the entire image in a grid pattern, making it much harder to crop or remove — ideal for protecting stock photography or draft materials.",
			},
			{
				question: "Can I control how visible the watermark is?",
				answer:
					"Yes. The opacity slider lets you set visibility from 10% (barely visible) to 100% (fully opaque). Most watermarks work well between 20% and 40% — visible enough to deter theft but subtle enough to keep the image usable as a preview.",
			},
			{
				question: "Will the watermark reduce my image quality?",
				answer:
					"The tool redraws your image at its original resolution and overlays the text. For lossless formats like PNG the quality is identical. For lossy formats like JPG and WebP, a high-quality encoding (92%) is used by default to minimize any compression artifacts.",
			},
		],
	});
}

const faqItems = [
	{
		question: "Where does the word 'watermark' come from?",
		answer: (
			<>
				The word "watermark" originates from 13th-century Italian papermaking,
				where a raised design on the wire mold left a thinner area in the wet
				pulp that became visible when the dried paper was held up to light.
				Paper mills used watermarks to identify their products, and governments
				adopted them for currency authentication. Digital watermarking adapts
				the same concept — embedding ownership or origin data directly into a
				file's content. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Watermark"
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
		question: "What is the difference between centered and tiled watermarks?",
		answer:
			"A centered watermark places a single text label in the middle of your image, useful for branding a preview or proof. A tiled watermark repeats the text across the entire image in a grid pattern, making it much harder to crop or remove — ideal for protecting stock photography or draft materials.",
	},
	{
		question: "Can I control how visible the watermark is?",
		answer:
			"Yes. The opacity slider lets you set visibility from 10% (barely visible) to 100% (fully opaque). Most watermarks work well between 20% and 40% — visible enough to deter theft but subtle enough to keep the image usable as a preview.",
	},
	{
		question: "Will the watermark reduce my image quality?",
		answer:
			"The tool redraws your image at its original resolution and overlays the text. For lossless formats like PNG the quality is identical. For lossy formats like JPG and WebP, a high-quality encoding (92%) is used by default to minimize any compression artifacts.",
	},
];

export default function WatermarkPage() {
	return (
		<ToolPageLayout
			title="Image Watermark"
			description="Add text watermarks to images with adjustable size, opacity, rotation, and placement — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageWatermarkTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The NoUploads Image Watermark tool overlays custom text onto your
					photos and graphics. Choose between a single centered watermark or a
					repeating tiled pattern that covers the entire image. Adjust the font
					size, opacity, rotation angle, and color to get exactly the look you
					need. Everything runs locally in your browser using the Canvas API —
					your images are never sent to a server.
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
