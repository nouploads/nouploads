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
import type { Route } from "./+types/tiff-to-jpg";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert TIFF to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert TIFF images to compact JPG format entirely in your browser. No upload, no signup, no limits.",
		path: "/image/tiff-to-jpg",
		keywords:
			"tiff to jpg, tiff to jpeg, convert tiff to jpg, tif to jpg online, tiff converter, tiff to jpg free",
		jsonLdName: "TIFF to JPG Converter",
		faq: [
			{
				question: "Where does the TIFF format come from?",
				answer:
					"TIFF (Tagged Image File Format) was created by Aldus Corporation in 1986 for use in desktop publishing — the emerging ability to design printed materials on personal computers. It was designed to be a universal image format flexible enough to store everything from 1-bit fax images to 32-bit floating-point HDR data. The publishing and printing industries still rely heavily on TIFF because it supports CMYK color spaces and lossless compression.",
			},
			{
				question: "Will converting to JPG reduce quality?",
				answer:
					"JPG uses lossy compression, so there is a small quality reduction. At the default 92% quality setting, the difference is virtually invisible for photographs. The upside is dramatically smaller files — a 30MB TIFF might become a 2MB JPG.",
			},
			{
				question: "Does this handle CMYK and multi-page TIFFs?",
				answer:
					"Yes. CMYK color data is automatically converted to RGB during decoding. Multi-page TIFFs are supported — the first page is converted by default. Common TIFF compressions (LZW, ZIP, JPEG) are all handled.",
			},
		],
	});
}

const ACCEPT = { "image/tiff": [".tiff", ".tif"] };

const faqItems = [
	{
		question: "Where does the TIFF format come from?",
		answer: (
			<>
				TIFF (Tagged Image File Format) was created by Aldus Corporation in 1986
				for use in desktop publishing — the emerging ability to design printed
				materials on personal computers. It was designed to be a universal image
				format flexible enough to store everything from 1-bit fax images to
				32-bit floating-point HDR data. The publishing and printing industries
				still rely heavily on TIFF because it supports CMYK color spaces and
				lossless compression.{" "}
				<a
					href="https://en.wikipedia.org/wiki/TIFF"
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
		question: "Will converting to JPG reduce quality?",
		answer:
			"JPG uses lossy compression, so there is a small quality reduction. At the default 92% quality setting, the difference is virtually invisible for photographs. The upside is dramatically smaller files — a 30MB TIFF might become a 2MB JPG.",
	},
	{
		question: "Does this handle CMYK and multi-page TIFFs?",
		answer:
			"Yes. CMYK color data is automatically converted to RGB during decoding. Multi-page TIFFs are supported — the first page is converted by default. Common TIFF compressions (LZW, ZIP, JPEG) are all handled.",
	},
];

export default function TiffToJpgPage() {
	return (
		<ToolPageLayout
			title="Convert TIFF to JPG"
			description="Convert TIFF images to compact, universally compatible JPG format — free, private, no upload required."
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
					TIFF is the workhorse format of print production, medical imaging, and
					archival scanning — but most web tools and email clients refuse to
					open it. This tool uses the utif2 library to decode all common TIFF
					compression schemes (LZW, ZIP, old-style JPEG, uncompressed) and
					automatically converts CMYK color data to RGB and 16-bit channels to
					8-bit before encoding a standard JPEG. A 30 MB print proof becomes a 2
					MB JPG you can drop into an email or a Slack thread in seconds.
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

			<LibraryAttribution packages={["utif2"]} />
		</ToolPageLayout>
	);
}
