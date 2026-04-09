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
import type { Route } from "./+types/jp2-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert JPEG 2000 Online — Free, Instant | NoUploads",
		description:
			"Convert JPEG 2000 (JP2, J2K) files to JPG, PNG, or WebP in your browser. Uses wavelet compression for cinema and satellite imagery. No upload, no signup.",
		path: "/image/jp2-converter",
		keywords:
			"jp2 to jpg, jpeg 2000 converter, j2k converter, open jp2 file online, jp2 to png, convert jpeg 2000",
		jsonLdName: "JP2 Converter",
		faq: [
			{
				question: "Why did JPEG 2000 never replace JPEG on the web?",
				answer:
					"JPEG 2000 was created by the Joint Photographic Experts Group in 2000 as a wavelet-based successor to the original JPEG. While it never replaced JPEG on the web, it found critical niches: the Digital Cinema Initiative (DCI) standard requires JPEG 2000 for movie distribution, medical imaging systems use it via DICOM, and satellite and aerial photography rely on its superior quality at low bitrates.",
			},
			{
				question: "Why can't I open JP2 files in most programs?",
				answer:
					"Browser and OS support for JPEG 2000 is limited. Safari was the only major browser that supported it natively (removed in recent versions). Chrome, Firefox, and Edge never shipped JPEG 2000 decoding. Windows Photo Viewer, macOS Preview, and most image editors either lack support or require a plugin. This tool decodes JP2 files using the OpenJPEG library compiled to WebAssembly, so it works in any modern browser without installing anything.",
			},
			{
				question: "What is the difference between JP2 and J2K files?",
				answer:
					"A .jp2 file wraps the compressed image data inside a box-based container (similar to how MP4 wraps video). The container holds metadata like color space, resolution, and intellectual property rights. A .j2k (or .jpc) file contains only the raw JPEG 2000 codestream with no container. Both encode pixels identically \u2014 the difference is packaging. This tool handles both formats transparently.",
			},
			{
				question: "Where is JPEG 2000 actually used?",
				answer:
					"JPEG 2000 is widely used in industries that need high-fidelity image preservation. Digital cinema (DCI) packages store frames as J2K codestreams inside MXF containers. Satellite and geospatial imaging agencies like NASA and ESA distribute imagery in JP2. Medical imaging uses JPEG 2000 as a compression option inside DICOM files. National archives and libraries \u2014 including the Library of Congress and the British Library \u2014 adopt JP2 for long-term digital preservation because it supports lossless compression and metadata embedding.",
			},
		],
	});
}

const ACCEPT = { "image/jp2": [".jp2", ".j2k", ".jpf", ".jpx"] };

const faqItems = [
	{
		question: "Why did JPEG 2000 never replace JPEG on the web?",
		answer: (
			<>
				JPEG 2000 was created by the Joint Photographic Experts Group in 2000 as
				a wavelet-based successor to the original JPEG. While it never replaced
				JPEG on the web, it found critical niches: the Digital Cinema Initiative
				(DCI) standard requires JPEG 2000 for movie distribution, medical
				imaging systems use it via DICOM, and satellite and aerial photography
				rely on its superior quality at low bitrates. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/JPEG_2000"
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
		question: "Why can't I open JP2 files in most programs?",
		answer:
			"Browser and OS support for JPEG 2000 is limited. Safari was the only major browser that supported it natively (removed in recent versions). Chrome, Firefox, and Edge never shipped JPEG 2000 decoding. Windows Photo Viewer, macOS Preview, and most image editors either lack support or require a plugin. This tool decodes JP2 files using the OpenJPEG library compiled to WebAssembly, so it works in any modern browser without installing anything.",
	},
	{
		question: "What is the difference between JP2 and J2K files?",
		answer:
			"A .jp2 file wraps the compressed image data inside a box-based container (similar to how MP4 wraps video). The container holds metadata like color space, resolution, and intellectual property rights. A .j2k (or .jpc) file contains only the raw JPEG 2000 codestream with no container. Both encode pixels identically — the difference is packaging. This tool handles both formats transparently.",
	},
	{
		question: "Where is JPEG 2000 actually used?",
		answer:
			"JPEG 2000 is widely used in industries that need high-fidelity image preservation. Digital cinema (DCI) packages store frames as J2K codestreams inside MXF containers. Satellite and geospatial imaging agencies like NASA and ESA distribute imagery in JP2. Medical imaging uses JPEG 2000 as a compression option inside DICOM files. National archives and libraries — including the Library of Congress and the British Library — adopt JP2 for long-term digital preservation because it supports lossless compression and metadata embedding.",
	},
];

export default function Jp2ConverterPage() {
	return (
		<ToolPageLayout
			title="Convert JP2"
			description="Convert JPEG 2000 images to JPG, PNG, WebP, or AVIF — free, private, no upload required."
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
					Decodes JPEG 2000 image files (.jp2, .j2k, .jpf, .jpx) used in digital
					cinema, satellite imagery, medical imaging, and archival preservation.
					The decoder is built on OpenJPEG — the reference open source JPEG 2000
					codec — compiled to WebAssembly for in-browser execution. Supports
					both the JP2 box container format and raw J2K codestreams, with 8-bit
					and 16-bit samples in grayscale, RGB, and RGBA color modes. All
					processing happens on your device with no server round-trip.
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

			<LibraryAttribution packages={["@cornerstonejs/codec-openjpeg"]} />
		</ToolPageLayout>
	);
}
