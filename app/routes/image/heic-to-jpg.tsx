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
		question: "What is a HEIC file?",
		answer:
			"HEIC (High Efficiency Image Container) is the default photo format on iPhones and iPads since iOS 11. It offers better compression than JPG while maintaining image quality, but isn't universally supported by all apps and websites.",
	},
	{
		question: "Is my data safe?",
		answer:
			"Yes. Your files never leave your device. All conversion happens directly in your browser using WebAssembly — no server upload, no cloud processing, no data collection.",
	},
	{
		question: "What quality setting should I use?",
		answer:
			"92% (the default) is a good balance between file size and quality. Use 100% for lossless-quality JPG output. For web use or sharing, 80–85% gives significantly smaller files with minimal visible difference.",
	},
	{
		question: "Can I convert multiple files at once?",
		answer:
			"Yes. Drop or select multiple HEIC files and they'll all be converted in a batch. You can download each result individually or all at once.",
	},
	{
		question: "Does this work offline?",
		answer:
			"Yes. After the page loads once, the conversion engine is cached in your browser. You can convert HEIC files even without an internet connection.",
	},
	{
		question: "Why use NoUploads instead of other HEIC converters?",
		answer:
			"Most online HEIC converters upload your photos to their servers for processing. NoUploads is different — all conversion runs locally in your browser using WebAssembly. Your photos never leave your device. There's no signup, no file size limit, no daily usage cap, and it works offline after the first page load. It's also free and open source.",
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
					NoUploads HEIC to JPG converter transforms iPhone and iPad HEIC photos
					into universally compatible JPG format. Unlike other online
					converters, your files are processed entirely in your browser —
					nothing is uploaded to any server. Convert single files or batch
					convert hundreds of HEIC photos at once, with adjustable quality
					settings.
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
					href="https://github.com/alexcorvi/heic2any"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					heic2any
				</a>{" "}
				· MIT License
			</p>
		</ToolPageLayout>
	);
}
