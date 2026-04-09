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
import type { Route } from "./+types/jpg-to-png";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "JPG to PNG — Free, Instant, No Upload | NoUploads",
		description:
			"Convert JPG to lossless PNG with no quality loss in your browser. Enables transparency support and prevents further compression artifacts. No upload, no signup.",
		path: "/image/jpg-to-png",
		keywords:
			"jpg to png, jpeg to png, convert jpg to png online, jpg to png converter free, jpg to png transparent background",
		jsonLdName: "JPG to PNG Converter",
		faq: [
			{
				question: "How did PNG come about as a format?",
				answer:
					"PNG was developed in 1996 as a patent-free replacement for GIF after Unisys began enforcing patents on the LZW compression algorithm that GIF used. The format's name originally stood for \"PNG's Not GIF\" — a recursive acronym in the tradition of GNU. Unlike GIF, PNG supports full 24-bit color with an alpha transparency channel and lossless compression, making it ideal for graphics that need crisp edges and transparency.",
			},
			{
				question: "Will the file size increase?",
				answer:
					"Usually yes. PNG uses lossless compression while JPG is lossy, so the PNG output is often larger. The tradeoff is perfect pixel fidelity — no compression artifacts are introduced.",
			},
			{
				question: "Does converting JPG to PNG improve image quality?",
				answer:
					"No. Converting formats doesn't recover detail lost during JPG compression. What it does is prevent any additional quality loss — once in PNG format, the image can be edited and re-saved without degradation.",
			},
		],
	});
}

const ACCEPT = { "image/jpeg": [".jpg", ".jpeg"] };

const faqItems = [
	{
		question: "How did PNG come about as a format?",
		answer: (
			<>
				PNG was developed in 1996 as a patent-free replacement for GIF after
				Unisys began enforcing patents on the LZW compression algorithm that GIF
				used. The format's name originally stood for "PNG's Not GIF" — a
				recursive acronym in the tradition of GNU. Unlike GIF, PNG supports full
				24-bit color with an alpha transparency channel and lossless
				compression, making it ideal for graphics that need crisp edges and
				transparency. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/PNG"
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
		question: "Will the file size increase?",
		answer:
			"Usually yes. PNG uses lossless compression while JPG is lossy, so the PNG output is often larger. The tradeoff is perfect pixel fidelity — no compression artifacts are introduced.",
	},
	{
		question: "Does converting JPG to PNG improve image quality?",
		answer:
			"No. Converting formats doesn't recover detail lost during JPG compression. What it does is prevent any additional quality loss — once in PNG format, the image can be edited and re-saved without degradation.",
	},
];

export default function JpgToPngPage() {
	return (
		<ToolPageLayout
			title="Convert JPG to PNG"
			description="Convert JPG images to lossless PNG format — free, private, no upload required."
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
					The browser's Canvas API decodes your JPG and re-encodes the raw pixel
					buffer as a lossless PNG — no data is quantized or discarded during
					the conversion. This is the format switch to make before heavy
					editing, because every subsequent save will be bit-for-bit identical.
					Supports batch conversion and produces files ready for transparency
					workflows in Photoshop, Figma, or any editor that reads PNG alpha
					channels.
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
