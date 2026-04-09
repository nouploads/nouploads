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
import type { Route } from "./+types/heic-to-webp";

const HeicToWebpTool = lazy(
	() => import("~/features/image-tools/components/heic-to-webp-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "HEIC to WebP — Free, Instant, No Upload | NoUploads",
		description:
			"Convert HEIC photos to WebP for smaller files than JPG at similar quality in your browser. All modern browsers support WebP since 2020. No upload, no signup.",
		path: "/image/heic-to-webp",
		keywords:
			"heic to webp, convert heic to webp, heic converter webp, iphone photo to webp, heif to webp, free heic converter",
		jsonLdName: "HEIC to WebP Converter",
		faq: [
			{
				question: "How do HEIC and WebP compare as modern image formats?",
				answer:
					"Both formats emerged from video codec technology — HEIC uses HEVC (H.265) while WebP uses VP8/VP9 from Google. At similar quality levels, HEIC typically produces slightly smaller files than WebP, but WebP has the decisive advantage of near-universal browser support. HEIC remains largely an Apple ecosystem format, while WebP works in Chrome, Firefox, Safari, and Edge.",
			},
			{
				question: "What WebP quality setting should I use?",
				answer:
					"82% (the default) balances file size and quality for most photos. WebP is more efficient than JPG at the same quality level, so 82% WebP looks as good as roughly 90% JPG. Use 95-100% for archival quality, or 60-70% for thumbnails and web previews where small file size matters most.",
			},
			{
				question: "Will the WebP file be smaller than the original HEIC?",
				answer:
					"Usually not — HEIC is already one of the most efficient image formats available. Converting to WebP at a moderate quality level may produce a similar or slightly larger file. The benefit is compatibility: WebP opens everywhere, while HEIC requires Apple hardware or special decoders.",
			},
		],
	});
}

const faqItems = [
	{
		question: "How do HEIC and WebP compare as modern image formats?",
		answer: (
			<>
				Both formats emerged from video codec technology — HEIC uses HEVC
				(H.265) while WebP uses VP8/VP9 from Google. At similar quality levels,
				HEIC typically produces slightly smaller files than WebP, but WebP has
				the decisive advantage of near-universal browser support. HEIC remains
				largely an Apple ecosystem format, while WebP works in Chrome, Firefox,
				Safari, and Edge. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/WebP"
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
		question: "What WebP quality setting should I use?",
		answer:
			"82% (the default) balances file size and quality for most photos. WebP is more efficient than JPG at the same quality level, so 82% WebP looks as good as roughly 90% JPG. Use 95-100% for archival quality, or 60-70% for thumbnails and web previews where small file size matters most.",
	},
	{
		question: "Will the WebP file be smaller than the original HEIC?",
		answer: (
			<>
				Usually not — HEIC is already one of the most efficient image formats
				available. Converting to WebP at a moderate quality level may produce a
				similar or slightly larger file. The benefit is compatibility: WebP
				opens everywhere, while HEIC requires Apple hardware or special
				decoders. If file size is your main concern, use our{" "}
				<a
					href="/image/heic-to-jpg"
					className="underline hover:text-foreground transition-colors"
				>
					HEIC to JPG converter
				</a>{" "}
				instead.
			</>
		),
	},
];

export default function HeicToWebpPage() {
	return (
		<ToolPageLayout
			title="HEIC to WebP"
			description="Convert HEIC images to WebP online — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<HeicToWebpTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					Converts Apple's HEIC photos to Google's WebP format — swapping one
					modern codec for another that every browser actually supports. HEIC
					uses HEVC compression that delivers excellent quality-to-size ratios,
					but most non-Apple software can't open the files. WebP offers similar
					compression efficiency with the advantage of universal browser and
					editor support. The quality slider lets you fine-tune the output size
					vs. fidelity tradeoff. Batch mode processes an entire photo library at
					once.
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
