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
import type { Route } from "./+types/xps-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert XPS Online — Free, Instant | NoUploads",
		description:
			"Convert XPS and OXPS document files to JPG, PNG, or WebP in your browser. Extracts embedded images from Microsoft XML Paper documents. No upload, no signup.",
		path: "/image/xps-converter",
		keywords:
			"xps to jpg, xps to png, xps converter online, open xps file, oxps converter, microsoft xps viewer",
		jsonLdName: "XPS Converter",
		faq: [
			{
				question: "Why did Microsoft create XPS as an alternative to PDF?",
				answer:
					"XPS (XML Paper Specification) was Microsoft's answer to Adobe's PDF, released alongside Windows Vista in 2006. It uses a ZIP-based package of XML files and embedded resources, making its internal structure easy to inspect with any archive tool. Despite becoming an Ecma International standard (ECMA-388), XPS never achieved widespread adoption outside the Windows ecosystem.",
			},
			{
				question: "How does this tool convert XPS files without a server?",
				answer:
					"XPS files are ZIP archives under the hood. This tool opens the archive in your browser using JSZip, scans for embedded raster images (PNG, JPG, TIFF), and extracts the largest one. The extracted image is then available for download as JPG, PNG, WebP, or AVIF. All processing happens locally on your device — the file never leaves your browser.",
			},
			{
				question: "What should I know before converting XPS files?",
				answer:
					"This tool extracts embedded raster images, not the full page layout. Text, vector graphics, and page positioning are not rendered — that would require a complete XAML rendering engine. XPS files that contain only vector content or text without any embedded images cannot be converted. For full XPS rendering, use the built-in XPS Viewer on Windows or a desktop application like Okular.",
			},
		],
	});
}

const ACCEPT = {
	"application/vnd.ms-xpsdocument": [".xps"],
	"application/oxps": [".oxps"],
};

const faqItems = [
	{
		question: "Why did Microsoft create XPS as an alternative to PDF?",
		answer: (
			<>
				XPS (XML Paper Specification) was Microsoft's answer to Adobe's PDF,
				released alongside Windows Vista in 2006. It uses a ZIP-based package of
				XML files and embedded resources, making its internal structure easy to
				inspect with any archive tool. Despite becoming an Ecma International
				standard (ECMA-388), XPS never achieved widespread adoption outside the
				Windows ecosystem. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Open_XML_Paper_Specification"
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
		question: "How does this tool convert XPS files without a server?",
		answer:
			"XPS files are ZIP archives under the hood. This tool opens the archive in your browser using JSZip, scans for embedded raster images (PNG, JPG, TIFF), and extracts the largest one. The extracted image is then available for download as JPG, PNG, WebP, or AVIF. All processing happens locally on your device — the file never leaves your browser.",
	},
	{
		question: "What should I know before converting XPS files?",
		answer:
			"This tool extracts embedded raster images, not the full page layout. Text, vector graphics, and page positioning are not rendered — that would require a complete XAML rendering engine. XPS files that contain only vector content or text without any embedded images cannot be converted. For full XPS rendering, use the built-in XPS Viewer on Windows or a desktop application like Okular.",
	},
];

export default function XpsConverterPage() {
	return (
		<ToolPageLayout
			title="Convert XPS"
			description="Extract embedded images from XPS and OXPS documents and convert to JPG, PNG, or WebP — free, private, no upload required."
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
					Extracts embedded images from XPS and OXPS documents — Microsoft's
					fixed-layout document format. The decoder opens the ZIP archive,
					locates all raster images stored in the document's resource
					directories, and extracts the largest one for conversion to JPG, PNG,
					WebP, or AVIF. Useful for pulling images out of XPS print files
					without installing Windows XPS Viewer or other desktop software. Full
					page layout rendering is not available — only embedded raster images
					are extracted. All processing runs in your browser using JSZip.
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

			<LibraryAttribution packages={["jszip"]} />
		</ToolPageLayout>
	);
}
