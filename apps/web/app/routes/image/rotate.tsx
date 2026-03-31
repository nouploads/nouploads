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
		question: "Why are 90-degree rotations lossless but other angles aren't?",
		answer: (
			<>
				Rotating a pixel grid by an arbitrary angle requires mapping each output
				pixel to a position that falls between input pixels, then interpolating
				the color value. Rotations by exactly 90°, 180°, or 270° are special
				cases — they simply rearrange existing pixel values without any
				interpolation, which is why they are perfectly lossless. Any other angle
				necessarily involves approximation that introduces slight softening.{" "}
				<a
					href="https://en.wikipedia.org/wiki/Image_rotation"
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
		question: "What is the difference between rotating and flipping?",
		answer:
			"Rotation turns the image around its center by a fixed angle (90, 180, or 270 degrees). Flipping mirrors the image along an axis — horizontal flip swaps left and right, vertical flip swaps top and bottom.",
	},
	{
		question: "Can I apply multiple transforms in a row?",
		answer:
			"Yes. Each button applies its transform to the current result, so you can chain operations freely — for example, rotate right then flip horizontally. Click Reset at any time to return to the original image.",
	},
	{
		question: "Does rotating change my image quality?",
		answer:
			"The tool preserves your original format and uses high quality settings (95% for lossy formats). For PNG files the output is lossless. Repeated transforms on lossy formats may introduce minimal re-encoding artifacts, but for typical use the difference is imperceptible.",
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
