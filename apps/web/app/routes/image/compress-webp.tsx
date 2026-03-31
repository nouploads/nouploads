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
import type { Route } from "./+types/compress-webp";

const CompressWebpTool = lazy(
	() => import("~/features/image-tools/components/compress-webp-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Compress WebP Online — Free, Private, No Upload | NoUploads",
		description:
			"Compress WebP images online for free. Adjust quality, reduce file size. No upload, no signup — files never leave your device.",
		path: "/image/compress-webp",
		keywords:
			"compress webp, reduce webp size, webp compressor online, free webp compressor, private webp compressor, webp optimization",
		jsonLdName: "WebP Image Compressor",
		faq: [
			{
				question: "What's the connection between WebP and video codecs?",
				answer:
					"WebP's lossy mode is built directly on the VP8 video codec that Google acquired when it purchased On2 Technologies in 2010. A single WebP image is essentially one keyframe extracted from a VP8 video stream. This heritage gives WebP access to sophisticated techniques developed for video — block prediction, adaptive quantization, and loop filtering — that were never available to the JPEG standard designed two decades earlier.",
			},
			{
				question: "Why compress WebP?",
				answer:
					"WebP already produces smaller files than JPG at the same quality, but you can squeeze even more savings by lowering the quality setting. This is useful for web performance where every kilobyte counts.",
			},
			{
				question: "What WebP quality level should I target?",
				answer:
					"80% (the default) is a good starting point. WebP handles low quality settings better than JPG — even 50–60% can look acceptable for web use. Use the before/after slider to find your sweet spot.",
			},
		],
	});
}

const faqItems = [
	{
		question: "What's the connection between WebP and video codecs?",
		answer: (
			<>
				WebP's lossy mode is built directly on the VP8 video codec that Google
				acquired when it purchased On2 Technologies in 2010. A single WebP image
				is essentially one keyframe extracted from a VP8 video stream. This
				heritage gives WebP access to sophisticated techniques developed for
				video — block prediction, adaptive quantization, and loop filtering —
				that were never available to the JPEG standard designed two decades
				earlier. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/VP8"
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
		question: "Why compress WebP?",
		answer:
			"WebP already produces smaller files than JPG at the same quality, but you can squeeze even more savings by lowering the quality setting. This is useful for web performance where every kilobyte counts.",
	},
	{
		question: "What WebP quality level should I target?",
		answer:
			"80% (the default) is a good starting point. WebP handles low quality settings better than JPG — even 50–60% can look acceptable for web use. Use the before/after slider to find your sweet spot.",
	},
];

export default function CompressWebpPage() {
	return (
		<ToolPageLayout
			title="Compress WebP"
			description="Compress WebP images online — reduce file size with adjustable quality, free and private."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<CompressWebpTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					NoUploads WebP Compressor lets you further optimize WebP images with a
					quality slider and instant before-and-after preview. Ideal for web
					developers and designers looking to shave bytes off already-efficient
					WebP assets. Batch compress multiple files at once — all processing
					happens in your browser with no server involved.
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
