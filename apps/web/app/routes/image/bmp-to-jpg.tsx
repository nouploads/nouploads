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
import type { Route } from "./+types/bmp-to-jpg";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert BMP to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert BMP bitmap images to compact JPG. Dramatically reduces file size. Free, private, no upload.",
		path: "/image/bmp-to-jpg",
		keywords:
			"bmp to jpg, convert bmp to jpeg, bitmap to jpg, bmp converter online, bmp to jpg free",
		jsonLdName: "BMP to JPG Converter",
		faq: [
			{
				question: "Why are BMP files so much larger than JPG?",
				answer:
					"BMP stores every pixel as raw color data with no compression whatsoever. A 1920x1080 BMP at 24-bit color is always exactly 5.93 MB regardless of the image content. JPG uses DCT-based lossy compression that exploits how human vision works — it discards details you're unlikely to notice, often achieving 10-20x reduction.",
			},
			{
				question: "What kind of size reduction should I expect?",
				answer:
					"A typical BMP photograph will shrink by 90-95% when converted to JPG at the default quality setting. A 6 MB BMP screenshot usually becomes 200-600 KB as a JPG. The exact ratio depends on image complexity — photos compress better than screenshots with sharp text.",
			},
			{
				question: "Does BMP-to-JPG conversion lose quality?",
				answer:
					"JPG is a lossy format, so some fine detail is discarded during compression. At the default quality level (around 80-85%), the difference is invisible for photographs. If you need pixel-perfect output, convert to PNG instead — the file will be larger but lossless.",
			},
		],
	});
}

const ACCEPT = { "image/bmp": [".bmp"] };

const faqItems = [
	{
		question: "Why are BMP files so much larger than JPG?",
		answer: (
			<>
				BMP stores every pixel as raw color data with no compression whatsoever.
				A 1920x1080 BMP at 24-bit color is always exactly 5.93 MB regardless of
				the image content. JPG uses DCT-based lossy compression that exploits
				how human vision works — it discards details you're unlikely to notice,
				often achieving 10–20x reduction. Source:{" "}
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
		question: "What kind of size reduction should I expect?",
		answer:
			"A typical BMP photograph will shrink by 90-95% when converted to JPG at the default quality setting. A 6 MB BMP screenshot usually becomes 200-600 KB as a JPG. The exact ratio depends on image complexity — photos compress better than screenshots with sharp text.",
	},
	{
		question: "Does BMP-to-JPG conversion lose quality?",
		answer: (
			<>
				JPG is a lossy format, so some fine detail is discarded during
				compression. At the default quality level (around 80–85%), the
				difference is invisible for photographs. If you need pixel-perfect
				output, use our{" "}
				<a
					href="/image/bmp-to-png"
					className="underline hover:text-foreground transition-colors"
				>
					BMP to PNG converter
				</a>{" "}
				instead — the file will be larger but lossless.
			</>
		),
	},
];

export default function BmpToJpgPage() {
	return (
		<ToolPageLayout
			title="Convert BMP to JPG"
			description="Convert BMP bitmap images to compact JPG format — free, private, no upload required."
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
					BMP (Windows Bitmap) files are uncompressed raster images that consume
					massive disk space — a single screenshot can easily exceed 5 MB. This
					tool re-encodes them as JPG with adjustable quality, typically
					shrinking files by 90% or more. The browser's native BMP decoder
					handles the input, so no external library is needed. Useful for
					converting legacy BMP files from older Windows applications, scanners,
					or Paint exports into a format suitable for email and web use.
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
