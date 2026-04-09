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
import type { Route } from "./+types/xcf-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert XCF Online — Free, Instant | NoUploads",
		description:
			"Convert GIMP XCF project files to JPG, PNG, or WebP in your browser. Flattens layers with RLE decoding and indexed color support. No upload, no signup.",
		path: "/image/xcf-converter",
		keywords:
			"xcf to jpg, xcf to png, xcf converter, open xcf file, gimp to jpg, convert xcf online, xcf viewer, gimp file converter",
		jsonLdName: "XCF Converter",
		faq: [
			{
				question: "What does XCF stand for?",
				answer:
					'XCF is the native image format of GIMP (GNU Image Manipulation Program). The name stands for "eXperimental Computing Facility," a reference to the UC Berkeley lab where GIMP was created in 1996 by Spencer Kimball and Peter Mattis as a university project. GIMP has since become one of the longest-running open-source software projects, with over 25 years of continuous development.',
			},
			{
				question: "How does the converter handle GIMP layers?",
				answer:
					"The decoder reads every visible layer from the XCF file, respects each layer's opacity and x/y position, and composites them bottom-to-top using standard alpha blending. The result matches what you see when you flatten the image in GIMP. Hidden layers are skipped entirely.",
			},
			{
				question: "Does it support all GIMP blend modes?",
				answer:
					"Currently only Normal blend mode is fully supported. Layers set to other blend modes (Multiply, Screen, Overlay, etc.) are still composited, but treated as Normal. For most documents with straightforward layer stacks, the output will look correct. Complex blend-mode-heavy compositions may differ from the GIMP preview.",
			},
			{
				question: "What about indexed-color and grayscale XCF files?",
				answer:
					"Both are supported. Indexed-color images have their palette embedded in the file, and the decoder maps each pixel index to its RGB value. Grayscale images are expanded to full RGB. The output is always a standard RGBA image regardless of the original color mode.",
			},
		],
	});
}

const ACCEPT = { "image/x-xcf": [".xcf"] };

const faqItems = [
	{
		question: "What does XCF stand for?",
		answer: (
			<>
				XCF is the native image format of GIMP (GNU Image Manipulation Program).
				The name stands for "eXperimental Computing Facility," a reference to
				the UC Berkeley lab where GIMP was created in 1996 by Spencer Kimball
				and Peter Mattis as a university project. GIMP has since become one of
				the longest-running open-source software projects, with over 25 years of
				continuous development. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/XCF_(file_format)"
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
		question: "How does the converter handle GIMP layers?",
		answer:
			"The decoder reads every visible layer from the XCF file, respects each layer's opacity and x/y position, and composites them bottom-to-top using standard alpha blending. The result matches what you see when you flatten the image in GIMP. Hidden layers are skipped entirely.",
	},
	{
		question: "Does it support all GIMP blend modes?",
		answer:
			"Currently only Normal blend mode is fully supported. Layers set to other blend modes (Multiply, Screen, Overlay, etc.) are still composited, but treated as Normal. For most documents with straightforward layer stacks, the output will look correct. Complex blend-mode-heavy compositions may differ from the GIMP preview.",
	},
	{
		question: "What about indexed-color and grayscale XCF files?",
		answer:
			"Both are supported. Indexed-color images have their palette embedded in the file, and the decoder maps each pixel index to its RGB value. Grayscale images are expanded to full RGB. The output is always a standard RGBA image regardless of the original color mode.",
	},
];

export default function XcfConverterPage() {
	return (
		<ToolPageLayout
			title="Convert XCF"
			description="Convert GIMP XCF project files to JPG, PNG, WebP, or AVIF — free, private, no upload required."
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
					Opens GIMP XCF files and composites all visible layers into a single
					flattened image you can export as JPG, PNG, WebP, or AVIF. Useful when
					you need to share GIMP artwork with someone who does not have GIMP
					installed, or when you want a quick preview without launching the full
					editor. Supports RGB, grayscale, and indexed-color documents with RLE
					or zlib-compressed tiles. Everything runs locally in your browser —
					the file never touches a server.
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

			<LibraryAttribution browserApi="canvas" />
		</ToolPageLayout>
	);
}
