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
import type { Route } from "./+types/pub-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Convert Publisher PUB Online — Free, Private, No Upload | NoUploads",
		description:
			"Extract images from Microsoft Publisher PUB files and convert to JPG, PNG, or WebP in your browser. No upload needed.",
		path: "/image/pub-converter",
		keywords:
			"pub to jpg, pub to png, publisher converter online, open pub file, pub converter, microsoft publisher to image, convert pub free",
		jsonLdName: "Publisher PUB Converter",
	});
}

const ACCEPT = { "application/x-mspublisher": [".pub"] };

const faqItems = [
	{
		question: "Where does Microsoft Publisher come from?",
		answer: (
			<>
				Microsoft Publisher was first released in 1991 as an entry-level desktop
				publishing tool aimed at small businesses and home users. It filled the
				gap between basic word processors and professional page-layout software
				like QuarkXPress and Adobe PageMaker. The PUB format stores rich page
				layouts with embedded images, text frames, and design elements, though
				it has remained a Windows-only format throughout its history.{" "}
				<a
					href="https://en.wikipedia.org/wiki/Microsoft_Publisher"
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
		question: "How does this tool extract images from PUB files?",
		answer:
			"Publisher files embed images directly within their OLE2 binary structure. This tool reads the compound file using the cfb library, scans every internal stream for JPEG, PNG, or BMP signatures, and extracts the largest image found. The extracted image can then be downloaded as JPG, PNG, WebP, or AVIF. No rendering of the full page layout is attempted.",
	},
	{
		question: "What are the constraints of PUB conversion in a browser?",
		answer:
			"This tool extracts embedded raster images, not the complete page layout. Text blocks, shapes, tables, and precise positioning are not reproduced. Publisher files that contain only text and vector shapes without any embedded images cannot be converted. For full PUB editing, you need Microsoft Publisher — no other application fully supports the format.",
	},
	{
		question: "Why is it hard to open PUB files without Publisher?",
		answer:
			"Microsoft has never published a full specification for the PUB format. Unlike DOCX or XLSX, which use the open OOXML standard, PUB remains a proprietary binary format. LibreOffice offers partial PUB import, but layout fidelity varies. This tool takes a practical approach: instead of trying to render the layout, it extracts the embedded photos and graphics.",
	},
];

export default function PubConverterPage() {
	return (
		<ToolPageLayout
			title="Convert Publisher PUB"
			description="Extract embedded images from Microsoft Publisher PUB files and convert to JPG, PNG, or WebP — free, private, no upload required."
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
					Extracts embedded images from Microsoft Publisher PUB files — the
					proprietary desktop publishing format with limited cross-platform
					support. The decoder reads the OLE2 compound file structure using the
					cfb library and scans all internal streams for JPEG, PNG, and BMP
					data. Useful for recovering photos and graphics from Publisher
					documents when you do not have a Publisher license. Full page layout
					rendering is not available.
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

			<LibraryAttribution packages={["cfb"]} />
		</ToolPageLayout>
	);
}
