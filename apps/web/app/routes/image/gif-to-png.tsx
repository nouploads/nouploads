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
import type { Route } from "./+types/gif-to-png";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "GIF to PNG — Free, Instant, No Upload | NoUploads",
		description:
			"Convert GIF to lossless PNG with transparency preserved in your browser. Browse animated GIF frames and select the exact one to export. No upload, no signup.",
		path: "/image/gif-to-png",
		keywords:
			"gif to png, convert gif to png, gif transparency, gif frame to png, gif converter lossless",
		jsonLdName: "GIF to PNG Converter",
		faq: [
			{
				question: "How did a patent dispute reshape GIF's place on the web?",
				answer:
					"In 1994, Unisys began enforcing its patent on the LZW compression algorithm used inside every GIF file. The backlash from the web community led directly to the creation of PNG as a patent-free alternative. Ironically, GIF outlived the patent (which expired in 2004) because no other format matched its animation support until decades later.",
			},
			{
				question:
					"How does GIF-to-PNG handle animated GIFs differently from static ones?",
				answer:
					"Animated GIFs are decoded frame by frame into a visual filmstrip. You can scroll through and click any frame to select it — that frame is then exported as a lossless PNG with transparency intact. Static single-frame GIFs skip the picker and convert directly.",
			},
			{
				question: "Why choose PNG over JPG when converting from GIF?",
				answer:
					"PNG preserves GIF's transparency — transparent pixels stay transparent instead of being filled with white. PNG also uses lossless compression, so flat-color graphics and pixel art stay crisp without the blocky artifacts that JPG introduces. The tradeoff is a larger file size, but for graphics and screenshots it's usually the better choice.",
			},
		],
	});
}

const ACCEPT = { "image/gif": [".gif"] };

const faqItems = [
	{
		question: "How did a patent dispute reshape GIF's place on the web?",
		answer: (
			<>
				In 1994, Unisys began enforcing its patent on the LZW compression
				algorithm used inside every GIF file. The backlash from the web
				community led directly to the creation of PNG as a patent-free
				alternative. Ironically, GIF outlived the patent (which expired in 2004)
				because no other format matched its animation support until decades
				later. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/GIF#Unisys_and_LZW_patent_enforcement"
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
		question:
			"How does GIF-to-PNG handle animated GIFs differently from static ones?",
		answer:
			"Animated GIFs are decoded frame by frame into a visual filmstrip. You can scroll through and click any frame to select it — that frame is then exported as a lossless PNG with transparency intact. Static single-frame GIFs skip the picker and convert directly.",
	},
	{
		question: "Why choose PNG over JPG when converting from GIF?",
		answer: (
			<>
				PNG preserves GIF's transparency — transparent pixels stay transparent
				instead of being filled with white. PNG also uses lossless compression,
				so flat-color graphics and pixel art stay crisp without the blocky
				artifacts that JPG introduces. The tradeoff is a larger file size, but
				for graphics and screenshots it's usually the better choice.
			</>
		),
	},
];

export default function GifToPngPage() {
	return (
		<ToolPageLayout
			title="Convert GIF to PNG"
			description="Convert GIF images to lossless PNG format with transparency — free, private, no upload required."
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
					This converter decodes GIF files — including animated GIFs — using
					gifuct-js and exports individual frames as lossless PNG images.
					Transparency is preserved, so icons, logos, and pixel art keep their
					clean edges without the white-fill artifacts that JPG conversion
					introduces. For animated GIFs, a visual filmstrip lets you pick the
					exact frame you want before exporting. Useful for extracting
					transparent stickers from reaction GIFs or archiving frames in a
					lossless format.
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

			<LibraryAttribution packages={["gifuct-js"]} />
		</ToolPageLayout>
	);
}
