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
import type { Route } from "./+types/tiff-to-png";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "TIFF to PNG — Free, Instant, No Upload | NoUploads",
		description:
			"Convert TIFF images to lossless PNG with no quality loss in your browser. Handles CMYK-to-RGB conversion and preserves alpha transparency. No upload, no signup.",
		path: "/image/tiff-to-png",
		keywords:
			"tiff to png, tif to png, convert tiff to png online, tiff to png converter, tiff transparent png",
		jsonLdName: "TIFF to PNG Converter",
		faq: [
			{
				question:
					"Why has TIFF survived for decades in professional publishing?",
				answer:
					"TIFF endures in publishing and prepress because it supports features critical for print production that most web formats lack: CMYK color spaces for four-color printing, embedded ICC color profiles for consistent color across devices, 16-bit-per-channel depth for smooth gradients, and multiple lossless compression options. A TIFF file can faithfully represent the full range of what a professional printing press can produce.",
			},
			{
				question: "Why convert TIFF to PNG instead of JPG?",
				answer:
					"PNG preserves every pixel exactly — no compression artifacts. Choose PNG when your TIFF contains sharp text, line art, logos, or transparency. JPG is better for photographs where smaller file size matters more than pixel-perfect accuracy.",
			},
			{
				question: "Will the PNG file be smaller than the TIFF?",
				answer:
					"Usually yes, especially for TIFFs that store uncompressed data. PNG uses lossless deflate compression that is more efficient than raw pixel storage. However, the reduction is less dramatic than converting to JPG because PNG does not discard any detail.",
			},
			{
				question: "Does this preserve transparency from the TIFF?",
				answer:
					"Yes. If your TIFF includes an alpha channel, it carries through to the PNG output. PNG fully supports per-pixel transparency, making it the right choice for graphics that need to overlay other content.",
			},
		],
	});
}

const ACCEPT = { "image/tiff": [".tiff", ".tif"] };

const faqItems = [
	{
		question: "Why has TIFF survived for decades in professional publishing?",
		answer: (
			<>
				TIFF endures in publishing and prepress because it supports features
				critical for print production that most web formats lack: CMYK color
				spaces for four-color printing, embedded ICC color profiles for
				consistent color across devices, 16-bit-per-channel depth for smooth
				gradients, and multiple lossless compression options. A TIFF file can
				faithfully represent the full range of what a professional printing
				press can produce. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/TIFF"
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
		question: "Why convert TIFF to PNG instead of JPG?",
		answer:
			"PNG preserves every pixel exactly — no compression artifacts. Choose PNG when your TIFF contains sharp text, line art, logos, or transparency. JPG is better for photographs where smaller file size matters more than pixel-perfect accuracy.",
	},
	{
		question: "Will the PNG file be smaller than the TIFF?",
		answer:
			"Usually yes, especially for TIFFs that store uncompressed data. PNG uses lossless deflate compression that is more efficient than raw pixel storage. However, the reduction is less dramatic than converting to JPG because PNG does not discard any detail.",
	},
	{
		question: "Does this preserve transparency from the TIFF?",
		answer:
			"Yes. If your TIFF includes an alpha channel, it carries through to the PNG output. PNG fully supports per-pixel transparency, making it the right choice for graphics that need to overlay other content.",
	},
];

export default function TiffToPngPage() {
	return (
		<ToolPageLayout
			title="Convert TIFF to PNG"
			description="Convert TIFF images to lossless PNG with full transparency support — free, private, no upload required."
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
					Converts TIFF files to lossless PNG format while preserving
					transparency and full color depth. Handles CMYK-to-RGB conversion,
					16-bit-to-8-bit downscaling, and all standard TIFF compression schemes
					(LZW, ZIP, JPEG) automatically. Particularly useful for converting
					scanned documents, design assets, or print proofs into a web-ready
					format without any quality loss.
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

			<LibraryAttribution packages={["utif2"]} />
		</ToolPageLayout>
	);
}
