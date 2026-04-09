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
import type { Route } from "./+types/ico-to-webp";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "ICO to WebP — Free, Instant, No Upload | NoUploads",
		description:
			"Convert ICO favicon files to WebP with transparency preserved in your browser. Produces smaller output than PNG with full alpha support. No upload, no signup.",
		path: "/image/ico-to-webp",
		keywords:
			"ico to webp, convert ico to webp, favicon to webp, icon converter webp, ico to webp online",
		jsonLdName: "ICO to WebP Converter",
		faq: [
			{
				question:
					"Why do ICO files contain multiple images instead of just one?",
				answer:
					"The ICO format was designed for Windows, which needed different icon sizes for different contexts — 16x16 for taskbar buttons, 32x32 for desktop shortcuts, 48x48 for folder views, and 256x256 for high-DPI displays. Rather than manage separate files, Microsoft packed all sizes into a single container. Each directory entry stores its own width, height, color depth, and pixel data.",
			},
			{
				question: "Does ICO-to-WebP keep the transparent background?",
				answer:
					"Yes. WebP supports full alpha-channel transparency, so transparent favicon backgrounds are preserved exactly as they appear in the original ICO. This is one advantage over converting to JPG, which flattens transparency to white.",
			},
			{
				question: "Why choose WebP over PNG when extracting icons?",
				answer:
					"WebP produces significantly smaller files than PNG while preserving the same lossless quality and transparency. For web use, this means faster load times. The only downside is that very old browsers don't support WebP, but all modern browsers have supported it since at least 2020.",
			},
		],
	});
}

const ACCEPT = { "image/x-icon": [".ico", ".cur"] };

const faqItems = [
	{
		question: "Why do ICO files contain multiple images instead of just one?",
		answer: (
			<>
				The ICO format was designed for Windows, which needed different icon
				sizes for different contexts — 16x16 for taskbar buttons, 32x32 for
				desktop shortcuts, 48x48 for folder views, and 256x256 for high-DPI
				displays. Rather than manage separate files, Microsoft packed all sizes
				into a single container. Each directory entry stores its own width,
				height, color depth, and pixel data. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/ICO_(file_format)"
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
		question: "Does ICO-to-WebP keep the transparent background?",
		answer:
			"Yes. WebP supports full alpha-channel transparency, so transparent favicon backgrounds are preserved exactly as they appear in the original ICO. This is one advantage over converting to JPG, which flattens transparency to white.",
	},
	{
		question: "Why choose WebP over PNG when extracting icons?",
		answer:
			"WebP produces significantly smaller files than PNG while preserving the same lossless quality and transparency. For web use, this means faster load times. The only downside is that very old browsers don't support WebP, but all modern browsers have supported it since at least 2020.",
	},
];

export default function IcoToWebpPage() {
	return (
		<ToolPageLayout
			title="Convert ICO to WebP"
			description="Extract the highest-resolution image from ICO favicon files as WebP — free, private, no upload required."
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
					Extracts the highest-resolution frame from ICO and CUR files and
					encodes it as WebP with adjustable quality. WebP offers substantially
					better compression than PNG while fully supporting transparency —
					ideal for web assets where file size matters. The decode-ico library
					parses the multi-frame container and this tool picks the largest
					embedded image. All processing happens locally in your browser.
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

			<LibraryAttribution packages={["decode-ico"]} />
		</ToolPageLayout>
	);
}
