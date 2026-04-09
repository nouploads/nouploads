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
import type { Route } from "./+types/bmp-to-png";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "BMP to PNG — Free, Instant, No Upload | NoUploads",
		description:
			"Convert BMP bitmap images to lossless PNG with no quality loss in your browser. Applies DEFLATE compression for much smaller file output. No upload, no signup.",
		path: "/image/bmp-to-png",
		keywords:
			"bmp to png, convert bmp to png, bitmap to png, bmp converter lossless, bmp to png free",
		jsonLdName: "BMP to PNG Converter",
		faq: [
			{
				question:
					"How did BMP become the default image format on early Windows?",
				answer:
					"Microsoft introduced the BMP format alongside Windows 2.0 in 1988 as part of the Graphics Device Interface (GDI). Because it stored pixels in a format the display hardware could blit directly to the screen — no decompression step needed — it became the fastest format to render on the underpowered machines of the era. Windows Paint saved BMP by default for over two decades, ensuring billions of BMP files were created worldwide.",
			},
			{
				question: "How much smaller will the PNG file be?",
				answer:
					"PNG uses lossless DEFLATE compression, so the reduction depends on the image content. Screenshots with large flat-color regions often shrink by 80-90%. Photographs with complex textures may only shrink by 30-50%. Either way, the output is always smaller than the uncompressed BMP, and no pixel data is lost.",
			},
			{
				question: "Does BMP-to-PNG preserve transparency?",
				answer:
					"32-bit BMP files with an alpha channel will have their transparency preserved in the PNG output. Most BMP files are 24-bit (no transparency), in which case the PNG is fully opaque. Either way, what you see in the original is exactly what you get in the output.",
			},
		],
	});
}

const ACCEPT = { "image/bmp": [".bmp"] };

const faqItems = [
	{
		question: "How did BMP become the default image format on early Windows?",
		answer: (
			<>
				Microsoft introduced the BMP format alongside Windows 2.0 in 1988 as
				part of the Graphics Device Interface (GDI). Because it stored pixels in
				a format the display hardware could blit directly to the screen — no
				decompression step needed — it became the fastest format to render on
				the underpowered machines of the era. Windows Paint saved BMP by default
				for over two decades, ensuring billions of BMP files were created
				worldwide. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/BMP_file_format"
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
		question: "How much smaller will the PNG file be?",
		answer:
			"PNG uses lossless DEFLATE compression, so the reduction depends on the image content. Screenshots with large flat-color regions often shrink by 80-90%. Photographs with complex textures may only shrink by 30-50%. Either way, the output is always smaller than the uncompressed BMP, and no pixel data is lost.",
	},
	{
		question: "Does BMP-to-PNG preserve transparency?",
		answer:
			"32-bit BMP files with an alpha channel will have their transparency preserved in the PNG output. Most BMP files are 24-bit (no transparency), in which case the PNG is fully opaque. Either way, what you see in the original is exactly what you get in the output.",
	},
];

export default function BmpToPngPage() {
	return (
		<ToolPageLayout
			title="Convert BMP to PNG"
			description="Convert BMP bitmap images to lossless PNG format — free, private, no upload required."
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
					Converts uncompressed Windows Bitmap files to PNG with lossless
					compression. BMP files are bloated because they store raw pixel data
					with no compression at all — PNG applies DEFLATE compression without
					discarding any detail, producing dramatically smaller files that look
					identical. The browser decodes BMP natively, so no external library is
					required. Useful for modernizing legacy BMP files from scanners, older
					Windows apps, and MS Paint exports.
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
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Canvas API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
