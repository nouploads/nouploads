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
import type { Route } from "./+types/heic-to-jpg";

const HeicToJpgTool = lazy(
	() => import("~/features/image-tools/components/heic-to-jpg-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert HEIC to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert iPhone HEIC photos to JPG online for free. No upload, no signup — files never leave your device.",
		path: "/image/heic-to-jpg",
		keywords:
			"heic to jpg, convert heic, heic converter, iphone photo converter, heic to jpeg online, free heic converter, private file converter, batch heic convert",
		jsonLdName: "HEIC to JPG Converter",
	});
}

const faqItems = [
	{
		question: "Where does the HEIF image standard come from?",
		answer: (
			<>
				HEIF (High Efficiency Image File Format) was developed by the Moving
				Picture Experts Group (MPEG) and finalized as ISO/IEC 23008-12 in 2015.
				It is built on the same container architecture as the MP4 video format
				(ISOBMFF), which is why a single HEIF file can store image sequences,
				depth maps, and even audio alongside the photo data — far more than a
				simple JPG wrapper. Apple's decision to adopt it as the default iPhone
				camera format in 2017 thrust an obscure ISO standard into the pockets of
				billions of people almost overnight.{" "}
				<a
					href="https://en.wikipedia.org/wiki/High_Efficiency_Image_File_Format"
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
		question: "What output quality should I use for HEIC to JPG?",
		answer:
			"92% (the default) is a good balance between file size and quality. Use 100% for maximum-quality JPG output — note that JPG is always lossy, so for truly lossless output, convert to PNG instead. For web use or sharing, 80–85% gives significantly smaller files with minimal visible difference.",
	},
	{
		question: "Do HEIC files lose metadata during conversion?",
		answer:
			"The pixel data is fully preserved at your chosen quality level, but EXIF metadata like camera model, GPS coordinates, and shooting parameters is not carried over to the JPG output. If you need to retain metadata, export from Apple Photos directly instead.",
	},
];

export default function HeicToJpgPage() {
	return (
		<ToolPageLayout
			title="HEIC to JPG"
			description="Convert HEIC images to JPG online — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<HeicToJpgTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					HEIC is the default photo format on every iPhone and iPad since iOS
					11. It uses HEVC compression to cut file sizes roughly in half
					compared to JPG while retaining the same visible quality. This tool
					decodes HEIC with a WebAssembly build of libheif, then re-encodes each
					image as a standard JPG you can open anywhere. Drag an entire album in
					at once and adjust the quality slider per batch — useful when you need
					to email vacation photos from a phone that only shoots HEIC.
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

			<LibraryAttribution packages={["heic2any"]} />
		</ToolPageLayout>
	);
}
