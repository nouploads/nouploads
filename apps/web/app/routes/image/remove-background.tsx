import { lazy, Suspense } from "react";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Spinner } from "~/components/ui/spinner";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/remove-background";

const RemoveBackgroundTool = lazy(
	() => import("~/features/image-tools/components/remove-background-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Remove Image Background Online — Free, Private, AI-Powered | NoUploads",
		description:
			"Remove backgrounds from photos using AI. Runs locally in your browser — no upload, no server, free and unlimited.",
		path: "/image/remove-background",
		keywords:
			"remove background, background remover, remove bg, background eraser, ai background removal, free background remover, private background removal",
		jsonLdName: "Background Remover",
		faq: [
			{
				question: "How did AI learn to separate foregrounds from backgrounds?",
				answer:
					"Automatic background removal uses a deep learning technique called semantic segmentation, where a neural network classifies every single pixel in the image as either foreground or background. Accurately separating complex foreground shapes (like hair or fur) from arbitrary backgrounds was considered an extremely difficult computer vision problem until deep learning breakthroughs around 2015 — now similar models run directly in web browsers via WebAssembly.",
			},
			{
				question: "How long does processing take?",
				answer:
					"The first time you use the tool, it downloads an AI model (~80MB) which is cached in your browser for future use. After that, processing takes a few seconds for a typical photo depending on your device's CPU. Larger images may take longer.",
			},
			{
				question: "Why does it need to download a model?",
				answer:
					"The background removal AI model is about 80MB. It's downloaded once and cached in your browser's storage, so subsequent uses load instantly. This is the tradeoff for keeping everything private — the model runs locally instead of on a remote server.",
			},
			{
				question: "What image formats are supported?",
				answer:
					"You can upload JPG, PNG, and WebP images. The output is always a PNG file to preserve the transparent background. For best results, use a clear photo with a distinct subject.",
			},
		],
	});
}

const faqItems = [
	{
		question: "How did AI learn to separate foregrounds from backgrounds?",
		answer: (
			<>
				Automatic background removal uses a deep learning technique called
				semantic segmentation, where a neural network classifies every single
				pixel in the image as either foreground or background. Accurately
				separating complex foreground shapes (like hair or fur) from arbitrary
				backgrounds was considered an extremely difficult computer vision
				problem until deep learning breakthroughs around 2015 — now similar
				models run directly in web browsers via WebAssembly. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Image_segmentation"
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
		question: "How long does processing take?",
		answer:
			"The first time you use the tool, it downloads an AI model (~80MB) which is cached in your browser for future use. After that, processing takes a few seconds for a typical photo depending on your device's CPU. Larger images may take longer.",
	},
	{
		question: "Why does it need to download a model?",
		answer:
			"The background removal AI model is about 80MB. It's downloaded once and cached in your browser's storage, so subsequent uses load instantly. This is the tradeoff for keeping everything private — the model runs locally instead of on a remote server.",
	},
	{
		question: "What image formats are supported?",
		answer:
			"You can upload JPG, PNG, and WebP images. The output is always a PNG file to preserve the transparent background. For best results, use a clear photo with a distinct subject.",
	},
];

export default function RemoveBackgroundPage() {
	return (
		<ToolPageLayout
			title="Remove Background"
			description="Remove image backgrounds with AI — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<RemoveBackgroundTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					NoUploads Background Remover uses a local ONNX neural network model
					that runs entirely in your browser via WebAssembly. It handles
					portraits, product shots, pets, and complex scenes without contacting
					any server — your photos stay on your device throughout the process.
					The output is a transparent PNG ready for use in design work,
					presentations, or e-commerce listings.
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

			<p className="text-xs text-muted-foreground mt-8">
				Powered by{" "}
				<a
					href="https://github.com/imgly/background-removal-js"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					@imgly/background-removal
				</a>{" "}
				· SEE License
			</p>
		</ToolPageLayout>
	);
}
