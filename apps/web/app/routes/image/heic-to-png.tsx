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
import type { Route } from "./+types/heic-to-png";

const HeicToPngTool = lazy(
	() => import("~/features/image-tools/components/heic-to-png-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "HEIC to PNG — Free, Instant, No Upload | NoUploads",
		description:
			"Convert HEIC photos to lossless PNG with no quality loss in your browser. Preserves every pixel and enables transparency for editing. No upload, no signup.",
		path: "/image/heic-to-png",
		keywords:
			"heic to png, convert heic to png, heic converter lossless, iphone photo to png, heif to png, free heic converter",
		jsonLdName: "HEIC to PNG Converter",
		faq: [
			{
				question:
					"What makes HEIC fundamentally different from traditional photo formats?",
				answer:
					"HEIC uses the HEVC (H.265) video codec to compress still images, borrowing techniques like inter-prediction and advanced entropy coding that were originally designed for video frames. This is a radically different approach from JPEG's 1992-era DCT blocks — it's why an iPhone HEIC photo can be half the size of an equivalent JPG while looking identical. The HEIF container then wraps that compressed data alongside metadata, depth maps, and even image sequences in a single file.",
			},
			{
				question: "Why convert HEIC to PNG instead of JPG?",
				answer:
					"PNG is lossless — the decoded pixels are preserved exactly, with no additional compression artifacts layered on top. This matters for screenshots, graphics with text, or any image where you plan to edit further. JPG re-compresses the data, introducing new artifacts each time. PNG also supports transparency, which JPG cannot.",
			},
			{
				question: "Does converting HEIC to PNG increase the file size?",
				answer:
					"Yes, significantly. HEIC achieves roughly 50% compression over JPG, and PNG is lossless with no quality reduction. A 3 MB HEIC photo might produce a 15-25 MB PNG. This is normal — you're trading compression for perfect pixel fidelity. If file size matters more than lossless quality, convert to JPG instead.",
			},
		],
	});
}

const faqItems = [
	{
		question:
			"What makes HEIC fundamentally different from traditional photo formats?",
		answer: (
			<>
				HEIC uses the HEVC (H.265) video codec to compress still images,
				borrowing techniques like inter-prediction and advanced entropy coding
				that were originally designed for video frames. This is a radically
				different approach from JPEG's 1992-era DCT blocks — it's why an iPhone
				HEIC photo can be half the size of an equivalent JPG while looking
				identical. The HEIF container then wraps that compressed data alongside
				metadata, depth maps, and even image sequences in a single file. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/High_Efficiency_Video_Coding"
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
		question: "Why convert HEIC to PNG instead of JPG?",
		answer: (
			<>
				PNG is lossless — the decoded pixels are preserved exactly, with no
				additional compression artifacts layered on top. This matters for
				screenshots, graphics with text, or any image where you plan to edit
				further. JPG re-compresses the data, introducing new artifacts each
				time. PNG also supports transparency, which JPG cannot. If file size
				matters more, use our{" "}
				<a
					href="/image/heic-to-jpg"
					className="underline hover:text-foreground transition-colors"
				>
					HEIC to JPG converter
				</a>{" "}
				instead.
			</>
		),
	},
	{
		question: "Does converting HEIC to PNG increase the file size?",
		answer:
			"Yes, significantly. HEIC achieves roughly 50% compression over JPG, and PNG is lossless with no quality reduction. A 3 MB HEIC photo might produce a 15-25 MB PNG. This is normal — you're trading compression for perfect pixel fidelity. If file size matters more than lossless quality, convert to JPG instead.",
	},
];

export default function HeicToPngPage() {
	return (
		<ToolPageLayout
			title="HEIC to PNG"
			description="Convert HEIC images to lossless PNG online — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<HeicToPngTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					HEIC photos from iPhones and iPads use HEVC compression that most
					desktop apps still can't open natively. This tool decodes HEIC with a
					WebAssembly build of libheif, then saves each image as a lossless PNG
					— no quality slider needed because nothing is lost. The output files
					are larger than JPG, but every pixel is preserved exactly as captured.
					Drag in a batch of photos and download them all as PNG, ready for
					editing in Photoshop, Figma, or any tool that reads PNG.
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

			<LibraryAttribution packages={["heic2any"]} />
		</ToolPageLayout>
	);
}
