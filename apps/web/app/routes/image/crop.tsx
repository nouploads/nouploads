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
import type { Route } from "./+types/crop";

const ImageCropTool = lazy(
	() => import("~/features/image-tools/components/image-crop-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Crop Images Online — Free, Private, No Upload | NoUploads",
		description:
			"Crop images to any size or aspect ratio for free. Drag to select, choose 1:1, 4:3, or 16:9 presets. Files never leave your device.",
		path: "/image/crop",
		keywords:
			"crop image, image cropper online, crop photo, crop image to square, crop image 16:9, free image cropper, private image cropper, crop image online free",
		jsonLdName: "Image Cropper",
	});
}

const faqItems = [
	{
		question: "How do I select the crop area?",
		answer:
			"After dropping an image, a crop rectangle appears on top of it. Drag the center to move the selection, or drag the corner and edge handles to resize it. The dark overlay shows which parts will be removed.",
	},
	{
		question: "Can I crop to a specific aspect ratio?",
		answer:
			"Yes. Choose from preset aspect ratios including 1:1 (square), 4:3, 16:9, and 3:2. The crop rectangle locks to your chosen ratio while you resize it. Select Free to crop to any shape.",
	},
	{
		question: "What output formats are available?",
		answer:
			"Cropped images can be saved as JPG, PNG, or WebP. For JPG and WebP you can adjust the quality slider to control the compression level. PNG output is lossless.",
	},
	{
		question: "Does cropping reduce image quality?",
		answer:
			"Cropping itself does not reduce quality — it simply extracts the selected pixel region from your original. If you save as JPG or WebP, the lossy encoding may introduce minimal artifacts, but at the default 92% quality they are imperceptible. Choose PNG for a lossless crop.",
	},
	{
		question: "Why use NoUploads instead of other image croppers?",
		answer:
			"Online croppers typically upload your image to a server, introducing privacy risks and network delays. NoUploads crops entirely in your browser using the Canvas API — your file stays on your device from start to finish. There is no account required, no daily limit, no watermark, and the tool works even without an internet connection. It is free and open source.",
	},
];

export default function CropPage() {
	return (
		<ToolPageLayout
			title="Image Crop"
			description="Crop images with a visual editor and preset aspect ratios — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageCropTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The NoUploads Image Cropper gives you a visual drag-and-drop crop
					rectangle with handles on every corner and edge. Lock the selection to
					popular aspect ratios like 1:1 for profile pictures, 16:9 for
					widescreen, or 4:3 for print. Choose your output format and quality,
					then download the cropped file instantly. Processing runs in a Web
					Worker inside your browser — no server ever sees your image.
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
