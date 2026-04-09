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
import type { Route } from "./+types/jxl-to-jpg";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "JXL to JPG — Free, Instant, No Upload | NoUploads",
		description:
			"Convert JPEG XL images to widely compatible JPG in your browser. Solves limited JXL support across most apps, browsers, and OS versions. No upload, no signup.",
		path: "/image/jxl-to-jpg",
		keywords:
			"jxl to jpg, jpeg xl to jpg, convert jxl to jpg, open jxl file, jxl converter online, jpeg xl converter",
		jsonLdName: "JXL to JPG Converter",
		faq: [
			{
				question: "Where does JPEG XL come from?",
				answer:
					"JPEG XL was standardized as ISO/IEC 18181 in 2022 and is designed to eventually replace both JPEG and PNG. It can losslessly recompress existing JPEG files to roughly 20% smaller without any generational quality loss, supports progressive decoding, animation, and HDR content. The format emerged from merging Google's PIK and Cloudinary's FUIF proposals into a single next-generation codec.",
			},
			{
				question: "Why can't I open JXL files?",
				answer:
					"Browser and OS support for JPEG XL is still growing. Firefox supports it since version 125. Chrome removed native support but may re-add it. Most image viewers and social media platforms don't accept JXL yet. Converting to JPG gives you maximum compatibility right now.",
			},
			{
				question: "Will I lose quality converting JXL to JPG?",
				answer:
					"If the JXL was encoded with lossy compression, converting to JPG at 92% quality preserves nearly all visible detail. If the JXL was losslessly encoded, you're going from lossless to lossy — there will be some quality reduction, but at high quality settings the difference is imperceptible for photographs.",
			},
			{
				question: "Does this handle animated JXL files?",
				answer:
					"Yes. If an animated JXL is detected, the first frame is converted to a static JPG image. Animation support for frame-by-frame extraction will be available in a future update.",
			},
		],
	});
}

const ACCEPT = { "image/jxl": [".jxl"] };

const faqItems = [
	{
		question: "Where does JPEG XL come from?",
		answer: (
			<>
				JPEG XL was standardized as ISO/IEC 18181 in 2022 and is designed to
				eventually replace both JPEG and PNG. It can losslessly recompress
				existing JPEG files to roughly 20% smaller without any generational
				quality loss, supports progressive decoding, animation, and HDR content.
				The format emerged from merging Google's PIK and Cloudinary's FUIF
				proposals into a single next-generation codec. Source:{" "}
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
		question: "Why can't I open JXL files?",
		answer:
			"Browser and OS support for JPEG XL is still growing. Firefox supports it since version 125. Chrome removed native support but may re-add it. Most image viewers and social media platforms don't accept JXL yet. Converting to JPG gives you maximum compatibility right now.",
	},
	{
		question: "Will I lose quality converting JXL to JPG?",
		answer:
			"If the JXL was encoded with lossy compression, converting to JPG at 92% quality preserves nearly all visible detail. If the JXL was losslessly encoded, you're going from lossless to lossy — there will be some quality reduction, but at high quality settings the difference is imperceptible for photographs.",
	},
	{
		question: "Does this handle animated JXL files?",
		answer:
			"Yes. If an animated JXL is detected, the first frame is converted to a static JPG image. Animation support for frame-by-frame extraction will be available in a future update.",
	},
];

export default function JxlToJpgPage() {
	return (
		<ToolPageLayout
			title="Convert JXL to JPG"
			description="Convert JPEG XL images to universally compatible JPG format — free, private, no upload required."
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
					Decodes JPEG XL files using browser-native support where available
					(Firefox 125+) and falls back to a WebAssembly decoder for other
					browsers. Converts the decoded image to standard JPG with adjustable
					quality. Handles lossy and lossless JXL, transparency, and HDR content
					with automatic tone-mapping. The WASM module is only downloaded when
					you actually select a JXL file.
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
