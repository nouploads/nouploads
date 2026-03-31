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
import type { Route } from "./+types/jxl-to-png";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert JXL to PNG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert JPEG XL images to lossless PNG with transparency preserved. No upload needed.",
		path: "/image/jxl-to-png",
		keywords:
			"jxl to png, jpeg xl to png, convert jxl to png online, jxl to png converter, jxl transparent png",
		jsonLdName: "JXL to PNG Converter",
		faq: [
			{
				question: "What makes JPEG XL different from older image formats?",
				answer:
					"Unlike JPEG's fixed 8x8 block Discrete Cosine Transform, JPEG XL uses variable-size DCT blocks (up to 256x256) combined with an advanced prediction scheme. It supports both lossy and lossless compression, HDR with up to 32-bit floating-point precision, wide color gamuts, and animation — effectively unifying the capabilities of JPEG, PNG, GIF, and HDR formats into a single file type.",
			},
			{
				question: "Why convert JXL to PNG instead of JPG?",
				answer:
					"PNG preserves every pixel losslessly and supports transparency. Choose PNG when your JXL contains graphics with sharp edges, text, logos, or alpha transparency. JPG is better when you want the smallest file size for photographs.",
			},
			{
				question: "Does transparency carry over from JXL to PNG?",
				answer:
					"Yes. JPEG XL supports full alpha transparency, and PNG does too. If your JXL has transparent regions, they are preserved in the PNG output without being flattened to a solid background.",
			},
			{
				question: "How large will the PNG output be?",
				answer:
					"PNG files are typically larger than both JXL and JPG because PNG uses lossless compression. A 500KB lossless JXL might become a 2-3MB PNG. The tradeoff is zero quality loss and universal compatibility.",
			},
		],
	});
}

const ACCEPT = { "image/jxl": [".jxl"] };

const faqItems = [
	{
		question: "What makes JPEG XL different from older image formats?",
		answer: (
			<>
				Unlike JPEG's fixed 8x8 block Discrete Cosine Transform, JPEG XL uses
				variable-size DCT blocks (up to 256x256) combined with an advanced
				prediction scheme. It supports both lossy and lossless compression, HDR
				with up to 32-bit floating-point precision, wide color gamuts, and
				animation — effectively unifying the capabilities of JPEG, PNG, GIF, and
				HDR formats into a single file type. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/JPEG_XL"
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
		question: "Why convert JXL to PNG instead of JPG?",
		answer:
			"PNG preserves every pixel losslessly and supports transparency. Choose PNG when your JXL contains graphics with sharp edges, text, logos, or alpha transparency. JPG is better when you want the smallest file size for photographs.",
	},
	{
		question: "Does transparency carry over from JXL to PNG?",
		answer:
			"Yes. JPEG XL supports full alpha transparency, and PNG does too. If your JXL has transparent regions, they are preserved in the PNG output without being flattened to a solid background.",
	},
	{
		question: "How large will the PNG output be?",
		answer:
			"PNG files are typically larger than both JXL and JPG because PNG uses lossless compression. A 500KB lossless JXL might become a 2-3MB PNG. The tradeoff is zero quality loss and universal compatibility.",
	},
];

export default function JxlToPngPage() {
	return (
		<ToolPageLayout
			title="Convert JXL to PNG"
			description="Convert JPEG XL images to lossless PNG with full transparency support — free, private, no upload required."
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
					Converts JPEG XL files to lossless PNG format while preserving
					transparency and full color depth. Uses native browser decoding on
					Firefox 125+ and a WebAssembly fallback (jxl-oxide) for other
					browsers. Ideal for extracting high-fidelity graphics or screenshots
					from JXL files when you need a format that every image editor and web
					platform can handle.
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

			<LibraryAttribution packages={["jxl-oxide-wasm"]} />
		</ToolPageLayout>
	);
}
