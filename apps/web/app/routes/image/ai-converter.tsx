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
import type { Route } from "./+types/ai-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert AI Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert Adobe Illustrator AI files to JPG, PNG, or WebP in your browser. No upload, no server, no signup.",
		path: "/image/ai-converter",
		keywords:
			"ai to jpg, ai to png, adobe illustrator converter, open ai file online, ai file viewer",
		jsonLdName: "AI Converter",
		faq: [
			{
				question: "What's the story behind Adobe Illustrator's file format?",
				answer:
					"Adobe Illustrator was first developed for the Apple Macintosh in 1987 and was one of the earliest applications to use Adobe's PostScript language for on-screen rendering. Since Illustrator CS, the AI file format is essentially a restricted form of PDF — which is why many tools can extract preview images from AI files. There is literally a PDF hidden inside every modern AI file.",
			},
			{
				question: "How does this tool convert AI files?",
				answer:
					"Modern AI files (Illustrator 9 and later) start with a %PDF header, making them valid PDF documents. This tool detects the PDF structure and renders the first page using Mozilla's PDF.js library at 2x resolution for sharp output. The result can be saved as JPG, PNG, WebP, or AVIF. For older AI files that use PostScript instead of PDF, the tool falls back to extracting the embedded preview image.",
			},
			{
				question: "What about legacy AI files from before Illustrator 9?",
				answer:
					"AI files created before Illustrator 9 (pre-2000) use a PostScript-based format instead of PDF. These files cannot be fully rendered in a browser, but most contain an embedded low-resolution preview image. This tool detects the PostScript header and falls back to extracting that preview. The output quality depends on what the original application embedded — it may be lower resolution than the vector artwork.",
			},
			{
				question: "Does this tool handle multi-artboard AI files?",
				answer:
					"The tool renders the first page of the PDF structure within the AI file, which corresponds to the primary artboard. Multi-artboard AI files store each artboard as a separate PDF page. Currently, only the first artboard is converted. For full multi-artboard export, desktop software like Illustrator or Inkscape offers more control.",
			},
		],
	});
}

const ACCEPT = { "application/illustrator": [".ai"] };

const faqItems = [
	{
		question: "What's the story behind Adobe Illustrator's file format?",
		answer: (
			<>
				Adobe Illustrator was first developed for the Apple Macintosh in 1987
				and was one of the earliest applications to use Adobe's PostScript
				language for on-screen rendering. Since Illustrator CS, the AI file
				format is essentially a restricted form of PDF — which is why many tools
				can extract preview images from AI files. There is literally a PDF
				hidden inside every modern AI file. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Adobe_Illustrator"
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
		question: "How does this tool convert AI files?",
		answer:
			"Modern AI files (Illustrator 9 and later) start with a %PDF header, making them valid PDF documents. This tool detects the PDF structure and renders the first page using Mozilla's PDF.js library at 2x resolution for sharp output. The result can be saved as JPG, PNG, WebP, or AVIF. For older AI files that use PostScript instead of PDF, the tool falls back to extracting the embedded preview image.",
	},
	{
		question: "What about legacy AI files from before Illustrator 9?",
		answer:
			"AI files created before Illustrator 9 (pre-2000) use a PostScript-based format instead of PDF. These files cannot be fully rendered in a browser, but most contain an embedded low-resolution preview image. This tool detects the PostScript header and falls back to extracting that preview. The output quality depends on what the original application embedded — it may be lower resolution than the vector artwork.",
	},
	{
		question: "Does this tool handle multi-artboard AI files?",
		answer:
			"The tool renders the first page of the PDF structure within the AI file, which corresponds to the primary artboard. Multi-artboard AI files store each artboard as a separate PDF page. Currently, only the first artboard is converted. For full multi-artboard export, desktop software like Illustrator or Inkscape offers more control.",
	},
];

export default function AiConverterPage() {
	return (
		<ToolPageLayout
			title="Convert AI"
			description="Convert Adobe Illustrator files to JPG, PNG, WebP, or AVIF — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageConverterTool accept={ACCEPT} />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					Renders Adobe Illustrator files using the PDF.js library. Modern AI
					files (Illustrator 9+) are PDF-based and render with full fidelity at
					2x resolution for sharp output. Legacy AI files that use PostScript
					fall back to embedded preview extraction via the EPS decoder. Useful
					for designers and developers who need to quickly preview or export AI
					artwork without installing Illustrator. All processing happens locally
					in your browser.
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

			<LibraryAttribution packages={["pdfjs-dist"]} />
		</ToolPageLayout>
	);
}
