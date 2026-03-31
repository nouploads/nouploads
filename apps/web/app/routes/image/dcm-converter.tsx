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
import type { Route } from "./+types/dcm-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert DICOM Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert DICOM medical images (.dcm) to JPG, PNG, or WebP in your browser. No data leaves your device.",
		path: "/image/dcm-converter",
		keywords:
			"dicom to jpg, dicom converter, dcm to png, dicom viewer online, medical image converter, dicom to image",
		jsonLdName: "DICOM Converter",
		faq: [
			{
				question: "What's the history behind the DICOM standard?",
				answer:
					"DICOM (Digital Imaging and Communications in Medicine) has been the universal standard for medical imaging since 1993. It is used by virtually every MRI scanner, CT scanner, X-ray machine, and ultrasound device in modern hospitals worldwide. Beyond the image data, DICOM files embed extensive patient and study metadata, enabling hospitals to build searchable archives of millions of medical images.",
			},
			{
				question: "What is window/level and how does it affect the output?",
				answer:
					"Medical images often store pixel values in Hounsfield units (CT) or arbitrary signal intensities (MRI) that span a much wider range than the 256 shades a monitor can display. Window/level (also called window center and window width) defines which slice of that range maps to visible brightness. This tool reads window/level values embedded in the DICOM header. If those tags are missing, it automatically calculates contrast from the pixel data's minimum and maximum values so the image is always visible.",
			},
			{
				question: "Which imaging modalities are supported?",
				answer:
					"This converter handles any standard DICOM file that contains 2D grayscale pixel data — including CT, MRI, X-ray (CR/DX), mammography, nuclear medicine, and ultrasound images stored as single-frame DICOM. It reads both 8-bit and 16-bit data, applies rescale slope/intercept transforms, and handles MONOCHROME1 (inverted) and MONOCHROME2 photometric interpretations. Compressed transfer syntaxes (JPEG, JPEG 2000, JPEG-LS, RLE) are supported via the daikon library's built-in decompressors.",
			},
			{
				question: "Does converting a DICOM file strip the medical metadata?",
				answer:
					"Yes. The exported JPG, PNG, or WebP contains only the pixel data — all DICOM metadata (patient name, study date, modality, slice position, etc.) is discarded during conversion. This is useful when sharing an image outside clinical systems, but means the output cannot be reimported into a PACS as a valid DICOM object.",
			},
		],
	});
}

const ACCEPT = { "application/dicom": [".dcm"] };

const faqItems = [
	{
		question: "What's the history behind the DICOM standard?",
		answer: (
			<>
				DICOM (Digital Imaging and Communications in Medicine) has been the
				universal standard for medical imaging since 1993. It is used by
				virtually every MRI scanner, CT scanner, X-ray machine, and ultrasound
				device in modern hospitals worldwide. Beyond the image data, DICOM files
				embed extensive patient and study metadata, enabling hospitals to build
				searchable archives of millions of medical images.{" "}
				<a
					href="https://en.wikipedia.org/wiki/DICOM"
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
		question: "What is window/level and how does it affect the output?",
		answer:
			"Medical images often store pixel values in Hounsfield units (CT) or arbitrary signal intensities (MRI) that span a much wider range than the 256 shades a monitor can display. Window/level (also called window center and window width) defines which slice of that range maps to visible brightness. This tool reads window/level values embedded in the DICOM header. If those tags are missing, it automatically calculates contrast from the pixel data's minimum and maximum values so the image is always visible.",
	},
	{
		question: "Which imaging modalities are supported?",
		answer:
			"This converter handles any standard DICOM file that contains 2D grayscale pixel data — including CT, MRI, X-ray (CR/DX), mammography, nuclear medicine, and ultrasound images stored as single-frame DICOM. It reads both 8-bit and 16-bit data, applies rescale slope/intercept transforms, and handles MONOCHROME1 (inverted) and MONOCHROME2 photometric interpretations. Compressed transfer syntaxes (JPEG, JPEG 2000, JPEG-LS, RLE) are supported via the daikon library's built-in decompressors.",
	},
	{
		question: "Does converting a DICOM file strip the medical metadata?",
		answer:
			"Yes. The exported JPG, PNG, or WebP contains only the pixel data — all DICOM metadata (patient name, study date, modality, slice position, etc.) is discarded during conversion. This is useful when sharing an image outside clinical systems, but means the output cannot be reimported into a PACS as a valid DICOM object.",
	},
];

export default function DcmConverterPage() {
	return (
		<ToolPageLayout
			title="Convert DICOM"
			description="Convert DICOM medical images to JPG, PNG, WebP, or AVIF — free, private, no upload required."
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
					Opens DICOM files from CT, MRI, X-ray, and other medical imaging
					modalities, then converts them to standard image formats for sharing
					with patients, embedding in reports, or quick visual inspection
					outside a PACS workstation. The decoder reads pixel data and applies
					window/level contrast from the DICOM header so the exported image
					looks correct without manual adjustment. This tool processes files
					entirely in your browser — no medical data is ever uploaded to any
					server, making it safe for handling protected health information.
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

			<LibraryAttribution packages={["daikon"]} />
		</ToolPageLayout>
	);
}
