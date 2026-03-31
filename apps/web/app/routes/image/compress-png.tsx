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
import type { Route } from "./+types/compress-png";

const CompressPngTool = lazy(
	() => import("~/features/image-tools/components/compress-png-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Compress PNG Online — Free, Private, No Upload | NoUploads",
		description:
			"Compress PNG images online for free with color quantization. No upload, no signup — files never leave your device.",
		path: "/image/compress-png",
		keywords:
			"compress png, reduce png size, png compressor online, png optimization, free png compressor, private png compressor, png color quantization",
		jsonLdName: "PNG Image Compressor",
	});
}

const faqItems = [
	{
		question: "How does PNG achieve lossless compression under the hood?",
		answer: (
			<>
				PNG uses the DEFLATE algorithm — a combination of LZ77 pattern matching
				and Huffman coding — preceded by a prediction filter that guesses each
				pixel's value from its neighbors. The filter stage doesn't compress
				anything itself; it rearranges the data so DEFLATE can find more
				redundant patterns. This two-step approach typically achieves 30–50%
				compression without altering a single pixel value.{" "}
				<a
					href="https://en.wikipedia.org/wiki/PNG#Compression"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Source: Wikipedia
				</a>
			</>
		),
	},
	{
		question: "How does PNG compression work?",
		answer:
			"PNG is normally lossless, so traditional quality sliders don't apply. This tool uses color quantization — reducing the number of unique colors in the image (e.g., from millions to 256). Fewer colors means a dramatically smaller file while preserving transparency.",
	},
	{
		question: "What does the Colors slider do?",
		answer:
			"The slider controls how many unique colors the output PNG will contain, from 2 to 256. Fewer colors produce smaller files. For most images, 128–256 colors looks nearly identical to the original. For simple graphics, even 16–32 colors can look great.",
	},
	{
		question: "Does this preserve transparency?",
		answer:
			"Yes. Alpha transparency is fully preserved during color quantization. Your transparent PNGs will remain transparent.",
	},
];

export default function CompressPngPage() {
	return (
		<ToolPageLayout
			title="Compress PNG"
			description="Compress PNG images online — reduce file size with adjustable color quantization, free and private."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<CompressPngTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					NoUploads PNG Compressor shrinks PNG files by intelligently reducing
					the number of colors in the image. Use the Colors slider to find the
					balance between file size and visual quality — transparency is always
					preserved. Everything runs locally in your browser, so your
					screenshots and graphics are never uploaded to any server.
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

			<LibraryAttribution packages={["image-q"]} />
		</ToolPageLayout>
	);
}
