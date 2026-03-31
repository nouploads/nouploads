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
import type { Route } from "./+types/bmp-to-webp";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert BMP to WebP Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert BMP bitmap images to WebP. Modern compression with transparency support. Free, private, no upload.",
		path: "/image/bmp-to-webp",
		keywords:
			"bmp to webp, convert bmp to webp, bitmap to webp, bmp converter webp, bmp to webp free",
		jsonLdName: "BMP to WebP Converter",
		faq: [
			{
				question:
					"Why did Microsoft eventually replace BMP as the default format in Paint?",
				answer:
					"In 2017, Microsoft updated Paint in Windows 10 to save as PNG by default instead of BMP. After nearly 30 years, the uncompressed format was too wasteful for modern displays — a single 4K screenshot as BMP weighs over 24 MB. PNG and WebP achieve 80-95% compression without visible quality loss, making BMP's raw pixel storage an artifact of an era when CPU cycles were too expensive for on-the-fly decompression.",
			},
			{
				question: "How much smaller will the WebP be compared to BMP?",
				answer:
					"Dramatically smaller — typically 95-99% reduction. A 6 MB BMP photograph becomes roughly 100-300 KB as WebP. Even screenshots with sharp text and flat colors shrink by 90%+. WebP achieves this through both lossy (VP8) and lossless compression modes, both far more efficient than BMP's zero compression.",
			},
			{
				question: "Does BMP-to-WebP preserve transparency?",
				answer:
					"Yes. 32-bit BMP files with an alpha channel will have their transparency preserved in the WebP output. Most BMP files are 24-bit (opaque), but if yours has transparency, WebP supports full per-pixel alpha — unlike JPG, which would flatten it to white.",
			},
		],
	});
}

const ACCEPT = { "image/bmp": [".bmp"] };

const faqItems = [
	{
		question:
			"Why did Microsoft eventually replace BMP as the default format in Paint?",
		answer: (
			<>
				In 2017, Microsoft updated Paint in Windows 10 to save as PNG by default
				instead of BMP. After nearly 30 years, the uncompressed format was too
				wasteful for modern displays — a single 4K screenshot as BMP weighs over
				24 MB. PNG and WebP achieve 80–95% compression without visible quality
				loss, making BMP's raw pixel storage an artifact of an era when CPU
				cycles were too expensive for on-the-fly decompression. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Microsoft_Paint"
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
		question: "How much smaller will the WebP be compared to BMP?",
		answer:
			"Dramatically smaller — typically 95-99% reduction. A 6 MB BMP photograph becomes roughly 100-300 KB as WebP. Even screenshots with sharp text and flat colors shrink by 90%+. WebP achieves this through both lossy (VP8) and lossless compression modes, both far more efficient than BMP's zero compression.",
	},
	{
		question: "Does BMP-to-WebP preserve transparency?",
		answer:
			"Yes. 32-bit BMP files with an alpha channel will have their transparency preserved in the WebP output. Most BMP files are 24-bit (opaque), but if yours has transparency, WebP supports full per-pixel alpha — unlike JPG, which would flatten it to white.",
	},
];

export default function BmpToWebpPage() {
	return (
		<ToolPageLayout
			title="Convert BMP to WebP"
			description="Convert BMP bitmap images to modern WebP format — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageConverterTool defaultOutputFormat="image/webp" accept={ACCEPT} />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					Converts uncompressed Windows Bitmap files to Google's WebP format,
					achieving the most dramatic file size reduction of any BMP conversion
					option. WebP's VP8-based lossy compression typically shrinks a BMP by
					95–99% while preserving visual quality, and its lossless mode still
					beats PNG on compression ratio. The quality slider lets you choose
					your tradeoff. Useful for modernizing legacy BMP files from scanners,
					MS Paint exports, or older Windows applications into a web-ready
					format.
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
