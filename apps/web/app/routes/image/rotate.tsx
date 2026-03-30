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
import type { Route } from "./+types/rotate";

const ImageRotateTool = lazy(
	() => import("~/features/image-tools/components/image-rotate-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Rotate & Flip Images Online — Free, Private, No Upload | NoUploads",
		description:
			"Rotate images 90, 180, or 270 degrees and flip horizontally or vertically. Free, private, runs in your browser.",
		path: "/image/rotate",
		keywords:
			"rotate image online, flip image, rotate photo 90 degrees, mirror image, rotate image free, flip photo horizontal, rotate image no upload, private image rotation",
		jsonLdName: "Image Rotate & Flip",
	});
}

const faqItems = [
	{
		question: "How do I rotate an image 90 degrees?",
		answer:
			"Drop your image onto the tool, then click Rotate Right for a 90-degree clockwise turn or Rotate Left for 90 degrees counter-clockwise. The preview updates instantly so you can see the result before downloading.",
	},
	{
		question: "Can I apply multiple transforms in a row?",
		answer:
			"Yes. Each button applies its transform to the current result, so you can chain operations freely — for example, rotate right then flip horizontally. Click Reset at any time to return to the original image.",
	},
	{
		question: "What is the difference between rotating and flipping?",
		answer:
			"Rotation turns the image around its center by a fixed angle (90, 180, or 270 degrees). Flipping mirrors the image along an axis — horizontal flip swaps left and right, vertical flip swaps top and bottom.",
	},
	{
		question: "Does rotating change my image quality?",
		answer:
			"The tool preserves your original format and uses high quality settings (95% for lossy formats). For PNG files the output is lossless. Repeated transforms on lossy formats may introduce minimal re-encoding artifacts, but for typical use the difference is imperceptible.",
	},
	{
		question: "Why use NoUploads instead of other image rotation tools?",
		answer:
			"Most online rotators require uploading your image to a remote server, creating privacy and speed concerns. NoUploads processes everything inside your browser using the Canvas API and Web Workers — your files never leave your device. There is no signup, no daily limit, no watermark. It works offline and it is open source.",
	},
];

export default function RotatePage() {
	return (
		<ToolPageLayout
			title="Image Rotate & Flip"
			description="Rotate images by 90, 180, or 270 degrees and flip horizontally or vertically — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageRotateTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The NoUploads Image Rotate and Flip tool lets you quickly orient
					photos and graphics without installing software. Rotate clockwise,
					counter-clockwise, or 180 degrees, then mirror horizontally or
					vertically with a single click. Transforms are chainable — apply
					several in sequence, then download the final result. All processing
					happens in a Web Worker on your device, keeping the main thread
					responsive and your files completely private.
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
